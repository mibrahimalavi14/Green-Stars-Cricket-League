import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://green-stars-cricket-league.vercel.app/sitemap.xml",
  }
}
