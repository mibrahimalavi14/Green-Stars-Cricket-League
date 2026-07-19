"use client"

import { Download } from "lucide-react"

export function DownloadCSVButton({ data, filename, columns }: { data: Record<string, any>[]; filename: string; columns: { key: string; label: string }[] }) {
  function download() {
    const header = columns.map(c => c.label).join(",")
    const rows = data.map(row => columns.map(c => {
      const v = row[c.key]
      return typeof v === "string" && (v.includes(",") || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    }).join(","))
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={download} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--muted)]">
      <Download className="h-3.5 w-3.5" /> CSV
    </button>
  )
}
