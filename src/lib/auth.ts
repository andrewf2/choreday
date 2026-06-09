import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// Usernames: 3-20 chars, lowercase letters/numbers/underscore.
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { username } });
  return existing !== null;
}

export const MIN_PASSWORD_LENGTH = 6;

// Verify a username/password pair. Returns the user on success, else null.
export async function verifyLogin(
  username: string,
  password: string,
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
