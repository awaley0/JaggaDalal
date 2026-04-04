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
    <div className="bg-linear-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      {isAuthenticated && user?.role === "buyer" && (
        <>
          <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-blue-900 to-cyan-800 pt-10 pb-14">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#ffffff_0%,transparent_45%)]" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100 mb-4">
                    Buyer Dashboard
                  </p>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-3 tracking-tight leading-tight">
                    Welcome back, {(user.name || "User").split(" ")[0]}!
                  </h2>
                  <p className="text-slate-100/95 text-sm sm:text-base leading-relaxed">
                    Explore verified listings, monitor your booking activity, and continue your property journey with confidence.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <Link to="/favorites" className="px-6 py-2.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/10 text-center">
                    My Favorites
                  </Link>
                  <Link to="/chat" className="px-6 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/30 text-center">
                    Messages
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-b border-slate-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-3xl font-semibold text-slate-900">{allProperties.length}</p>
                <p className="text-sm text-slate-600 mt-1">Available Properties</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-3xl font-semibold text-slate-900">{bookings.length}</p>
                <p className="text-sm text-slate-600 mt-1">Active Bookings</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-3xl font-semibold text-slate-900">{locationsCount}</p>
                <p className="text-sm text-slate-600 mt-1">Locations</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-3xl font-semibold text-slate-900">{avgRating}<span className="text-amber-500">★</span></p>
                <p className="text-sm text-slate-600 mt-1">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 py-14">
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
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommended For You</h3>
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
          <div className="bg-linear-to-r from-green-600 via-emerald-500 to-teal-500 pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Welcome back, {(user.name || "Seller").split(" ")[0]}!
                </h2>
                <p className="text-green-100 text-sm sm:text-base">Manage listings and bookings in one place.</p>
              </div>
              <button onClick={() => setShowAddProperty(true)} className="px-6 py-2 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors shadow">
                List New Property
              </button>
            </div>
          </div>

          <div className="bg-white border-b border-gray-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{sellerListings.length}</p>
                <p className="text-sm text-gray-600 mt-1">Active Listings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                <p className="text-sm text-gray-600 mt-1">Booking Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{sellerReviewCount}</p>
                <p className="text-sm text-gray-600 mt-1">Total Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{formatRs(sellerRevenue)}</p>
                <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Active Listings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sellerListings.map((property) => (
                  <div key={property._id || property.id} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-gray-300">
                      <img
                        src={property.images?.[0] || property.image || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900">{property.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{property.location}</p>
                      <p className="text-lg font-bold text-green-600 mb-4">{formatRs(property.price)}</p>
                      <Link to={`/property/${property._id || property.id}`} className="inline-block w-full text-center py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-semibold">
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
          <div className="relative bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 pt-32 pb-24 sm:pt-40 sm:pb-32">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                  Find Your <span className="text-amber-500">Dream Property</span>
                </h1>
                <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
                  Search real-time property listings and book visits confidently.
                </p>
              </div>

              <div className="max-w-2xl mx-auto mb-12">
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
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedType === "all"
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  All Properties
                </button>
                <button
                  onClick={() => setSelectedType("sell")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedType === "sell"
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

          <div className="bg-linear-to-r from-slate-900 to-slate-800 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">Create an account and begin your property journey.</p>
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
    </div>
  );
};

export default Home;
