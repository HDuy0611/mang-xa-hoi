import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { sendPasswordResetEmail } from '../lib/mailer.js'
import { verifyGoogleToken, verifyFacebookToken, OAuthNotConfiguredError } from '../lib/oauth.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function generateUniqueUsername(base) {
  const cleanBase = base.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user'
  let candidate = cleanBase
  let suffix = 0

  while (true) {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [candidate])
    if (rows.length === 0) return candidate
    suffix += 1
    candidate = `${cleanBase}${suffix}`
  }
}

async function reactivateIfNeeded(userId) {
  await pool.query('UPDATE user_settings SET is_deactivated = FALSE WHERE user_id = ?', [userId])
}

async function checkLockMessage(userId, isLocked, lockedUntil, lockedReason) {
  if (!isLocked) return null

  if (lockedUntil && new Date(lockedUntil) <= new Date()) {
    await pool.query('UPDATE users SET is_locked = FALSE, locked_until = NULL, locked_reason = NULL WHERE id = ?', [userId])
    return null
  }

  const reasonPart = lockedReason ? ` Lý do: ${lockedReason}.` : ''

  if (lockedUntil) {
    const until = new Date(lockedUntil).toLocaleDateString('vi-VN')
    return `Tài khoản của bạn đã bị khóa đến ngày ${until}.${reasonPart} Vui lòng liên hệ quản trị viên.`
  }

  return `Tài khoản của bạn đã bị khóa vĩnh viễn.${reasonPart} Vui lòng liên hệ quản trị viên.`
}

function issueToken(user) {
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  return { token, user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role || 'user' } }
}

async function findOrCreateOAuthUser({ provider, providerId, email, name, picture }) {
  const idColumn = provider === 'google' ? 'google_id' : 'facebook_id'

  const [byProviderId] = await pool.query(`SELECT * FROM users WHERE ${idColumn} = ?`, [providerId])
  if (byProviderId.length > 0) return byProviderId[0]

  const [byEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
  if (byEmail.length > 0) {
    await pool.query(`UPDATE users SET ${idColumn} = ? WHERE id = ?`, [providerId, byEmail[0].id])
    return byEmail[0]
  }

  const username = await generateUniqueUsername(email.split('@')[0])
  const [result] = await pool.query(
    `INSERT INTO users (name, username, email, avatar_url, ${idColumn}) VALUES (?, ?, ?, ?, ?)`,
    [name, username, email, picture || null, providerId]
  )
  return { id: result.insertId, name, username, email }
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.' })
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Email không hợp lệ.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const username = await generateUniqueUsername(email.split('@')[0])

    const [result] = await pool.query(
      'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [name.trim(), username, email.trim(), passwordHash]
    )

    return res.status(201).json({
      user: { id: result.insertId, name: name.trim(), username, email: email.trim() },
    })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại.' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, password_hash, role, is_locked AS isLocked, locked_until AS lockedUntil, locked_reason AS lockedReason FROM users WHERE email = ?',
      [email.trim()]
    )
    const user = rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
    }
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Tài khoản này đăng nhập bằng Google/Facebook, vui lòng dùng nút tương ứng.' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
    }
    if (user.role === 'admin') {
      // Tài khoản admin không được phép đăng nhập qua cổng công khai này, kể cả khi đúng mật khẩu —
      // trả về đúng thông báo sai mật khẩu để không lộ ra rằng email này là tài khoản admin.
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
    }
    const lockMessage = await checkLockMessage(user.id, user.isLocked, user.lockedUntil, user.lockedReason)
    if (lockMessage) {
      return res.status(403).json({ message: lockMessage })
    }

    await reactivateIfNeeded(user.id)

    return res.json(issueToken(user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại.' })
  }
})

router.post('/google', async (req, res) => {
  const { credential } = req.body
  if (!credential) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập Google.' })
  }

  try {
    const profile = await verifyGoogleToken(credential)
    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    })
    if (user.role === 'admin') {
      return res.status(401).json({ message: 'Đăng nhập Google thất bại.' })
    }
    const lockMessage = await checkLockMessage(user.id, user.is_locked, user.locked_until, user.locked_reason)
    if (lockMessage) {
      return res.status(403).json({ message: lockMessage })
    }
    await reactivateIfNeeded(user.id)
    return res.json(issueToken(user))
  } catch (err) {
    if (err instanceof OAuthNotConfiguredError) {
      return res.status(501).json({ message: err.message })
    }
    console.error(err)
    return res.status(401).json({ message: 'Đăng nhập Google thất bại.' })
  }
})

router.post('/facebook', async (req, res) => {
  const { accessToken } = req.body
  if (!accessToken) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập Facebook.' })
  }

  try {
    const profile = await verifyFacebookToken(accessToken)
    const user = await findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    })
    if (user.role === 'admin') {
      return res.status(401).json({ message: 'Đăng nhập Facebook thất bại.' })
    }
    const lockMessage = await checkLockMessage(user.id, user.is_locked, user.locked_until, user.locked_reason)
    if (lockMessage) {
      return res.status(403).json({ message: lockMessage })
    }
    await reactivateIfNeeded(user.id)
    return res.json(issueToken(user))
  } catch (err) {
    if (err instanceof OAuthNotConfiguredError) {
      return res.status(501).json({ message: err.message })
    }
    console.error(err)
    return res.status(401).json({ message: err.message || 'Đăng nhập Facebook thất bại.' })
  }
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  const genericMessage = 'Nếu email này tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.'

  if (!email?.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập email.' })
  }

  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email.trim()])
    const user = rows[0]

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await pool.query(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt]
      )

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`
      await sendPasswordResetEmail(user.email, resetLink)
    }

    return res.json({ message: genericMessage })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại.' })
  }
})

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin đặt lại mật khẩu.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const [rows] = await pool.query(
      `SELECT id, user_id FROM password_resets
       WHERE token_hash = ? AND used = FALSE AND expires_at > NOW()`,
      [tokenHash]
    )
    const reset = rows[0]

    if (!reset) {
      return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, reset.user_id])
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [reset.id])

    return res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại.' })
  }
})

export default router
