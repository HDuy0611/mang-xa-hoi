import jwt from 'jsonwebtoken'
import pool from '../db.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Chưa đăng nhập.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.id
    next()
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' })
  }
}

export async function requireAdmin(req, res, next) {
  const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId])
  if (rows[0]?.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này.' })
  }
  next()
}
