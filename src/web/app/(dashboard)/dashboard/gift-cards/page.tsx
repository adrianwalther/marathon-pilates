'use client'

import { useState } from 'react'

const AMOUNTS = [25, 50, 75, 100, 150, 200]

const label = { fontFamily: "'Raleway', sans-serif" as const, fontWeight: 700 as const, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#808282', display: 'block', marginBottom: '0.5rem' }
const input = { width: '100%', fontFamily: "'Poppins', sans-serif" as const, fontWeight: 300 as const, fontSize: '0.88rem', color: '#1a1a1a', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.7rem 0.9rem', background: 'white', outline: 'none', boxSizing: 'border-box' as const }

type Mode = 'buy' | 'redeem'

export default function GiftCardsPage() {
  const [mode, setMode] = useState<Mode>('buy')
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isPhysical, setIsPhysical] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const finalAmount = customAmount ? parseFloat(customAmount) : amount

  const sectionLabel = { fontFamily: "'Raleway', sans-serif" as const, fontWeight: 700 as const, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#808282', marginBottom: '1rem', display: 'block' }

  if (submitted) {
    return (
      <div style={{ padding: '3rem 2.5rem', maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>✓</div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.75rem' }}>Gift Card Sent</h2>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.88rem', color: '#808282', marginBottom: '2rem' }}>
            {recipientEmail ? `A ${formatCurrency(finalAmount)} gift card has been sent to ${recipientEmail}.` : `Your ${formatCurrency(finalAmount)} gift card is ready.`}
          </p>
          <button onClick={() => setSubmitted(false)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 1.75rem', borderRadius: '2px', background: '#87CEBF', color: 'white', border: 'none', cursor: 'pointer' }}>
            Send Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '3rem 2.5rem', maxWidth: '620px' }}>
      <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.5rem' }}>Gift Cards</h1>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282', marginBottom: '2.5rem' }}>Give the gift of movement and restoration.</p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '2.5rem', border: '1px solid #e0e0e0', borderRadius: '2px', overflow: 'hidden', width: 'fit-content' }}>
        {(['buy', 'redeem'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', border: 'none', background: mode === m ? '#1a1a1a' : 'white', color: mode === m ? 'white' : '#808282', cursor: 'pointer' }}>
            {m === 'buy' ? 'Purchase' : 'Redeem Code'}
          </button>
        ))}
      </div>

      {mode === 'redeem' ? (
        <div>
          <span style={sectionLabel}>Enter Gift Card Code</span>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <input
              style={{ ...input, flex: 1 }}
              placeholder="XXXX-XXXX-XXXX"
              value={redeemCode}
              onChange={e => setRedeemCode(e.target.value.toUpperCase())}
            />
            <button
              disabled={!redeemCode.trim()}
              style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', borderRadius: '2px', background: redeemCode.trim() ? '#87CEBF' : '#e0e0e0', color: redeemCode.trim() ? 'white' : '#aaa', border: 'none', cursor: redeemCode.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' as const }}
            >
              Apply
            </button>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#aaa' }}>
            Gift card balance will be applied to your account and can be used toward any booking.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Amount */}
          <div>
            <span style={sectionLabel}>Amount</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustomAmount('') }} style={{ fontFamily: "'Poppins', sans-serif", fontWeight: customAmount ? 300 : (amount === a ? 500 : 300), fontSize: '0.95rem', padding: '0.7rem', borderRadius: '2px', border: `1px solid ${!customAmount && amount === a ? '#87CEBF' : '#e0e0e0'}`, background: !customAmount && amount === a ? '#e8f7f4' : 'white', color: !customAmount && amount === a ? '#87CEBF' : '#1a1a1a', cursor: 'pointer' }}>
                  {formatCurrency(a)}
                </button>
              ))}
            </div>
            <input
              style={input}
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
            />
          </div>

          {/* Delivery */}
          <div>
            <span style={sectionLabel}>Delivery</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[{ v: false, label: 'Digital' }, { v: true, label: 'Physical Card' }].map(opt => (
                <button key={String(opt.v)} onClick={() => setIsPhysical(opt.v)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.55rem 1.25rem', borderRadius: '2px', border: `1px solid ${isPhysical === opt.v ? '#1a1a1a' : '#e0e0e0'}`, background: isPhysical === opt.v ? '#1a1a1a' : 'white', color: isPhysical === opt.v ? 'white' : '#808282', cursor: 'pointer' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {isPhysical && (
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.8rem', color: '#808282', background: '#f9f8f6', padding: '0.75rem 1rem', borderRadius: '2px' }}>
                Physical cards are available for pickup at either studio location.
              </p>
            )}
          </div>

          {/* Recipient */}
          {!isPhysical && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <span style={sectionLabel}>Recipient</span>
              <div>
                <label style={label}>Name</label>
                <input style={input} placeholder="Their name" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              </div>
              <div>
                <label style={label}>Email</label>
                <input style={input} type="email" placeholder="their@email.com" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
              </div>
              <div>
                <label style={label}>Personal Message (optional)</label>
                <textarea
                  style={{ ...input, resize: 'vertical', minHeight: '80px' }}
                  placeholder="Write a note..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Summary + CTA */}
          <div style={{ background: '#f9f8f6', border: '1px solid #e8e8e8', borderRadius: '2px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#808282' }}>Gift Card Value</span>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.95rem', color: '#1a1a1a' }}>{isNaN(finalAmount) || finalAmount <= 0 ? '—' : formatCurrency(finalAmount)}</span>
            </div>
            <button
              onClick={() => setSubmitted(true)}
              disabled={!finalAmount || finalAmount <= 0}
              style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.9rem', borderRadius: '2px', background: finalAmount > 0 ? '#87CEBF' : '#e0e0e0', color: finalAmount > 0 ? 'white' : '#aaa', border: 'none', cursor: finalAmount > 0 ? 'pointer' : 'not-allowed' }}
            >
              {isPhysical ? 'Request Physical Card' : `Send ${finalAmount > 0 ? formatCurrency(finalAmount) : ''} Gift Card`}
            </button>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.72rem', color: '#aaa', textAlign: 'center', marginTop: '0.75rem' }}>
              HSA/FSA accepted · Gift cards never expire
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}
