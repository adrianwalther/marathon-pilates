'use client'

const REFERRALS = [
  { id: '1', referrer: 'Sarah Johnson', referred_email: 'kate@email.com', referred_name: 'Kate Rodriguez', status: 'converted', reward_type: 'free_class', reward_value: 35, created_at: '2026-02-10', converted_at: '2026-02-18' },
  { id: '2', referrer: 'Anissa Bartels', referred_email: 'meg@email.com', referred_name: 'Meg Turner', status: 'signed_up', reward_type: 'free_class', reward_value: 35, created_at: '2026-03-01', converted_at: null },
  { id: '3', referrer: 'Ruby Ramdhan', referred_email: 'emily@email.com', referred_name: 'Emily Mitchell', status: 'rewarded', reward_type: 'credit', reward_value: 20, created_at: '2026-01-15', converted_at: '2026-01-22' },
  { id: '4', referrer: 'Lindsey Baylor', referred_email: 'jen@email.com', referred_name: null, status: 'pending', reward_type: 'free_class', reward_value: 35, created_at: '2026-03-12', converted_at: null },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  signed_up: 'bg-blue-100 text-blue-700',
  converted: 'bg-yellow-100 text-yellow-700',
  rewarded: 'bg-green-100 text-green-700',
}

export default function ReferralsPage() {
  const totalReferred = REFERRALS.length
  const converted = REFERRALS.filter(r => r.status === 'converted' || r.status === 'rewarded').length
  const conversionRate = Math.round((converted / totalReferred) * 100)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Referral Program</h1>
          <p className="text-sm text-gray-500 mt-1">Reward clients for bringing friends to Marathon Pilates</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#87CEBF' }}>
          Program Settings
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: totalReferred.toString() },
          { label: 'Converted', value: converted.toString() },
          { label: 'Conversion Rate', value: `${conversionRate}%` },
          { label: 'Rewards Issued', value: REFERRALS.filter(r => r.status === 'rewarded').length.toString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Program config card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Current Program</h2>
          <button className="text-sm text-gray-400 hover:text-gray-700">Edit</button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-400">Referrer Reward</p>
            <p className="text-sm font-medium text-gray-700 mt-1">1 Free Group Class</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Friend Reward</p>
            <p className="text-sm font-medium text-gray-700 mt-1">10% off first month</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Triggers When</p>
            <p className="text-sm font-medium text-gray-700 mt-1">Friend completes 1st class</p>
          </div>
        </div>
      </div>

      {/* Referrals table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Referred By</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Friend</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reward</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {REFERRALS.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.referrer}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-800">{r.referred_name || '—'}</p>
                  <p className="text-xs text-gray-400">{r.referred_email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                  {r.reward_type?.replace('_', ' ')} (${r.reward_value})
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.created_at}</td>
                <td className="px-4 py-3">
                  {r.status === 'converted' && (
                    <button className="text-xs font-medium" style={{ color: '#87CEBF' }}>Issue Reward</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
