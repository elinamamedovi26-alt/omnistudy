import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import TimeManager from './pages/TimeManager'
import StudyHub from './pages/StudyHub'
import ProfileSettings from './pages/ProfileSettings'

// Default tasks for a fresh user to demonstrate the planner
const DEFAULT_TASKS = [
  {
    id: 'def-task-1',
    text: 'სადემონსტრაციო: წაიკითხე "ვეფხისტყაოსნის" პირველი თავი',
    priority: 'high',
    deadline: 'დღეს',
    done: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'def-task-2',
    text: 'სადემონსტრაციო: შექმენი პირველი სასწავლო გეგმა AI Time Manager-ში',
    priority: 'medium',
    deadline: 'ხვალ',
    done: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'def-task-3',
    text: 'სადემონსტრაციო: ატვირთე სასწავლო მასალა (.txt) Study Hub-ში',
    priority: 'low',
    deadline: '2 დღეში',
    done: false,
    createdAt: new Date().toISOString()
  }
]

export default function App() {
  const [user, setUser] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [activePage, setActivePage] = useState('dashboard')
  const [tasks, setTasks] = useState([])
  const [initialized, setInitialized] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('omnistudy_user')
    const savedKey = localStorage.getItem('omnistudy_gemini_key')
    const savedTasks = localStorage.getItem('omnistudy_tasks')

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedKey) {
      setApiKey(savedKey)
    }
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    } else {
      setTasks(DEFAULT_TASKS)
    }
    setInitialized(true)
  }, [])

  // Sync state to localStorage
  useEffect(() => {
    if (!initialized) return
    if (user) {
      localStorage.setItem('omnistudy_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('omnistudy_user')
    }
  }, [user, initialized])

  useEffect(() => {
    if (!initialized) return
    localStorage.setItem('omnistudy_gemini_key', apiKey)
  }, [apiKey, initialized])

  useEffect(() => {
    if (!initialized) return
    localStorage.setItem('omnistudy_tasks', JSON.stringify(tasks))
  }, [tasks, initialized])

  const handleLogin = (userData) => {
    // default pace is balanced
    const newProfile = { ...userData, pace: 'balanced' }
    setUser(newProfile)
    setTasks(DEFAULT_TASKS)
    setActivePage('dashboard')
  }

  const handleLogout = () => {
    // clear localstorage
    localStorage.removeItem('omnistudy_user')
    localStorage.removeItem('omnistudy_tasks')
    localStorage.removeItem('last_study_plan_summary')
    setUser(null)
    setTasks([])
    setActivePage('dashboard')
  }

  const handleUpdateProfile = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }))
  }

  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-muted)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-large" style={{ margin: '0 auto 16px auto' }} />
          <p>იტვირთება OmniStudy...</p>
        </div>
      </div>
    )
  }

  // Render auth/landing page if no user session
  if (!user) {
    return <Landing onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Pages Switchboard */}
      <main className="content-area">
        {activePage === 'dashboard' && (
          <Dashboard 
            tasks={tasks} 
            setTasks={setTasks} 
            apiKey={apiKey} 
            academicPace={user.pace} 
          />
        )}
        
        {activePage === 'time-manager' && (
          <TimeManager 
            tasks={tasks} 
            setTasks={setTasks} 
            apiKey={apiKey} 
            academicPace={user.pace} 
          />
        )}

        {activePage === 'study-hub' && (
          <StudyHub 
            apiKey={apiKey} 
          />
        )}

        {activePage === 'settings' && (
          <ProfileSettings 
            user={user} 
            onUpdateProfile={handleUpdateProfile} 
            apiKey={apiKey} 
            setApiKey={setApiKey} 
            tasks={tasks} 
          />
        )}
      </main>

      {/* Embedded SVG filters (e.g. for potential gradients) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
