import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GrievanceList from './pages/GrievanceList'
import GrievanceDetail from './pages/GrievanceDetail'
import Search from './pages/Search'
import Reports from './pages/Reports'
import AdminProfiles from './pages/AdminProfiles'
import Feedback from './pages/Feedback'
import MyGrievances from './pages/MyGrievances'
import Layout from './components/Layout'
import PublicStats from './pages/PublicStats'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/public-stats" element={<PublicStats />} />
          <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="grievances" element={<GrievanceList />} />
            <Route path="grievances/:id" element={<GrievanceDetail />} />
            <Route path="search" element={<Search />} />
            <Route path="reports" element={<Reports />} />
            <Route path="admin-profiles" element={<AdminProfiles />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="my-grievances" element={<MyGrievances />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
