import {
  Backpack,
  BookOpen,
  Boxes,
  Calculator,
  ChartNoAxesCombined,
  ChevronRight,
  Home,
  Menu,
  MapPinned,
  Swords,
  UserRound,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

export const routes = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'personaje', label: 'Mi personaje', icon: UserRound },
  { id: 'experiencia', label: 'Experiencia', icon: ChartNoAxesCombined },
  { id: 'items', label: 'Ítems', icon: Backpack },
  { id: 'sets', label: 'Armador de sets', icon: Swords },
  { id: 'mobs', label: 'XP por mob', icon: Calculator },
  { id: 'mapa', label: 'Mapa', icon: MapPinned },
  { id: 'oficios', label: 'Oficios', icon: Boxes },
  { id: 'fuentes', label: 'Fuentes y ruta', icon: BookOpen },
] as const

export type RouteId = (typeof routes)[number]['id']

type Props = {
  active: RouteId
  onNavigate: (route: RouteId) => void
  children: ReactNode
  characterName: string
}

export function Layout({ active, onNavigate, children, characterName }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const current = routes.find((route) => route.id === active) ?? routes[0]

  const navigate = (route: RouteId) => {
    onNavigate(route)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
        <Menu size={22} />
      </button>
      {menuOpen && <button className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>MO Tracker</strong>
            <span>RPG MO Companion</span>
          </div>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <nav className="nav-list" aria-label="Navegación principal">
          {routes.map(({ id, label, icon: Icon }) => (
            <button key={id} className={active === id ? 'active' : ''} onClick={() => navigate(id)}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {active === id && <ChevronRight className="nav-chevron" size={16} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="status-dot" />
          <div>
            <span>Perfil local</span>
            <strong>{characterName || 'Sin nombre'}</strong>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">RPG MO · Herramientas comunitarias</span>
            <h1>{current.label}</h1>
          </div>
          <a className="game-link" href="https://mo.ee" target="_blank" rel="noreferrer">Abrir juego ↗</a>
        </header>
        <div className="page-body">{children}</div>
      </main>
    </div>
  )
}
