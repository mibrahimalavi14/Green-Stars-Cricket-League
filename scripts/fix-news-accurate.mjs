import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Fix 1: Opening Weekend Preview — fix inaccuracies
const news1 = await p.news.findUnique({ where: { slug: "opening-weekend-preview" } })
if (news1) {
  await p.news.update({
    where: { id: news1.id },
    data: {
      title: "Opening Weekend — 6 Teams, 6 Matches, Non-Stop Action!",
      content: `The wait is finally over! GSCL Season 1 kicks off this Friday, 17 July, at Al-Kabir Cricket Road, Lahore with a blockbuster opening weekend featuring 6 matches across 2 days.

𝗙𝗿𝗶 𝟭𝟳 𝗝𝘂𝗹𝘆 — 𝗔𝗹-𝗞𝗮𝗯𝗶𝗿 𝗖𝗿𝗶𝗰𝗸𝗲𝘁 𝗥𝗼𝗮𝗱
Match 1 — Alpha Warriors vs Dragon Knights (4:00 PM)
Match 2 — Elite Rangers vs Power Panthers (5:00 PM)
Match 3 — Falcon Strikers vs Legends XI (6:00 PM)

𝗦𝗮𝘁 𝟭𝟴 𝗝𝘂𝗹𝘆 — 𝗔𝗪𝗧 𝗖𝗿𝗶𝗰𝗸𝗲𝘁 𝗚𝗿𝗼𝘂𝗻𝗱
Match 4 — Alpha Warriors vs Power Panthers (4:00 PM)
Match 5 — Dragon Knights vs Legends XI (5:00 PM)
Match 6 — Elite Rangers vs Falcon Strikers (6:00 PM)

All matches will be streamed live on YouTube. Stay tuned for the biggest cricket league in town! #GSCLSeason1`,
      excerpt: "6 matches, 2 days, all 6 teams in action — the season kicks off 17 July!",
      type: "schedule",
    }
  })
  console.log("Fixed: Opening Weekend Preview")
}

// Fix 2: Elite Rangers — add more accurate player details
const news2 = await p.news.findUnique({ where: { slug: "elite-rangers-season-1-preview" } })
if (news2) {
  await p.news.update({
    where: { id: news2.id },
    data: {
      content: `Elite Rangers enter GSCL Season 1 as one of the strongest squads on paper. With a perfect blend of aggressive batting and disciplined bowling, the Rangers are looking to live up to their name.

Key Players to Watch:
• Farhan Rasool — Right-handed opening batter, known for clean hitting
• Ali Raza — Right-arm fast bowler with a deadly yorker
• Ibrahim Alavi — Right-handed batter and right-arm fast bowler, a genuine all-rounder

Captain's Message: "We've prepared hard. The boys are ready. Our goal is clear — bring the trophy home."`,
    }
  })
  console.log("Fixed: Elite Rangers")
}

// Fix 3: Legends XI — add more accurate detail
const news3 = await p.news.findUnique({ where: { slug: "legends-xi-dark-horses" } })
if (news3) {
  await p.news.update({
    where: { id: news3.id },
    data: {
      content: `Don't let the name fool you — Legends XI are not just about experience, they're about attitude. With a young core and dynamic leadership, this team could be the surprise package of Season 1.

Strengths:
• Explosive batting lineup with left-right combinations
• Versatile bowling attack with pace and spin options
• Sharp fielding unit and athletic ground coverage

The Legends have been training hard and are ready to make a statement. Watch out for them!`,
    }
  })
  console.log("Fixed: Legends XI")
}

await p.$disconnect()
console.log("All fixed!")
