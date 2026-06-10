import { prisma } from "@/lib/db";
import { getPrincipalUser } from "@/lib/session";
import type { Role } from "@prisma/client";

export interface SwitchableProfile {
  id: string;
  name: string;
  role: Role;
}

// Profiles the logged-in principal is allowed to switch to:
//  - PARENT principal -> themselves + their children
//  - CHILD principal  -> siblings (children of the same parent), never the parent
export async function getSwitchableProfiles(): Promise<SwitchableProfile[]> {
  const principal = await getPrincipalUser();
  if (!principal) return [];

  let users;
  if (principal.role === "PARENT") {
    const children = await prisma.user.findMany({
      where: { parentId: principal.id },
      orderBy: { name: "asc" },
    });
    users = [principal, ...children];
  } else if (principal.parentId) {
    // Siblings (incl. self) — excludes the parent.
    users = await prisma.user.findMany({
      where: { parentId: principal.parentId, role: "CHILD" },
      orderBy: { name: "asc" },
    });
  } else {
    users = [principal];
  }

  return users.map((u) => ({ id: u.id, name: u.name, role: u.role }));
}

// Returns the target profile if the principal is allowed to switch to it, else null.
export async function resolveSwitchTarget(
  targetId: string,
): Promise<SwitchableProfile | null> {
  const allowed = await getSwitchableProfiles();
  return allowed.find((p) => p.id === targetId) ?? null;
}
