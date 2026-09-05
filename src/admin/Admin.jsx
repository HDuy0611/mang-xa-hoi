import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Users, FileText, MessageSquare, Lock, Search, Trash2, Unlock, ChevronLeft, ChevronRight, Flag, AlertTriangle, X, LayoutGrid, ShieldCheck, Eye, Palette, LogOut } from 'lucide-react'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import { useAuth } from '../core/AuthContext'
import { useTheme } from '../core/ThemeContext'
import { timeAgo } from '../core/posts'
import ModerationModal from './ModerationModal'

const REPORT_STATUS_LABELS = {
  pending: 'Chờ xử lý',
  resolved: 'Đã xử lý',
  dismissed: 'Đã bỏ qua',
}

const NAV_ITEMS = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutGrid },
  { key: 'users', label: 'Người dùng', icon: Users },
  { key: 'posts', label: 'Bài viết', icon: FileText },
  { key: 'reports', label: 'Báo cáo', icon: Flag },
  { key: 'appearance', label: 'Giao diện', icon: Palette },
]

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '16px 0 4px' }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8,
          border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-2)',
          cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1,
        }}
      >
        <ChevronLeft size={15} />
      </button>
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Trang {page} / {totalPages}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8,
          border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-2)',
          cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1,
        }}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

const STAT_TONES = {
  accent:  { bg: 'linear-gradient(135deg,#c1793d,#8b4a28)', text: 'var(--text-3)' },
  ok:      { bg: 'linear-gradient(135deg,#5cb98a,#2e8b57)', text: '#2e8b57' },
  warning: { bg: 'linear-gradient(135deg,#e2b169,#c1793d)', text: '#c1793d' },
  danger:  { bg: 'linear-gradient(135deg,#e0685a,#c0392b)', text: '#c0392b' },
}

function StatCard({ icon: Icon, label, value, tone = 'accent', hint, onClick }) {
  const t = STAT_TONES[tone]
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: t.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, fontWeight: 600, color: t.text, marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', maxWidth: 320 }}>
      <Search size={15} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--surface-2)',
          color: 'var(--text)', fontSize: 13.5, outline: 'none',
        }}
      />
    </div>
  )
}

