import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, Edit3, Save, LogOut, Upload, BarChart3, Package, Circle, Wrench, Eye, Search, Lock } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Product = {
  id: number
  name: string
  condition: string
  image: string
  colors: string[]
  storage_options: string[]
  badge: string | null
  available: string[]
  price: string
  description: string
  featured_recommended: boolean
  featured_trending: boolean
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

type Stats = {
  total_products: number
  new_products: number
  used_products: number
  bubbles: number
  repair_services: number
}

type Tab = 'dashboard' | 'products' | 'bubbles' | 'services' | 'settings'

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

// ==================== PRODUCT FORM ====================

function ProductForm({ product, token, onSave, onCancel }: {
  product: Product | null
  token: string
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    condition: product?.condition || 'Semi-usado',
    image: product?.image || '',
    colors: product?.colors?.join(', ') || '',
    storage_options: product?.storage_options?.join(', ') || '',
    badge: product?.badge || '',
    available_duitama: product?.available?.includes('duitama') ?? true,
    available_tunja: product?.available?.includes('tunja') ?? true,
    price: product?.price || '',
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
        condition: form.condition,
        image: form.image,
        colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
        storage_options: form.storage_options.split(',').map(s => s.trim()).filter(Boolean),
        badge: form.badge || null,
        available,
        price: form.price,
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
            <label className="block text-gray-400 text-sm mb-1">Imagen</label>
            <ImageUploader token={token} currentImage={form.image} onUpload={url => setForm({...form, image: url})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Opciones de almacenamiento (separadas por coma)</label>
              <input value={form.storage_options} onChange={e => setForm({...form, storage_options: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="128GB, 256GB, 512GB" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Colores hex (separados por coma)</label>
              <input value={form.colors} onChange={e => setForm({...form, colors: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="#000000, #FFFFFF, #4169E1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Precio</label>
              <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50" placeholder="$2.500.000" />
            </div>
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

// ==================== MAIN ADMIN PANEL ====================

export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gordotech-admin-token'))
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [services, setServices] = useState<RepairService[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [conditionFilter, setConditionFilter] = useState('todos')
  
  // Form modals
  const [editingProduct, setEditingProduct] = useState<Product | null | 'new'>(null)
  const [editingBubble, setEditingBubble] = useState<Bubble | null | 'new'>(null)
  const [editingService, setEditingService] = useState<RepairService | null | 'new'>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null)

  // Password change
  const [_showPasswordChange, _setShowPasswordChange] = useState(false)
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

  useEffect(() => {
    if (token) {
      loadStats()
      loadProducts()
      loadBubbles()
      loadServices()
    }
  }, [token, loadStats, loadProducts, loadBubbles, loadServices])

  const handleDelete = async () => {
    if (!deleteConfirm || !token) return
    try {
      if (deleteConfirm.type === 'product') await apiDelete(`/api/admin/products/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'bubble') await apiDelete(`/api/admin/bubbles/${deleteConfirm.id}`, token)
      if (deleteConfirm.type === 'service') await apiDelete(`/api/admin/repair-services/${deleteConfirm.id}`, token)
      setDeleteConfirm(null)
      loadStats()
      if (deleteConfirm.type === 'product') loadProducts()
      if (deleteConfirm.type === 'bubble') loadBubbles()
      if (deleteConfirm.type === 'service') loadServices()
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
    return matchesSearch && matchesCondition
  })

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'products', label: 'Productos', icon: <Package className="w-4 h-4" /> },
    { id: 'bubbles', label: 'Burbujas', icon: <Circle className="w-4 h-4" /> },
    { id: 'services', label: 'Servicios', icon: <Wrench className="w-4 h-4" /> },
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
              onClick={() => setActiveTab(tab.id)}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Productos', value: stats.total_products, color: 'blue' },
                { label: 'Nuevos', value: stats.new_products, color: 'green' },
                { label: 'Semi-usados', value: stats.used_products, color: 'amber' },
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
                {['todos', 'nuevos', 'semi-usados'].map(f => (
                  <button key={f} onClick={() => setConditionFilter(f)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${conditionFilter === f ? 'bg-blue-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-white/10'}`}>
                    {f === 'todos' ? 'Todos' : f === 'nuevos' ? 'Nuevos' : 'Semi-usados'}
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
          onSave={() => { setEditingProduct(null); loadProducts(); loadStats() }}
          onCancel={() => setEditingProduct(null)}
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
