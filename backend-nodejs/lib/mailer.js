import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!process.env.SMTP_HOST) return null

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
  return transporter
}

export async function sendPasswordResetEmail(to, resetLink) {
  const t = getTransporter()

  if (!t) {
    console.log(`[mailer] SMTP chưa được cấu hình trong .env (thiếu SMTP_HOST). Link đặt lại mật khẩu cho ${to}:\n  ${resetLink}`)
    return
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || 'NOVA <no-reply@nova.local>',
    to,
    subject: 'Đặt lại mật khẩu NOVA',
    html: `
      <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản NOVA của bạn.</p>
      <p><a href="${resetLink}">Nhấn vào đây để đặt lại mật khẩu</a> (liên kết hết hạn sau 1 giờ).</p>
      <p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
    `,
  })
}
