import { MATCH_CONFIG } from "./config"

export function calculatePoints(teamStats: {
  won: number
  lost: number
  tied: number
  nr: number
}) {
  return teamStats.won * MATCH_CONFIG.pointsWin + teamStats.tied * MATCH_CONFIG.pointsTie + teamStats.nr * MATCH_CONFIG.pointsNoResult
}

export function calculateNRR(
  forRuns: number,
  forOvers: number,
  againstRuns: number,
  againstOvers: number
) {
  if (forOvers === 0 || againstOvers === 0) return 0
  return Number(
    (
      forRuns / forOvers -
      againstRuns / againstOvers
    ).toFixed(3)
  )
}

export function relativeDateLabel(date: Date, timeZone = "Asia/Karachi") {
  const now = new Date()
  const nowPKT = new Date(now.toLocaleString("en-US", { timeZone }))
  const datePKT = new Date(date.toLocaleString("en-US", { timeZone }))
  const today = nowPKT.toDateString()
  const target = datePKT.toDateString()
  if (target === today) return { label: "Today", className: "text-green-600 font-semibold" }
  const tomorrow = new Date(nowPKT)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (target === tomorrow.toDateString()) return { label: "Tomorrow", className: "text-amber-600 font-semibold" }
  const yesterday = new Date(nowPKT)
  yesterday.setDate(yesterday.getDate() - 1)
  if (target === yesterday.toDateString()) return { label: "Yesterday", className: "text-red-500 font-semibold" }
  return { label: "", className: "" }
}

const venueCoordinates: Record<string, string> = {
  "Plot 134, Block B Awt Housing Scheme Phase 2 AWT Phase 2, Haripur, Pakistan": "Plot+134+Block+B+AWT+Housing+Scheme+Phase+2+Haripur",
}

