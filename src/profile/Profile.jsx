import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import ProfileHeader from './ProfileHeader'
import ProfileTabs from './ProfileTabs'
import AboutCard from './AboutCard'
import { useAuth, getInitials } from '../core/AuthContext'
import { mapPost } from '../core/posts'

function formatJoined(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `Đã tham gia Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
}

export default function Profile() {
  const [tab, setTab] = useState('Posts')
  const { user: authUser } = useAuth()
  const { username: routeUsername } = useParams()
  const isOwnProfile = !routeUsername || routeUsername === authUser?.username

  const [otherUser, setOtherUser] = useState(null)
  const [relationship, setRelationship] = useState(null)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [friendCount, setFriendCount] = useState(0)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setPosts([])

    if (isOwnProfile) {
      if (!authUser?.id) return
      Promise.all([
        axios.get('/api/posts', { params: { userId: authUser.id } }),
        axios.get('/api/friends'),
      ]).then(([postsRes, friendsRes]) => {
        setPosts(postsRes.data.posts.map(mapPost))
        setFriendCount(friendsRes.data.friends.length)
      }).finally(() => setLoading(false))
    } else {
      axios.get(`/api/users/${routeUsername}`)
        .then(res => {
          setOtherUser(res.data.user)
          setRelationship(res.data.relationship)
          setBlockedByMe(res.data.blockedByMe)
          setFriendCount(res.data.friendCount)
          return axios.get('/api/posts', { params: { userId: res.data.user.id } })
        })
        .then(res => setPosts(res.data.posts.map(mapPost)))
        .catch(err => {
          if (err.response?.status === 404) setNotFound(true)
        })
        .finally(() => setLoading(false))
    }
  }, [isOwnProfile, routeUsername, authUser?.id])

  function handleFriendAction(action) {
    if (!otherUser) return
    const id = otherUser.id

    if (action === 'request') {
      setRelationship('request_sent')
      axios.post(`/api/friends/${id}/request`).catch(() => setRelationship('none'))
    } else if (action === 'accept') {
      setRelationship('friends')
      setFriendCount(c => c + 1)
      axios.post(`/api/friends/${id}/accept`).catch(() => setRelationship('request_received'))
    } else if (action === 'unfriend') {
      setRelationship('none')
      setFriendCount(c => Math.max(0, c - 1))
      axios.delete(`/api/friends/${id}`).catch(() => setRelationship('friends'))
    } else if (action === 'unblock') {
      setBlockedByMe(false)
      axios.post(`/api/friends/${id}/unblock`).then(res => {
        if (res.data.restored) {
          setRelationship('friends')
          setFriendCount(c => c + 1)
        } else {
          setRelationship('none')
        }
      }).catch(() => {
        setRelationship('blocked')
        setBlockedByMe(true)
      })
    }
  }

  const sourceUser = isOwnProfile ? authUser : otherUser

  const user = sourceUser ? {
    id: sourceUser.id,
    name: sourceUser.name || 'Người dùng',
    username: sourceUser.username || '',
    initials: getInitials(sourceUser.name),
    bio: sourceUser.bio || '',
    location: sourceUser.location || '',
    website: sourceUser.website || '',
    joined: formatJoined(sourceUser.createdAt),
    avatarUrl: sourceUser.avatarUrl || null,
    coverUrl: sourceUser.coverUrl || null,
    avatarBg: 'linear-gradient(135deg,#c1793d,#8b4a28)',
    avatarRing: 'linear-gradient(135deg,#d4a574,#8b4a28)',
    stats: { posts: posts.length, friends: friendCount },
  } : null

  const about = sourceUser ? {
    bio: sourceUser.bio || 'Chưa có tiểu sử.',
    location: sourceUser.location || '',
    email: isOwnProfile ? (authUser?.email || '') : '',
  } : null

  if (!loading && notFound) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Navbar />
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
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>

        <div style={{ width: '100%', maxWidth: 1020, display: 'flex', padding: '20px 24px', gap: 20, alignItems: 'flex-start', minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {user && (
              <ProfileHeader
                user={user}
                isOwnProfile={isOwnProfile}
                relationship={relationship}
                blockedByMe={blockedByMe}
                onFriendAction={handleFriendAction}
              />
            )}
            <ProfileTabs active={tab} onChange={setTab} />

            {tab === 'Posts' && loading && (
              <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Đang tải bài viết...</p>
            )}
            {tab === 'Posts' && !loading && posts.map(post => (
              <PostCard key={post.id} post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />
            ))}
            {((tab === 'Posts' && !loading && posts.length === 0) || tab !== 'Posts') && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
                Chưa có nội dung nào ở đây.
              </div>
            )}
          </div>

          {about && (
            <div style={{ width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AboutCard about={about} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
