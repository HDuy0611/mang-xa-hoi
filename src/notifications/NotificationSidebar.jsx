import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, UserCheck, Bell, CheckCircle2, Settings } from 'lucide-react'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.07)'

const filters = [
  { key: 'all', label: 'Tất cả thông báo', icon: Bell },
  { key: 'like', label: 'Lượt thích', icon: Heart },
  { key: 'comment', label: 'Bình luận', icon: MessageCircle },
  { key: 'friend_request', label: 'Lời mời kết bạn', icon: UserPlus },
  { key: 'friend_accept', label: 'Đã kết bạn', icon: UserCheck },
]

function InfoCard() {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Settings size={16} color="#d4a574" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Tuỳ chọn thông báo</span>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 10 }}>
        Bật/tắt thông báo đẩy, email, SMS tại trang Cài đặt.
      </p>
      <Link to="/settings" style={{ fontSize: 13, fontWeight: 600, color: '#d9b48f', textDecoration: 'none' }}>
        Đi tới Cài đặt →
      </Link>
    </div>
  )
}

function FilterCard({ active, onChange, onMarkAllRead }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '18px 16px' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'block' }}>Lọc theo</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
        {filters.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, width: '100%',
                border: 'none', cursor: 'pointer', fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'var(--text-2)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(193,121,61,0.3), rgba(139,74,40,0.2))'
                  : 'transparent',
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(212,165,116,0.25)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <Icon size={15} style={{ color: isActive ? '#d9b48f' : 'inherit', flexShrink: 0 }} />
              {label}
            </button>
          )
        })}
      </div>

      <button
        onClick={onMarkAllRead}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: '#d9b48f', padding: '8px 12px 0',
          borderTop: `1px solid ${BORDER}`, paddingTop: 14,
        }}
      >
        <CheckCircle2 size={15} />
        Đánh dấu tất cả đã đọc
      </button>
    </div>
  )
}

export default function NotificationSidebar({ active, onChange, onMarkAllRead }) {
  return (
    <div style={{ width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InfoCard />
      <FilterCard active={active} onChange={onChange} onMarkAllRead={onMarkAllRead} />
    </div>
  )
}
