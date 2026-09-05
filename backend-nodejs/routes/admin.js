import { Router } from 'express'
import pool from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

function parsePaging(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))
  return { page, limit, offset: (page - 1) * limit }
}

router.get('/stats', async (req, res) => {
  const [[{ count: userCount }]] = await pool.query('SELECT COUNT(*) AS count FROM users')
  const [[{ count: postCount }]] = await pool.query('SELECT COUNT(*) AS count FROM posts')
  const [[{ count: commentCount }]] = await pool.query('SELECT COUNT(*) AS count FROM comments')
  const [[{ count: lockedCount }]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE is_locked = TRUE')
  const [[{ count: pendingReportCount }]] = await pool.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'pending'")

  res.json({ userCount, postCount, commentCount, lockedCount, pendingReportCount })
})

router.get('/users', async (req, res) => {
  const search = req.query.search?.trim()
  const { page, limit, offset } = parsePaging(req)

  const params = []
  let where = ''
  if (search) {
    where = 'WHERE name LIKE ? OR username LIKE ? OR email LIKE ?'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const [[{ count: total }]] = await pool.query(`SELECT COUNT(*) AS count FROM users ${where}`, params)

  const [rows] = await pool.query(
    `SELECT id, name, username, email, role, avatar_url AS avatarUrl, is_locked AS isLocked, locked_until AS lockedUntil, created_at AS createdAt
     FROM users ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  )

  res.json({ users: rows, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) })
})

router.patch('/users/:id/lock', async (req, res) => {
  const targetId = Number(req.params.id)

  if (targetId === req.userId) {
    return res.status(400).json({ message: 'Không thể tự khóa tài khoản của chính mình.' })
  }

  const reason = req.body.reason?.trim()
  if (!reason) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do khóa.' })
  }

  const [rows] = await pool.query('SELECT username, role FROM users WHERE id = ?', [targetId])
  if (!rows[0]) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' })
  }
  if (rows[0].role === 'admin') {
    return res.status(400).json({ message: 'Không thể khóa tài khoản quản trị viên khác.' })
  }

  const days = req.body.days ? Math.max(1, parseInt(req.body.days, 10)) : null

  if (days) {
    await pool.query(
      'UPDATE users SET is_locked = TRUE, locked_until = DATE_ADD(NOW(), INTERVAL ? DAY), locked_reason = ? WHERE id = ?',
      [days, reason.slice(0, 500), targetId]
    )
  } else {
    await pool.query(
      'UPDATE users SET is_locked = TRUE, locked_until = NULL, locked_reason = ? WHERE id = ?',
      [reason.slice(0, 500), targetId]
    )
  }

  res.json({ message: days ? `Đã khóa trong ${days} ngày.` : 'Đã khóa vĩnh viễn.' })
})

router.patch('/users/:id/unlock', async (req, res) => {
  const targetId = Number(req.params.id)
  const [rows] = await pool.query('SELECT username FROM users WHERE id = ?', [targetId])
  if (!rows[0]) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' })
  }

  await pool.query('UPDATE users SET is_locked = FALSE, locked_until = NULL, locked_reason = NULL WHERE id = ?', [targetId])
  res.json({ message: 'Đã mở khóa tài khoản.' })
})

router.get('/posts', async (req, res) => {
  const search = req.query.search?.trim()
  const { page, limit, offset } = parsePaging(req)

  const params = []
  let where = ''
  if (search) {
    where = 'WHERE p.content LIKE ? OR u.name LIKE ? OR u.username LIKE ?'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const [[{ count: total }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM posts p JOIN users u ON u.id = p.user_id ${where}`,
    params
  )

  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at AS createdAt,
            u.name AS authorName, u.username AS authorUsername,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments
     FROM posts p
     JOIN users u ON u.id = p.user_id
     ${where}
     ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  )

  res.json({ posts: rows, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) })
})

router.delete('/posts/:id', async (req, res) => {
  const targetId = Number(req.params.id)
  const [rows] = await pool.query('SELECT id FROM posts WHERE id = ?', [targetId])
  if (!rows[0]) {
    return res.status(404).json({ message: 'Bài viết không tồn tại.' })
  }

  await pool.query('DELETE FROM posts WHERE id = ?', [targetId])
  res.status(204).end()
})

async function resolveReportTargetUser(targetType, targetId) {
  if (targetType === 'user') {
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [targetId])
    return rows[0] || null
  }
  const [rows] = await pool.query(
    'SELECT u.id, u.username, u.role FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?',
    [targetId]
  )
  return rows[0] || null
}

