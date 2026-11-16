import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading } from '../components/Ui'
import { GameImage } from '../components/GameImage'
import { loadItems } from '../lib/data'
import { formatNumber } from '../lib/calculations'
import { itemInLevelRange } from '../lib/items'
import type { Item } from '../types'

export function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [slot, setSlot] = useState('Todos')
  const [minLevel, setMinLevel] = useState('')
  const [maxLevel, setMaxLevel] = useState('')
  const [limit, setLimit] = useState(48)

  useEffect(() => { loadItems().then(setItems).catch((reason: Error) => setError(reason.message)) }, [])
  useEffect(() => setLimit(48), [query, category, slot, minLevel, maxLevel])

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
      </section>
      <section className="item-grid">
        {filtered.slice(0, limit).map((item) => <ItemCard item={item} key={item.id} />)}
      </section>
      {limit < filtered.length && <button className="secondary-button centered" onClick={() => setLimit(limit + 48)}>Mostrar más</button>}
    </div>
  )
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
