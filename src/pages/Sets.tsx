import { Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { GameImage } from '../components/GameImage'
import { loadItems } from '../lib/data'
import { itemInLevelRange } from '../lib/items'
import { equippedItems, loadEquippedSelection, SET_STORAGE_KEY, sumItemStats } from '../lib/equipment'
import type { Item } from '../types'

const visibleSlots = ['Helmet', 'Cape', 'Chest', 'Pants', 'Gloves', 'Boots', 'Amulet', 'Ring', 'Left Hand', 'Right Hand', 'Magic', 'Pet', 'Arrow', 'Spirit']

export function Sets() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Record<string, number>>(loadEquippedSelection)
  const [activeSlot, setActiveSlot] = useState('Helmet')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [minLevel, setMinLevel] = useState('')
  const [maxLevel, setMaxLevel] = useState('')

  useEffect(() => { loadItems().then(setItems).catch((reason: Error) => setError(reason.message)) }, [])
  useEffect(() => localStorage.setItem(SET_STORAGE_KEY, JSON.stringify(selected)), [selected])

  const equipped = useMemo(() => equippedItems(items, selected), [items, selected])
  const totals = useMemo(() => sumItemStats(equipped), [equipped])
  const requirements = useMemo(() => equipped.reduce((max, item) => {
    Object.entries(item.requirements).forEach(([name, value]) => { max[name] = Math.max(max[name] || 0, value) })
    return max
  }, {} as Record<string, number>), [equipped])
  const categories = useMemo(() => ['Todas', ...new Set(items.filter((item) => item.slot === activeSlot).map((item) => item.category))], [items, activeSlot])
  const candidates = items.filter((item) =>
    item.slot === activeSlot &&
    item.name.toLowerCase().includes(query.toLowerCase()) &&
    (category === 'Todas' || item.category === category) &&
    itemInLevelRange(item, minLevel, maxLevel),
  ).slice(0, 80)

  if (error) return <ErrorMessage message={error} />
  if (!items.length) return <Loading />

  return (
    <div className="stack-lg">
      <section className="stats-grid four">
        <StatCard label="Aim" value={totals.Aim || 0} />
        <StatCard label="Power" value={totals.Power || 0} tone="gold" />
        <StatCard label="Armor" value={totals.Armor || 0} tone="blue" />
        <StatCard label="Magic" value={totals.Magic || 0} tone="violet" />
      </section>
      <div className="content-grid set-layout">
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">EQUIPO DE BROAR</span><h3>Set actual</h3></div><ShieldCheck size={20} /></div>
          <div className="slot-grid">
            {visibleSlots.map((slot) => {
              const item = items.find((candidate) => candidate.id === selected[slot])
              return <button key={slot} className={`slot-card ${activeSlot === slot ? 'active' : ''}`} onClick={() => { setActiveSlot(slot); setQuery(''); setCategory('Todas') }}>
                {item && <GameImage kind="items" id={item.id} name={item.name} className="slot-sprite" />}
                <span className="slot-copy"><span>{slot}</span><strong>{item?.name || 'Vacío'}</strong>{item && <small>#{item.id}</small>}</span>
              </button>
            })}
          </div>
          <div className="set-footer">
            <div><span>Requisitos máximos</span><strong>{Object.entries(requirements).map(([name, value]) => `${name} ${value}`).join(' · ') || 'Sin requisitos'}</strong></div>
            <button className="icon-text danger" onClick={() => setSelected({})}><Trash2 size={16} /> Vaciar set</button>
          </div>
        </section>
        <section className="panel equipment-picker">
          <div className="panel-heading"><div><span className="eyebrow">{activeSlot.toUpperCase()}</span><h3>Elegir pieza</h3></div></div>
          <div className="small-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar para ${activeSlot}…`} /></div>
          <div className="set-filter-grid">
            <label>Categoría<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
            <label>Nivel mín.<input type="number" min="0" value={minLevel} onChange={(event) => setMinLevel(event.target.value)} placeholder="0" /></label>
            <label>Nivel máx.<input type="number" min="0" value={maxLevel} onChange={(event) => setMaxLevel(event.target.value)} placeholder="∞" /></label>
          </div>
          <div className="picker-list">
            {candidates.map((item) => <button key={item.id} className={selected[activeSlot] === item.id ? 'selected' : ''} onClick={() => setSelected({ ...selected, [activeSlot]: item.id })}><GameImage kind="items" id={item.id} name={item.name} className="picker-sprite" /><div><strong>{item.name}</strong><span>#{item.id} · Nivel {item.level} · {Object.entries(item.stats).slice(0, 3).map(([name, value]) => `${name} ${value > 0 ? '+' : ''}${value}`).join(' · ') || 'Sin stats'}</span></div><span>Equipar</span></button>)}
            {!candidates.length && <p className="filter-empty">No hay piezas para estos filtros.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
