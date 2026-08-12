import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const DEFAULTS = {
  isPrivate: false,
  showOnlineStatus: true,
  showActivity: true,
  notifyPush: true,
  notifyEmail: true,
  notifySms: false,
  theme: 'dark',
}

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.userId])
  if (rows.length === 0) {
    return res.json({ settings: DEFAULTS })
  }

  const s = rows[0]
  res.json({
    settings: {
      isPrivate: !!s.is_private,
      showOnlineStatus: !!s.show_online_status,
      showActivity: !!s.show_activity,
      notifyPush: !!s.notify_push,
      notifyEmail: !!s.notify_email,
      notifySms: !!s.notify_sms,
      theme: s.theme,
    },
  })
})

router.put('/', requireAuth, async (req, res) => {
  const merged = { ...DEFAULTS, ...req.body }

  await pool.query(
    `INSERT INTO user_settings
       (user_id, is_private, show_online_status, show_activity, notify_push, notify_email, notify_sms, theme)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       is_private = VALUES(is_private),
       show_online_status = VALUES(show_online_status),
       show_activity = VALUES(show_activity),
       notify_push = VALUES(notify_push),
       notify_email = VALUES(notify_email),
       notify_sms = VALUES(notify_sms),
       theme = VALUES(theme)`,
    [
      req.userId,
      !!merged.isPrivate,
      !!merged.showOnlineStatus,
      !!merged.showActivity,
      !!merged.notifyPush,
      !!merged.notifyEmail,
      !!merged.notifySms,
      merged.theme === 'light' ? 'light' : 'dark',
    ]
  )

  res.json({ settings: merged })
})

export default router
