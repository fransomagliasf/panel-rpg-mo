import { Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { loadItems } from '../lib/data'
import type { Item } from '../types'

const visibleSlots = ['Helmet', 'Cape', 'Chest', 'Pants', 'Gloves', 'Boots', 'Amulet', 'Ring', 'Left Hand', 'Right Hand', 'Magic', 'Pet', 'Arrow', 'Spirit']

export function Sets() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem('mo-tracker-set') || '{}'))
  const [activeSlot, setActiveSlot] = useState('Helmet')
  const [query, setQuery] = useState('')

  useEffect(() => { loadItems().then(setItems).catch((reason: Error) => setError(reason.message)) }, [])
  useEffect(() => localStorage.setItem('mo-tracker-set', JSON.stringify(selected)), [selected])

  const equipped = useMemo(() => visibleSlots.map((slot) => items.find((item) => item.id === selected[slot])).filter(Boolean) as Item[], [items, selected])
  const totals = useMemo(() => equipped.reduce((sum, item) => {
    Object.entries(item.stats).forEach(([name, value]) => { sum[name] = (sum[name] || 0) + value })
    return sum
  }, {} as Record<string, number>), [equipped])
  const requirements = useMemo(() => equipped.reduce((max, item) => {
    Object.entries(item.requirements).forEach(([name, value]) => { max[name] = Math.max(max[name] || 0, value) })
    return max
  }, {} as Record<string, number>), [equipped])
  const candidates = items.filter((item) => item.slot === activeSlot && item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 80)

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
          <div className="panel-heading"><div><span className="eyebrow">EQUIPO</span><h3>Tu set</h3></div><ShieldCheck size={20} /></div>
          <div className="slot-grid">
            {visibleSlots.map((slot) => {
              const item = items.find((candidate) => candidate.id === selected[slot])
              return <button key={slot} className={`slot-card ${activeSlot === slot ? 'active' : ''}`} onClick={() => { setActiveSlot(slot); setQuery('') }}><span>{slot}</span><strong>{item?.name || 'Vacío'}</strong>{item && <small>#{item.id}</small>}</button>
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
          <div className="picker-list">
            {candidates.map((item) => <button key={item.id} className={selected[activeSlot] === item.id ? 'selected' : ''} onClick={() => setSelected({ ...selected, [activeSlot]: item.id })}><div><strong>{item.name}</strong><span>#{item.id} · {Object.entries(item.stats).slice(0, 3).map(([name, value]) => `${name} ${value > 0 ? '+' : ''}${value}`).join(' · ') || 'Sin stats'}</span></div><span>Equipar</span></button>)}
          </div>
        </section>
      </div>
    </div>
  )
}
