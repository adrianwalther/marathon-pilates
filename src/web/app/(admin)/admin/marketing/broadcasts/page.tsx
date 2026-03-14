'use client'

import { useState } from 'react'

const BROADCASTS = [
  { id: '1', title: 'Spring Schedule Update', subject: 'New classes added for Spring 2026!', status: 'sent', channel: ['email'], recipient_count: 312, open_count: 187, click_count: 43, sent_at: '2026-03-10', audience: 'all_clients' },
  { id: '2', title: 'Founding Member Reminder', subject: 'Last chance to lock in founding rates', status: 'sent', channel: ['email', 'sms'], recipient_count: 89, open_count: 71, click_count: 28, sent_at: '2026-03-05', audience: 'active_members' },
  { id: '3', title: 'Green Hills Grand Opening', subject: '🎉 Green Hills is now open!', status: 'draft', channel: ['email', 'sms'], recipient_count: 0, open_count: 0, click_count: 0, sent_at: null, audience: 'all_clients' },
  { id: '4', title: 'March Newsletter', subject: 'Marathon Pilates — March 2026', status: 'scheduled', channel: ['email'], recipient_count: 312, open_count: 0, click_count: 0, sent_at: '2026-03-20', audience: 'all_clients' },
]

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
}

export default function BroadcastsPage() {
  const [composing, setComposing] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Broadcasts</h1>
          <p className="text-sm text-gray-500 mt-1">Newsletters and announcements to clients and leads</p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#87CEBF' }}
        >
          + New Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: '2' },
          { label: 'Avg Open Rate', value: '68%' },
          { label: 'Avg Click Rate', value: '18%' },
          { label: 'Total Recipients', value: '401' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Broadcasts list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Audience</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent / Opens / Clicks</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {BROADCASTS.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{b.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.subject}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize text-xs">{b.audience.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  {b.status === 'sent' ? (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-700">{b.recipient_count} sent</span>
                      <span className="text-gray-400">{b.open_count} opens ({Math.round(b.open_count / b.recipient_count * 100)}%)</span>
                      <span className="text-gray-400">{b.click_count} clicks</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{b.sent_at || '—'}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-gray-400 hover:text-gray-700">
                    {b.status === 'draft' ? 'Edit' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Broadcast</h2>
              <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#87CEBF]" placeholder="Internal name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Audience</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#87CEBF]">
                    <option>All Clients</option>
                    <option>Active Members</option>
                    <option>Leads</option>
                    <option>Charlotte Park only</option>
                    <option>Green Hills only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Channels</label>
                  <div className="flex gap-3 mt-1">
                    {['Email', 'SMS', 'Push'].map(c => (
                      <label key={c} className="flex items-center gap-1.5 text-sm text-gray-600">
                        <input type="checkbox" defaultChecked={c === 'Email'} className="rounded" />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject Line</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#87CEBF]" placeholder="Email subject" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#87CEBF] resize-none" rows={6} placeholder="Write your message..." />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 border-t border-gray-100">
              <button onClick={() => setComposing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
                  Save Draft
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#87CEBF' }}>
                  Send Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
