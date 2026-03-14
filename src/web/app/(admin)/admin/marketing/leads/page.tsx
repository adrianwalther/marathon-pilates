'use client'

import { useState } from 'react'

const STAGES = [
  { key: 'new_lead', label: 'New Lead', color: 'bg-gray-100 text-gray-700' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { key: 'trial_booked', label: 'Trial Booked', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'trial_completed', label: 'Trial Done', color: 'bg-purple-100 text-purple-700' },
  { key: 'converted', label: 'Converted', color: 'bg-green-100 text-green-700' },
  { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
]

const MOCK_LEADS = [
  { id: '1', first_name: 'Mia', last_name: 'Beard', email: 'mia@email.com', stage: 'new_lead', source: 'instagram', interested_in: ['group_reformer'], created_at: '2026-03-13' },
  { id: '2', first_name: 'Rachel', last_name: 'Hines', email: 'rachel@email.com', stage: 'new_lead', source: 'website', interested_in: ['private_solo'], created_at: '2026-03-13' },
  { id: '3', first_name: 'Hannah', last_name: 'Baase', email: 'hannah@email.com', stage: 'contacted', source: 'referral', interested_in: ['group_reformer', 'sauna'], created_at: '2026-03-12' },
  { id: '4', first_name: 'Parker', last_name: 'Long', email: 'parker@email.com', stage: 'trial_booked', source: 'walk_in', interested_in: ['group_reformer'], created_at: '2026-03-10' },
  { id: '5', first_name: 'Jennifer', last_name: 'Estes', email: 'jen@email.com', stage: 'trial_completed', source: 'instagram', interested_in: ['group_reformer'], created_at: '2026-03-08' },
  { id: '6', first_name: 'April', last_name: 'Smith', email: 'april@email.com', stage: 'converted', source: 'referral', interested_in: ['private_solo'], created_at: '2026-03-05' },
]

const TASKS = [
  { id: '1', lead_id: '1', title: 'Leads who never came in', status: 'not_started', due_at: '2026-03-14' },
  { id: '2', lead_id: '2', title: 'Follow up after inquiry', status: 'not_started', due_at: '2026-03-14' },
  { id: '3', lead_id: '3', title: 'Send trial class offer', status: 'in_progress', due_at: '2026-03-15' },
]

export default function LeadsPage() {
  const [view, setView] = useState<'kanban' | 'list' | 'tasks'>('kanban')
  const [showAddLead, setShowAddLead] = useState(false)

  const leadsByStage = STAGES.reduce((acc, s) => {
    acc[s.key] = MOCK_LEADS.filter(l => l.stage === s.key)
    return acc
  }, {} as Record<string, typeof MOCK_LEADS>)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lead Management</h1>
          <p className="text-sm text-gray-500 mt-1">{MOCK_LEADS.length} leads · {MOCK_LEADS.filter(l => l.stage === 'converted').length} converted</p>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#87CEBF' }}
        >
          + Add Lead
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['kanban', 'list', 'tasks'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {v === 'tasks' ? 'Tasks' : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage.key} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-xs text-gray-400">{leadsByStage[stage.key]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(leadsByStage[stage.key] || []).map(lead => (
                  <div key={lead.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <p className="font-medium text-sm text-gray-900">{lead.first_name} {lead.last_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{lead.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded capitalize">{lead.source}</span>
                      {lead.interested_in.slice(0, 1).map(i => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#87CEBF20', color: '#87CEBF' }}>
                          {i.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {(leadsByStage[stage.key] || []).length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-xs text-gray-300">
                    No leads
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Interested In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_LEADS.map(lead => {
                const stage = STAGES.find(s => s.key === lead.stage)!
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-gray-400">{lead.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.color}`}>{stage.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{lead.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.interested_in.map(i => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#87CEBF20', color: '#4a9e91' }}>
                            {i.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{lead.created_at}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-gray-400 hover:text-gray-700">View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tasks view */}
      {view === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{TASKS.length} tasks · {TASKS.filter(t => t.status === 'not_started').length} not started</p>
            <button className="text-sm font-medium" style={{ color: '#87CEBF' }}>+ Add Task</button>
          </div>
          {TASKS.map(task => {
            const lead = MOCK_LEADS.find(l => l.id === task.lead_id)
            return (
              <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <input type="checkbox" className="rounded" checked={task.status === 'completed'} readOnly />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {lead && <p className="text-xs text-gray-400 mt-0.5">Client: {lead.first_name} {lead.last_name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === 'not_started' ? 'bg-gray-100 text-gray-500' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">Due {task.due_at}</span>
                  <button className="text-xs text-gray-400 hover:text-gray-700">Email</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
