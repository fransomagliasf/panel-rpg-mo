import { useEffect, useState } from 'react'
import { Layout, routes, type RouteId } from './components/Layout'
import { useLocalStorage } from './lib/storage'
import { Dashboard } from './pages/Dashboard'
import { Items } from './pages/Items'
import { Mobs } from './pages/Mobs'
import { Player } from './pages/Player'
import { Professions } from './pages/Professions'
import { Sets } from './pages/Sets'
import { Sources } from './pages/Sources'
import { XpTracker } from './pages/XpTracker'
import type { Profile, XpEntry } from './types'

const defaultProfile: Profile = { characterName: 'Broar', combatLevel: 1, dailyGoal: 100000, doubleXpHours: 0 }

function routeFromHash(): RouteId {
  const hash = window.location.hash.replace('#/', '')
  return routes.some((route) => route.id === hash) ? hash as RouteId : 'inicio'
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(routeFromHash)
  const [profile, setProfile] = useLocalStorage<Profile>('mo-tracker-profile', defaultProfile)
  const [entries, setEntries] = useLocalStorage<XpEntry[]>('mo-tracker-xp', [])

  useEffect(() => {
    const update = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  useEffect(() => {
    if (!profile.characterName) setProfile({ ...profile, characterName: 'Broar' })
  }, [profile, setProfile])

  const navigate = (next: RouteId) => {
    window.location.hash = `/${next}`
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const content = {
    inicio: <Dashboard profile={profile} setProfile={setProfile} entries={entries} navigate={navigate} />,
    personaje: <Player />,
    experiencia: <XpTracker profile={profile} entries={entries} setEntries={setEntries} />,
    items: <Items />,
    sets: <Sets />,
    mobs: <Mobs />,
    oficios: <Professions />,
    fuentes: <Sources />,
  }[route]

  return <Layout active={route} onNavigate={navigate} characterName={profile.characterName}>{content}</Layout>
}
