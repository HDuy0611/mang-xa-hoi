import authBg from '../../assets/images/logo_login.jpg'

export default function AuthLeft() {
  return (
    <div style={{
      width: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden',
      backgroundImage: `url(${authBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '48px 44px',
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(5,10,25,0.75) 0%, rgba(8,18,50,0.55) 50%, rgba(5,10,25,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 60 }}>
          <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
            <defs>
              <linearGradient id="nL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4a574"/><stop offset="100%" stopColor="#8b4a28"/>
              </linearGradient>
            </defs>
            <ellipse cx="22" cy="22" rx="19" ry="19" stroke="url(#nL)" strokeWidth="1.2" fill="none" transform="rotate(-20 22 22)" />
            <path d="M11 31V13L22 27V13M22 27L33 13V31" stroke="url(#nL)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M32 6L33 9L36 10L33 11L32 14L31 11L28 10L31 9Z" fill="#d9b48f" />
            <circle cx="3.5" cy="22" r="2.2" fill="#d4a574" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '2px', background: 'linear-gradient(135deg,#d4a574,#c1793d,#8b4a28)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SUNSET</span>
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.25, color: '#fff', maxWidth: 340 }}>
          Luôn{' '}
          <span style={{ color: '#d4a574' }}>kết nối</span>
          {' '}với cộng đồng{' '}
          <span style={{ color: '#d4a574' }}>lớn nhất</span>
          {' '}
          <span style={{ color: '#d4a574' }}>thế giới.</span>
        </h1>
      </div>

      {/* Bottom tagline */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '2px', background: 'linear-gradient(135deg,#d4a574,#c1793d,#8b4a28)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SUNSET</span>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginTop: 4 }}>Kết nối. Chia sẻ. Khám phá.</p>
      </div>
    </div>
  )
}
