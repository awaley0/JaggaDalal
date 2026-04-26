import { useState, useEffect, useMemo, useRef } from "react";
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
  const [showRevenueReport, setShowRevenueReport] = useState(false);
  const [revenueReportLoading, setRevenueReportLoading] = useState(false);
  const [sellerRevenueReport, setSellerRevenueReport] = useState([]);
  const [sellerRevenueSummary, setSellerRevenueSummary] = useState(null);
  const [listingFilter, setListingFilter] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");
  const bookingSectionRef = useRef(null);
  const listingSectionRef = useRef(null);

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

  const openRevenueReport = async () => {
    try {
      setRevenueReportLoading(true);
      const response = await axios.get("/properties/seller/revenue-report?page=1&limit=100");
      setSellerRevenueReport(response?.data?.data || []);
      setSellerRevenueSummary(response?.data?.summary || null);
      setShowRevenueReport(true);
    } catch (err) {
      console.error("Error loading seller revenue report:", err);
      setError("Failed to load seller revenue report");
    } finally {
      setRevenueReportLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "all") return bookings;
    return bookings.filter((booking) => String(booking.status || "").toLowerCase() === bookingFilter);
  }, [bookings, bookingFilter]);

  const filteredListings = useMemo(() => {
    if (listingFilter === "all") return properties;
    return properties.filter((property) => String(property.status || "").toLowerCase() === listingFilter);
  }, [properties, listingFilter]);

  const focusSection = (sectionRef) => {
    sectionRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOverviewRedirect = (target) => {
    if (target === "inventory") {
      setListingFilter("all");
      focusSection(listingSectionRef);
      return;
    }

    if (target === "activeListings") {
      setListingFilter("available");
      focusSection(listingSectionRef);
      return;
    }

    if (target === "pendingBookings") {
      setBookingFilter("pending");
      focusSection(bookingSectionRef);
      return;
    }

    if (target === "completedBookings") {
      setBookingFilter("completed");
      focusSection(bookingSectionRef);
    }
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
            <button
              type="button"
              onClick={() => handleOverviewRedirect("inventory")}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Inventory</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalProperties || 0}</p>
              <p className="text-xs text-slate-500 mt-2">Click to view all your listings</p>
            </button>
            <button
              type="button"
              onClick={() => handleOverviewRedirect("activeListings")}
              className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-5 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-emerald-700">Active Listings</p>
              <p className="text-3xl font-black text-emerald-700 mt-2">{stats.activeListings || 0}</p>
              <p className="text-xs text-emerald-700/80 mt-2">Click to show only active listings</p>
            </button>
            <button
              type="button"
              onClick={() => handleOverviewRedirect("pendingBookings")}
              className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-5 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-amber-700">Pending Bookings</p>
              <p className="text-3xl font-black text-amber-700 mt-2">{stats.pendingBookings || 0}</p>
              <p className="text-xs text-amber-700/80 mt-2">Click to focus pending bookings</p>
            </button>
            <button
              type="button"
              onClick={() => handleOverviewRedirect("completedBookings")}
              className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-white p-5 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-blue-700">Completed Bookings</p>
              <p className="text-3xl font-black text-blue-700 mt-2">{stats.completedBookings || 0}</p>
              <p className="text-xs text-blue-700/80 mt-2">Click to focus completed bookings</p>
            </button>
            <button
              type="button"
              onClick={openRevenueReport}
              className="rounded-2xl border border-violet-200 bg-linear-to-br from-violet-50 to-white p-5 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-violet-700">Revenue</p>
              <p className="text-3xl font-black text-violet-700 mt-2">{formatRs(stats.totalRevenue || 0)}</p>
              <p className="text-xs text-violet-700/80 mt-2">Net after admin commission (3%)</p>
            </button>
          </section>

          {showRevenueReport && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Seller Revenue Report</h3>
                    <p className="text-sm text-slate-600">Approved sold/rented listings with 3% admin commission</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRevenueReport(false)}
                    className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-500">Gross Property Value</p>
                    <p className="text-lg font-bold text-slate-900">{formatRs(sellerRevenueSummary?.totalGross || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-3">
                    <p className="text-rose-700">Admin Commission (3%)</p>
                    <p className="text-lg font-bold text-rose-700">{formatRs(sellerRevenueSummary?.totalAdminCommission || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-emerald-700">Your Net Revenue (97%)</p>
                    <p className="text-lg font-bold text-emerald-700">{formatRs(sellerRevenueSummary?.totalSellerNet || 0)}</p>
                  </div>
                </div>

                <div className="overflow-auto p-6">
                  {revenueReportLoading ? (
                    <p className="text-slate-500">Loading report...</p>
                  ) : sellerRevenueReport.length === 0 ? (
                    <p className="text-slate-500">No approved sold/rented properties found for your account.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left bg-slate-50 border-y border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Property</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Gross</th>
                          <th className="px-3 py-2">Admin 3%</th>
                          <th className="px-3 py-2">Your 97%</th>
                          <th className="px-3 py-2">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellerRevenueReport.map((item) => (
                          <tr key={item.propertyId} className="border-b border-slate-100">
                            <td className="px-3 py-2">
                              <p className="font-medium text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-500">{item.location || "N/A"}</p>
                            </td>
                            <td className="px-3 py-2 capitalize">{item.status}</td>
                            <td className="px-3 py-2">{formatRs(item.grossAmount || 0)}</td>
                            <td className="px-3 py-2 text-rose-700 font-semibold">{formatRs(item.adminCommission || 0)}</td>
                            <td className="px-3 py-2 text-emerald-700 font-semibold">{formatRs(item.sellerNet || 0)}</td>
                            <td className="px-3 py-2">{new Date(item.closedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          <section ref={bookingSectionRef} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setBookingFilter("all")}
                    className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                      bookingFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingFilter("pending")}
                    className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                      bookingFilter === "pending" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingFilter("completed")}
                    className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                      bookingFilter === "completed" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    Completed
                  </button>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-slate-600">No booking activity for this filter.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.slice(0, 6).map((booking) => (
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

          <section ref={listingSectionRef} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Your Listings</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setListingFilter("all")}
                  className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                    listingFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("available")}
                  className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                    listingFilter === "available" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="px-4 py-2 bg-linear-to-r from-slate-900 to-blue-700 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-blue-600 transition-all"
                >
                  Add New Property
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600 mt-4">Loading your listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-14 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <p className="text-slate-700 mb-4">No listings found for this filter.</p>
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="px-6 py-2.5 bg-linear-to-r from-slate-900 to-blue-700 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-blue-600 transition-all"
                >
                  Add New Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredListings.map((property) => (
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
