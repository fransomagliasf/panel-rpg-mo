import { Crosshair, Info, RefreshCw, Search, SlidersHorizontal, Sparkles, Swords } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { GameImage } from '../components/GameImage'
import { combatXp, estimateMagicCombat, estimateMobCombat, formatNumber, type CombatEstimateInput, type FightStyle } from '../lib/calculations'
import { equippedItems, loadedSpells, loadEquippedSelection, sumItemStats } from '../lib/equipment'
import { loadItems, loadMobs, loadPlayerHistory } from '../lib/data'
import type { Item, Mob } from '../types'

const styles: Array<{ id: FightStyle; name: string }> = [
  { id: 'controlled', name: 'Controlled' }, { id: 'accurate', name: 'Accurate' },
  { id: 'aggressive', name: 'Aggressive' }, { id: 'defensive', name: 'Defensive' },
  { id: 'cordial', name: 'Cordial' },
]

type RankedMob = Mob & {
  minHit: number
  maxHit: number
  averageDamage: number
  attacks: number
  fightSeconds: number
  killsPerHour: number
  score: number
  xpPerKill: number
  xpPerHour: number
  hitChance?: number
  defenseReduction?: number
  blockReduction?: number
}

const decimal = (value: number, digits = 1) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: digits }).format(value)

