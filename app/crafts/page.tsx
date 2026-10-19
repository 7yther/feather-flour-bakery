import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Heart, Mail, PackageCheck, Phone, Sparkles } from "lucide-react";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getWorkspaceId } from "@/lib/app-auth";
import styles from "./crafts.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "R & T Crafts n Sweets",
  description: "Handmade crafts from R & T Crafts n Sweets in Mobile, Alabama.",
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default async function CraftsPage() {
  let products: (typeof s.craftProducts.$inferSelect)[] = [];
  let contactEmail = "farisravyn97@gmail.com";
  let phone = "";
  try {
    const db = getDb();
    const workspaceId = getWorkspaceId();
    const [items, settings] = await Promise.all([
      db.select().from(s.craftProducts).where(and(eq(s.craftProducts.userId, workspaceId), eq(s.craftProducts.active, true))).orderBy(asc(s.craftProducts.name)),
      db.select({ contactEmail: s.settings.contactEmail, phone: s.settings.phone }).from(s.settings).where(eq(s.settings.userId, workspaceId)).limit(1),
    ]);
    products = items;
    contactEmail = settings[0]?.contactEmail || contactEmail;
    phone = settings[0]?.phone || "";
  } catch (error) {
    console.error("Craft storefront unavailable", error instanceof Error ? error.message : String(error));
  }

  return <main className={styles.site}>
    <header className={styles.header}>
      <a className={styles.brand} href="#top"><img src="/rt-crafts-logo.jpg" alt="R & T Crafts n Sweets"/><span><strong>R & T</strong><small>CRAFTS N SWEETS</small></span></a>
      <nav><a href="#shop">Shop crafts</a><a href="#about">About</a><a className={styles.bakeryLink} href="/"><ArrowLeft size={15}/> Feather & Flour</a></nav>
    </header>

    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}><p className={styles.kicker}><Sparkles size={15}/> Made by hand with a little extra heart</p><h1>Colorful crafts.<br/><em>One-of-a-kind finds.</em></h1><p>Browse handmade pieces from R & T Crafts n Sweets. Every item is created with care in Mobile, Alabama, and availability is updated as pieces find their homes.</p><div className={styles.heroActions}><a className={styles.primary} href="#shop">See what’s available <ArrowRight size={18}/></a>{phone&&<a className={styles.phone} href={`tel:${phone}`}><Phone size={17}/>{phone}</a>}</div><div className={styles.proof}><span><Heart/>Handmade</span><span><Sparkles/>Unique designs</span><span><PackageCheck/>Local pickup details confirmed personally</span></div></div>
      <div className={styles.logoStage}><span className={styles.stitchRing}/><img src="/rt-crafts-logo.jpg" alt="R & T Crafts n Sweets logo"/><i className={styles.threadOne}/><i className={styles.threadTwo}/></div>
    </section>

    <section className={styles.shop} id="shop"><div className={styles.sectionIntro}><p className={styles.kicker}>The handmade collection</p><h2>Find something made just for you.</h2><p>Prices and current availability are shown below. Select “Ask about this item” and we’ll help with pickup, delivery, or any questions.</p></div>
      {products.length?<div className={styles.grid}>{products.map((product,index)=><article className={styles.card} key={product.id}><div className={styles.imageWrap}>{product.photoKey?<img src={`/api/file?key=${encodeURIComponent(product.photoKey)}`} alt={product.name}/>:<div className={styles.placeholder}><img src="/rt-crafts-logo.jpg" alt=""/></div>}<span className={product.stockQty>0?styles.available:styles.sold}>{product.stockQty>0?`${product.stockQty} available`:"Sold out"}</span><small>{String(index+1).padStart(2,"0")}</small></div><div className={styles.cardBody}><span className={styles.category}>{product.category}</span><div className={styles.titleRow}><h3>{product.name}</h3><strong>{money(product.priceCents)}</strong></div><p>{product.description}</p>{(product.materials||product.dimensions)&&<dl>{product.materials&&<div><dt>Materials</dt><dd>{product.materials}</dd></div>}{product.dimensions&&<div><dt>Size</dt><dd>{product.dimensions}</dd></div>}</dl>}{product.stockQty>0?<a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`R & T Crafts inquiry — ${product.name}`)}`}><Mail size={16}/>Ask about this item</a>:<span className={styles.soldMessage}>This piece has found a home</span>}</div></article>)}</div>:<div className={styles.empty}><img src="/rt-crafts-logo.jpg" alt=""/><p className={styles.kicker}>New pieces coming soon</p><h2>The craft table is being stocked.</h2><p>Check back soon for the first R & T handmade collection.</p><a className={styles.primary} href={`mailto:${contactEmail}?subject=${encodeURIComponent("R & T Crafts n Sweets")}`}><Mail size={17}/>Get in touch</a></div>}
    </section>

    <section className={styles.about} id="about"><div><p className={styles.kicker}>A little handmade happiness</p><h2>Crafted with color, care, and personality.</h2></div><p>R & T Crafts n Sweets brings together creative handmade pieces and the joyful spirit behind Feather & Flour. The collections remain separate, so shopping crafts is simple and the bakery stays focused on fresh cookies.</p><a href="/">Visit Feather & Flour Bakery <ArrowRight size={17}/></a></section>

    <footer className={styles.footer}><div className={styles.brand}><img src="/rt-crafts-logo.jpg" alt=""/><span><strong>R & T</strong><small>CRAFTS N SWEETS</small></span></div><p>Handmade in Mobile, Alabama</p><div><a href={`mailto:${contactEmail}`}>{contactEmail}</a><a href="/admin">Staff sign in</a></div></footer>
  </main>;
}
