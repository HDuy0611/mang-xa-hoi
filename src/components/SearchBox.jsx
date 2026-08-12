import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, FileText } from 'lucide-react'
import Avatar from './Avatar'

export default function SearchBox({ placeholder = 'Tìm kiếm trên NOVA', width = '25%' }) {
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState(false)
  const [results, setResults] = useState({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const boxRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults({ users: [], posts: [] })
      return
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      axios.get('/api/search', { params: { q } })
        .then(res => setResults(res.data))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFocus(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goToUser(username) {
    setFocus(false)
    setQuery('')
    navigate(`/profile/${username}`)
  }

  const q = query.trim()
  const showDropdown = focus && q.length > 0
  const hasResults = results.users.length > 0 || results.posts.length > 0

  return (
    <div ref={boxRef} style={{ position: 'relative', width }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: focus ? 'var(--nav-pill-border)' : 'var(--nav-pill-bg)',
        border: `1.5px solid ${focus ? 'var(--accent)' : 'var(--nav-pill-border)'}`,
        borderRadius: 12, padding: '9px 14px',
        boxShadow: focus ? '0 0 0 4px rgba(193,121,61,0.1)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <Search size={14} color="var(--nav-text-dim)" />
        <input
          style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 13, color: 'var(--nav-text)' }}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocus(true)}
        />
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
          padding: 8, maxHeight: 360, overflowY: 'auto',
          boxShadow: '0 16px 40px rgba(20,16,10,0.18)',
        }}>
          {loading && (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '10px 8px' }}>Đang tìm...</p>
          )}

          {!loading && !hasResults && (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '10px 8px' }}>Không tìm thấy kết quả cho "{q}".</p>
          )}

          {!loading && results.users.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px' }}>Người dùng</p>
              {results.users.map(u => (
                <div
                  key={u.id}
                  onClick={() => goToUser(u.username)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 10, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar user={u} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-3)' }}>@{u.username}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && results.posts.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 8px 6px' }}>Bài viết</p>
              {results.posts.map(p => (
                <div
                  key={p.id}
                  onClick={() => goToUser(p.author_username)}
                  style={{ display: 'flex', gap: 10, padding: '8px', borderRadius: 10, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <FileText size={15} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.content}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>@{p.author_username}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
