import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Heart, PackageCheck, Sparkles } from "lucide-react";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getWorkspaceId } from "@/lib/app-auth";
import styles from "./crafts.module.css";
import ContactForm from "./contact-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "R & T Crafts n Sweets",
  description: "Handmade crafts from R & T Crafts n Sweets in Mobile, Alabama.",
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default async function CraftsPage() {
  let products: (typeof s.craftProducts.$inferSelect)[] = [];
  try {
    const db = getDb();
    const workspaceId = getWorkspaceId();
    products = await db.select().from(s.craftProducts).where(and(eq(s.craftProducts.userId, workspaceId), eq(s.craftProducts.active, true))).orderBy(asc(s.craftProducts.name));
  } catch (error) {
    console.error("Craft storefront unavailable", error instanceof Error ? error.message : String(error));
  }

  return <main className={styles.site}>
    <header className={styles.header}>
      <a className={styles.brand} href="#top"><img src="/rt-crafts-logo.jpg" alt="R & T Crafts n Sweets"/><span><strong>R & T</strong><small>CRAFTS N SWEETS</small></span></a>
      <nav><a href="#shop">Shop crafts</a><a href="#about">About</a><a href="#contact">Get in touch</a><a className={styles.bakeryLink} href="/"><ArrowLeft size={15}/> Feather & Flour</a></nav>
    </header>

    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}><p className={styles.kicker}><Sparkles size={15}/> Made by hand with a little extra heart</p><h1>Colorful crafts.<br/><em>One-of-a-kind finds.</em></h1><p>Browse handmade pieces from R & T Crafts n Sweets. Every item is created with care in Mobile, Alabama, and availability is updated as pieces find their homes.</p><div className={styles.heroActions}><a className={styles.primary} href="#shop">See what’s available <ArrowRight size={18}/></a></div><div className={styles.proof}><span><Heart/>Handmade</span><span><Sparkles/>Unique designs</span><span><PackageCheck/>Availability updated regularly</span></div></div>
      <div className={styles.logoStage}><span className={styles.stitchRing}/><img src="/rt-crafts-logo.jpg" alt="R & T Crafts n Sweets logo"/><i className={styles.threadOne}/><i className={styles.threadTwo}/></div>
    </section>

    <section className={styles.shop} id="shop"><div className={styles.sectionIntro}><p className={styles.kicker}>The handmade collection</p><h2>Find something made just for you.</h2><p>Prices and current availability are shown below. Product availability is updated as handmade pieces find their homes.</p></div>
      {products.length?<div className={styles.grid}>{products.map((product,index)=><article className={styles.card} key={product.id}><div className={styles.imageWrap}>{product.photoKey?<img src={`/api/file?key=${encodeURIComponent(product.photoKey)}`} alt={product.name}/>:<div className={styles.placeholder}><img src="/rt-crafts-logo.jpg" alt=""/></div>}<span className={product.stockQty>0?styles.available:styles.sold}>{product.stockQty>0?`${product.stockQty} available`:"Sold out"}</span><small>{String(index+1).padStart(2,"0")}</small></div><div className={styles.cardBody}><span className={styles.category}>{product.category}</span><div className={styles.titleRow}><h3>{product.name}</h3><strong>{money(product.priceCents)}</strong></div><p>{product.description}</p>{(product.materials||product.dimensions)&&<dl>{product.materials&&<div><dt>Materials</dt><dd>{product.materials}</dd></div>}{product.dimensions&&<div><dt>Size</dt><dd>{product.dimensions}</dd></div>}</dl>}{product.stockQty>0?<span className={styles.availableMessage}>Available now</span>:<span className={styles.soldMessage}>This piece has found a home</span>}</div></article>)}</div>:<div className={styles.empty}><img src="/rt-crafts-logo.jpg" alt=""/><p className={styles.kicker}>New pieces coming soon</p><h2>The craft table is being stocked.</h2><p>Check back soon for the first R & T handmade collection.</p></div>}
    </section>

    <section className={styles.about} id="about"><div><p className={styles.kicker}>A little handmade happiness</p><h2>Crafted with color, care, and personality.</h2></div><p>R & T Crafts n Sweets brings together creative handmade pieces and the joyful spirit behind Feather & Flour. The collections remain separate, so shopping crafts is simple and the bakery stays focused on fresh cookies.</p><a href="/">Visit Feather & Flour Bakery <ArrowRight size={17}/></a></section>

    <section className={styles.contact} id="contact"><div className={styles.contactIntro}><p className={styles.kicker}>Get in touch</p><h2>Have a question about a piece?</h2><p>Send a message through this private form. Your contact details are not displayed publicly.</p></div><ContactForm productNames={products.filter((product) => product.stockQty > 0).map((product) => product.name)}/></section>

    <footer className={styles.footer}><div className={styles.brand}><img src="/rt-crafts-logo.jpg" alt=""/><span><strong>R & T</strong><small>CRAFTS N SWEETS</small></span></div><p>Handmade in Mobile, Alabama</p><div><a href="/admin">Staff sign in</a></div></footer>
  </main>;
}
