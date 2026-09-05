import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import postsRouter from './routes/posts.js'
import usersRouter from './routes/users.js'
import friendsRouter from './routes/friends.js'
import notificationsRouter from './routes/notifications.js'
import bookmarksRouter from './routes/bookmarks.js'
import searchRouter from './routes/search.js'
import settingsRouter from './routes/settings.js'
import adminAuthRouter from './routes/adminAuth.js'
import adminRouter from './routes/admin.js'
import reportsRouter from './routes/reports.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRouter)
app.use('/api/posts', postsRouter)
app.use('/api/users', usersRouter)
app.use('/api/friends', friendsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/bookmarks', bookmarksRouter)
app.use('/api/search', searchRouter)
app.use('/api/settings', settingsRouter)
// adminAuthRouter chỉ có POST /login (public) và phải đứng TRƯỚC adminRouter,
// vì adminRouter áp requireAuth+requireAdmin cho mọi path con /api/admin/* kể cả /login.
app.use('/api/admin', adminAuthRouter)
app.use('/api/admin', adminRouter)
app.use('/api/reports', reportsRouter)

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
