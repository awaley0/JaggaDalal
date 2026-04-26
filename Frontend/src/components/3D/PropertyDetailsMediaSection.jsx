import { useState } from 'react';
import Property360Viewer from "../components/3D/Property360Viewer";

/**
 * Enhanced Property Details Section with 360 Viewer
 * 
 * This component should be integrated into your PropertyDetails page
 * Replace the existing image gallery section with this
 */

export function PropertyDetailsMediaSection({ property }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or '360'
  const [selected360Room, setSelected360Room] = useState(0);

  // Extract regular images
  const regularImages = property?.images || [];
  
  // Extract 360 images (structured approach)
  const images360 = [
    { room: 'Living Room', url: property?.image360LivingRoom },
    { room: 'Master Bedroom', url: property?.image360Bedroom },
    { room: 'Kitchen', url: property?.image360Kitchen },
    { room: 'Exterior', url: property?.image360Exterior },
  ].filter(item => item.url); // Only include rooms with actual images

  const has360Images = images360.length > 0;

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode('gallery')}
          className={`px-4 py-3 font-semibold transition-all ${
            viewMode === 'gallery'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📷 Gallery
        </button>
        
        {has360Images && (
          <button
            onClick={() => setViewMode('360')}
            className={`px-4 py-3 font-semibold transition-all flex items-center gap-1 ${
              viewMode === '360'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔄 360° View
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              New!
            </span>
          </button>
        )}
      </div>

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video shadow-lg">
            <img
              src={
                regularImages[selectedImage] ||
                property?.thumbnail ||
                'https://via.placeholder.com/800x400?text=No+Image'
              }
              alt={`${property?.title} - Image ${selectedImage + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {selectedImage + 1} / {regularImages.length}
            </div>

            {/* Navigation Arrows */}
            {regularImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + regularImages.length) % regularImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % regularImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {regularImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {regularImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-blue-600 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 360 View */}
      {viewMode === '360' && has360Images && (
        <div className="space-y-4">
          {/* Room Selection Tabs */}
          <div className="flex gap-2 flex-wrap">
            {images360.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelected360Room(idx)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selected360Room === idx
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {item.room}
              </button>
            ))}
          </div>

          {/* 360 Viewer Component */}
          <Property360Viewer
            key={selected360Room} // Force re-render when room changes
            image360Url={images360[selected360Room].url}
            title={`${images360[selected360Room].room} - 360° View`}
            autoRotate={true}
            showControls={true}
            height="500px"
          />

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 How to Use</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ <strong>Mouse:</strong> Click and drag to rotate</li>
              <li>✓ <strong>Zoom:</strong> Scroll up/down or pinch to zoom</li>
              <li>✓ <strong>Fullscreen:</strong> Click the fullscreen icon</li>
              <li>✓ <strong>Mobile:</strong> Drag with two fingers to rotate</li>
            </ul>
          </div>
        </div>
      )}

      {/* No Images Message */}
      {regularImages.length === 0 && !has360Images && (
        <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center text-gray-500">
          <p className="text-center">
            <span className="text-4xl mb-2 block">🖼️</span>
            No images available for this property
          </p>
        </div>
      )}
    </div>
  );
}

export default PropertyDetailsMediaSection;