export function getVenueMapsUrl(venue: string): string | null {
  const coords = venueCoordinates[venue]
  if (coords) return `https://www.google.com/maps/search/${coords}`
  return null
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateTime(date: string | Date) {
  return `${formatDate(date)} · ${formatTime(date)}`
}

export function formatDateTimePKT(date: string | Date) {
  return new Date(date).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  // South Asia
  "Asia/Karachi": "PKT",
  "Asia/Kolkata": "IST",
  "Asia/Colombo": "IST",
  "Asia/Kathmandu": "NPT",
  "Asia/Dhaka": "BST",
  "Asia/Thimphu": "BTT",
  "Asia/Kabul": "AFT",
  "Asia/Tehran": "IRST",
  "Asia/Tashkent": "UZT",
  "Asia/Almaty": "ALMT",
  "Asia/Bishkek": "KGT",
  "Asia/Dushanbe": "TJT",
  "Asia/Ashgabat": "TMT",
  "Asia/Baku": "AZT",
  "Asia/Tbilisi": "GET",
  "Asia/Yerevan": "AMT",
  // Southeast Asia
  "Asia/Yangon": "MMT",
  "Asia/Bangkok": "ICT",
  "Asia/Phnom_Penh": "ICT",
  "Asia/Vientiane": "ICT",
  "Asia/Ho_Chi_Minh": "ICT",
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
  "Asia/Kuala_Lumpur": "MYT",
  "Asia/Singapore": "SGT",
  "Asia/Manila": "PHT",
  "Asia/Brunei": "BNT",
  // East Asia
  "Asia/Shanghai": "CST",
  "Asia/Hong_Kong": "HKT",
  "Asia/Macau": "CST",
  "Asia/Taipei": "CST",
  "Asia/Seoul": "KST",
  "Asia/Tokyo": "JST",
  "Asia/Ulaanbaatar": "ULAT",
  // Russia
  "Asia/Novosibirsk": "NOVT",
  "Asia/Krasnoyarsk": "KRAT",
  "Asia/Irkutsk": "IRKT",
  "Asia/Yakutsk": "YAKT",
  "Asia/Vladivostok": "VLAT",
  "Asia/Magadan": "MAGT",
  "Asia/Kamchatka": "PETT",
  "Asia/Yekaterinburg": "YEKT",
  "Asia/Omsk": "OMST",
  "Asia/Chita": "CHOT",
  "Asia/Sakhalin": "SAKT",
  "Asia/Anadyr": "ANAT",
  // Middle East
  "Asia/Calcutta": "IST",
  "Asia/Saigon": "ICT",
  "Asia/Rangoon": "MMT",
  "Asia/Dili": "TLT",
  "Asia/Jerusalem": "IST",
  "Asia/Amman": "EET",
  "Asia/Beirut": "EET",
  "Asia/Damascus": "EET",
  "Asia/Gaza": "EET",
  "Asia/Nicosia": "EET",
  "Asia/Famagusta": "EET",
  "Asia/Ankara": "TRT",
  "Asia/Istanbul": "TRT",
  "Asia/Riyadh": "AST",
  "Asia/Kuwait": "AST",
  "Asia/Qatar": "AST",
  "Asia/Bahrain": "AST",
  "Asia/Aden": "AST",
  "Asia/Doha": "AST",
  "Asia/Baghdad": "AST",
  "Asia/Muscat": "GST",
  "Asia/Dubai": "GST",
  // Europe
  "Europe/London": "GMT",
  "Europe/Dublin": "GMT",
  "Europe/Lisbon": "WET",
  "Europe/Madrid": "CET",
  "Europe/Paris": "CET",
  "Europe/Berlin": "CET",
  "Europe/Rome": "CET",
  "Europe/Amsterdam": "CET",
  "Europe/Brussels": "CET",
  "Europe/Vienna": "CET",
  "Europe/Prague": "CET",
  "Europe/Warsaw": "CET",
  "Europe/Budapest": "CET",
  "Europe/Zurich": "CET",
  "Europe/Stockholm": "CET",
  "Europe/Oslo": "CET",
  "Europe/Copenhagen": "CET",
  "Europe/Belgrade": "CET",
  "Europe/Athens": "EET",
  "Europe/Bucharest": "EET",
  "Europe/Sofia": "EET",
  "Europe/Helsinki": "EET",
  "Europe/Kyiv": "EET",
  "Europe/Chisinau": "EET",
  "Europe/Riga": "EET",
  "Europe/Tallinn": "EET",
  "Europe/Vilnius": "EET",
  "Europe/Moscow": "MSK",
  "Europe/Minsk": "MSK",
  "Europe/Kaliningrad": "EET",
  "Europe/Volgograd": "MSK",
  "Europe/Samara": "SAMT",
  "Europe/Simferopol": "MSK",
  "Europe/Istanbul": "TRT",
  "Europe/Kiev": "EET",
  "Europe/Reykjavik": "GMT",
  "Europe/Uzhgorod": "EET",
  "Europe/Zaporozhye": "EET",
  // Africa
  "Africa/Cairo": "EET",
  "Africa/Tripoli": "EET",
  "Africa/Algiers": "CET",
  "Africa/Tunis": "CET",
  "Africa/Casablanca": "+01",
  "Africa/El_Aaiun": "+01",
  "Africa/Abidjan": "GMT",
  "Africa/Accra": "GMT",
  "Africa/Dakar": "GMT",
  "Africa/Sao_Tome": "GMT",
  "Africa/Bissau": "GMT",
  "Africa/Banjul": "GMT",
  "Africa/Conakry": "GMT",
  "Africa/Freetown": "GMT",
  "Africa/Monrovia": "GMT",
  "Africa/Nouakchott": "GMT",
  "Africa/Ouagadougou": "GMT",
  "Africa/Lome": "GMT",
  "Africa/Lagos": "WAT",
  "Africa/Niamey": "WAT",
  "Africa/Kinshasa": "WAT",
  "Africa/Luanda": "WAT",
  "Africa/Brazzaville": "WAT",
  "Africa/Ndjamena": "WAT",
  "Africa/Douala": "WAT",
  "Africa/Ceuta": "CET",
  "Africa/Windhoek": "CAT",
  "Africa/Harare": "CAT",
  "Africa/Lusaka": "CAT",
  "Africa/Maputo": "CAT",
  "Africa/Gaborone": "CAT",
  "Africa/Kigali": "CAT",
  "Africa/Blantyre": "CAT",
  "Africa/Bujumbura": "CAT",
  "Africa/Lubumbashi": "CAT",
  "Africa/Khartoum": "CAT",
  "Africa/Juba": "CAT",
  "Africa/Johannesburg": "SAST",
  "Africa/Mbabane": "SAST",
  "Africa/Maseru": "SAST",
  "Africa/Nairobi": "EAT",
  "Africa/Addis_Ababa": "EAT",
  "Africa/Dar_es_Salaam": "EAT",
  "Africa/Kampala": "EAT",
  "Africa/Mogadishu": "EAT",
  "Africa/Asmara": "EAT",
  "Africa/Djibouti": "EAT",
  // North & Central America
  "America/New_York": "EST",
  "America/Chicago": "CST",
  "America/Denver": "MST",
  "America/Los_Angeles": "PST",
  "America/Toronto": "EST",
  "America/Vancouver": "PST",
  "America/Halifax": "AST",
  "America/St_Johns": "NST",
  "America/Winnipeg": "CST",
  "America/Edmonton": "MST",
  "America/Regina": "CST",
  "America/Swift_Current": "CST",
  "America/Boise": "MST",
  "America/Phoenix": "MST",
  "America/Anchorage": "AKST",
  "America/Juneau": "AKST",
  "America/Honolulu": "HST",
  "America/Mexico_City": "CST",
  "America/Monterrey": "CST",
  "America/Tijuana": "PST",
  "America/Chihuahua": "MST",
  "America/Merida": "CST",
  "America/Guatemala": "CST",
  "America/Belize": "CST",
  "America/El_Salvador": "CST",
  "America/Tegucigalpa": "CST",
  "America/Managua": "CST",
  "America/Costa_Rica": "CST",
  "America/Panama": "EST",
  "America/Jamaica": "EST",
  "America/Havana": "CST",
  "America/Nassau": "EST",
  "America/Puerto_Rico": "AST",
  "America/Santo_Domingo": "AST",
  "America/Port-au-Prince": "EST",
  "America/Port_of_Spain": "AST",
  // South America
  "America/Caracas": "VET",
  "America/Bogota": "COT",
  "America/Lima": "PET",
  "America/Guayaquil": "ECT",
  "America/La_Paz": "BOT",
  "America/Santiago": "CLT",
  "America/Asuncion": "PYT",
  "America/Montevideo": "UYT",
  "America/Argentina/Buenos_Aires": "ART",
  "America/Argentina/Cordoba": "ART",
  "America/Sao_Paulo": "BRT",
  "America/Rio_Branco": "ACT",
  "America/Manaus": "AMT",
  "America/Cayenne": "GFT",
  "America/Paramaribo": "SRT",
  "America/Curacao": "AST",
  "America/Aruba": "AST",
  "America/Barbados": "AST",
  "America/St_Lucia": "AST",
  "America/Grenada": "AST",
  "America/Guadeloupe": "AST",
  "America/Antigua": "AST",
  "America/Dominica": "AST",
  "America/Guyana": "GYT",
  "America/Godthab": "WGT",
  "America/Thule": "AST",
  "America/Miquelon": "PMST",
  // Australia & Pacific
  "Australia/Sydney": "AEST",
  "Australia/Melbourne": "AEST",
  "Australia/Brisbane": "AEST",
  "Australia/Perth": "AWST",
  "Australia/Adelaide": "ACST",
  "Australia/Darwin": "ACST",
  "Australia/Hobart": "AEST",
  "Pacific/Auckland": "NZST",
  "Pacific/Chatham": "CHAST",
  "Pacific/Fiji": "FJT",
  "Pacific/Guam": "ChST",
  "Pacific/Saipan": "ChST",
  "Pacific/Port_Moresby": "PGT",
  "Pacific/Palau": "PWT",
  "Pacific/Kosrae": "KOST",
  "Pacific/Kwajalein": "MHT",
  "Pacific/Majuro": "MHT",
  "Pacific/Tarawa": "GILT",
  "Pacific/Funafuti": "TVT",
  "Pacific/Nauru": "NRT",
  "Pacific/Efate": "VUT",
  "Pacific/Noumea": "NCT",
  "Pacific/Niue": "NUT",
  "Pacific/Rarotonga": "CKT",
  "Pacific/Tahiti": "TAHT",
  "Pacific/Pago_Pago": "SST",
  "Pacific/Apia": "WST",
  "Pacific/Tongatapu": "TOT",
  "UTC": "UTC",
  "GMT": "GMT",
}

export function timeZoneAbbreviation(timeZone: string): string {
  if (TIMEZONE_ABBREVIATIONS[timeZone]) return TIMEZONE_ABBREVIATIONS[timeZone]
  try {
    const offset = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find(p => p.type === "timeZoneName")?.value
    return offset || timeZone
  } catch {
    return timeZone
  }
}

export function formatDateTimeInZone(date: string | Date, timeZone?: string | null) {
  const tz = timeZone || "Asia/Karachi"
  const base = new Date(date).toLocaleString([], {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${base} ${timeZoneAbbreviation(tz)}`
}
