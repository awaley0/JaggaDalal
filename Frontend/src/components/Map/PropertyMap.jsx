import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function PropertyMap({ latitude, longitude, propertyName, address }) {
  const position = [latitude || 51.505, longitude || -0.09];

  const customMarker = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMjU2RWZmIi8+PGNpcmNsZSBjeD0iMTYiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow">
      <MapContainer center={position} zoom={13} className="w-full h-full" zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customMarker}>
          <Popup className="custom-popup">
            <div className="p-3 min-w-56">
              <h3 className="font-bold text-gray-800 text-lg">{propertyName}</h3>
              <p className="text-sm text-gray-600 mt-1">{address}</p>
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-700">
                <p>📍 Latitude: {latitude?.toFixed(4)}</p>
                <p>📍 Longitude: {longitude?.toFixed(4)}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
