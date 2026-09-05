import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import './index.css'
import { AuthProvider, useAuth } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { mapPost } from './posts'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import FriendsPanel from '../friends/FriendsPanel'
import Login from '../login/Login'
import Register from '../login/Register'
import ForgotPassword from '../login/ForgotPassword'
import ResetPassword from '../login/ResetPassword'
import Profile from '../profile/Profile'
import Notifications from '../notifications/Notifications'
import Friends from '../friends/Friends'
import Bookmarks from '../bookmarks/Bookmarks'
import Settings from '../settings/Settings'
import CreatePost from '../createpost/CreatePost'
import Admin from '../admin/Admin'
import AdminLogin from '../admin/AdminLogin'

function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/posts')
      .then(res => setPosts(res.data.posts.map(mapPost)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      {/* 3 cột độc lập bằng CSS Grid — cùng gridTemplateColumns với Navbar, mỗi cột tự đứng riêng, sửa cột này không ảnh hưởng cột khác */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 20, alignItems: 'start', padding: '80px 20px 20px', minHeight: '100vh' }}>

        {/* Admin là tài khoản quản trị riêng, không dùng để kết bạn — ẩn nội dung nhưng vẫn giữ chỗ trong lưới,
            nếu không feed sẽ bị đẩy sang cột đầu (280px) do lưới CSS xếp theo số phần tử con thực có trong DOM */}
        {user?.role !== 'admin' ? <FriendsPanel /> : <div />}

        {/* Cột giữa: feed — canh giữa phần còn lại để không bị lệch phải */}
        <div style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Posts */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading && (
                <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Đang tải bài viết...</p>
              )}
              {!loading && posts.length === 0 && (
                <p style={{ color: 'var(--text-3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</p>
              )}
              {posts.map((post, i) => (
                <div key={post.id} style={{ animationDelay: `${i * 0.08}s` }}>
                  <PostCard post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin-portal" element={<AdminLogin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
