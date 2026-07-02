# GREEN STARS CRICKET LEAGUE — Complete Guide

## 📂 Website Structure

```
D:\Green Stars Cricket League\
├── prisma/               # Database schema + seed
│   ├── schema.prisma     # Database tables definition
│   ├── seed.ts           # Empty season seeder
│   └── dev.db            # SQLite database (auto-created)
├── src/
│   ├── app/              # All pages
│   │   ├── page.tsx          # Home page
│   │   ├── teams/            # Teams list & detail
│   │   ├── players/          # Players list & detail
│   │   ├── fixtures/         # Fixtures & results
│   │   ├── points-table/     # Automatic points table
│   │   ├── predictions/      # Predictions (Google auth required)
│   │   ├── news/             # News articles
│   │   ├── contact/          # Contact form
│   │   ├── live/             # Live scoring
│   │   ├── admin/            # Admin panel
│   │   └── api/              # API routes
│   ├── components/       # Reusable components
│   └── lib/              # Utilities (auth, prisma, utils)
├── public/               # Static files
├── .env                  # Environment variables
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 How to Run Locally (Dev Mode)

Open PowerShell/CMD in the project folder and run:

```bash
# First time only:
npm install
npx prisma generate
npx prisma db push

# For local development (if Turbopack doesn't work):
npm run dev:webpack

# If Turbopack works (normal):
npm run dev
```

Website will open at: **http://localhost:3000**

---

## 🌐 Deploy on Vercel (FREE)

### Step 1: Push to GitHub
1. Create an account on github.com
2. Create a new repository (private or public)
3. In the project folder:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to vercel.com and sign in with GitHub
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: . (leave default)
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: .next (auto)

### Step 3: Environment Variables (VERCEL)
In Vercel project settings → Environment Variables, add:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Your database URL | Use Supabase (free) or Turso (free) |
| `NEXTAUTH_SECRET` | Any random string | `openssl rand -base64 32` se banao |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Your Vercel domain |
| `AUTH_GOOGLE_ID` | From Google Cloud Console | ✅ Required for predictions |
| `AUTH_GOOGLE_SECRET` | From Google Cloud Console | ✅ Required for predictions |

### Step 4: Database Options
Since Vercel doesn't support SQLite, you need a cloud database:

**Option A: Supabase (Recommended - FREE)**
1. Create account at supabase.com
2. New project → Copy `Connection string`
3. Add as `DATABASE_URL` in Vercel env vars
4. Update `prisma/schema.prisma` → change `provider = "sqlite"` to `provider = "postgresql"`
5. Run: `npx prisma generate` and `npx prisma db push`

**Option B: Turso (FREE - SQLite compatible)**
1. Create account at turso.tech
2. Create database → Copy URL + auth token
3. Add as `DATABASE_URL` in Vercel env vars

### Step 5: Custom Domain
1. In Vercel dashboard → Project → Settings → Domains
2. Add your domain (e.g., `gscl.pk`)
3. Update your domain's nameservers to Vercel's
4. Wait for DNS propagation (5-30 mins)
5. ✅ Done!

---

## 📝 Google OAuth Setup (For Predictions)

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `GSCL`
7. Authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
8. Copy **Client ID** and **Client Secret** to `.env` file

---

## 🔧 Admin Panel Features

After deployment, visit: `https://your-domain.com/admin`

**Login required** (only logged-in users can access admin)

### What you can do from admin:
1. **Seasons** → Create seasons, **Lock/Unlock predictions**
2. **Teams** → Add teams (name, short name, color)
3. **Players** → Add players to teams
4. **Matches** → Schedule matches, set Live/Completed
5. **News** → Publish news articles

### How it works:
- **Points table** auto-calculates from match results
- **Predictions lock**: Jab season ka schedule announce ho jaye, admin panel mein "Lock Predictions" press karo. Uske baad koi naya prediction nahi daal sakta, sirf dekh sakta hai.
- **Live scoring**: Match ko "Live" karo, phir `/live` page par score dikhega

---

## 📱 Website Pages

| Page | URL | Description |
|---|---|---|
| 🏠 Home | `/` | Hero, upcoming matches, teams, points table, news |
| 👥 Teams | `/teams` | All teams with players count |
| 👤 Team Detail | `/teams/[id]` | Team players + match history |
| 🏏 Players | `/players` | All players with stats |
| 📊 Player Profile | `/players/[id]` | Full stats (runs, wickets, SR, economy) |
| 📅 Fixtures | `/fixtures` | Upcoming + live + completed matches |
| 📈 Points Table | `/points-table` | Auto-calculated standings (P, W, L, Pts, NRR) |
| 🔮 Predictions | `/predictions` | Google sign-in required, auto-locks |
| 📰 News | `/news` | Latest articles |
| 📞 Contact | `/contact` | Contact form |
| ⏱ Live | `/live` | Live scoring with ball-by-ball |
| 🔐 Admin | `/admin` | Manage everything |

---

## ✅ Features List

- [x] Dark/Light mode toggle
- [x] Teams & Players management
- [x] Auto-calculated points table (NRR, rankings)
- [x] Fixtures with upcoming/live/completed
- [x] Live scoring with ball-by-ball
- [x] Predictions with Google sign-in
- [x] Auto-lock predictions when schedule announced
- [x] YouTube live stream section
- [x] News articles
- [x] Contact form
- [x] Social media links (Facebook, Twitter, Instagram, YouTube)
- [x] SEO optimized (sitemap.xml, robots.txt)
- [x] Google Search Console ready
- [x] Custom domain support
- [x] Mobile responsive
- [x] Admin dashboard
- [x] API routes for all CRUD operations

---

## ❓ Need Help?

If something doesn't work, just tell me! Main aapko step-by-step guide karunga.
