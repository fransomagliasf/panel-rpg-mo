import { Crosshair, Info, Search, Swords } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { combatXp, formatNumber, type FightStyle } from '../lib/calculations'
import { loadMobs } from '../lib/data'
import type { Mob } from '../types'

const styles: Array<{ id: FightStyle; name: string }> = [
  { id: 'controlled', name: 'Controlled' }, { id: 'accurate', name: 'Accurate' },
  { id: 'aggressive', name: 'Aggressive' }, { id: 'defensive', name: 'Defensive' },
  { id: 'cordial', name: 'Cordial' },
]

export function Mobs() {
  const [mobs, setMobs] = useState<Mob[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(1)
  const [style, setStyle] = useState<FightStyle>('accurate')
  const [doubleXp, setDoubleXp] = useState(false)
  const [killsPerHour, setKillsPerHour] = useState(30)

  useEffect(() => { loadMobs().then(setMobs).catch((reason: Error) => setError(reason.message)) }, [])
  const selected = mobs.find((mob) => mob.id === selectedId) ?? mobs[0]
  const xp = selected ? combatXp(selected.health, style, doubleXp) : combatXp(0, style)
  const filtered = useMemo(() => mobs.filter((mob) => mob.name.toLowerCase().includes(query.toLowerCase())).slice(0, 60), [mobs, query])

  if (error) return <ErrorMessage message={error} />
  if (!selected) return <Loading />

  return (
    <div className="stack-lg">
      <div className="content-grid mob-layout">
        <section className="panel mob-browser">
          <div className="panel-heading"><div><span className="eyebrow">BESTIARIO</span><h3>Elegí un mob</h3></div><Crosshair size={20} /></div>
          <div className="small-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mob…" /></div>
          <div className="mob-list">
            {filtered.map((mob) => <button key={mob.id} className={selected.id === mob.id ? 'selected' : ''} onClick={() => setSelectedId(mob.id)}><div className="mob-level">{mob.combatLevel}</div><div><strong>{mob.name}</strong><span>{mob.health} HP · {mob.locations.slice(0, 2).join(', ') || 'Sin ubicación'}</span></div></button>)}
          </div>
        </section>
        <section className="stack-lg">
          <div className="mob-hero panel">
            <div><span className="eyebrow">MOB SELECCIONADO</span><h2>{selected.name}</h2><p>{selected.locations.join(' · ') || 'Ubicación no informada'}</p></div>
            <div className="mob-level-big"><span>LVL</span><strong>{selected.combatLevel}</strong></div>
            <div className="mob-stats"><span><small>Health</small><strong>{selected.health}</strong></span><span><small>Accuracy</small><strong>{selected.accuracy}</strong></span><span><small>Strength</small><strong>{selected.strength}</strong></span><span><small>Defense</small><strong>{selected.defense}</strong></span></div>
          </div>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">CALCULADORA</span><h3>Experiencia por kill</h3></div><Swords size={20} /></div>
            <div className="calculator-controls">
              <label>Postura<select value={style} onChange={(event) => setStyle(event.target.value as FightStyle)}>{styles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label>Kills por hora<input type="number" min="1" value={killsPerHour} onChange={(event) => setKillsPerHour(Number(event.target.value))} /></label>
              <label className="toggle-row compact"><input type="checkbox" checked={doubleXp} onChange={(event) => setDoubleXp(event.target.checked)} /><span className="toggle" /><span>Evento 2×</span></label>
            </div>
            <div className="stats-grid four compact-stats">
              <StatCard label="Accuracy" value={formatNumber(xp.accuracy)} />
              <StatCard label="Strength" value={formatNumber(xp.strength)} tone="gold" />
              <StatCard label="Defense" value={formatNumber(xp.defense)} tone="blue" />
              <StatCard label="Health" value={formatNumber(xp.health)} tone="violet" />
            </div>
            <div className="xp-total"><div><span>XP total por kill</span><strong>{formatNumber(xp.total)}</strong></div><div><span>Proyección por hora</span><strong>{formatNumber(xp.total * killsPerHour)}</strong></div></div>
            <div className="info-callout"><Info size={17} /><p>Estimación para daño físico equivalente a toda la vida del mob. No incluye regeneración, daño de otros jugadores, magia ni recompensas especiales. En Controlled se muestran decimales redondeados visualmente.</p></div>
          </section>
        </section>
      </div>
    </div>
  )
}
