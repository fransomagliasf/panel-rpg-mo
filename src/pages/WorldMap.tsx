import { Fish, LocateFixed, MapPinned, Search, Sprout } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GameImage } from '../components/GameImage'
import { ErrorMessage, Loading } from '../components/Ui'
import { loadMapData, loadMobs } from '../lib/data'
import type { MapArea, MapData, MapResource, Mob } from '../types'

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

function locationBelongsToArea(location: string, area: string) {
  const place = normalize(location)
  const target = normalize(area)
  if (place === 'fellin' && target === 'fellin island') return true
  return place === target || place.startsWith(`${target} `)
}

function areasForLocations(locations: string[], areas: MapArea[]) {
  return areas.filter((area) => locations.some((location) => locationBelongsToArea(location, area.name))).map((area) => area.name)
}

export function WorldMap() {
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [mobs, setMobs] = useState<Mob[]>([])
  const [selectedArea, setSelectedArea] = useState('Dorpat')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadMapData(), loadMobs()]).then(([map, mobData]) => { setMapData(map); setMobs(mobData) }).catch((reason: Error) => setError(reason.message))
  }, [])

  const matches = useMemo(() => {
    if (!mapData || !query.trim()) return { mobs: [] as Mob[], resources: [] as MapResource[] }
    const needle = normalize(query)
    return {
      mobs: mobs.filter((mob) => normalize(`${mob.name} ${mob.locations.join(' ')}`).includes(needle)).slice(0, 12),
      resources: mapData.resources.filter((resource) => normalize(`${resource.name} ${resource.type} ${resource.locations.map((item) => item.zone).join(' ')}`).includes(needle)).slice(0, 12),
    }
  }, [mapData, mobs, query])

  const highlightedAreas = useMemo(() => {
    if (!mapData) return new Set<string>()
    const locations = [...matches.mobs.flatMap((mob) => mob.locations), ...matches.resources.flatMap((resource) => resource.locations.map((item) => item.zone))]
    return new Set(areasForLocations(locations, mapData.areas))
  }, [mapData, matches])

  const areaMobs = useMemo(() => mobs.filter((mob) => mob.locations.some((location) => locationBelongsToArea(location, selectedArea))), [mobs, selectedArea])
  const areaResources = useMemo(() => (mapData?.resources ?? []).filter((resource) => resource.locations.some((location) => locationBelongsToArea(location.zone, selectedArea))), [mapData, selectedArea])

  const chooseResult = (locations: string[]) => {
    if (!mapData) return
    const area = areasForLocations(locations, mapData.areas)[0]
    if (area) setSelectedArea(area)
  }

  if (error) return <ErrorMessage message={error} />
  if (!mapData) return <Loading />

  return (
    <div className="stack-lg">
      <section className="map-intro panel">
        <div><span className="eyebrow">41 ZONAS DEL MUNDO</span><h2>Mapa interactivo</h2><p>Buscá un mob, un hongo o una zona de pesca. Las regiones compatibles se iluminan y podés abrir su inventario.</p></div>
        <div className="map-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej: Paladin, Morel, Fishing Net…" /></div>
      </section>

      {query.trim() && <section className="map-search-results panel">
        <div className="map-result-heading"><span>Resultados</span><strong>{matches.mobs.length + matches.resources.length}</strong></div>
        <div className="map-result-list">
          {matches.mobs.map((mob) => <button key={`mob-${mob.id}`} onClick={() => chooseResult(mob.locations)}><GameImage kind="mobs" id={mob.id} name={mob.name} className="map-result-sprite" /><span><strong>{mob.name}</strong><small>Mob · {mob.locations.join(' · ')}</small></span><LocateFixed size={16} /></button>)}
          {matches.resources.map((resource) => <button key={resource.id} onClick={() => chooseResult(resource.locations.map((item) => item.zone))}>{resource.itemId ? <GameImage kind="items" id={resource.itemId} name={resource.name} className="map-result-sprite" /> : <span className="map-result-icon">{resource.type === 'Pesca' ? <Fish size={18} /> : <Sprout size={18} />}</span>}<span><strong>{resource.name}</strong><small>{resource.type} · nivel {resource.level}</small></span><LocateFixed size={16} /></button>)}
          {!matches.mobs.length && !matches.resources.length && <p>No encontramos coincidencias en las ubicaciones disponibles.</p>}
        </div>
      </section>}

      <div className="map-layout">
        <section className="panel world-map-panel">
          <div className="world-map-scroll">
            <svg className="world-map" viewBox="0 0 1658 960" role="img" aria-label="Mapa mundial interactivo de RPG MO">
              <defs><linearGradient id="mapFallback" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#203421" /><stop offset="1" stopColor="#0d1710" /></linearGradient></defs>
              <rect width="1658" height="960" fill="url(#mapFallback)" />
              <image href={mapData.worldImage} x="0" y="0" width="1658" height="960" preserveAspectRatio="xMidYMid meet" />
              {mapData.areas.map((area) => {
                const selected = selectedArea === area.name
                const highlighted = highlightedAreas.has(area.name)
                return <g key={area.name} className={`map-zone ${selected ? 'selected' : ''} ${highlighted ? 'highlighted' : ''}`} onClick={() => setSelectedArea(area.name)}><title>{area.name}</title><polygon points={area.coords} /><text x={area.coords.split(',')[0]} y={area.coords.split(',')[1]}>{highlighted ? '●' : ''}</text></g>
              })}
            </svg>
          </div>
          <p className="map-caption"><MapPinned size={15} /> Tocá una región para ver lo que hay. Las coordenadas exactas se muestran cuando la fuente las publica.</p>
        </section>

        <aside className="panel area-panel">
          <div className="panel-heading"><div><span className="eyebrow">ZONA SELECCIONADA</span><h3>{selectedArea}</h3></div><MapPinned size={20} /></div>
          <div className="area-summary"><span><strong>{areaMobs.length}</strong> mobs</span><span><strong>{areaResources.length}</strong> recursos</span></div>
          <div className="area-content">
            <h4>Mobs</h4>
            <div className="area-entry-list">{areaMobs.map((mob) => <button key={mob.id} onClick={() => { window.location.hash = '/mobs' }}><GameImage kind="mobs" id={mob.id} name={mob.name} className="area-sprite" /><span><strong>{mob.name}</strong><small>LVL {mob.combatLevel} · {mob.health} HP · {mob.defense} DEF</small></span></button>)}{!areaMobs.length && <p>Sin mobs informados.</p>}</div>
            <h4>Recursos</h4>
            <div className="area-entry-list">{areaResources.map((resource) => {
              const spots = resource.locations.filter((item) => locationBelongsToArea(item.zone, selectedArea))
              return <div key={resource.id}>{resource.itemId ? <GameImage kind="items" id={resource.itemId} name={resource.name} className="area-sprite" /> : <span className="area-resource-icon">{resource.type === 'Pesca' ? <Fish size={17} /> : <Sprout size={17} />}</span>}<span><strong>{resource.name}</strong><small>{resource.type} · nivel {resource.level}{spots.some((spot) => spot.coords) ? ` · ${spots.map((spot) => spot.coords).filter(Boolean).join(' / ')}` : ' · ubicación por zona'}</small></span></div>
            })}{!areaResources.length && <p>Sin recursos georreferenciados en la fuente.</p>}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
