"use client"

import { useState, useEffect } from "react"
import { Image, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react"

export default function GalleryPage() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/gallery").then(r => r.json()).then(data => {
      setImages(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  function next() { if (selected !== null) setSelected(Math.min(selected + 1, images.length - 1)) }
  function prev() { if (selected !== null) setSelected(Math.max(selected - 1, 0)) }

  if (loading) {
    return <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Photo Gallery</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Moments from Green Stars Cricket League matches</p>

      {images.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Image className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No photos yet. Check back soon!</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {images.map((img, i) => (
            <button key={img.id} onClick={() => setSelected(i)} className="group mb-4 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] text-left transition-all hover:shadow-lg">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={img.imageUrl} alt={img.caption || "Gallery image"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              {img.caption && <p className="p-3 text-sm">{img.caption}</p>}
            </button>
          ))}
        </div>
      )}

      {selected !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelected(null)}>
          <button onClick={(e) => { e.stopPropagation(); setSelected(null) }} className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white"><X className="h-6 w-6" /></button>
          {selected > 0 && <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white"><ChevronLeft className="h-6 w-6" /></button>}
          {selected < images.length - 1 && <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-4 top-1/2 z-10 rounded-full bg-black/50 p-2 text-white"><ChevronRight className="h-6 w-6" /></button>}
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img src={images[selected].imageUrl} alt={images[selected].caption || ""} className="max-h-[85vh] rounded-lg object-contain" />
            {images[selected].caption && <p className="mt-2 text-center text-sm text-white">{images[selected].caption}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
