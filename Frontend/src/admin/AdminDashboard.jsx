import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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

const AdminDashboard = () => {
  const location = useLocation();
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
  const [userSearch, setUserSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Pagination
  const [propertyPage, setPropertyPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [propertyPagination, setPropertyPagination] = useState(null);
  const [userPagination, setUserPagination] = useState(null);
  const [bookingPagination, setBookingPagination] = useState(null);

  // Redirect if not admin or seller (seller is admin-level in this system)
  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      // If not authenticated or user role is not admin/seller, redirect
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "seller")) {
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
  }, []);

  // Fetch properties for management
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setPropertiesLoading(true);
        const filters = { page: propertyPage, limit: 10 };
        if (propertySearch) filters.search = propertySearch;
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
  }, [propertyPage, propertySearch]);

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
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Properties</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalProperties || 0}</p>
                  <p className="text-xs text-emerald-600 mt-2">Real-time data</p>
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
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-emerald-600 mt-2">Real-time data</p>
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
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active Listings</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.activeListings || 0}</p>
                  <p className="text-xs text-amber-600 mt-2">Available now</p>
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
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    ${(stats?.totalRevenue || 0).toFixed(1)}K
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">From bookings</p>
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
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue & Users</h2>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#F1F5F9", border: "1px solid #CBD5E1" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="#0f172a"
                      name="Revenue ($K)"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="users"
                      fill="#f59e0b"
                      name="Users"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8">No monthly data available</p>
              )}
            </div>

            {/* Property Types Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Properties by Type</h2>
              {propertyTypesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={propertyTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {propertyTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8">No property data available</p>
              )}
            </div>
          </div>

          {/* User Activity Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Weekly User Activity</h2>
            {weeklyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#F1F5F9", border: "1px solid #CBD5E1" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={{ fill: "#0f172a", r: 5 }}
                    activeDot={{ r: 7 }}
                    name="New Signups"
                  />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Total Logins"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-center py-8">No activity data available</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Properties</h2>
              <div className="space-y-3">
                {recentProperties.length > 0 ? (
                  recentProperties.map((property) => (
                    <div
                      key={property._id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                          P
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{property.title}</p>
                          <p className="text-sm text-slate-600">
                            {new Date(property.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-slate-900">${property.price?.toLocaleString()}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            property.status === "available"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
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

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Users</h2>
              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-sm text-slate-600">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded capitalize">
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
                      <p className="font-semibold text-slate-900">${property.price?.toLocaleString()}</p>
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
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
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
                      <p className="text-sm text-slate-600">${booking.property?.price?.toLocaleString()}</p>
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
              <p className="text-lg font-bold text-white">${(stats?.totalRevenue || 0).toFixed(0)}K</p>
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