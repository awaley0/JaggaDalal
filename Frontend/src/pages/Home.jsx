import { useState, useMemo } from "react";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import properties from "../data/properties";

const Home = () => {
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [selectedType, setSelectedType] = useState("all");

  const handleSearch = (filters) => {
    const result = properties.filter((property) => {
      return (
        (filters.location === "" ||
          property.location.toLowerCase().includes(filters.location.toLowerCase())) &&
        (filters.type === "" || property.type === filters.type)
      );
    });
    setFilteredProperties(result);
  };

  const featuredProperties = useMemo(
    () => properties.filter((p) => p.featured),
    []
  );

  const filteredByType = useMemo(() => {
    if (selectedType === "all") return filteredProperties;
    return filteredProperties.filter((p) => p.type === selectedType);
  }, [filteredProperties, selectedType]);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pt-20 pb-16 sm:pt-32 sm:pb-24">
        {/* Overlay Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.05)_10px,rgba(255,255,255,.05)_20px)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Find Your{" "}
              <span className="text-amber-500">Dream Property</span>
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover the perfect home for your family. Browse thousands of properties
              to buy, rent, or sell with confidence.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 py-8 mt-8">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-amber-500">
                {properties.length}+
              </p>
              <p className="text-slate-300 text-sm sm:text-base mt-2">
                Properties Listed
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-amber-500">
                {new Set(properties.map((p) => p.location)).size}+
              </p>
              <p className="text-slate-300 text-sm sm:text-base mt-2">
                Locations
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-amber-500">
                4.6★
              </p>
              <p className="text-slate-300 text-sm sm:text-base mt-2">
                Avg Rating
              </p>
            </div>
          </div>
        </div>
      </div>

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
                <PropertyCard key={property.id} property={property} />
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
                <PropertyCard key={property.id} property={property} />
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
            Can't find what you're looking for?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
            Post your property or get personalized recommendations from our agents
          </p>
          <button className="px-8 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-all duration-300 shadow-lg shadow-amber-500/30">
            Post Property
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;