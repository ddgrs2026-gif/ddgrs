import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Grievance } from '../types'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#FB923C', '#6B7280', '#60A5FA']

export default function PublicStats() {
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('grievances').select('status, category, created_at')
      setGrievances((data || []) as Grievance[])
      setLoading(false)
    }
    fetch()

    // Real-time
    const channel = supabase
      .channel('public-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grievances' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const total = grievances.length
  const resolved = grievances.filter(g => g.status === 'Resolved' || g.status === 'Closed').length
  const pending = grievances.filter(g => g.status === 'Submitted' || g.status === 'Acknowledged').length
  const rate = total ? Math.round((resolved / total) * 100) : 0

  const statusData = [
    { name: 'Resolved', value: resolved, color: '#10B981' },
    { name: 'Pending', value: pending, color: '#F59E0B' },
    { name: 'In Progress', value: grievances.filter(g => g.status === 'In Progress' || g.status === 'Under Review').length, color: '#3B82F6' },
    { name: 'Closed', value: grievances.filter(g => g.status === 'Closed').length, color: '#6B7280' },
  ].filter(d => d.value > 0)

  const categories = ['Academic', 'Examination', 'Infrastructure', 'Hostel', 'Library', 'Administration', 'IT / Network', 'Discipline / Harassment', 'Other']
  const categoryData = categories.map(c => ({
    name: c.length > 12 ? c.substring(0, 12) + '…' : c,
    count: grievances.filter(g => g.category === c).length
  })).filter(d => d.count > 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-gray-500">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Grievance Management System</h1>
        <p className="text-sm text-gray-500 mt-1">Live Statistics</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
        {[
          { label: 'Total Grievances', value: total, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Resolved', value: resolved, color: 'text-green-600', bg: 'bg-white' },
          { label: 'Pending', value: pending, color: 'text-yellow-600', bg: 'bg-white' },
          { label: 'Resolution Rate', value: `${rate}%`, color: 'text-blue-600', bg: 'bg-white' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg border border-gray-200 p-5 text-center shadow-sm`}>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400">No data</div>}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Category Distribution</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400">No data</div>}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Updates automatically • DDGRS {new Date().getFullYear()}
      </p>
    </div>
  )
}
