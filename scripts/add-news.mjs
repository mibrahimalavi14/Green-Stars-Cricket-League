import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const newsItems = [
  {
    title: "Opening Weekend Preview — 6 Blocks, 12 Matches, Non-Stop Action!",
    slug: "opening-weekend-preview",
    content: `The wait is finally over! GSCL Season 1 kicks off this Friday, 17 July, at Al-Kabir Cricket Road, Lahore with a blockbuster opening weekend featuring 12 matches across 2 days.

Day 1 (Fri 17 July) — Al-Kabir Cricket Road
Match 1: Elite Rangers vs Dragon Knights (4:00 PM)
Match 2: Falcon Strikers vs Legends XI (5:00 PM)
Match 3: Power Panthers vs Alpha Warriors (6:00 PM)

Day 2 (Sat 18 July) — AWT Cricket Ground
4 matches starting from 4:00 PM

All matches will be streamed live on YouTube. Stay tuned for the biggest cricket league in town! #GSCLSeason1`,
    excerpt: "12 matches, 2 days, 6 teams — the season kicks off 17 July at Al-Kabir Cricket Road!",
    type: "match",
    published: true,
    createdAt: new Date("2026-07-15T10:00:00.000Z")
  },
  {
    title: "Elite Rangers — Favourites to Win Season 1?",
    slug: "elite-rangers-season-1-preview",
    content: `Elite Rangers enter GSCL Season 1 as one of the strongest squads on paper. With a perfect blend of aggressive batting and disciplined bowling, the Rangers are looking to live up to their name.

Key Players to Watch:
- Farhan Rasool — The opening batter has been in sublime form
- Ali Raza — Wicket-taking bowler with a deadly yorker
- Ibrahim Alavi — All-rounder who can turn the game single-handedly

Captain's Message: "We've prepared hard. The boys are ready. Our goal is clear — bring the trophy home."`,
    excerpt: "Strong squad, balanced attack, and a clear vision — can the Rangers lift the trophy?",
    type: "team",
    published: true,
    createdAt: new Date("2026-07-15T14:00:00.000Z")
  },
  {
    title: "GSCL Confirms Live Streaming Partnership with YouTube",
    slug: "gscl-youtube-streaming-partnership",
    content: `Great news for fans! All GSCL Season 1 matches will be streamed LIVE on the official Green Stars Cricket League YouTube channel.

Subscribe now: https://www.youtube.com/@GreenStarsCricketLeague

Match timings:
- Weekdays: 4:00 PM start
- Weekends: 11:00 AM start

Don't miss a single ball — hit the bell icon to get notified when we go live!`,
    excerpt: "Every match of Season 1 will be streamed live on YouTube — subscribe now!",
    type: "general",
    published: true,
    createdAt: new Date("2026-07-15T18:00:00.000Z")
  },
  {
    title: "Legends XI — Dark Horses of GSCL Season 1",
    slug: "legends-xi-dark-horses",
    content: `Don't let the name fool you — Legends XI are not just about experience, they're about attitude. With a young core and dynamic leadership, this team could be the surprise package of Season 1.

Strengths:
- Explosive middle order
- Variety in bowling attack
- Sharp fielding unit

The Legends have been training in secrecy and are ready to make a statement. Watch out for them!`,
    excerpt: "Young, hungry, and ready to shock the league — why Legends XI could be this season's surprise package.",
    type: "team",
    published: true,
    createdAt: new Date("2026-07-15T20:00:00.000Z")
  }
]

for (const item of newsItems) {
  const existing = await p.news.findUnique({ where: { slug: item.slug } })
  if (existing) {
    console.log(`Skipping existing: ${item.slug}`)
    continue
  }
  await p.news.create({ data: item })
  console.log(`Created: ${item.slug}`)
}

await p.$disconnect()
console.log("Done!")
