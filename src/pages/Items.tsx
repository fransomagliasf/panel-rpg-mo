import { ArrowDown, ArrowUp, Filter, LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading } from '../components/Ui'
import { GameImage } from '../components/GameImage'
import { loadItems } from '../lib/data'
import { formatNumber } from '../lib/calculations'
import { itemInLevelRange } from '../lib/items'
import type { Item } from '../types'

type ViewMode = 'cards' | 'table'
type SortKey = 'level' | 'image' | 'name' | 'skill' | 'slot' | 'power' | 'aim' | 'armor' | 'magic' | 'speed' | 'cooldown' | 'archery' | 'archeryBoost'

const skillText = (item: Item) => Object.entries(item.requirements).map(([name, value]) => `${name} ${value}`).join(' · ') || '—'
const sortValue = (item: Item, key: SortKey): string | number | undefined => ({
  level: item.level, image: item.id, name: item.name, skill: skillText(item), slot: item.slot,
  power: item.stats.Power, aim: item.stats.Aim, armor: item.stats.Armor, magic: item.stats.Magic, speed: item.stats.Speed,
  cooldown: item.cooldown, archery: item.archery, archeryBoost: item.archeryBoost,
})[key]

const columns: Array<{ key: SortKey; label: string }> = [
  { key: 'level', label: 'Level' }, { key: 'image', label: 'Imagen' }, { key: 'name', label: 'Item' },
  { key: 'skill', label: 'Skill' }, { key: 'slot', label: 'Ranura' }, { key: 'power', label: 'Power' },
  { key: 'aim', label: 'Aim' }, { key: 'armor', label: 'Armor' }, { key: 'magic', label: 'Magic' },
  { key: 'speed', label: 'Speed' }, { key: 'cooldown', label: '- % cooldown' }, { key: 'archery', label: 'Archery' },
  { key: 'archeryBoost', label: '% Archery boost' },
]

export function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [slot, setSlot] = useState('Todos')
  const [minLevel, setMinLevel] = useState('')
  const [maxLevel, setMaxLevel] = useState('')
  const [limit, setLimit] = useState(48)
  const [view, setView] = useState<ViewMode>(() => localStorage.getItem('mo-tracker-item-view') === 'table' ? 'table' : 'cards')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => { loadItems().then(setItems).catch((reason: Error) => setError(reason.message)) }, [])
  useEffect(() => setLimit(view === 'table' ? 100 : 48), [query, category, slot, minLevel, maxLevel, view])
  useEffect(() => localStorage.setItem('mo-tracker-item-view', view), [view])

  const categories = useMemo(() => ['Todas', ...new Set(items.map((item) => item.category))], [items])
  const slots = useMemo(() => ['Todos', ...new Set(items.map((item) => item.slot).filter((name) => name !== 'None'))], [items])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) =>
      (!normalized || item.name.toLowerCase().includes(normalized) || String(item.id) === normalized) &&
      (category === 'Todas' || item.category === category) &&
      (slot === 'Todos' || item.slot === slot) &&
      itemInLevelRange(item, minLevel, maxLevel),
    )
  }, [items, query, category, slot, minLevel, maxLevel])
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aValue = sortValue(a, sortKey)
    const bValue = sortValue(b, sortKey)
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1
    const comparison = typeof aValue === 'number' && typeof bValue === 'number' ? aValue - bValue : String(aValue).localeCompare(String(bValue), 'es', { numeric: true })
    return sortDirection === 'asc' ? comparison : -comparison
  }), [filtered, sortKey, sortDirection])

  const sortBy = (key: SortKey) => {
    if (sortKey === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDirection('asc') }
  }

  if (error) return <ErrorMessage message={error} />
  if (!items.length) return <Loading />

  return (
    <div className="stack-lg">
      <section className="search-hero">
        <div><span className="eyebrow">BASE DE DATOS</span><h2>Encontrá cualquier ítem</h2><p>Datos públicos extraídos de los archivos actuales del juego.</p></div>
        <div className="big-search"><Search size={21} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o ID…" /></div>
      </section>
      <section className="filter-bar">
        <div className="filter-label"><SlidersHorizontal size={17} /> Filtros</div>
        <label><Filter size={15} /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label><select value={slot} onChange={(event) => setSlot(event.target.value)}>{slots.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="level-filter"><span>Nivel mín.</span><input type="number" min="0" value={minLevel} onChange={(event) => setMinLevel(event.target.value)} placeholder="0" /></label>
        <label className="level-filter"><span>Nivel máx.</span><input type="number" min="0" value={maxLevel} onChange={(event) => setMaxLevel(event.target.value)} placeholder="∞" /></label>
        <span className="result-count">{formatNumber(filtered.length)} resultados</span>
        <div className="view-toggle" aria-label="Modo de visualización"><button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} title="Tarjetas"><LayoutGrid size={16} /></button><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} title="Tabla"><List size={17} /></button></div>
      </section>
      {view === 'cards' ? <section className="item-grid">{sorted.slice(0, limit).map((item) => <ItemCard item={item} key={item.id} />)}</section> : <ItemTable items={sorted.slice(0, limit)} sortKey={sortKey} sortDirection={sortDirection} sortBy={sortBy} />}
      {limit < sorted.length && <button className="secondary-button centered" onClick={() => setLimit(limit + (view === 'table' ? 100 : 48))}>Mostrar más</button>}
    </div>
  )
}

