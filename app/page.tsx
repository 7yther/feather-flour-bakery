import { and, asc, eq } from "drizzle-orm";
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
    const [settings, products] = await Promise.all([
      db.select().from(s.settings).where(eq(s.settings.userId, workspaceId)).limit(1),
      db.select({ id: s.products.id, name: s.products.name, description: s.products.description, priceCents: s.products.priceCents })
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
      accent: ["rose", "sage", "gold"][index % 3],
    }));
  } catch (error) {
    console.error("Storefront catalog unavailable", error);
  }
  return <Storefront bakery={bakery} offerings={offerings} />;
}
