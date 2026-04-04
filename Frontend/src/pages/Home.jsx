import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import properties from "../data/properties"; // Fallback static data
import { useAuth } from "../context/AuthContext";
import { getMyBookings, getSellerBookings } from "../api/bookingApi";
import { getAllProperties, getRecommendedProperties, getSellerProperties } from "../api/propertyApi";
import { saveUserSearch } from "../api/auth";
import PropertyFormModal from "../components/PropertyFormModal";

const Home = () => {
  const [allProperties, setAllProperties] = useState(properties); // Start with fallback
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const [buyerSearchResults, setBuyerSearchResults] = useState(null); // specific to buyer search bar
  const [bookings, setBookings] = useState([]); // holds active user's bookings
  const [sellerListings, setSellerListings] = useState([]); // holds active seller's listings
  const { user, isAuthenticated } = useAuth();

  // Fetch properties from API on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const response = await getAllProperties({ limit: 100 });
        if (response.success && response.data) {
          setAllProperties(response.data);
          setFilteredProperties(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch properties from API, using fallback data:", error);
        // Keep using static data if API fails
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommended = async () => {
      if (isAuthenticated && user?.role === "buyer") {
        try {
          const res = await getRecommendedProperties();
          if (res.success && res.data) {
             setRecommendedProperties(res.data);
          }
        } catch(err) {
             console.error("Failed fetching recommended", err);
        }
      }
    };

    const fetchUserBookings = async () => {
      if (!isAuthenticated || !user) return;
      try {
        let res;
        if (user.role === "buyer") {
          res = await getMyBookings();
        } else if (user.role === "seller") {
          res = await getSellerBookings();
          const propsRes = await getSellerProperties();
          if (propsRes && propsRes.success) {
            setSellerListings(propsRes.data || []);
          }
        }
        if (res && res.success) {
          setBookings(res.bookings || []);
        }
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      }
    };

    fetchProperties();
    if (isAuthenticated) {
        fetchRecommended();
        fetchUserBookings();
    }
  }, [isAuthenticated, user]);

  const handleSearch = (filters) => {
    // Build API filter query
    let apiFilters = {};
    
    if (filters.location) {
      apiFilters.location = filters.location;
    }
    
    if (filters.type && filters.type !== "") {
      apiFilters.listingType = filters.type;
    }
    
    // If no filters, show all properties
    if (Object.keys(apiFilters).length === 0) {
      setFilteredProperties(allProperties);
      if (isAuthenticated && user?.role === "buyer") setBuyerSearchResults(null);
    } else {
      // Filter locally for better UX
      const result = allProperties.filter((property) => {
        return (
          (filters.location === "" ||
            property.location.toLowerCase().includes(filters.location.toLowerCase())) &&
          (filters.type === "" || property.listingType === filters.type)
        );
      });
      setFilteredProperties(result);
      if (isAuthenticated && user?.role === "buyer") setBuyerSearchResults(result);
    }

    if (isAuthenticated && user?.role === "buyer") {
      saveUserSearch({ location: filters.location, type: filters.type }).catch(err => 
        console.error("Failed saving search to profile", err)
      );
    }
  };

  const featuredProperties = useMemo(
    () => allProperties.filter((p) => p.featured),
    [allProperties]
  );

  const filteredByType = useMemo(() => {
    if (selectedType === "all") return filteredProperties;
    return filteredProperties.filter((p) => p.listingType === selectedType);
  }, [filteredProperties, selectedType]);

  // Role-based property filtering
  const getBuyerRecommendations = () => {
    return recommendedProperties.length > 0 
      ? recommendedProperties 
      : allProperties.filter(p => p.listingType === "rent" || p.listingType === "buy").slice(0, 6);
  };

  const getSellerListings = () => {
    return sellerListings;
  };

  const getBuyerBookings = () => {
    // Mock bookings - in real app would come from API
    return [
      { id: 1, propertyTitle: "Modern Apartment", status: "pending", date: "2026-03-28" },
      { id: 2, propertyTitle: "City Rental Apartment", status: "confirmed", date: "2026-03-25" },
    ];
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      {/* ==================== AUTHENTICATED USER SECTIONS ==================== */}
      
      {isAuthenticated && user && (
        <>
          {/* ========== BUYER HOMEPAGE ========== */}
          {user.role === "buyer" && (
            <>
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                        Welcome back, {user.name.split(" ")[0]}! 🏠
                      </h2>
                      <p className="text-blue-100 text-sm sm:text-base">
                        Continue your property search and manage your bookings
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link to="/favorites" className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow">
                        ❤️ My Favorites
                      </Link>
                      <Link to="/chat" className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow">
                        💬 Messages
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white border-b border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {allProperties.filter(p => p.listingType === "rent" || p.listingType === "buy").length}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Properties Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {bookings.length}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Active Bookings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {new Set(allProperties.map(p => p.location)).size}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Locations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">4.6★</p>
                      <p className="text-sm text-gray-600 mt-1">Avg Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 Your Recent Bookings</h3>
                  {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookings.map((booking) => (
                        <div key={booking._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{booking.property?.title || "Property"}</p>
                              <p className="text-sm text-gray-600 mt-1">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === "confirmed" 
                                ? "bg-green-100 text-green-700" 
                                : booking.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                          </div>
                          <Link to="/chat" className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-semibold text-sm">
                            📞 Contact Seller →
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No bookings yet. Start exploring properties!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h3 className="text-white text-2xl font-bold mb-6">🔍 Find Your Perfect Property</h3>
                  <SearchBar onSearch={handleSearch} />
                </div>
              </div>

              {/* Immediate Search Results Area */}
              {buyerSearchResults !== null && (
                <div className="bg-slate-50 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Your Search Results</h3>
                        <p className="text-slate-600 mt-1">Found {buyerSearchResults.length} match{buyerSearchResults.length !== 1 && 'es'}</p>
                      </div>
                      <button onClick={() => setBuyerSearchResults(null)} className="text-sm font-medium text-amber-600 hover:text-amber-700">
                        Clear Results
                      </button>
                    </div>

                    {buyerSearchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {buyerSearchResults.map((property) => (
                          <PropertyCard key={property._id || property.id} property={property} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                        <p className="text-lg text-slate-500 font-medium">No properties matched your specific search.</p>
                        <p className="text-slate-400 mt-2">Try broadening your criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommended Properties */}
              <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">✨ Recommended For You</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {getBuyerRecommendations().map((property) => (
                      <PropertyCard key={property._id || property.id} property={property} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== SELLER HOMEPAGE ========== */}
          {user.role === "seller" && (
            <>
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                        Welcome back, {user.name.split(" ")[0]}! 🎯
                      </h2>
                      <p className="text-green-100 text-sm sm:text-base">
                        Manage your listings and connect with buyers
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowAddProperty(true)} 
                      className="px-6 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors shadow"
                    >
                      ➕ List New Property
                    </button>
                  </div>
                </div>
              </div>

              {/* Seller Statistics */}
              <div className="bg-white border-b border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{getSellerListings().length}</p>
                      <p className="text-sm text-gray-600 mt-1">Active Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Booking Requests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                         {getSellerListings().reduce((sum, p) => sum + (p.views || Math.floor(Math.random() * 50)), 0)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Total Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                         ${bookings.filter(b => b.status === "confirmed" || b.status === "completed").reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Requests */}
              <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📬 Recent Booking Requests</h3>
                  {bookings.length > 0 ? (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map((request) => (
                        <div key={request._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{request.buyer?.name || "Unknown Buyer"}</p>
                            <p className="text-sm text-gray-600">Interested in {request.property?.title || "Property"}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              request.status === "confirmed" 
                                ? "bg-green-100 text-green-700" 
                                : request.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : request.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {request.status.toUpperCase()}
                            </span>
                            <Link to={`/admin/bookings`} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                              Manage
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No booking requests yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Your Listings */}
              <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🏘️ Your Active Listings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {getSellerListings().map((property) => (
                      <div key={property._id || property.id} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="relative h-48 bg-gray-300">
                          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✓ Active
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900">{property.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{property.location}</p>
                          <p className="text-lg font-bold text-green-600 mb-4">${property.price.toLocaleString()}</p>
                          <div className="flex gap-2">
                            <Link to={`/property/${property._id || property.id}`} className="flex-1 text-center py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm font-semibold">
                              View
                            </Link>
                            <Link to="/sell" className="flex-1 text-center py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-semibold">
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Property Modal */}
              <PropertyFormModal 
                isOpen={showAddProperty}
                onClose={() => setShowAddProperty(false)}
                onPropertyAdded={(newProp) => {
                  setShowAddProperty(false);
                  window.location.reload();
                }}
              />
            </>
          )}
        </>
      )}

      {/* ==================== UNAUTHENTICATED SECTIONS ==================== */}
      
      {!isAuthenticated && (
        <>
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pt-32 pb-24 sm:pt-40 sm:pb-32">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.05)_10px,rgba(255,255,255,.05)_20px)]"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                  Find Your <span className="text-amber-500">Dream Property</span>
                </h1>
                <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Discover the perfect home for your family. Browse thousands of properties to buy, rent, or sell with confidence.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-12">
                <SearchBar onSearch={handleSearch} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 py-8">
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-amber-500">
                    {allProperties.length}+
                  </p>
                  <p className="text-slate-300 text-sm sm:text-base mt-2">Properties Listed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-amber-500">
                    {new Set(properties.map((p) => p.location)).size}+
                  </p>
                  <p className="text-slate-300 text-sm sm:text-base mt-2">Locations</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-amber-500">4.6★</p>
                  <p className="text-slate-300 text-sm sm:text-base mt-2">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Properties */}
          {featuredProperties.length > 0 && (
            <div className="bg-white py-16 sm:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <span className="inline-block text-amber-600 text-sm font-semibold uppercase tracking-widest px-3 py-1 bg-amber-100 rounded-full mb-3">
                    Featured Properties
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-4">
                    Premium Listings
                  </h2>
                  <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
                    Handpicked properties that offer exceptional value and quality
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProperties.slice(0, 6).map((property) => (
                    <PropertyCard key={property._id || property.id} property={property} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Browse All Properties */}
          <div className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="inline-block text-slate-700 text-sm font-semibold uppercase tracking-widest px-3 py-1 bg-slate-200 rounded-full mb-3">
                  Browse Properties
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-4">
                  All Available Properties
                </h2>
                <p className="text-slate-600 mt-4 text-lg">
                  {filteredByType.length} properties found
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedType === "all"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  All Properties
                </button>
                <button
                  onClick={() => setSelectedType("buy")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedType === "buy"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  For Sale
                </button>
                <button
                  onClick={() => setSelectedType("rent")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedType === "rent"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  For Rent
                </button>
              </div>

              {/* Properties Grid */}
              {filteredByType.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-6">
                  {filteredByType.map((property) => (
                    <PropertyCard key={property._id || property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <svg
                    className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No properties found
                  </h3>
                  <p className="text-slate-600">
                    Try adjusting your search filters or browse all properties
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
                Sign up now and start your property journey. Whether buying, renting, or selling.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="px-8 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-lg">
                  Get Started
                </Link>
                <Link to="/login" className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Featured Properties Section */}
      {featuredProperties.length > 0 && (
        <div className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-amber-600 text-sm font-semibold uppercase tracking-widest px-3 py-1 bg-amber-100 rounded-full mb-3">
                Featured Properties
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-4">
                Premium Listings
              </h2>
              <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
                Handpicked properties that offer exceptional value and quality
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.slice(0, 6).map((property) => (
                <PropertyCard key={property._id || property.id} property={property} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Properties Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-slate-700 text-sm font-semibold uppercase tracking-widest px-3 py-1 bg-slate-200 rounded-full mb-3">
              Browse Properties
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-4">
              All Available Properties
            </h2>
            <p className="text-slate-600 mt-4 text-lg">
              {filteredByType.length} properties found
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedType === "all"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                  : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              All Properties
            </button>
            <button
              onClick={() => setSelectedType("buy")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedType === "buy"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                  : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              For Sale
            </button>
            <button
              onClick={() => setSelectedType("rent")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedType === "rent"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                  : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              For Rent
            </button>
          </div>

          {/* Properties Grid */}
          {filteredByType.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-6">
              {filteredByType.map((property) => (
                <PropertyCard key={property._id || property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No properties found
              </h3>
              <p className="text-slate-600">
                Try adjusting your search filters or browse all properties
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
            {isAuthenticated 
              ? "Explore our full selection or list your own property"
              : "Sign up now and start your property journey"}
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-lg">
                Get Started
              </Link>
              <Link to="/login" className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-lg">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;