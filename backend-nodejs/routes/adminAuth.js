import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

// Cổng đăng nhập riêng cho admin — KHÔNG liên kết ở bất kỳ đâu trong giao diện công khai.
// Đây là API duy nhất còn được phép cấp token cho tài khoản role = 'admin',
// vì /api/auth/login đã chặn thẳng các tài khoản này (xem routes/auth.js).
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, password_hash, role FROM users WHERE email = ?',
      [email.trim()]
    )
    const user = rows[0]

    if (!user || user.role !== 'admin' || !user.password_hash) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại.' })
  }
})

export default router