export function Mobs() {
  const [mobs, setMobs] = useState<Mob[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('Todas')
  const [selectedId, setSelectedId] = useState(1)
  const [style, setStyle] = useState<FightStyle>('accurate')
  const [attackSource, setAttackSource] = useState('physical')
  const [doubleXp, setDoubleXp] = useState(false)
  const [accuracyLevel, setAccuracyLevel] = useState(92)
  const [strengthLevel, setStrengthLevel] = useState(90)
  const [magicLevel, setMagicLevel] = useState(89)
  const [aim, setAim] = useState(0)
  const [power, setPower] = useState(0)
  const [magicPenetration, setMagicPenetration] = useState(0)
  const [attackSeconds, setAttackSeconds] = useState(2)
  const [betweenKillsSeconds, setBetweenKillsSeconds] = useState(1.5)

  useEffect(() => {
    Promise.all([loadMobs(), loadItems(), loadPlayerHistory('Broar')]).then(([mobData, itemData, history]) => {
      setMobs(mobData)
      setItems(itemData)
      const latest = history.snapshots.at(-1)
      setAccuracyLevel(latest?.boards.find((board) => board.board === 'accuracy')?.score ?? 92)
      setStrengthLevel(latest?.boards.find((board) => board.board === 'strength')?.score ?? 90)
      setMagicLevel(latest?.boards.find((board) => board.board === 'magic')?.score ?? 89)
    }).catch((reason: Error) => setError(reason.message))
  }, [])

  const selection = useMemo(() => loadEquippedSelection(), [items])
  const equipped = useMemo(() => equippedItems(items, selection), [items, selection])
  const spells = useMemo(() => loadedSpells(items, selection), [items, selection])
  const setStats = useMemo(() => sumItemStats(equipped), [equipped])
  const selectedSpell = spells.find((spell) => String(spell.id) === attackSource)
  const isMagic = Boolean(selectedSpell)

  useEffect(() => {
    setAim(setStats.Aim || 0)
    setPower(setStats.Power || 0)
    setMagicPenetration(setStats.Magic || 0)
  }, [setStats.Aim, setStats.Power, setStats.Magic])
  useEffect(() => {
    if (attackSource !== 'physical' && !spells.some((spell) => String(spell.id) === attackSource)) setAttackSource('physical')
  }, [attackSource, spells])

  const physicalInput: CombatEstimateInput = { accuracyLevel, strengthLevel, aim, power, style, attackSeconds, betweenKillsSeconds, doubleXp }
  const locations = useMemo(() => ['Todas', ...new Set(mobs.flatMap((mob) => mob.locations))].sort(), [mobs])
  const ranked: RankedMob[] = useMemo(() => mobs
    .filter((mob) => mob.name.toLowerCase().includes(query.toLowerCase()) && (location === 'Todas' || mob.locations.includes(location)))
    .map((mob) => {
      if (selectedSpell) {
        const magic = estimateMagicCombat(mob.health, mob.defense, mob.magicBlock, { magicLevel, spellPenetration: magicPenetration, baseDamage: selectedSpell.stats.Magic || 0, castSeconds: attackSeconds, betweenKillsSeconds })
        return { ...mob, minHit: magic.minHit, maxHit: magic.maxHit, averageDamage: magic.averageDamagePerCast, attacks: magic.casts, fightSeconds: magic.fightSeconds, killsPerHour: magic.killsPerHour, score: magic.killsPerHour, xpPerKill: 0, xpPerHour: 0, defenseReduction: magic.defenseReduction, blockReduction: magic.blockReduction }
      }
      const physical = estimateMobCombat(mob.health, mob.defense, physicalInput)
      return { ...mob, minHit: physical.minHit, maxHit: physical.maxHit, averageDamage: physical.averageLandedHit, attacks: physical.attacks, fightSeconds: physical.fightSeconds, killsPerHour: physical.killsPerHour, score: physical.xpPerHour, xpPerKill: physical.xpPerKill, xpPerHour: physical.xpPerHour, hitChance: physical.hitChance }
    })
    .sort((a, b) => b.score - a.score), [mobs, query, location, selectedSpell, magicLevel, magicPenetration, accuracyLevel, strengthLevel, aim, power, style, attackSeconds, betweenKillsSeconds, doubleXp])
  const selected = ranked.find((mob) => mob.id === selectedId) ?? ranked[0]
  const maxScore = ranked[0]?.score || 1
  const xp = selected ? combatXp(selected.health, style, doubleXp) : combatXp(0, style)

  const reloadSet = () => {
    const stats = sumItemStats(equippedItems(items, loadEquippedSelection()))
    setAim(stats.Aim || 0)
    setPower(stats.Power || 0)
    setMagicPenetration(stats.Magic || 0)
  }

  if (error) return <ErrorMessage message={error} />
  if (!mobs.length || !items.length) return <Loading />

  return <div className="stack-lg">
    <section className="combat-intro panel">
      <div><span className="eyebrow">COMPARADOR VISUAL</span><h2>¿Qué mob le conviene a Broar?</h2><p>Compara combate físico o cualquiera de los poderes cargados en la bolsa de tu set actual.</p></div>
      <div className="combat-set-summary"><Swords size={22} /><div><span>Set conectado</span><strong>{equipped.length} piezas · Aim {setStats.Aim || 0} · Power {setStats.Power || 0} · Magic {setStats.Magic || 0}</strong></div><button onClick={reloadSet} title="Recargar set"><RefreshCw size={15} /></button></div>
    </section>

    <div className="combat-workbench">
      <aside className="panel combat-settings">
        <div className="panel-heading"><div><span className="eyebrow">BROAR + SET ACTUAL</span><h3>Parámetros de combate</h3></div><SlidersHorizontal size={19} /></div>
        <label>Tipo de ataque<select value={attackSource} onChange={(event) => setAttackSource(event.target.value)}><option value="physical">Físico · arma equipada</option>{spells.map((spell, index) => <option key={spell.id} value={spell.id}>Poder {index + 1} · {spell.name} ({spell.stats.Magic || 0})</option>)}</select></label>
        {!spells.length && <p className="combat-helper">Equipá una bolsa/libro y cargá sus poderes en Armador de sets para analizar magia.</p>}
        <div className="combat-field-grid">
          {isMagic ? <>
            <label>Magic<input type="number" min="1" value={magicLevel} onChange={(event) => setMagicLevel(Number(event.target.value))} /></label>
            <label>Magic del set<input type="number" min="0" value={magicPenetration} onChange={(event) => setMagicPenetration(Number(event.target.value))} /></label>
          </> : <>
            <label>Accuracy<input type="number" min="1" value={accuracyLevel} onChange={(event) => setAccuracyLevel(Number(event.target.value))} /></label>
            <label>Strength<input type="number" min="1" value={strengthLevel} onChange={(event) => setStrengthLevel(Number(event.target.value))} /></label>
            <label>Aim del set<input type="number" min="0" value={aim} onChange={(event) => setAim(Number(event.target.value))} /></label>
            <label>Power del set<input type="number" min="0" value={power} onChange={(event) => setPower(Number(event.target.value))} /></label>
          </>}
          <label>Seg. por {isMagic ? 'cast' : 'ataque'}<input type="number" min="0.2" step="0.1" value={attackSeconds} onChange={(event) => setAttackSeconds(Number(event.target.value))} /></label>
          <label>Demora entre mobs<input type="number" min="0" step="0.5" value={betweenKillsSeconds} onChange={(event) => setBetweenKillsSeconds(Number(event.target.value))} /></label>
        </div>
        {!isMagic && <><label className="combat-style">Postura<select value={style} onChange={(event) => setStyle(event.target.value as FightStyle)}>{styles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="toggle-row"><input type="checkbox" checked={doubleXp} onChange={(event) => setDoubleXp(event.target.checked)} /><span className="toggle" /><span>Evento de XP 2×</span></label></>}
        {!equipped.length && <button className="secondary-button full" onClick={() => { window.location.hash = '/sets' }}>Cargar el set de Broar</button>}
        <div className="combat-formula-card"><span>{isMagic ? selectedSpell?.name : 'Daño físico estimado'}</span><strong>{decimal(selected?.minHit ?? 0)}–{decimal(selected?.maxHit ?? 0)}</strong><small>Promedio por {isMagic ? 'cast' : 'acierto'}: {decimal(selected?.averageDamage ?? 0)}</small></div>
        <div className="info-callout"><Info size={17} /><p>{isMagic ? 'La magia usa la fórmula publicada: daño base × min(1, [Magic + Magic del set] / Defensa) × (1 − bloqueo mágico). La XP mágica por cast no está publicada en estos datos, por eso el ranking muestra kills/h.' : 'La distribución de XP por daño es la fórmula publicada por la wiki. El tiempo físico usa un modelo comunitario de tiradas Aim/Defense y Strength/Power.'}</p></div>
      </aside>

      <section className="panel recommendation-panel">
        <div className="panel-heading"><div><span className="eyebrow">RANKING DINÁMICO</span><h3>Mejores mobs por {isMagic ? 'kills/h' : 'XP/h'}</h3></div><Sparkles size={19} /></div>
        <div className="recommendation-filters"><div className="small-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mob…" /></div><label>Zona<select value={location} onChange={(event) => setLocation(event.target.value)}>{locations.map((name) => <option key={name}>{name}</option>)}</select></label></div>
        <div className="recommendation-list">{ranked.slice(0, 60).map((mob, index) => <button key={mob.id} className={selected?.id === mob.id ? 'selected' : ''} onClick={() => setSelectedId(mob.id)}><span className="recommendation-rank">#{index + 1}</span><GameImage kind="mobs" id={mob.id} name={mob.name} className="mob-thumb" /><span className="recommendation-name"><strong>{mob.name}</strong><small>{mob.health} HP · {mob.defense} DEF{isMagic ? ` · ${mob.magicBlock}% MB` : ''} · {decimal(mob.fightSeconds)} s</small></span><span className="recommendation-bar"><i style={{ width: `${Math.max(3, mob.score / maxScore * 100)}%` }} /></span><span className="recommendation-value"><strong>{formatNumber(mob.score)}</strong><small>{isMagic ? 'kills/h' : 'XP/h'}</small></span></button>)}{!ranked.length && <p className="filter-empty">No hay mobs para esta búsqueda.</p>}</div>
      </section>
    </div>

    {selected && <div className="content-grid mob-detail-layout">
      <section className="mob-hero panel"><div><span className="eyebrow">ANÁLISIS SELECCIONADO</span><h2>{selected.name}</h2><p>{selected.locations.join(' · ') || 'Ubicación no informada'}</p></div><div className="mob-visual"><GameImage kind="mobs" id={selected.id} name={selected.name} className="mob-portrait" eager /><div className="mob-level-big"><span>LVL</span><strong>{selected.combatLevel}</strong></div></div><div className="mob-stats"><span><small>Daño min–max</small><strong>{decimal(selected.minHit)}–{decimal(selected.maxHit)}</strong></span><span><small>{isMagic ? 'Bloqueo mágico' : 'Acierto'}</small><strong>{isMagic ? `${selected.magicBlock}%` : `${decimal((selected.hitChance || 0) * 100)}%`}</strong></span><span><small>{isMagic ? 'Casteos esperados' : 'Golpes esperados'}</small><strong>{decimal(selected.attacks)}</strong></span><span><small>Tiempo / kill</small><strong>{decimal(selected.fightSeconds)} s</strong></span></div></section>
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">{isMagic ? 'PODER CARGADO' : 'EXPERIENCIA'}</span><h3>Resultado estimado</h3></div><Crosshair size={20} /></div>{isMagic ? <><div className="stats-grid four compact-stats"><StatCard label="Daño base" value={selectedSpell?.stats.Magic || 0} /><StatCard label="Daño máx." value={decimal(selected.maxHit)} tone="gold" /><StatCard label="Factor defensa" value={`${decimal((selected.defenseReduction || 0) * 100)}%`} tone="blue" /><StatCard label="Magic block" value={`${selected.magicBlock}%`} tone="violet" /></div><div className="xp-total"><div><span>Tiempo por kill</span><strong>{decimal(selected.fightSeconds)} s</strong></div><div><span>Kills por hora</span><strong>{formatNumber(selected.killsPerHour)}</strong></div></div></> : <><div className="stats-grid four compact-stats"><StatCard label="Accuracy" value={formatNumber(xp.accuracy)} /><StatCard label="Strength" value={formatNumber(xp.strength)} tone="gold" /><StatCard label="Defense" value={formatNumber(xp.defense)} tone="blue" /><StatCard label="Health" value={formatNumber(xp.health)} tone="violet" /></div><div className="xp-total"><div><span>XP total por kill</span><strong>{formatNumber(selected.xpPerKill)}</strong></div><div><span>Proyección por hora</span><strong>{formatNumber(selected.xpPerHour)}</strong></div></div></>}</section>
    </div>}
  </div>
}
