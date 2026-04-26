import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { addFavorite, removeFavorite, isFavorited } from "../api/favoriteApi";
import { useAuth } from "../context/AuthContext";
import { formatRs } from "../utils/currency";

const PropertyCard = ({ property }) => {
  const { isAuthenticated } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const propertyStatus = String(property.status || "available").toLowerCase();
  const isUnavailable = propertyStatus !== "available";
  const statusLabel =
    propertyStatus === "sold"
      ? "Sold"
      : propertyStatus === "rented"
      ? "Rented"
      : propertyStatus === "inactive"
      ? "Inactive"
      : "Available";

  // Load favorite status on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated && property._id) {
        try {
          const favorited = await isFavorited(property._id);
          setIsFav(favorited);
        } catch (err) {
          console.error("Error checking favorite status:", err);
        }
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, property._id]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert("Please log in to add favorites!");
      return;
    }

    setLoading(true);
    try {
      if (isFav) {
        // Remove from favorites
        await removeFavorite(property._id);
        setIsFav(false);
      } else {
        // Add to favorites
        await addFavorite(property._id);
        setIsFav(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/property/${property._id || property.id}`} className="group">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-amber-300 hover:shadow-xl transition-all duration-300 hover:shadow-amber-500/10">
        {/* Image Container */}
        <div className="relative h-56 bg-slate-100 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-linear-to-r from-slate-200 to-slate-100 animate-pulse"></div>
          )}
          <img
            src={property.images?.[0] || property.image || "https://via.placeholder.com/400x300?text=No+Image"}
            alt={property.title}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isUnavailable && (
              <span className="px-3 py-1 bg-linear-to-r from-rose-600 to-red-600 text-white text-xs font-semibold rounded-full shadow-lg">
                {statusLabel}
              </span>
            )}
            {property.featured && (
              <span className="px-3 py-1 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Featured
              </span>
            )}
            {property.verified && (
              <span className="px-3 py-1 bg-linear-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute top-3 right-3 p-2 rounded-full bg-white hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                isFav ? "fill-amber-500 text-amber-500" : "text-slate-400"
              }`}
              fill={isFav ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isFav ? 0 : 2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Property Type Badge */}
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full capitalize shadow-lg">
              {property.listingType || property.type || "Property"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-slate-600 text-sm mb-3">
            <svg className="w-4 h-4 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{property.location}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(property.rating)
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-slate-600">
              ({property.reviews} reviews)
            </span>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-slate-200">
            <div className="text-center">
              <svg className="w-4 h-4 text-amber-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4" />
              </svg>
              <p className="text-xs text-slate-500">Beds</p>
              <p className="font-semibold text-slate-900">{property.bedrooms}</p>
            </div>
            <div className="text-center">
              <svg className="w-4 h-4 text-amber-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <p className="text-xs text-slate-500">Baths</p>
              <p className="font-semibold text-slate-900">{property.bathrooms}</p>
            </div>
            <div className="text-center">
              <svg className="w-4 h-4 text-amber-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="text-xs text-slate-500">Sqft</p>
              <p className="font-semibold text-slate-900">{typeof property.area === 'object' ? (property.area?.value || property.area?.area) : property.area}</p>
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <p className="text-2xl font-bold text-slate-900">{formatRs(property.price)}</p>
            {property.pricePerMonth && (
              <p className="text-sm text-slate-500">{formatRs(property.pricePerMonth)}/month</p>
            )}
          </div>

          {/* Amenities Preview */}
          <div className="mb-4">
            <p className="text-xs text-slate-600 mb-2 font-semibold">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {(property.amenities || []).slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full border border-slate-200"
                >
                  {amenity}
                </span>
              ))}
              {(property.amenities || []).length > 3 && (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full border border-slate-200">
                  +{(property.amenities || []).length - 3}
                </span>
              )}
            </div>
          </div>

          {/* View Details Button */}
          <button className="w-full py-2.5 bg-linear-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 hover:shadow-lg hover:shadow-slate-900/30">
            View Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;