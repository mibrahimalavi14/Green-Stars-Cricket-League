try {
  const mod = require("@prisma/adapter-neon")
  console.log("Keys:", Object.keys(mod))
  console.log("PrismaNeon:", typeof mod.PrismaNeon)
  const pn = mod.PrismaNeon
  console.log("Constructor length:", pn.length)
  console.log("Prototype:", Object.getOwnPropertyNames(pn.prototype || {}))
} catch(e) {
  console.error(e.message)
}
