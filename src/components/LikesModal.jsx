import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { X, Heart } from 'lucide-react'
import { getInitials } from '../core/AuthContext'

const BORDER = 'rgba(var(--overlay-rgb),0.08)'

export default function LikesModal({ post, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/posts/${post.id}/likes`)
      .then(res => setUsers(res.data.users))
      .finally(() => setLoading(false))
  }, [post.id])

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

      <div style={{
        position: 'relative', width: '90%', maxWidth: 420, maxHeight: '70vh',
        background: 'var(--surface)', border: `1px solid ${BORDER}`, borderRadius: 18,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Lượt thích</span>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: 'rgba(var(--overlay-rgb),0.06)', color: 'var(--text-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {loading && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '16px 0', textAlign: 'center' }}>Đang tải...</p>
          )}
          {!loading && users.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '16px 0', textAlign: 'center' }}>Chưa có ai thích bài viết này.</p>
          )}
          {!loading && users.map(u => (
            <Link
              key={u.id}
              to={`/profile/${u.username}`}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, color: '#fff',
              }}>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(u.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{u.username}</div>
              </div>
              <Heart size={14} fill="#8b4a28" strokeWidth={0} style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
