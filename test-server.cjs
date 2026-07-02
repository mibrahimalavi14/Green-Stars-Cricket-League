const http = require("http");
const { spawn } = require("child_process");

console.log("Starting Next.js dev server...");
const child = spawn("cmd.exe", ["/c", "npx", "next", "dev", "--webpack"], {
  cwd: "D:\\Green Stars Cricket League",
  stdio: ["ignore", "pipe", "pipe"],
  detached: false,
});

child.stdout.on("data", (data) => {
  const text = data.toString();
  console.log(text);
  if (text.includes("Ready")) {
    // Server is ready, test the auth endpoint
    setTimeout(() => {
      http
        .get("http://localhost:3000/api/auth/signin", (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            console.log("Status:", res.statusCode);
            console.log("Response:", data.substring(0, 500));
            child.kill();
            process.exit(0);
          });
        })
        .on("error", (err) => {
          console.log("Request error:", err.message);
          child.kill();
          process.exit(1);
        });
    }, 3000);
  }
});

child.stderr.on("data", (data) => {
  console.error("STDERR:", data.toString());
});

setTimeout(() => {
  console.log("Timeout - killing server");
  child.kill();
  process.exit(1);
}, 60000);
