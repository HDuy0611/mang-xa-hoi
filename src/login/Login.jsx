import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import AuthLeft from '../components/auth/AuthLeft'
import { useAuth } from '../core/AuthContext'
import { useSocialAuth } from '../core/useSocialAuth'

export default function Login() {
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { handleGoogle, handleFacebook, socialError, socialLoading } = useSocialAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AuthLeft />

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 64px', background: 'var(--bg)',
      }}>
        <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.5px' }}>
            Chào mừng trở lại
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 36 }}>
            Đăng nhập vào tài khoản của bạn để tiếp tục.
          </p>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <SocialBtn icon={<GoogleIcon />} label="Tiếp tục với Google" onClick={handleGoogle} disabled={socialLoading} />
            <SocialBtn icon={<FacebookIcon />} label="Tiếp tục với Facebook" onClick={handleFacebook} disabled={socialLoading} />
          </div>

          {socialError && (
            <p style={{ fontSize: 12.5, color: '#f87171', marginBottom: 16, textAlign: 'center' }}>{socialError}</p>
          )}

          <Divider />

          {/* Form */}
          <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField
              icon={<Mail size={16} />}
              placeholder="Nhập email của bạn"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputField
              icon={<Lock size={16} />}
              placeholder="Nhập mật khẩu của bạn"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suffix={
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, marginBottom: 24 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#c1793d', textDecoration: 'none', fontWeight: 500 }}>
              Quên mật khẩu?
            </Link>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#f87171', marginBottom: 16, textAlign: 'center' }}>{error}</p>
          )}

          <GradientBtn label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'} disabled={loading} />
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-2)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#c1793d', textDecoration: 'none', fontWeight: 600 }}>Đăng ký</Link>
          </p>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Gặp sự cố? </span>
            <a href="#" style={{ fontSize: 13, color: '#c1793d', textDecoration: 'none', fontWeight: 500 }}>Liên hệ hỗ trợ</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function SocialBtn({ icon, label, onClick, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '13px 12px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        background: hov ? 'rgba(var(--overlay-rgb),0.06)' : 'rgba(var(--overlay-rgb),0.035)',
        border: '1px solid rgba(var(--overlay-rgb),0.12)',
        color: 'var(--text)', fontSize: 13, fontWeight: 600,
        transition: 'all 0.18s ease',
      }}
    >{icon}{label}</button>
  )
}

function InputField({ icon, placeholder, type = 'text', suffix, value, onChange }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', borderRadius: 12,
      background: focus ? 'rgba(var(--overlay-rgb),0.045)' : 'rgba(var(--overlay-rgb),0.025)',
      border: `1.5px solid ${focus ? 'rgba(193,121,61,0.5)' : 'rgba(var(--overlay-rgb),0.1)'}`,
      boxShadow: focus ? '0 0 0 4px rgba(193,121,61,0.08)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          fontSize: 14, color: 'var(--text)',
        }}
      />
      {suffix}
    </div>
  )
}

function GradientBtn({ label, icon, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '15px', borderRadius: 12, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        background: hov
          ? 'linear-gradient(135deg,#7a4420,#c1793d,#8b4a28)'
          : 'linear-gradient(135deg,#d4a574,#c1793d,#8b4a28)',
        color: '#fff', fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: hov ? '0 6px 24px rgba(212,165,116,0.35)' : '0 4px 16px rgba(212,165,116,0.25)',
        transform: hov ? 'translateY(-1px)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >{icon}{label}</button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '1px' }}>HOẶC</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#1877F2" d="M48 24C48 10.745 37.255 0 24 0S0 10.745 0 24c0 11.979 8.776 21.908 20.25 23.708V30.938h-6.094V24h6.094v-5.288c0-6.013 3.58-9.337 9.065-9.337 2.625 0 5.372.469 5.372.469v5.906h-3.026c-2.981 0-3.911 1.85-3.911 3.75V24h6.656l-1.063 6.938H27.75v16.77C39.224 45.908 48 35.979 48 24z"/>
    </svg>
  )
}
