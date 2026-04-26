import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Property 360-Degree Viewer using Panellum
 * 
 * Features:
 * - Full 360-degree panoramic view
 * - Touch/mouse controls for rotation
 * - Zoom support
 * - Auto-rotation option
 * - Mobile responsive
 * 
 * Usage:
 * <Property360Viewer 
 *   image360Url="https://example.com/360-image.jpg"
 *   title="Living Room 360"
 * />
 */

export default function Property360Viewer({ 
  image360Url, 
  title = "Property 360 View",
  autoRotate = true,
  showControls = true,
  height = "400px"
}) {
  const containerId = useRef(`panorama-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Load Panellum library from CDN
    if (!window.pannellum) {
      const script = document.createElement('script');
      script.src = 'https://cdn.pannellum.org/2.5/pannellum.js';
      script.async = true;
      script.onload = initPanellum;
      document.body.appendChild(script);

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.pannellum.org/2.5/pannellum.css';
      document.head.appendChild(link);
    } else {
      initPanellum();
    }

    function initPanellum() {
      if (!image360Url) {
        console.warn('No 360 image URL provided');
        return;
      }

      try {
        window.pannellum.viewer(containerId.current, {
          type: 'equirectangular',
          panorama: image360Url,
          
          // View settings
          autoLoad: true,
          autoRotate: autoRotate ? -2 : 0, // Negative = counter-clockwise
          
          // Initial view
          pitch: 0,
          yaw: 0,
          hfov: 110,
          
          // Zoom limits
          minHfov: 50,
          maxHfov: 120,
          
          // Controls
          mouseZoom: true,
          showZoomCtrl: showControls,
          showFullscreenCtrl: showControls,
          showControls: showControls,
          
          // Responsive
          orientationOnByDefault: false,
          
          // Performance
          preview: null,
        });
      } catch (error) {
        console.error('Error initializing Panellum:', error);
      }
    }

    return () => {
      // Cleanup on unmount
      if (window.pannellum && window.pannellum.viewer) {
        try {
          const viewer = window.pannellum.viewer(containerId.current);
          if (viewer) {
            // Destroy viewer to free resources
            viewer.destroy?.();
          }
        } catch (e) {
          // Viewer might not exist
        }
      }
    };
  }, [image360Url, autoRotate, showControls]);

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg bg-gray-900 border border-gray-700">
      {/* Title */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 px-4 py-3 text-white font-semibold flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <span>{title}</span>
        <span className="text-xs ml-auto bg-blue-700 px-2 py-1 rounded">360°</span>
      </div>

      {/* Viewer Container */}
      <div
        id={containerId.current}
        style={{
          width: '100%',
          height: height,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      />

      {/* Instructions */}
      <div className="bg-gray-800 px-4 py-3 text-gray-300 text-sm flex gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span>🖱️</span>
          <span>Drag to rotate</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🔍</span>
          <span>Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <span>📱</span>
          <span>Two-finger touch to zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⛶</span>
          <span>Click fullscreen icon</span>
        </div>
      </div>
    </div>
  );
}

Property360Viewer.propTypes = {
  image360Url: PropTypes.string.isRequired,
  title: PropTypes.string,
  autoRotate: PropTypes.bool,
  showControls: PropTypes.bool,
  height: PropTypes.string,
};
