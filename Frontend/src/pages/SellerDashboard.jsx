import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import SellerRoute from "../components/SellerRoute";
import PropertyFormModal from "../components/PropertyFormModal";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  // Fetch seller's properties
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/properties/seller/my-properties", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProperties(response.data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch properties");
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyAdded = (newProperty) => {
    setProperties([...properties, newProperty]);
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await axios.delete(`/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProperties(properties.filter((p) => p._id !== propertyId));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to delete property");
      }
    }
  };



  return (
    <SellerRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Properties</h1>
            <p className="text-gray-600">Manage your listings and bookings</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-600 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setShowAddProperty(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Add New Property
            </button>
          </div>

          <PropertyFormModal 
            isOpen={showAddProperty}
            onClose={() => setShowAddProperty(false)}
            onPropertyAdded={handlePropertyAdded}
          />

          {/* Properties List */}
          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 mt-4">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No properties yet. Start by adding one!</p>
              <button
                onClick={() => setShowAddProperty(true)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{property.location}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        ${property.price.toLocaleString()}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                        {property.category}
                      </span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {property.bedrooms && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">{property.bedrooms}</span>
                          <span className="ml-1">bed</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">{property.bathrooms}</span>
                          <span className="ml-1">bath</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/property/${property._id}`)}
                        className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property._id)}
                        className="py-2 px-4 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerRoute>
  );
};

export default SellerDashboard;
