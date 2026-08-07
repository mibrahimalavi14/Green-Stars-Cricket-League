import nodemailer from "nodemailer"
import { after } from "next/server"

interface SendOtpEmailArgs {
  email: string
  name?: string
  otp: string
  subject: string
  purpose: string
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendOtpEmail({ email, name, otp, subject, purpose }: SendOtpEmailArgs) {
  const transporter = createTransporter()

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

interface AdminNotificationData {
  title: string
  rows: { label: string; value: string }[]
  message?: string
}

export async function sendAdminNotification({ title, rows, message }: AdminNotificationData) {
  const transporter = createTransporter()
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "mibrahimalavi14@gmail.com"

  const rowsHtml = rows
    .filter(r => r.value)
    .map(r => `<tr><td style="padding:6px 0;color:#6b7280;width:40%">${r.label}</td><td style="padding:6px 0;font-weight:600">${r.value}</td></tr>`)
    .join("")

  await transporter.sendMail({
    from: `"Green Stars Cricket League" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: title,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#2563eb">${title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
      ${message ? `<p style="color:#6b7280;font-size:13px;margin:12px 0 4px">Details:</p><div style="white-space:pre-wrap;padding:12px;background:#f3f4f6;border-radius:8px;font-size:14px">${message}</div>` : ""}
      <p style="color:#6b7280;font-size:12px;margin-top:16px">This is an automated notification from the GSCL website.</p>
    </div>`,
  })
}

export function notifyAdmin(data: AdminNotificationData) {
  after(async () => {
    try {
      await sendAdminNotification(data)
    } catch (err) {
      console.error("Admin notification failed:", err)
    }
  })
}
