import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import { mapPost } from '../core/posts'

export default function Bookmarks() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/bookmarks')
      .then(res => setPosts(res.data.posts.map(mapPost)))
      .finally(() => setLoading(false))
  }, [])

  function handleDeleted(id) {
    setPosts(p => p.filter(x => x.id !== id))
  }

  function handleBookmarkChange(id, saved) {
    if (!saved) setPosts(p => p.filter(x => x.id !== id))
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>

        <div style={{ width: '100%', maxWidth: 1080, padding: '20px 24px 40px', minWidth: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Đã lưu</h1>
            {!loading && (
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#d9b48f', marginTop: 8 }}>{posts.length} mục đã lưu</p>
            )}
          </div>

          {loading && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Đang tải...</p>
          )}

          {/* Saved Posts */}
          {!loading && posts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={handleDeleted}
                  onBookmarkChange={handleBookmarkChange}
                />
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)', fontSize: 14 }}>
              Bạn chưa lưu bài viết nào.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
