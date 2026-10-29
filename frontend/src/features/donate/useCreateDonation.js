import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { apiPost } from "@/lib/api";
import { openRazorpayCheckout } from "@/features/donate/razorpayCheckout";

export function useCreateDonation() {
  const navigate = useNavigate();
  return useMutation({ mutationFn: async (values) => {
    const result = await apiPost("/donations", values);
    if (result.gateway === "stripe") {
      window.location.assign(result.checkoutUrl);
      return result;
    }
    if (result.gateway === "razorpay") await openRazorpayCheckout(result, values, async (response) => {
      await apiPost("/donations/razorpay/verify", {
        publicToken: result.publicToken,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      navigate(`/donate/return?t=${encodeURIComponent(result.publicToken)}`);
    });
    return result;
  } });
}
