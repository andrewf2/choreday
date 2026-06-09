import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Header } from "@/components/Header";

export default async function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "CHILD") redirect("/parent");

  return (
    <>
      <Header user={user} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</div>
    </>
  );
}
