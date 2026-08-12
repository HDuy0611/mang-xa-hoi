import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Link as LinkIcon, UserPlus, UserCheck, Clock, Ban, Check, Copy } from 'lucide-react'
import coverImg from '../assets/images/929ef642-a5f0-4c9b-ba85-bd027a3f6d33.png'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.07)'

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n
}

function StatBlock({ value, label, active }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 10 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{fmt(value)}</span>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      {active && (
        <div style={{
          position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2,
          borderRadius: 2, background: 'linear-gradient(90deg,#d4a574,#8b4a28)',
        }} />
      )}
    </div>
  )
}

function FriendActionButton({ relationship, blockedByMe, onFriendAction }) {
  const [hov, setHov] = useState(false)

  if (relationship === 'blocked') {
    if (blockedByMe) {
      return (
        <button
          onClick={() => onFriendAction('unblock')}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11, cursor: 'pointer',
            color: hov ? '#fff' : 'var(--text)',
            background: hov ? 'linear-gradient(128deg,#7a4420,#8b4a28)' : 'rgba(var(--overlay-rgb),0.05)',
            border: hov ? 'none' : '1px solid rgba(var(--overlay-rgb),0.14)',
            transition: 'all 0.18s ease',
          }}
        >
          <Ban size={15} /> Bỏ chặn
        </button>
      )
    }
    return (
      <div style={{
        fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11,
        color: 'var(--text-3)', background: 'rgba(var(--overlay-rgb),0.04)', border: '1px solid rgba(var(--overlay-rgb),0.09)',
      }}>
        <Ban size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Không khả dụng
      </div>
    )
  }

  if (relationship === 'friends') {
    return (
      <button
        onClick={() => onFriendAction('unfriend')}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11, cursor: 'pointer',
          color: hov ? '#f87171' : 'var(--text)',
          background: hov ? 'rgba(248,113,113,0.1)' : 'rgba(var(--overlay-rgb),0.05)',
          border: '1px solid rgba(var(--overlay-rgb),0.14)',
          transition: 'all 0.18s ease',
        }}
      >
        {hov ? <><Ban size={15} /> Hủy kết bạn</> : <><UserCheck size={15} /> Bạn bè</>}
      </button>
    )
  }

  if (relationship === 'request_sent') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11,
        color: 'var(--text-3)', background: 'rgba(var(--overlay-rgb),0.04)', border: '1px solid rgba(var(--overlay-rgb),0.09)',
      }}>
        <Clock size={14} /> Đã gửi lời mời
      </div>
    )
  }

  if (relationship === 'request_received') {
    return (
      <button
        onClick={() => onFriendAction('accept')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(128deg,#7a4420,#8b4a28)', color: '#fff',
          boxShadow: '0 4px 16px rgba(193,121,61,0.35)',
        }}
      >
        <Check size={15} /> Xác nhận lời mời
      </button>
    )
  }

  return (
    <button
      onClick={() => onFriendAction('request')}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(128deg,#7a4420,#8b4a28)', color: '#fff',
        boxShadow: '0 4px 16px rgba(193,121,61,0.35)',
      }}
    >
      <UserPlus size={15} /> Kết bạn
    </button>
  )
}

export default function ProfileHeader({ user, isOwnProfile, relationship, blockedByMe, onFriendAction }) {
  const [hovEdit, setHovEdit] = useState(false)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  function handleShare() {
    const url = `${window.location.origin}/profile/${user.username}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
      {/* Cover */}
      <div style={{
        height: 350, position: 'relative',
        backgroundImage: `url(${user.coverUrl || coverImg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      {/* Body */}
      <div style={{ padding: '0 24px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -56 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              borderRadius: '50%', padding: 4, background: user.avatarRing,
              boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
            }}>
              <div style={{
                width: 112, height: 112, borderRadius: '50%',
                background: 'var(--bg)', padding: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: user.avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 32, color: '#fff',
                  }}>{user.initials}</div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            {isOwnProfile ? (
              <button
                onClick={() => navigate('/settings')}
                onMouseEnter={() => setHovEdit(true)}
                onMouseLeave={() => setHovEdit(false)}
                style={{
                  fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11,
                  cursor: 'pointer',
                  background: hovEdit ? 'rgba(var(--overlay-rgb),0.09)' : 'rgba(var(--overlay-rgb),0.05)',
                  border: '1px solid rgba(var(--overlay-rgb),0.14)',
                  color: 'var(--text)',
                  transition: 'all 0.18s ease',
                }}
              >
                Chỉnh sửa trang cá nhân
              </button>
            ) : (
              <FriendActionButton relationship={relationship} blockedByMe={blockedByMe} onFriendAction={onFriendAction} />
            )}
            <button
              onClick={handleShare}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 11,
                cursor: 'pointer',
                background: copied ? 'linear-gradient(135deg,#6f8f4f,#5a7540)' : 'rgba(var(--overlay-rgb),0.05)',
                color: copied ? '#fff' : 'var(--text)',
                border: copied ? 'none' : '1px solid rgba(var(--overlay-rgb),0.14)',
                transition: 'all 0.18s ease',
              }}
            >
              {copied ? <><Check size={14} /> Đã sao chép</> : <><Copy size={14} /> Chia sẻ trang cá nhân</>}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{user.name}</span>
          </div>
          <span style={{ fontSize: 13.5, color: 'var(--text-3)' }}>@{user.username}</span>
        </div>

        {user.bio && (
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 12, whiteSpace: 'pre-line' }}>{user.bio}</p>
        )}

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 14 }}>
          {user.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)' }}>
              <MapPin size={14} /> {user.location}
            </span>
          )}
          {user.website && (
            <a href={/^https?:\/\//.test(user.website) ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#d4a574', textDecoration: 'none' }}>
              <LinkIcon size={14} /> {user.website}
            </a>
          )}
          {user.joined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)' }}>
              <Calendar size={14} /> {user.joined}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 18, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
          <StatBlock value={user.stats.posts} label="Bài viết" active />
          <StatBlock value={user.stats.friends} label="Bạn bè" />
        </div>
      </div>
    </div>
  )
}
