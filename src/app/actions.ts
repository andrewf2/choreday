"use server";

import { redirect } from "next/navigation";
import { setCurrentProfile, clearCurrentProfile } from "@/lib/session";
import { verifyLogin } from "@/lib/auth";

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

// Clear the session and return to the login page.
export async function logout() {
  await clearCurrentProfile();
  redirect("/");
}
