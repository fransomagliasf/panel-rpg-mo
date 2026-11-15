import { ArrowRight, Flame, PencilLine, Sparkles, Target } from 'lucide-react'
import { formatNumber } from '../lib/calculations'
import type { Profile, XpEntry } from '../types'
import type { RouteId } from '../components/Layout'
import { EmptyState, StatCard } from '../components/Ui'

type Props = {
  profile: Profile
  setProfile: (profile: Profile) => void
  entries: XpEntry[]
  navigate: (route: RouteId) => void
}

export function Dashboard({ profile, setProfile, entries, navigate }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const todayXp = entries.filter((entry) => entry.date === today).reduce((sum, entry) => sum + Math.max(0, entry.endXp - entry.startXp), 0)
  const uniqueDays = new Set(entries.map((entry) => entry.date)).size
  const progress = Math.min(100, profile.dailyGoal > 0 ? (todayXp / profile.dailyGoal) * 100 : 0)

  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-kicker"><Sparkles size={15} /> TU AVENTURA, EN NÚMEROS</span>
          <h2>{profile.characterName ? `Buen grind, ${profile.characterName}` : 'Prepará tu próxima sesión'}</h2>
          <p>Registrá el progreso del día, compará mobs y encontrá el equipo que te conviene sin salir del panel.</p>
          <button className="primary-button" onClick={() => navigate('experiencia')}>Registrar experiencia <ArrowRight size={17} /></button>
        </div>
        <div className="hero-level">
          <span>Nivel de combate</span>
          <strong>{profile.combatLevel || '—'}</strong>
          <small>Actualizalo abajo cuando subas</small>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="XP de hoy" value={formatNumber(todayXp)} detail={`${Math.round(progress)}% de tu objetivo`} tone="green" />
        <StatCard label="Objetivo diario" value={formatNumber(profile.dailyGoal)} detail={`${formatNumber(Math.max(0, profile.dailyGoal - todayXp))} XP restantes`} tone="gold" />
        <StatCard label="Banco de 2×" value={`${profile.doubleXpHours} h`} detail="Carga manual del evento" tone="violet" />
        <StatCard label="Días registrados" value={uniqueDays} detail={`${entries.length} sesiones guardadas`} tone="blue" />
      </section>

      <div className="content-grid two-thirds">
        <section className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">HOY</span><h3>Progreso diario</h3></div>
            <Target size={20} />
          </div>
          <div className="goal-ring-row">
            <div className="goal-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{Math.round(progress)}%</strong><span>completo</span></div>
            </div>
            <div className="goal-copy">
              <strong>{formatNumber(todayXp)} / {formatNumber(profile.dailyGoal)} XP</strong>
              <p>{todayXp >= profile.dailyGoal ? 'Objetivo cumplido. Todo lo que sigue es ganancia extra.' : 'Cada sesión suma. Registrá tus valores inicial y final para medir el avance real.'}</p>
              <button className="text-button" onClick={() => navigate('experiencia')}>Ver registro <ArrowRight size={15} /></button>
            </div>
          </div>
        </section>

        <section className="panel profile-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">PERFIL</span><h3>Tu personaje</h3></div>
            <PencilLine size={19} />
          </div>
          <label>Nombre
            <input value={profile.characterName} onChange={(event) => setProfile({ ...profile, characterName: event.target.value })} placeholder="Nombre in-game" />
          </label>
          <div className="field-row">
            <label>Nivel de combate
              <input type="number" min="1" value={profile.combatLevel} onChange={(event) => setProfile({ ...profile, combatLevel: Number(event.target.value) })} />
            </label>
            <label>Horas 2×
              <input type="number" min="0" step="0.5" value={profile.doubleXpHours} onChange={(event) => setProfile({ ...profile, doubleXpHours: Number(event.target.value) })} />
            </label>
          </div>
          <label>Objetivo diario de XP
            <input type="number" min="0" value={profile.dailyGoal} onChange={(event) => setProfile({ ...profile, dailyGoal: Number(event.target.value) })} />
          </label>
          <p className="privacy-note">Tus datos quedan guardados solamente en este navegador.</p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">ACTIVIDAD</span><h3>Últimas sesiones</h3></div>
          <Flame size={20} />
        </div>
        {entries.length === 0 ? <EmptyState title="Todavía no hay sesiones" text="Agregá tu primera medición de experiencia para empezar a ver tendencias." /> : (
          <div className="session-list">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="session-row">
                <div className="skill-avatar">{entry.skill.slice(0, 2).toUpperCase()}</div>
                <div><strong>{entry.skill}</strong><span>{new Date(`${entry.date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span></div>
                {entry.doubleXp && <span className="badge violet">2×</span>}
                <strong className="session-xp">+{formatNumber(Math.max(0, entry.endXp - entry.startXp))} XP</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
