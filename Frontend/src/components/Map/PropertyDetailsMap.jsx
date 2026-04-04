import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const PropertyDetailsMap = ({ 
  latitude = 28.7041, 
  longitude = 77.1025,
  address = "New Delhi, India",
  propertyTitle = "Property"
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add marker for property location
      L.marker([latitude, longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="font-semibold text-gray-800">${propertyTitle}</div>
          <div class="text-sm text-gray-600 mt-1">${address}</div>
        `)
        .openPopup();

      // Add a circle to show approximate property area
      L.circle([latitude, longitude], {
        color: "blue",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        radius: 100, // 100 meters
      }).addTo(mapInstanceRef.current);
    } else {
      // Update map view if coordinates change
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, address, propertyTitle]);

  return (
    <div className="space-y-4 relative z-10">
      <div className="bg-white rounded-lg shadow-md p-4 relative z-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">📍 Property Location</h3>
        
        {/* Map Container */}
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "400px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            marginBottom: "1rem",
            position: "relative",
            zIndex: 10,
          }}
        />

        {/* Address Information */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-1">Address</p>
          <p className="text-sm text-gray-600">{address}</p>
          <div className="text-xs text-gray-500 mt-2">
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
        </div>

        {/* Directions Link */}
        <div className="mt-3">
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
          >
            🗺️ Get Directions
          </a>
        </div>
      </div>

      {/* Nearby Amenities Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 relative z-10">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Drag the map to explore the area around this property. Search for nearby amenities, schools, and transport.
        </p>
      </div>
    </div>
  );
};

export default PropertyDetailsMap;
