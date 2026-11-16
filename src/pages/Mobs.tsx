import { Crosshair, Info, RefreshCw, Search, SlidersHorizontal, Sparkles, Swords } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { GameImage } from '../components/GameImage'
import { combatXp, estimateMobCombat, formatNumber, type CombatEstimateInput, type FightStyle } from '../lib/calculations'
import { equippedItems, loadEquippedSelection, sumItemStats } from '../lib/equipment'
import { loadItems, loadMobs, loadPlayerHistory } from '../lib/data'
import type { Item, Mob } from '../types'

const styles: Array<{ id: FightStyle; name: string }> = [
  { id: 'controlled', name: 'Controlled' }, { id: 'accurate', name: 'Accurate' },
  { id: 'aggressive', name: 'Aggressive' }, { id: 'defensive', name: 'Defensive' },
  { id: 'cordial', name: 'Cordial' },
]

type RankedMob = Mob & ReturnType<typeof estimateMobCombat>
const decimal = (value: number, digits = 1) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: digits }).format(value)

export function Mobs() {
  const [mobs, setMobs] = useState<Mob[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('Todas')
  const [selectedId, setSelectedId] = useState(1)
  const [style, setStyle] = useState<FightStyle>('accurate')
  const [doubleXp, setDoubleXp] = useState(false)
  const [accuracyLevel, setAccuracyLevel] = useState(92)
  const [strengthLevel, setStrengthLevel] = useState(90)
  const [aim, setAim] = useState(0)
  const [power, setPower] = useState(0)
  const [attackSeconds, setAttackSeconds] = useState(2)
  const [betweenKillsSeconds, setBetweenKillsSeconds] = useState(1.5)

  useEffect(() => {
    Promise.all([loadMobs(), loadItems(), loadPlayerHistory('Broar')]).then(([mobData, itemData, history]) => {
      setMobs(mobData)
      setItems(itemData)
      const latest = history.snapshots.at(-1)
      setAccuracyLevel(latest?.boards.find((board) => board.board === 'accuracy')?.score ?? 92)
      setStrengthLevel(latest?.boards.find((board) => board.board === 'strength')?.score ?? 90)
    }).catch((reason: Error) => setError(reason.message))
  }, [])

  const equipped = useMemo(() => equippedItems(items, loadEquippedSelection()), [items])
  const setStats = useMemo(() => sumItemStats(equipped), [equipped])
  useEffect(() => {
    setAim(setStats.Aim || 0)
    setPower(setStats.Power || 0)
  }, [setStats.Aim, setStats.Power])

  const input: CombatEstimateInput = { accuracyLevel, strengthLevel, aim, power, style, attackSeconds, betweenKillsSeconds, doubleXp }
  const locations = useMemo(() => ['Todas', ...new Set(mobs.flatMap((mob) => mob.locations))].sort(), [mobs])
  const ranked: RankedMob[] = useMemo(() => mobs
    .filter((mob) => mob.name.toLowerCase().includes(query.toLowerCase()) && (location === 'Todas' || mob.locations.includes(location)))
    .map((mob) => ({ ...mob, ...estimateMobCombat(mob.health, mob.defense, input) }))
    .sort((a, b) => b.xpPerHour - a.xpPerHour), [mobs, query, location, accuracyLevel, strengthLevel, aim, power, style, attackSeconds, betweenKillsSeconds, doubleXp])
  const selected = ranked.find((mob) => mob.id === selectedId) ?? ranked[0]
  const maxXp = ranked[0]?.xpPerHour || 1
  const xp = selected ? combatXp(selected.health, style, doubleXp) : combatXp(0, style)

  const reloadSet = () => {
    const stats = sumItemStats(equippedItems(items, loadEquippedSelection()))
    setAim(stats.Aim || 0)
    setPower(stats.Power || 0)
  }

  if (error) return <ErrorMessage message={error} />
  if (!mobs.length || !items.length) return <Loading />

  return (
    <div className="stack-lg">
      <section className="combat-intro panel">
        <div><span className="eyebrow">COMPARADOR VISUAL</span><h2>¿Qué mob le conviene a Broar?</h2><p>Usa los niveles oficiales del highscore, el Aim y Power de tu set actual, la vida y la defensa de cada mob.</p></div>
        <div className="combat-set-summary"><Swords size={22} /><div><span>Set conectado</span><strong>{equipped.length} piezas · Aim {setStats.Aim || 0} · Power {setStats.Power || 0}</strong></div><button onClick={reloadSet} title="Recargar set"><RefreshCw size={15} /></button></div>
      </section>

      <div className="combat-workbench">
        <aside className="panel combat-settings">
          <div className="panel-heading"><div><span className="eyebrow">BROAR + SET ACTUAL</span><h3>Parámetros de combate</h3></div><SlidersHorizontal size={19} /></div>
          <div className="combat-field-grid">
            <label>Accuracy<input type="number" min="1" value={accuracyLevel} onChange={(event) => setAccuracyLevel(Number(event.target.value))} /></label>
            <label>Strength<input type="number" min="1" value={strengthLevel} onChange={(event) => setStrengthLevel(Number(event.target.value))} /></label>
            <label>Aim del set<input type="number" min="0" value={aim} onChange={(event) => setAim(Number(event.target.value))} /></label>
            <label>Power del set<input type="number" min="0" value={power} onChange={(event) => setPower(Number(event.target.value))} /></label>
            <label>Seg. por ataque<input type="number" min="0.2" step="0.1" value={attackSeconds} onChange={(event) => setAttackSeconds(Number(event.target.value))} /></label>
            <label>Demora entre mobs<input type="number" min="0" step="0.5" value={betweenKillsSeconds} onChange={(event) => setBetweenKillsSeconds(Number(event.target.value))} /></label>
          </div>
          <label className="combat-style">Postura<select value={style} onChange={(event) => setStyle(event.target.value as FightStyle)}>{styles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="toggle-row"><input type="checkbox" checked={doubleXp} onChange={(event) => setDoubleXp(event.target.checked)} /><span className="toggle" /><span>Evento de XP 2×</span></label>
          {!equipped.length && <button className="secondary-button full" onClick={() => { window.location.hash = '/sets' }}>Cargar el set de Broar</button>}
          <div className="combat-formula-card"><span>Daño físico estimado</span><strong>{selected?.minHit ?? 0}–{selected?.maxHit ?? 0}</strong><small>Promedio al acertar: {decimal(selected?.averageLandedHit ?? 0)}</small></div>
          <div className="info-callout"><Info size={17} /><p>La distribución de XP por daño es la fórmula publicada por la wiki. El tiempo usa un modelo comunitario de tiradas Aim/Defense y Strength/Power; podés calibrarlo con “seg. por ataque” y la demora real entre mobs.</p></div>
        </aside>

        <section className="panel recommendation-panel">
          <div className="panel-heading"><div><span className="eyebrow">RANKING DINÁMICO</span><h3>Mejores mobs por XP/h</h3></div><Sparkles size={19} /></div>
          <div className="recommendation-filters">
            <div className="small-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mob…" /></div>
            <label>Zona<select value={location} onChange={(event) => setLocation(event.target.value)}>{locations.map((name) => <option key={name}>{name}</option>)}</select></label>
          </div>
          <div className="recommendation-list">
            {ranked.slice(0, 60).map((mob, index) => <button key={mob.id} className={selected?.id === mob.id ? 'selected' : ''} onClick={() => setSelectedId(mob.id)}>
              <span className="recommendation-rank">#{index + 1}</span>
              <GameImage kind="mobs" id={mob.id} name={mob.name} className="mob-thumb" />
              <span className="recommendation-name"><strong>{mob.name}</strong><small>{mob.health} HP · {mob.defense} DEF · {decimal(mob.fightSeconds)} s</small></span>
              <span className="recommendation-bar"><i style={{ width: `${Math.max(3, mob.xpPerHour / maxXp * 100)}%` }} /></span>
              <span className="recommendation-value"><strong>{formatNumber(mob.xpPerHour)}</strong><small>XP/h</small></span>
            </button>)}
            {!ranked.length && <p className="filter-empty">No hay mobs para esta búsqueda.</p>}
          </div>
        </section>
      </div>

      {selected && <div className="content-grid mob-detail-layout">
        <section className="mob-hero panel">
          <div><span className="eyebrow">ANÁLISIS SELECCIONADO</span><h2>{selected.name}</h2><p>{selected.locations.join(' · ') || 'Ubicación no informada'}</p></div>
          <div className="mob-visual"><GameImage kind="mobs" id={selected.id} name={selected.name} className="mob-portrait" eager /><div className="mob-level-big"><span>LVL</span><strong>{selected.combatLevel}</strong></div></div>
          <div className="mob-stats"><span><small>Daño min–max</small><strong>{selected.minHit}–{selected.maxHit}</strong></span><span><small>Acierto</small><strong>{decimal(selected.hitChance * 100)}%</strong></span><span><small>Golpes esperados</small><strong>{decimal(selected.attacks)}</strong></span><span><small>Tiempo / kill</small><strong>{decimal(selected.fightSeconds)} s</strong></span></div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">EXPERIENCIA</span><h3>Resultado estimado</h3></div><Crosshair size={20} /></div>
          <div className="stats-grid four compact-stats"><StatCard label="Accuracy" value={formatNumber(xp.accuracy)} /><StatCard label="Strength" value={formatNumber(xp.strength)} tone="gold" /><StatCard label="Defense" value={formatNumber(xp.defense)} tone="blue" /><StatCard label="Health" value={formatNumber(xp.health)} tone="violet" /></div>
          <div className="xp-total"><div><span>XP total por kill</span><strong>{formatNumber(selected.xpPerKill)}</strong></div><div><span>Proyección por hora</span><strong>{formatNumber(selected.xpPerHour)}</strong></div></div>
        </section>
      </div>}
    </div>
  )
}
