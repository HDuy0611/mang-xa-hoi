import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Mail, ArrowLeft, Send, ShieldCheck } from 'lucide-react'
import AuthLeft from '../components/auth/AuthLeft'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Vui lòng nhập email.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AuthLeft />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 64px', background: 'var(--bg)',
      }}>
        <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>

          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--text-2)', textDecoration: 'none',
            marginBottom: 36, fontWeight: 500,
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#c1793d'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
          >
            <ArrowLeft size={14} />
            Quay lại <span style={{ color: '#c1793d', marginLeft: 4 }}>Đăng nhập</span>
          </Link>

          {!sent ? (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.5px' }}>
                Quên mật khẩu?
              </h1>
              <div style={{ height: 3, width: 160, background: 'linear-gradient(90deg,#c1793d,#7a4420)', borderRadius: 4, marginBottom: 20 }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 36, lineHeight: 1.6 }}>
                Nhập địa chỉ email liên kết với tài khoản của bạn.
              </p>

              <InputField icon={<Mail size={16} />} placeholder="Nhập email của bạn" type="email" value={email} onChange={e => setEmail(e.target.value)} />

              {error && (
                <p style={{ fontSize: 13, color: '#f87171', marginTop: 14 }}>{error}</p>
              )}

              <div style={{ marginTop: 20 }}>
                <GradientBtn label={loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'} icon={<Send size={16} />} onClick={handleSubmit} disabled={loading} />
              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                marginTop: 24, padding: '14px 16px', borderRadius: 12,
                background: 'rgba(212,165,116,0.05)',
                border: '1px solid rgba(212,165,116,0.12)',
              }}>
                <ShieldCheck size={18} color="#c1793d" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.<br />
                  Hãy kiểm tra hộp thư đến và cả thư mục spam.
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                background: 'linear-gradient(135deg,#d4a574,#c1793d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(212,165,116,0.3)',
              }}>
                <Send size={28} color="#fff" />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>Đã gửi yêu cầu!</h2>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 32 }}>
                Nếu email này tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi.<br />Đừng quên kiểm tra thư mục spam.
              </p>
              <Link to="/login" style={{
                display: 'inline-block', padding: '13px 32px', borderRadius: 12,
                background: 'linear-gradient(135deg,#d4a574,#c1793d)',
                color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14,
              }}>Quay lại đăng nhập</Link>
            </div>
          )}

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Gặp sự cố? </span>
            <a href="#" style={{ fontSize: 13, color: '#c1793d', textDecoration: 'none', fontWeight: 500 }}>Liên hệ hỗ trợ</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function InputField({ icon, placeholder, type = 'text', value, onChange }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
      background: focus ? 'rgba(var(--overlay-rgb),0.045)' : 'rgba(var(--overlay-rgb),0.025)',
      border: `1.5px solid ${focus ? 'rgba(193,121,61,0.5)' : 'rgba(var(--overlay-rgb),0.1)'}`,
      boxShadow: focus ? '0 0 0 4px rgba(193,121,61,0.08)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{icon}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)' }}
      />
    </div>
  )
}

function GradientBtn({ label, icon, onClick, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      width: '100%', padding: '15px', borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      background: hov ? 'linear-gradient(135deg,#7a4420,#c1793d,#8b4a28)' : 'linear-gradient(135deg,#d4a574,#c1793d,#8b4a28)',
      color: '#fff', fontSize: 15, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: hov ? '0 6px 24px rgba(212,165,116,0.35)' : '0 4px 16px rgba(212,165,116,0.25)',
      transform: hov ? 'translateY(-1px)' : 'none', transition: 'all 0.2s ease',
    }}>{icon}{label}</button>
  )
}
