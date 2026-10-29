export function currencySymbol(currency) {
  const code = String(currency || "USD").toUpperCase();
  return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).formatToParts(0).find((part) => part.type === "currency")?.value || code;
}

export function formatMoney(minor, currency = "USD") {
  const code = String(currency || "USD").toUpperCase();
  const locale = code === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format((minor || 0) / 100);
}
