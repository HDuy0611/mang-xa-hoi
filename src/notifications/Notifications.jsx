import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import NotificationItem from './NotificationItem'
import NotificationSidebar from './NotificationSidebar'

const BORDER = 'rgba(var(--overlay-rgb),0.07)'

const tabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'like', label: 'Lượt thích' },
  { key: 'comment', label: 'Bình luận' },
  { key: 'friend_request', label: 'Lời mời kết bạn' },
  { key: 'friend_accept', label: 'Đã kết bạn' },
]

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('all')

  useEffect(() => {
    axios.get('/api/notifications')
      .then(res => setItems(res.data.notifications))
      .finally(() => setLoading(false))
  }, [])

  function markRead(id) {
    setItems(list => list.map(n => n.id === id ? { ...n, isRead: true } : n))
    axios.put(`/api/notifications/${id}/read`).catch(() => {})
  }

  function markAllRead() {
    setItems(list => list.map(n => ({ ...n, isRead: true })))
    axios.put('/api/notifications/read-all').catch(() => {})
  }

  const filtered = items.filter(item => active === 'all' || item.type === active)
  const unread = filtered.filter(item => !item.isRead)
  const read = filtered.filter(item => item.isRead)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>

        <div style={{ width: '100%', maxWidth: 920, display: 'flex', padding: '20px 24px', gap: 20, alignItems: 'flex-start', minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 18 }}>Thông báo</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 26, marginBottom: 22, borderBottom: `1px solid ${BORDER}` }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  style={{
                    position: 'relative', padding: '0 0 12px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600,
                    color: active === t.key ? '#d9b48f' : 'var(--text-3)',
                    transition: 'color 0.18s ease',
                  }}
                >
                  {t.label}
                  {active === t.key && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
                      borderRadius: 2, background: 'linear-gradient(90deg,#d4a574,#8b4a28)',
                    }} />
                  )}
                </button>
              ))}
            </div>

            {loading && (
              <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>Đang tải...</p>
            )}

            {!loading && unread.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Mới</p>
                {unread.map(item => <NotificationItem key={item.id} item={item} onRead={markRead} />)}
              </>
            )}

            {!loading && read.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0 10px' }}>Trước đó</p>
                {read.map(item => <NotificationItem key={item.id} item={item} onRead={markRead} />)}
              </>
            )}

            {!loading && unread.length === 0 && read.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
                Không có thông báo nào ở đây.
              </div>
            )}
          </div>

          <NotificationSidebar active={active} onChange={setActive} onMarkAllRead={markAllRead} />
        </div>
      </div>
    </div>
  )
}
