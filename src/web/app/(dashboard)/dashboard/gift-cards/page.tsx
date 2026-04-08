'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const AMOUNTS = [25, 50, 75, 100, 150, 200]

const label = { fontFamily: "'Raleway', sans-serif" as const, fontWeight: 700 as const, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#808282', display: 'block', marginBottom: '0.5rem' }
const input = { width: '100%', fontFamily: "'Poppins', sans-serif" as const, fontWeight: 300 as const, fontSize: '0.88rem', color: '#1a1a1a', border: '1px solid #e0e0e0', borderRadius: '2px', padding: '0.7rem 0.9rem', background: 'white', outline: 'none', boxSizing: 'border-box' as const }

type Mode = 'buy' | 'redeem'
type RedeemResult = { status: 'valid'; balance: number; code: string } | { status: 'redeemed' } | { status: 'notfound' } | null
type PurchaseResult = { code: string; amount: number } | null

function GiftCardsPageInner() { // eslint-disable-line
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>('buy')
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isPhysical, setIsPhysical] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult>(null)
  const [redeemResult, setRedeemResult] = useState<RedeemResult>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)

  // Handle Stripe redirect after payment
  useEffect(() => {
    const giftSuccess = searchParams.get('gift_success')
    const stripeSession = searchParams.get('stripe_session')
    if (giftSuccess === 'true' && stripeSession) {
      fetch('/api/gift-card/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_session_id: stripeSession }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.code) setPurchaseResult({ code: data.code, amount: data.amount })
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyCode = async () => {
    if (!redeemCode.trim()) return
    setRedeemLoading(true)
    setRedeemResult(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('gift_cards')
      .select('id, code, current_balance, redeemed_at')
      .eq('code', redeemCode.trim().toUpperCase())
      .single()

    if (!data) {
      setRedeemResult({ status: 'notfound' })
    } else if (data.redeemed_at || data.current_balance <= 0) {
      setRedeemResult({ status: 'redeemed' })
    } else {
      setRedeemResult({ status: 'valid', balance: data.current_balance, code: data.code })
    }
    setRedeemLoading(false)
  }

  const finalAmount = customAmount ? parseFloat(customAmount) : amount

  const sectionLabel = { fontFamily: "'Raleway', sans-serif" as const, fontWeight: 700 as const, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#808282', marginBottom: '1rem', display: 'block' }

  const handlePurchase = async () => {
    setCheckoutLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCheckoutLoading(false); return }

    const { data: { session: authSession } } = await supabase.auth.getSession()
    const res = await fetch('/api/checkout/gift-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authSession ? `Bearer ${authSession.access_token}` : '' },
      body: JSON.stringify({
        amount: finalAmount,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        message,
        is_physical: isPhysical,
        user_id: user.id,
      }),
    })
    const { url, error } = await res.json()
    if (error || !url) { setCheckoutLoading(false); return }
    window.location.href = url
  }

  if (purchaseResult) {
    return (
      <div style={{ padding: '3rem 2.5rem', maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>✓</div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.75rem' }}>Gift Card Ready</h2>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.88rem', color: '#808282', marginBottom: '1.5rem' }}>
            {formatCurrency(purchaseResult.amount)} gift card
          </p>
          <div style={{ background: '#1a1a1a', borderRadius: '2px', padding: '1.5rem 2rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#808282', marginBottom: '0.5rem' }}>Gift Card Code</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.12em', color: '#87CEBF' }}>{purchaseResult.code}</p>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa', marginBottom: '2rem' }}>
            {recipientEmail ? `A confirmation has been sent to ${recipientEmail}.` : 'Share this code with the recipient.'}
          </p>
          <button onClick={() => setPurchaseResult(null)} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 1.75rem', borderRadius: '2px', background: '#87CEBF', color: 'white', border: 'none', cursor: 'pointer' }}>
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
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              style={{ ...input, flex: 1, letterSpacing: '0.06em' }}
              placeholder="XXXX-XXXX-XXXX"
              value={redeemCode}
              onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemResult(null) }}
            />
            <button
              disabled={!redeemCode.trim() || redeemLoading}
              onClick={applyCode}
              style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.7rem 1.5rem', borderRadius: '2px', background: redeemCode.trim() ? '#87CEBF' : '#e0e0e0', color: redeemCode.trim() ? 'white' : '#aaa', border: 'none', cursor: redeemCode.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' as const }}
            >
              {redeemLoading ? '...' : 'Apply'}
            </button>
          </div>

          {redeemResult?.status === 'valid' && (
            <div style={{ background: '#e8f7f4', border: '1px solid #87CEBF', borderRadius: '2px', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#87CEBF', marginBottom: '0.3rem' }}>Valid Gift Card</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 100, fontSize: '1.8rem', color: '#1a1a1a', lineHeight: 1, marginBottom: '0.3rem' }}>{formatCurrency(redeemResult.balance)}</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#808282' }}>Balance available · will be applied at checkout</p>
            </div>
          )}
          {redeemResult?.status === 'redeemed' && (
            <div style={{ background: '#fef0f0', border: '1px solid #e05555', borderRadius: '2px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#e05555' }}>This gift card has already been redeemed or has no remaining balance.</p>
            </div>
          )}
          {redeemResult?.status === 'notfound' && (
            <div style={{ background: '#fef0f0', border: '1px solid #e05555', borderRadius: '2px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.82rem', color: '#e05555' }}>Gift card code not found. Please check the code and try again.</p>
            </div>
          )}

          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.78rem', color: '#aaa' }}>
            Gift card balance will be applied at your next checkout.
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
              onClick={handlePurchase}
              disabled={!finalAmount || finalAmount <= 0 || checkoutLoading}
              style={{ width: '100%', fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.9rem', borderRadius: '2px', background: finalAmount > 0 ? '#87CEBF' : '#e0e0e0', color: finalAmount > 0 ? 'white' : '#aaa', border: 'none', cursor: finalAmount > 0 ? 'pointer' : 'not-allowed' }}
            >
              {checkoutLoading ? 'Redirecting...' : isPhysical ? 'Request Physical Card' : `Purchase ${finalAmount > 0 ? formatCurrency(finalAmount) : ''} Gift Card`}
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

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem 2.5rem' }}><p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: '0.85rem', color: '#aaa' }}>Loading...</p></div>}>
      <GiftCardsPageInner />
    </Suspense>
  )
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}
