import { useState } from 'react'
import BottomNav from './components/BottomNav'
import WorkoutLogger from './components/WorkoutLogger'
import Schema from './components/Schema'
import DailyLog from './components/DailyLog'
import WeeklyCheckIn from './components/WeeklyCheckIn'
import Profile from './components/Profile'

type Tab = 'workout' | 'schema' | 'dagboek' | 'checkin' | 'profiel'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout')

  return (
    <div className="flex flex-col min-h-svh bg-[#0f0f0f] max-w-lg mx-auto">
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'workout' && <WorkoutLogger />}
        {activeTab === 'schema' && <Schema />}
        {activeTab === 'dagboek' && <DailyLog />}
        {activeTab === 'checkin' && <WeeklyCheckIn />}
        {activeTab === 'profiel' && <Profile />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
