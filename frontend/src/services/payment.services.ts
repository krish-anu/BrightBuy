import axiosInstance from "@/axiosConfig";

export type PaymentSuccessResponse = {
  success: boolean;
  data?: {
    paymentStatus: string; // e.g., 'paid', 'unpaid'
    order?: any; // optional order payload from backend
  };
  message?: string;
};

export const verifyPaymentSuccess = async (sessionId: string): Promise<PaymentSuccessResponse> => {
  const response = await axiosInstance.get<PaymentSuccessResponse>("/api/payment/success", {
    params: { session_id: sessionId },
  });
  return response.data;
};
