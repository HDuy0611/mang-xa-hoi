import { OAuth2Client } from 'google-auth-library'

export class OAuthNotConfiguredError extends Error {}

let googleClient = null

export async function verifyGoogleToken(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new OAuthNotConfiguredError('Đăng nhập Google chưa được cấu hình (thiếu GOOGLE_CLIENT_ID trong .env).')
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()

  if (!payload?.email) {
    throw new Error('Không lấy được email từ tài khoản Google.')
  }

  return { id: payload.sub, email: payload.email, name: payload.name || payload.email, picture: payload.picture || null }
}

export async function verifyFacebookToken(accessToken) {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    throw new OAuthNotConfiguredError('Đăng nhập Facebook chưa được cấu hình (thiếu FACEBOOK_APP_ID/FACEBOOK_APP_SECRET trong .env).')
  }

  const appToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
  const debugRes = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`
  )
  const debugData = await debugRes.json()

  if (!debugData?.data?.is_valid || debugData.data.app_id !== process.env.FACEBOOK_APP_ID) {
    throw new Error('Token Facebook không hợp lệ.')
  }

  const profileRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`
  )
  const profile = await profileRes.json()

  if (!profile?.id) {
    throw new Error('Không lấy được thông tin tài khoản Facebook.')
  }
  if (!profile.email) {
    throw new Error('Tài khoản Facebook chưa cấp quyền chia sẻ email, không thể đăng nhập.')
  }

  return { id: profile.id, email: profile.email, name: profile.name, picture: profile.picture?.data?.url || null }
}
