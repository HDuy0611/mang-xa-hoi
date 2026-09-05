import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, UserCheck, AlertTriangle } from 'lucide-react'
import Avatar from '../components/Avatar'
import { timeAgo } from '../core/posts'

const BORDER = 'rgba(var(--overlay-rgb),0.07)'

const badgeByType = {
  like: { icon: Heart, bg: '#8b4a28' },
  comment: { icon: MessageCircle, bg: '#d4a574' },
  friend_request: { icon: UserPlus, bg: '#c1793d' },
  friend_accept: { icon: UserCheck, bg: '#6f8f4f' },
  warning: { icon: AlertTriangle, bg: '#c0392b' },
}

const actionByType = {
  like: 'đã thích bài viết của bạn.',
  comment: 'đã bình luận về bài viết của bạn.',
  friend_request: 'đã gửi cho bạn lời mời kết bạn.',
  friend_accept: 'đã chấp nhận lời mời kết bạn của bạn.',
}

export default function NotificationItem({ item, onRead }) {
  const badge = badgeByType[item.type]
  const Icon = badge.icon
  const unread = !item.isRead

  return (
    <div
      onClick={() => unread && onRead?.(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: unread ? 'rgba(193,121,61,0.06)' : 'var(--surface)',
        border: `1px solid ${unread ? 'rgba(212,165,116,0.2)' : BORDER}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 10,
        cursor: unread ? 'pointer' : 'default',
      }}
    >
      {unread && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4a574', flexShrink: 0 }} />
      )}

      <Link to={`/profile/${item.actorUsername}`} onClick={e => e.stopPropagation()} style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar user={{ name: item.actorName, avatarUrl: item.actorAvatarUrl }} size={44} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: badge.bg, border: '2.5px solid var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={11} color="#fff" fill={item.type === 'like' ? '#fff' : 'none'} />
        </div>
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.4 }}>
          {item.type === 'warning' ? (
            <>Quản trị viên đã cảnh cáo bạn: <span style={{ fontStyle: 'italic' }}>"{item.message}"</span></>
          ) : (
            <><span style={{ fontWeight: 700 }}>{item.actorName}</span> {actionByType[item.type]}</>
          )}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{timeAgo(item.createdAt)}</p>
      </div>

      {item.type === 'friend_request' && (
        <Link to="/friends" style={{
          flexShrink: 0, fontSize: 12.5, fontWeight: 700, padding: '8px 16px', borderRadius: 10,
          border: 'none', cursor: 'pointer', color: '#fff', textDecoration: 'none',
          background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
          boxShadow: '0 3px 12px rgba(193,121,61,0.35)',
        }}>
          Xem
        </Link>
      )}
    </div>
  )
}
