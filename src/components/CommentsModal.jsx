import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { X, Send, Trash2 } from 'lucide-react'
import { useAuth, getInitials } from '../core/AuthContext'
import { timeAgo } from '../core/posts'

const BORDER = 'rgba(var(--overlay-rgb),0.08)'

export default function CommentsModal({ post, onClose, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [commentError, setCommentError] = useState('')

  const isAuthor = user?.id === post.authorId
  const commentsDisabled = !isAuthor && post.commentPermission === 'nobody'

  useEffect(() => {
    axios.get(`/api/posts/${post.id}/comments`)
      .then(res => setComments(res.data.comments))
      .finally(() => setLoading(false))
  }, [post.id])

  async function handleSubmit(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    setCommentError('')
    try {
      await axios.post(`/api/posts/${post.id}/comments`, { content })
      const res = await axios.get(`/api/posts/${post.id}/comments`)
      setComments(res.data.comments)
      onCommentAdded?.()
    } catch (err) {
      setText(content)
      setCommentError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    }
  }

  async function handleDeleteComment(commentId) {
    setDeletingId(commentId)
    try {
      await axios.delete(`/api/posts/${post.id}/comments/${commentId}`)
      setComments(cs => cs.filter(c => c.id !== commentId))
      onCommentDeleted?.()
    } finally {
      setDeletingId(null)
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

      <div style={{
        position: 'relative', width: '90%', maxWidth: 520, maxHeight: '80vh',
        background: 'var(--surface)', border: `1px solid ${BORDER}`, borderRadius: 18,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Bình luận</span>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: 'rgba(var(--overlay-rgb),0.06)', color: 'var(--text-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Comment list — chỉ vùng này cuộn được, không kéo theo cả feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {loading && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '16px 0', textAlign: 'center' }}>Đang tải bình luận...</p>
          )}
          {!loading && comments.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '16px 0', textAlign: 'center' }}>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          )}
          {!loading && comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 11, color: '#fff',
              }}>
                {c.author_avatar_url
                  ? <img src={c.author_avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(c.author_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0, background: 'var(--surface-2)', borderRadius: 12, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{c.author_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{c.content}</p>
              </div>
              {user?.id === c.authorId && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  disabled={deletingId === c.id}
                  title="Xoá bình luận"
                  style={{
                    width: 26, height: 26, borderRadius: 7, border: 'none', flexShrink: 0,
                    background: 'transparent', color: 'var(--text-3)',
                    cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        {commentsDisabled ? (
          <p style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0, fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
            Tác giả đã tắt bình luận cho bài viết này.
          </p>
        ) : (
          <>
            {commentError && (
              <p style={{ padding: '0 20px', fontSize: 12.5, color: '#f87171', textAlign: 'center' }}>{commentError}</p>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <input
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Viết bình luận..."
                style={{
                  flex: 1, background: 'var(--surface-2)', border: `1px solid ${BORDER}`,
                  borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text)', outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
                  cursor: text.trim() ? 'pointer' : 'not-allowed',
                  background: text.trim() ? 'linear-gradient(135deg,#c1793d,#8b4a28)' : 'rgba(var(--overlay-rgb),0.06)',
                  color: text.trim() ? '#fff' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
