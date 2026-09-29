import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './core/index.css'
import { AuthProvider, useAuth } from './core/AuthContext'
import Admin from './admin/Admin'
import AdminLogin from './admin/AdminLogin'
import Profile from './profile/Profile'
import CreatePost from './createpost/CreatePost'

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/profile" element={<AdminRoute><Profile /></AdminRoute>} />
      <Route path="/profile/:username" element={<AdminRoute><Profile /></AdminRoute>} />
      <Route path="/create-post" element={<AdminRoute><CreatePost /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
