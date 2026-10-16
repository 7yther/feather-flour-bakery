import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getWorkspaceId } from "@/lib/app-auth";
import { DEFAULT_COOKIE_OFFERINGS, type StorefrontOffering } from "@/lib/storefront";
import Storefront from "./storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  let bakery = { name: "Feather & Flour Bakery", serviceArea: "Mobile, Alabama", phone: "" };
  let offerings: StorefrontOffering[] = [...DEFAULT_COOKIE_OFFERINGS];
  try {
    const db = getDb();
    const workspaceId = getWorkspaceId();
    const stamp = new Date().toISOString();
    const defaultSkus = DEFAULT_COOKIE_OFFERINGS.map((cookie) => cookie.sku);
    const existingDefaults = await db.select({ sku: s.products.sku }).from(s.products).where(and(
      eq(s.products.userId, workspaceId), inArray(s.products.sku, defaultSkus),
    ));
    const existingSkus = new Set(existingDefaults.map((product) => product.sku));
    const missingDefaults = DEFAULT_COOKIE_OFFERINGS.filter((cookie) => !existingSkus.has(cookie.sku));
    for (const cookie of missingDefaults) await db.insert(s.products).values({
        id: crypto.randomUUID(), userId: workspaceId, categoryId: null, name: cookie.name,
        description: cookie.description, sku: cookie.sku, priceCents: 0, costCents: 0,
        packagingCostCents: 0, stockQty: 0, lowStockThreshold: 6, photoKey: null,
        taxable: true, active: true, createdAt: stamp, updatedAt: stamp,
      }).onConflictDoNothing();
    const [settings, products] = await Promise.all([
      db.select().from(s.settings).where(eq(s.settings.userId, workspaceId)).limit(1),
      db.select({ id: s.products.id, name: s.products.name, description: s.products.description, priceCents: s.products.priceCents, photoKey: s.products.photoKey })
        .from(s.products).where(and(eq(s.products.userId, workspaceId), eq(s.products.active, true))).orderBy(asc(s.products.name)),
    ]);
    if (settings[0]) bakery = {
      name: settings[0].bakeryName || bakery.name,
      serviceArea: settings[0].address || bakery.serviceArea,
      phone: settings[0].phone || "",
    };
    if (products.length) offerings = products.map((product, index) => ({
      ...product,
      description: product.description || "Made fresh for your celebration and customized to fit your theme.",
      photoUrl: product.photoKey ? `/api/file?key=${encodeURIComponent(product.photoKey)}` : null,
      accent: ["rose", "sage", "gold"][index % 3],
    }));
  } catch (error) {
    console.error("Storefront catalog unavailable", error instanceof Error ? error.message : String(error));
  }
  return <Storefront bakery={bakery} offerings={offerings} />;
}
