export async function verifyRecaptchaToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return false

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      cache: "no-store",
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error("reCAPTCHA verify error:", err)
    return false
  }
}
