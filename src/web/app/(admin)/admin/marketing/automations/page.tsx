'use client'

import { useState } from 'react'

const AUTOMATIONS = [
  {
    id: '1', name: 'Welcome Series', trigger_type: 'new_signup', is_active: true,
    channel: ['email'], sent_count: 124,
    description: 'Sends 3 emails over 7 days to new signups',
    steps: [
      { delay_hours: 0, subject: 'Welcome to Marathon Pilates!', channel: 'email' },
      { delay_hours: 48, subject: 'Your first class guide', channel: 'email' },
      { delay_hours: 168, subject: 'Ready to book your next class?', channel: 'email' },
    ]
  },
  {
    id: '2', name: 'Pack Expiring Soon', trigger_type: 'pack_expiring', is_active: true,
    channel: ['email', 'sms'], sent_count: 87,
    description: 'Notifies clients when their class pack has 7 days left',
    steps: [
      { delay_hours: 0, subject: 'Your pack expires in 7 days', channel: 'email' },
      { delay_hours: 120, subject: 'Last chance — 2 days left!', channel: 'sms' },
    ]
  },
  {
    id: '3', name: 'Win-Back', trigger_type: 'win_back', is_active: true,
    channel: ['email'], sent_count: 43,
    description: 'Re-engages clients who haven\'t visited in 30 days',
    steps: [
      { delay_hours: 0, subject: 'We miss you at Marathon Pilates', channel: 'email' },
      { delay_hours: 72, subject: 'Special offer just for you', channel: 'email' },
    ]
  },
  {
    id: '4', name: 'Failed Payment', trigger_type: 'failed_payment', is_active: true,
    channel: ['email', 'sms'], sent_count: 19,
    description: 'Alerts members of failed subscription payment',
    steps: [
      { delay_hours: 0, subject: 'Action required: payment failed', channel: 'email' },
      { delay_hours: 24, subject: 'Your membership is paused — update billing', channel: 'sms' },
    ]
  },
  {
    id: '5', name: 'Milestone Celebration', trigger_type: 'milestone', is_active: false,
    channel: ['email'], sent_count: 0,
    description: 'Celebrates class milestones (10, 25, 50, 100 classes)',
    steps: [
      { delay_hours: 0, subject: '🎉 You just hit a milestone!', channel: 'email' },
    ]
  },
  {
    id: '6', name: 'Birthday', trigger_type: 'birthday', is_active: false,
    channel: ['email', 'sms'], sent_count: 0,
    description: 'Sends a birthday message + complimentary class offer',
    steps: [
      { delay_hours: 0, subject: 'Happy Birthday from Marathon Pilates 🎂', channel: 'email' },
    ]
  },
]

const TRIGGER_LABELS: Record<string, string> = {
  new_signup: 'New Signup',
  pack_expiring: 'Pack Expiring',
  win_back: 'Win-Back (30 days)',
  failed_payment: 'Failed Payment',
  milestone: 'Class Milestone',
  birthday: 'Birthday',
  trial_booked: 'Trial Booked',
}

export default function AutomationsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedAuto = AUTOMATIONS.find(a => a.id === selected)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-500 mt-1">{AUTOMATIONS.filter(a => a.is_active).length} active · {AUTOMATIONS.reduce((sum, a) => sum + a.sent_count, 0)} total sent</p>
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#87CEBF' }}
        >
          + New Automation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automations list */}
        <div className="lg:col-span-1 space-y-3">
          {AUTOMATIONS.map(auto => (
            <div
              key={auto.id}
              onClick={() => setSelected(auto.id === selected ? null : auto.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                selected === auto.id ? 'border-[#87CEBF] shadow-md' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{auto.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{TRIGGER_LABELS[auto.trigger_type]}</p>
                </div>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`relative w-10 h-5 rounded-full transition-colors ${auto.is_active ? 'bg-[#87CEBF]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${auto.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-gray-400">{auto.steps.length} step{auto.steps.length !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{auto.sent_count} sent</span>
                <div className="flex gap-1 ml-auto">
                  {auto.channel.map(c => (
                    <span key={c} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded uppercase">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedAuto ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedAuto.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedAuto.description}</p>
                </div>
                <button className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Edit
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Steps</p>
                <div className="space-y-3">
                  {selectedAuto.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: '#87CEBF' }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">{step.subject}</p>
                          <span className="text-xs bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 uppercase">{step.channel}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {step.delay_hours === 0 ? 'Immediately' : `After ${step.delay_hours}h`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400">Total Sent</p>
                  <p className="text-xl font-semibold text-gray-900">{selectedAuto.sent_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trigger</p>
                  <p className="text-sm font-medium text-gray-700">{TRIGGER_LABELS[selectedAuto.trigger_type]}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Channels</p>
                  <p className="text-sm font-medium text-gray-700 capitalize">{selectedAuto.channel.join(', ')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-400">Select an automation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
