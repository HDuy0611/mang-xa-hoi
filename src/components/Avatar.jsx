import { getInitials } from '../core/AuthContext'

export default function Avatar({ user, size = 40, radius = '50%', background = 'linear-gradient(135deg,#c1793d,#8b4a28)' }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.32), color: '#fff',
    }}>
      {getInitials(user?.name)}
    </div>
  )
}
