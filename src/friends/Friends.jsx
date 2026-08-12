import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Check, X, UserPlus, UserMinus, Ban } from 'lucide-react'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.09)'

function RequestCard({ request, onAccept, onDecline }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 16px' }}>
      <Link to={`/profile/${request.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, textDecoration: 'none' }}>
        <Avatar user={request} size={52} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{request.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>@{request.username}</p>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onAccept}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: '#fff',
            background: 'linear-gradient(120deg,#7a4420,#6b3820)',
            boxShadow: '0 3px 12px rgba(193,121,61,0.35)',
          }}
        >
          <Check size={15} /> Xác nhận
        </button>
        <button
          onClick={onDecline}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: 'var(--text-2)',
            background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.12)',
          }}
        >
          <X size={15} /> Xóa
        </button>
      </div>
    </div>
  )
}

function FriendCard({ friend, onUnfriend, onBlock }) {
  const [hovUnfriend, setHovUnfriend] = useState(false)
  const [hovBlock, setHovBlock] = useState(false)
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 16px', textAlign: 'center' }}>
      <Link to={`/profile/${friend.username}`} style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Avatar user={friend} size={60} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{friend.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, marginBottom: 14 }}>@{friend.username}</p>
      </Link>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onUnfriend}
          onMouseEnter={() => setHovUnfriend(true)}
          onMouseLeave={() => setHovUnfriend(false)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '9px 0', borderRadius: 10, cursor: 'pointer',
            fontSize: 12.5, fontWeight: 600,
            color: hovUnfriend ? '#d9b48f' : 'var(--text-2)',
            background: hovUnfriend ? 'rgba(212,165,116,0.1)' : 'rgba(var(--overlay-rgb),0.05)',
            border: '1px solid rgba(var(--overlay-rgb),0.12)',
            transition: 'all 0.18s ease',
          }}
        >
          <UserMinus size={13} /> Hủy kết bạn
        </button>
        <button
          onClick={onBlock}
          onMouseEnter={() => setHovBlock(true)}
          onMouseLeave={() => setHovBlock(false)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '9px 0', borderRadius: 10, cursor: 'pointer',
            fontSize: 12.5, fontWeight: 600,
            color: hovBlock ? '#f43f5e' : 'var(--text-2)',
            background: hovBlock ? 'rgba(244,63,94,0.1)' : 'rgba(var(--overlay-rgb),0.05)',
            border: '1px solid rgba(var(--overlay-rgb),0.12)',
            transition: 'all 0.18s ease',
          }}
        >
          <Ban size={13} /> Chặn
        </button>
      </div>
    </div>
  )
}

function BlockedCard({ blocked, onUnblock }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, opacity: 0.7 }}>
        <Avatar user={blocked} size={60} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{blocked.name}</p>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, marginBottom: 14 }}>@{blocked.username}</p>

      <button
        onClick={onUnblock}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 0', borderRadius: 10, cursor: 'pointer',
          fontSize: 12.5, fontWeight: 700,
          color: hov ? '#fff' : 'var(--text)',
          background: hov ? 'linear-gradient(120deg,#7a4420,#6b3820)' : 'rgba(var(--overlay-rgb),0.05)',
          border: hov ? 'none' : '1px solid rgba(var(--overlay-rgb),0.12)',
          transition: 'all 0.18s ease',
        }}
      >
        <Ban size={13} /> Bỏ chặn
      </button>
    </div>
  )
}

function SuggestionCard({ suggestion, onAdd, sent }) {
  return (
    <div style={{
      background: 'rgba(212,165,116,0.03)', border: '1.5px dashed rgba(212,165,116,0.22)',
      borderRadius: 16, padding: '18px 16px', textAlign: 'center',
    }}>
      <Link to={`/profile/${suggestion.username}`} style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Avatar user={suggestion} size={60} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{suggestion.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, marginBottom: 14 }}>@{suggestion.username}</p>
      </Link>

      <button
        onClick={onAdd}
        disabled={sent}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', borderRadius: 10,
          cursor: sent ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 700,
          color: sent ? 'var(--text-3)' : '#c99b6b',
          background: 'transparent',
          border: `1.5px solid ${sent ? 'rgba(var(--overlay-rgb),0.12)' : 'rgba(212,165,116,0.4)'}`,
        }}
      >
        <UserPlus size={15} /> {sent ? 'Đã gửi lời mời' : 'Kết bạn'}
      </button>
    </div>
  )
}

export default function Friends() {
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [blocked, setBlocked] = useState([])
  const [sentIds, setSentIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/friends/requests'),
      axios.get('/api/friends'),
      axios.get('/api/friends/suggestions'),
      axios.get('/api/friends/blocked'),
    ]).then(([reqRes, friendsRes, suggRes, blockedRes]) => {
      setRequests(reqRes.data.requests)
      setFriends(friendsRes.data.friends)
      setSuggestions(suggRes.data.suggestions)
      setBlocked(blockedRes.data.blocked)
    }).finally(() => setLoading(false))
  }, [])

  function accept(id) {
    setRequests(r => r.filter(req => req.id !== id))
    axios.post(`/api/friends/${id}/accept`).then(() => {
      axios.get('/api/friends').then(res => setFriends(res.data.friends))
    })
  }

  function decline(id) {
    setRequests(r => r.filter(req => req.id !== id))
    axios.post(`/api/friends/${id}/decline`).catch(() => {})
  }

  function unfriend(id) {
    setFriends(f => f.filter(friend => friend.id !== id))
    axios.delete(`/api/friends/${id}`).catch(() => {})
  }

  function block(id) {
    const person = friends.find(f => f.id === id) || suggestions.find(s => s.id === id)
    setFriends(f => f.filter(friend => friend.id !== id))
    setSuggestions(s => s.filter(sug => sug.id !== id))
    if (person) setBlocked(b => [...b, person])
    axios.post(`/api/friends/${id}/block`).catch(() => {})
  }

  function unblock(id) {
    const person = blocked.find(u => u.id === id)
    setBlocked(b => b.filter(u => u.id !== id))
    axios.post(`/api/friends/${id}/unblock`).then(res => {
      if (res.data.restored && person) setFriends(f => [...f, person])
    }).catch(() => {})
  }

  function sendRequest(id) {
    setSentIds(ids => [...ids, id])
    axios.post(`/api/friends/${id}/request`).catch(() => {
      setSentIds(ids => ids.filter(x => x !== id))
    })
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>

        <div style={{ width: '100%', padding: '20px 24px', maxWidth: 1000, minWidth: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 22 }}>Bạn bè</h1>

          {loading && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Đang tải...</p>
          )}

          {!loading && requests.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <UserPlus size={17} color="#d4a574" />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Lời mời kết bạn</span>
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg,#c1793d,#8b4a28)',
                  padding: '2px 8px', borderRadius: 20,
                }}>{requests.length}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 30 }}>
                {requests.map(req => (
                  <RequestCard key={req.id} request={req} onAccept={() => accept(req.id)} onDecline={() => decline(req.id)} />
                ))}
              </div>
            </>
          )}

          {!loading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Tất cả bạn bè</span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{friends.length}</span>
              </div>

              {friends.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 30 }}>
                  {friends.map(f => (
                    <FriendCard key={f.id} friend={f} onUnfriend={() => unfriend(f.id)} onBlock={() => block(f.id)} />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '10px 0 30px' }}>Bạn chưa có người bạn nào.</p>
              )}
            </>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Gợi ý kết bạn</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                {suggestions.map(s => (
                  <SuggestionCard key={s.id} suggestion={s} sent={sentIds.includes(s.id)} onAdd={() => sendRequest(s.id)} />
                ))}
              </div>
            </>
          )}

          {!loading && blocked.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 30, marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Đã chặn</span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{blocked.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                {blocked.map(u => (
                  <BlockedCard key={u.id} blocked={u} onUnblock={() => unblock(u.id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
