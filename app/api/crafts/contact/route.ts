import { env } from "cloudflare:workers";

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 40);
  const item = clean(body.item, 160);
  const message = clean(body.message, 2000);
  if (!name || !email || !message) return Response.json({ error: "Please enter your name, email address, and message." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });

  const notificationEmail = clean((env as unknown as Record<string, unknown>).ORDER_NOTIFICATION_EMAIL, 160);
  if (!notificationEmail) return Response.json({ error: "The contact form is temporarily unavailable. Please try again later." }, { status: 503 });

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(notificationEmail)}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        _subject: `New R & T Crafts message from ${name}`,
        _template: "table",
        _replyto: email,
        "Customer name": name,
        "Customer email": email,
        "Customer phone": phone || "Not provided",
        "Item": item || "General question",
        "Message": message,
        "Submitted from": "R & T Crafts n Sweets contact form",
      }),
    });
    const result = await response.json().catch(() => ({})) as { success?: string | boolean; message?: string };
    const sent = response.ok && String(result.success).toLowerCase() === "true";
    if (!sent) throw new Error(result.message || "Email service rejected the message.");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Craft contact email failed", error instanceof Error ? error.message : String(error));
    return Response.json({ error: "Your message could not be sent right now. Please try again in a few minutes." }, { status: 502 });
  }
}
