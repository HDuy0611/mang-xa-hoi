import { User, Mail, MapPin } from 'lucide-react'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.07)'

export default function AboutCard({ about }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '18px 16px', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.4), transparent)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <User size={16} color="#d4a574" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>Giới thiệu</span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>
        {about.bio}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {about.email && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-3)' }}>
            <Mail size={14} /> {about.email}
          </span>
        )}
        {about.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-3)' }}>
            <MapPin size={14} /> {about.location}
          </span>
        )}
        {!about.email && !about.location && (
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Chưa có thông tin nào khác.</span>
        )}
      </div>
    </div>
  )
}
