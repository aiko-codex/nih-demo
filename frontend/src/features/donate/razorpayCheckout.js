let razorpayScriptPromise;

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayScriptPromise) razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

export async function openRazorpayCheckout(order, details, onSuccess) {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Payment checkout could not load. Please try again.");
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amountMinor,
      currency: order.currency,
      order_id: order.orderId,
      name: "National India Hub",
      description: "Light this window",
      prefill: order.prefill || { name: details.name, email: details.email },
      handler: async (response) => {
        try { await onSuccess(response); resolve(response); } catch (error) { reject(error); }
      },
      modal: { ondismiss: () => resolve(null) },
    });
    checkout.open();
  });
}
