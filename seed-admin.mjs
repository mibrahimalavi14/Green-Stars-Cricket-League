const BASE = "https://green-stars-cricket-league.vercel.app";

async function main() {
  // Login
  const loginRes = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "gscl@2026" }),
  });
  const loginData = await loginRes.json();
  console.log("Login:", loginData);
  const cookies = loginRes.headers.get("set-cookie");
  console.log("Cookie:", cookies);

  if (!cookies) {
    console.log("No cookie received - cannot proceed");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies,
  };

  // 1. Create season
  const seasonRes = await fetch(`${BASE}/api/seasons`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "GSCL 2026",
      year: 2026,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    }),
  });
  const season = await seasonRes.json();
  console.log("Season:", season);
}

main().catch(console.error);
