#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = path.resolve(import.meta.dirname, '..')
const outputDirectory = path.join(root, 'public', 'data')
const localSource = process.env.RPG_MO_WIKI_DIR
const sourceRepository = 'https://github.com/marcqg/rpg-mo-wiki'
const rawBase = 'https://raw.githubusercontent.com/marcqg/rpg-mo-wiki/main/data/game'

const categories = { 0: 'Armor', 1: 'Food', 2: 'Jewelry', 3: 'Material', 4: 'Tool', 5: 'Weapon', 6: 'Spell', 7: 'Pet Item', 8: 'House', 9: 'Archery' }
const slots = { 0: 'Helmet', 1: 'Cape', 2: 'Chest', 3: 'Right Hand', 4: 'Left Hand', 5: 'Gloves', 6: 'Boots', 7: 'Amulet', 8: 'Ring', 9: 'None', 10: 'Magic', 11: 'Pants', 12: 'Pet', 16: 'Key', 20: 'Arrow', 21: 'Spirit' }
const statFields = { aim: 'Aim', power: 'Power', armor: 'Armor', magic: 'Magic', speed: 'Speed', health: 'Health', inventory: 'Inventory' }
const requirementFields = { min_accuracy: 'Accuracy', min_strength: 'Strength', min_defense: 'Defense', min_magic: 'Magic', min_archery: 'Archery', min_health: 'Health' }

async function readSource(file) {
  if (localSource) return JSON.parse(await readFile(path.join(localSource, 'data', 'game', file), 'utf8'))
  const response = await fetch(`${rawBase}/${file}`)
  if (!response.ok) throw new Error(`No se pudo descargar ${file}: HTTP ${response.status}`)
  return response.json()
}

function selectedNumbers(params, fields) {
  return Object.fromEntries(Object.entries(fields).flatMap(([source, label]) => typeof params?.[source] === 'number' ? [[label, params[source]]] : []))
}

await mkdir(outputDirectory, { recursive: true })
const [rawItems, rawMobs, rawRecipes] = await Promise.all([readSource('items.json'), readSource('mobs.json'), readSource('recipes.json')])
const itemNames = new Map(rawItems.map((item) => [item.id, item.n]))

const items = rawItems.map((item) => ({
  id: item.id,
  name: item.n,
  category: categories[item.t] ?? `Unknown ${item.t}`,
  slot: slots[item.params?.slot] ?? 'None',
  wearable: item.params?.wearable === true,
  ...(typeof item.params?.price === 'number' ? { price: item.params.price } : {}),
  stats: selectedNumbers(item.params, statFields),
  requirements: selectedNumbers(item.params, requirementFields),
})).sort((a, b) => a.name.localeCompare(b.name))

const mobs = rawMobs.filter((mob) => mob.type === 3 && Number.isFinite(mob.params?.combat_level) && Number.isFinite(mob.params?.health) && mob.params.health > 0).map((mob) => ({
  id: mob.id,
  name: mob.n,
  combatLevel: mob.params.combat_level,
  health: mob.params.health,
  accuracy: mob.temp?.total_accuracy ?? 0,
  strength: mob.temp?.total_strength ?? 0,
  defense: mob.temp?.total_defense ?? 0,
  locations: Object.keys(mob.locations ?? {}),
})).sort((a, b) => a.combatLevel - b.combatLevel || a.name.localeCompare(b.name))

const recipes = rawRecipes.filter((recipe) => recipe.skill && Number.isFinite(recipe.xp) && recipe.xp > 0).map((recipe) => ({
  id: recipe.id,
  name: recipe.n,
  skill: recipe.skill,
  level: recipe.level ?? 1,
  xp: recipe.xp,
  minChance: recipe.min_chance ?? 100,
  maxChance: recipe.max_chance ?? recipe.min_chance ?? 100,
  station: recipe.object ?? 'Actividad',
  materials: (recipe.matts ?? []).map((material) => ({ id: material.id, name: itemNames.get(material.id) ?? `Item #${material.id}`, count: material.c ?? 1 })),
})).sort((a, b) => a.skill.localeCompare(b.skill) || a.level - b.level || a.name.localeCompare(b.name))

let sourceCommit = 'main'
if (localSource) {
  try { sourceCommit = (await execFileAsync('git', ['-C', localSource, 'rev-parse', 'HEAD'])).stdout.trim() } catch { /* metadata remains main */ }
}

const meta = {
  generatedAt: new Date().toISOString(),
  sourceRepository,
  sourceCommit,
  counts: { items: items.length, mobs: mobs.length, recipes: recipes.length },
}

for (const [file, data] of Object.entries({ 'items.json': items, 'mobs.json': mobs, 'recipes.json': recipes, 'meta.json': meta })) {
  await writeFile(path.join(outputDirectory, file), `${JSON.stringify(data)}\n`)
}

console.log(`Datos preparados: ${items.length} items, ${mobs.length} mobs, ${recipes.length} recetas.`)
