import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei'
import type { Group } from 'three'

function PhoneModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const ref = useRef<Group>(null)
  
  // Gentle auto-rotation when not interacting
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={ref}>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
    </group>
  )
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm">Cargando modelo 3D...</p>
    </div>
  )
}

export default function ProductViewer3D({ modelUrl, productName }: { modelUrl: string; productName: string }) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
      {/* 360 badge */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-blue-500/90 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
        </svg>
        Vista 360°
      </div>
      
      {/* Instruction hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white/70 text-xs backdrop-blur-sm pointer-events-none">
        Arrastra para rotar &bull; Pellizca para zoom
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.3} penumbra={1} />
          
          {/* Environment for reflections */}
          <Environment preset="city" />
          
          {/* Phone model */}
          <PhoneModel url={modelUrl} />
          
          {/* Shadow */}
          <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2.5} />
          
          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={false}
            makeDefault
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
