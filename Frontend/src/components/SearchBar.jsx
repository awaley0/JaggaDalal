import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Simulate a slight delay for smooth feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onSearch({
      location,
      type,
    });
    
    setIsSearching(false);
  };

  const handleReset = () => {
    setLocation("");
    setType("");
    onSearch({ location: "", type: "" });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full border border-slate-200"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Location Input */}
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none text-slate-900 placeholder-slate-400"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Type Select */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Property Type
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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none text-slate-900 appearance-none bg-white"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 items-end">
          <button
            type="submit"
            disabled={isSearching}
            className="flex-1 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-75 disabled:cursor-not-allowed hover:scale-105 active:scale-95 search-btn"
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
                <span className="hidden sm:inline">Searching...</span>
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
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95 hover:border-slate-400"
            title="Reset filters"
          >
            <svg
              className="w-5 h-5 transition-transform duration-300 hover:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;