"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"

export default function AdminGalleryPage() {
  const [images, setImages] = useState<any[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchImages() }, [])

  async function fetchImages() {
    const res = await fetch("/api/gallery")
    const data = await res.json()
    setImages(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function addImage() {
    if (!imageUrl.trim()) return
    setAdding(true)
    await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: imageUrl.trim(), caption: caption.trim() }),
    })
    setImageUrl("")
    setCaption("")
    setAdding(false)
    fetchImages()
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this image?")) return
    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" })
    fetchImages()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Gallery Management</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Add or remove photos from the public gallery</p>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 font-semibold">Add New Image</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" required
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
          <button onClick={addImage} disabled={!imageUrl.trim() || adding}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">No images yet</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map(img => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-[var(--border)]">
              <img src={img.imageUrl} alt={img.caption || "Gallery"} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/40">
                <button onClick={() => deleteImage(img.id)} className="rounded-full bg-red-500 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
              </div>
              {img.caption && <p className="p-2 text-sm">{img.caption}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
