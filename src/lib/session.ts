import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const COOKIE_NAME = "choreday_profile";

// Returns the user currently "acting as", or null if no profile is selected.
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  return user ?? null;
}

export async function setCurrentProfile(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearCurrentProfile(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
