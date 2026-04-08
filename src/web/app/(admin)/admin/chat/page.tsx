'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const TEAL = '#87CEBF'

type Conversation = {
  id: string
  client_id: string
  assigned_to: string | null
  status: 'open' | 'closed'
  last_message_at: string | null
  unread_count: number
  created_at: string
  client: { first_name: string; last_name: string; email: string } | null
  last_message?: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
  sender: { first_name: string; last_name: string; role: string } | null
}

type StaffMember = { id: string; first_name: string; last_name: string }

const QUICK_REPLIES = [
  { label: 'Booking link', text: 'You can book your next class here: [booking link]' },
  { label: 'Schedule link', text: 'Check the full schedule here: [schedule link]' },
  { label: 'Pack offer', text: "We'd love to have you back! Ask us about our current class pack options." },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ChatPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin')
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile) setCurrentUserRole(profile.role)
      }
      loadConversations()
      loadStaff()
    }
    init()
  }, [])

  async function loadStaff() {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('role', ['admin', 'manager', 'instructor', 'front_desk'])
      .order('first_name')
    setStaff((data as StaffMember[]) || [])
  }

  async function loadConversations() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_conversations')
      .select('*, client:profiles!client_id(first_name, last_name, email)')
      .order('last_message_at', { ascending: false, nullsFirst: false })
    if (data) {
      // Fetch last message for each conversation
      const convos = data as Conversation[]
      const ids = convos.map(c => c.id)
      if (ids.length > 0) {
        const { data: lastMsgs } = await supabase
          .from('chat_messages')
          .select('conversation_id, body, created_at')
          .in('conversation_id', ids)
          .order('created_at', { ascending: false })

        const lastMap: Record<string, string> = {}
        lastMsgs?.forEach(m => {
          if (!lastMap[m.conversation_id]) lastMap[m.conversation_id] = m.body
        })
        setConversations(convos.map(c => ({ ...c, last_message: lastMap[c.id] || '' })))
      } else {
        setConversations(convos)
      }
    }
    setLoading(false)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, sender:profiles!sender_id(first_name, last_name, role)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
    // Mark unread as read
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
    // Reset unread count
    await supabase
      .from('chat_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId)
    loadConversations()
  }

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.conversation_id === selectedId) {
          loadMessages(selectedId)
        }
        loadConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  async function sendMessage(body: string) {
    if (!body.trim() || !selectedId || !currentUserId) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      conversation_id: selectedId,
      sender_id: currentUserId,
      body: body.trim(),
    })
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedId)
    setMessageText('')
    setSending(false)
    loadMessages(selectedId)
  }

  async function closeConversation(id: string) {
    await supabase.from('chat_conversations').update({ status: 'closed' }).eq('id', id)
    if (selectedId === id) setSelectedId(null)
    loadConversations()
  }

  async function assignConversation(id: string, staffId: string) {
    await supabase.from('chat_conversations').update({ assigned_to: staffId || null }).eq('id', id)
    loadConversations()
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const name = `${c.client?.first_name} ${c.client?.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase()) || c.client?.email.toLowerCase().includes(search.toLowerCase())
  })

  const open = filtered.filter(c => c.status === 'open')
  const closed = filtered.filter(c => c.status === 'closed')
  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)
  const selected = conversations.find(c => c.id === selectedId) || null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 4rem)', fontFamily: 'Poppins, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1a1a1a', margin: 0 }}>Messages</p>
            {totalUnread > 0 && (
              <span style={{ background: TEAL, color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>{totalUnread}</span>
            )}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{ width: '100%', background: '#f9f8f6', border: 'none', borderRadius: 4, padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#4b5563', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>Loading...</div>
          ) : open.length === 0 && closed.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>No conversations yet.</div>
          ) : (
            <>
              {open.map(convo => (
                <div
                  key={convo.id}
                  onClick={() => setSelectedId(convo.id)}
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f9f8f6',
                    background: selectedId === convo.id ? '#f9f8f6' : '#fff',
                    borderLeft: selectedId === convo.id ? `3px solid ${TEAL}` : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                      {convo.client?.first_name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {convo.client ? `${convo.client.first_name} ${convo.client.last_name}` : 'Unknown'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                          {convo.last_message_at && <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{formatTime(convo.last_message_at)}</span>}
                          {(convo.unread_count || 0) > 0 && (
                            <span style={{ background: TEAL, color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{convo.unread_count}</span>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.1rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {convo.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {closed.length > 0 && (
                <>
                  <div style={{ padding: '0.5rem 1rem', background: '#f9f8f6', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: 0 }}>Closed</p>
                  </div>
                  {closed.map(convo => (
                    <div
                      key={convo.id}
                      onClick={() => setSelectedId(convo.id)}
                      style={{ padding: '0.875rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f9f8f6', background: selectedId === convo.id ? '#f9f8f6' : '#fff', opacity: 0.6 }}
                    >
                      <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0 }}>
                        {convo.client ? `${convo.client.first_name} ${convo.client.last_name}` : 'Unknown'}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.5rem', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                {selected.client?.first_name?.charAt(0) || '?'}
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>
                  {selected.client ? `${selected.client.first_name} ${selected.client.last_name}` : 'Unknown'}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>{selected.client?.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={selected.assigned_to || ''}
                onChange={e => assignConversation(selected.id, e.target.value)}
                style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: '#4b5563', outline: 'none' }}
              >
                <option value=''>Unassigned</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
              {selected.status === 'open' && (
                <button
                  onClick={() => closeConversation(selected.id)}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '0.3rem 0.75rem', fontSize: '0.72rem', background: '#fff', color: '#6b7280', cursor: 'pointer' }}
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9f8f6', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '2rem' }}>No messages yet. Say hello!</div>
            ) : messages.map(msg => {
              const isStaff = msg.sender?.role !== 'client'
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isStaff ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: isStaff ? 'flex-end' : 'flex-start' }}>
                    {!isStaff && msg.sender && (
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', paddingLeft: 4 }}>{msg.sender.first_name}</span>
                    )}
                    <div style={{
                      padding: '0.6rem 0.875rem',
                      borderRadius: isStaff ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: isStaff ? TEAL : '#fff',
                      color: isStaff ? '#fff' : '#1a1a1a',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      boxShadow: isStaff ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                    }}>
                      {msg.body}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', paddingLeft: 4, paddingRight: 4 }}>{formatMsgTime(msg.created_at)}</span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.875rem 1.5rem', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(messageText) } }}
                placeholder="Type a message..."
                rows={2}
                style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.875rem', fontSize: '0.875rem', resize: 'none', outline: 'none', fontFamily: 'Poppins, sans-serif' }}
              />
              <button
                onClick={() => sendMessage(messageText)}
                disabled={sending || !messageText.trim()}
                style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, opacity: !messageText.trim() ? 0.5 : 1 }}
              >
                Send
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {QUICK_REPLIES.map(q => (
                <button
                  key={q.label}
                  onClick={() => setMessageText(q.text)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 4, padding: '0.25rem 0.65rem', fontSize: '0.72rem', color: '#6b7280', cursor: 'pointer' }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          Select a conversation
        </div>
      )}
    </div>
  )
}
