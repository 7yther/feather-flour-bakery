import { env } from "cloudflare:workers";
import { friendlySmsProviderError, orderSmsBody, toE164, type OrderSmsKind, type SmsOrder } from "@/lib/sms";

type TwilioEnv = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
};

export type SmsSendResult = {
  status: "sent" | "failed";
  messageSid: string | null;
  error: string;
};

export function smsIsConfigured() {
  const values = env as unknown as TwilioEnv;
  return Boolean(values.TWILIO_ACCOUNT_SID && values.TWILIO_AUTH_TOKEN && toE164(values.TWILIO_FROM_NUMBER));
}

export async function sendOrderSms(order: SmsOrder, kind: OrderSmsKind): Promise<SmsSendResult> {
  const values = env as unknown as TwilioEnv;
  const accountSid = String(values.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(values.TWILIO_AUTH_TOKEN || "").trim();
  const from = toE164(values.TWILIO_FROM_NUMBER);
  const to = toE164(order.customerPhone);
  if (!accountSid || !authToken || !from) return { status: "failed", messageSid: null, error: "SMS service is not configured." };
  if (!to) return { status: "failed", messageSid: null, error: "Customer phone number is not valid for SMS." };

  const form = new URLSearchParams({ To: to, From: from, Body: orderSmsBody(kind, order) });
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: form.toString(),
    });
    const payload = await response.json().catch(() => ({})) as { sid?: string; message?: string; code?: number };
    if (!response.ok || !payload.sid) {
      const detail = payload.message || `Twilio returned ${response.status}.`;
      return { status: "failed", messageSid: null, error: friendlySmsProviderError(payload.code, detail) };
    }
    return { status: "sent", messageSid: payload.sid, error: "" };
  } catch {
    return { status: "failed", messageSid: null, error: "The SMS provider could not be reached." };
  }
}
