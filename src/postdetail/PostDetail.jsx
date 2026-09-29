import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import { mapPost } from '../core/posts'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    axios.get(`/api/posts/${id}`)
      .then(res => setPost(mapPost(res.data.post)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="page-shell" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 640, padding: '20px 24px 40px', minWidth: 0 }}>
          {loading && (
            <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Đang tải...</p>
          )}
          {!loading && notFound && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 6 }}>Không tìm thấy bài viết.</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Bài viết có thể đã bị xoá hoặc đường liên kết không đúng.</p>
              <Link to="/" style={{ display: 'inline-block', marginTop: 16, color: '#d4a574', fontWeight: 600, fontSize: 13.5, textDecoration: 'none' }}>
                Về trang chủ
              </Link>
            </div>
          )}
          {!loading && post && (
            <PostCard post={post} onDeleted={() => setNotFound(true)} />
          )}
        </div>
      </div>
    </div>
  )
}
