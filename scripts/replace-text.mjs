import { readFileSync, writeFileSync } from "fs"

// Home page: replace 'Lahore' with 'Haripur'
let s = readFileSync("src/app/page.tsx", "utf8")
s = s.replace(/'Lahore'/g, "'Haripur'")
writeFileSync("src/app/page.tsx", s)
console.log("Home page: Lahore -> Haripur done")
