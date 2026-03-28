import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import properties from "../data/properties";

const Favorites = () => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load favorites from localStorage or API
    const savedFavorites = localStorage.getItem(`favorites_${user?.id || 'guest'}`);
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Error loading favorites:", e);
      }
    }
    setLoading(false);
  }, [user?.id]);

  const getFavoriteProperties = () => {
    return properties.filter((p) => favorites.includes(p.id));
  };

  const toggleFavorite = (propertyId) => {
    setFavorites((prev) => {
      const updated = prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];
      
      localStorage.setItem(
        `favorites_${user?.id || 'guest'}`,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="py-16">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Login to view favorites</h2>
            <p className="text-slate-600">Click on the heart icon on any property to save it to your favorites</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  const favoriteProperties = getFavoriteProperties();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900">Your Favorites ❤️</h1>
          <p className="text-slate-600 mt-2">
            {favoriteProperties.length} property{favoriteProperties.length !== 1 ? "ies" : ""} saved
          </p>
        </div>

        {/* Properties Grid */}
        {favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteProperties.map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard property={property} />
                <button
                  onClick={() => toggleFavorite(property.id)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors z-10"
                >
                  <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No favorites yet</h3>
            <p className="text-slate-600">
              Save properties to your favorites by clicking the heart icon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
