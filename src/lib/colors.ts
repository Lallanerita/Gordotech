// Shared color map - Spanish color names to CSS hex values
// Used by both App.tsx and AdminPanel.tsx

export const COLOR_MAP: Record<string, string> = {
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

export function resolveColor(color: string): string {
  const trimmed = color.trim().toLowerCase()
  if (COLOR_MAP[trimmed]) return COLOR_MAP[trimmed]
  const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (COLOR_MAP[normalized]) return COLOR_MAP[normalized]
  const firstWord = trimmed.split(/\s+/)[0]
  if (COLOR_MAP[firstWord]) return COLOR_MAP[firstWord]
  return color
}
