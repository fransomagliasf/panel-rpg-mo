import type { PlayerBoard, PlayerSnapshot } from '../types'

export const boardLabels: Record<string, string> = {
  total: 'Nivel total',
  total_xp: 'XP total',
  accuracy: 'Precisión',
  strength: 'Fuerza',
  defense: 'Defensa',
  health: 'Salud',
  magic: 'Magia',
  alchemy: 'Alquimia',
  woodcutting: 'Leñador',
  farming: 'Agricultura',
  fishing: 'Pesca',
  cooking: 'Cocina',
  jewelry: 'Joyería',
  carpentry: 'Carpintería',
  forging: 'Forja',
  mining: 'Minería',
  breeding: 'Crianza',
  fletching: 'Flechería',
  archery: 'Arquería',
  wizardry: 'Hechicería',
  fungiculture: 'Fungicultura',
  party: 'Party',
  skill_quest: 'Misiones de habilidad',
  kill_quest: 'Misiones de caza',
  cathedral: 'Catedral',
  scavenger_hunt: 'Búsqueda del tesoro',
}

export function findBoard(snapshot: PlayerSnapshot | undefined, board: string): PlayerBoard | undefined {
  return snapshot?.boards.find((entry) => entry.board === board)
}

export function totalXpFromScore(score = 0) {
  return score * 100_000
}

export function totalXp(snapshot: PlayerSnapshot | undefined) {
  return totalXpFromScore(findBoard(snapshot, 'total_xp')?.score)
}

export function levelChanges(current: PlayerSnapshot, previous?: PlayerSnapshot) {
  if (!previous) return []
  return current.boards
    .filter((entry) => !['total', 'total_xp'].includes(entry.board))
    .map((entry) => ({
      board: entry.board,
      change: entry.score - (findBoard(previous, entry.board)?.score ?? entry.score),
    }))
    .filter((entry) => entry.change > 0)
}

export function dailySnapshots(snapshots: PlayerSnapshot[]) {
  const latestByDate = new Map<string, PlayerSnapshot>()
  for (const snapshot of snapshots) latestByDate.set(snapshot.date, snapshot)
  return [...latestByDate.values()].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
}
