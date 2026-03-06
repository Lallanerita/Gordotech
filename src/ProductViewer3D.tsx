import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function PhoneModel({ url, onLoaded }: { url: string; onLoaded?: (height: number) => void }) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const controlsActive = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (scene && groupRef.current) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // The model is ~36 units tall. Scale it so it fits nicely.
      // We want the phone to be about 1.8 units tall so it fully fits in viewport
      const desiredHeight = 1.8
      const scaleFactor = desiredHeight / size.y

      // Apply scale directly to scene
      scene.scale.setScalar(scaleFactor)
      // Re-center after scaling
      scene.position.set(
        -center.x * scaleFactor,
        -center.y * scaleFactor,
        -center.z * scaleFactor
      )

      onLoaded?.(desiredHeight)
    }
  }, [scene, onLoaded])

  // Gentle auto-rotation when idle
  useFrame((_, delta) => {
    if (groupRef.current && !controlsActive.current) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })

  // Track pointer interaction to pause rotation
  useEffect(() => {
    const onDown = () => {
      controlsActive.current = true
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
    const onUp = () => {
      idleTimer.current = setTimeout(() => { controlsActive.current = false }, 2500)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  return (
    <group ref={groupRef} rotation={[0, Math.PI + 0.3, 0]}>
      <primitive object={scene} />
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

export default function ProductViewer3D({ modelUrl }: { modelUrl: string; productName?: string }) {
  const [loaded, setLoaded] = useState(false)

  const handleLoaded = useCallback(() => {
    setLoaded(true)
  }, [])

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

      {!loaded && <LoadingSpinner />}

      <Canvas
        camera={{ position: [1, 0.5, 3.5], fov: 35 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
      >
        {/* Lighting - bright studio to show camera detail */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow />
        <directionalLight position={[-5, 5, -3]} intensity={1.2} />
        <directionalLight position={[0, -3, 5]} intensity={0.8} />
        <pointLight position={[3, 5, 3]} intensity={1.5} />
        <pointLight position={[-3, 3, -3]} intensity={0.8} />
        <pointLight position={[0, 0, 4]} intensity={0.6} />

        {/* Environment for realistic reflections */}
        <Suspense fallback={null}>
          <Environment preset="studio" />
        </Suspense>

        {/* Phone model */}
        <Suspense fallback={null}>
          <PhoneModel url={modelUrl} onLoaded={handleLoaded} />
        </Suspense>

        {/* Shadow below the phone */}
        <ContactShadows position={[0, -1.3, 0]} opacity={0.4} scale={4} blur={2} />

        {/* Orbit Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={7}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * 0.75}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
