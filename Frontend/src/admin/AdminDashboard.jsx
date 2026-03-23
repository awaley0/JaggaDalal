import { useState } from "react";
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

const AdminDashboard = () => {
  const location = useLocation();

  // Sample data for charts
  const propertyTypesData = [
    { name: "For Sale", value: 65, fill: "#0f172a" },
    { name: "For Rent", value: 55, fill: "#f59e0b" },
  ];

  const monthlyRevenueData = [
    { month: "Jan", revenue: 12000, users: 24 },
    { month: "Feb", revenue: 19000, users: 32 },
    { month: "Mar", revenue: 18000, users: 28 },
    { month: "Apr", revenue: 25000, users: 42 },
    { month: "May", revenue: 22000, users: 38 },
    { month: "Jun", revenue: 28000, users: 45 },
  ];

  const userActivityData = [
    { week: "Week 1", signups: 12, logins: 324 },
    { week: "Week 2", signups: 18, logins: 412 },
    { week: "Week 3", signups: 15, logins: 389 },
    { week: "Week 4", signups: 22, logins: 456 },
  ];

  const Dashboard = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard Overview</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Properties</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">120</p>
              <p className="text-xs text-emerald-600 mt-2">↑ 12% from last month</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">245</p>
              <p className="text-xs text-emerald-600 mt-2">↑ 8% from last month</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active Listings</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">87</p>
              <p className="text-xs text-amber-600 mt-2">⚠ 5 pending</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-shadow hover:border-amber-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">$42.5K</p>
              <p className="text-xs text-emerald-600 mt-2">↑ 18% from last month</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{ backgroundColor: "#F1F5F9", border: "1px solid #CBD5E1" }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#0f172a" name="Revenue ($)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="users" fill="#f59e0b" name="Users" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property Types Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Properties by Type</h2>
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
        </div>
      </div>

      {/* User Activity Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Weekly User Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userActivityData}>
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
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Properties</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold">
                    P{item}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Modern Apartment {item}</p>
                    <p className="text-sm text-slate-600">Listed 2 days ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">$450,000</p>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    U{item}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">User {item}</p>
                    <p className="text-sm text-slate-600">Joined 1 week ago</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded capitalize">
                    {item % 2 === 0 ? "Seller" : "Buyer"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ManageProperties = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Properties</h1>
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
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">Property {item}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{item % 2 === 0 ? "For Rent" : "For Sale"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">${item * 100000}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Active</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-amber-600 hover:text-amber-700 font-medium text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ManageUsers = () => (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Users</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">User {item}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">user{item}@example.com</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full capitalize">
                      {item % 2 === 0 ? "Seller" : "Buyer"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">2024-0{item}-15</p>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-amber-600 hover:text-amber-700 font-medium text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
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
        </nav>

        {/* Stats Summary */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Properties</p>
              <p className="text-lg font-bold text-white">120</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Active Users</p>
              <p className="text-lg font-bold text-white">245</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Revenue</p>
              <p className="text-lg font-bold text-amber-400">$42.5K</p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-auto pt-8 border-t border-slate-700">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors py-2 px-2 rounded hover:bg-slate-700/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72 p-8 overflow-auto">
        {location.pathname === "/admin" && <Dashboard />}
        {location.pathname === "/admin/properties" && <ManageProperties />}
        {location.pathname === "/admin/users" && <ManageUsers />}
      </div>
    </div>
  );
};

export default AdminDashboard;