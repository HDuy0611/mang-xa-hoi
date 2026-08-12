import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { createNotification } from '../lib/notify.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
     FROM friendships f
     JOIN users u ON u.id = IF(f.requester_id = ?, f.addressee_id, f.requester_id)
     WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'
     ORDER BY u.name`,
    [req.userId, req.userId, req.userId]
  )
  res.json({ friends: rows })
})

router.get('/requests', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
     FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [req.userId]
  )
  res.json({ requests: rows })
})

router.get('/suggestions', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
     FROM users u
     WHERE u.id != ?
       AND u.id NOT IN (
         SELECT IF(requester_id = ?, addressee_id, requester_id)
         FROM friendships
         WHERE requester_id = ? OR addressee_id = ?
       )
     ORDER BY RAND()
     LIMIT 10`,
    [req.userId, req.userId, req.userId, req.userId]
  )
  res.json({ suggestions: rows })
})

router.post('/:userId/request', requireAuth, async (req, res) => {
  const targetId = Number(req.params.userId)
  if (targetId === req.userId) {
    return res.status(400).json({ message: 'Không thể tự kết bạn với chính mình.' })
  }

  const [existing] = await pool.query(
    `SELECT id FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.userId, targetId, targetId, req.userId]
  )
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Đã tồn tại quan hệ bạn bè hoặc lời mời.' })
  }

  await pool.query(
    "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')",
    [req.userId, targetId]
  )
  await createNotification({ userId: targetId, actorId: req.userId, type: 'friend_request' })
  res.status(201).json({ message: 'Đã gửi lời mời kết bạn.' })
})

router.post('/:userId/accept', requireAuth, async (req, res) => {
  const requesterId = Number(req.params.userId)
  const [result] = await pool.query(
    "UPDATE friendships SET status = 'accepted' WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'",
    [requesterId, req.userId]
  )
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn.' })
  }
  await createNotification({ userId: requesterId, actorId: req.userId, type: 'friend_accept' })
  res.json({ message: 'Đã chấp nhận lời mời kết bạn.' })
})

router.post('/:userId/decline', requireAuth, async (req, res) => {
  const requesterId = Number(req.params.userId)
  await pool.query(
    "DELETE FROM friendships WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'",
    [requesterId, req.userId]
  )
  res.status(204).end()
})

router.delete('/:userId', requireAuth, async (req, res) => {
  const otherId = Number(req.params.userId)
  await pool.query(
    `DELETE FROM friendships
     WHERE status = 'accepted' AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
    [req.userId, otherId, otherId, req.userId]
  )
  res.status(204).end()
})

router.post('/:userId/block', requireAuth, async (req, res) => {
  const otherId = Number(req.params.userId)
  const [existing] = await pool.query(
    `SELECT status FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.userId, otherId, otherId, req.userId]
  )
  const wasFriends = existing.some(row => row.status === 'accepted')

  await pool.query(
    `DELETE FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.userId, otherId, otherId, req.userId]
  )
  await pool.query(
    "INSERT INTO friendships (requester_id, addressee_id, status, was_friends) VALUES (?, ?, 'blocked', ?)",
    [req.userId, otherId, wasFriends]
  )
  res.status(204).end()
})

router.get('/blocked', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.username, u.avatar_url AS avatarUrl
     FROM friendships f
     JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = ? AND f.status = 'blocked'
     ORDER BY u.name`,
    [req.userId]
  )
  res.json({ blocked: rows })
})

router.post('/:userId/unblock', requireAuth, async (req, res) => {
  const otherId = Number(req.params.userId)
  const [rows] = await pool.query(
    "SELECT was_friends FROM friendships WHERE requester_id = ? AND addressee_id = ? AND status = 'blocked'",
    [req.userId, otherId]
  )
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Bạn chưa chặn người dùng này.' })
  }

  if (rows[0].was_friends) {
    await pool.query(
      "UPDATE friendships SET status = 'accepted', was_friends = FALSE WHERE requester_id = ? AND addressee_id = ?",
      [req.userId, otherId]
    )
    return res.json({ restored: true })
  }

  await pool.query(
    "DELETE FROM friendships WHERE requester_id = ? AND addressee_id = ? AND status = 'blocked'",
    [req.userId, otherId]
  )
  res.json({ restored: false })
})

export default router
