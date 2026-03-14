'use client'

import { useState } from 'react'

const TESTIMONIALS = [
  { id: '1', client_name: 'Sarah H.', content: 'Marathon Pilates completely transformed my relationship with movement. Ruby and the instructors are so knowledgeable and supportive.', rating: 5, service_type: 'group_reformer', status: 'published', show_on_website: true, source: 'in_app', created_at: '2026-03-01' },
  { id: '2', client_name: 'Kate R.', content: 'The sauna and cold plunge combo after reformer class is unreal. Best recovery routine I\'ve ever had.', rating: 5, service_type: 'contrast_therapy', status: 'approved', show_on_website: false, source: 'in_app', created_at: '2026-03-08' },
  { id: '3', client_name: 'Jennifer E.', content: 'Private sessions with Anissa are incredible. She really tailors everything to my body and goals.', rating: 5, service_type: 'private_solo', status: 'pending', show_on_website: false, source: 'google', created_at: '2026-03-10' },
  { id: '4', client_name: 'Mia B.', content: 'Great studio but parking can be tricky sometimes.', rating: 3, service_type: 'group_reformer', status: 'pending', show_on_website: false, source: 'in_app', created_at: '2026-03-12' },
  { id: '5', client_name: 'Parker L.', content: 'I was nervous as a total beginner but felt so welcomed from day one. The Level 1 class is perfect.', rating: 5, service_type: 'group_reformer', status: 'approved', show_on_website: true, source: 'yelp', created_at: '2026-02-20' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}

export default function TestimonialsPage() {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? TESTIMONIALS : TESTIMONIALS.filter(t => t.status === filter)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Testimonials</h1>
          <p className="text-sm text-gray-500 mt-1">{TESTIMONIALS.filter(t => t.show_on_website).length} published on website</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#87CEBF' }}>
          Request Reviews
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['all', 'pending', 'approved', 'published'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {f} {f === 'pending' && TESTIMONIALS.filter(t => t.status === 'pending').length > 0 && (
              <span className="ml-1 bg-yellow-400 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                {TESTIMONIALS.filter(t => t.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Testimonials grid */}
      <div className="space-y-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: '#87CEBF' }}>
                    {t.client_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t.client_name}</p>
                    <div className="flex items-center gap-2">
                      <Stars rating={t.rating} />
                      <span className="text-xs text-gray-400 capitalize">{t.service_type?.replace(/_/g, ' ')}</span>
                      <span className="text-xs bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded capitalize">{t.source}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">"{t.content}"</p>
                <p className="text-xs text-gray-400 mt-2">{t.created_at}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status]}`}>
                  {t.status}
                </span>
                {t.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Reject</button>
                    <button className="text-xs px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: '#87CEBF' }}>Approve</button>
                  </div>
                )}
                {t.status === 'approved' && (
                  <button className="text-xs px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: '#87CEBF' }}>
                    Publish to Website
                  </button>
                )}
                {t.show_on_website && (
                  <span className="text-xs text-green-600 font-medium">✓ On website</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