function ActionButton({ icon, label, color, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-2)',
        background: 'var(--surface-2)', color,
        fontSize: 12.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function UsersTab() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lockTarget, setLockTarget] = useState(null)

  const load = useCallback((q, p) => {
    setLoading(true)
    axios.get('/api/admin/users', { params: { ...(q ? { search: q } : {}), page: p } })
      .then(res => {
        setUsers(res.data.users)
        setTotalPages(res.data.totalPages)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    const timer = setTimeout(() => load(search, page), 300)
    return () => clearTimeout(timer)
  }, [search, page, load])

  async function handleUnlock(u) {
    setBusyId(u.id)
    try {
      await axios.patch(`/api/admin/users/${u.id}/unlock`)
      setUsers(list => list.map(x => x.id === u.id ? { ...x, isLocked: false, lockedUntil: null } : x))
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally {
      setBusyId(null)
    }
  }

  function handleLockDone() {
    setLockTarget(null)
    load(search, page)
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, username, email..." />
      </div>

      {loading && <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Đang tải...</p>}

      {!loading && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {users.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px', textAlign: 'center' }}>Không tìm thấy người dùng nào.</p>
          )}
          {users.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar user={u} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.name}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>@{u.username}</span>
                    {u.role === 'admin' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8b4a28', background: 'rgba(193,121,61,0.15)', padding: '2px 8px', borderRadius: 999 }}>ADMIN</span>
                    )}
                    {!!u.isLocked && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#c0392b', background: 'rgba(192,57,43,0.12)', padding: '2px 8px', borderRadius: 999 }}>
                        {u.lockedUntil ? `KHÓA ĐẾN ${new Date(u.lockedUntil).toLocaleDateString('vi-VN')}` : 'KHÓA VĨNH VIỄN'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{u.email} · tham gia {timeAgo(u.createdAt)}</div>
                </div>
              </div>

              {u.id !== me?.id && u.role !== 'admin' && (
                <button
                  onClick={() => u.isLocked ? handleUnlock(u) : setLockTarget(u)}
                  disabled={busyId === u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-2)',
                    background: 'var(--surface-2)', color: u.isLocked ? '#2e8b57' : '#c0392b',
                    fontSize: 12.5, fontWeight: 600, cursor: busyId === u.id ? 'default' : 'pointer',
                    opacity: busyId === u.id ? 0.6 : 1,
                  }}
                >
                  {u.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                  {u.isLocked ? 'Mở khóa' : 'Khóa'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {lockTarget && (
        <ModerationModal
          mode="lock"
          targetLabel={`@${lockTarget.username}`}
          endpoint={`/api/admin/users/${lockTarget.id}/lock`}
          onClose={() => setLockTarget(null)}
          onDone={handleLockDone}
        />
      )}
    </div>
  )
}

function PostsTab() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback((q, p) => {
    setLoading(true)
    axios.get('/api/admin/posts', { params: { ...(q ? { search: q } : {}), page: p } })
      .then(res => {
        setPosts(res.data.posts)
        setTotalPages(res.data.totalPages)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    const timer = setTimeout(() => load(search, page), 300)
    return () => clearTimeout(timer)
  }, [search, page, load])

  async function handleDelete(id) {
    if (!confirm('Xóa bài viết này? Hành động không thể hoàn tác.')) return
    await axios.delete(`/api/admin/posts/${id}`)
    setPosts(list => list.filter(p => p.id !== id))
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo nội dung, tác giả..." />
      </div>

      {loading && <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Đang tải...</p>}

      {!loading && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {posts.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px', textAlign: 'center' }}>Không tìm thấy bài viết nào.</p>
          )}
          {posts.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt=""
                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-2)' }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{p.authorName}</span> · @{p.authorUsername} · {timeAgo(p.createdAt)} · {p.likes} lượt thích · {p.comments} bình luận
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text)', marginTop: 4, maxWidth: 560, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.content}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a
                  href={`/profile/${p.authorUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-2)',
                    background: 'var(--surface-2)', color: 'var(--text-2)',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                  }}
                >
                  <Eye size={13} />
                  Xem
                </a>
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-2)',
                    background: 'var(--surface-2)', color: '#c0392b',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    axios.get('/api/admin/reports', { params: { page, ...(status ? { status } : {}) } })
      .then(res => {
        setReports(res.data.reports)
        setTotalPages(res.data.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page, status])

  useEffect(() => { setPage(1) }, [status])
  useEffect(() => { load() }, [load])

  function markResolved(reportId, newStatus) {
    setReports(list => list.map(r => r.id === reportId ? { ...r, status: newStatus } : r))
  }

  function handleModalDone(message) {
    markResolved(modal.report.id, 'resolved')
    setModal(null)
    if (message) alert(message)
  }

  function targetLabelFor(r) {
    return r.targetType === 'user' ? `@${r.targetUsername}` : `bài viết của @${r.targetPostAuthorUsername}`
  }

  async function handleDismiss(report) {
    if (!confirm('Bỏ qua báo cáo này?')) return
    setBusyId(report.id)
    try {
      await axios.patch(`/api/admin/reports/${report.id}/dismiss`)
      markResolved(report.id, 'dismissed')
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, outline: 'none',
          }}
        >
          <option value="pending">Chờ xử lý</option>
          <option value="resolved">Đã xử lý</option>
          <option value="dismissed">Đã bỏ qua</option>
          <option value="">Tất cả</option>
        </select>
      </div>

      {loading && <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Đang tải...</p>}

      {!loading && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {reports.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px', textAlign: 'center' }}>Không có báo cáo nào.</p>
          )}
          {reports.map((r, i) => (
            <div key={r.id} style={{
              padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{r.reporterName}</span> (@{r.reporterUsername}) đã báo cáo{' '}
                {r.targetType === 'user'
                  ? <>người dùng <strong>@{r.targetUsername}</strong></>
                  : <>bài viết của <strong>@{r.targetPostAuthorUsername}</strong></>}
                {' '}· {timeAgo(r.createdAt)}
              </div>

              {r.targetType === 'post' && r.targetPostContent && (
                <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 6, maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{r.targetPostContent}"
                </div>
              )}

              <div style={{ fontSize: 13.5, color: 'var(--text)', marginBottom: 10 }}>
                Lý do: {r.reason}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  color: r.status === 'pending' ? '#d9b48f' : r.status === 'resolved' ? '#2e8b57' : 'var(--text-3)',
                  background: r.status === 'pending' ? 'rgba(212,165,116,0.15)' : r.status === 'resolved' ? 'rgba(46,139,87,0.12)' : 'rgba(var(--overlay-rgb),0.08)',
                }}>
                  {REPORT_STATUS_LABELS[r.status]}
                </span>

                {r.status === 'pending' && (
                  <>
                    <ActionButton icon={<AlertTriangle size={13} />} label="Cảnh cáo" color="#d9b48f" disabled={busyId === r.id} onClick={() => setModal({ mode: 'warn', report: r })} />
                    <ActionButton icon={<Lock size={13} />} label="Khóa" color="#c0392b" disabled={busyId === r.id} onClick={() => setModal({ mode: 'lock', report: r })} />
                    <ActionButton icon={<X size={13} />} label="Bỏ qua" color="var(--text-3)" disabled={busyId === r.id} onClick={() => handleDismiss(r)} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {modal && (
        <ModerationModal
          mode={modal.mode}
          targetLabel={targetLabelFor(modal.report)}
          endpoint={`/api/admin/reports/${modal.report.id}/${modal.mode}`}
          initialReason={modal.mode === 'warn' ? modal.report.reason : ''}
          onClose={() => setModal(null)}
          onDone={handleModalDone}
        />
      )}
    </div>
  )
}

function OverviewTab({ onNavigate }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get('/api/admin/stats').then(res => setStats(res.data))
  }, [])

  if (!stats) return <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Đang tải...</p>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Users} label="Người dùng" value={stats.userCount} tone="accent" onClick={() => onNavigate('users')} />
        <StatCard icon={FileText} label="Bài viết" value={stats.postCount} tone="accent" onClick={() => onNavigate('posts')} />
        <StatCard icon={MessageSquare} label="Bình luận" value={stats.commentCount} tone="accent" />
      </div>

      {/* Nhóm riêng 2 chỉ số cần admin để ý/xử lý — tô màu theo đúng mức độ khẩn cấp thay vì đồng loạt một màu trang trí như nhóm thống kê ở trên */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
        Cần chú ý
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard
          icon={Lock}
          label="Tài khoản bị khóa"
          value={stats.lockedCount}
          tone={stats.lockedCount > 0 ? 'danger' : 'ok'}
          hint={stats.lockedCount > 0 ? 'Đang có tài khoản bị khóa' : 'Không có tài khoản nào bị khóa'}
        />
        <StatCard
          icon={Flag}
          label="Báo cáo chờ xử lý"
          value={stats.pendingReportCount}
          tone={stats.pendingReportCount > 0 ? 'warning' : 'ok'}
          hint={stats.pendingReportCount > 0 ? 'Bấm để xem và xử lý' : 'Đã xử lý hết'}
        />
      </div>
      {stats.pendingReportCount > 0 && (
        <button
          onClick={() => onNavigate('reports')}
          style={{
            marginTop: 16, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#c1793d,#8b4a28)', color: '#fff', fontSize: 13, fontWeight: 700,
          }}
        >
          Xem báo cáo chờ xử lý →
        </button>
      )}
    </div>
  )
}

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

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [busy, setBusy] = useState(false)
  const isDark = theme === 'dark'

  async function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    setBusy(true)
    try {
      const res = await axios.get('/api/settings')
      await axios.put('/api/settings', { ...res.data.settings, theme: next })
    } catch {
      // giữ nguyên giao diện đã đổi ở phía client dù lưu server thất bại
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(var(--overlay-rgb),0.08)', opacity: busy ? 0.6 : 1 }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Chế độ tối</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>Đổi giao diện SUNSET sang nền đen, áp dụng ngay và nhớ cho lần đăng nhập sau</p>
      </div>
      <Toggle on={isDark} onClick={busy ? undefined : toggleTheme} />
    </div>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    flushSync(() => { logout() })
    navigate('/admin-portal')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: 'transparent', color: '#dc2626', fontSize: 13.5, fontWeight: 600,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <LogOut size={16} />
      Đăng xuất
    </button>
  )
}

function SidebarNav({ active, onChange }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: isActive ? 'linear-gradient(135deg,#c1793d,#8b4a28)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-2)',
              fontSize: 13.5, fontWeight: isActive ? 700 : 600,
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            <Icon size={16} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

const TAB_TITLES = {
  overview: 'Tổng quan',
  users: 'Người dùng',
  posts: 'Bài viết',
  reports: 'Báo cáo',
  appearance: 'Giao diện',
}

export default function Admin() {
  const [tab, setTab] = useState('overview')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 82, minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 1040, padding: '0 24px 40px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

          {/* Sidebar — cố định bên trái, tách biệt hẳn với thanh pill điều hướng mạng xã hội phía trên, đúng kiểu một bảng điều khiển quản trị */}
          <aside style={{ width: 210, flexShrink: 0, position: 'sticky', top: 82 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 18px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
              }}>
                <ShieldCheck size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>Quản trị</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Hệ thống SUNSET</div>
              </div>
            </div>
            <SidebarNav active={tab} onChange={setTab} />
            <LogoutButton />
          </aside>

          {/* Nội dung */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>{TAB_TITLES[tab]}</h1>

            {tab === 'overview' && <OverviewTab onNavigate={setTab} />}
            {tab === 'users' && <UsersTab />}
            {tab === 'posts' && <PostsTab />}
            {tab === 'reports' && <ReportsTab />}
            {tab === 'appearance' && <AppearanceTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
