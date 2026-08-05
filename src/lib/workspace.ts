import { cookies } from "next/headers"
import { prisma } from "./prisma"

export const WORKSPACE_OFFICIAL = "official"
export const WORKSPACE_PRACTICE = "practice"
export const WORKSPACE_COOKIE = "gscl_workspace"

export function isOfficialWorkspace(id: string): boolean {
  return id === WORKSPACE_OFFICIAL
}

/**
 * Resolve the current workspace for admin/authenticated server code.
 * Reads the `gscl_workspace` cookie; defaults to OFFICIAL.
 * Public (non-admin) pages should pass WORKSPACE_OFFICIAL explicitly
 * instead of calling this, so visitors always see the official league.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  try {
    const store = await cookies()
    const value = store.get(WORKSPACE_COOKIE)?.value
    return value === WORKSPACE_PRACTICE ? WORKSPACE_PRACTICE : WORKSPACE_OFFICIAL
  } catch {
    return WORKSPACE_OFFICIAL
  }
}

export async function getActiveSeason(workspaceId: string = WORKSPACE_OFFICIAL) {
  return prisma.season.findFirst({
    where: { workspaceId, isActive: true },
    orderBy: { year: "desc" },
  })
}
