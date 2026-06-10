import Link from "next/link";
import type { User } from "@prisma/client";
import { getSwitchableProfiles } from "@/lib/family";
import { ProfileMenu } from "@/components/ProfileMenu";

export async function Header({ user }: { user: User }) {
  const home = user.role === "PARENT" ? "/parent" : "/child";
  const profiles = await getSwitchableProfiles();

  return (
    <header className="border-b border-black/5 bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
        <Link
          href={home}
          className="font-display text-lg font-extrabold tracking-tight text-coral"
        >
          Chore Checker
        </Link>
        <ProfileMenu
          activeId={user.id}
          activeName={user.name}
          profiles={profiles}
        />
      </div>
    </header>
  );
}
