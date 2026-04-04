import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PropertyFormModal from "../components/PropertyFormModal";

const Sell = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [error, setError] = useState("");

  const handleOpenModal = () => {
    if (!isAuthenticated || !user) {
      setError("Please log in as a seller to list a property");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (user.role !== "seller" && user.role !== "admin") {
      setError("Only sellers can list properties. Please sign up as a seller.");
      return;
    }

    setShowAddProperty(true);
  };

  const handlePropertyAdded = (newProperty) => {
    setShowAddProperty(false);
    navigate("/seller/properties");
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.05)_10px,rgba(255,255,255,.05)_20px)]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              List Your Property & Sell{" "}
              <span className="text-amber-500">Faster</span>
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Reach thousands of serious buyers. Our platform helps you sell your property quickly
              with maximum exposure and fair pricing.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg max-w-md mx-auto">
                <p className="font-medium">✗ {error}</p>
              </div>
            )}

            <button 
              onClick={handleOpenModal}
              className="px-8 py-4 bg-amber-500 text-white font-bold rounded-xl text-lg hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30"
            >
              List a Property
            </button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 mt-12 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="inline-block p-3 bg-amber-500/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Quick Listing</h3>
              <p className="text-slate-300 text-sm">Get your property online in minutes</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-3 bg-emerald-500/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Qualified Buyers</h3>
              <p className="text-slate-300 text-sm">Connect with verified buyers only</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-3 bg-blue-500/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">24/7 Support</h3>
              <p className="text-slate-300 text-sm">Expert support when you need it</p>
            </div>
          </div>
        </div>
      </div>

      <PropertyFormModal 
        isOpen={showAddProperty}
        onClose={() => setShowAddProperty(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </div>
  );
};

export default Sell;