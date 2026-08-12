const BORDER = 'rgba(var(--overlay-rgb),0.08)'

const tabs = ['Bài viết', 'Giới thiệu', 'Đã lưu', 'Ảnh', 'Bạn bè']

export default function ProfileTabs({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 28, marginBottom: 18, borderBottom: `1px solid ${BORDER}` }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            position: 'relative', padding: '0 0 14px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            color: active === t ? '#d9b48f' : 'var(--text-3)',
            transition: 'color 0.18s ease',
          }}
        >
          {t}
          {active === t && (
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
              borderRadius: 2, background: 'linear-gradient(90deg,#d4a574,#8b4a28)',
            }} />
          )}
        </button>
      ))}
    </div>
  )
}
