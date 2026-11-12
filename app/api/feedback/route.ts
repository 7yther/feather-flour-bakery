import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getWorkspaceId } from "@/lib/app-auth";

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const customerName = clean(body.customerName, 80);
  const customerEmail = clean(body.customerEmail, 160).toLowerCase();
  const message = clean(body.message, 1200);
  const rating = Math.floor(Number(body.rating));
  if (!customerName || !message || rating < 1 || rating > 5) {
    return Response.json({ error: "Please enter your name, choose a rating, and share your feedback." }, { status: 400 });
  }
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return Response.json({ error: "Please enter a valid email address or leave it blank." }, { status: 400 });
  }

  const stamp = new Date().toISOString();
  await getDb().insert(s.customerFeedback).values({
    id: crypto.randomUUID(),
    userId: getWorkspaceId(),
    customerName,
    customerEmail,
    rating,
    message,
    approved: false,
    createdAt: stamp,
    updatedAt: stamp,
  });
  return Response.json({ ok: true });
}
