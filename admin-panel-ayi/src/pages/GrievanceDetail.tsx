import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Grievance, GrievanceAction, GrievanceStatus } from '../types'
import { getStatusColor, formatDate } from '../lib/utils'

export default function GrievanceDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState('')
  const [newStatus, setNewStatus] = useState<GrievanceStatus>('Acknowledged')

  const { data: grievance, isLoading } = useQuery({
    queryKey: ['grievance', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grievances')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Grievance
    },
  })

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grievance_actions')
        .select('*')
        .eq('grievance_id', id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as GrievanceAction[]
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single()

      await supabase.from('grievances').update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', id)

      await supabase.from('grievance_actions').insert({
        grievance_id: id,
        action_by: user?.id,
        admin_name: profile?.full_name || 'Admin',
        remarks,
        new_status: newStatus,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievance', id] })
      queryClient.invalidateQueries({ queryKey: ['actions', id] })
      setRemarks('')
    },
  })

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!grievance) {
    return <div className="p-8">Grievance not found</div>
  }

  const statuses: GrievanceStatus[] = [
    'Submitted', 'Acknowledged', 'Under Review', 'In Progress',
    'Awaiting Confirmation', 'Resolved', 'Closed', 'Rejected'
  ]

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{grievance.grievance_id}</h1>
          <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(grievance.status)}`}>
            {grievance.status}
          </span>
        </div>

        {/* Identity Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Identity</h2>
          {grievance.is_anonymous ? (
            <p className="text-gray-600 italic">Anonymous Submission</p>
          ) : (
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {grievance.user_name || 'N/A'}</p>
              <p><span className="font-medium">Role:</span> {grievance.user_role || 'N/A'}</p>
              <p><span className="font-medium">Department:</span> {grievance.user_department || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-4">
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <span className="ml-2 text-gray-900">{grievance.category}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Submitted:</span>
              <span className="ml-2 text-gray-900">{formatDate(grievance.created_at)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Description:</span>
              <p className="mt-2 text-gray-900">{grievance.description}</p>
            </div>
          </div>
        </div>

        {/* Media Section */}
        {(grievance.image_url || grievance.video_url) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
            <div className="space-y-2">
              {grievance.image_url && (
                <a href={grievance.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                  📷 View Image
                </a>
              )}
              {grievance.video_url && (
                <a href={grievance.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">
                  🎥 View Video
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as GrievanceStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add your remarks here..."
              />
            </div>
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Action'}
            </button>
          </div>
        </div>

        {/* Action History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Action History</h2>
          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{action.new_status}</p>
                    <p className="text-sm text-gray-600 mt-1">{action.remarks}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{action.admin_name}</p>
                    <p>{formatDate(action.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