router.get('/reports', async (req, res) => {
  const status = req.query.status?.trim()
  const { page, limit, offset } = parsePaging(req)

  const params = []
  let where = ''
  if (status) {
    where = 'WHERE r.status = ?'
    params.push(status)
  }

  const [[{ count: total }]] = await pool.query(`SELECT COUNT(*) AS count FROM reports r ${where}`, params)

  const [rows] = await pool.query(
    `SELECT r.id, r.target_type AS targetType, r.target_id AS targetId, r.reason, r.status,
            r.created_at AS createdAt,
            ru.name AS reporterName, ru.username AS reporterUsername,
            tu.name AS targetUserName, tu.username AS targetUsername,
            tp.content AS targetPostContent, pu.username AS targetPostAuthorUsername
     FROM reports r
     JOIN users ru ON ru.id = r.reporter_id
     LEFT JOIN users tu ON r.target_type = 'user' AND tu.id = r.target_id
     LEFT JOIN posts tp ON r.target_type = 'post' AND tp.id = r.target_id
     LEFT JOIN users pu ON pu.id = tp.user_id
     ${where}
     ORDER BY (r.status = 'pending') DESC, r.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  )

  res.json({ reports: rows, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) })
})

async function getPendingReport(reportId) {
  const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [reportId])
  return rows[0] || null
}

router.patch('/reports/:id/dismiss', async (req, res) => {
  const report = await getPendingReport(req.params.id)
  if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo.' })
  if (report.status !== 'pending') return res.status(400).json({ message: 'Báo cáo này đã được xử lý.' })

  await pool.query(
    "UPDATE reports SET status = 'dismissed', resolved_by = ?, resolved_at = NOW() WHERE id = ?",
    [req.userId, report.id]
  )
  res.json({ message: 'Đã bỏ qua báo cáo.' })
})

router.patch('/reports/:id/warn', async (req, res) => {
  const reason = req.body.reason?.trim()
  if (!reason) return res.status(400).json({ message: 'Vui lòng nhập lý do cảnh cáo.' })

  const report = await getPendingReport(req.params.id)
  if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo.' })
  if (report.status !== 'pending') return res.status(400).json({ message: 'Báo cáo này đã được xử lý.' })

  const target = await resolveReportTargetUser(report.target_type, report.target_id)
  if (!target) return res.status(404).json({ message: 'Không tìm thấy đối tượng bị báo cáo.' })
  if (target.role === 'admin') return res.status(400).json({ message: 'Không thể cảnh cáo quản trị viên khác.' })

  await pool.query(
    "INSERT INTO notifications (user_id, actor_id, type, message) VALUES (?, ?, 'warning', ?)",
    [target.id, req.userId, reason.slice(0, 500)]
  )
  await pool.query(
    "UPDATE reports SET status = 'resolved', resolved_by = ?, resolved_at = NOW() WHERE id = ?",
    [req.userId, report.id]
  )

  res.json({ message: `Đã cảnh cáo @${target.username}.` })
})

router.patch('/reports/:id/lock', async (req, res) => {
  const reason = req.body.reason?.trim()
  if (!reason) return res.status(400).json({ message: 'Vui lòng nhập lý do khóa.' })

  const report = await getPendingReport(req.params.id)
  if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo.' })
  if (report.status !== 'pending') return res.status(400).json({ message: 'Báo cáo này đã được xử lý.' })

  const target = await resolveReportTargetUser(report.target_type, report.target_id)
  if (!target) return res.status(404).json({ message: 'Không tìm thấy đối tượng bị báo cáo.' })
  if (target.role === 'admin') return res.status(400).json({ message: 'Không thể khóa tài khoản quản trị viên khác.' })
  if (target.id === req.userId) return res.status(400).json({ message: 'Không thể tự khóa tài khoản của chính mình.' })

  const days = req.body.days ? Math.max(1, parseInt(req.body.days, 10)) : null

  if (days) {
    await pool.query(
      'UPDATE users SET is_locked = TRUE, locked_until = DATE_ADD(NOW(), INTERVAL ? DAY), locked_reason = ? WHERE id = ?',
      [days, reason.slice(0, 500), target.id]
    )
  } else {
    await pool.query(
      'UPDATE users SET is_locked = TRUE, locked_until = NULL, locked_reason = ? WHERE id = ?',
      [reason.slice(0, 500), target.id]
    )
  }

  await pool.query(
    "UPDATE reports SET status = 'resolved', resolved_by = ?, resolved_at = NOW() WHERE id = ?",
    [req.userId, report.id]
  )

  res.json({ message: days ? `Đã khóa @${target.username} trong ${days} ngày.` : `Đã khóa vĩnh viễn @${target.username}.` })
})

export default router
