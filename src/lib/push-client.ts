"use client"

export const PUSH_SUBSCRIBED_EVENT = "gscl:push-subscribed"
export const PUSH_UNSUBSCRIBED_EVENT = "gscl:push-unsubscribed"

let vapidKeyPromise: Promise<string> | null = null

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
}

export function getVapidKey(): Promise<string> {
  if (!vapidKeyPromise) {
    vapidKeyPromise = fetch("/api/notifications/vapid-public-key")
      .then((r) => r.json())
      .then((d) => d.publicKey as string)
      .catch(() => {
        throw new Error("VAPID key not loaded")
      })
  }
  return vapidKeyPromise
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return await reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

export type PushResult = { ok: boolean; message: string }

export async function subscribeToPush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, message: "Push not supported" }

  const existing = await getPushSubscription()
  if (existing) {
    window.dispatchEvent(new Event(PUSH_SUBSCRIBED_EVENT))
    return { ok: true, message: "Already subscribed" }
  }

  let permission: NotificationPermission
  try {
    permission = await Notification.requestPermission()
  } catch {
    permission = Notification.permission
  }
  if (permission !== "granted") return { ok: false, message: "Permission denied" }

  try {
    const vapidKey = await getVapidKey()
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    })

    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      }),
    })
    if (!res.ok) {
      await sub.unsubscribe().catch(() => {})
      return { ok: false, message: "Failed to save subscription" }
    }

    window.dispatchEvent(new Event(PUSH_SUBSCRIBED_EVENT))
    return { ok: true, message: "Notifications enabled!" }
  } catch {
    return { ok: false, message: "Failed to enable notifications" }
  }
}

export async function unsubscribeFromPush(): Promise<PushResult> {
  if (!isPushSupported()) return { ok: false, message: "Push not supported" }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    window.dispatchEvent(new Event(PUSH_UNSUBSCRIBED_EVENT))
    return { ok: true, message: "Notifications disabled" }
  } catch {
    return { ok: false, message: "Failed to unsubscribe" }
  }
}
