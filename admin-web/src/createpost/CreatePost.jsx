import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft, ChevronDown, ChevronRight, Globe,
  Image as ImageIcon, Video, Send,
  MessageCircle,
} from 'lucide-react'
import AdminHeader from '../components/AdminHeader'
import Avatar from '../components/Avatar'
import { useAuth } from '../core/AuthContext'

const CARD_BG = 'var(--surface)'
const BORDER = 'rgba(var(--overlay-rgb),0.09)'
const MAX_LEN = 280

const audienceOptions = ['Công khai', 'Bạn bè', 'Chỉ mình tôi']

const commentOptions = [
  { value: 'everyone', label: 'Mọi người' },
  { value: 'friends', label: 'Bạn bè' },
  { value: 'nobody', label: 'Không ai cả' },
]

function OptionRow({ icon: Icon, label, trailing, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={16} color="var(--text-3)" />
        <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{label}</span>
      </div>
      {trailing}
    </div>
  )
}

export default function CreatePost() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const isVideoFile = imageFile?.type.startsWith('video/')
  const fileInputRef = useRef(null)
  const [audience, setAudience] = useState('Công khai')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [commentPermission, setCommentPermission] = useState('everyone')
  const [commentMenuOpen, setCommentMenuOpen] = useState(false)
  const [posting, setPosting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [error, setError] = useState('')

  const canPost = text.trim().length > 0 && !posting

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Chỉ hỗ trợ tệp ảnh hoặc video.')
      return
    }

    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePost() {
    if (!canPost) return
    setPosting(true)
    setError('')
    setUploadProgress(imageFile ? 0 : null)
    try {
      const formData = new FormData()
      formData.append('content', text.trim())
      if (imageFile) formData.append('image', imageFile)
      formData.append('commentPermission', commentPermission)

      await axios.post('/api/posts', formData, {
        onUploadProgress: imageFile
          ? (e) => setUploadProgress(e.total ? Math.round((e.loaded / e.total) * 100) : null)
          : undefined,
      })
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      setPosting(false)
      setUploadProgress(null)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AdminHeader />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60, minHeight: '100vh' }}>

        <div style={{ width: '100%', maxWidth: 1020, display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 24px 40px', minWidth: 0 }}>
          {/* Main column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.09)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.09)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.05)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Đăng thông báo</h1>
                  <p style={{ fontSize: 13.5, color: 'var(--text-3)', marginTop: 2 }}>Nội dung sẽ hiển thị công khai trên trang chính, đứng tên tài khoản quản trị</p>
                </div>
              </div>
            </div>

            {/* Composer card */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '22px 24px 8px' }}>
                {/* User row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar user={user} size={44} background="linear-gradient(135deg,#7a4420,#6b3820)" />
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{user?.name || 'Quản trị viên'}</span>
                    <div style={{ position: 'relative', marginTop: 4 }}>
                      <button
                        onClick={() => setAudienceOpen(o => !o)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(var(--overlay-rgb),0.05)', border: '1px solid rgba(var(--overlay-rgb),0.09)',
                          borderRadius: 7, padding: '3px 9px', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
                        }}
                      >
                        <Globe size={12} /> {audience} <ChevronDown size={12} />
                      </button>

                      {audienceOpen && (
                        <>
                          <div
                            onClick={() => setAudienceOpen(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                          />
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 11,
                            background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12,
                            padding: 6, minWidth: 150, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                          }}>
                            {audienceOptions.map(opt => (
                              <button
                                key={opt}
                                onClick={() => { setAudience(opt); setAudienceOpen(false) }}
                                style={{
                                  display: 'flex', alignItems: 'center', width: '100%',
                                  padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                  fontSize: 13, fontWeight: opt === audience ? 700 : 500,
                                  color: opt === audience ? '#d9b48f' : 'var(--text-2)',
                                  background: opt === audience ? 'rgba(212,165,116,0.1)' : 'transparent',
                                  textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (opt !== audience) e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.05)' }}
                                onMouseLeave={e => { if (opt !== audience) e.currentTarget.style.background = 'transparent' }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, MAX_LEN))}
                  placeholder="Nội dung thông báo..."
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                    fontSize: 19, color: 'var(--text)', lineHeight: 1.6, fontFamily: 'inherit', scrollbarWidth: 'none',
                  }}
                />

                {/* Char count */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{text.length} / {MAX_LEN}</span>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${text.length > 0 ? '#6f8f4f' : 'rgba(var(--overlay-rgb),0.18)'}`,
                    }} />
                  </div>
                </div>

                {/* Dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {imagePreview ? (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      {isVideoFile ? (
                        <video src={imagePreview} controls style={{ maxWidth: '100%', maxHeight: 360, width: 'auto', height: 'auto', display: 'block', borderRadius: 14, background: '#000' }} />
                      ) : (
                        <img src={imagePreview} alt="" style={{ maxWidth: '100%', maxHeight: 360, width: 'auto', height: 'auto', display: 'block', borderRadius: 14 }} />
                      )}
                      <button
                        onClick={removeImage}
                        style={{
                          position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 8,
                          background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '1.5px dashed rgba(212,165,116,0.3)', borderRadius: 14,
                    padding: '26px 0', marginBottom: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    background: 'rgba(212,165,116,0.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {[ImageIcon, Video].map((Icon, i) => (
                        <button key={i} onClick={() => fileInputRef.current?.click()} style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: 'rgba(212,165,116,0.12)', border: '1px solid rgba(212,165,116,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#d9b48f', cursor: 'pointer',
                        }}>
                          <Icon size={19} />
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-3)', textAlign: 'center' }}>
                      Kéo và thả tệp vào đây<br />
                      hoặc <span onClick={() => fileInputRef.current?.click()} style={{ color: '#d9b48f', fontWeight: 600, cursor: 'pointer' }}>nhấn để chọn tệp</span>
                    </p>
                  </div>
                )}

                {error && (
                  <p style={{ fontSize: 13, color: '#f87171', marginBottom: 14 }}>{error}</p>
                )}

              </div>

              {/* Footer toolbar */}
              <div style={{
                padding: '14px 24px', borderTop: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              }}>
                <div style={{ display: 'flex' }}>
                  <button
                    disabled={!canPost}
                    onClick={handlePost}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 22px', borderRadius: 12, border: 'none',
                      cursor: canPost ? 'pointer' : 'not-allowed',
                      fontSize: 14, fontWeight: 700,
                      background: canPost ? 'linear-gradient(125deg,#c1793d,#8b4a28)' : 'rgba(var(--overlay-rgb),0.06)',
                      color: canPost ? '#fff' : 'var(--text-3)',
                      boxShadow: canPost ? '0 4px 16px rgba(193,121,61,0.35)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <Send size={14} /> {posting ? (uploadProgress != null ? `Đang tải lên... ${uploadProgress}%` : 'Đang đăng...') : 'Đăng'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Post Options */}
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '16px 18px' }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Tùy chọn bài viết</span>

              <div style={{ marginTop: 6 }}>
                <OptionRow
                  icon={MessageCircle}
                  label="Ai có thể bình luận?"
                  onClick={() => setCommentMenuOpen(o => !o)}
                  trailing={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: '#d9b48f', fontWeight: 600 }}>
                      {commentOptions.find(o => o.value === commentPermission)?.label} <ChevronRight size={13} />
                    </span>
                  }
                />
                {commentMenuOpen && (
                  <>
                    <div onClick={() => setCommentMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                    <div style={{
                      position: 'relative', zIndex: 11, marginBottom: 6,
                      background: 'var(--surface-2)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 5,
                    }}>
                      {commentOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setCommentPermission(opt.value); setCommentMenuOpen(false) }}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '7px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: opt.value === commentPermission ? 700 : 500,
                            color: opt.value === commentPermission ? '#d9b48f' : 'var(--text-2)',
                            background: opt.value === commentPermission ? 'rgba(212,165,116,0.1)' : 'transparent',
                            textAlign: 'left',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
