import { Clock3, ExternalLink, RefreshCw, ShieldCheck, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GameImage } from '../components/GameImage'
import { EmptyState, StatCard } from '../components/Ui'
import { formatNumber } from '../lib/calculations'
import { loadItems, loadPlayerHistory } from '../lib/data'
import { equippedItems, loadEquippedSelection, sumItemStats } from '../lib/equipment'
import { boardLabels, dailySnapshots, findBoard, levelChanges, totalXp } from '../lib/player'
import type { Item, PlayerHistory } from '../types'

export function Player() {
  const [history, setHistory] = useState<PlayerHistory | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadPlayerHistory('Broar'), loadItems()])
      .then(([playerHistory, itemData]) => { setHistory(playerHistory); setItems(itemData) })
      .catch(() => setError('No se pudo cargar el historial automático de Broar.'))
  }, [])

  const days = useMemo(() => dailySnapshots(history?.snapshots ?? []), [history])
  const current = history?.snapshots.at(-1)
  const previous = history && history.snapshots.length > 1 ? history.snapshots.at(-2) : undefined
  const currentXp = totalXp(current)
  const captureGain = Math.max(0, currentXp - totalXp(previous))
  const total = findBoard(current, 'total')
  const totalXpBoard = findBoard(current, 'total_xp')
  const gainedLevels = current ? levelChanges(current, previous) : []
  const visibleBoards = current?.boards.filter((entry) => !['total', 'total_xp'].includes(entry.board)) ?? []
  const equipped = useMemo(() => equippedItems(items, loadEquippedSelection()), [items])
  const equipmentStats = useMemo(() => sumItemStats(equipped), [equipped])

  if (error) return <EmptyState title="No pudimos sincronizar el personaje" text={error} />
  if (!history || !current) return <section className="panel loading-panel"><RefreshCw className="spin" size={22} /> Cargando a Broar…</section>

  return (
    <div className="stack-lg">
      <section className="player-hero panel">
        <div>
          <span className="hero-kicker"><RefreshCw size={15} /> SINCRONIZACIÓN AUTOMÁTICA</span>
          <h2>{history.player}</h2>
          <p>Datos públicos de RPG MO guardados cada seis horas para comparar el progreso entre días.</p>
        </div>
        <div className="sync-status">
          <Clock3 size={18} />
          <div><span>Última captura</span><strong>{new Date(history.updatedAt).toLocaleString('es-AR', { timeZone: history.timezone, hour12: false })}</strong></div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Nivel total" value={formatNumber(total?.score ?? 0)} detail={`Puesto #${formatNumber(total?.position ?? 0)}`} tone="green" />
        <StatCard label="XP total" value={formatNumber(currentXp)} detail={`Puesto #${formatNumber(totalXpBoard?.position ?? 0)}`} tone="gold" />
        <StatCard label="Desde la captura anterior" value={previous ? `+${formatNumber(captureGain)}` : 'Línea base'} detail="Precisión oficial: 100.000 XP" tone="violet" />
        <StatCard label="Niveles detectados" value={gainedLevels.reduce((sum, entry) => sum + entry.change, 0)} detail={gainedLevels.length ? gainedLevels.map((entry) => boardLabels[entry.board] ?? entry.board).join(', ') : 'Sin cambios desde la captura anterior'} tone="blue" />
      </section>

      <section className="panel character-set-panel">
        <div className="panel-heading"><div><span className="eyebrow">EQUIPO VINCULADO</span><h3>Set actual de Broar</h3></div><ShieldCheck size={20} /></div>
        {equipped.length ? <>
          <div className="equipped-strip">{equipped.map((item) => <div key={item.id} title={item.name}><GameImage kind="items" id={item.id} name={item.name} className="equipped-sprite" /><span>{item.name}</span></div>)}</div>
          <div className="character-set-footer"><span>{equipped.length} piezas equipadas</span><strong>Aim {equipmentStats.Aim || 0} · Power {equipmentStats.Power || 0} · Armor {equipmentStats.Armor || 0}</strong><button className="secondary-button" onClick={() => { window.location.hash = '/sets' }}>Editar set</button></div>
        </> : <div className="empty-set-inline"><span>Todavía no cargaste el equipo de Broar.</span><button className="primary-button" onClick={() => { window.location.hash = '/sets' }}>Cargar set actual</button></div>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">HABILIDADES</span><h3>Niveles y rankings actuales</h3></div>
          <Trophy size={20} />
        </div>
        <div className="skill-score-grid">
          {visibleBoards.map((entry) => {
            const oldScore = findBoard(previous, entry.board)?.score ?? entry.score
            const change = entry.score - oldScore
            return (
              <article className="skill-score" key={entry.board}>
                <div><span>{boardLabels[entry.board] ?? entry.board}</span><small>Ranking #{formatNumber(entry.position)}</small></div>
                <strong>{formatNumber(entry.score)}</strong>
                {change > 0 && <em>+{change}</em>}
              </article>
            )
          })}
        </div>
        <p className="privacy-note">Las habilidades que todavía no figuran en el ranking oficial no aparecen en esta lista.</p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">SEGUIMIENTO DIARIO</span><h3>Historial automático</h3></div>
          <a className="secondary-button" href="https://mo.ee/highscore.html" target="_blank" rel="noreferrer">Highscore oficial <ExternalLink size={15} /></a>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Día</th><th>XP total</th><th>Ganancia diaria</th><th>Nivel total</th><th>Niveles subidos</th></tr></thead><tbody>
          {[...days].reverse().map((day, reverseIndex) => {
            const index = days.length - 1 - reverseIndex
            const prior = index > 0 ? days[index - 1] : undefined
            const gain = prior ? Math.max(0, totalXp(day) - totalXp(prior)) : null
            const changes = levelChanges(day, prior)
            return <tr key={day.date}>
              <td>{new Date(`${day.date}T12:00:00`).toLocaleDateString('es-AR')}</td>
              <td>{formatNumber(totalXp(day))}</td>
              <td className={gain && gain > 0 ? 'positive' : ''}>{gain === null ? 'Línea base' : `+${formatNumber(gain)}`}</td>
              <td>{formatNumber(findBoard(day, 'total')?.score ?? 0)}</td>
              <td>{changes.length ? changes.map((entry) => `${boardLabels[entry.board] ?? entry.board} +${entry.change}`).join(', ') : '—'}</td>
            </tr>
          })}
        </tbody></table></div>
      </section>

      <div className="info-callout">
        <p>El highscore oficial publica la XP total redondeada cada 100.000 y los niveles por habilidad, pero no la XP exacta dentro de cada habilidad. Para sesiones exactas y eventos 2× seguí usando la pestaña Experiencia.</p>
      </div>
    </div>
  )
}
