import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

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
