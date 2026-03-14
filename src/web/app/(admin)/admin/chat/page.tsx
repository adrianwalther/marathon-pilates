'use client'

import { useState } from 'react'

const CONVERSATIONS = [
  { id: '1', client_name: 'Sarah Johnson', last_message: 'Can I reschedule my Thursday class?', last_message_at: '2 min ago', unread_count: 2, status: 'open', assigned_to: 'Ruby' },
  { id: '2', client_name: 'Kate Rodriguez', last_message: 'Thank you! See you Saturday 🙏', last_message_at: '1 hr ago', unread_count: 0, status: 'open', assigned_to: 'Anissa' },
  { id: '3', client_name: 'Harriett Watkins', last_message: 'Does the sauna pack expire?', last_message_at: '3 hrs ago', unread_count: 1, status: 'open', assigned_to: null },
  { id: '4', client_name: 'Parker Long', last_message: 'Just booked my first class!', last_message_at: 'Yesterday', unread_count: 0, status: 'open', assigned_to: 'Ruby' },
  { id: '5', client_name: 'Jennifer Estes', last_message: 'Perfect, I\'ll see you then!', last_message_at: 'Yesterday', unread_count: 0, status: 'closed', assigned_to: null },
]

const MESSAGES: Record<string, Array<{ id: string; sender: string; body: string; time: string; is_staff: boolean }>> = {
  '1': [
    { id: '1', sender: 'Sarah Johnson', body: 'Hi! I had a question about my Thursday class booking.', time: '10:32 AM', is_staff: false },
    { id: '2', sender: 'Ruby', body: 'Of course! What do you need?', time: '10:45 AM', is_staff: true },
    { id: '3', sender: 'Sarah Johnson', body: 'I need to reschedule — something came up at work.', time: '10:47 AM', is_staff: false },
    { id: '4', sender: 'Sarah Johnson', body: 'Can I move it to Saturday instead?', time: '10:47 AM', is_staff: false },
  ],
  '2': [
    { id: '1', sender: 'Kate Rodriguez', body: 'Hi! Just wanted to confirm my appointment tomorrow.', time: '9:15 AM', is_staff: false },
    { id: '2', sender: 'Anissa', body: 'Yes! You\'re all set for 10am at Charlotte Park 🎉', time: '9:20 AM', is_staff: true },
    { id: '3', sender: 'Kate Rodriguez', body: 'Thank you! See you Saturday 🙏', time: '9:22 AM', is_staff: false },
  ],
  '3': [
    { id: '1', sender: 'Harriett Watkins', body: 'Hi there — quick question about my sauna pack.', time: '8:00 AM', is_staff: false },
    { id: '2', sender: 'Harriett Watkins', body: 'Does the sauna pack expire?', time: '8:01 AM', is_staff: false },
  ],
}

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<string>('1')
  const [message, setMessage] = useState('')

  const selectedConvo = CONVERSATIONS.find(c => c.id === selectedId)
  const messages = MESSAGES[selectedId] || []
  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread_count, 0)

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="text-xs text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#87CEBF' }}>
                {totalUnread}
              </span>
            )}
          </div>
          <input
            className="mt-3 w-full bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"
            placeholder="Search conversations..."
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONVERSATIONS.filter(c => c.status === 'open').map(convo => (
            <div
              key={convo.id}
              onClick={() => setSelectedId(convo.id)}
              className={`p-4 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                selectedId === convo.id ? 'bg-gray-50 border-l-2 border-l-[#87CEBF]' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: '#87CEBF' }}>
                    {convo.client_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{convo.client_name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{convo.last_message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                  <p className="text-xs text-gray-400">{convo.last_message_at}</p>
                  {convo.unread_count > 0 && (
                    <span className="text-xs text-white w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#87CEBF' }}>
                      {convo.unread_count}
                    </span>
                  )}
                </div>
              </div>
              {convo.assigned_to && (
                <p className="text-xs text-gray-300 mt-1 pl-12">Assigned to {convo.assigned_to}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selectedConvo ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: '#87CEBF' }}>
                {selectedConvo.client_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedConvo.client_name}</p>
                <p className="text-xs text-gray-400">Active client</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option>Assign to: {selectedConvo.assigned_to || 'Unassigned'}</option>
                <option>Ruby</option>
                <option>Anissa</option>
                <option>Front Desk</option>
              </select>
              <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                View Profile
              </button>
              <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.is_staff ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm ${msg.is_staff ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!msg.is_staff && (
                    <span className="text-xs text-gray-400 px-1">{msg.sender}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.is_staff
                      ? 'text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                  }`} style={msg.is_staff ? { backgroundColor: '#87CEBF' } : {}}>
                    {msg.body}
                  </div>
                  <span className="text-xs text-gray-400 px-1">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-end gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setMessage('') } }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#87CEBF] resize-none"
                rows={2}
                placeholder="Type a message..."
              />
              <button
                onClick={() => setMessage('')}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-medium flex-shrink-0"
                style={{ backgroundColor: '#87CEBF' }}
              >
                Send
              </button>
            </div>
            <div className="flex gap-3 mt-2">
              {['Booking link', 'Schedule link', 'Pack offer'].map(q => (
                <button key={q} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a conversation
        </div>
      )}
    </div>
  )
}
