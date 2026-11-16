import { createPortal } from 'react-dom'
import { useState, type FocusEvent, type ReactNode } from 'react'
import type { Item } from '../types'
import { GameImage } from './GameImage'

type Position = { left: number; top: number }

export function ItemHoverCard({ item, children }: { item?: Item; children: ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null)

  if (!item) return <>{children}</>

  const open = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const width = 330
    const estimatedHeight = 340
    let left = rect.right + 10
    if (left + width > window.innerWidth - 12) left = Math.max(12, rect.left - width - 10)
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - estimatedHeight - 12))
    setPosition({ left, top })
  }
  const closeOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPosition(null)
  }
  const stats = Object.entries(item.stats).filter(([, value]) => value !== 0)
  const requirements = Object.entries(item.requirements).filter(([, value]) => value > 0)
  const extras = [
    item.cooldown !== undefined ? ['Cooldown', `-${Math.round(item.cooldown * 100)}%`] : null,
    item.archery !== undefined ? ['Archery', item.archery] : null,
    item.archeryBoost !== undefined ? ['Archery boost', `${Math.round(item.archeryBoost * 100)}%`] : null,
    item.magicSlots !== undefined ? ['Espacios de poderes', item.magicSlots] : null,
    item.magicCasts !== undefined ? ['Casteos por poder', item.magicCasts] : null,
  ].filter((entry): entry is [string, string | number] => Boolean(entry))

  return <div className="item-tooltip-anchor" onMouseEnter={(event) => open(event.currentTarget)} onMouseLeave={() => setPosition(null)} onFocus={(event) => open(event.currentTarget)} onBlur={closeOnBlur}>
    {children}
    {position && createPortal(<aside className="item-hover-card" role="tooltip" style={position}>
      <div className="item-hover-head"><GameImage kind="items" id={item.id} name={item.name} className="item-hover-sprite" eager /><div><span>#{item.id} · {item.category}</span><strong>{item.name}</strong><small>Nivel {item.level} · {item.slot === 'None' ? 'Sin ranura' : item.slot}</small></div></div>
      <div className="item-hover-section"><span className="item-hover-label">Características</span><div className="item-hover-stats">{stats.map(([name, value]) => <span key={name}><small>{item.slot === 'Magic' && name === 'Magic' ? 'Daño base' : name}</small><strong>{value > 0 ? '+' : ''}{value}</strong></span>)}{extras.map(([name, value]) => <span key={name}><small>{name}</small><strong>{value}</strong></span>)}{!stats.length && !extras.length && <em>Sin bonificaciones informadas</em>}</div></div>
      {!!requirements.length && <div className="item-hover-requirements"><span>Requisitos</span><strong>{requirements.map(([name, value]) => `${name} ${value}`).join(' · ')}</strong></div>}
    </aside>, document.body)}
  </div>
}
