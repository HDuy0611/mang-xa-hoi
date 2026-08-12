import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import AuthLeft from '../components/auth/AuthLeft'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [showPw, setShowPw] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirm) {
      setError('Xác nhận mật khẩu không khớp.')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, newPassword: password })
      setDone(true)
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
          }}>
            <ArrowLeft size={14} />
            Quay lại <span style={{ color: '#c1793d', marginLeft: 4 }}>Đăng nhập</span>
          </Link>

          {!done ? (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.5px' }}>
                Đặt lại mật khẩu
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 36 }}>
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              {!token && (
                <p style={{ fontSize: 13, color: '#f87171', marginBottom: 20 }}>
                  Không tìm thấy token đặt lại mật khẩu trong đường dẫn. Hãy dùng liên kết trong email bạn nhận được.
                </p>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <InputField
                    icon={<Lock size={16} />}
                    placeholder="Mật khẩu mới"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    suffix={
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <InputField
                    icon={<Lock size={16} />}
                    placeholder="Xác nhận mật khẩu mới"
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: '#f87171', marginTop: 16, marginBottom: 8 }}>{error}</p>
                )}

                <div style={{ marginTop: 20 }}>
                  <GradientBtn label={loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'} disabled={loading} />
                </div>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                background: 'linear-gradient(135deg,#d4a574,#c1793d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(212,165,116,0.3)',
              }}>
                <CheckCircle2 size={28} color="#fff" />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>Đặt lại mật khẩu thành công!</h2>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 32 }}>
                Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
              </p>
              <button onClick={() => navigate('/login')} style={{
                display: 'inline-block', padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#d4a574,#c1793d)',
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}>Đăng nhập ngay</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InputField({ icon, placeholder, type = 'text', suffix, value, onChange }) {
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
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)' }}
      />
      {suffix}
    </div>
  )
}

function GradientBtn({ label, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="submit" disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      width: '100%', padding: '15px', borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      background: hov ? 'linear-gradient(135deg,#7a4420,#c1793d,#8b4a28)' : 'linear-gradient(135deg,#d4a574,#c1793d,#8b4a28)',
      color: '#fff', fontSize: 15, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: hov ? '0 6px 24px rgba(212,165,116,0.35)' : '0 4px 16px rgba(212,165,116,0.25)',
      transform: hov ? 'translateY(-1px)' : 'none', transition: 'all 0.2s ease',
    }}>{label}</button>
  )
}
