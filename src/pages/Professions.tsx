import { FlaskConical, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ErrorMessage, Loading, StatCard } from '../components/Ui'
import { formatNumber, totalXpForLevel } from '../lib/calculations'
import { loadRecipes } from '../lib/data'
import type { Recipe } from '../types'

export function Professions() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState('cooking')
  const [selectedId, setSelectedId] = useState(9)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [targetLevel, setTargetLevel] = useState(10)
  const [successRate, setSuccessRate] = useState(50)
  const [doubleXp, setDoubleXp] = useState(false)

  useEffect(() => { loadRecipes().then(setRecipes).catch((reason: Error) => setError(reason.message)) }, [])
  const skills = useMemo(() => [...new Set(recipes.map((recipe) => recipe.skill))].sort(), [recipes])
  const filtered = useMemo(() => recipes.filter((recipe) => recipe.skill === skill && recipe.name.toLowerCase().includes(query.toLowerCase())).slice(0, 80), [recipes, query, skill])
  const selected = recipes.find((recipe) => recipe.id === selectedId && recipe.skill === skill) ?? filtered[0]
  const requiredXp = Math.max(0, totalXpForLevel(targetLevel) - totalXpForLevel(currentLevel))
  const xpEach = (selected?.xp || 0) * (doubleXp ? 2 : 1)
  const successes = xpEach > 0 ? Math.ceil(requiredXp / xpEach) : 0
  const attempts = Math.ceil(successes / Math.max(0.01, successRate / 100))

  useEffect(() => {
    if (selected) setSuccessRate(Math.max(1, selected.minChance || selected.maxChance || 100))
  }, [selected?.id])

  if (error) return <ErrorMessage message={error} />
  if (!recipes.length) return <Loading />

  return (
    <div className="stack-lg">
      <section className="search-hero profession-hero"><div><span className="eyebrow">PLANIFICADOR</span><h2>Calculá materiales y acciones</h2><p>Una primera versión basada en las recetas públicas del juego.</p></div><FlaskConical size={48} /></section>
      <div className="content-grid profession-layout">
        <section className="panel recipe-browser">
          <div className="field-row"><label>Oficio<select value={skill} onChange={(event) => { setSkill(event.target.value); setSelectedId(-1) }}>{skills.map((name) => <option key={name}>{name}</option>)}</select></label></div>
          <div className="small-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar receta o acción…" /></div>
          <div className="recipe-list">{filtered.map((recipe) => <button key={`${recipe.skill}-${recipe.id}-${recipe.station}`} className={selected?.id === recipe.id ? 'selected' : ''} onClick={() => setSelectedId(recipe.id)}><div><strong>{recipe.name}</strong><span>Nivel {recipe.level} · {recipe.xp} XP · {recipe.station}</span></div></button>)}</div>
        </section>
        <section className="stack-lg">
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">OBJETIVO</span><h3>{selected?.name || 'Elegí una receta'}</h3></div></div>
            <div className="form-grid">
              <div className="field-row"><label>Nivel actual<input type="number" min="1" value={currentLevel} onChange={(event) => setCurrentLevel(Number(event.target.value))} /></label><label>Nivel objetivo<input type="number" min={currentLevel + 1} value={targetLevel} onChange={(event) => setTargetLevel(Number(event.target.value))} /></label></div>
              <div className="field-row"><label>Probabilidad estimada<input type="number" min="1" max="100" value={successRate} onChange={(event) => setSuccessRate(Number(event.target.value))} /></label><label className="toggle-row inline"><input type="checkbox" checked={doubleXp} onChange={(event) => setDoubleXp(event.target.checked)} /><span className="toggle" /><span>Usar 2× XP</span></label></div>
            </div>
          </section>
          <section className="stats-grid three">
            <StatCard label="XP necesaria" value={formatNumber(requiredXp)} />
            <StatCard label="Éxitos necesarios" value={formatNumber(successes)} tone="gold" />
            <StatCard label="Intentos estimados" value={formatNumber(attempts)} detail={`a ${successRate}%`} tone="violet" />
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">LISTA DE MATERIALES</span><h3>Para el objetivo</h3></div></div>
            {selected?.materials.length ? <div className="materials-list">{selected.materials.map((material) => <div key={material.id}><div className="material-glyph">{material.name.slice(0, 1)}</div><div><strong>{material.name}</strong><span>{material.count} por intento</span></div><strong>{formatNumber(material.count * attempts)}</strong></div>)}</div> : <div className="info-callout"><p>Esta acción no tiene materiales estructurados en los datos (suele ser una actividad de recolección). Necesitarías aproximadamente <strong>{formatNumber(attempts)}</strong> acciones exitosas.</p></div>}
          </section>
        </section>
      </div>
    </div>
  )
}
