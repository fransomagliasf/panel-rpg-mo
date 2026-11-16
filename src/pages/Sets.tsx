import { Search, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { GameImage } from '../components/GameImage'
import { loadItems } from '../lib/data'
import { itemInLevelRange } from '../lib/items'
import { EQUIPMENT_SLOTS, equippedItems, loadedSpells, loadEquippedSelection, SET_STORAGE_KEY, SPELL_SLOT_PREFIX, sumItemStats } from '../lib/equipment'
import type { Item } from '../types'

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
  const spells = useMemo(() => loadedSpells(items, selected), [items, selected])
  const totals = useMemo(() => sumItemStats(equipped), [equipped])
  const requirements = useMemo(() => [...equipped, ...spells].reduce((max, item) => {
    Object.entries(item.requirements).forEach(([name, value]) => { max[name] = Math.max(max[name] || 0, value) })
    return max
  }, {} as Record<string, number>), [equipped, spells])
  const rightHand = items.find((item) => item.id === selected['Right Hand'])
  const magicSlots = rightHand?.magicSlots ?? 0
  const spellSlotNames = Array.from({ length: magicSlots }, (_, index) => `${SPELL_SLOT_PREFIX}${index + 1}`)
  const dataSlot = activeSlot.startsWith(SPELL_SLOT_PREFIX) ? 'Magic' : activeSlot
  const categories = useMemo(() => ['Todas', ...new Set(items.filter((item) => item.slot === dataSlot).map((item) => item.category))], [items, dataSlot])
  const candidates = items.filter((item) =>
    item.slot === dataSlot &&
    item.name.toLowerCase().includes(query.toLowerCase()) &&
    (category === 'Todas' || item.category === category) &&
    itemInLevelRange(item, minLevel, maxLevel) &&
    (!activeSlot.startsWith(SPELL_SLOT_PREFIX) || !spellSlotNames.some((slot) => slot !== activeSlot && selected[slot] === item.id)),
  ).slice(0, 80)

  const chooseSlot = (slot: string) => { setActiveSlot(slot); setQuery(''); setCategory('Todas') }
  const removeSlot = (slot: string) => {
    const next = { ...selected }
    delete next[slot]
    if (slot === 'Right Hand') spellSlotNames.forEach((spellSlot) => delete next[spellSlot])
    setSelected(next)
  }
  const equip = (item: Item) => {
    const next = { ...selected, [activeSlot]: item.id }
    if (activeSlot === 'Right Hand') {
      const capacity = item.magicSlots ?? 0
      Object.keys(next).filter((slot) => slot.startsWith(SPELL_SLOT_PREFIX) && Number(slot.slice(SPELL_SLOT_PREFIX.length)) > capacity).forEach((slot) => delete next[slot])
    }
    setSelected(next)
  }

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
            {EQUIPMENT_SLOTS.map((slot) => {
              const item = items.find((candidate) => candidate.id === selected[slot])
              return <div key={slot} className={`slot-card ${activeSlot === slot ? 'active' : ''}`}>
                <button className="slot-select" onClick={() => chooseSlot(slot)}>{item && <GameImage kind="items" id={item.id} name={item.name} className="slot-sprite" />}<span className="slot-copy"><span>{slot}</span><strong>{item?.name || 'Vacío'}</strong>{item && <small>#{item.id}</small>}</span></button>
                {item && <button className="slot-remove" onClick={() => removeSlot(slot)} aria-label={`Quitar ${item.name}`} title="Quitar del set"><X size={14} /></button>}
              </div>
            })}
          </div>
          {magicSlots > 0 && <div className="pouch-config">
            <div className="pouch-heading"><div><span className="eyebrow">PODERES DE {rightHand?.name.toUpperCase()}</span><h4>{magicSlots} espacios disponibles</h4></div><Sparkles size={18} /></div>
            <div className="spell-slot-grid">{spellSlotNames.map((slot, index) => {
              const spell = items.find((item) => item.id === selected[slot])
              return <div key={slot} className={`spell-slot ${activeSlot === slot ? 'active' : ''}`}><button className="slot-select" onClick={() => chooseSlot(slot)}>{spell ? <GameImage kind="items" id={spell.id} name={spell.name} className="slot-sprite" /> : <span className="spell-number">{index + 1}</span>}<span className="slot-copy"><span>Poder {index + 1}</span><strong>{spell?.name || 'Vacío'}</strong>{spell && <small>Daño base {spell.stats.Magic || 0}</small>}</span></button>{spell && <button className="slot-remove" onClick={() => removeSlot(slot)} aria-label={`Quitar ${spell.name}`}><X size={14} /></button>}</div>
            })}</div>
            <p>El Análisis de Combate permite elegir cualquiera de estos poderes cargados.</p>
          </div>}
          <div className="set-footer">
            <div><span>Requisitos máximos</span><strong>{Object.entries(requirements).map(([name, value]) => `${name} ${value}`).join(' · ') || 'Sin requisitos'}</strong></div>
            <button className="icon-text danger" onClick={() => setSelected({})}><Trash2 size={16} /> Vaciar set</button>
          </div>
        </section>
        <section className="panel equipment-picker">
          <div className="panel-heading"><div><span className="eyebrow">{activeSlot.startsWith(SPELL_SLOT_PREFIX) ? activeSlot.replace('Spell', 'PODER') : activeSlot.toUpperCase()}</span><h3>{activeSlot.startsWith(SPELL_SLOT_PREFIX) ? 'Elegir poder' : 'Elegir pieza'}</h3></div></div>
          <div className="small-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar para ${activeSlot}…`} /></div>
          <div className="set-filter-grid">
            <label>Categoría<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
            <label>Nivel mín.<input type="number" min="0" value={minLevel} onChange={(event) => setMinLevel(event.target.value)} placeholder="0" /></label>
            <label>Nivel máx.<input type="number" min="0" value={maxLevel} onChange={(event) => setMaxLevel(event.target.value)} placeholder="∞" /></label>
          </div>
          <div className="picker-list">
            {candidates.map((item) => <button key={item.id} className={selected[activeSlot] === item.id ? 'selected' : ''} onClick={() => equip(item)}><GameImage kind="items" id={item.id} name={item.name} className="picker-sprite" /><div><strong>{item.name}</strong><span>#{item.id} · Nivel {item.level} · {activeSlot.startsWith(SPELL_SLOT_PREFIX) ? `Daño base ${item.stats.Magic || 0}` : Object.entries(item.stats).slice(0, 3).map(([name, value]) => `${name} ${value > 0 ? '+' : ''}${value}`).join(' · ') || 'Sin stats'}</span></div><span>{activeSlot.startsWith(SPELL_SLOT_PREFIX) ? 'Cargar' : 'Equipar'}</span></button>)}
            {!candidates.length && <p className="filter-empty">No hay piezas para estos filtros.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
