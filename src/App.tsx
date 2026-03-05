import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { MapPin, Smartphone, Wrench, Shield, Star, ChevronRight, Phone, Mail, Clock, Instagram, Facebook, MessageCircle, ArrowRight, Zap, Award, Truck, X, Menu, ShoppingCart, Heart, ArrowLeft, TrendingUp, Sparkles, Settings, ChevronLeft, ZoomIn } from 'lucide-react'
import AdminPanel from './AdminPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type City = 'duitama' | 'tunja' | null

type HeroSlide = {
  id: number
  title: string
  subtitle: string
  image: string
  link: string
  active: boolean
  sort_order: number
}

type MarqueeText = {
  id: number
  text: string
  active: boolean
  sort_order: number
}

// Product data - Semi-usados
const semiUsados = [
  // iPhone 12 Series
  { id: 101, name: 'iPhone 12', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=400&h=500&fit=crop', colors: ['#000000', '#FFFFFF', '#4169E1'] },
  { id: 102, name: 'iPhone 12 Mini', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=400&h=500&fit=crop', colors: ['#000000', '#F28B82', '#FFFFFF'] },
  { id: 103, name: 'iPhone 12 Pro', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400&h=500&fit=crop', colors: ['#4A4A4A', '#FFD700', '#1C1C1E'] },
  { id: 104, name: 'iPhone 12 Pro Max', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400&h=500&fit=crop', colors: ['#4A4A4A', '#FFD700', '#1C1C1E'] },
  // iPhone 13 Series
  { id: 105, name: 'iPhone 13', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F28B82', '#AECBFA'] },
  { id: 106, name: 'iPhone 13 Mini', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F28B82', '#FFFFFF'] },
  { id: 107, name: 'iPhone 13 Pro', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1638038772924-ef79cce2426d?w=400&h=500&fit=crop', colors: ['#4A4A4A', '#87CEEB', '#FFD700'] },
  { id: 108, name: 'iPhone 13 Pro Max', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1638038772924-ef79cce2426d?w=400&h=500&fit=crop', colors: ['#4A4A4A', '#87CEEB', '#FFD700'] },
  // iPhone 14 Series
  { id: 109, name: 'iPhone 14', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=500&fit=crop', colors: ['#000000', '#E3D0B9', '#F28B82'] },
  { id: 110, name: 'iPhone 14 Plus', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=500&fit=crop', colors: ['#000000', '#E3D0B9', '#AECBFA'] },
  { id: 111, name: 'iPhone 14 Pro', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#6B5B4F', '#F5F5DC'] },
  { id: 112, name: 'iPhone 14 Pro Max', storageOptions: ['128GB', '256GB', '512GB'], image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#6B5B4F', '#F5F5DC'] },
  // iPhone 15 Series
  { id: 113, name: 'iPhone 15', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=400&h=500&fit=crop', colors: ['#000000', '#F28B82', '#AECBFA'] },
  { id: 114, name: 'iPhone 15 Plus', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=400&h=500&fit=crop', colors: ['#000000', '#F28B82', '#AECBFA'] },
  { id: 115, name: 'iPhone 15 Pro', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F5F5DC', '#4A4A4A'] },
  { id: 116, name: 'iPhone 15 Pro Max', storageOptions: ['256GB', '512GB', '1TB'], image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F5F5DC', '#4A4A4A'] },
  // iPhone 16 Series
  { id: 117, name: 'iPhone 16', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#000000', '#AECBFA', '#F5F5DC'] },
  { id: 118, name: 'iPhone 16 Plus', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#000000', '#AECBFA', '#F5F5DC'] },
  { id: 119, name: 'iPhone 16 Pro', storageOptions: ['128GB', '256GB', '512GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#E3D0B9', '#F5F5DC'] },
  { id: 120, name: 'iPhone 16 Pro Max', storageOptions: ['256GB', '512GB', '1TB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#E3D0B9', '#F5F5DC'] },
  // iPhone 17 Series
  { id: 121, name: 'iPhone 17', storageOptions: ['256GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F5F5DC'] },
  { id: 122, name: 'iPhone Air', storageOptions: ['256GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F5F5DC', '#87CEEB'] },
  { id: 123, name: 'iPhone 17 Pro', storageOptions: ['256GB', '512GB', '1TB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#4A4A4A', '#F5F5DC'] },
  { id: 124, name: 'iPhone 17 Pro Max', storageOptions: ['256GB', '512GB', '1TB', '2TB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#4A4A4A', '#F5F5DC'] },
]

// Product data - Nuevos iPhones
const nuevos = [
  { id: 201, name: 'iPhone 14', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=500&fit=crop', colors: ['#000000', '#E3D0B9', '#F28B82'] },
  { id: 202, name: 'iPhone 15', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=400&h=500&fit=crop', colors: ['#000000', '#F28B82', '#AECBFA'] },
  { id: 203, name: 'iPhone 16', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#000000', '#AECBFA', '#F5F5DC'] },
  { id: 204, name: 'iPhone 17', storageOptions: ['256GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F5F5DC'] },
  { id: 205, name: 'iPhone Air', storageOptions: ['256GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#F5F5DC', '#87CEEB'] },
  { id: 206, name: 'iPhone 17 Pro', storageOptions: ['256GB', '512GB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#4A4A4A', '#F5F5DC'] },
  { id: 207, name: 'iPhone 17 Pro Max', storageOptions: ['256GB', '512GB', '1TB', '2TB'], image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop', colors: ['#1C1C1E', '#4A4A4A', '#F5F5DC'] },
]

// Product data - iPads Nuevas
const ipads = [
  { id: 301, name: 'iPad A16 128GB', storageOptions: ['128GB'], image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#87CEEB', '#FFD700'] },
  { id: 302, name: 'iPad A16 256GB', storageOptions: ['256GB'], image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#87CEEB', '#FFD700'] },
  { id: 303, name: 'iPad Air 11" M3', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#4A4A4A', '#E8D0AA'] },
  { id: 304, name: 'iPad Air 13" M3', storageOptions: ['128GB', '256GB'], image: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#4A4A4A', '#E8D0AA'] },
  { id: 305, name: 'iPad Pro 11"', storageOptions: ['256GB', '512GB', '1TB'], image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#1C1C1E'] },
  { id: 306, name: 'iPad Pro 13"', storageOptions: ['256GB', '512GB', '1TB'], image: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#1C1C1E'] },
]

// Product data - MacBook
const macbooks = [
  { id: 401, name: 'MacBook Air 13" M4', storageOptions: ['256GB/16GB'], image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#4A4A4A', '#E8D0AA', '#1C1C1E'] },
]

// Product data - AirPods
const airpods = [
  { id: 501, name: 'AirPods 4', storageOptions: [], image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=500&fit=crop', colors: ['#FFFFFF'] },
  { id: 502, name: 'AirPods 4 ANC', storageOptions: [], image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=500&fit=crop', colors: ['#FFFFFF'] },
  { id: 503, name: 'AirPods Pro 2', storageOptions: [], image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=500&fit=crop', colors: ['#FFFFFF'] },
  { id: 504, name: 'AirPods Pro 3', storageOptions: [], image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=500&fit=crop', colors: ['#FFFFFF'] },
]

// Product data - Apple Watch
const appleWatches = [
  { id: 601, name: 'Apple Watch SE2', storageOptions: ['42mm', '46mm'], image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#1C1C1E', '#E8D0AA'] },
  { id: 602, name: 'Apple Watch SE3', storageOptions: ['42mm', '46mm'], image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#1C1C1E', '#E8D0AA'] },
  { id: 603, name: 'Apple Watch Series 10', storageOptions: ['42mm', '46mm'], image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#1C1C1E', '#E8D0AA'] },
  { id: 604, name: 'Apple Watch Series 11', storageOptions: ['42mm', '46mm'], image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=500&fit=crop', colors: ['#C0C0C0', '#1C1C1E', '#4A4A4A'] },
  { id: 605, name: 'Apple Watch Ultra 2', storageOptions: ['49mm'], image: 'https://images.unsplash.com/photo-1694618432450-44056bd70e87?w=400&h=500&fit=crop', colors: ['#E8D0AA', '#1C1C1E'] },
  { id: 606, name: 'Apple Watch Ultra 3', storageOptions: ['49mm'], image: 'https://images.unsplash.com/photo-1694618432450-44056bd70e87?w=400&h=500&fit=crop', colors: ['#E8D0AA', '#1C1C1E'] },
]

// Product data - Accesorios
const accesorios = [
  { id: 701, name: 'Apple Pencil USB-C', storageOptions: [], image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=500&fit=crop', colors: ['#FFFFFF'] },
  { id: 702, name: 'Apple Pencil Pro', storageOptions: [], image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=500&fit=crop', colors: ['#FFFFFF'] },
]

// Build unified product list
type Product = {
  id: number
  name: string
  category: string
  condition: string
  image: string
  images: string[]
  colors: string[]
  storageOptions: string[]
  badge: string | null
  available: string[]
}

const products: Product[] = [
  ...nuevos.map(p => ({
    ...p,
    category: 'iphones',
    condition: 'Nuevo' as const,
    images: [p.image],
    badge: 'Nuevo' as string | null,
    available: ['duitama', 'tunja'],
  })),
  ...semiUsados.map(p => ({
    ...p,
    category: 'iphones',
    condition: 'Semi-usado' as const,
    images: [p.image],
    badge: null as string | null,
    available: ['duitama', 'tunja'],
  })),
  ...ipads.map(p => ({
    ...p,
    category: 'ipads',
    condition: 'Nuevo' as const,
    images: [p.image],
    badge: 'Nuevo' as string | null,
    available: ['duitama', 'tunja'],
  })),
  ...macbooks.map(p => ({
    ...p,
    category: 'macbook',
    condition: 'Nuevo' as const,
    images: [p.image],
    badge: 'Nuevo' as string | null,
    available: ['duitama', 'tunja'],
  })),
  ...airpods.map(p => ({
    ...p,
    category: 'airpods',
    condition: 'Nuevo' as const,
    images: [p.image],
    badge: 'Nuevo' as string | null,
    available: ['duitama', 'tunja'],
  })),
  ...appleWatches.map(p => ({
    ...p,
    category: 'apple-watch',
    condition: 'Nuevo' as const,
    images: [p.image],
    badge: 'Nuevo' as string | null,
    available: ['duitama', 'tunja'],
  })),
  ...accesorios.map(p => ({
    ...p,
    category: 'accesorios',
    condition: 'Nuevo' as const,
    images: [p.image],
    badge: null as string | null,
    available: ['duitama', 'tunja'],
  })),
]

const repairServices = [
  { icon: Smartphone, title: 'Cambio de Pantalla', description: 'Pantallas originales y compatibles para todos los modelos de iPhone', price: 'Desde $150.000' },
  { icon: Zap, title: 'Cambio de Bateria', description: 'Baterias de alta calidad con garantia de 6 meses', price: 'Desde $120.000' },
  { icon: Shield, title: 'Reparacion de Placa', description: 'Microelectronica avanzada para solucionar problemas de placa', price: 'Consultar' },
  { icon: Award, title: 'Diagnostico Gratis', description: 'Te decimos exactamente que tiene tu equipo sin costo alguno', price: 'Gratis' },
]


// City Selection Splash Screen
function CitySelector({ onSelect }: { onSelect: (city: City) => void }) {
  const [hoveredCity, setHoveredCity] = useState<City>(null)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(123,163,201,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(123,163,201,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>

      <div className={`relative z-10 text-center transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/gordotech-logo.png" alt="Gordotech Logo" className="w-48 md:w-64" />
          </div>
        </div>

        {/* Greeting */}
        <div className={`mb-12 transition-all duration-1000 delay-300 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <h2 className="text-2xl md:text-4xl text-white font-light mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            Hola
          </h2>
          <p className="text-gray-400 text-lg md:text-xl">En que ciudad te encuentras?</p>
        </div>

        {/* City Cards */}
        <div className={`flex flex-col sm:flex-row gap-6 justify-center transition-all duration-1000 delay-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Duitama */}
          <button
            onClick={() => onSelect('duitama')}
            onMouseEnter={() => setHoveredCity('duitama')}
            onMouseLeave={() => setHoveredCity(null)}
            className={`group relative w-72 p-8 rounded-3xl border transition-all duration-500 cursor-pointer ${
              hoveredCity === 'duitama'
                ? 'bg-blue-500/10 border-blue-400/50 scale-105 shadow-2xl shadow-blue-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <MapPin className={`w-10 h-10 mx-auto mb-4 transition-colors ${hoveredCity === 'duitama' ? 'text-blue-400' : 'text-gray-400'}`} />
            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>DUITAMA</h3>
            <div className="flex items-center justify-center gap-2 mt-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm">Explorar</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Tunja */}
          <button
            onClick={() => onSelect('tunja')}
            onMouseEnter={() => setHoveredCity('tunja')}
            onMouseLeave={() => setHoveredCity(null)}
            className={`group relative w-72 p-8 rounded-3xl border transition-all duration-500 cursor-pointer ${
              hoveredCity === 'tunja'
                ? 'bg-blue-500/10 border-blue-400/50 scale-105 shadow-2xl shadow-blue-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <MapPin className={`w-10 h-10 mx-auto mb-4 transition-colors ${hoveredCity === 'tunja' ? 'text-blue-400' : 'text-gray-400'}`} />
            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>TUNJA</h3>
            <div className="flex items-center justify-center gap-2 mt-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm">Explorar</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={`absolute bottom-8 text-gray-600 text-xs transition-all duration-1000 delay-700 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        <p>Gordotech &copy; 2024 &middot; Conectando tus suenos</p>
      </div>
    </div>
  )
}

// Main Store Component
// ==================== ANIMATED MARQUEE BANNER ====================
function AnimatedMarquee({ texts }: { texts: string[] }) {
  if (texts.length === 0) return null
  const marqueeContent = texts.join('  \u2022  ')
  const repeated = `${marqueeContent}  \u2022  `.repeat(4)
  
  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white overflow-hidden whitespace-nowrap relative" style={{ height: '36px' }}>
      <div className="absolute inset-0 flex items-center">
        <div className="animate-marquee inline-block" style={{ animationDuration: `${Math.max(20, texts.length * 12)}s` }}>
          <span className="text-xs md:text-sm font-medium tracking-wide">
            {repeated}
          </span>
        </div>
      </div>
    </div>
  )
}

// ==================== HERO SLIDESHOW ====================
function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((index: number) => {
    if (isTransitioning || index === current) return
    setIsTransitioning(true)
    setCurrent(index)
    setTimeout(() => setIsTransitioning(false), 700)
  }, [current, isTransitioning])

  const goNext = useCallback(() => {
    if (slides.length <= 1) return
    goTo((current + 1) % slides.length)
  }, [current, slides.length, goTo])

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return
    goTo((current - 1 + slides.length) % slides.length)
  }, [current, slides.length, goTo])

  useEffect(() => {
    if (isPaused || slides.length <= 1) return
    timerRef.current = setInterval(goNext, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [goNext, isPaused, slides.length])

  if (slides.length === 0) return null

  return (
    <section 
      className="relative w-full overflow-hidden bg-gray-950"
      style={{ height: 'clamp(300px, 50vw, 550px)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          {/* Background image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/1200x600/0f172a/3b82f6/png?text=${encodeURIComponent(slide.title)}` }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/30" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className={`max-w-xl transition-all duration-700 delay-200 ${
                i === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}>
                {slide.title && (
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight drop-shadow-lg" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p className="text-base md:text-xl text-gray-200 mb-6 max-w-md drop-shadow-md">
                    {slide.subtitle}
                  </p>
                )}
                {slide.link && (
                  <a
                    href={slide.link}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 text-sm md:text-base"
                  >
                    Ver Ahora
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 md:w-12 md:h-12 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full items-center justify-center transition-all hover:scale-110 border border-white/10"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 md:w-12 md:h-12 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full items-center justify-center transition-all hover:scale-110 border border-white/10"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

    </section>
  )
}

function Store({ city, onChangeCity, onAdminClick }: { city: City; onChangeCity: () => void; onAdminClick: () => void }) {
  const [activeModel, setActiveModel] = useState<string>('todos')
  const [activeCondition, setActiveCondition] = useState<string>('todos')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  
  // Hero slideshow + marquee data
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [marqueeTexts, setMarqueeTexts] = useState<string[]>([])
  
  // API-loaded data with fallback to static
  const [apiProducts, setApiProducts] = useState<Product[]>(products)
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [modelBubbles, setModelBubbles] = useState<{id: string; label: string; image: string}[]>([
    { id: 'todos', label: 'Todos', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop' },
    { id: 'iphones', label: 'iPhones', image: 'https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=300&h=300&fit=crop' },
    { id: 'ipads', label: 'iPads', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop' },
    { id: 'macbook', label: 'MacBook', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop' },
    { id: 'airpods', label: 'AirPods', image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=300&h=300&fit=crop' },
    { id: 'apple watch', label: 'Apple Watch', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300&h=300&fit=crop' },
    { id: 'accesorios', label: 'Accesorios', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&h=300&fit=crop' },
  ])
  const [apiRepairServices, setApiRepairServices] = useState(repairServices)

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, recommendedRes, trendingRes, bubblesRes, servicesRes, slidesRes, marqueeRes] = await Promise.all([
          fetch(`${API_URL}/api/products?city=${city || 'duitama'}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/products/recommended?city=${city || 'duitama'}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/products/trending?city=${city || 'duitama'}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/categories`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/repair-services`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/hero-slides`).then(r => r.ok ? r.json() : null),
          fetch(`${API_URL}/api/marquee-texts`).then(r => r.ok ? r.json() : null),
        ])
        if (productsRes?.products) {
          setApiProducts(productsRes.products.map((p: Record<string, unknown>) => ({
            id: p.id as number,
            name: p.name as string,
            category: (p.category as string) || '',
            condition: p.condition as string,
            image: p.image as string,
            images: (p.images as string[]) || [],
            colors: p.colors as string[],
            storageOptions: p.storage_options as string[],
            badge: (p.badge as string) || null,
            available: p.available as string[],
            price: (p.price as string) || '',
            description: (p.description as string) || '',
          })))
        }
        if (recommendedRes?.products) {
          setRecommendedProducts(recommendedRes.products.map((p: Record<string, unknown>) => ({
            id: p.id as number, name: p.name as string, category: (p.category as string) || '',
            condition: p.condition as string,
            image: p.image as string, images: (p.images as string[]) || [], colors: p.colors as string[], storageOptions: p.storage_options as string[],
            badge: (p.badge as string) || null, available: p.available as string[],
            price: (p.price as string) || '', description: (p.description as string) || '',
          })))
        }
        if (trendingRes?.products) {
          setTrendingProducts(trendingRes.products.map((p: Record<string, unknown>) => ({
            id: p.id as number, name: p.name as string, category: (p.category as string) || '',
            condition: p.condition as string,
            image: p.image as string, images: (p.images as string[]) || [], colors: p.colors as string[], storageOptions: p.storage_options as string[],
            badge: (p.badge as string) || null, available: p.available as string[],
            price: (p.price as string) || '', description: (p.description as string) || '',
          })))
        }
        if (bubblesRes?.categories) {
          const catBubbles = bubblesRes.categories.map((c: Record<string, unknown>) => ({
            id: c.slug as string, label: c.name as string, image: c.image as string,
          }))
          setModelBubbles([{ id: 'todos', label: 'Todos', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop' }, ...catBubbles])
        }
        if (servicesRes?.services) {
          const iconMap: Record<string, typeof Smartphone> = { Smartphone, Zap, Shield, Award, Wrench }
          setApiRepairServices(servicesRes.services.map((s: Record<string, unknown>) => ({
            icon: iconMap[s.icon as string] || Smartphone,
            title: s.title as string,
            description: s.description as string,
            price: s.price as string,
          })))
        }
        if (slidesRes?.slides) {
          setHeroSlides(slidesRes.slides)
        }
        if (marqueeRes?.texts) {
          setMarqueeTexts(marqueeRes.texts.map((t: { text: string }) => t.text))
        }
      } catch {
        // Fallback to static data if API unavailable
        console.log('Using static data (API unavailable)')
      }
    }
    loadData()
  }, [city])

  // Load related products when a product is selected
  useEffect(() => {
    if (!selectedProduct) { setRelatedProducts([]); return }
    const loadRelated = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${selectedProduct.id}/related?city=${city || 'duitama'}`)
        if (res.ok) {
          const data = await res.json()
          setRelatedProducts(data.products.map((p: Record<string, unknown>) => ({
            id: p.id as number, name: p.name as string, category: (p.category as string) || '',
            condition: p.condition as string,
            image: p.image as string, images: (p.images as string[]) || [], colors: p.colors as string[], storageOptions: p.storage_options as string[],
            badge: (p.badge as string) || null, available: p.available as string[],
            price: (p.price as string) || '', description: (p.description as string) || '',
          })))
        }
      } catch {
        // Fallback: compute related locally
        const generation = selectedProduct.name.match(/iPhone (\d+|Air)/)?.[1] || ''
        setRelatedProducts(apiProducts.filter(p => 
          p.id !== selectedProduct.id && 
          (p.name.includes(`iPhone ${generation}`) || p.condition === selectedProduct.condition)
        ).slice(0, 4))
      }
    }
    loadRelated()
  }, [selectedProduct, city, apiProducts])

  const cityName = city === 'duitama' ? 'Duitama' : 'Tunja'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredProducts = apiProducts.filter(p => {
    const inCity = p.available.includes(city || 'duitama')
    if (!inCity) return false
    if (activeCondition === 'nuevos' && p.condition !== 'Nuevo') return false
    if (activeCondition === 'semi-usados' && p.condition !== 'Semi-usado') return false
    if (activeModel !== 'todos') {
      // Use explicit category field first, fallback to name-based matching
      if (p.category) {
        return p.category === activeModel || p.category === activeModel.replace(' ', '-')
      }
      const name = p.name.toLowerCase()
      switch (activeModel) {
        case 'iphones': return name.includes('iphone')
        case 'ipads': return name.includes('ipad')
        case 'macbook': return name.includes('macbook')
        case 'airpods': return name.includes('airpods')
        case 'apple-watch': return name.includes('apple watch')
        case 'accesorios': return name.includes('pencil') || name.includes('accesorio')
        default: return name.includes(activeModel.toLowerCase())
      }
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header / Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 cursor-pointer">
              <img src="/images/gordotech-icon-white.png" alt="Gordotech - Ir al inicio" className="h-10 md:h-12" />
            </button>

            {/* Nav Links - Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#productos" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Productos</a>
              {city === 'duitama' && (
                <a href="#reparacion" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Reparacion</a>
              )}
              <a href="#ubicacion" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Ubicacion</a>
              <a href="#contacto" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Contacto</a>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={onChangeCity}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-300">{cityName}</span>
              </button>
              <button className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <ShoppingCart className="w-5 h-5 text-gray-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs flex items-center justify-center">0</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4">
              <nav className="flex flex-col gap-3">
                <a href="#productos" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2">Productos</a>
                {city === 'duitama' && (
                  <a href="#reparacion" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2">Reparacion</a>
                )}
                <a href="#ubicacion" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2">Ubicacion</a>
                <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2">Contacto</a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Animated Marquee Banner */}
      <div className="pt-16 md:pt-20">
        <AnimatedMarquee texts={marqueeTexts} />
      </div>

      {/* Hero Slideshow */}
      <HeroSlideshow slides={heroSlides} />

      {/* Main Content */}
      <main>

      {/* Model Bubbles - Newest to Oldest */}
      <section className="py-8 md:py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-5 md:gap-8 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide">
            {modelBubbles.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  setActiveModel(model.id)
                  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex flex-col items-center gap-2.5 group cursor-pointer flex-shrink-0 relative"
              >
                {/* Normal bubble */}
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 overflow-hidden bg-gray-900 transition-all duration-300 ${
                  activeModel === model.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/30 scale-110'
                    : 'border-gray-600 group-hover:border-blue-400'
                }`}>
                  <img
                    src={model.image}
                    alt={model.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x300/1a1a2e/7BA3C9/png?text=${encodeURIComponent(model.label)}` }}
                  />
                </div>
                {/* Expanded image on hover/touch - shows full product */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gray-900/95 backdrop-blur-sm shadow-2xl shadow-black/50 opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-active:opacity-100 group-active:scale-100 transition-all duration-300 ease-out z-50 overflow-hidden">
                  <img
                    src={model.image}
                    alt={model.label}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <span className={`text-xs font-medium text-center leading-tight transition-colors ${
                  activeModel === model.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}>
                  {model.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recomendado para ti */}
      {!selectedProduct && recommendedProducts.length > 0 && (
        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <h3 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>RECOMENDADO PARA TI</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.map(product => (
                                <button key={product.id} onClick={() => { setSelectedProduct(product); setGalleryIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="group text-left bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1">
                                  <div className="relative aspect-square bg-gradient-to-b from-gray-800/30 to-gray-900/30 p-4 flex items-center justify-center">
                                    {product.badge && (
                                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">{product.badge}</div>
                                    )}
                                    <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Heart className="w-4 h-4 text-gray-300" />
                                    </div>
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/1a1a2e/7BA3C9/png?text=${encodeURIComponent(product.name)}` }} />
                                  </div>
                                  <div className="p-3 md:p-4">
                                    <p className="text-xs text-blue-400 font-medium mb-1">{product.condition}</p>
                    <h4 className="text-sm md:text-base font-bold text-white mb-1.5 line-clamp-2">{product.name}</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.storageOptions.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-400">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-400 font-medium flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Consultar Precio</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tendencia Ahora */}
      {!selectedProduct && trendingProducts.length > 0 && (
        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <h3 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>TENDENCIA AHORA</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {trendingProducts.map(product => (
                <button key={product.id} onClick={() => { setSelectedProduct(product); setGalleryIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="group text-left bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1">
                  <div className="relative aspect-square bg-gradient-to-b from-gray-800/30 to-gray-900/30 p-4 flex items-center justify-center">
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-black flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Trending</div>
                    <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-4 h-4 text-gray-300" />
                    </div>
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/1a1a2e/7BA3C9/png?text=${encodeURIComponent(product.name)}` }} />
                  </div>
                  <div className="p-3 md:p-4">
                    <p className={`text-xs font-medium mb-1 ${product.condition === 'Nuevo' ? 'text-blue-400' : 'text-amber-400'}`}>{product.condition}</p>
                    <h4 className="text-sm md:text-base font-bold text-white mb-1.5 line-clamp-2">{product.name}</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.storageOptions.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-400">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-400 font-medium flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Consultar Precio</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Detail View */}
      {selectedProduct && (() => {
        const galleryImages = selectedProduct.images && selectedProduct.images.length > 0
          ? selectedProduct.images
          : [selectedProduct.image]
        return (
        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <button onClick={() => { setSelectedProduct(null); setGalleryIndex(0); setZoomOpen(false) }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Volver a productos
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
              {/* Product Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-3xl overflow-hidden flex items-center justify-center p-10 group">
                  {selectedProduct.badge && (
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 rounded-full text-sm font-bold bg-blue-500 text-white">{selectedProduct.badge}</div>
                  )}
                  <img
                    src={galleryImages[galleryIndex] || selectedProduct.image}
                    alt={`${selectedProduct.name} - Foto ${galleryIndex + 1}`}
                    className="w-full h-full object-cover rounded-2xl cursor-pointer"
                    onClick={() => setZoomOpen(true)}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x600/1a1a2e/7BA3C9/png?text=${encodeURIComponent(selectedProduct.name)}` }}
                  />
                  {/* Navigation arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setGalleryIndex(i => i > 0 ? i - 1 : galleryImages.length - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setGalleryIndex(i => i < galleryImages.length - 1 ? i + 1 : 0)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {/* Zoom button */}
                  <button
                    onClick={() => setZoomOpen(true)}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  {/* Image counter */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-xs font-medium z-20">
                      {galleryIndex + 1} / {galleryImages.length}
                    </div>
                  )}
                </div>
                {/* Thumbnails */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIndex(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <img src={img} alt={`${selectedProduct.name} - Miniatura ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/100x100/1a1a2e/7BA3C9/png?text=${i + 1}` }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zoom Modal */}
              {zoomOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}>
                  <button onClick={() => setZoomOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-50">
                    <X className="w-6 h-6" />
                  </button>
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => i > 0 ? i - 1 : galleryImages.length - 1) }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-50"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => i < galleryImages.length - 1 ? i + 1 : 0) }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-50"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <img
                    src={galleryImages[galleryIndex] || selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-w-full max-h-[90vh] object-contain rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/800x800/1a1a2e/7BA3C9/png?text=${encodeURIComponent(selectedProduct.name)}` }}
                  />
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full text-white text-sm font-medium">
                      {galleryIndex + 1} / {galleryImages.length}
                    </div>
                  )}
                </div>
              )}

              {/* Product Info */}
              <div className="flex flex-col justify-center">
                <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-4 w-fit ${selectedProduct.condition === 'Nuevo' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {selectedProduct.condition}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>{selectedProduct.name}</h2>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-3">Almacenamiento disponible</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.storageOptions.map((storage, i) => (
                      <span key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-medium hover:border-blue-500/50 transition-colors cursor-pointer">{storage}</span>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-gray-400 text-sm mb-3">Colores disponibles</p>
                  <div className="flex items-center gap-3">
                    {selectedProduct.colors.map((color, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-blue-400 transition-colors cursor-pointer" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>

                <a
                  href={`https://wa.me/573144810431?text=${encodeURIComponent(`Hola Gordotech! Me interesa el ${selectedProduct.name} (${selectedProduct.condition}). ¿Tienen disponible y cuál es el precio?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-3 text-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Consultar Precio por WhatsApp
                </a>
              </div>
            </div>

            {/* Related Products */}
            <div>
              <h3 className="text-2xl md:text-4xl font-bold mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>PRODUCTOS RELACIONADOS</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map(product => (
                  <button key={product.id} onClick={() => {       setSelectedProduct(product); setGalleryIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="group text-left bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1">
                          <div className="relative aspect-square bg-gradient-to-b from-gray-800/30 to-gray-900/30 p-4 flex items-center justify-center">
                            {product.badge && (
                              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">{product.badge}</div>
                            )}
                            <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Heart className="w-4 h-4 text-gray-300" />
                            </div>
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/1a1a2e/7BA3C9/png?text=${encodeURIComponent(product.name)}` }} />
                          </div>
                          <div className="p-3 md:p-4">
                            <p className={`text-xs font-medium mb-1 ${product.condition === 'Nuevo' ? 'text-blue-400' : 'text-amber-400'}`}>{product.condition}</p>
                            <h4 className="text-sm md:text-base font-bold text-white mb-1.5 line-clamp-2">{product.name}</h4>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {product.storageOptions.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-400">{s}</span>
                              ))}
                            </div>
                            <p className="text-xs text-blue-400 font-medium flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Consultar Precio</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              )
            })()}

      {/* Products Section */}
      {!selectedProduct && (
      <section id="productos" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h3 className="text-3xl md:text-5xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                {activeModel === 'todos' ? 'TODOS LOS iPHONES' : activeModel.toUpperCase()}
              </h3>
              <p className="text-gray-400 mt-2">Disponibles en {cityName} &middot; {filteredProducts.length} productos</p>
            </div>
            {/* Condition Filter Tabs */}
            <div className="flex items-center gap-2">
              {[{ id: 'todos', label: 'Todos' }, { id: 'nuevos', label: 'Nuevos' }, { id: 'semi-usados', label: 'Semi-usados' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCondition(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeCondition === tab.id
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => { setSelectedProduct(product); setGalleryIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="group text-left bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1"
              >
                {/* Badge */}
                <div className="relative aspect-square bg-gradient-to-b from-gray-800/30 to-gray-900/30 p-4 flex items-center justify-center">
                  {product.badge && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">{product.badge}</div>
                  )}
                  <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-gray-300" />
                  </div>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/1a1a2e/7BA3C9/png?text=${encodeURIComponent(product.name)}` }}
                  />
                </div>

                {/* Info */}
                <div className="p-3 md:p-4">
                  <p className={`text-xs font-medium mb-1 ${product.condition === 'Nuevo' ? 'text-blue-400' : 'text-amber-400'}`}>{product.condition}</p>
                  <h4 className="text-sm md:text-base font-bold text-white mb-1.5 line-clamp-2">{product.name}</h4>
                  
                  {/* Storage Options */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.storageOptions.map((storage, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-gray-400">
                        {storage}
                      </span>
                    ))}
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-1 mb-2">
                    {product.colors.map((color, i) => (
                      <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <p className="text-xs text-blue-400 font-medium flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Consultar Precio</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Repair Section - Only for Duitama */}
      {city === 'duitama' && (
        <section id="reparacion" className="py-16 md:py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <Wrench className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Solo en Duitama</span>
              </div>
              <h3 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                CENTRO DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">REPARACION</span>
              </h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Nuestros tecnicos certificados reparan tu iPhone con repuestos de la mas alta calidad
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {apiRepairServices.map((service, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
                    <service.icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{service.title}</h4>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{service.description}</p>
                  <p className="text-blue-400 font-bold text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{service.price}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="https://wa.me/573144810431?text=Hola%20Gordotech%2C%20necesito%20una%20reparacion"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
              >
                <MessageCircle className="w-5 h-5" />
                Agendar Reparacion por WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Location Section */}
      <section id="ubicacion" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
              VISITANOS EN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{cityName.toUpperCase()}</span>
            </h3>
            <p className="text-gray-400 text-lg">Ven a conocer nuestros productos en persona</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Duitama */}
            <div className={`p-8 rounded-3xl border transition-all ${city === 'duitama' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>DUITAMA</h4>
                  <p className="text-blue-400 text-sm">Tienda + Centro de Reparacion</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                  <p className="text-sm">Centro Comercial, Duitama, Boyaca</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">Lun - Sab: 9:00 AM - 7:00 PM</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">+57 300 123 4567</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <a href="https://wa.me/573144810431" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-green-600/10 hover:bg-green-600 border border-green-600/30 hover:border-green-600 text-green-400 hover:text-white font-medium rounded-xl transition-all text-center text-sm">
                  WhatsApp
                </a>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white font-medium rounded-xl transition-all text-center text-sm">
                  Ver en Mapa
                </a>
              </div>
            </div>

            {/* Tunja */}
            <div className={`p-8 rounded-3xl border transition-all ${city === 'tunja' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>TUNJA</h4>
                  <p className="text-blue-400 text-sm">Punto de Venta</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                  <p className="text-sm">Centro Comercial, Tunja, Boyaca</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">Lun - Sab: 9:00 AM - 7:00 PM</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">+57 300 765 4321</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <a href="https://wa.me/573144810431" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-green-600/10 hover:bg-green-600 border border-green-600/30 hover:border-green-600 text-green-400 hover:text-white font-medium rounded-xl transition-all text-center text-sm">
                  WhatsApp
                </a>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white font-medium rounded-xl transition-all text-center text-sm">
                  Ver en Mapa
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 p-10 md:p-16 overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '30px 30px'
            }} />
            <div className="relative z-10 text-center">
              <h3 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                ENCUENTRA TU iPHONE IDEAL
              </h3>
              <p className="text-blue-100/80 text-lg mb-8 max-w-2xl mx-auto">
                Escribenos por WhatsApp y te asesoramos para que encuentres el iPhone perfecto para ti al mejor precio
              </p>
              <a
                href="https://wa.me/573144810431?text=Hola%20Gordotech%2C%20quiero%20información%20sobre%20iPhones"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl transition-all hover:scale-105 hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Chatea con Nosotros
              </a>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer id="contacto" className="border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/gordotech-logo.png" alt="Gordotech" className="h-12" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Conectando tus suenos. Tu tienda de confianza para iPhones nuevos y semi-usados en Boyaca.</p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Instagram className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Facebook className="w-5 h-5 text-gray-400" />
                </a>
                <a href="https://wa.me/573144810431" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Productos</h5>
              <ul className="space-y-3">
                <li><a href="#productos" className="text-gray-400 hover:text-white transition-colors text-sm">iPhones Nuevos</a></li>
                <li><a href="#productos" className="text-gray-400 hover:text-white transition-colors text-sm">iPhones Semi-usados</a></li>
                <li><a href="#productos" className="text-gray-400 hover:text-white transition-colors text-sm">Accesorios</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Servicios</h5>
              <ul className="space-y-3">
                <li><a href="#reparacion" className="text-gray-400 hover:text-white transition-colors text-sm">Reparacion iPhone</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cambio de pantalla</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cambio de bateria</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Diagnostico gratis</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h5>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="w-4 h-4 text-blue-400" />
                  +57 300 123 4567
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-blue-400" />
                  info@gordotech.co
                </li>
                <li className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                  Duitama & Tunja, Boyaca
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">&copy; 2024 Gordotech. Todos los derechos reservados. Conectando tus suenos.</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Terminos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Garantia</a>
              <button onClick={onAdminClick} className="flex items-center gap-1.5 hover:text-white transition-colors" title="Panel de Administración">
                <Settings className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/573144810431?text=Hola%20Gordotech%2C%20necesito%20información"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-all"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>
    </div>
  )
}

function App() {
  const [city, setCity] = useState<City>(() => {
    const saved = localStorage.getItem('gordotech-city')
    return (saved === 'duitama' || saved === 'tunja') ? saved : null
  })
  const [showAdmin, setShowAdmin] = useState(false)

  // Keyboard shortcut: Ctrl+Shift+A to toggle admin panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setShowAdmin(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Check URL hash for admin access
  useEffect(() => {
    if (window.location.hash === '#admin') {
      setShowAdmin(true)
    }
  }, [])

  const handleCitySelect = (selected: City) => {
    setCity(selected)
    if (selected) localStorage.setItem('gordotech-city', selected)
  }

  const handleChangeCity = () => {
    setCity(null)
    localStorage.removeItem('gordotech-city')
    window.scrollTo(0, 0)
  }

  if (showAdmin) {
    return <AdminPanel onExit={() => { setShowAdmin(false); window.location.hash = '' }} />
  }

  if (!city) {
    return <CitySelector onSelect={handleCitySelect} />
  }

  return <Store city={city} onChangeCity={handleChangeCity} onAdminClick={() => setShowAdmin(true)} />
}

export default App
