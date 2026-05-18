import { useEffect, useState } from "react";
import { getPropertyBookingRequests, acceptBookingRequest, rejectBookingRequest } from "../api/bookingApi";
import { formatRs } from "../utils/currency";

const BookingRequestsList = ({ propertyId, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [propertyId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPropertyBookingRequests(propertyId);
      setRequests(data.bookingRequests || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.error || "Failed to fetch booking requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      await acceptBookingRequest(bookingId);
      // Remove accepted request from list
      setRequests(requests.filter(r => r._id !== bookingId));
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error accepting request:", err);
      setError(err.response?.data?.error || "Failed to accept booking request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      await rejectBookingRequest(bookingId);
      // Remove rejected request from list
      setRequests(requests.filter(r => r._id !== bookingId));
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError(err.response?.data?.error || "Failed to reject booking request");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Booking Requests</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-600 mt-3">Loading booking requests...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-slate-600 text-lg font-medium">No booking requests yet</p>
              <p className="text-slate-500 text-sm mt-1">Buyers will appear here once they request to book</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRequest?._id === request._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  {/* Buyer Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {request.buyer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{request.buyer.name}</h3>
                      <p className="text-sm text-slate-600">{request.buyer.email}</p>
                      {request.buyer.phone && (
                        <p className="text-sm text-slate-600">{request.buyer.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm bg-slate-50 p-3 rounded-lg">
                    <div>
                      <p className="text-slate-600">Check-in</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(request.checkInDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Check-out</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(request.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Guests</p>
                      <p className="font-semibold text-slate-900">{request.numberOfGuests}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Rooms</p>
                      <p className="font-semibold text-slate-900">{request.numberOfRooms}</p>
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-sm text-slate-600">Total Price</p>
                      <p className="text-lg font-bold text-blue-600">{formatRs(request.price)}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      {request.paymentStatus === "paid" ? "✓ Payment Received" : "Awaiting Payment"}
                    </span>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-1">Buyer's Notes</p>
                      <p className="text-slate-900 bg-slate-50 p-2 rounded text-sm">{request.notes}</p>
                    </div>
                  )}

                  {/* Buyer Stats */}
                  {(request.buyer.reviews || request.buyer.bookingCount) && (
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs bg-blue-50 p-3 rounded-lg">
                      <div>
                        <p className="text-slate-600">Reviews</p>
                        <p className="font-semibold text-slate-900">{request.buyer.reviews || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Past Bookings</p>
                        <p className="font-semibold text-slate-900">{request.buyer.bookingCount || 0}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedRequest?._id === request._id && (
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleReject(request._id)}
                        disabled={actionLoading === request._id}
                        className="flex-1 py-2 px-4 border border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {actionLoading === request._id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAccept(request._id)}
                        disabled={actionLoading === request._id}
                        className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {actionLoading === request._id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingRequestsList;
