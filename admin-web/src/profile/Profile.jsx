import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Megaphone, Share2, Check } from 'lucide-react'
import AdminHeader from '../components/AdminHeader'
import PostCard from '../components/PostCard'
import { useAuth, getInitials } from '../core/AuthContext'
import { mapPost } from '../core/posts'
import { useCopyLink } from '../core/useCopyLink'
import { PUBLIC_SITE_URL } from '../core/publicSite'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.07)'

export default function Profile() {
  const { user: authUser } = useAuth()
  const { username: routeUsername } = useParams()
  const navigate = useNavigate()
  const isOwnProfile = !routeUsername || routeUsername === authUser?.username
  const { copied, copy } = useCopyLink()

  const [otherUser, setOtherUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setPosts([])

    if (isOwnProfile) {
      if (!authUser?.id) return
      axios.get('/api/posts', { params: { userId: authUser.id } })
        .then(res => setPosts(res.data.posts.map(mapPost)))
        .finally(() => setLoading(false))
    } else {
      axios.get(`/api/users/${routeUsername}`)
        .then(res => {
          setOtherUser(res.data.user)
          return axios.get('/api/posts', { params: { userId: res.data.user.id } })
        })
        .then(res => setPosts(res.data.posts.map(mapPost)))
        .catch(err => {
          if (err.response?.status === 404) setNotFound(true)
        })
        .finally(() => setLoading(false))
    }
  }, [isOwnProfile, routeUsername, authUser?.id])

  const sourceUser = isOwnProfile ? authUser : otherUser

  const user = sourceUser ? {
    name: sourceUser.name || 'Người dùng',
    username: sourceUser.username || '',
    initials: getInitials(sourceUser.name),
    bio: sourceUser.bio || '',
    avatarUrl: sourceUser.avatarUrl || null,
    avatarBg: 'linear-gradient(135deg,#c1793d,#8b4a28)',
    avatarRing: 'linear-gradient(135deg,#d4a574,#8b4a28)',
  } : null

  if (!loading && notFound) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <AdminHeader />
        <div style={{ display: 'flex', paddingTop: 60, minHeight: '100vh' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '80px 24px', color: 'var(--text-3)', fontSize: 15 }}>
            Không tìm thấy người dùng này.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AdminHeader />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 640, padding: '20px 24px 40px', minWidth: 0 }}>
          {user && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    borderRadius: '50%', padding: 3, background: user.avatarRing, flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                  }}>
                    <div style={{
                      width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
                      background: user.avatarBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 24, color: '#fff',
                    }}>
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : user.initials}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>{user.name}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--text-3)' }}>@{user.username}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/create-post')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 11,
                        cursor: 'pointer', border: 'none', color: '#fff',
                        background: 'linear-gradient(128deg,#7a4420,#8b4a28)',
                        boxShadow: '0 4px 16px rgba(193,121,61,0.35)',
                      }}
                    >
                      <Megaphone size={15} /> Đăng thông báo
                    </button>
                  )}
                  <button
                    onClick={() => copy(`${PUBLIC_SITE_URL}/profile/${user.username}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      fontSize: 13, fontWeight: 700, padding: '10px 14px', borderRadius: 11,
                      cursor: 'pointer', color: copied ? '#4ade80' : 'var(--text)',
                      background: 'rgba(var(--overlay-rgb),0.05)',
                      border: '1px solid rgba(var(--overlay-rgb),0.14)',
                    }}
                  >
                    {copied ? <Check size={15} /> : <Share2 size={15} />}
                    {copied ? 'Đã sao chép' : 'Chia sẻ'}
                  </button>
                </div>
              </div>

              {user.bio && (
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 16, whiteSpace: 'pre-line' }}>{user.bio}</p>
              )}
            </div>
          )}

          {loading && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Đang tải bài viết...</p>
          )}
          {!loading && posts.map(post => (
            <PostCard key={post.id} post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />
          ))}
          {!loading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
              {isOwnProfile ? 'Chưa có thông báo nào. Bấm "Đăng thông báo" để tạo bài đầu tiên.' : 'Chưa có bài viết nào.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
