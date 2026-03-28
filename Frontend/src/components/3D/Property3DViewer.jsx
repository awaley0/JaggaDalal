import { Canvas } from '@react-three/fiber';
import { useState, Suspense } from 'react';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Html } from '@react-three/drei';

// Placeholder 3D Model Component
function Model3D() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  );
}

export default function Property3DViewer({ modelPath }) {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading
  setTimeout(() => setIsLoading(false), 2000);

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border border-gray-200 relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 5] }}>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          <Model3D />
          <Environment preset="apartment" />
        </Suspense>

        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={20}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={3}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
          minDistance={3}
          maxDistance={10}
        />

        {isLoading && (
          <Html center>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-blue-500 mb-3"></div>
              <p className="text-white font-semibold">Loading 3D Model...</p>
            </div>
          </Html>
        )}
      </Canvas>

      {/* Controls Overlay */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
          <button className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:shadow-xl transition font-semibold text-sm">
            🔄 Reset View
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:shadow-xl transition font-semibold text-sm">
            🚶 Walk Mode
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:shadow-xl transition font-semibold text-sm">
            📹 Record
          </button>
        </div>
      )}

      {/* Info Badge */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm font-semibold">
        🎮 Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
