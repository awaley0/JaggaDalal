import { useState, useEffect } from "react";
import PropertyCard from "../components/PropertyCard";
import SearchBar from "../components/SearchBar";
import { getAllProperties } from "../api/propertyApi";
import * as fallbackModule from "../data/properties";

const buildRentFilters = (filters = {}) => {
  const filterObj = {
    listingType: "rent",
    limit: 100,
  };

  // Add optional filters only if they have values
  if (filters.location && filters.location.trim()) {
    filterObj.location = filters.location.trim();
  }
  if (filters.propertyType && filters.propertyType.trim()) {
    filterObj.propertyType = filters.propertyType.trim();
  }
  if (filters.priceMin && filters.priceMin !== "") {
    filterObj.priceMin = filters.priceMin;
  }
  if (filters.priceMax && filters.priceMax !== "") {
    filterObj.priceMax = filters.priceMax;
  }
  if (filters.minBedrooms && filters.minBedrooms !== "") {
    filterObj.minBedrooms = filters.minBedrooms;
  }

  return filterObj;
};

const Rent = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchFilters, setSearchFilters] = useState({ location: "", type: "" });
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch properties from API
  useEffect(() => {
    fetchProperties({});
  }, []);

  // Re-filter when search filters or price range changes
  useEffect(() => {
    applyFilters();
  }, [searchFilters, priceRange, allProperties]);

  const fetchProperties = async (filters = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllProperties(buildRentFilters(filters));
      if (response.success && response.data) {
        setAllProperties(response.data);
      } else {
        // Use fallback data
        const rentProperties = (fallbackModule.default || []).filter(
          (p) => (p.listingType === "rent" || p.type === "rent") && (p.status === undefined || p.status === "available")
        );
        setAllProperties(rentProperties);
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
      const rentProperties = (fallbackModule.default || []).filter(
        (p) => (p.listingType === "rent" || p.type === "rent") && (p.status === undefined || p.status === "available")
      );
      setAllProperties(rentProperties);
      setError("Showing cached properties. Unable to fetch latest listings.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = allProperties;

    // Filter by location
    if (searchFilters.location) {
      result = result.filter(p =>
        p.location?.toLowerCase().includes(searchFilters.location.toLowerCase())
      );
    }

    // Filter by property category
    if (searchFilters.propertyType && searchFilters.propertyType !== "") {
      result = result.filter(p => p.propertyType === searchFilters.propertyType || p.type === searchFilters.propertyType);
    }

    // Filter by price range
    result = result.filter(p => {
      const price = parseFloat(p.pricePerMonth || p.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    setFilteredProperties(result);
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    fetchProperties(filters);
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.05)_10px,rgba(255,255,255,.05)_20px)]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Find Your Perfect{" "}
              <span className="text-amber-500">Home to Rent or Buy</span>
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Explore thousands of properties in prime locations. Find your ideal home
              whether you are looking to rent or purchase.
            </p>

            <div className="max-w-5xl mx-auto">
              <SearchBar onSearch={handleSearch} defaultListingType="rent" hideListingType />
            </div>
          </div>

          {/* Quick Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 mt-8">
            <div className="text-center">
              <div className="inline-block p-3 bg-amber-500/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Verified Landlords</h3>
              <p className="text-slate-300 text-sm">All landlords are verified and screened</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-3 bg-emerald-500/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-slate-300 text-sm">No hidden fees or surprise charges</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-3 bg-blue-500/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Quick Response</h3>
              <p className="text-slate-300 text-sm">Get replies within 24 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Results */}
      <div className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="md:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-20">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Filters</h3>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Monthly Rent Range
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">${priceRange[0]}</span>
                      <span className="font-semibold text-slate-900">${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Amenities Filter */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    {["WiFi", "Furnished", "Pet-Friendly", "Parking", "Gym", "Pool"].map(
                      (amenity) => (
                        <label key={amenity} className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 accent-amber-500"
                          />
                          <span className="ml-2 text-sm text-slate-700">{amenity}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Property Type
                  </label>
                  <div className="space-y-2">
                    {["Apartment", "House", "Studio", "Penthouse"].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 accent-amber-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="flex-1">
              {error && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-slate-600 font-medium">
                      Showing <span className="text-slate-900 font-bold">{filteredProperties.length}</span> properties
                    </p>
                  </div>

                  {filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredProperties.map((property) => (
                        <PropertyCard 
                          key={property._id || property.id} 
                          property={property} 
                        />
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
                      <p className="text-slate-600 mb-6">
                        Try adjusting your filters to see more options
                      </p>
                      <button
                        onClick={() => {
                          setSearchFilters({ location: "", type: "" });
                          setPriceRange([0, 5000]);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all"
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Renting & Buying Guide</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Learn essential tips for finding the perfect property. Understand lease terms,
                tenant rights, and purchasing procedures.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verification Process</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                All properties and landlords are verified through our rigorous screening process to ensure safety
                and authenticity for all renters.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Need Help?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our support team is available 24/7 to assist you. Contact us via chat, email, or phone for
                any rental-related questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rent;