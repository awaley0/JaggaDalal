import React, { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const LocationPicker = ({ 
  onLocationChange, 
  initialLatitude = 28.7041, 
  initialLongitude = 77.1025,
  initialAddress = "New Delhi, India"
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add draggable marker
      markerRef.current = L.marker([latitude, longitude], { draggable: true })
        .addTo(mapInstanceRef.current)
        .bindPopup("Drag me to set location");

      // Handle marker drag
      markerRef.current.on("dragend", () => {
        const newLatLng = markerRef.current.getLatLng();
        setLatitude(newLatLng.lat);
        setLongitude(newLatLng.lng);
        reverseGeocode(newLatLng.lat, newLatLng.lng);
      });
    } else {
      // Update marker position if initial coordinates change
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }
  }, []);

  // Search for address using Nominatim API
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Address search error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setAddress(data.address?.road || data.address?.name || `${lat}, ${lng}`);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  // Handle address input change
  const handleAddressChange = (e) => {
    const query = e.target.value;
    setAddress(query);
    if (query.length >= 3) {
      searchAddress(query);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const newLat = parseFloat(suggestion.lat);
    const newLng = parseFloat(suggestion.lon);
    
    setAddress(suggestion.display_name);
    setLatitude(newLat);
    setLongitude(newLng);
    setShowSuggestions(false);
    setSuggestions([]);

    // Update map and marker
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], 15);
      markerRef.current.setLatLng([newLat, newLng]);
    }

    // Notify parent component
    notifyChange(newLat, newLng, suggestion.display_name);
  };

  // Notify parent of location change
  const notifyChange = (lat, lng, addr) => {
    if (onLocationChange) {
      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: addr,
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      });
    }
  };

  // Handle Get My Location button
  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat);
          setLongitude(lng);
          
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            markerRef.current.setLatLng([lat, lng]);
          }
          
          reverseGeocode(lat, lng);
          notifyChange(lat, lng, address);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Property Location
        </label>
        
        {/* Address Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="Search address or drag marker on map"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleGetMyLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              📍 My Location
            </button>
          </div>

          {/* Address Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-100 border-b last:border-b-0 transition"
                >
                  <div className="text-sm font-medium text-gray-800">{suggestion.name}</div>
                  <div className="text-xs text-gray-600">{suggestion.display_name.split(", ").slice(0, 3).join(", ")}</div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50">
              <p className="text-sm text-gray-600">Searching addresses...</p>
            </div>
          )}
        </div>

        {/* Coordinates Display */}
        <div className="text-xs text-gray-500 mt-1">
          Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Search for an address above or drag the marker on the map to set the exact property location.
        </p>
      </div>
    </div>
  );
};

export default LocationPicker;
