import { useState, useEffect } from "react";
import PropertyCard from "../components/PropertyCard";
import SearchBar from "../components/SearchBar";
import { getAllProperties } from "../api/propertyApi";
import * as fallbackModule from "../data/properties";

const Buy = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch properties from API
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllProperties({ 
        // Backend uses listingType: sell | rent
        // Buy page should show listings available for purchase.
        listingType: "sell",
        limit: 100 
      });
      if (response.success && response.data) {
        setAllProperties(response.data);
        setFilteredProperties(response.data);
      } else {
        // Use fallback data
        const buyProperties = (fallbackModule.default || []).filter(
          (p) => p.listingType === "sell" || p.listingType === "buy" || p.type === "buy"
        );
        setAllProperties(buyProperties);
        setFilteredProperties(buyProperties);
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
      // Use fallback data on error
      const buyProperties = (fallbackModule.default || []).filter(
        (p) => p.listingType === "sell" || p.listingType === "buy" || p.type === "buy"
      );
      setAllProperties(buyProperties);
      setFilteredProperties(buyProperties);
      setError("Showing cached properties. Unable to fetch latest listings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters) => {
    let result = allProperties;

    if (filters.location) {
      result = result.filter(p =>
        p.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.type && filters.type !== "") {
      // SearchBar sends buy/rent. On Buy page, buy maps to sell listings.
      const normalizedListingType =
        filters.type === "buy" ? "sell" : filters.type;

      result = result.filter(
        (p) =>
          p.listingType === normalizedListingType ||
          p.listingType === filters.type ||
          p.propertyType === filters.type ||
          p.type === filters.type
      );
    }

    setFilteredProperties(result);
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
              Find Your Perfect <span className="text-blue-500">Home to Buy</span>
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Explore thousands of properties available for purchase. Find your dream home with our comprehensive listings.
            </p>

            <div className="max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-slate-600">No properties available for purchase.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard 
                key={property._id || property.id} 
                property={property} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Buy;