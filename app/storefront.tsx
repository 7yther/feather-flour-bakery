"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock3, Feather, Minus, PackageCheck, Phone, Plus, ShieldCheck, Sparkles } from "lucide-react";
import type { StorefrontOffering } from "@/lib/storefront";
import styles from "./storefront.module.css";

type Props = {
  bakery: { name: string; serviceArea: string; phone: string };
  offerings: StorefrontOffering[];
};

const localDateTime = (date: Date) => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function Storefront({ bakery, offerings }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [earliest] = useState(() => localDateTime(new Date(Date.now() + 48 * 60 * 60 * 1000)));
  const totalCookies = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  const estimate = offerings.reduce((sum, item) => sum + (item.priceCents ?? 0) * (quantities[item.id] ?? 0), 0);
  const hasPricedItems = offerings.some((item) => item.priceCents != null);

  const setQuantity = (id: string, value: number) => setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(500, Math.floor(value || 0))) }));
  const choose = (id: string) => {
    setQuantity(id, quantities[id] || 12);
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!totalCookies) { setError("Choose at least one cookie flavor and quantity."); return; }
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const requestedValue = String(form.get("requestedAt") || "");
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.requestedAt = requestedValue ? new Date(requestedValue).toISOString() : "";
    payload.items = offerings.map((item) => ({ offeringId: item.id, quantity: quantities[item.id] || 0 })).filter((item) => item.quantity > 0);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; orderId?: string; orderNumber?: string; emailEndpoint?: string | null; emailPayload?: Record<string, string> };
      if (!response.ok) throw new Error(result.error || "We could not send your order request.");
      if (result.orderId && result.emailEndpoint && result.emailPayload) {
        let emailStatus: "sent" | "pending" | "failed" = "failed";
        try {
          const emailResponse = await fetch(result.emailEndpoint, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(result.emailPayload) });
          const emailResult = await emailResponse.json().catch(() => ({})) as { success?: string | boolean; message?: string };
          const activated = emailResponse.ok && String(emailResult.success).toLowerCase() === "true";
          const awaitingActivation = emailResponse.ok && /activation/i.test(String(emailResult.message || ""));
          emailStatus = activated ? "sent" : awaitingActivation ? "pending" : "failed";
        } catch { emailStatus = "failed"; }
        await fetch("/api/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: result.orderId, customerPhone: payload.customerPhone, emailStatus }) }).catch(() => undefined);
      }
      setOrderNumber(result.orderNumber || "received");
      setTimeout(() => document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not send your order request.");
    } finally { setBusy(false); }
  };

  return <main className={styles.site}>
    <header className={styles.header}>
      <a className={styles.brand} href="#top" aria-label={`${bakery.name} home`}>
        <span className={styles.brandMark}><Feather size={24} /></span>
        <span><strong>Feather <i>&</i> Flour</strong><small>HANDCRAFTED COOKIE STUDIO</small></span>
      </a>
      <nav aria-label="Storefront navigation"><a href="#cookies">Cookies</a><a href="#how-it-works">How it works</a><a href="#order" className={styles.navOrder}>Start an order <ArrowRight size={15} /></a></nav>
    </header>

    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}>
        <p className={styles.kicker}><Sparkles size={15} /> Fresh cookies, baked for your order</p>
        <h1>Seven flavors.<br/><em>One seriously good cookie box.</em></h1>
        <p className={styles.heroText}>Choose your favorite flavors and tell us how many you need. Every order is baked fresh by Feather & Flour in Mobile, Alabama.</p>
        <div className={styles.heroActions}><a href="#order" className={styles.primary}>Build your cookie order <ArrowRight size={18} /></a><span><Clock3 size={18} /> 48-hour minimum notice</span></div>
        <div className={styles.heroProof}><span><Check /> Baked to order</span><span><Check /> Seven cookie flavors</span><span><Check /> Personal service</span></div>
      </div>
      <div className={styles.cookieScene} aria-label="Decorated cookie assortment">
        <div className={`${styles.cookieArt} ${styles.cookieOne}`}><span>yum</span></div>
        <div className={`${styles.cookieArt} ${styles.cookieTwo}`}><i/><i/><i/><i/><i/></div>
        <div className={`${styles.cookieArt} ${styles.cookieThree}`}><Feather size={45}/></div>
        <div className={styles.flourDust}/>
        <p><strong>Small-batch.</strong><br/>Big-celebration energy.</p>
      </div>
      <a href="#cookies" className={styles.scrollCue}>Explore the menu <ChevronDown size={18}/></a>
    </section>

    <section className={styles.intro} id="cookies">
      <p className={styles.sectionKicker}>Pick your flavors</p>
      <div className={styles.sectionHeading}><h2>There’s a cookie for every craving.</h2><p>Mix and match the flavors you want, enter the quantity for each one, and send your order request. We’ll contact you to confirm availability, price, and payment.</p></div>
      <div className={styles.offerGrid}>{offerings.map((item, index) => <article className={styles.offerCard} key={item.id}>
        <div className={`${styles.offerVisual} ${styles[item.accent || "rose"]}`}><span className={styles.miniCookie}>{index % 3 === 0 ? "✦" : index % 3 === 1 ? "F&F" : "♡"}</span><small>0{index + 1}</small></div>
        <div className={styles.offerContent}><h3>{item.name}</h3><p>{item.description}</p><div><span>{item.priceCents != null ? `${money(item.priceCents)} each` : "Price confirmed after review"}</span><button type="button" onClick={() => choose(item.id)}>Choose this flavor <ArrowRight size={15}/></button></div></div>
      </article>)}</div>
    </section>

    <section className={styles.process} id="how-it-works">
      <div><p className={styles.sectionKicker}>From flavor to cookie box</p><h2>Simple, personal, and baked with care.</h2></div>
      <ol><li><span>01</span><div><Sparkles/><h3>Build your box</h3><p>Choose one flavor or mix several, then enter the quantity you want of each.</p></div></li><li><span>02</span><div><Phone/><h3>We confirm everything</h3><p>We’ll contact you to confirm availability, final price, delivery, and payment.</p></div></li><li><span>03</span><div><PackageCheck/><h3>Your cookies are baked</h3><p>Every order is made fresh and prepared for your requested delivery date.</p></div></li></ol>
    </section>

    <section className={styles.orderSection} id="order">
      <div className={styles.orderAside}>
        <p className={styles.sectionKicker}>Cookie order request</p><h2>Build your cookie box.</h2><p>Orders require at least 48 hours’ notice. Sending this form starts your request; your order is confirmed after we contact you with availability and final pricing.</p>
        <div className={styles.noticeCard}><Clock3/><div><strong>Plan ahead</strong><span>The earliest available date is shown in the form. Larger or highly detailed orders may need extra time.</span></div></div>
        <div className={styles.secureNote}><ShieldCheck/><span>Your details are used only to prepare and contact you about this order.</span></div>
      </div>
      <div className={styles.formCard}>
        {orderNumber ? <div className={styles.success}><span><Check size={34}/></span><p className={styles.sectionKicker}>Request received</p><h2>Thank you!</h2><p>Your order request <strong>{orderNumber}</strong> has been saved. Feather & Flour will contact you to confirm the details, price, and payment.</p><button className={styles.primary} onClick={() => { setOrderNumber(""); setQuantities({}); }}>Start another order</button></div> :
        <form onSubmit={submit}>
          <fieldset><legend><span>1</span>Your cookie selection</legend><div className={styles.selectionList}>{offerings.map((item) => <div key={item.id}><div><strong>{item.name}</strong><small>{item.priceCents != null ? `${money(item.priceCents)} each` : "Final quote after review"}</small></div><div className={styles.quantity}><button type="button" aria-label={`Remove ${item.name}`} onClick={() => setQuantity(item.id, (quantities[item.id] || 0) - 6)}><Minus/></button><input aria-label={`${item.name} quantity`} type="number" min="0" max="500" value={quantities[item.id] || 0} onChange={(event) => setQuantity(item.id, Number(event.target.value))}/><button type="button" aria-label={`Add ${item.name}`} onClick={() => setQuantity(item.id, (quantities[item.id] || 0) + 6)}><Plus/></button></div></div>)}</div><div className={styles.selectionTotal}><span>{totalCookies} cookie{totalCookies === 1 ? "" : "s"} selected</span>{hasPricedItems && estimate > 0 ? <strong>Estimated {money(estimate)}</strong> : <strong>Pricing confirmed after review</strong>}</div></fieldset>

          <fieldset><legend><span>2</span>Delivery & contact</legend><div className={styles.gridTwo}><label>Full name *<input name="customerName" autoComplete="name" required /></label><label>Phone number *<input name="customerPhone" type="tel" autoComplete="tel" required placeholder="(251) 555-0123" /></label></div><label>Email <input name="customerEmail" type="email" autoComplete="email" placeholder="Optional — for written confirmation" /></label><label>Delivery address *<input name="address1" autoComplete="address-line1" required placeholder="Street address" /></label><label>Apartment, suite, or unit<input name="address2" autoComplete="address-line2" /></label><div className={styles.addressGrid}><label>City *<input name="city" autoComplete="address-level2" required /></label><label>State *<input name="state" autoComplete="address-level1" required defaultValue="AL" /></label><label>ZIP code *<input name="postalCode" autoComplete="postal-code" required /></label></div><label>Requested delivery date & time *<input name="requestedAt" type="datetime-local" min={earliest} defaultValue={earliest} required /></label><label>Allergy concerns<textarea name="allergyNotes" rows={2} placeholder="Tell us about any allergy concerns. We will confirm what we can safely accommodate." /></label><label>Order notes<textarea name="notes" rows={3} placeholder="Delivery instructions, special requests, or questions." /></label><label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label></fieldset>
          {error && <p className={styles.formError}>{error}</p>}
          <button className={styles.submit} disabled={busy || !totalCookies}>{busy ? "Sending your request…" : "Send my cookie request"}<ArrowRight size={19}/></button>
          <p className={styles.submitNote}>This is an order request, not a final booking or payment.</p>
        </form>}
      </div>
    </section>

    <footer className={styles.footer}><div className={styles.brand}><span className={styles.brandMark}><Feather size={22}/></span><span><strong>Feather <i>&</i> Flour</strong><small>HANDCRAFTED COOKIE STUDIO</small></span></div><p>{bakery.serviceArea} · Fresh cookies baked to order</p><a href="/admin">Staff sign in</a></footer>
  </main>;
}
