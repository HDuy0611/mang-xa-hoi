import { useState } from 'react'
import axios from 'axios'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Trash2, Flag } from 'lucide-react'
import { useAuth } from '../core/AuthContext'
import CommentsModal from './CommentsModal'
import ReportModal from './ReportModal'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.08)'

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n
}

function ActionBtn({ icon, label, active, activeColor, activeBg, onClick }) {
  const [hov, setHov] = useState(false)
  const col = active ? activeColor : hov ? 'var(--text)' : 'var(--text-2)'
  const bg = hov ? (activeBg || 'rgba(var(--overlay-rgb),0.05)') : 'transparent'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: label ? '7px 12px' : '7px 9px',
        borderRadius: 9, background: active ? activeBg : bg,
        border: 'none', cursor: 'pointer',
        color: col, fontSize: 13, fontWeight: 500,
        transition: 'all 0.18s ease',
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}

export default function PostCard({ post, onDeleted, onBookmarkChange }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.liked || false)
  const [likes, setLikes] = useState(post.likes)
  const [saved, setSaved] = useState(post.bookmarked || false)
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments)

  const isOwner = user?.id === post.authorId

  function handleLike() {
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikes(l => nextLiked ? l + 1 : l - 1)

    axios.post(`/api/posts/${post.id}/like`).catch(() => {
      setLiked(!nextLiked)
      setLikes(l => nextLiked ? l - 1 : l + 1)
    })
  }

  function handleBookmark() {
    const nextSaved = !saved
    setSaved(nextSaved)
    onBookmarkChange?.(post.id, nextSaved)

    const req = nextSaved
      ? axios.post(`/api/bookmarks/${post.id}`)
      : axios.delete(`/api/bookmarks/${post.id}`)
    req.catch(() => {
      setSaved(!nextSaved)
      onBookmarkChange?.(post.id, !nextSaved)
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await axios.delete(`/api/posts/${post.id}`)
      onDeleted?.(post.id)
    } catch {
      setDeleting(false)
      setMenuOpen(false)
    }
  }


  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: CARD_BG,
        border: `1px solid ${hovered ? 'rgba(212,165,116,0.2)' : BORDER}`,
        borderRadius: 18,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: hovered ? '0 10px 40px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.28)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px 14px', gap: 12 }}>
        {/* Avatar with gradient ring */}
        <div style={{
          borderRadius: '50%', padding: 2.5,
          background: post.avatarRing || 'linear-gradient(135deg,#c1793d,#8b4a28)',
          flexShrink: 0,
          boxShadow: '0 0 16px rgba(139,74,40,0.22)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--bg)', padding: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
              background: post.avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: '#fff',
            }}>
              {post.avatarUrl
                ? <img src={post.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : post.initials}
            </div>
          </div>
        </div>

        {/* Author info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{post.author}</span>
            {post.verified && <BadgeCheck size={15} style={{ color: '#d4a574' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>@{post.username}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{post.time}</span>
          </div>
        </div>

        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'rgba(var(--overlay-rgb),0.04)',
                border: '1px solid rgba(var(--overlay-rgb),0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)', cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,165,116,0.1)'; e.currentTarget.style.color = '#d9b48f' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.04)'; e.currentTarget.style.color = 'var(--text-3)' }}
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 11,
                  background: 'var(--surface)', border: `1px solid ${BORDER}`, borderRadius: 12,
                  padding: 6, minWidth: 160, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}>
                  {isOwner ? (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '9px 10px', borderRadius: 8, border: 'none',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                        fontSize: 13, fontWeight: 600, color: '#f87171',
                        background: 'transparent', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 size={14} /> {deleting ? 'Đang xoá...' : 'Xoá bài viết'}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '9px 10px', borderRadius: 8, border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#f87171',
                        background: 'transparent', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <Flag size={14} /> Báo cáo bài viết
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px 14px' }}>
        <p style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.65, marginBottom: post.tags?.length ? 10 : 0 }}>
          {post.content}
        </p>
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {post.tags.map(t => (
              <span key={t} style={{
                fontSize: 12.5, color: '#d4a574', fontWeight: 500, cursor: 'pointer',
                padding: '3px 9px', borderRadius: 7,
                background: 'rgba(212,165,116,0.1)',
                border: '1px solid rgba(212,165,116,0.15)',
              }}>#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div style={{ margin: '0 16px 16px', display: 'flex', justifyContent: 'center' }}>
          <img src={post.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 420, width: 'auto', height: 'auto', display: 'block', borderRadius: 13 }} />
        </div>
      )}
      {!post.imageUrl && post.imageBg && (
        <div style={{
          margin: '0 16px 16px', borderRadius: 13, overflow: 'hidden',
          background: post.imageBg, height: 260,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 55%)',
          }} />
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 12px 14px',
        borderTop: '1px solid rgba(var(--overlay-rgb),0.07)',
        gap: 2,
      }}>
        <ActionBtn
          icon={<Heart size={17} fill={liked ? '#8b4a28' : 'none'} strokeWidth={liked ? 0 : 1.8} color={liked ? '#8b4a28' : undefined} />}
          label={fmt(likes)}
          active={liked}
          activeColor="#8b4a28"
          activeBg="rgba(139,74,40,0.1)"
          onClick={handleLike}
        />
        <ActionBtn
          icon={<MessageCircle size={17} strokeWidth={1.8} />}
          label={fmt(commentCount)}
          onClick={() => setCommentsOpen(true)}
        />
        {post.allowSharing && (
          <ActionBtn
            icon={<Share2 size={17} strokeWidth={1.8} />}
            label={fmt(post.shares)}
          />
        )}

        <div style={{ flex: 1 }} />

        <ActionBtn
          icon={<Bookmark size={17} fill={saved ? '#d4a574' : 'none'} strokeWidth={saved ? 0 : 1.8} color={saved ? '#d4a574' : undefined} />}
          active={saved}
          activeColor="#d4a574"
          activeBg="rgba(212,165,116,0.1)"
          onClick={handleBookmark}
        />
      </div>

      {commentsOpen && (
        <CommentsModal
          post={post}
          onClose={() => setCommentsOpen(false)}
          onCommentAdded={() => setCommentCount(c => c + 1)}
          onCommentDeleted={() => setCommentCount(c => c - 1)}
        />
      )}

      {reportOpen && (
        <ReportModal
          targetType="post"
          targetId={post.id}
          targetLabel={`Bài viết của @${post.username}`}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}
