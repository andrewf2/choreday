import { redirect } from "next/navigation";
import { getCurrentUser, getPrincipalUser } from "@/lib/session";
import { Header } from "@/components/Header";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  // A child who logged in can never reach the parent area, even by tampering
  // with the active-profile cookie — the principal is the source of truth.
  const principal = await getPrincipalUser();
  if (principal && principal.role !== "PARENT") redirect("/child");
  if (user.role !== "PARENT") redirect("/child");

  return (
    <>
      <Header user={user} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</div>
    </>
  );
}
