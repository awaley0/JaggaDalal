import { useState, useEffect } from "react";
import { getAllBookingsForAdmin, updateBookingStatus, deleteBookingByAdmin } from "../api/adminApi";
import { formatRs } from "../utils/currency";

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [page, search, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const filters = { page, limit: 10 };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;

      const response = await getAllBookingsForAdmin(filters);
      setBookings(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setSuccessMessage("Booking status updated successfully!");
      fetchBookings();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating booking status:", err);
      setError("Failed to update booking status");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;

    try {
      setLoading(true);
      await deleteBookingByAdmin(bookingId);
      setSuccessMessage("Booking deleted successfully!");
      fetchBookings();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting booking:", err);
      setError("Failed to delete booking");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBookingAmount = (booking) => {
    const amount = booking?.price ?? booking?.property?.price ?? 0;
    return Number.isFinite(Number(amount)) ? Number(amount) : 0;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Bookings</h1>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && page === 1 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No bookings found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Booking ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Property</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Buyer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Check-in</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Check-out</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{booking._id?.slice(-8) || booking.id?.slice(-8)}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {booking.property?.title || "N/A"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">{booking.buyer?.name || "N/A"}</td>
                  <td className="px-6 py-4 text-sm">
                    {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{formatRs(getBookingAmount(booking))}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                      className={`px-3 py-1 border rounded text-sm focus:outline-none capitalize ${getStatusColor(booking.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-100 border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Booking Status */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-mono text-lg font-semibold">{selectedBooking._id}</p>
                </div>
                <div>
                  <span className={`px-4 py-2 rounded-full font-semibold capitalize ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              <hr />

              {/* Buyer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Buyer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedBooking.buyer?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedBooking.buyer?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedBooking.buyer?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              <hr />

              {/* Property Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="font-semibold">{selectedBooking.property?.title || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{selectedBooking.property?.location || "N/A"}</p>
                  </div>
                </div>
              </div>

              <hr />

              {/* Booking Dates (for rentals) */}
              {selectedBooking.checkInDate && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Stay Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in Date</p>
                      <p className="font-semibold">
                        {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out Date</p>
                      <p className="font-semibold">
                        {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedBooking.numberOfGuests && (
                      <div>
                        <p className="text-sm text-gray-600">Number of Guests</p>
                        <p className="font-semibold">{selectedBooking.numberOfGuests}</p>
                      </div>
                    )}
                    {selectedBooking.numberOfRooms && (
                      <div>
                        <p className="text-sm text-gray-600">Number of Rooms</p>
                        <p className="font-semibold">{selectedBooking.numberOfRooms}</p>
                      </div>
                    )}
                  </div>
                  <hr className="my-4" />
                </div>
              )}

              {/* Price Information */}
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-green-600">{formatRs(getBookingAmount(selectedBooking))}</p>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <>
                  <hr />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                  </div>
                </>
              )}

              {/* Booking Date */}
              <hr />
              <div>
                <p className="text-sm text-gray-600">Booking Date</p>
                <p className="font-semibold">
                  {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteBooking(selectedBooking._id);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
                >
                  Delete Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
