export type OrderSmsKind = "received" | "approved" | "ready" | "completed" | "cancelled";

export type SmsOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  requestedAt: string;
};

export function toE164(value: unknown) {
  const original = String(value ?? "").trim();
  const digits = original.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (original.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return "";
}

function requestedDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "your requested date";
  return parsed.toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function smsKindForOrderStatus(status: string): OrderSmsKind | null {
  if (status === "new") return "received";
  if (status === "confirmed") return "approved";
  if (status === "ready") return "ready";
  if (status === "fulfilled") return "completed";
  if (status === "cancelled") return "cancelled";
  return null;
}

export function orderSmsBody(kind: OrderSmsKind, order: SmsOrder) {
  const date = requestedDate(order.requestedAt);
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const prefix = `Feather & Flour: Hi ${firstName},`;
  if (kind === "received") {
    return `${prefix} we received cookie order ${order.orderNumber} for ${date}. We'll review it and text you when approved. Reply STOP to unsubscribe.`;
  }
  if (kind === "approved") {
    return `${prefix} cookie order ${order.orderNumber} is approved for ${date}. We'll text you again when it is ready.`;
  }
  if (kind === "ready") {
    return `${prefix} cookie order ${order.orderNumber} is ready! Please follow the pickup or delivery details arranged with the bakery.`;
  }
  if (kind === "completed") {
    return `${prefix} cookie order ${order.orderNumber} is complete. Thank you for supporting Feather & Flour Bakery!`;
  }
  return `${prefix} cookie order ${order.orderNumber} has been cancelled. Please contact Feather & Flour Bakery with any questions.`;
}
