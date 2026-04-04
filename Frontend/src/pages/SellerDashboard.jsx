import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import SellerRoute from "../components/SellerRoute";
import PropertyFormModal from "../components/PropertyFormModal";
import { getSellerBookings } from "../api/bookingApi";
import { formatRs } from "../utils/currency";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    soldOrRented: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProperty, setShowAddProperty] = useState(false);

  // Fetch seller's properties
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [propertiesRes, statsRes, bookingsRes] = await Promise.all([
        axios.get("/properties/seller/my-properties"),
        axios.get("/properties/seller/dashboard-stats"),
        getSellerBookings(),
      ]);

      setProperties(propertiesRes?.data?.data || []);
      setStats(
        statsRes?.data?.data || {
          totalProperties: 0,
          activeListings: 0,
          soldOrRented: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
        }
      );
      setBookings(bookingsRes?.bookings || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch seller dashboard data");
      console.error("Error fetching seller dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyAdded = (newProperty) => {
    setProperties([...properties, newProperty]);
    setStats((prev) => ({
      ...prev,
      totalProperties: (prev.totalProperties || 0) + 1,
      activeListings: (prev.activeListings || 0) + 1,
    }));
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await axios.delete(`/properties/${propertyId}`);
        setProperties(properties.filter((p) => p._id !== propertyId));
        setStats((prev) => ({
          ...prev,
          totalProperties: Math.max((prev.totalProperties || 1) - 1, 0),
          activeListings: Math.max((prev.activeListings || 1) - 1, 0),
        }));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to delete property");
      }
    }
  };

  const getStatusPillClass = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pending") return "bg-amber-100 text-amber-700 border border-amber-200";
    if (normalized === "confirmed") return "bg-blue-100 text-blue-700 border border-blue-200";
    if (normalized === "completed") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (normalized === "cancelled") return "bg-rose-100 text-rose-700 border border-rose-200";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };



  return (
    <SellerRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#f8fafc_40%,#f1f5f9_100%)] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-xl bg-linear-to-r from-slate-900 via-blue-900 to-cyan-700 p-6 sm:p-8 lg:p-10">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute right-20 bottom-0 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl"></div>
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-cyan-200 text-xs uppercase tracking-[0.25em] font-semibold mb-3">Seller Workspace</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                  Build Momentum, {user?.name?.split(" ")[0] || "Seller"}
                </h1>
                <p className="text-slate-100/90 mt-3 text-sm sm:text-base max-w-xl">
                  A live operational view of your inventory, booking pipeline, and revenue performance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="px-5 py-2.5 rounded-xl border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-all font-semibold"
                >
                  Open Messages
                </button>
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all font-semibold"
                >
                  Add Property
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between">
              <p className="text-rose-700">{error}</p>
              <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-700">
                x
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Inventory</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalProperties || 0}</p>
              <p className="text-xs text-slate-500 mt-2">Properties managed by you</p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Active Listings</p>
              <p className="text-3xl font-black text-emerald-700 mt-2">{stats.activeListings || 0}</p>
              <p className="text-xs text-emerald-700/80 mt-2">Currently live in marketplace</p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-amber-700">Pending Bookings</p>
              <p className="text-3xl font-black text-amber-700 mt-2">{stats.pendingBookings || 0}</p>
              <p className="text-xs text-amber-700/80 mt-2">Need your confirmation</p>
            </article>
            <article className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-blue-700">Completed Bookings</p>
              <p className="text-3xl font-black text-blue-700 mt-2">{stats.completedBookings || 0}</p>
              <p className="text-xs text-blue-700/80 mt-2">Successful transactions</p>
            </article>
            <article className="rounded-2xl border border-violet-200 bg-linear-to-br from-violet-50 to-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-violet-700">Revenue</p>
              <p className="text-3xl font-black text-violet-700 mt-2">{formatRs(stats.totalRevenue || 0)}</p>
              <p className="text-xs text-violet-700/80 mt-2">From completed bookings</p>
            </article>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Recent Booking Activity</h2>
                <button
                  onClick={() => navigate("/chat")}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  View Conversations
                </button>
              </div>
              <div className="p-5 sm:p-6">
                {bookings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-slate-600">No booking activity yet for your listings.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 6).map((booking) => (
                      <div key={booking._id} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{booking.property?.title || "Property"}</p>
                            <p className="text-sm text-slate-600 mt-1">Buyer: {booking.buyer?.name || "N/A"}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${getStatusPillClass(booking.status)}`}>
                            {booking.status || "pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">Performance Snapshot</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>Confirmed Bookings</span>
                    <span className="font-semibold text-slate-900">{stats.confirmedBookings || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-linear-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min((stats.confirmedBookings || 0) * 12, 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>Sold or Rented</span>
                    <span className="font-semibold text-slate-900">{stats.soldOrRented || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-linear-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min((stats.soldOrRented || 0) * 12, 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>Completed Bookings</span>
                    <span className="font-semibold text-slate-900">{stats.completedBookings || 0}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.min((stats.completedBookings || 0) * 12, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <PropertyFormModal
            isOpen={showAddProperty}
            onClose={() => setShowAddProperty(false)}
            onPropertyAdded={handlePropertyAdded}
          />

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Your Listings</h2>
              <button
                onClick={() => setShowAddProperty(true)}
                className="px-4 py-2 bg-linear-to-r from-slate-900 to-blue-700 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-blue-600 transition-all"
              >
                Add New Property
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 mt-4">Loading your listings...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-14 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <p className="text-slate-700 mb-4">No properties listed yet. Launch your first listing now.</p>
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="px-6 py-2.5 bg-linear-to-r from-slate-900 to-blue-700 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-blue-600 transition-all"
                >
                  Add First Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {properties.map((property) => (
                  <article
                    key={property._id}
                    className="group rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-xl hover:border-slate-300 transition-all"
                  >
                    <div className="h-44 bg-linear-to-br from-slate-800 via-blue-700 to-cyan-600 flex items-center justify-center relative">
                      <svg className="w-14 h-14 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                      </svg>
                      <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider rounded-full bg-white/20 border border-white/30 text-white px-2 py-1">
                        {property.propertyType || property.listingType || "Listing"}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{property.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1">{property.location}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-2xl font-black text-blue-700">{formatRs(property.price)}</span>
                        <div className="text-xs text-slate-500">
                          {property.bedrooms || 0} bed • {property.bathrooms || 0} bath
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/property/${property._id}`)}
                          className="py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property._id)}
                          className="py-2 bg-rose-50 text-rose-700 font-semibold rounded-lg hover:bg-rose-100 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </SellerRoute>
  );
};

export default SellerDashboard;
