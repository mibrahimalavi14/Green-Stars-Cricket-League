type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const logs: LogEntry[] = []
const MAX_LOGS = 1000

function addLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = { level, message, context: context || {}, timestamp: new Date().toISOString() }
  logs.push(entry)
  if (logs.length > MAX_LOGS) logs.shift()

  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
  if (level === "error") {
    console.error(prefix, message, context || "")
  } else if (level === "warn") {
    console.warn(prefix, message, context || "")
  } else {
    console.log(prefix, message, context || "")
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => addLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => addLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => addLog("error", message, context),
  getLogs: () => [...logs],
}
