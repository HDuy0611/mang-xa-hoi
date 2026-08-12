import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Users, UserPlus, Check } from 'lucide-react'
import Avatar from '../components/Avatar'

function PersonRow({ person, action }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px',
        borderRadius: 10, margin: '0 -6px',
        background: hov ? 'rgba(var(--overlay-rgb),0.04)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <Link to={`/profile/${person.username}`} style={{
        display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textDecoration: 'none',
      }}>
        <Avatar user={person} size={40} />
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{person.name}</p>
          <p style={{
            fontSize: 12, color: 'var(--text-3)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>@{person.username}</p>
        </div>
      </Link>
      {action}
    </div>
  )
}

function AddFriendButton({ pending, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
        cursor: pending ? 'default' : 'pointer',
        color: pending ? 'var(--text-3)' : 'var(--accent)',
        background: pending ? 'rgba(var(--overlay-rgb),0.05)' : 'rgba(var(--overlay-rgb),0.04)',
        border: `1px solid ${pending ? 'var(--border)' : 'var(--accent)'}`,
      }}
    >
      {pending ? <><Check size={12} /> Đã gửi</> : <><UserPlus size={12} /> Kết bạn</>}
    </button>
  )
}

function PanelSection({ icon: Icon, title, seeAll, divider, children }) {
  return (
    <div style={{ padding: '16px 14px', borderTop: divider ? '1px solid var(--border)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        </div>
        {seeAll && (
          <Link to="/friends" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Xem tất cả
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

export default function FriendsPanel() {
  const [friends, setFriends] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sentIds, setSentIds] = useState([])

  useEffect(() => {
    Promise.all([
      axios.get('/api/friends'),
      axios.get('/api/friends/suggestions'),
    ]).then(([friendsRes, suggRes]) => {
      setFriends(friendsRes.data.friends)
      setSuggestions(suggRes.data.suggestions)
    }).finally(() => setLoading(false))
  }, [])

  function sendRequest(id) {
    setSentIds(ids => [...ids, id])
    axios.post(`/api/friends/${id}/request`).catch(() => setSentIds(ids => ids.filter(x => x !== id)))
  }

  return (
    <aside style={{ width: 280, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 78 }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
        boxShadow: 'var(--shadow)', overflow: 'hidden',
      }}>
        <PanelSection icon={Users} title="Bạn bè" seeAll>
          {loading ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '8px 6px' }}>Đang tải...</p>
          ) : friends.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '8px 6px' }}>Chưa có bạn bè nào.</p>
          ) : (
            friends.slice(0, 6).map(f => <PersonRow key={f.id} person={f} />)
          )}
        </PanelSection>

        {!loading && suggestions.length > 0 && (
          <PanelSection icon={UserPlus} title="Gợi ý kết bạn" divider>
            {suggestions.slice(0, 5).map(s => (
              <PersonRow
                key={s.id}
                person={s}
                action={
                  <AddFriendButton
                    pending={sentIds.includes(s.id)}
                    onClick={() => sendRequest(s.id)}
                  />
                }
              />
            ))}
          </PanelSection>
        )}
      </div>
    </aside>
  )
}
