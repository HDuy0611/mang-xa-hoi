import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { AlertTriangle, Lock, X } from 'lucide-react'

const BORDER = 'rgba(var(--overlay-rgb),0.09)'

export default function ModerationModal({ mode, targetLabel, endpoint, initialReason = '', onClose, onDone }) {
  const [reason, setReason] = useState(initialReason)
  const [durationType, setDurationType] = useState('days')
  const [days, setDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const body = mode === 'warn'
        ? { reason: reason.trim() }
        : { reason: reason.trim(), days: durationType === 'permanent' ? null : Math.max(1, parseInt(days, 10) || 1) }
      const res = await axios.patch(endpoint, body)
      onDone(res.data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return createPortal((
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      <div style={{
        position: 'relative', width: '90%', maxWidth: 440, background: 'var(--surface)',
        border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8,
            border: 'none', background: 'rgba(var(--overlay-rgb),0.06)', color: 'var(--text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={15} />
        </button>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'warn' ? <AlertTriangle size={17} color="#d9b48f" /> : <Lock size={17} color="#c0392b" />}
          {mode === 'warn' ? 'Cảnh cáo' : 'Khóa tài khoản'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Đối tượng: {targetLabel}</p>

        {mode === 'lock' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: durationType === 'days' ? 10 : 0 }}>
              <button
                onClick={() => setDurationType('days')}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${durationType === 'days' ? 'transparent' : BORDER}`,
                  background: durationType === 'days' ? 'linear-gradient(135deg,#c1793d,#8b4a28)' : 'var(--surface-2)',
                  color: durationType === 'days' ? '#fff' : 'var(--text-2)',
                }}
              >
                Có thời hạn
              </button>
              <button
                onClick={() => setDurationType('permanent')}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${durationType === 'permanent' ? 'transparent' : BORDER}`,
                  background: durationType === 'permanent' ? 'linear-gradient(135deg,#c0392b,#8b291e)' : 'var(--surface-2)',
                  color: durationType === 'permanent' ? '#fff' : 'var(--text-2)',
                }}
              >
                Vĩnh viễn
              </button>
            </div>

            {durationType === 'days' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={e => setDays(e.target.value)}
                  style={{
                    width: 80, padding: '9px 10px', borderRadius: 9, border: `1px solid ${BORDER}`,
                    background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, outline: 'none',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>ngày</span>
              </div>
            )}
          </div>
        )}

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={mode === 'warn' ? 'Lý do cảnh cáo...' : 'Lý do khóa tài khoản...'}
          rows={3}
          style={{
            width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${BORDER}`,
            background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, resize: 'vertical',
            outline: 'none', fontFamily: 'inherit',
          }}
        />

        {error && <p style={{ fontSize: 12.5, color: '#f87171', marginTop: 8 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', marginTop: 14, padding: '11px 0', borderRadius: 10, border: 'none',
            background: mode === 'warn' ? 'linear-gradient(135deg,#c1793d,#8b4a28)' : 'linear-gradient(135deg,#c0392b,#8b291e)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Đang xử lý...' : mode === 'warn' ? 'Gửi cảnh cáo' : 'Khóa tài khoản'}
        </button>
      </div>
    </div>
  ), document.body)
}
