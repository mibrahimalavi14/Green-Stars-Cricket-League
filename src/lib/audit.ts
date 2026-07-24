import { prisma } from "./prisma"

interface AuditEntry {
  action: string
  entity: string
  entityId?: string
  details?: string
  ip?: string
}

export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || "",
        details: entry.details || "",
        ip: entry.ip || "",
      },
    })
  } catch {
    // Silent fail — audit logging should never break the main flow
  }
}
