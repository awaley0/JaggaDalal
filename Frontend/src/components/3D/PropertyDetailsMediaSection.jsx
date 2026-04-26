import { useState } from 'react';
import Property360Viewer from "./Property360Viewer";

/**
 * Professional Property Details Media Section with 360 Panorama Viewer
 * Displays regular gallery and 360° panoramic images
 */

export function PropertyDetailsMediaSection({ property }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or '360'
  const [selected360Room, setSelected360Room] = useState(0);

  // Extract regular images
  const regularImages = property?.images || [];
  
  // Extract panorama images from property data
  const panoramaImages = property?.panoramaImages?.map((url, idx) => ({
    room: property?.panoramaLabels?.[idx] || `Room ${idx + 1}`,
    url: url
  })) || [];

  const has360Images = panoramaImages.length > 0;

  return (
    <div className="space-y-6">
      {/* View Mode Tabs - Professional Design */}
      {(regularImages.length > 0 || has360Images) && (
        <div className="flex items-center gap-4 border-b-2 border-gray-200">
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'gallery'
                ? 'text-blue-600 border-b-4 border-blue-600 -mb-0.5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">📷</span>
            Gallery
          </button>
          
          {has360Images && (
            <button
              onClick={() => setViewMode('360')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                viewMode === '360'
                  ? 'text-blue-600 border-b-4 border-blue-600 -mb-0.5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">🔄</span>
              360° Panorama
            </button>
          )}
        </div>
      )}

      {/* Gallery View */}
      {viewMode === 'gallery' && regularImages.length > 0 && (
        <div className="space-y-4">
          {/* Main Image - Professional Display */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video shadow-2xl">
            <img
              src={regularImages[selectedImage]}
              alt={`${property?.title} - Image ${selectedImage + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Image Counter - Subtle Design */}
            {regularImages.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold">
                {selectedImage + 1} / {regularImages.length}
              </div>
            )}

            {/* Navigation Arrows - Sleek Design */}
            {regularImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + regularImages.length) % regularImages.length)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur text-white rounded-full w-12 h-12 flex items-center justify-center transition-all shadow-lg text-2xl"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % regularImages.length)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur text-white rounded-full w-12 h-12 flex items-center justify-center transition-all shadow-lg text-2xl"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Gallery - Professional Grid */}
          {regularImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {regularImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all ${
                    selectedImage === idx
                      ? 'border-blue-600 ring-2 ring-blue-400 shadow-lg'
                      : 'border-gray-300 hover:border-gray-500 opacity-70 hover:opacity-100'
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

      {/* 360 Panorama View - Professional Design */}
      {viewMode === '360' && has360Images && (
        <div className="space-y-6">
          {/* Room Selection Tabs */}
          <div className="flex gap-2 flex-wrap">
            {panoramaImages.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelected360Room(idx)}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                  selected360Room === idx
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {item.room}
              </button>
            ))}
          </div>

          {/* 360 Viewer Component - Professional Container */}
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-800">
            <Property360Viewer
              key={selected360Room}
              image360Url={panoramaImages[selected360Room].url}
              title={`${panoramaImages[selected360Room].room}`}
              autoRotate={true}
              showControls={true}
              height="550px"
            />
          </div>

          {/* Info Box - Helpful Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              How to Use 360° Panorama View
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-lg">🖱️</span>
                <div>
                  <strong>Desktop:</strong> Drag to rotate the view
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">🔍</span>
                <div>
                  <strong>Zoom:</strong> Scroll wheel or pinch to zoom
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">📱</span>
                <div>
                  <strong>Mobile:</strong> Swipe to rotate, pinch to zoom
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">⛶</span>
                <div>
                  <strong>Fullscreen:</strong> Click fullscreen button
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Professional Message */}
      {regularImages.length === 0 && !has360Images && (
        <div className="bg-gray-50 rounded-2xl h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📷</span>
            <p className="text-gray-600 font-semibold">No images available</p>
            <p className="text-gray-500 text-sm">Images will appear here once added</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetailsMediaSection;