function ItemTable({ items, sortKey, sortDirection, sortBy }: { items: Item[]; sortKey: SortKey; sortDirection: 'asc' | 'desc'; sortBy: (key: SortKey) => void }) {
  const value = (item: Item, key: SortKey) => {
    if (key === 'image') return <GameImage kind="items" id={item.id} name={item.name} className="table-item-sprite" />
    if (key === 'name') return <strong>{item.name}</strong>
    if (key === 'skill') return skillText(item)
    if (key === 'slot') return item.slot === 'None' ? '—' : item.slot
    if (key === 'cooldown') return item.cooldown === undefined ? '—' : `-${Math.round(item.cooldown * 100)}%`
    if (key === 'archeryBoost') return item.archeryBoost === undefined ? '—' : `${Math.round(item.archeryBoost * 100)}%`
    const raw = sortValue(item, key)
    return raw === undefined ? '—' : raw
  }
  return <section className="panel item-table-panel"><div className="item-table-wrap"><table className="item-data-table"><thead><tr>{columns.map((column) => <th key={column.key} aria-sort={sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}><button onClick={() => sortBy(column.key)}>{column.label}{sortKey === column.key && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</button></th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.key}>{value(item, column.key)}</td>)}</tr>)}</tbody></table></div></section>
}

export function ItemCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  const stats = Object.entries(item.stats).filter(([, value]) => value !== 0)
  const requirements = Object.entries(item.requirements).filter(([, value]) => value > 0)
  return (
    <article className={`item-card ${compact ? 'compact' : ''}`}>
      <div className="item-card-top"><GameImage kind="items" id={item.id} name={item.name} className="item-glyph" /><div><span>#{item.id} · {item.category}</span><h3>{item.name}</h3></div></div>
      <div className="item-meta"><span>{item.slot !== 'None' ? item.slot : 'Sin ranura'} · Nivel {item.level}</span>{item.price !== undefined && <span>{formatNumber(item.price)} 🪙</span>}</div>
      {!!stats.length && <div className="stat-chips">{stats.slice(0, 6).map(([name, value]) => <span key={name}><small>{name}</small><strong>{value > 0 ? '+' : ''}{value}</strong></span>)}</div>}
      {!!requirements.length && <p className="requirements">Requiere {requirements.map(([name, value]) => `${name} ${value}`).join(' · ')}</p>}
    </article>
  )
}
