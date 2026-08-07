import nodemailer from "nodemailer"

interface SendOtpEmailArgs {
  email: string
  name?: string
  otp: string
  subject: string
  purpose: string
}

export async function sendOtpEmail({ email, name, otp, subject, purpose }: SendOtpEmailArgs) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Green Stars Cricket League" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#2563eb">Green Stars Cricket League</h2>
      <p>Hi ${name || "there"},</p>
      <p>Use this OTP to verify your email for ${purpose}:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;background:#f3f4f6;border-radius:8px;margin:16px 0">${otp}</div>
      <p style="color:#6b7280;font-size:14px">This code expires in 5 minutes.</p>
      <p style="color:#6b7280;font-size:14px">If you did not request this, please ignore this email.</p>
    </div>`,
  })
}
