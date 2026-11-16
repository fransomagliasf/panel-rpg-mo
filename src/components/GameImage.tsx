import { useState } from 'react'

type Props = {
  kind: 'items' | 'mobs'
  id: number
  name: string
  className?: string
  eager?: boolean
}

const assetBase = 'https://marcqg.github.io/rpg-mo-wiki/img'

export function gameImageUrl(kind: Props['kind'], id: number) {
  return `${assetBase}/${kind}/${id}.png`
}

export function GameImage({ kind, id, name, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false)

  return (
    <span className={`game-sprite ${className}`} aria-hidden="true">
      {failed ? <span>{name.trim().slice(0, 1).toUpperCase() || '?'}</span> : (
        <img
          src={gameImageUrl(kind, id)}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}
