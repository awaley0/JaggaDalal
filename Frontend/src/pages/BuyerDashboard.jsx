import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import BuyerRoute from "../components/BuyerRoute";
import { getMyBookings, deleteBooking, updateBooking } from "../api/bookingApi";
import { formatRs } from "../utils/currency";
import { getAllProperties } from "../api/propertyApi";

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [marketProperties, setMarketProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editForm, setEditForm] = useState({
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: "",
    numberOfRooms: "",
    notes: "",
  });

  // Fetch buyer's data
  useEffect(() => {
    fetchBuyerData();
  }, []);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch bookings
      const [bookingsResponse, propertiesResponse] = await Promise.all([
        getMyBookings(),
        getAllProperties({ limit: 100 }),
      ]);

      setBookings(bookingsResponse?.bookings || []);
      setMarketProperties(propertiesResponse?.data || []);

      // Fetch favorites
      const favoritesResponse = await axios.get("/favourites", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFavorites(Array.isArray(favoritesResponse.data) ? favoritesResponse.data : (favoritesResponse.data.data || []));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch data");
      console.error("Error fetching buyer data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await deleteBooking(bookingId);
        setBookings(bookings.filter((b) => b._id !== bookingId));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to cancel booking");
      }
    }
  };

  const handleEditStart = (booking) => {
    setEditingBookingId(booking._id);
    setEditForm({
      checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toISOString().split("T")[0] : "",
      checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().split("T")[0] : "",
      numberOfGuests: booking.numberOfGuests || "",
      numberOfRooms: booking.numberOfRooms || "",
      notes: booking.notes || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (bookingId) => {
    try {
      const payload = {
        checkInDate: editForm.checkInDate || undefined,
        checkOutDate: editForm.checkOutDate || undefined,
        numberOfGuests: editForm.numberOfGuests ? Number(editForm.numberOfGuests) : undefined,
        numberOfRooms: editForm.numberOfRooms ? Number(editForm.numberOfRooms) : undefined,
        notes: editForm.notes,
      };

      const response = await updateBooking(bookingId, payload);
      const updatedBooking = response?.data;

      if (updatedBooking?._id) {
        setBookings((prev) =>
          prev.map((booking) => (booking._id === bookingId ? updatedBooking : booking))
        );
      }

      setEditingBookingId(null);
      setEditForm({
        checkInDate: "",
        checkOutDate: "",
        numberOfGuests: "",
        numberOfRooms: "",
        notes: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update booking");
    }
  };

  const handleEditCancel = () => {
    setEditingBookingId(null);
    setEditForm({
      checkInDate: "",
      checkOutDate: "",
      numberOfGuests: "",
      numberOfRooms: "",
      notes: "",
    });
  };

  const handleRemoveFavorite = async (propertyId) => {
    try {
      await axios.delete(`/favorites/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFavorites(favorites.filter((f) => f._id !== propertyId));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove favorite");
    }
  };

  return (
    <BuyerRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
            <p className="text-gray-600">Manage your bookings and favorites</p>
          </div>

          {/* Overview */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("bookings")}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-blue-700">My Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
              <p className="text-xs text-gray-600 mt-2">Click to open bookings</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("favorites")}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-rose-700">Favorites</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{favorites.length}</p>
              <p className="text-xs text-gray-600 mt-2">Click to open saved properties</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("market")}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-emerald-700">All Listings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{marketProperties.length}</p>
              <p className="text-xs text-gray-600 mt-2">Click to browse marketplace</p>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-600 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "bookings"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              📅 My Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "favorites"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              ❤️ Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab("market")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "market"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              🏘️ All Listings ({marketProperties.length})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 mt-4">Loading data...</p>
            </div>
          ) : activeTab === "bookings" ? (
            <div>
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600 mb-4">No bookings yet.</p>
                  <button
                    onClick={() => navigate("/rent")}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Properties
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {booking.property?.title || "Property"}
                          </h3>
                          <p className="text-gray-600 text-sm">{booking.property?.location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {booking.status?.toUpperCase() || "PENDING"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-gray-600 text-sm">Check-in</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Check-out</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Price</p>
                          <p className="font-medium text-gray-900">
                            {formatRs(booking.price || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Booked on</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {editingBookingId === booking._id ? (
                        <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Check-in Date</label>
                            <input
                              type="date"
                              name="checkInDate"
                              value={editForm.checkInDate}
                              onChange={handleEditChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Check-out Date</label>
                            <input
                              type="date"
                              name="checkOutDate"
                              value={editForm.checkOutDate}
                              onChange={handleEditChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Guests</label>
                            <input
                              type="number"
                              min="1"
                              name="numberOfGuests"
                              value={editForm.numberOfGuests}
                              onChange={handleEditChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Rooms</label>
                            <input
                              type="number"
                              min="1"
                              name="numberOfRooms"
                              value={editForm.numberOfRooms}
                              onChange={handleEditChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Notes</label>
                            <textarea
                              name="notes"
                              rows="3"
                              value={editForm.notes}
                              onChange={handleEditChange}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div className="md:col-span-2 flex gap-2">
                            <button
                              onClick={() => handleEditSave(booking._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/property/${booking.property?._id}`)}
                          className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Property
                        </button>
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleEditStart(booking)}
                            className="py-2 px-4 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors text-sm"
                          >
                            Edit
                          </button>
                        )}
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="py-2 px-4 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "favorites" ? (
            <div>
              {favorites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600 mb-4">No favorites yet.</p>
                  <button
                    onClick={() => navigate("/rent")}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Find Properties
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((property) => (
                    <div
                      key={property._id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-48 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center relative">
                        <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                        <button
                          onClick={() => handleRemoveFavorite(property._id)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove from favorites"
                        >
                          ❌
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{property.location}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-blue-600">
                            {formatRs(property.price)}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                            {property.category}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/property/${property._id}`)}
                          className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {marketProperties.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600 mb-4">No public listings available right now.</p>
                  <button
                    onClick={fetchBuyerData}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Listings
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketProperties.map((property) => (
                    <div
                      key={property._id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-48 bg-linear-to-br from-indigo-400 to-blue-600 flex items-center justify-center relative">
                        <svg className="w-16 h-16 text-white opacity-40" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                        <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-white/90 text-blue-700 font-semibold capitalize">
                          {property.listingType || "property"}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">{property.location}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Seller: {property.seller?.name || "Unknown"}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-blue-600">
                            {formatRs(property.price)}
                          </span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded capitalize">
                            {property.propertyType}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/property/${property._id}`)}
                          className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View & Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BuyerRoute>
  );
};

export default BuyerDashboard;
