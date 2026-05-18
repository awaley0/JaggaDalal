import { useState } from "react";

const SearchBar = ({ onSearch, defaultListingType = "", hideListingType = false }) => {
  const [location, setLocation] = useState("");
  const [type, setType] = useState(defaultListingType);
  const [propertyType, setPropertyType] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fieldClass =
    "w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-slate-900 placeholder-slate-400 bg-white hover:border-slate-400";

  const filterGridClass = hideListingType
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 md:grid-cols-3 gap-4";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      await Promise.resolve(
        onSearch({
          location,
          type,
          propertyType,
        })
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setLocation("");
    setType(defaultListingType);
    setPropertyType("");
    onSearch({
      location: "",
      type: defaultListingType,
      propertyType: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="searchbar-form w-full max-w-5xl mx-auto"
    >
      {/* Main Search Container */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
        
        {/* Header Section */}
        <div className="px-6 sm:px-8 pt-6 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            Find Your Perfect Property
          </h2>
          <p className="text-sm text-slate-600">
            Search by area and listing intent to quickly discover homes that match your plans.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>

        {/* Search Filters */}
        <div className="px-6 sm:px-8 py-6">
          <div className={filterGridClass}>
            {/* Location Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </label>
              <input
                type="text"
                placeholder="Enter location"
                className={fieldClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Listing Type Field */}
            {!hideListingType && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4" />
                  </svg>
                  Listing Type
                </label>
                <select
                  className={`${fieldClass} appearance-none bg-right pr-10`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23334155' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">All Listings</option>
                  <option value="sell">Buy</option>
                  <option value="rent">Rent</option>
                </select>
              </div>
            )}

            {/* Property Type Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1M9 7a3 3 0 013-3h1a3 3 0 013 3m0 0a6 6 0 00-6 6v1m0 0a6 6 0 01-6-6v-1m6 6a6 6 0 006-6v-1m0 0c0-1.657-.895-3.107-2.175-3.897" />
                </svg>
                Property Type
              </label>
              <select
                className={`${fieldClass} appearance-none bg-right pr-10`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23334155' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
                <option value="condo">Condo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>

        {/* Action Buttons */}
        <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSearching}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-75 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-600/40"
          >
            {isSearching ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search Properties</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-6 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2"
            title="Reset filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;