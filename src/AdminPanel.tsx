import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, Edit3, Save, LogOut, Upload, BarChart3, Package, Circle, Wrench, Eye, Search, Lock, FolderOpen, Image, Type, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Play, Film } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COLOR_MAP: Record<string, string> = {
  negro: '#000000', blanco: '#FFFFFF', azul: '#0047AB', rojo: '#FF0000',
  verde: '#008000', amarillo: '#FFD700', naranja: '#FF8C00', rosa: '#FF69B4',
  morado: '#800080', gris: '#808080', plata: '#C0C0C0', oro: '#FFD700',
  dorado: '#DAA520', celeste: '#87CEEB', turquesa: '#40E0D0', beige: '#F5F5DC',
  crema: '#FFFDD0', coral: '#FF7F50', lavanda: '#E6E6FA', marron: '#8B4513',
  bronce: '#CD7F32', titanio: '#878681', grafito: '#383838', medianoche: '#191970',
  'azul ultramar': '#120A8F', 'verde menta': '#98FF98', 'rosa pastel': '#FFD1DC',
  natural: '#D2B48C', desierto: '#EDC9AF',
  // Apple compound color names
  'naranja cosmico': '#FF6723', 'naranja cósmico': '#FF6723',
  'azul oscuro': '#003366', 'azul pacifico': '#1A73E8', 'azul pacífico': '#1A73E8',
  'azul sierra': '#69ABCE', 'azul alpino': '#394F6A',
  'verde alpino': '#3B5323', 'verde oliva': '#556B2F',
  'rosa chicle': '#FF6EB4', 'rosa fuerte': '#FF1493',
  'titanio natural': '#B5A898', 'titanio negro': '#3C3C3C',
  'titanio blanco': '#F5F5F0', 'titanio azul': '#394F6A',
  'titanio desierto': '#C8AD8B', 'titanio arena': '#C2B280',
  'negro espacial': '#1D1D1D', 'gris espacial': '#4A4A4A',
  'oro rosa': '#B76E79', 'blanco estelar': '#F8F0E5', 'luz estelar': '#F8F0E5',
  'negro medianoche': '#191970', 'rojo producto': '#FF0000',
  teal: '#008080', ultramarina: '#120A8F', ultramarino: '#120A8F',
}

function resolveColor(color: string): string {
  const trimmed = color.trim().toLowerCase()
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed]
  const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (COLOR_MAP[normalized]) return COLOR_MAP[normalized]
  const firstWord = trimmed.split(/\s+/)[0]
  if (COLOR_MAP[firstWord]) return COLOR_MAP[firstWord]
  return color
}

type Product = {
  id: number
  name: string
  category: string
  condition: string
  image: string
  images: string[]
  colors: string[]
  color_images: Record<string, string[]>
  storage_options: string[]
  badge: string | null
  available: string[]
  price: string
  old_price: string
  description: string
  featured_recommended: boolean
  featured_trending: boolean
  sort_order: number
}

type Category = {
  id: number
  slug: string
  name: string
  image: string
  sort_order: number
}

type Bubble = {
  id: number
  model_id: string
  label: string
  image: string
  sort_order: number
}

type RepairService = {
  id: number
  title: string
  description: string
  price: string
  icon: string
  sort_order: number
}

type HeroSlide = {
  id: number
  title: string
  subtitle: string
  image: string
  video_url: string
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

type Stats = {
  total_products: number
  new_products: number
  used_products: number
  categories: number
  bubbles: number
  repair_services: number
  hero_slides: number
}

type Tab = 'dashboard' | 'products' | 'categories' | 'bubbles' | 'services' | 'slideshow' | 'marquee' | 'settings'

const TAB_PATHS: Record<string, Tab> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/productos': 'products',
  '/categorias': 'categories',
  '/burbujas': 'bubbles',
  '/servicios': 'services',
  '/slideshow': 'slideshow',
  '/marquee': 'marquee',
  '/config': 'settings',
}

const TAB_TO_PATH: Record<Tab, string> = {
  dashboard: '/dashboard',
  products: '/productos',
  categories: '/categorias',
  bubbles: '/burbujas',
  services: '/servicios',
  slideshow: '/slideshow',
  marquee: '/marquee',
  settings: '/config',
}

function getTabFromPath(): Tab {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  return TAB_PATHS[path] || 'dashboard'
}

// ==================== API HELPERS ====================

async function apiGet(path: string, token: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API_URL}${path}${sep}token=${token}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

async function apiPost(path: string, body: Record<string, unknown>, token: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API_URL}${path}${sep}token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

async function apiPut(path: string, body: Record<string, unknown>, token: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API_URL}${path}${sep}token=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

async function apiDelete(path: string, token: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API_URL}${path}${sep}token=${token}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

