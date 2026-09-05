import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
  const { targetType, targetId, reason } = req.body

  if (!['user', 'post'].includes(targetType)) {
    return res.status(400).json({ message: 'Loại đối tượng báo cáo không hợp lệ.' })
  }
  const id = Number(targetId)
  if (!id) {
    return res.status(400).json({ message: 'Thiếu đối tượng cần báo cáo.' })
  }
  if (!reason?.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do báo cáo.' })
  }

  if (targetType === 'user' && id === req.userId) {
    return res.status(400).json({ message: 'Không thể tự báo cáo chính mình.' })
  }

  if (targetType === 'user') {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [id])
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy người dùng.' })
  } else {
    const [rows] = await pool.query('SELECT id, user_id FROM posts WHERE id = ?', [id])
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy bài viết.' })
    if (rows[0].user_id === req.userId) {
      return res.status(400).json({ message: 'Không thể tự báo cáo bài viết của chính mình.' })
    }
  }

  await pool.query(
    'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
    [req.userId, targetType, id, reason.trim().slice(0, 500)]
  )

  res.status(201).json({ message: 'Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng an toàn hơn.' })
})

export default router
