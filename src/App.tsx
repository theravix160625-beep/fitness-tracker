import { useState, useEffect } from 'react'
import BottomNav from './components/BottomNav'
import WorkoutLogger from './components/WorkoutLogger'
import Schema from './components/Schema'
import DailyLog from './components/DailyLog'
import WeeklyCheckIn from './components/WeeklyCheckIn'
import Profile from './components/Profile'
import { playClick } from './utils/sounds'

type Tab = 'workout' | 'schema' | 'dagboek' | 'checkin' | 'profiel'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout')

  // Global tap sound on any button/interactive element
  useEffect(() => {
    let lastPlay = 0
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      const interactive = target.closest('button, a, input[type="range"], label')
      if (!interactive) return
      const now = Date.now()
      if (now - lastPlay < 60) return   // debounce rapid taps
      lastPlay = now
      playClick()
    }
    document.addEventListener('pointerdown', handler, { passive: true })
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div style={{
          position: 'absolute', top: '-120px', left: '-80px',
          width: '360px', height: '360px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '80px', right: '-100px',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        }} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {activeTab === 'workout' && <WorkoutLogger />}
        {activeTab === 'schema'  && <Schema />}
        {activeTab === 'dagboek' && <DailyLog />}
        {activeTab === 'checkin' && <WeeklyCheckIn />}
        {activeTab === 'profiel' && <Profile />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
