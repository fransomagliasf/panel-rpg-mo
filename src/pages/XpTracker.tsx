import { Download, Plus, Trash2, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatNumber, levelForXp, totalXpForLevel } from '../lib/calculations'
import type { Profile, XpEntry } from '../types'
import { EmptyState, StatCard } from '../components/Ui'

const skills = ['Accuracy', 'Archery', 'Breeding', 'Carpentry', 'Cooking', 'Defense', 'Farming', 'Fishing', 'Fletching', 'Forging', 'Fungiculture', 'Health', 'Jewelry', 'Magic', 'Mining', 'Strength', 'Woodcutting', 'Wizardry']

type Props = {
  profile: Profile
  entries: XpEntry[]
  setEntries: (entries: XpEntry[]) => void
}

export function XpTracker({ profile, entries, setEntries }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [skill, setSkill] = useState('Accuracy')
  const [startXp, setStartXp] = useState('')
  const [endXp, setEndXp] = useState('')
  const [doubleXp, setDoubleXp] = useState(false)
  const [notes, setNotes] = useState('')

  const totalGain = entries.reduce((sum, entry) => sum + Math.max(0, entry.endXp - entry.startXp), 0)
  const doubleGain = entries.filter((entry) => entry.doubleXp).reduce((sum, entry) => sum + Math.max(0, entry.endXp - entry.startXp), 0)
  const currentGain = Math.max(0, Number(endXp || 0) - Number(startXp || 0))

  const days = useMemo(() => {
    const result = Array.from({ length: 7 }, (_, index) => {
      const day = new Date()
      day.setDate(day.getDate() - (6 - index))
      const key = day.toISOString().slice(0, 10)
      const xp = entries.filter((entry) => entry.date === key).reduce((sum, entry) => sum + Math.max(0, entry.endXp - entry.startXp), 0)
      return { key, label: day.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''), xp }
    })
    const max = Math.max(1, ...result.map((day) => day.xp))
    return result.map((day) => ({ ...day, height: Math.max(day.xp > 0 ? 8 : 2, (day.xp / max) * 100) }))
  }, [entries])

  const addEntry = (event: React.FormEvent) => {
    event.preventDefault()
    if (!endXp || Number(endXp) < Number(startXp)) return
    const entry: XpEntry = {
      id: crypto.randomUUID(), date, skill,
      startXp: Number(startXp), endXp: Number(endXp), doubleXp, notes: notes.trim(),
    }
    setEntries([entry, ...entries])
    setStartXp(endXp)
    setEndXp('')
    setNotes('')
  }

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ profile, entries, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mo-tracker-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack-lg">
      <section className="stats-grid three">
        <StatCard label="XP registrada" value={formatNumber(totalGain)} detail={`${entries.length} sesiones`} />
        <StatCard label="XP durante 2×" value={formatNumber(doubleGain)} detail={`${formatNumber(doubleGain / 2)} XP base equivalente`} tone="violet" />
        <StatCard label="Nivel estimado" value={levelForXp(totalGain)} detail="Sobre la XP registrada, no tu total real" tone="gold" />
      </section>

      <div className="content-grid half">
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">NUEVA SESIÓN</span><h3>Registrar experiencia</h3></div><Plus size={20} /></div>
          <form className="form-grid" onSubmit={addEntry}>
            <div className="field-row">
              <label>Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
              <label>Habilidad<select value={skill} onChange={(event) => setSkill(event.target.value)}>{skills.map((name) => <option key={name}>{name}</option>)}</select></label>
            </div>
            <div className="field-row">
              <label>XP al empezar<input type="number" min="0" value={startXp} onChange={(event) => setStartXp(event.target.value)} placeholder="0" required /></label>
              <label>XP al terminar<input type="number" min="0" value={endXp} onChange={(event) => setEndXp(event.target.value)} placeholder="0" required /></label>
            </div>
            <label className="toggle-row"><input type="checkbox" checked={doubleXp} onChange={(event) => setDoubleXp(event.target.checked)} /><span className="toggle" /><span>La sesión fue durante evento 2×</span></label>
            <label>Notas opcionales<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Zona, método, equipo…" rows={3} /></label>
            <div className="form-result"><span>Ganancia de esta sesión</span><strong>+{formatNumber(currentGain)} XP</strong>{doubleXp && <small>{formatNumber(currentGain / 2)} XP base equivalente</small>}</div>
            <button className="primary-button full" type="submit">Guardar sesión <Plus size={17} /></button>
          </form>
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">ÚLTIMOS 7 DÍAS</span><h3>Ritmo semanal</h3></div><TrendingUp size={20} /></div>
          <div className="bar-chart">
            {days.map((day) => <div className="bar-column" key={day.key}><span>{day.xp ? formatNumber(day.xp) : ''}</span><div style={{ height: `${day.height}%` }} /><small>{day.label}</small></div>)}
          </div>
          <div className="level-lookup">
            <span>Referencia rápida</span>
            <p>El nivel {profile.combatLevel || 1} comienza en <strong>{formatNumber(totalXpForLevel(profile.combatLevel || 1))} XP</strong>.</p>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">HISTORIAL</span><h3>Sesiones guardadas</h3></div>
          <button className="secondary-button" onClick={downloadBackup} disabled={!entries.length}><Download size={16} /> Exportar</button>
        </div>
        {!entries.length ? <EmptyState title="Tu historial está vacío" text="Los registros que agregues aparecerán acá y se guardarán en este dispositivo." /> : (
          <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Habilidad</th><th>Inicio</th><th>Fin</th><th>Ganancia</th><th></th></tr></thead><tbody>
            {entries.map((entry) => <tr key={entry.id}><td>{new Date(`${entry.date}T12:00:00`).toLocaleDateString('es-AR')}</td><td><strong>{entry.skill}</strong>{entry.doubleXp && <span className="badge violet table-badge">2×</span>}</td><td>{formatNumber(entry.startXp)}</td><td>{formatNumber(entry.endXp)}</td><td className="positive">+{formatNumber(Math.max(0, entry.endXp - entry.startXp))}</td><td><button className="icon-button danger" onClick={() => setEntries(entries.filter((item) => item.id !== entry.id))} aria-label="Eliminar"><Trash2 size={16} /></button></td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  )
}
