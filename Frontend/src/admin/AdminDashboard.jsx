import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats,
  getAdminRevenueReport,
  getMonthlyStats,
  getWeeklyActivity,
  getRecentProperties,
  getRecentUsers,
  getAllPropertiesForAdmin,
  getAllUsersForAdmin,
  updatePropertyStatus,
  deletePropertyByAdmin,
  deleteUserByAdmin,
  updateUserRole,
  getAllBookingsForAdmin,
  updateBookingStatus,
  deleteBookingByAdmin,
} from "../api/adminApi";
import { formatRs } from "../utils/currency";

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Dashboard state
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Search and filter states
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyStatusFilter, setPropertyStatusFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [isRevenueReportOpen, setIsRevenueReportOpen] = useState(false);
  const [revenueReportLoading, setRevenueReportLoading] = useState(false);
  const [adminRevenueReport, setAdminRevenueReport] = useState([]);
  const [adminRevenueSummary, setAdminRevenueSummary] = useState(null);

  // Pagination
  const [propertyPage, setPropertyPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [propertyPagination, setPropertyPagination] = useState(null);
  const [userPagination, setUserPagination] = useState(null);
  const [bookingPagination, setBookingPagination] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      // If not authenticated or user role is not admin, redirect
      if (!isAuthenticated || !user || user.role !== "admin") {
        window.location.href = "/";
      }
    }
  }, [authLoading, isAuthenticated, user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, monthlyRes, weeklyRes, propertiesRes, usersRes] = await Promise.all([
          getDashboardStats(),
          getMonthlyStats(),
          getWeeklyActivity(),
          getRecentProperties(5),
          getRecentUsers(5),
        ]);

        setStats(statsRes.data);
        setMonthlyData(monthlyRes.data || []);
        setWeeklyActivity(weeklyRes.data || []);
        setRecentProperties(propertiesRes.data || []);
        setRecentUsers(usersRes.data || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refetch stats every 30 seconds to keep data fresh
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch properties for management
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setPropertiesLoading(true);
        const filters = { page: propertyPage, limit: 10 };
        if (propertySearch) filters.search = propertySearch;
        if (propertyStatusFilter) filters.status = propertyStatusFilter;
        const response = await getAllPropertiesForAdmin(filters);
        setProperties(response.data || []);
        setPropertyPagination(response.pagination);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, [propertyPage, propertySearch, propertyStatusFilter]);

  useEffect(() => {
    if (location.pathname !== "/admin/properties") return;

    const query = new URLSearchParams(location.search);
    const statusFromQuery = query.get("status") || "";
    setPropertyStatusFilter(statusFromQuery);
    setPropertyPage(1);
  }, [location.pathname, location.search]);

  // Fetch users for management
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const filters = { page: userPage, limit: 10 };
        if (userSearch) filters.search = userSearch;
        const response = await getAllUsersForAdmin(filters);
        setUsers(response.data || []);
        setUserPagination(response.pagination);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [userPage, userSearch]);

  // Fetch bookings for management
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setBookingsLoading(true);
        const filters = { page: bookingPage, limit: 10 };
        if (bookingSearch) filters.search = bookingSearch;
        if (bookingStatusFilter) filters.status = bookingStatusFilter;
        const response = await getAllBookingsForAdmin(filters);
        setBookings(response.data || []);
        setBookingPagination(response.pagination);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [bookingPage, bookingSearch, bookingStatusFilter]);

  // Handle property status update
  const handlePropertyStatusUpdate = async (propertyId, newStatus) => {
    try {
      await updatePropertyStatus(propertyId, newStatus);
      // Refresh properties list
      const response = await getAllPropertiesForAdmin({ page: propertyPage, limit: 10 });
      setProperties(response.data || []);
    } catch (err) {
      console.error("Error updating property:", err);
      alert("Failed to update property");
    }
  };

  // Handle property deletion
  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await deletePropertyByAdmin(propertyId);
        // Refresh properties list
        const response = await getAllPropertiesForAdmin({ page: propertyPage, limit: 10 });
        setProperties(response.data || []);
      } catch (err) {
        console.error("Error deleting property:", err);
        alert("Failed to delete property");
      }
    }
  };

  // Handle user role update
  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      // Refresh users list
      const response = await getAllUsersForAdmin({ page: userPage, limit: 10 });
      setUsers(response.data || []);
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Failed to update user role");
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUserByAdmin(userId);
        // Refresh users list
        const response = await getAllUsersForAdmin({ page: userPage, limit: 10 });
        setUsers(response.data || []);
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user");
      }
    }
  };

  // Handle booking status update
  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      // Refresh bookings list
      const filters = { page: bookingPage, limit: 10 };
      if (bookingSearch) filters.search = bookingSearch;
      if (bookingStatusFilter) filters.status = bookingStatusFilter;
      const response = await getAllBookingsForAdmin(filters);
      setBookings(response.data || []);
    } catch (err) {
      console.error("Error updating booking:", err);
      alert("Failed to update booking status");
    }
  };

  // Handle booking deletion
  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteBookingByAdmin(bookingId);
        // Refresh bookings list
        const filters = { page: bookingPage, limit: 10 };
        if (bookingSearch) filters.search = bookingSearch;
        if (bookingStatusFilter) filters.status = bookingStatusFilter;
        const response = await getAllBookingsForAdmin(filters);
        setBookings(response.data || []);
      } catch (err) {
        console.error("Error deleting booking:", err);
        alert("Failed to delete booking");
      }
    }
  };

  const openRevenueReport = async () => {
    try {
      setRevenueReportLoading(true);
      const response = await getAdminRevenueReport({ page: 1, limit: 100 });
      setAdminRevenueReport(response?.data || []);
      setAdminRevenueSummary(response?.summary || null);
      setIsRevenueReportOpen(true);
    } catch (err) {
      console.error("Error loading revenue report:", err);
      alert("Failed to load revenue report");
    } finally {
      setRevenueReportLoading(false);
    }
  };

  const goToAdminSection = (path) => {
    navigate(path);
  };

  // Property types data for pie chart
  const propertyTypesData = stats?.propertyDistribution
    ? stats.propertyDistribution.map((item) => ({
        name: item._id === "buy" ? "For Sale" : "For Rent",
        value: item.count,
        fill: item._id === "buy" ? "#0f172a" : "#f59e0b",
      }))
    : [];


  const Dashboard = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard Overview</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-3">
              <svg
                className="w-6 h-6 animate-spin text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              type="button"
              onClick={() => goToAdminSection("/admin/properties")}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Properties</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalProperties || 0}</p>
                  <p className="text-xs text-emerald-600 mt-2">Click to manage properties</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToAdminSection("/admin/users")}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-emerald-600 mt-2">Click to manage users</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToAdminSection("/admin/properties?status=available")}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active Listings</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.activeListings || 0}</p>
                  <p className="text-xs text-amber-600 mt-2">Click to view available listings</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={openRevenueReport}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    Rs {(stats?.totalRevenue || 0).toFixed(1)}K
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">Admin commission (3%)</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          {isRevenueReportOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Admin Revenue Report</h3>
                    <p className="text-sm text-slate-600">3% commission on approved sold/rented properties</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRevenueReportOpen(false)}
                    className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-500">Gross Property Value</p>
                    <p className="text-lg font-bold text-slate-900">{formatRs(adminRevenueSummary?.totalGross || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-emerald-700">Admin Commission (3%)</p>
                    <p className="text-lg font-bold text-emerald-700">{formatRs(adminRevenueSummary?.totalAdminCommission || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-blue-700">Seller Net (97%)</p>
                    <p className="text-lg font-bold text-blue-700">{formatRs(adminRevenueSummary?.totalSellerNet || 0)}</p>
                  </div>
                </div>

                <div className="overflow-auto p-6">
                  {revenueReportLoading ? (
                    <p className="text-slate-500">Loading report...</p>
                  ) : adminRevenueReport.length === 0 ? (
                    <p className="text-slate-500">No eligible sold/rented approved properties found.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left bg-gradient-to-r from-slate-900 to-slate-800 text-white border-y border-slate-200">
                        <tr>
                          <th className="px-3 py-3 font-semibold">Property</th>
                          <th className="px-3 py-3 font-semibold">Seller</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold">Sold Date</th>
                          <th className="px-3 py-3 font-semibold">Gross</th>
                          <th className="px-3 py-3 font-semibold">Admin 3%</th>
                          <th className="px-3 py-3 font-semibold">Seller 97%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRevenueReport.map((item, index) => (
                          <tr key={item.propertyId} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="px-3 py-3">
                              <p className="font-medium text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-500">{item.location || "N/A"}</p>
                            </td>
                            <td className="px-3 py-3 text-slate-700">{item.seller?.name || "N/A"}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                item.status === 'sold' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              <div className="text-sm">
                                <p className="font-medium">{item.closedAt ? new Date(item.closedAt).toLocaleDateString() : 'N/A'}</p>
                                <p className="text-xs text-slate-500">{item.closedAt ? new Date(item.closedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-900">{formatRs(item.grossAmount || 0)}</td>
                            <td className="px-3 py-3 text-emerald-700 font-bold">{formatRs(item.adminCommission || 0)}</td>
                            <td className="px-3 py-3 text-blue-700 font-bold">{formatRs(item.sellerNet || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Revenue Chart */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Monthly Revenue & Users</h2>
                  <p className="text-sm text-slate-600 mt-1">Last 6 months performance</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" style={{fontSize: '12px'}} />
                    <YAxis stroke="#94A3B8" style={{fontSize: '12px'}} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1E293B", border: "2px solid #3B82F6", borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                      labelStyle={{ color: "#93C5FD" }}
                      formatter={(value) => `₨${value}K`}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar
                      dataKey="revenue"
                      fill="url(#colorRevenue)"
                      name="Revenue (Rs K)"
                      radius={[12, 12, 0, 0]}
                      isAnimationActive={true}
                    />
                    <Bar
                      dataKey="users"
                      fill="url(#colorUsers)"
                      name="Users"
                      radius={[12, 12, 0, 0]}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-12">No monthly data available</p>
              )}
            </div>

            {/* Property Types Distribution */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Properties by Type</h2>
                  <p className="text-sm text-slate-600 mt-1">Distribution across listings</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12a4 4 0 11-8 0 4 4 0 018 0zm0 0a4 4 0 118 0 4 4 0 01-8 0zm7-4a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              {propertyTypesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={propertyTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={true}
                    >
                      {propertyTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1E293B", border: "2px solid #F97316", borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                      labelStyle={{ color: "#FDBA74" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-12">No property data available</p>
              )}
            </div>
          </div>

          {/* User Activity Chart */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Weekly User Activity</h2>
                <p className="text-sm text-slate-600 mt-1">User engagement over last 4 weeks</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            {weeklyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={weeklyActivity}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="week" stroke="#94A3B8" style={{fontSize: '12px'}} />
                  <YAxis stroke="#94A3B8" style={{fontSize: '12px'}} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1E293B", border: "2px solid #8B5CF6", borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                    labelStyle={{ color: "#D8B4FE" }}
                  />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: "#8B5CF6", r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    name="New Signups"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    stroke="#EC4899"
                    strokeWidth={3}
                    dot={{ fill: "#EC4899", r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    name="Total Logins"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-12">No activity data available</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Recent Properties</h2>
                  <p className="text-xs text-slate-600 mt-1">Latest listings added</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                {recentProperties.length > 0 ? (
                  recentProperties.map((property) => (
                    <div
                      key={property._id}
                      className="flex items-center justify-between p-3 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-200"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                          P
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{property.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(property.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-slate-900">{formatRs(property.price)}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            property.status === "available"
                              ? "bg-emerald-100 text-emerald-700"
                              : property.status === "sold"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {property.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-6">No recent properties</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Recent Users</h2>
                  <p className="text-xs text-slate-600 mt-1">Latest registrations</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292m15 0h2m-2 0h-5m5-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-sm text-slate-600">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'seller' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-6">No recent users</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );


  const ManageProperties = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Properties</h1>
      
      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Search properties by title or location..."
          value={propertySearch}
          onChange={(e) => {
            setPropertySearch(e.target.value);
            setPropertyPage(1);
          }}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={propertyStatusFilter}
          onChange={(e) => {
            setPropertyStatusFilter(e.target.value);
            setPropertyPage(1);
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {propertiesLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading properties...
                  </td>
                </tr>
              ) : properties.length > 0 ? (
                properties.map((property) => (
                  <tr key={property._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{property.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {property.listingType === "buy" ? "For Sale" : "For Rent"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{formatRs(property.price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={property.status}
                        onChange={(e) => handlePropertyStatusUpdate(property._id, e.target.value)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold border-0 cursor-pointer ${
                          property.status === "available"
                            ? "bg-emerald-100 text-emerald-700"
                            : property.status === "sold"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteProperty(property._id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {propertyPagination && propertyPagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {propertyPagination.current} of {propertyPagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPropertyPage(Math.max(1, propertyPage - 1))}
                disabled={propertyPage === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPropertyPage(Math.min(propertyPagination.pages, propertyPage + 1))
                }
                disabled={propertyPage === propertyPagination.pages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  const ManageUsers = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Users</h1>
      
      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={userSearch}
          onChange={(e) => {
            setUserSearch(e.target.value);
            setUserPage(1);
          }}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Role Request</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usersLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{u.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUserRoleUpdate(u._id, e.target.value)}
                        className="text-xs px-3 py-1 rounded-full font-semibold border-0 cursor-pointer bg-slate-100 text-slate-700"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {u.roleRequestStatus === "pending" && u.requestedRole ? (
                        <button
                          onClick={() => handleUserRoleUpdate(u._id, u.requestedRole)}
                          className="text-xs px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                        >
                          Approve {u.requestedRole}
                        </button>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 capitalize">
                          {u.roleRequestStatus || "approved"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          u.verified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.verified ? "✓ Yes" : "✗ No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {userPagination && userPagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {userPagination.current} of {userPagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUserPage(Math.max(1, userPage - 1))}
                disabled={userPage === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setUserPage(Math.min(userPagination.pages, userPage + 1))}
                disabled={userPage === userPagination.pages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ManageBookings = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Bookings</h1>
      
      {/* Search and Filter Bar */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Search bookings by buyer, seller, or property..."
          value={bookingSearch}
          onChange={(e) => {
            setBookingSearch(e.target.value);
            setBookingPage(1);
          }}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={bookingStatusFilter}
          onChange={(e) => {
            setBookingStatusFilter(e.target.value);
            setBookingPage(1);
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bookingsLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{booking.buyer?.name}</p>
                      <p className="text-sm text-slate-600">{booking.buyer?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{booking.seller?.name}</p>
                      <p className="text-sm text-slate-600">{booking.seller?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{booking.property?.title}</p>
                      <p className="text-sm text-slate-600">{formatRs(booking.property?.price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={booking.status}
                        onChange={(e) => handleBookingStatusUpdate(booking._id, e.target.value)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold border-0 cursor-pointer ${
                          booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : booking.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {bookingPagination && bookingPagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {bookingPagination.current} of {bookingPagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBookingPage(Math.max(1, bookingPage - 1))}
                disabled={bookingPage === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setBookingPage(Math.min(bookingPagination.pages, bookingPage + 1))
                }
                disabled={bookingPage === bookingPagination.pages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Show loading screen while auth is being verified */}
      {authLoading ? (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-3">
              <svg
                className="w-6 h-6 animate-spin text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-slate-600">Verifying access...</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-xl fixed h-screen overflow-y-auto">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin</h2>
              <p className="text-xs text-slate-300">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
              location.pathname === "/admin"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4" />
            </svg>
            Dashboard
          </Link>

          <Link
            to="/admin/properties"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
              location.pathname === "/admin/properties"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Properties
          </Link>

          <Link
            to="/admin/users"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
              location.pathname === "/admin/users"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Users
          </Link>

          <Link
            to="/admin/bookings"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
              location.pathname === "/admin/bookings"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Bookings
          </Link>

          <Link
            to="/chat"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
              location.pathname === "/chat"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
          </Link>
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Properties</p>
              <p className="text-lg font-bold text-white">{stats?.totalProperties || 0}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Users</p>
              <p className="text-lg font-bold text-white">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Revenue</p>
              <p className="text-lg font-bold text-white">Rs {(stats?.totalRevenue || 0).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72">
        <div className="p-8">
          {location.pathname === "/admin" && <Dashboard />}
          {location.pathname === "/admin/properties" && <ManageProperties />}
          {location.pathname === "/admin/users" && <ManageUsers />}
          {location.pathname === "/admin/bookings" && <ManageBookings />}
        </div>
      </div>
    </div>
      )}
    </>
  );
};

export default AdminDashboard;