import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const player = (process.env.PLAYER_NAME || 'Broar').trim()
const timezone = process.env.PLAYER_TIMEZONE || 'America/Argentina/Buenos_Aires'
const slug = player.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
const sourceUrl = `https://rpg-de2.mo.ee/playerskills?n=${encodeURIComponent(player)}`
const outputPath = resolve(`public/data/players/${slug}.json`)

function dateInTimezone(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

const response = await fetch(sourceUrl, {
  headers: { 'user-agent': 'MO-Tracker/1.0 (+https://github.com/fransomagliasf/panel-rpg-mo)' },
  signal: AbortSignal.timeout(30_000),
})

if (!response.ok) {
  throw new Error(`RPG MO respondió ${response.status} al consultar ${player}.`)
}

const rows = await response.json()
if (!Array.isArray(rows) || !rows.length) {
  throw new Error(`No se encontraron datos públicos para ${player}.`)
}

const boards = rows.map((row) => ({
  board: String(row.board),
  score: Number(row.score),
  position: Number(row.position),
  lastScore: Number(row.last_score),
  lastPosition: Number(row.last_position),
}))

if (!boards.some((entry) => entry.board === 'total_xp')) {
  throw new Error('La respuesta no contiene el total de experiencia esperado.')
}

let existing = {
  version: 1,
  player,
  timezone,
  sourceUrl,
  updatedAt: '',
  snapshots: [],
}

try {
  existing = JSON.parse(await readFile(outputPath, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const now = new Date()
const snapshot = {
  capturedAt: now.toISOString(),
  date: dateInTimezone(now),
  boards,
}

const lastSnapshot = existing.snapshots.at(-1)
const lastBoards = lastSnapshot?.boards ?? []
const unchanged = JSON.stringify(lastBoards) === JSON.stringify(boards)

// Aun sin cambios guardamos como máximo una comprobación cada seis horas.
// Esto permite distinguir "0 XP" de una sincronización que no se ejecutó.
const snapshots = [...existing.snapshots, snapshot].slice(-1460)
const history = {
  ...existing,
  version: 1,
  player,
  timezone,
  sourceUrl,
  updatedAt: snapshot.capturedAt,
  snapshots,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(history, null, 2)}\n`)
console.log(`${player}: captura ${snapshot.date} guardada (${boards.length} rankings, cambios: ${unchanged ? 'no' : 'sí'}).`)
