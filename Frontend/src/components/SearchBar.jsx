import { useState } from "react";

const SearchBar = ({ onSearch, defaultListingType = "", hideListingType = false }) => {
  const [location, setLocation] = useState("");
  const [type, setType] = useState(defaultListingType);
  const [propertyType, setPropertyType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fieldClass =
    "search-field w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all outline-none text-slate-900 placeholder-slate-400 bg-white";

  const filterGridClass = hideListingType
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      await Promise.resolve(
        onSearch({
          location,
          type,
          propertyType,
          priceMin,
          priceMax,
          minBedrooms,
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
    setPriceMin("");
    setPriceMax("");
    setMinBedrooms("");
    onSearch({
      location: "",
      type: defaultListingType,
      propertyType: "",
      priceMin: "",
      priceMax: "",
      minBedrooms: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="searchbar-form bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-6 max-w-5xl w-full mx-auto border border-white/50"
    >
      <div className="mb-4">
        <p className="text-xs sm:text-sm uppercase tracking-wide text-slate-500 font-semibold">
          Search Filters
        </p>
      </div>

      <div className={filterGridClass}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Location
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-3.5 w-5 h-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Enter location"
              className={`${fieldClass} pl-10`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {!hideListingType && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Listing Type
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-amber-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4v4"
                />
              </svg>
              <select
                className={`${fieldClass} pl-10 appearance-none`}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">All Listings</option>
                <option value="sell">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Property Category
          </label>
          <select
            className={`${fieldClass} appearance-none`}
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

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              className={`${fieldClass} px-3`}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              className={`${fieldClass} px-3`}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Min Bedrooms
          </label>
          <input
            type="number"
            min="0"
            placeholder="Any"
            className={fieldClass}
            value={minBedrooms}
            onChange={(e) => setMinBedrooms(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2 sm:items-center">
        <button
          type="submit"
          disabled={isSearching}
          className="search-btn flex-1 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-75 disabled:cursor-not-allowed"
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
                className="w-5 h-5 transition-transform duration-300"
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
          className="sm:w-auto py-2.5 px-4 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors duration-200 hover:border-slate-400"
          title="Reset filters"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default SearchBar;