async function apiUpload(file: File, token: string) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/api/admin/upload?token=${token}`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

// ==================== LOGIN COMPONENT ====================

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        setError('Credenciales incorrectas')
        return
      }
      const data = await res.json()
      onLogin(data.token)
    } catch {
      setError('Error de conexion al servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>GORDOTECH ADMIN</h1>
          <p className="text-gray-400 mt-2">Panel de Administracion</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center">{error}</div>
          )}
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==================== IMAGE UPLOAD BUTTON ====================

function ImageUploader({ token, currentImage, onUpload }: { token: string; currentImage: string; onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await apiUpload(file, token)
      onUpload(`${API_URL}${data.url}`)
    } catch {
      alert('Error subiendo imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {currentImage && (
          <img src={currentImage} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-800" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg cursor-pointer hover:border-blue-500/30 transition-colors text-sm text-gray-300">
          <Upload className="w-4 h-4" />
          {uploading ? 'Subiendo...' : 'Subir imagen'}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
      <input
        type="text"
        value={currentImage}
        onChange={e => onUpload(e.target.value)}
        placeholder="URL de imagen o subir archivo"
        className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
      />
    </div>
  )
}

// ==================== MULTI IMAGE UPLOADER ====================

function MultiImageUploader({ token, images, onChange }: { token: string; images: string[]; onChange: (images: string[]) => void }) {
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const data = await apiUpload(files[i], token)
        newUrls.push(`${API_URL}${data.url}`)
      }
      onChange([...images, ...newUrls])
    } catch {
      alert('Error subiendo imagenes')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={i} className="relative group w-20 h-20">
            <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full rounded-lg object-cover bg-gray-800 border border-white/10" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/1a1a2e/7BA3C9/png?text=Error' }} />
            <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i > 0 && (
                <button onClick={() => moveImage(i, i - 1)} className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs hover:bg-white/40" title="Mover izquierda">&larr;</button>
              )}
              <button onClick={() => removeImage(i)} className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600" title="Eliminar">
                <X className="w-3 h-3" />
              </button>
              {i < images.length - 1 && (
                <button onClick={() => moveImage(i, i + 1)} className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs hover:bg-white/40" title="Mover derecha">&rarr;</button>
              )}
            </div>
            {i === 0 && (
              <div className="absolute -top-1 -left-1 px-1.5 py-0.5 bg-blue-500 rounded text-white text-[10px] font-bold">Principal</div>
            )}
          </div>
        ))}
        <label className={`w-20 h-20 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors ${uploading ? 'opacity-50' : ''}`}>
          <Plus className="w-5 h-5 text-gray-400" />
          <span className="text-[10px] text-gray-500 mt-1">{uploading ? 'Subiendo...' : 'Agregar'}</span>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
        </label>
      </div>
      <p className="text-xs text-gray-500">La primera imagen sera la principal. Puedes reordenar pasando el mouse y usando las flechas.</p>
    </div>
  )
}

// ==================== COLOR IMAGE UPLOADER ====================

function ColorImageUploader({ token, color, onUpload }: { token: string; color: string; onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await apiUpload(file, token)
      onUpload(`${API_URL}${data.url}`)
    } catch {
      alert('Error subiendo imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <label className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-600/30 border border-blue-500/30 rounded-lg cursor-pointer hover:bg-blue-600/50 transition-colors text-xs text-blue-300 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
      <Plus className="w-3 h-3" />
      {uploading ? 'Subiendo...' : 'Subir foto'}
      <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
    </label>
  )
}

// ==================== PRODUCT FORM ====================

function ProductForm({ product, token, categories, onSave, onCancel }: {
  product: Product | null
  token: string
  categories: Category[]
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    condition: product?.condition || 'Semi-usado',
    image: product?.image || '',
    images: product?.images || [],
    colors: product?.colors?.join(', ') || '',
    color_images: (() => {
      // Normalize legacy string values to arrays
      const raw = product?.color_images || {};
      const normalized: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (Array.isArray(v)) normalized[k] = v;
        else if (typeof v === 'string' && v) normalized[k] = [v];
      }
      return normalized;
    })(),
    storage_options: product?.storage_options?.join(', ') || '',
    badge: product?.badge || '',
    available_duitama: product?.available?.includes('duitama') ?? true,
    available_tunja: product?.available?.includes('tunja') ?? true,
    price: product?.price || '',
    old_price: product?.old_price || '',
    description: product?.description || '',
    featured_recommended: product?.featured_recommended || false,
    featured_trending: product?.featured_trending || false,
    sort_order: product?.sort_order || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const available: string[] = []
      if (form.available_duitama) available.push('duitama')
      if (form.available_tunja) available.push('tunja')
      
      const body = {
        name: form.name,
        category: form.category,
        condition: form.condition,
        image: form.images.length > 0 ? form.images[0] : form.image,
        images: form.images,
        colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
        color_images: form.color_images,
        storage_options: form.storage_options.split(',').map(s => s.trim()).filter(Boolean),
        badge: form.badge || null,
        available,
        price: form.price,
        old_price: form.old_price,
        description: form.description,
        featured_recommended: form.featured_recommended,
        featured_trending: form.featured_trending,
        sort_order: form.sort_order,
      }

      if (product) {
        await apiPut(`/api/admin/products/${product.id}`, body, token)
      } else {
        await apiPost('/api/admin/products', body, token)
      }
      onSave()
    } catch {
      alert('Error guardando producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto lg:max-h-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="iPhone 17 Pro Max" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Condicion</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50">
                <option value="Nuevo">Nuevo</option>
                <option value="Semi-usado">Semi-usado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Categoria *</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50">
              <option value="">Sin categoria</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Imagenes del producto</label>
            <MultiImageUploader
              token={token}
              images={form.images}
              onChange={imgs => setForm({ ...form, images: imgs, image: imgs.length > 0 ? imgs[0] : form.image })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Opciones de almacenamiento (separadas por coma)</label>
              <input value={form.storage_options} onChange={e => setForm({...form, storage_options: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="128GB, 256GB, 512GB" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Colores (nombre o hex, separados por coma)</label>
              <input value={form.colors} onChange={e => setForm({...form, colors: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="Naranja cósmico, Negro, Titanio natural" />
            </div>
          </div>

          {/* Color-Image Assignment (multiple photos per color) */}
          {form.colors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">Fotos por color</label>
              <div className="space-y-4">
                {form.colors.split(',').map(c => c.trim()).filter(Boolean).map((color) => {
                  const colorImgs = form.color_images[color] || []
                  return (
                    <div key={color} className="bg-gray-800/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: resolveColor(color) }} />
                        <span className="text-white text-sm font-medium">{color}</span>
                        <span className="text-gray-500 text-xs">({colorImgs.length} foto{colorImgs.length !== 1 ? 's' : ''})</span>
                      </div>
                      {/* Thumbnails of assigned images */}
                      <div className="flex flex-wrap gap-2">
                        {colorImgs.map((img, idx) => (
                          <div key={idx} className="relative group w-14 h-14">
                            <img src={img} alt={`${color} ${idx + 1}`} className="w-full h-full rounded object-cover bg-gray-800 border border-white/10" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1a1a2e/7BA3C9/png?text=Error' }} />
                            <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
                              {idx > 0 && (
                                <button type="button" onClick={() => {
                                  const arr = [...colorImgs]; const [m] = arr.splice(idx, 1); arr.splice(idx - 1, 0, m);
                                  setForm({ ...form, color_images: { ...form.color_images, [color]: arr } })
                                }} className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white text-[10px] hover:bg-white/40">&larr;</button>
                              )}
                              <button type="button" onClick={() => {
                                const arr = colorImgs.filter((_, i) => i !== idx);
                                const updated = { ...form.color_images };
                                if (arr.length === 0) delete updated[color]; else updated[color] = arr;
                                setForm({ ...form, color_images: updated })
                              }} className="w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                                <X className="w-3 h-3" />
                              </button>
                              {idx < colorImgs.length - 1 && (
                                <button type="button" onClick={() => {
                                  const arr = [...colorImgs]; const [m] = arr.splice(idx, 1); arr.splice(idx + 1, 0, m);
                                  setForm({ ...form, color_images: { ...form.color_images, [color]: arr } })
                                }} className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white text-[10px] hover:bg-white/40">&rarr;</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Add images to this color */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {form.images.filter(img => !colorImgs.includes(img)).length > 0 && (
                          <select
                            value=""
                            onChange={e => {
                              if (!e.target.value) return;
                              const updated = { ...form.color_images, [color]: [...colorImgs, e.target.value] };
                              setForm({ ...form, color_images: updated })
                              e.target.value = '';
                            }}
                            className="bg-gray-800/50 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500/50"
                          >
                            <option value="">+ Agregar foto...</option>
                            {form.images.filter(img => !colorImgs.includes(img)).map((img, idx) => (
                              <option key={idx} value={img}>Foto {form.images.indexOf(img) + 1}</option>
                            ))}
                          </select>
                        )}
                        <ColorImageUploader token={token} color={color} onUpload={(url) => {
                          const updated = { ...form.color_images, [color]: [...colorImgs, url] };
                          setForm({ ...form, color_images: updated })
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">Sube o selecciona varias fotos para cada color. Al tocar un color en la tienda, se mostraran estas fotos.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Precio Actual</label>
              <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="2.500.000" />
            </div>
            <div>
              <label className="block text-red-400 text-sm mb-1">Precio Anterior (tachado en rojo)</label>
              <input value={form.old_price} onChange={e => setForm({...form, old_price: e.target.value})}
                className="w-full bg-gray-800/50 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-sm focus:outline-none focus:border-red-500/50" placeholder="3.200.000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Badge / Etiqueta</label>
              <input value={form.badge} onChange={e => setForm({...form, badge: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="Nuevo, Oferta, etc." />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Descripcion</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none" placeholder="Descripcion del producto..." />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Orden</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.available_duitama} onChange={e => setForm({...form, available_duitama: e.target.checked})} className="rounded" />
              Disponible en Duitama
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.available_tunja} onChange={e => setForm({...form, available_tunja: e.target.checked})} className="rounded" />
              Disponible en Tunja
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.featured_recommended} onChange={e => setForm({...form, featured_recommended: e.target.checked})} className="rounded" />
              Recomendado
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.featured_trending} onChange={e => setForm({...form, featured_trending: e.target.checked})} className="rounded" />
              Tendencia
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== BUBBLE FORM ====================

function BubbleForm({ bubble, token, onSave, onCancel }: {
  bubble: Bubble | null
  token: string
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    model_id: bubble?.model_id || '',
    label: bubble?.label || '',
    image: bubble?.image || '',
    sort_order: bubble?.sort_order || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (bubble) {
        await apiPut(`/api/admin/bubbles/${bubble.id}`, form, token)
      } else {
        await apiPost('/api/admin/bubbles', form, token)
      }
      onSave()
    } catch {
      alert('Error guardando burbuja')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{bubble ? 'Editar Burbuja' : 'Nueva Burbuja'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">ID del modelo (ej: iphone 17)</label>
            <input value={form.model_id} onChange={e => setForm({...form, model_id: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Etiqueta visible</label>
            <input value={form.label} onChange={e => setForm({...form, label: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Imagen</label>
            <ImageUploader token={token} currentImage={form.image} onUpload={url => setForm({...form, image: url})} />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Orden</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.model_id || !form.label} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== SERVICE FORM ====================

function ServiceForm({ service, token, onSave, onCancel }: {
  service: RepairService | null
  token: string
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: service?.title || '',
    description: service?.description || '',
    price: service?.price || '',
    icon: service?.icon || 'Smartphone',
    sort_order: service?.sort_order || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (service) {
        await apiPut(`/api/admin/repair-services/${service.id}`, form, token)
      } else {
        await apiPost('/api/admin/repair-services', form, token)
      }
      onSave()
    } catch {
      alert('Error guardando servicio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{service ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Titulo</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Descripcion</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Precio</label>
            <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="Desde $150.000" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Icono</label>
            <select value={form.icon} onChange={e => setForm({...form, icon: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50">
              <option value="Smartphone">Smartphone</option>
              <option value="Zap">Zap (Rayo)</option>
              <option value="Shield">Shield (Escudo)</option>
              <option value="Award">Award (Premio)</option>
              <option value="Wrench">Wrench (Llave)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Orden</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.title} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== CATEGORY FORM ====================

function CategoryForm({ category, token, onSave, onCancel }: {
  category: Category | null
  token: string
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    slug: category?.slug || '',
    name: category?.name || '',
    image: category?.image || '',
    sort_order: category?.sort_order || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (category) {
        await apiPut(`/api/admin/categories/${category.id}`, form, token)
      } else {
        await apiPost('/api/admin/categories', form, token)
      }
      onSave()
    } catch {
      alert('Error guardando categoria')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{category ? 'Editar Categoria' : 'Nueva Categoria'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Slug (identificador unico, ej: iphones)</label>
            <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="ej: iphones, ipads, macbook" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Nombre visible</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="ej: iPhones, iPads, MacBook" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Imagen</label>
            <ImageUploader token={token} currentImage={form.image} onUpload={url => setForm({...form, image: url})} />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Orden</label>
            <input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.slug || !form.name} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN ADMIN PANEL ====================

export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gordotech-admin-token'))
  const [activeTab, setActiveTabRaw] = useState<Tab>(() => getTabFromPath())

  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabRaw(tab)
    const newPath = TAB_TO_PATH[tab] || '/dashboard'
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath)
    }
  }, [])
  const [stats, setStats] = useState<Stats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [services, setServices] = useState<RepairService[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [conditionFilter, setConditionFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [cityFilter, setCityFilter] = useState('todos')
  
  // Form modals
  const [editingProduct, setEditingProduct] = useState<Product | null | 'new'>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null | 'new'>(null)
  const [editingBubble, setEditingBubble] = useState<Bubble | null | 'new'>(null)
  const [editingService, setEditingService] = useState<RepairService | null | 'new'>(null)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [marqueeTexts, setMarqueeTexts] = useState<MarqueeText[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null)
  
  // Slide editing
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null | 'new'>(null)
  const [slideForm, setSlideForm] = useState({ title: '', subtitle: '', image: '', video_url: '', link: '', sort_order: 0 })
  const [savingSlide, setSavingSlide] = useState(false)
  
  // Marquee editing
  const [newMarqueeText, setNewMarqueeText] = useState('')
  const [editingMarqueeId, setEditingMarqueeId] = useState<number | null>(null)
  const [editingMarqueeValue, setEditingMarqueeValue] = useState('')
  const [savingMarquee, setSavingMarquee] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('gordotech-admin-token', newToken)
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('gordotech-admin-token')
  }

  const loadStats = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/stats', token)
      setStats(data)
    } catch {
      handleLogout()
    }
  }, [token])

  const loadProducts = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/products', token)
      setProducts(data.products)
    } catch {
      handleLogout()
    }
  }, [token])

  const loadCategories = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/categories', token)
      setCategories(data.categories)
    } catch {
      handleLogout()
    }
  }, [token])

  const loadBubbles = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/bubbles', token)
      setBubbles(data.bubbles)
    } catch {
      handleLogout()
    }
  }, [token])

  const loadServices = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/repair-services', token)
      setServices(data.services)
    } catch {
      handleLogout()
    }
  }, [token])

  const loadHeroSlides = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/hero-slides', token)
      setHeroSlides(data.slides)
    } catch {
      handleLogout()
    }
  }, [token])

  const loadMarqueeTexts = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiGet('/api/admin/marquee-texts', token)
      setMarqueeTexts(data.texts)
    } catch {
      handleLogout()
    }
  }, [token])

  // Sync tab with browser back/forward
  useEffect(() => {
    const onPopState = () => setActiveTabRaw(getTabFromPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (token) {
      loadStats()
      loadProducts()
      loadCategories()
      loadBubbles()
      loadServices()
      loadHeroSlides()
      loadMarqueeTexts()
    }
  }, [token, loadStats, loadProducts, loadCategories, loadBubbles, loadServices, loadHeroSlides, loadMarqueeTexts])

  const handleDelete = async () => {
    if (!deleteConfirm || !token) return
    try {
      if (deleteConfirm.type === 'product') await apiDelete(`/api/admin/products/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'category') await apiDelete(`/api/admin/categories/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'bubble') await apiDelete(`/api/admin/bubbles/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'service') await apiDelete(`/api/admin/repair-services/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'slide') await apiDelete(`/api/admin/hero-slides/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'marquee') await apiDelete(`/api/admin/marquee-texts/${deleteConfirm.id}`, token)
      setDeleteConfirm(null)
      loadStats()
      if (deleteConfirm.type === 'product') loadProducts()
      if (deleteConfirm.type === 'category') loadCategories()
      if (deleteConfirm.type === 'bubble') loadBubbles()
      if (deleteConfirm.type === 'service') loadServices()
      if (deleteConfirm.type === 'slide') loadHeroSlides()
      if (deleteConfirm.type === 'marquee') loadMarqueeTexts()
    } catch {
      alert('Error eliminando')
    }
  }

  const handleChangePassword = async () => {
    if (!token) return
    try {
      await apiPost('/api/admin/change-password', { current_password: currentPassword, new_password: newPassword }, token)
      setPasswordMsg('Contrasena actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setPasswordMsg(''), 3000)
    } catch {
      setPasswordMsg('Error: Contrasena actual incorrecta')
    }
  }

  if (!token) return <AdminLogin onLogin={handleLogin} />

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCondition = conditionFilter === 'todos' || 
      (conditionFilter === 'nuevos' && p.condition === 'Nuevo') ||
      (conditionFilter === 'semi-usados' && p.condition === 'Semi-usado')
    const matchesCategory = categoryFilter === 'todos' || p.category === categoryFilter
    const matchesCity = cityFilter === 'todos' || p.available.includes(cityFilter)
    return matchesSearch && matchesCondition && matchesCategory && matchesCity
  })

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'products', label: 'Productos', icon: <Package className="w-4 h-4" /> },
    { id: 'categories', label: 'Categorias', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'bubbles', label: 'Burbujas', icon: <Circle className="w-4 h-4" /> },
    { id: 'services', label: 'Servicios', icon: <Wrench className="w-4 h-4" /> },
    { id: 'slideshow', label: 'Slideshow', icon: <Image className="w-4 h-4" /> },
    { id: 'marquee', label: 'Marquee', icon: <Type className="w-4 h-4" /> },
    { id: 'settings', label: 'Config', icon: <Lock className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>GORDOTECH ADMIN</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <Eye className="w-4 h-4" /> Ver tienda
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm transition-colors">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-gray-900/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>DASHBOARD</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Productos', value: stats.total_products, color: 'blue' },
                { label: 'Nuevos', value: stats.new_products, color: 'green' },
                { label: 'Semi-usados', value: stats.used_products, color: 'amber' },
                { label: 'Categorias', value: stats.categories, color: 'cyan' },
                { label: 'Burbujas', value: stats.bubbles, color: 'purple' },
                { label: 'Servicios', value: stats.repair_services, color: 'rose' },
              ].map((stat, i) => (
                <div key={i} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-2xl p-4`}>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>PRODUCTOS ({products.length})</h2>
              <button onClick={() => setEditingProduct('new')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nuevo Producto
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  {['todos', 'duitama', 'tunja'].map(f => (
                    <button key={f} onClick={() => setCityFilter(f)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${cityFilter === f ? 'bg-green-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-white/10'}`}>
                      {f === 'todos' ? 'Todas' : f === 'duitama' ? 'Duitama' : 'Tunja'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {['todos', 'nuevos', 'semi-usados'].map(f => (
                    <button key={f} onClick={() => setConditionFilter(f)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${conditionFilter === f ? 'bg-blue-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-white/10'}`}>
                      {f === 'todos' ? 'Todos' : f === 'nuevos' ? 'Nuevos' : 'Semi-usados'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setCategoryFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === 'todos' ? 'bg-cyan-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-white/10'}`}>
                  Todas
                </button>
                {categories.map(c => (
                  <button key={c.slug} onClick={() => setCategoryFilter(c.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === c.slug ? 'bg-cyan-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-white/10'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-400 text-xs font-medium px-4 py-3 uppercase">Producto</th>
                      <th className="text-left text-gray-400 text-xs font-medium px-4 py-3 uppercase hidden md:table-cell">Categoria</th>
                      <th className="text-left text-gray-400 text-xs font-medium px-4 py-3 uppercase hidden md:table-cell">Condicion</th>
                      <th className="text-left text-gray-400 text-xs font-medium px-4 py-3 uppercase hidden md:table-cell">Storage</th>
                      <th className="text-left text-gray-400 text-xs font-medium px-4 py-3 uppercase hidden lg:table-cell">Precio</th>
                      <th className="text-left text-gray-400 text-xs font-medium px-4 py-3 uppercase hidden lg:table-cell">Featured</th>
                      <th className="text-right text-gray-400 text-xs font-medium px-4 py-3 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-800" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/1a1a2e/7BA3C9/png?text=${encodeURIComponent(product.name.slice(0,2))}` }} />
                            <div>
                              <p className="text-white text-sm font-medium">{product.name}</p>
                              <p className="text-gray-500 text-xs md:hidden">{product.condition}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-md text-xs font-medium">
                            {categories.find(c => c.slug === product.category)?.name || product.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${product.condition === 'Nuevo' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {product.condition}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-gray-400 text-xs">{product.storage_options.join(', ')}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-gray-400 text-sm">{product.price || '-'}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex gap-1">
                            {product.featured_recommended && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Rec</span>}
                            {product.featured_trending && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Trend</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm({ type: 'product', id: product.id, name: product.name })} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-gray-500">No se encontraron productos</div>
              )}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>CATEGORIAS ({categories.length})</h2>
              <button onClick={() => setEditingCategory('new')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nueva Categoria
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 text-center group hover:border-cyan-500/30 transition-all">
                  <img src={cat.image} alt={cat.name} className="w-20 h-20 rounded-full mx-auto object-cover bg-gray-800 mb-3" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x80/1a1a2e/7BA3C9/png?text=${encodeURIComponent(cat.name.slice(0,2))}` }} />
                  <p className="text-white text-sm font-medium">{cat.name}</p>
                  <p className="text-gray-500 text-xs mb-1">Slug: {cat.slug}</p>
                  <p className="text-gray-500 text-xs mb-3">Orden: {cat.sort_order}</p>
                  <p className="text-cyan-400 text-xs mb-3">{products.filter(p => p.category === cat.slug).length} productos</p>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => setEditingCategory(cat)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUBBLES TAB */}
        {activeTab === 'bubbles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>BURBUJAS DE MODELOS ({bubbles.length})</h2>
              <button onClick={() => setEditingBubble('new')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nueva Burbuja
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bubbles.map(bubble => (
                <div key={bubble.id} className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 text-center group hover:border-blue-500/30 transition-all">
                  <img src={bubble.image} alt={bubble.label} className="w-20 h-20 rounded-full mx-auto object-cover bg-gray-800 mb-3" onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x80/1a1a2e/7BA3C9/png?text=${encodeURIComponent(bubble.label.slice(0,2))}` }} />
                  <p className="text-white text-sm font-medium">{bubble.label}</p>
                  <p className="text-gray-500 text-xs mb-3">ID: {bubble.model_id}</p>
                  <p className="text-gray-500 text-xs mb-3">Orden: {bubble.sort_order}</p>
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => setEditingBubble(bubble)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'bubble', id: bubble.id, name: bubble.label })} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>SERVICIOS DE REPARACION ({services.length})</h2>
              <button onClick={() => setEditingService('new')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nuevo Servicio
              </button>
            </div>

            <div className="space-y-3">
              {services.map(service => (
                <div key={service.id} className="bg-gray-900/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{service.title}</p>
                      <p className="text-gray-400 text-sm">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-medium text-sm hidden md:block">{service.price}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingService(service)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: 'service', id: service.id, name: service.title })} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDESHOW TAB */}
        {activeTab === 'slideshow' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>HERO SLIDESHOW ({heroSlides.length})</h2>
              <button onClick={() => { setEditingSlide('new'); setSlideForm({ title: '', subtitle: '', image: '', video_url: '', link: '#productos', sort_order: heroSlides.length }) }} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nuevo Slide
              </button>
            </div>

            <div className="space-y-3">
              {heroSlides.map(slide => (
                <div key={slide.id} className={`bg-gray-900/50 border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all ${slide.active ? 'border-white/10 hover:border-blue-500/30' : 'border-white/5 opacity-60'}`}>
                  <div className="relative w-full md:w-40 h-24 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
                    {slide.video_url && (slide.video_url.endsWith('.mp4') || slide.video_url.endsWith('.webm') || slide.video_url.endsWith('.mov')) ? (
                      <video src={slide.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" onLoadedData={e => { (e.target as HTMLVideoElement).currentTime = 1 }} />
                    ) : slide.image ? (
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200/1a1a2e/7BA3C9/png?text=Sin+imagen' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-gray-600" /></div>
                    )}
                    {slide.video_url && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-blue-500/80 rounded text-[9px] text-white font-bold flex items-center gap-0.5"><Play className="w-2.5 h-2.5" fill="white" /> VIDEO</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{slide.title || '(Sin titulo)'}</p>
                    <p className="text-gray-400 text-sm truncate">{slide.subtitle || '(Sin subtitulo)'}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-gray-500 text-xs">Orden: {slide.sort_order}</span>
                      <span className="text-gray-500 text-xs">Link: {slide.link || '-'}</span>
                      {slide.video_url && <span className="text-blue-400 text-xs flex items-center gap-1"><Film className="w-3 h-3" />{slide.video_url.split('/').pop()}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${slide.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {slide.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={async () => { await apiPost(`/api/admin/hero-slides/${slide.id}/toggle`, {}, token); loadHeroSlides() }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-yellow-400" title={slide.active ? 'Desactivar' : 'Activar'}>
                      {slide.active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => { setEditingSlide(slide); setSlideForm({ title: slide.title, subtitle: slide.subtitle, image: slide.image, video_url: slide.video_url || '', link: slide.link, sort_order: slide.sort_order }) }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'slide', id: slide.id, name: slide.title || 'Slide' })} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {heroSlides.length === 0 && (
                <div className="text-center py-10 text-gray-500">No hay slides. Agrega uno para mostrar en la pagina principal.</div>
              )}
            </div>

            {/* Slide edit modal */}
            {editingSlide !== null && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
                <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg my-8">
                  <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">{editingSlide === 'new' ? 'Nuevo Slide' : 'Editar Slide'}</h3>
                    <button onClick={() => setEditingSlide(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Imagen del slide</label>
                      <ImageUploader token={token} currentImage={slideForm.image} onUpload={url => setSlideForm({...slideForm, image: url})} />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Video URL (MP4 local o YouTube) - opcional</label>
                      <input value={slideForm.video_url} onChange={e => setSlideForm({...slideForm, video_url: e.target.value})}
                        className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="ej: /videos/mi-video.mp4 o URL de YouTube" />
                      <p className="text-gray-500 text-xs mt-1">Soporta archivos MP4 locales (ej: /videos/nombre.mp4) y YouTube. El video se muestra en lugar de la imagen.</p>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Titulo</label>
                      <input value={slideForm.title} onChange={e => setSlideForm({...slideForm, title: e.target.value})}
                        className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="ej: iPhone 17 Pro Max" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Subtitulo</label>
                      <input value={slideForm.subtitle} onChange={e => setSlideForm({...slideForm, subtitle: e.target.value})}
                        className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="ej: El mas poderoso. Disponible ahora." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Link</label>
                        <input value={slideForm.link} onChange={e => setSlideForm({...slideForm, link: e.target.value})}
                          className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="#productos" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-1">Orden</label>
                        <input type="number" value={slideForm.sort_order} onChange={e => setSlideForm({...slideForm, sort_order: parseInt(e.target.value) || 0})}
                          className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-5 border-t border-white/10">
                    <button onClick={() => setEditingSlide(null)} className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancelar</button>
                    <button onClick={async () => {
                      setSavingSlide(true)
                      try {
                        if (editingSlide === 'new') {
                          await apiPost('/api/admin/hero-slides', slideForm, token)
                        } else {
                          await apiPut(`/api/admin/hero-slides/${editingSlide.id}`, slideForm, token)
                        }
                        setEditingSlide(null)
                        loadHeroSlides()
                        loadStats()
                      } catch { alert('Error guardando slide') } finally { setSavingSlide(false) }
                    }} disabled={savingSlide || (!slideForm.image && !slideForm.video_url)} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      {savingSlide ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MARQUEE TAB */}
        {activeTab === 'marquee' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>TEXTOS DEL BANNER ({marqueeTexts.length})</h2>
            </div>
            <p className="text-gray-400 text-sm">Estos textos se muestran en el banner animado en la parte superior de la pagina. Se concatenan y se desplazan horizontalmente.</p>

            {/* Add new text */}
            <div className="flex gap-3">
              <input
                value={newMarqueeText}
                onChange={e => setNewMarqueeText(e.target.value)}
                placeholder="Nuevo texto para el banner..."
                className="flex-1 bg-gray-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                onKeyDown={async e => {
                  if (e.key === 'Enter' && newMarqueeText.trim()) {
                    setSavingMarquee(true)
                    try {
                      await apiPost('/api/admin/marquee-texts', { text: newMarqueeText.trim(), sort_order: marqueeTexts.length }, token)
                      setNewMarqueeText('')
                      loadMarqueeTexts()
                    } catch { alert('Error') } finally { setSavingMarquee(false) }
                  }
                }}
              />
              <button onClick={async () => {
                if (!newMarqueeText.trim()) return
                setSavingMarquee(true)
                try {
                  await apiPost('/api/admin/marquee-texts', { text: newMarqueeText.trim(), sort_order: marqueeTexts.length }, token)
                  setNewMarqueeText('')
                  loadMarqueeTexts()
                } catch { alert('Error') } finally { setSavingMarquee(false) }
              }} disabled={savingMarquee || !newMarqueeText.trim()} className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>

            {/* Texts list */}
            <div className="space-y-2">
              {marqueeTexts.map((mt, idx) => (
                <div key={mt.id} className={`bg-gray-900/50 border rounded-xl p-3 flex items-center gap-3 transition-all ${mt.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={async () => {
                      if (idx === 0) return
                      await apiPut(`/api/admin/marquee-texts/${mt.id}`, { sort_order: marqueeTexts[idx - 1].sort_order }, token)
                      await apiPut(`/api/admin/marquee-texts/${marqueeTexts[idx - 1].id}`, { sort_order: mt.sort_order }, token)
                      loadMarqueeTexts()
                    }} disabled={idx === 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => {
                      if (idx === marqueeTexts.length - 1) return
                      await apiPut(`/api/admin/marquee-texts/${mt.id}`, { sort_order: marqueeTexts[idx + 1].sort_order }, token)
                      await apiPut(`/api/admin/marquee-texts/${marqueeTexts[idx + 1].id}`, { sort_order: mt.sort_order }, token)
                      loadMarqueeTexts()
                    }} disabled={idx === marqueeTexts.length - 1} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingMarqueeId === mt.id ? (
                      <input
                        value={editingMarqueeValue}
                        onChange={e => setEditingMarqueeValue(e.target.value)}
                        className="w-full bg-gray-800/50 border border-blue-500/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                        autoFocus
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            await apiPut(`/api/admin/marquee-texts/${mt.id}`, { text: editingMarqueeValue }, token)
                            setEditingMarqueeId(null)
                            loadMarqueeTexts()
                          }
                          if (e.key === 'Escape') setEditingMarqueeId(null)
                        }}
                      />
                    ) : (
                      <p className="text-white text-sm truncate">{mt.text}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={async () => {
                      await apiPut(`/api/admin/marquee-texts/${mt.id}`, { active: !mt.active }, token)
                      loadMarqueeTexts()
                    }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title={mt.active ? 'Desactivar' : 'Activar'}>
                      {mt.active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-gray-500" />}
                    </button>
                    <button onClick={() => { setEditingMarqueeId(mt.id); setEditingMarqueeValue(mt.text) }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ type: 'marquee', id: mt.id, name: mt.text.slice(0, 30) })} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {marqueeTexts.length === 0 && (
                <div className="text-center py-10 text-gray-500">No hay textos. Agrega uno para mostrar en el banner superior.</div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-lg">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>CONFIGURACION</h2>
            
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-lg font-semibold text-white">Cambiar Contrasena</h3>
              {passwordMsg && (
                <div className={`p-3 rounded-xl text-sm ${passwordMsg.includes('Error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{passwordMsg}</div>
              )}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Contrasena actual</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Nueva contrasena</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <button onClick={handleChangePassword} disabled={!currentPassword || !newPassword}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors text-sm font-medium">
                Cambiar Contrasena
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {editingProduct !== null && (
        <ProductForm
          product={editingProduct === 'new' ? null : editingProduct}
          token={token}
          categories={categories}
          onSave={() => { setEditingProduct(null); loadProducts(); loadStats() }}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {editingCategory !== null && (
        <CategoryForm
          category={editingCategory === 'new' ? null : editingCategory}
          token={token}
          onSave={() => { setEditingCategory(null); loadCategories(); loadStats() }}
          onCancel={() => setEditingCategory(null)}
        />
      )}

      {editingBubble !== null && (
        <BubbleForm
          bubble={editingBubble === 'new' ? null : editingBubble}
          token={token}
          onSave={() => { setEditingBubble(null); loadBubbles(); loadStats() }}
          onCancel={() => setEditingBubble(null)}
        />
      )}

      {editingService !== null && (
        <ServiceForm
          service={editingService === 'new' ? null : editingService}
          token={token}
          onSave={() => { setEditingService(null); loadServices(); loadStats() }}
          onCancel={() => setEditingService(null)}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Eliminar {deleteConfirm.name}?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta accion no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors text-sm">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
