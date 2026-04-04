import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function PropertyListMap({ properties = [], onPropertySelect }) {
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  const center = properties.length > 0 
    ? [properties[0].latitude || 51.505, properties[0].longitude || -0.09]
    : [51.505, -0.09];

  const getMarkerColor = (price) => {
    if (price > 500000) return '#EF4444';
    if (price > 300000) return '#F59E0B';
    return '#10B981';
  };

  const createDivIcon = (price) => {
    const color = getMarkerColor(price);
    return L.divIcon({
      html: `
        <div class="relative">
          <div style="background-color: ${color};" class="flex items-center justify-center w-14 h-10 rounded-full text-white text-xs font-bold shadow-lg border-2 border-white">
            £${(price / 1000).toFixed(0)}k
          </div>
        </div>
      `,
      iconSize: [56, 40],
      iconAnchor: [28, 40],
      className: 'custom-marker',
    });
  };

  return (
    <div className="w-full h-96 rounded-xl shadow-2xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={12} className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((property) => (
          <Marker
            key={property._id || property.id}
            position={[property.latitude || 51.505, property.longitude || -0.09]}
            icon={createDivIcon(property.price)}
            eventHandlers={{
              click: () => {
                setSelectedProperty(property);
                onPropertySelect?.(property);
              },
            }}
          >
            {(selectedProperty?._id || selectedProperty?.id) === (property._id || property.id) && (
              <Popup>
                <div className="p-4 w-80">
                  {property.image && (
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="font-bold text-gray-800 text-lg">{property.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{property.address}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-3">£{property.price.toLocaleString()}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-700">
                    <p>🛏️ {property.bedrooms} Beds</p>
                    <p>🚿 {property.bathrooms} Baths</p>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
