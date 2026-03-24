import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/login");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/buy", label: "Buy" },
    { to: "/rent", label: "Rent" },
    { to: "/sell", label: "Sell" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                JaggaDalal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2.5 font-semibold transition-all duration-200 relative ${
                    isActive
                      ? "text-amber-600 text-base"
                      : "text-slate-700 text-sm hover:text-amber-600"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              // Logged In User
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-full flex items-center justify-center font-semibold text-sm text-white">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{user.name.split(" ")[0]}</span>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-200 divide-y divide-slate-100">
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    <p className="text-xs text-amber-600 font-medium capitalize mt-1 inline-block px-2 py-1 bg-amber-50 rounded">
                      {user.role}
                    </p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Favorites
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Not Logged In
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 font-medium hover:text-amber-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all duration-200 shadow-lg shadow-slate-900/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200">
            <div className="space-y-2 py-3">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-2.5 font-semibold transition-all ${
                      isActive
                        ? "bg-amber-100 text-amber-600 border-l-4 border-amber-500"
                        : "text-slate-700 hover:bg-amber-50 hover:text-amber-600"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all duration-200 text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;