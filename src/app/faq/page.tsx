"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  { q: "What is GSCL?", a: "Green Stars Cricket League (GSCL) is a grassroots cricket league based in Haripur, Pakistan. It features 8 teams competing in a fast-paced 4-over format, with a focus on discovering and nurturing local cricketing talent." },
  { q: "How many teams are there?", a: "GSCL currently has 8 teams: Alpha Warriors, Dragon Knights, Elite Rangers, Falcon Strikers, Green Gladiators, Legends XI, Power Panthers, and Thunder Hawks." },
  { q: "What format does GSCL follow?", a: "The league follows a 4-over per side format. Each season consists of a round-robin league stage followed by playoffs, culminating in a grand final." },
  { q: "Where are matches played?", a: "All matches are played in Haripur, Pakistan. Specific venue details are announced along with the match schedule." },
  { q: "How can I watch matches?", a: "Matches are live-streamed on our YouTube channel. You can also follow live scores and updates on our website." },
  { q: "How are points awarded?", a: "Win = 2 points, Tie/No Result = 1 point, Loss = 0 points. Net Run Rate (NRR) is used as a tiebreaker." },
  { q: "Can I contact the league management?", a: "Yes, use the Contact page to send us a message. You can also reach us via email or social media." },
  { q: "How do I leave a review?", a: "Scroll to the Reviews section on the home page, rate us out of 5 stars, and leave your comment. Reviews are moderated before being published." },
  { q: "Is the website available offline?", a: "Yes! GSCL is a Progressive Web App (PWA). You can install it on your device and access cached pages even without internet." },
  { q: "Who manages the league?", a: "GSCL is founded and managed by Muhammad Ibrahim Alavi and a dedicated team of cricket enthusiasts." },
]

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Frequently Asked Questions</h1>
      <p className="mb-10 text-sm text-[var(--muted-foreground)]">Everything you need to know about GSCL</p>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[var(--border)]">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--muted)]/50">
              <span className="pr-4 text-sm font-semibold">{faq.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openIdx === i ? "max-h-96" : "max-h-0"}`}>
              <p className="border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted-foreground)]">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
