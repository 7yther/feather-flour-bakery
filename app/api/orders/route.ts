import { env } from "cloudflare:workers";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getWorkspaceId } from "@/lib/app-auth";
import { cleanPhone, hasMinimumOrderNotice, MINIMUM_ORDER_NOTICE_HOURS } from "@/lib/order-validation";
import { DEFAULT_COOKIE_OFFERINGS } from "@/lib/storefront";

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);
const DEFAULTS = new Map(DEFAULT_COOKIE_OFFERINGS.map((item) => [item.id, item]));

type IncomingItem = { offeringId?: unknown; quantity?: unknown };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const customerName = clean(body.customerName, 120);
  const customerEmail = clean(body.customerEmail, 160).toLowerCase();
  const customerPhone = cleanPhone(body.customerPhone);
  const address1 = clean(body.address1, 180);
  const address2 = clean(body.address2, 180);
  const city = clean(body.city, 100);
  const state = clean(body.state, 40);
  const postalCode = clean(body.postalCode, 20);
  const requestedAt = new Date(clean(body.requestedAt, 80));
  if (!customerName || !customerPhone || !address1 || !city || !state || !postalCode) {
    return Response.json({ error: "Please complete your name, phone number, and delivery address." }, { status: 400 });
  }
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return Response.json({ error: "Please enter a valid email address or leave it blank." }, { status: 400 });
  }
  if (!hasMinimumOrderNotice(requestedAt)) {
    return Response.json({ error: `Cookie orders require at least ${MINIMUM_ORDER_NOTICE_HOURS} hours of notice.` }, { status: 400 });
  }

  const incoming = Array.isArray(body.items) ? body.items as IncomingItem[] : [];
  const normalized = incoming.map((item) => ({
    offeringId: clean(item.offeringId, 100),
    quantity: Math.max(0, Math.min(500, Math.floor(Number(item.quantity) || 0))),
  })).filter((item) => item.offeringId && item.quantity > 0);
  if (!normalized.length) return Response.json({ error: "Choose at least one cookie flavor and quantity." }, { status: 400 });
  if (normalized.reduce((sum, item) => sum + item.quantity, 0) > 500) {
    return Response.json({ error: "For orders over 500 cookies, please contact the bakery directly." }, { status: 400 });
  }

  const db = getDb();
  const workspaceId = getWorkspaceId();
  const productIds = normalized.map((item) => item.offeringId).filter((value) => !DEFAULTS.has(value));
  const products = productIds.length ? await db.select({ id: s.products.id, name: s.products.name, priceCents: s.products.priceCents })
    .from(s.products).where(and(eq(s.products.userId, workspaceId), eq(s.products.active, true), inArray(s.products.id, productIds))) : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const hasUnavailableItem = normalized.some((item) => !DEFAULTS.has(item.offeringId) && !productMap.has(item.offeringId));
  if (hasUnavailableItem) return Response.json({ error: "One of the selected cookie options is no longer available. Please refresh and try again." }, { status: 400 });
  const items = normalized.map((item) => {
    const fallback = DEFAULTS.get(item.offeringId);
    const product = productMap.get(item.offeringId);
    return { ...item, offeringName: product?.name ?? fallback!.name, unitPriceCents: product?.priceCents ?? null };
  });

  const stamp = new Date().toISOString();
  const orderId = crypto.randomUUID();
  const orderNumber = `FF-${stamp.slice(0, 10).replaceAll("-", "")}-${orderId.slice(0, 6).toUpperCase()}`;
  const order = {
    id: orderId, userId: workspaceId, orderNumber, status: "new" as const,
    customerName, customerEmail, customerPhone, address1, address2, city, state, postalCode,
    requestedAt: requestedAt.toISOString(), occasion: clean(body.occasion, 120), theme: clean(body.theme, 600),
    colors: clean(body.colors, 240), personalization: clean(body.personalization, 600), allergyNotes: clean(body.allergyNotes, 600),
    notes: clean(body.notes, 1200), emailStatus: "pending" as const, createdAt: stamp, updatedAt: stamp,
  };
  await db.insert(s.customOrders).values(order);
  for (const item of items) {
    await db.insert(s.customOrderItems).values({
      id: crypto.randomUUID(), orderId, offeringId: item.offeringId, offeringName: item.offeringName,
      quantity: item.quantity, unitPriceCents: item.unitPriceCents,
    });
  }

  const notificationEmail = clean((env as unknown as Record<string, unknown>).ORDER_NOTIFICATION_EMAIL, 160);
  let emailStatus: "sent" | "failed" = "failed";
  if (notificationEmail) {
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${notificationEmail}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: "https://featherandflourbakery.com",
          referer: "https://featherandflourbakery.com/",
        },
        body: JSON.stringify({
          _subject: `New Feather & Flour online order ${orderNumber}`,
          _template: "table",
          "Order number": orderNumber,
          "Customer name": customerName,
          "Customer email": customerEmail || "Not provided",
          "Phone": customerPhone,
          "Delivery address": [address1, address2, `${city}, ${state} ${postalCode}`].filter(Boolean).join(", "),
          "Requested date and time": requestedAt.toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "full", timeStyle: "short" }),
          "Cookie selections": items.map((item) => `${item.quantity} × ${item.offeringName}`).join("; "),
          "Allergy notes": order.allergyNotes || "None provided",
          "Order notes": order.notes || "None provided",
        }),
      });
      if (response.ok) emailStatus = "sent";
    } catch (error) {
      console.error("Order notification email failed", error);
    }
  }
  await db.update(s.customOrders).set({ emailStatus, updatedAt: new Date().toISOString() }).where(eq(s.customOrders.id, orderId));
  return Response.json({ ok: true, orderNumber, emailStatus });
}
