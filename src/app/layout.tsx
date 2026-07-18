import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ScrollToTop } from "@/components/ScrollToTop"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Green Stars Cricket League",
  description: "Official website of the Green Stars Cricket League - Live scores, fixtures, points table, and more.",
  keywords: "cricket, league, green stars, live scores, points table, fixtures",
   verification: { google: "9GpvNowTy-MC4IfMX2UvZrm0WhGtxaVgC2btzs2XAwA" },
  icons: {
    icon: [{ url: "/images/logo/gscl-logo.png", type: "image/png" }],
    apple: "/images/logo/gscl-logo.png",
  },
  openGraph: {
    title: "Green Stars Cricket League",
    description: "Official website of the Green Stars Cricket League - Live scores, fixtures, points table, and more.",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Stars Cricket League",
    description: "Official website of the Green Stars Cricket League",
    images: ["/og"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollToTop />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
