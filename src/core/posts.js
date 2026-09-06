import { getInitials } from './AuthContext'

export function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|ogg|avi|mkv)$/i

export function isVideoUrl(url) {
  return !!url && VIDEO_EXTENSIONS.test(url)
}

export function mapPost(row) {
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.author_name,
    username: row.author_username,
    initials: getInitials(row.author_name),
    avatarUrl: row.author_avatar_url || null,
    avatarBg: 'linear-gradient(135deg,#c1793d,#8b4a28)',
    avatarRing: 'linear-gradient(135deg,#d4a574,#8b4a28)',
    verified: false,
    time: timeAgo(row.created_at),
    content: row.content,
    tags: [],
    imageBg: null,
    imageUrl: row.imageUrl || null,
    isVideo: isVideoUrl(row.imageUrl),
    likes: row.likes,
    comments: row.comments,
    shares: 0,
    liked: !!row.liked,
    bookmarked: !!row.bookmarked,
    commentPermission: row.commentPermission || 'everyone',
    allowSharing: row.allowSharing === undefined ? true : !!row.allowSharing,
  }
}
