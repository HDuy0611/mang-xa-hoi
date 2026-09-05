import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { User, Lock, Bell, Palette, ShieldAlert, Camera, LogOut } from 'lucide-react'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import { useAuth } from '../core/AuthContext'
import { useTheme } from '../core/ThemeContext'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.09)'

const sections = [
  { key: 'account', label: 'Tài khoản', icon: User },
  { key: 'privacy', label: 'Quyền riêng tư', icon: Lock },
  { key: 'notifications', label: 'Thông báo', icon: Bell },
  { key: 'appearance', label: 'Giao diện', icon: Palette },
  { key: 'danger', label: 'Vô hiệu hóa & Xóa', icon: ShieldAlert },
  { key: 'logout', label: 'Đăng xuất', icon: LogOut },
]

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 38, height: 21, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
      background: on ? 'linear-gradient(145deg,#c1793d,#8b4a28)' : 'rgba(var(--overlay-rgb),0.15)',
      position: 'relative', transition: 'background 0.3s ease',
      boxShadow: on ? '0 2px 8px rgba(193,121,61,0.4)' : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 20 : 3,
        width: 15, height: 15, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

function ToggleRow({ label, desc, on, onClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</p>
        {desc && <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>{desc}</p>}
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  )
}

function Field({ label, value, onChange, textarea, disabled, type = 'text' }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>{label}</label>
      <Tag
        type={textarea ? undefined : type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={textarea ? 3 : undefined}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 11,
          background: 'rgba(var(--overlay-rgb),0.03)', border: '1.5px solid rgba(var(--overlay-rgb),0.12)',
          color: 'var(--text)', fontSize: 13.5, outline: 'none', resize: textarea ? 'vertical' : 'none',
          fontFamily: 'inherit', opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  )
}

