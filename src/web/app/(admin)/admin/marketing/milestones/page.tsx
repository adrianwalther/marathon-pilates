'use client'

const MILESTONES_CONFIG = [
  { type: 'classes_10', label: '10 Classes', description: 'First 10 classes completed', reward: 'Shoutout + sticker pack', icon: '🌱' },
  { type: 'classes_25', label: '25 Classes', description: 'Building momentum', reward: 'Shoutout + $10 credit', icon: '🌿' },
  { type: 'classes_50', label: '50 Classes', description: 'Dedicated mover', reward: 'Shoutout + $15 credit', icon: '✨' },
  { type: 'classes_100', label: '100 Classes', description: 'Century club', reward: 'Shoutout + $25 credit + special badge', icon: '🏆' },
  { type: 'classes_200', label: '200 Classes', description: 'Elite member', reward: 'Personal recognition from Ruby + $50 credit', icon: '👑' },
  { type: 'first_private', label: 'First Private Session', description: 'Tried a private', reward: 'Booking confirmation message', icon: '🎯' },
  { type: 'one_year_anniversary', label: '1 Year Anniversary', description: 'One full year with Marathon Pilates', reward: 'Personal note from Ruby + free class', icon: '🎂' },
]

const RECENT_MILESTONES = [
  { id: '1', client_name: 'Sarah Johnson', type: 'classes_100', achieved_at: '2026-03-12', celebrated: true },
  { id: '2', client_name: 'Harriett Watkins', type: 'classes_50', achieved_at: '2026-03-11', celebrated: false },
  { id: '3', client_name: 'Kate Rodriguez', type: 'one_year_anniversary', achieved_at: '2026-03-10', celebrated: false },
  { id: '4', client_name: 'Parker Long', type: 'classes_10', achieved_at: '2026-03-09', celebrated: true },
  { id: '5', client_name: 'Jennifer Estes', type: 'first_private', achieved_at: '2026-03-08', celebrated: false },
]

export default function MilestonesPage() {
  const uncelebrated = RECENT_MILESTONES.filter(m => !m.celebrated)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Milestones & Achievements</h1>
          <p className="text-sm text-gray-500 mt-1">Track and celebrate client progress</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#87CEBF' }}>
          Configure Rewards
        </button>
      </div>

      {/* Pending celebrations */}
      {uncelebrated.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-3">🎉 {uncelebrated.length} milestones need celebrating</p>
          <div className="space-y-2">
            {uncelebrated.map(m => {
              const config = MILESTONES_CONFIG.find(c => c.type === m.type)!
              return (
                <div key={m.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{config.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.client_name}</p>
                      <p className="text-xs text-gray-400">reached {config.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">Send Email</button>
                    <button className="text-xs px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: '#87CEBF' }}>
                      Mark Celebrated
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone tiers config */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Milestone Tiers</h2>
          <div className="space-y-3">
            {MILESTONES_CONFIG.map(m => (
              <div key={m.type} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.description}</p>
                  <p className="text-xs mt-1" style={{ color: '#87CEBF' }}>Reward: {m.reward}</p>
                </div>
                <button className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent milestones */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Milestones</h2>
          <div className="space-y-3">
            {RECENT_MILESTONES.map(m => {
              const config = MILESTONES_CONFIG.find(c => c.type === m.type)!
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-xl">{config.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{m.client_name}</p>
                    <p className="text-xs text-gray-400">{config.label} · {m.achieved_at}</p>
                  </div>
                  {m.celebrated ? (
                    <span className="text-xs text-green-600 font-medium">✓ Celebrated</span>
                  ) : (
                    <span className="text-xs text-yellow-600 font-medium">Pending</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
