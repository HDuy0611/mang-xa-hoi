import { Link, useLocation } from 'react-router-dom'

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 13, fontWeight: 600, textDecoration: 'none',
        padding: '7px 12px', borderRadius: 8,
        color: active ? 'var(--nav-text)' : 'var(--nav-text-dim)',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </Link>
  )
}

export default function AdminHeader() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 62,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--nav-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="34" height="34" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <ellipse cx="22" cy="22" rx="19" ry="19" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" fill="none" transform="rotate(-20 22 22)" filter="url(#glow)" />
          <path d="M11 31V13L22 27V13M22 27L33 13V31" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" />
          <path d="M32 6 L33 9 L36 10 L33 11 L32 14 L31 11 L28 10 L31 9Z" fill="#fff" fillOpacity="0.85" filter="url(#glow)" />
          <circle cx="3.5" cy="22" r="2.2" fill="#fff" fillOpacity="0.7" filter="url(#glow)"/>
          <circle cx="35" cy="36" r="1.8" fill="#fff" fillOpacity="0.7" filter="url(#glow)"/>
        </svg>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--nav-text)', lineHeight: 1.2 }}>SUNSET</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nav-text-dim)' }}>Quản trị</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        <NavLink to="/admin" label="Quản trị" active={pathname.startsWith('/admin')} />
        <NavLink to="/profile" label="Trang cá nhân" active={pathname.startsWith('/profile')} />
      </div>
    </nav>
  )
}
