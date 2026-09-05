import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

const SELECT_PROFILE = `SELECT id, name, username, email, bio, location, website, role,
    avatar_url AS avatarUrl, cover_url AS coverUrl, created_at AS createdAt
  FROM users WHERE id = ?`

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(SELECT_PROFILE, [req.userId])
  const user = rows[0]

  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' })
  }
  res.json({ user })
})

router.put('/me', requireAuth, async (req, res) => {
  const { name, bio, location, website } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Họ và tên không được để trống.' })
  }

  await pool.query(
    'UPDATE users SET name = ?, bio = ?, location = ?, website = ? WHERE id = ?',
    [name.trim(), bio?.trim() || null, location?.trim() || null, website?.trim() || null, req.userId]
  )

  const [rows] = await pool.query(SELECT_PROFILE, [req.userId])
  res.json({ user: rows[0] })
})

router.put('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
  }

  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId])
  const user = rows[0]
  const matches = user && (await bcrypt.compare(currentPassword, user.password_hash))

  if (!matches) {
    return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng.' })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.userId])

  res.json({ message: 'Đổi mật khẩu thành công.' })
})

router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn ảnh.' })
  }

  const avatarUrl = `/uploads/${req.file.filename}`
  await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.userId])
  res.json({ avatarUrl })
})

router.post('/me/cover', requireAuth, upload.single('cover'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn ảnh.' })
  }

  const coverUrl = `/uploads/${req.file.filename}`
  await pool.query('UPDATE users SET cover_url = ? WHERE id = ?', [coverUrl, req.userId])
  res.json({ coverUrl })
})

router.post('/me/deactivate', requireAuth, async (req, res) => {
  await pool.query(
    `INSERT INTO user_settings (user_id, is_deactivated) VALUES (?, TRUE)
     ON DUPLICATE KEY UPDATE is_deactivated = TRUE`,
    [req.userId]
  )
  res.json({ message: 'Đã vô hiệu hóa tài khoản. Đăng nhập lại để khôi phục.' })
})

router.delete('/me', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = ?', [req.userId])
  res.status(204).end()
})

router.get('/:username', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, username, bio, location, website,
            avatar_url AS avatarUrl, cover_url AS coverUrl, created_at AS createdAt
     FROM users WHERE username = ?`,
    [req.params.username]
  )
  const user = rows[0]
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' })
  }

  const [[{ count: postCount }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM posts WHERE user_id = ?',
    [user.id]
  )
  const [[{ count: friendCount }]] = await pool.query(
    "SELECT COUNT(*) AS count FROM friendships WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'",
    [user.id, user.id]
  )

  let relationship = 'self'
  let blockedByMe = false
  if (user.id !== req.userId) {
    const [rel] = await pool.query(
      `SELECT requester_id, status FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [req.userId, user.id, user.id, req.userId]
    )
    if (rel.length === 0) relationship = 'none'
    else if (rel[0].status === 'blocked') {
      relationship = 'blocked'
      blockedByMe = rel[0].requester_id === req.userId
    }
    else if (rel[0].status === 'accepted') relationship = 'friends'
    else relationship = rel[0].requester_id === req.userId ? 'request_sent' : 'request_received'
  }

  res.json({ user, postCount, friendCount, relationship, blockedByMe })
})

export default router
