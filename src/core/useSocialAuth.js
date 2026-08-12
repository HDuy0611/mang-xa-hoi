import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from './AuthContext'
import { loadGoogleScript, loadFacebookScript } from './socialAuth'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID

export function useSocialAuth() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [socialError, setSocialError] = useState('')
  const [socialLoading, setSocialLoading] = useState(false)

  async function finishLogin(request) {
    setSocialLoading(true)
    try {
      const res = await request()
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      setSocialError(err.response?.data?.message || 'Đăng nhập thất bại.')
    } finally {
      setSocialLoading(false)
    }
  }

  async function handleGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      setSocialError('Đăng nhập Google chưa được cấu hình cho ứng dụng này.')
      return
    }
    setSocialError('')
    try {
      const google = await loadGoogleScript()
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: response => finishLogin(() => axios.post('/api/auth/google', { credential: response.credential })),
      })
      google.accounts.id.prompt()
    } catch {
      setSocialError('Không tải được dịch vụ đăng nhập Google.')
    }
  }

  async function handleFacebook() {
    if (!FACEBOOK_APP_ID) {
      setSocialError('Đăng nhập Facebook chưa được cấu hình cho ứng dụng này.')
      return
    }
    setSocialError('')
    try {
      const FB = await loadFacebookScript(FACEBOOK_APP_ID)
      FB.login(response => {
        if (response.authResponse?.accessToken) {
          finishLogin(() => axios.post('/api/auth/facebook', { accessToken: response.authResponse.accessToken }))
        } else {
          setSocialError('Đăng nhập Facebook đã bị hủy.')
        }
      }, { scope: 'email' })
    } catch {
      setSocialError('Không tải được dịch vụ đăng nhập Facebook.')
    }
  }

  return { handleGoogle, handleFacebook, socialError, socialLoading }
}
