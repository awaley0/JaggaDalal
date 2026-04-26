import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import { getMyBookings, getSellerBookings } from "../api/bookingApi";
import {
  getAllProperties,
  getRecommendedProperties,
  getSellerProperties,
} from "../api/propertyApi";
import { saveUserSearch } from "../api/auth";
import PropertyFormModal from "../components/PropertyFormModal";
import { formatRs } from "../utils/currency";

const normalizeListingType = (value = "") => {
  if (!value) return "";
  return value.toLowerCase() === "buy" ? "sell" : value.toLowerCase();
};

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.properties)) return payload.properties;
  return [];
};

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const [buyerSearchResults, setBuyerSearchResults] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const propertiesRes = await getAllProperties({ limit: 100 });
        const properties = toArray(propertiesRes);
        setAllProperties(properties);
        setFilteredProperties(properties);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setAllProperties([]);
        setFilteredProperties([]);
        setFetchError("Could not load properties right now. Please refresh in a moment.");
      } finally {
        setLoading(false);
      }

      if (!isAuthenticated || !user) return;

      try {
        if (user.role === "buyer") {
          const [recommendedRes, myBookingsRes] = await Promise.all([
            getRecommendedProperties(),
            getMyBookings(),
          ]);
          setRecommendedProperties(toArray(recommendedRes));
          setBookings(myBookingsRes?.bookings || []);
        }

        if (user.role === "seller") {
          const [sellerBookingsRes, sellerPropertiesRes] = await Promise.all([
            getSellerBookings(),
            getSellerProperties(),
          ]);
          setBookings(sellerBookingsRes?.bookings || []);
          setSellerListings(toArray(sellerPropertiesRes));
        }
      } catch (error) {
        console.error("Failed to fetch role specific data:", error);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const handleSearch = (filters) => {
    const location = (filters.location || "").trim().toLowerCase();
    const listingType = normalizeListingType(filters.type);

    if (!location && !listingType) {
      setFilteredProperties(allProperties);
      if (isAuthenticated && user?.role === "buyer") setBuyerSearchResults(null);
    } else {
      const result = allProperties.filter((property) => {
        const propertyLocation = (property.location || "").toLowerCase();
        const propertyListingType = normalizeListingType(property.listingType);

        const locationMatch = !location || propertyLocation.includes(location);
        const typeMatch = !listingType || propertyListingType === listingType;

        return locationMatch && typeMatch;
      });

      setFilteredProperties(result);
      if (isAuthenticated && user?.role === "buyer") setBuyerSearchResults(result);
    }

    if (isAuthenticated && user?.role === "buyer") {
      saveUserSearch({ location: filters.location, type: listingType }).catch((err) => {
        console.error("Failed saving search:", err);
      });
    }
  };

  const featuredProperties = useMemo(
    () => allProperties.filter((p) => p.featured),
    [allProperties]
  );

  const filteredByType = useMemo(() => {
    if (selectedType === "all") return filteredProperties;
    return filteredProperties.filter(
      (p) => normalizeListingType(p.listingType) === selectedType
    );
  }, [filteredProperties, selectedType]);

  const avgRating = useMemo(() => {
    const rated = allProperties.filter((p) => Number(p.rating) > 0);
    if (rated.length === 0) return "0.0";
    const sum = rated.reduce((acc, p) => acc + Number(p.rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [allProperties]);

  const locationsCount = useMemo(
    () => new Set(allProperties.map((p) => (p.location || "").trim()).filter(Boolean)).size,
    [allProperties]
  );

  const buyerRecommended = useMemo(() => {
    if (recommendedProperties.length > 0) return recommendedProperties;
    return allProperties
      .filter((p) => ["sell", "rent"].includes(normalizeListingType(p.listingType)))
      .slice(0, 6);
  }, [recommendedProperties, allProperties]);

  const sellerRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + Number(b.price || 0), 0),
    [bookings]
  );

  const sellerReviewCount = useMemo(
    () => sellerListings.reduce((sum, p) => sum + Number(p.reviews || 0), 0),
    [sellerListings]
  );

  return (
    <div className="bg-linear-to-b from-zinc-50 via-white to-slate-100 min-h-screen">
      {isAuthenticated && user?.role === "buyer" && (
        <>
          <div className="relative overflow-hidden bg-linear-to-r from-slate-950 via-slate-900 to-indigo-900 pt-12 pb-16">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,#ffffff_0%,transparent_40%)]" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 right-0 w-72 h-72 bg-indigo-300/10 rounded-full blur-3xl" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100 mb-4 backdrop-blur-sm">
                    Buyer Dashboard
                  </p>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-3 tracking-tight leading-tight">
                    Welcome back, {(user.name || "User").split(" ")[0]}!
                  </h2>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl">
                    Explore verified listings, monitor your booking activity, and continue your property journey with confidence.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <Link to="/favorites" className="px-6 py-2.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-black/20 text-center">
                    My Favorites
                  </Link>
                  <Link to="/chat" className="px-6 py-2.5 bg-linear-to-r from-amber-400 to-orange-400 text-slate-900 font-semibold rounded-xl hover:from-amber-300 hover:to-orange-300 transition-colors shadow-lg shadow-amber-500/25 text-center">
                    Messages
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-b from-white to-slate-50 border-b border-slate-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-3xl font-semibold text-slate-900">{allProperties.length}</p>
                <p className="text-sm text-slate-600 mt-1">Available Properties</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-3xl font-semibold text-slate-900">{bookings.length}</p>
                <p className="text-sm text-slate-600 mt-1">Active Bookings</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-3xl font-semibold text-slate-900">{locationsCount}</p>
                <p className="text-sm text-slate-600 mt-1">Locations</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-3xl font-semibold text-slate-900">{avgRating}<span className="text-amber-500">★</span></p>
                <p className="text-sm text-slate-600 mt-1">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 py-14 border-y border-white/10">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_10%_20%,#22d3ee_0%,transparent_35%)]" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative z-10 max-w-4xl mx-auto text-center">
                <h3 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Find Your Perfect Property</h3>
                <p className="text-slate-300 mb-6">Search by area and listing intent to quickly discover homes that match your plans.</p>
                <SearchBar onSearch={handleSearch} />
              </div>
            </div>
          </div>

          {buyerSearchResults !== null && (
            <div className="bg-slate-50 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Your Search Results</h3>
                    <p className="text-slate-600 mt-1">Found {buyerSearchResults.length} matches</p>
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
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                    <p className="text-slate-500">No properties matched this search.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Recommended For You</h3>
              <p className="text-slate-600 mb-6">Fresh listings based on your recent browsing and preferences.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {buyerRecommended.map((property) => (
                  <PropertyCard key={property._id || property.id} property={property} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {isAuthenticated && user?.role === "seller" && (
        <>
          <div className="relative overflow-hidden bg-linear-to-r from-emerald-700 via-teal-600 to-cyan-600 pt-10 pb-14">
            <div className="absolute -top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Welcome back, {(user.name || "Seller").split(" ")[0]}!
                </h2>
                <p className="text-emerald-100 text-sm sm:text-base max-w-xl">Manage listings, booking requests, and performance metrics in one place.</p>
              </div>
              <button onClick={() => setShowAddProperty(true)} className="px-6 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg">
                List New Property
              </button>
            </div>
          </div>

          <div className="bg-linear-to-b from-white to-slate-50 border-b border-slate-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">{sellerListings.length}</p>
                <p className="text-sm text-slate-600 mt-1">Active Listings</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                <p className="text-sm text-slate-600 mt-1">Booking Requests</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-violet-600">{sellerReviewCount}</p>
                <p className="text-sm text-slate-600 mt-1">Total Reviews</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-orange-600">{formatRs(sellerRevenue)}</p>
                <p className="text-sm text-slate-600 mt-1">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-b from-slate-50 to-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Active Listings</h3>
              <p className="text-slate-600 mb-6">Quickly monitor and open your latest properties.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sellerListings.map((property) => (
                  <div key={property._id || property.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow">
                    <div className="relative h-48 bg-gray-300">
                      <img
                        src={property.images?.[0] || property.image || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-slate-900">{property.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{property.location}</p>
                      <p className="text-lg font-bold text-emerald-600 mb-4">{formatRs(property.price)}</p>
                      <Link to={`/property/${property._id || property.id}`} className="inline-block w-full text-center py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-semibold">
                        View Listing
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PropertyFormModal
            isOpen={showAddProperty}
            onClose={() => setShowAddProperty(false)}
            onPropertyAdded={() => window.location.reload()}
          />
        </>
      )}

      {!isAuthenticated && (
        <>
          <div className="relative bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-152 h-152 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-24 w-88 h-88 bg-amber-300/15 rounded-full blur-3xl" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                  Find Your <span className="text-amber-500">Dream Property</span>
                </h1>
                <p className="text-lg text-slate-200/95 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Search real-time property listings and book visits confidently.
                </p>
              </div>

              <div className="max-w-5xl mx-auto mb-12">
                <SearchBar onSearch={handleSearch} />
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-8 py-8">
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-amber-500">{allProperties.length}</p>
                  <p className="text-slate-300 text-sm sm:text-base mt-2">Properties Listed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-amber-500">{locationsCount}</p>
                  <p className="text-slate-300 text-sm sm:text-base mt-2">Locations</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-amber-500">{avgRating}★</p>
                  <p className="text-slate-300 text-sm sm:text-base mt-2">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>

          {fetchError && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {fetchError}
              </div>
            </div>
          )}

          {featuredProperties.length > 0 && (
            <div className="bg-white py-16 sm:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">Featured Properties</h2>
                  <p className="text-slate-600 mt-3">Handpicked verified listings from trusted sellers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProperties.slice(0, 6).map((property) => (
                    <PropertyCard key={property._id || property.id} property={property} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-linear-to-b from-slate-50 to-white py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">All Available Properties</h2>
                <p className="text-slate-600 mt-4 text-lg">{filteredByType.length} properties found</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedType === "all"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  All Properties
                </button>
                <button
                  onClick={() => setSelectedType("sell")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedType === "sell"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  For Sale
                </button>
                <button
                  onClick={() => setSelectedType("rent")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedType === "rent"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  For Rent
                </button>
              </div>

              {loading ? (
                <p className="text-center text-slate-500">Loading properties...</p>
              ) : filteredByType.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-6">
                  {filteredByType.map((property) => (
                    <PropertyCard key={property._id || property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-600">No properties found for this filter.</div>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 py-20 sm:py-32">
            {/* Animated gradient background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse" />
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,#22d3ee_0%,transparent_50%)]" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
              {/* Badge */}
              <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 mb-6 backdrop-blur-sm">
                <span className="text-amber-300 font-semibold text-sm tracking-wide">✨ Start Your Journey Today</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
                Ready to Find Your <span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Perfect Property</span>?
              </h2>

              {/* Subheading */}
              <p className="text-slate-300 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of verified users buying, selling, and renting properties with confidence. Start your real estate journey in minutes.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-12 max-w-2xl mx-auto">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">Quick Setup</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">100% Secure</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium">24/7 Support</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                <Link 
                  to="/signup" 
                  className="group relative px-8 sm:px-10 py-3.5 sm:py-4 bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-lg rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Create Account</span>
                </Link>

                <Link 
                  to="/login" 
                  className="group relative px-8 sm:px-10 py-3.5 sm:py-4 bg-white/10 text-white font-bold text-lg rounded-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </Link>
              </div>

              {/* Additional info */}
              <p className="text-slate-400 text-sm mt-8">
                First time here? <Link to="/signup" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">Sign up in seconds</Link> • Already have an account? <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">Log in</Link>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
