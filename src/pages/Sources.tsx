import { CheckCircle2, ExternalLink, GitBranch, Milestone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { loadMeta } from '../lib/data'
import type { GameDataMeta } from '../types'

const sources = [
  { name: 'RPG MO Wiki mirror', url: 'https://github.com/marcqg/rpg-mo-wiki', detail: 'Datos estructurados, documentación y pipeline comunitario.' },
  { name: 'Live Game Data', url: 'https://data.mo.ee', detail: 'Archivos públicos oficiales usados como fuente primaria.' },
  { name: 'MODB', url: 'https://modb.rpgmobob.com', detail: 'Base comunitaria de ítems, mobs, recetas y vendors.' },
  { name: 'RPG MO Bob', url: 'https://rpgmobob.com/world-map', detail: 'Mapa mundial, polígonos de zonas y coordenadas comunitarias de recursos.' },
  { name: 'RPG MO Highscores', url: 'https://mo.ee/highscore.html', detail: 'Fuente oficial del seguimiento automático de Broar.' },
  { name: 'MO Tavern', url: 'https://motavern.com/mb', detail: 'Guías y recursos adicionales de la comunidad.' },
  { name: 'Skill Calculator de zac', url: 'https://docs.google.com/spreadsheets/d/1LuCHslHbPeHmJRL2sQw13nD3CZ0jDqrEGTERNHE05dU/edit?gid=1515831213#gid=1515831213', detail: 'Referencia para mejorar el planificador de oficios.' },
]

export function Sources() {
  const [meta, setMeta] = useState<GameDataMeta | null>(null)
  useEffect(() => { loadMeta().then(setMeta).catch(() => undefined) }, [])
  return (
    <div className="stack-lg">
      <section className="panel source-intro">
        <div><span className="eyebrow">TRANSPARENCIA</span><h2>Datos abiertos, cálculos explicables</h2><p>MO Tracker es una herramienta comunitaria no afiliada a RPG MO. Cada módulo indica de dónde salen los datos y evita presentar estimaciones como valores oficiales.</p></div>
        {meta && <div className="snapshot-card"><span>Snapshot de datos</span><strong>{new Date(meta.generatedAt).toLocaleDateString('es-AR')}</strong><small>{meta.counts.items.toLocaleString('es-AR')} ítems · {meta.counts.mobs.toLocaleString('es-AR')} mobs · {meta.counts.recipes.toLocaleString('es-AR')} recetas · {meta.counts.mapAreas ?? 0} zonas</small></div>}
      </section>
      <section className="source-grid">
        {sources.map((source) => <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={source.name}><div><ExternalLink size={18} /><span>FUENTE</span></div><h3>{source.name}</h3><p>{source.detail}</p><span className="text-link">Visitar recurso ↗</span></a>)}
      </section>
      <div className="content-grid half">
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">YA DISPONIBLE</span><h3>Primera etapa</h3></div><CheckCircle2 size={20} /></div>
          <ul className="roadmap-list done"><li>Perfil y objetivo diario local</li><li>Sincronización automática desde Highscores</li><li>Registro de XP y sesiones 2×</li><li>Buscador de ítems con filtros</li><li>Set actual conectado al personaje</li><li>Ranking visual de XP por mob</li><li>Mapa interactivo de mobs y recursos</li><li>Planificador inicial de oficios</li></ul>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">PRÓXIMOS PASOS</span><h3>Segunda etapa</h3></div><Milestone size={20} /></div>
          <ul className="roadmap-list"><li>Proyección de nivel por habilidad</li><li>Comparador de dos sets</li><li>Drop tables y rentabilidad por mob</li><li>Recetas encadenadas y costos de mercado</li><li>Importar backups y sincronizar entre dispositivos</li></ul>
        </section>
      </div>
      <section className="panel github-callout"><GitBranch size={26} /><div><strong>Proyecto listo para GitHub Pages</strong><span>El deploy se hace con GitHub Actions y no necesita backend.</span></div><a href="https://github.com/fransomagliasf/panel-rpg-mo" target="_blank" rel="noreferrer">Ver repositorio ↗</a></section>
    </div>
  )
}
