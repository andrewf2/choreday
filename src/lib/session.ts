import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

// Two identities per session:
//  - principal: who actually logged in (never changes via profile switching)
//  - active:    who you're currently acting as (changes when switching profiles)
const ACTIVE_COOKIE = "choreday_profile";
const PRINCIPAL_COOKIE = "choreday_principal";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

async function userById(id: string | undefined): Promise<User | null> {
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

// The profile currently being acted as (drives the UI/permissions).
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  return userById(store.get(ACTIVE_COOKIE)?.value);
}

// The authenticated account. Falls back to the active profile for sessions
// created before principal tracking existed.
export async function getPrincipalUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(PRINCIPAL_COOKIE)?.value ?? store.get(ACTIVE_COOKIE)?.value;
  return userById(id);
}

// On login/signup: principal and active both point at the authenticated user.
export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(PRINCIPAL_COOKIE, userId, COOKIE_OPTS);
  store.set(ACTIVE_COOKIE, userId, COOKIE_OPTS);
}

// Switch which profile is active; the principal is left untouched.
export async function setActiveProfile(userId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_COOKIE, userId, COOKIE_OPTS);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_COOKIE);
  store.delete(PRINCIPAL_COOKIE);
}
