import type { ReactNode } from 'react'

export function StatCard({ label, value, detail, tone = 'green' }: { label: string; value: ReactNode; detail?: ReactNode; tone?: 'green' | 'gold' | 'blue' | 'violet' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-orb">✦</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

export function Loading() {
  return <div className="loading"><span /> Cargando datos del juego…</div>
}

export function ErrorMessage({ message }: { message: string }) {
  return <div className="error-message">No pudimos cargar los datos. {message}</div>
}
