import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../core/AuthContext'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, user } = useAuth()

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/admin/login', { email, password })
      login(res.data.token, res.data.user)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
      '--bg': '#1C1C1D', '--surface': '#262627', '--surface-2': '#303032',
      '--border': 'rgba(255,255,255,0.09)', '--text': '#F2F2F2', '--text-2': '#A3A3A3',
      '--text-3': '#6E6E6E', '--overlay-rgb': '255,255,255', '--shadow': '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 360, padding: '36px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Đăng nhập Quản trị</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', textAlign: 'center' }}>
            Khu vực dành riêng cho quản trị viên hệ thống.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field icon={<Mail size={16} />} type="text" placeholder="Tài khoản quản trị" value={email} onChange={e => setEmail(e.target.value)} />
          <Field icon={<Lock size={16} />} type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#f87171', marginTop: 14, textAlign: 'center' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', marginTop: 20, padding: '13px', borderRadius: 12, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            background: 'linear-gradient(135deg,#c1793d,#8b4a28)', color: '#fff',
            fontSize: 14, fontWeight: 700,
          }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}

function Field({ icon, type, placeholder, value, onChange }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
      background: 'rgba(var(--overlay-rgb),0.03)',
      border: `1.5px solid ${focus ? 'rgba(193,121,61,0.5)' : 'var(--border)'}`,
      transition: 'border-color 0.2s ease',
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
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)' }}
      />
    </div>
  )
}
