import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Plus } from 'lucide-react'
import { useAuth } from '../core/AuthContext'
import { useSocket } from '../core/SocketContext'
import Avatar from './Avatar'
import SearchBox from './SearchBox'

const navItems = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Bạn bè', path: '/friends' },
  { label: 'Thông báo', path: '/notifications', unreadKey: true },
  { label: 'Đã lưu', path: '/bookmarks' },
  { label: 'Cài đặt', path: '/settings' },
]

function NavPill({ items, activePath, unreadCount, onNavigate }) {
  const containerRef = useRef(null)
  const itemRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const itemPadding = '12px 32px'

  useLayoutEffect(() => {
    const el = itemRefs.current[activePath]
    const container = containerRef.current
    if (el && container) {
      setIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      })
    }
  }, [activePath])

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      maxWidth: 640,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
      background: 'var(--nav-pill-bg)',
      border: '1px solid var(--nav-pill-border)',
      borderRadius: 999, padding: '5px 8px',
    }}>
      <div style={{
        position: 'absolute', top: 5, bottom: 5, left: indicator.left, width: indicator.width,
        borderRadius: 999, background: 'var(--nav-indicator)',
        boxShadow: '0 2px 8px var(--nav-pill-border)',
        opacity: indicator.ready ? 1 : 0,
        transition: 'left 0.38s cubic-bezier(0.4,0,0.2,1), width 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, background 0.25s ease',
      }} />

      {items.map(({ label, path, unreadKey }) => {
        const active = path === activePath
        const badgeCount = unreadKey ? unreadCount : 0
        return (
          <button
            key={path}
            ref={el => { itemRefs.current[path] = el }}
            onClick={() => onNavigate(path)}
            style={{
              position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6,
              padding: itemPadding, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: 'transparent',
              fontSize: 13.5, fontWeight: active ? 600 : 500,
              color: active ? 'var(--nav-text)' : 'var(--nav-text-dim)',
              transition: 'color 0.3s ease', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--nav-text-hover)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--nav-text-dim)' }}
          >
            {label}
            {badgeCount > 0 && (
              <span style={{
                minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                background: '#8b4a28', color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{badgeCount}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [unreadCount, setUnreadCount] = useState(0)

  function fetchUnread() {
    axios.get('/api/notifications/unread-count')
      .then(res => setUnreadCount(res.data.count))
      .catch(() => {})
  }

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 90000)
    return () => clearInterval(interval)
  }, [location.pathname])

  useEffect(() => {
    if (!socket) return
    function onNotification() { setUnreadCount(c => c + 1) }
    function onReconnect() { fetchUnread() }
    socket.on('notification:new', onNotification)
    socket.on('connect', onReconnect)
    return () => {
      socket.off('notification:new', onNotification)
      socket.off('connect', onReconnect)
    }
  }, [socket])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 62,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--nav-border)',
      transition: 'background 0.25s ease, border-color 0.25s ease',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Cột giữa cố định 640px (đúng bằng maxWidth của nav pill/feed) — 2 cột ngoài tự co giãn theo cửa sổ nhưng luôn kết thúc/bắt đầu sát mép pill, không cần biết trước bề rộng màn hình. Ở mobile (≤768px), class .navbar-grid trong index.css thu 2 cột ngoài lại còn auto, và .navbar-center chuyển hẳn thành thanh cố định đáy màn hình */}
      <div className="navbar-grid" style={{ width: '100%', display: 'grid', alignItems: 'center', padding: '0 20px' }}>

        {/* Cột trái: Logo (dính mép trái) + Search — giữ kích thước gọn như thiết kế gốc, không kéo giãn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <ellipse cx="22" cy="22" rx="19" ry="19" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" fill="none" transform="rotate(-20 22 22)" filter="url(#glow)" />
              <path d="M11 31V13L22 27V13M22 27L33 13V31" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" />
              <path d="M32 6 L33 9 L36 10 L33 11 L32 14 L31 11 L28 10 L31 9Z" fill="#fff" fillOpacity="0.85" filter="url(#glow)" />
              <circle cx="3.5" cy="22" r="2.2" fill="#fff" fillOpacity="0.7" filter="url(#glow)"/>
              <circle cx="35" cy="36" r="1.8" fill="#fff" fillOpacity="0.7" filter="url(#glow)"/>
            </svg>
          </div>

          <div className="navbar-search">
            <SearchBox width={222} />
          </div>
        </div>

        {/* Cột giữa: nav pill — giữ nguyên, không đổi */}
        <div className="navbar-center" style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <NavPill
            items={navItems}
            activePath={location.pathname}
            unreadCount={unreadCount}
            onNavigate={navigate}
          />
        </div>

        {/* Cột phải: CTA + avatar — giữ kích thước gọn, dính mép phải như thiết kế gốc */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, minWidth: 0 }}>
          <button
            onClick={() => navigate('/create-post')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
              padding: '10px 20px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, color: '#fff',
              background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
              boxShadow: '0 4px 16px rgba(193,121,61,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="nav-label">Tạo bài viết</span>
          </button>

          <div onClick={() => navigate('/profile')} style={{
            borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            border: '2px solid rgba(139,74,40,0.4)',
            cursor: 'pointer', lineHeight: 0,
          }}>
            <Avatar user={user} size={34} background="linear-gradient(135deg,#7a4420,#6b3820)" />
          </div>
        </div>
      </div>
    </nav>
  )
}
