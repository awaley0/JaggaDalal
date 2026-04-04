import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axios";

const PaymentVerify = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(null);
  const [booking, setBooking] = useState(null);

  const openChatWithSeller = () => {
    if (!booking?.seller?._id) {
      navigate("/chat");
      return;
    }

    const params = new URLSearchParams({
      recipientId: booking.seller._id,
      bookingId: booking._id,
      propertyId: booking.property?._id || "",
      recipientName: booking.seller?.name || "Seller",
    });

    navigate(`/chat?${params.toString()}`);
  };

  useEffect(() => {
    const verify = async () => {
      // eSewa sends a base64-encoded `data` query parameter on redirect
      const params = new URLSearchParams(window.location.search);
      const isMock = params.get("mock") === "1";
      const mockBookingId = params.get("bookingId");
      const encodedData = params.get("data");

      if (isMock) {
        setStatus("success");
        setMessage("Payment confirmed in development fallback mode.");

        if (mockBookingId) {
          try {
            const bookingRes = await axiosInstance.get(`/bookings/${mockBookingId}`);
            if (bookingRes.data?.success && bookingRes.data?.data) {
              setBooking(bookingRes.data.data);
              setAmount(bookingRes.data.data?.price || bookingRes.data.data?.property?.price || null);
            }
          } catch (err) {
            console.error("Failed to fetch mock booking details:", err);
          }
        }

        return;
      }

      if (!encodedData) {
        setStatus("failed");
        setMessage("No payment data received. The payment may have been cancelled.");
        return;
      }

      try {
        const res = await axiosInstance.get(`/bookings/payment/verify?data=${encodedData}`);
        if (res.data.success) {
          setStatus("success");
          setAmount(res.data.amount);
          setMessage(res.data.message || "Payment confirmed successfully!");
          if (res.data.booking) {
            setBooking(res.data.booking);
          }
        } else {
          setStatus("failed");
          setMessage(res.data.error || "Payment verification failed.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("failed");
        setMessage(err.response?.data?.error || "Payment could not be verified. Please contact support.");
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500">Please wait while we confirm your payment with eSewa...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful! 🎉</h2>
            {amount && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-3xl font-bold text-green-700">Rs. {Number(amount).toLocaleString()}</p>
              </div>
            )}
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-6">
              Your booking is now <strong className="text-green-700">confirmed</strong>. The seller has been notified.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                Back to Home
              </Link>
              <button
                type="button"
                onClick={openChatWithSeller}
                className="w-full py-3 border-2 border-green-600 text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-all"
              >
                💬 Chat with Seller
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentVerify;
