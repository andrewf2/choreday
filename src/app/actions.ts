"use server";

import { redirect } from "next/navigation";
import { setCurrentProfile, clearCurrentProfile } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  verifyLogin,
  hashPassword,
  normalizeUsername,
  isValidUsername,
  isUsernameTaken,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth";

// Authenticate with username + password, then route to the role's dashboard.
export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username.trim() || !password) {
    redirect("/?error=missing");
  }

  const user = await verifyLogin(username, password);
  if (!user) {
    redirect("/?error=invalid");
  }

  await setCurrentProfile(user.id);
  redirect(user.role === "PARENT" ? "/parent" : "/child");
}

// Create a new PARENT account (the family owner), then log them in.
// Children are added later by the parent from their dashboard.
export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name || !username || !password) {
    redirect("/signup?error=missing");
  }
  if (!isValidUsername(username)) {
    redirect("/signup?error=username");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect("/signup?error=short");
  }
  if (password !== confirm) {
    redirect("/signup?error=match");
  }
  if (await isUsernameTaken(username)) {
    redirect("/signup?error=taken");
  }

  const user = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash: await hashPassword(password),
      role: "PARENT",
    },
  });

  await setCurrentProfile(user.id);
  redirect("/parent");
}

// Clear the session and return to the login page.
export async function logout() {
  await clearCurrentProfile();
  redirect("/");
}
