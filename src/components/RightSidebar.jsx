import { Search, Edit3 } from 'lucide-react'

const categories = ['Tất cả', 'Nhiếp ảnh', 'Du lịch', 'Âm nhạc']

const communities = [
  { name: 'Du lịch khắp thế giới', members: '1,2K thành viên', bg: 'linear-gradient(135deg,#312e81,#6b3820,#c1793d)' },
  { name: 'Người yêu nhiếp ảnh', members: '3,4K thành viên', bg: 'linear-gradient(135deg,#1a1a2e,#374151,#6b7280)' },
  { name: 'Không khí về đêm', members: '2,1K thành viên', bg: 'linear-gradient(135deg,#0c0a1e,#1e1b4b,#6b3820)' },
  { name: 'Góc cà phê', members: '1,7K thành viên', bg: 'linear-gradient(135deg,#3730a3,#7a4420,#d4a574)' },
]

const suggestions = [
  { name: 'Gia Hân', username: '@giahan', avatarBg: 'linear-gradient(135deg,#6b3820,#8b4a28)', initials: 'GH' },
  { name: 'Đức Mạnh', username: '@ducmanh', avatarBg: 'linear-gradient(135deg,#7a4420,#c1793d)', initials: 'ĐM' },
  { name: 'Khánh Linh', username: '@khanhlinh', avatarBg: 'linear-gradient(135deg,#6b3820,#8b4a28)', initials: 'KL' },
]

const messages = [
  { name: 'Phương Anh', preview: 'Bạn có muốn tham gia cùng...', time: '2 phút', unread: 2, avatarBg: 'linear-gradient(135deg,#6b3820,#c1793d)', initials: 'PA' },
  { name: 'Quang Huy', preview: 'Hẹn gặp lại ngày mai nhé!', time: '1 giờ', avatarBg: 'linear-gradient(135deg,#6b3820,#8b4a28)', initials: 'QH' },
  { name: 'Minh Anh', preview: 'Cảm ơn nhiều nha!', time: '3 giờ', avatarBg: 'linear-gradient(135deg,#c1793d,#7a4420)', initials: 'MA' },
]

export default function RightSidebar() {
  return (
    <aside className="flex flex-col gap-4 w-[260px] sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}>

      {/* Explore */}
      <div className="surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">Khám phá</h3>
          <button className="text-xs font-medium" style={{ color: '#8b4a28' }}>Xem tất cả</button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {categories.map((cat, i) => (
            <button key={cat}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={i === 0
                ? { background: 'linear-gradient(135deg,#8b4a28,#c1793d)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => i !== 0 && (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => i !== 0 && (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}>
              {cat}
            </button>
          ))}
        </div>

        {/* Community grid */}
        <div className="grid grid-cols-2 gap-2">
          {communities.map((c) => (
            <div key={c.name} className="rounded-xl overflow-hidden cursor-pointer group" style={{ height: 90 }}>
              <div className="w-full h-full relative transition-transform duration-200 group-hover:scale-105"
                style={{ background: c.bg }}>
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 40%, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-[11px] font-semibold leading-tight">{c.name}</p>
                  <p className="text-[10px]" style={{ color: '#94a3b8' }}>{c.members}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">Gợi ý cho bạn</h3>
          <button className="text-xs font-medium" style={{ color: '#8b4a28' }}>Xem tất cả</button>
        </div>
        <div className="flex flex-col gap-3">
          {suggestions.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: s.avatarBg }}>
                {s.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{s.name}</p>
                <p className="text-xs truncate" style={{ color: '#64748b' }}>{s.username}</p>
              </div>
              <button className="btn-follow">Theo dõi</button>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">Tin nhắn</h3>
          <div className="flex gap-2">
            <Search size={15} style={{ color: '#64748b', cursor: 'pointer' }} />
            <Edit3 size={15} style={{ color: '#64748b', cursor: 'pointer' }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.name} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: m.avatarBg }}>
                  {m.initials}
                </div>
                {m.unread && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-purple-500">
                    {m.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-white truncate">{m.name}</p>
                  <p className="text-[11px] shrink-0 ml-1" style={{ color: '#4b5563' }}>{m.time}</p>
                </div>
                <p className="text-xs truncate" style={{ color: '#64748b' }}>{m.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
