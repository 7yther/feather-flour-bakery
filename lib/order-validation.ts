export const MINIMUM_ORDER_NOTICE_HOURS = 48;

export function earliestOrderTime(from = new Date()) {
  return new Date(from.getTime() + MINIMUM_ORDER_NOTICE_HOURS * 60 * 60 * 1000);
}

export function hasMinimumOrderNotice(requestedAt: Date, from = new Date()) {
  return Number.isFinite(requestedAt.getTime()) && requestedAt.getTime() >= earliestOrderTime(from).getTime();
}

export function cleanPhone(value: unknown) {
  const phone = String(value ?? "").trim().slice(0, 40);
  return phone.replace(/\D/g, "").length >= 10 ? phone : "";
}

