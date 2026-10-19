"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import styles from "./crafts.module.css";

type ContactFormProps = { productNames: string[] };

export default function ContactForm({ productNames }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/crafts/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Your message could not be sent. Please try again.");
      form.reset();
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Your message could not be sent. Please try again.");
    }
  }

  if (status === "sent") {
    return <div className={styles.contactSuccess} role="status"><CheckCircle2/><h3>Message sent!</h3><p>Thank you for reaching out. R & T Crafts n Sweets will get back to you as soon as possible.</p><button type="button" onClick={() => setStatus("idle")}>Send another message</button></div>;
  }

  return <form className={styles.contactForm} onSubmit={submit}>
    <div className={styles.formGrid}>
      <label>Full name *<input name="name" autoComplete="name" maxLength={120} required /></label>
      <label>Email address *<input name="email" type="email" autoComplete="email" maxLength={160} required /></label>
    </div>
    <div className={styles.formGrid}>
      <label>Phone number <input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Optional" /></label>
      <label>Item you’re asking about<select name="item" defaultValue=""><option value="">General question</option>{productNames.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
    </div>
    <label>Your message *<textarea name="message" rows={5} maxLength={2000} required placeholder="How can we help?" /></label>
    <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {status === "error" && <p className={styles.formError} role="alert">{message}</p>}
    <button className={styles.primary} type="submit" disabled={status === "sending"}><Send size={17}/>{status === "sending" ? "Sending…" : "Send message"}</button>
    <p className={styles.privacyNote}>Your information is used only to reply to your message.</p>
  </form>;
}
