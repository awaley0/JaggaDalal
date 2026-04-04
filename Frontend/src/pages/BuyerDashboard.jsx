import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import BuyerRoute from "../components/BuyerRoute";

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch buyer's data
  useEffect(() => {
    fetchBuyerData();
  }, []);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch bookings
      const bookingsResponse = await axios.get("/bookings/my-bookings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBookings(bookingsResponse.data.data || []);

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
        await axios.delete(`/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setBookings(bookings.filter((b) => b._id !== bookingId));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to cancel booking");
      }
    }
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
                            ${booking.totalPrice?.toLocaleString() || "0"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Booked on</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/property/${booking.property?._id}`)}
                          className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Property
                        </button>
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
          ) : (
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
                            ${property.price.toLocaleString()}
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
          )}
        </div>
      </div>
    </BuyerRoute>
  );
};

export default BuyerDashboard;
