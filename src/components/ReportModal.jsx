import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Flag, X } from 'lucide-react'

const BORDER = 'rgba(var(--overlay-rgb),0.09)'

export default function ReportModal({ targetType, targetId, targetLabel, onClose }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do báo cáo.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await axios.post('/api/reports', { targetType, targetId, reason: reason.trim() })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal((
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      <div style={{
        position: 'relative', width: '90%', maxWidth: 420, background: 'var(--surface)',
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

        {done ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Flag size={26} color="#d4a574" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>Đã gửi báo cáo</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Cảm ơn bạn đã giúp cộng đồng an toàn hơn.</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Báo cáo {targetType === 'user' ? 'người dùng' : 'bài viết'}
            </h3>
            {targetLabel && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>{targetLabel}</p>
            )}

            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Mô tả lý do bạn báo cáo..."
              rows={4}
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
                background: 'linear-gradient(135deg,#c1793d,#8b4a28)', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </>
        )}
      </div>
    </div>
  ), document.body)
}