function SaveBtn({ label = 'Lưu thay đổi', onClick, disabled }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '11px 24px', borderRadius: 11, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        fontSize: 14, fontWeight: 700, color: '#fff',
        background: hov && !disabled ? 'linear-gradient(145deg,#6b3820,#6b3820)' : 'linear-gradient(145deg,#c1793d,#8b4a28)',
        boxShadow: '0 4px 16px rgba(193,121,61,0.35)',
        transition: 'all 0.18s ease',
      }}
    >
      {label}
    </button>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError('')
    setSuccess('')

    if (next.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (next !== confirm) {
      setError('Xác nhận mật khẩu mới không khớp.')
      return
    }

    setSaving(true)
    try {
      await axios.put('/api/users/me/password', { currentPassword: current, newPassword: next })
      setSuccess('Đổi mật khẩu thành công.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Đổi mật khẩu</h3>

      <Field label="Mật khẩu hiện tại" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
      <Field label="Mật khẩu mới" type="password" value={next} onChange={e => setNext(e.target.value)} />
      <Field label="Xác nhận mật khẩu mới" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />

      {error && <p style={{ fontSize: 13, color: '#f87171', marginBottom: 14 }}>{error}</p>}
      {success && <p style={{ fontSize: 13, color: '#89a86a', marginBottom: 14 }}>{success}</p>}

      <SaveBtn label={saving ? 'Đang lưu...' : 'Đổi mật khẩu'} onClick={handleSubmit} disabled={saving || !current || !next || !confirm} />
    </div>
  )
}

function AccountSection() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', bio: '', location: '', website: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
    })
  }, [user?.id, user?.name, user?.bio, user?.location, user?.website])

  function handleChange(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await axios.put('/api/users/me', form)
      updateUser(res.data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await axios.post('/api/users/me/avatar', formData)
      updateUser({ avatarUrl: res.data.avatarUrl })
    } catch (err) {
      setError(err.response?.data?.message || 'Tải ảnh đại diện thất bại.')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append('cover', file)
      const res = await axios.post('/api/users/me/cover', formData)
      updateUser({ coverUrl: res.data.coverUrl })
    } catch (err) {
      setError(err.response?.data?.message || 'Tải ảnh bìa thất bại.')
    } finally {
      setCoverUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Tài khoản</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Avatar user={user} size={72} />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', border: '2px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Camera size={12} color="#fff" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ảnh đại diện</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
            {avatarUploading ? 'Đang tải lên...' : 'PNG, JPG tối đa 5MB'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div
          onClick={() => coverInputRef.current?.click()}
          style={{
            width: 72, height: 48, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
            border: '1.5px dashed rgba(212,165,116,0.35)',
            backgroundImage: user?.coverUrl ? `url(${user.coverUrl})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {!user?.coverUrl && <Camera size={16} color="#d4a574" />}
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ảnh bìa</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
            {coverUploading ? 'Đang tải lên...' : 'Nhấn vào ô để đổi ảnh bìa trang cá nhân'}
          </p>
        </div>
      </div>

      <Field label="Họ và tên" value={form.name} onChange={handleChange('name')} />
      <Field label="Tên người dùng" value={user?.username || ''} disabled />
      <Field label="Email" value={user?.email || ''} disabled />
      <Field label="Tiểu sử" value={form.bio} onChange={handleChange('bio')} textarea />
      <Field label="Địa chỉ" value={form.location} onChange={handleChange('location')} />
      <Field label="Website" value={form.website} onChange={handleChange('website')} />

      {error && <p style={{ fontSize: 13, color: '#f87171', marginBottom: 14 }}>{error}</p>}
      {saved && <p style={{ fontSize: 13, color: '#89a86a', marginBottom: 14 }}>Đã lưu thay đổi.</p>}

      <SaveBtn label={saving ? 'Đang lưu...' : 'Lưu thay đổi'} onClick={handleSave} disabled={saving} />

      <PasswordSection />
    </>
  )
}

function SettingsLoading() {
  return <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '20px 0' }}>Đang tải...</p>
}

function PrivacySection({ settings, onChange }) {
  if (!settings) return <SettingsLoading />
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Quyền riêng tư</h2>
      <ToggleRow label="Tài khoản riêng tư" desc="Chỉ những người theo dõi được chấp thuận mới có thể xem bài viết của bạn" on={settings.isPrivate} onClick={() => onChange('isPrivate', !settings.isPrivate)} />
      <ToggleRow label="Hiển thị trạng thái hoạt động" desc="Cho phép người khác biết khi bạn đang hoạt động" on={settings.showOnlineStatus} onClick={() => onChange('showOnlineStatus', !settings.showOnlineStatus)} />
      <ToggleRow label="Hiển thị hoạt động của bạn" desc="Hiển thị lượt thích và bình luận của bạn cho người khác" on={settings.showActivity} onClick={() => onChange('showActivity', !settings.showActivity)} />
    </>
  )
}

function NotificationsSection({ settings, onChange }) {
  if (!settings) return <SettingsLoading />
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Thông báo</h2>
      <ToggleRow label="Thông báo đẩy" desc="Nhận thông báo trên thiết bị này" on={settings.notifyPush} onClick={() => onChange('notifyPush', !settings.notifyPush)} />
      <ToggleRow label="Thông báo qua email" desc="Nhận cập nhật qua email" on={settings.notifyEmail} onClick={() => onChange('notifyEmail', !settings.notifyEmail)} />
      <ToggleRow label="Thông báo qua SMS" desc="Nhận cập nhật qua tin nhắn văn bản" on={settings.notifySms} onClick={() => onChange('notifySms', !settings.notifySms)} />
    </>
  )
}

function AppearanceSection({ settings, onChange }) {
  const { setTheme } = useTheme()
  if (!settings) return <SettingsLoading />

  function toggleTheme() {
    const next = settings.theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    onChange('theme', next)
  }

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Giao diện</h2>
      <ToggleRow
        label="Chế độ tối"
        desc="Đổi giao diện SUNSET sang nền đen, áp dụng ngay và nhớ cho lần đăng nhập sau"
        on={settings.theme === 'dark'}
        onClick={toggleTheme}
      />
    </>
  )
}

function DangerSection() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDeactivate() {
    if (!window.confirm('Vô hiệu hóa tài khoản? Bạn có thể khôi phục bằng cách đăng nhập lại.')) return
    setBusy(true)
    setError('')
    try {
      await axios.post('/api/users/me/deactivate')
      logout()
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Xóa vĩnh viễn tài khoản? Toàn bộ bài viết, bình luận, bạn bè và dữ liệu liên quan sẽ mất và KHÔNG thể khôi phục.')) return
    setBusy(true)
    setError('')
    try {
      await axios.delete('/api/users/me')
      logout()
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      setBusy(false)
    }
  }

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Vô hiệu hóa & Xóa</h2>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 12, border: '1px solid rgba(var(--overlay-rgb),0.1)', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Vô hiệu hóa tài khoản</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>Tạm thời vô hiệu hóa tài khoản của bạn, khôi phục bằng cách đăng nhập lại</p>
        </div>
        <button onClick={handleDeactivate} disabled={busy} style={{
          padding: '9px 18px', borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
          color: 'var(--text-2)', background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.15)',
          opacity: busy ? 0.6 : 1,
        }}>Vô hiệu hóa</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 12, border: '1px solid rgba(244,63,94,0.25)' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>Xóa tài khoản</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn</p>
        </div>
        <button onClick={handleDelete} disabled={busy} style={{
          padding: '9px 18px', borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
          color: '#fff', background: '#dc2626', border: 'none', opacity: busy ? 0.6 : 1,
        }}>Xóa</button>
      </div>

      {error && <p style={{ fontSize: 13, color: '#f87171', marginTop: 14 }}>{error}</p>}
    </>
  )
}

function LogoutSection() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Đăng xuất</h2>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 12, border: '1px solid rgba(var(--overlay-rgb),0.1)' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Đăng xuất khỏi tài khoản</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            color: '#fff', background: '#dc2626', border: 'none',
          }}
        >Đăng xuất</button>
      </div>
    </>
  )
}

const sectionComponents = {
  account: AccountSection,
  privacy: PrivacySection,
  notifications: NotificationsSection,
  appearance: AppearanceSection,
  danger: DangerSection,
  logout: LogoutSection,
}

export default function Settings() {
  const [active, setActive] = useState('account')
  const [settings, setSettings] = useState(null)
  const ActiveSection = sectionComponents[active]

  useEffect(() => {
    axios.get('/api/settings').then(res => setSettings(res.data.settings))
  }, [])

  function updateSetting(key, value) {
    setSettings(s => {
      const next = { ...s, [key]: value }
      axios.put('/api/settings', next).catch(() => {})
      return next
    })
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>

        <div style={{ width: '100%', maxWidth: 920, display: 'flex', padding: '20px 24px', gap: 20, alignItems: 'flex-start', minWidth: 0 }}>
          {/* In-page nav */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sections.map(({ key, label, icon: Icon }) => {
              const isActive = active === key
              const isDangerLike = key === 'danger' || key === 'logout'
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12, width: '100%',
                    border: 'none', cursor: 'pointer', fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isDangerLike && isActive ? '#dc2626' : isActive ? '#6b3820' : 'var(--text-2)',
                    background: isActive
                      ? isDangerLike ? 'rgba(220,38,38,0.1)' : 'linear-gradient(135deg, rgba(193,121,61,0.16), rgba(139,74,40,0.1))'
                      : 'transparent',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Icon size={17} color={isDangerLike ? '#dc2626' : isActive ? '#6b3820' : 'currentColor'} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 28px', maxWidth: 640 }}>
            <ActiveSection settings={settings} onChange={updateSetting} />
          </div>
        </div>
      </div>
    </div>
  )
}
