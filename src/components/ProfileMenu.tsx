"use client";

import { useEffect, useRef, useState } from "react";
import { switchProfile, logout } from "@/app/actions";
import type { Role } from "@prisma/client";

interface Profile {
  id: string;
  name: string;
  role: Role;
}

export function ProfileMenu({
  activeId,
  activeName,
  profiles,
}: {
  activeId: string;
  activeName: string;
  profiles: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const others = profiles.filter((p) => p.id !== activeId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-black/[0.03]"
      >
        {activeName}
        <span className="text-ink-soft">▾</span>
      </button>

      {open && (
        <div className="card absolute right-0 z-20 mt-2 w-56 overflow-hidden p-1.5">
          {others.length > 0 && (
            <>
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Switch profile
              </p>
              {others.map((p) => (
                <form key={p.id} action={switchProfile}>
                  <input type="hidden" name="targetId" value={p.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm font-medium text-ink transition hover:bg-black/[0.04]"
                  >
                    {p.name}
                    <span className="text-xs font-semibold text-ink-soft">
                      {p.role === "PARENT" ? "Parent" : "Child"}
                    </span>
                  </button>
                </form>
              ))}
              <div className="my-1 border-t border-black/5" />
            </>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-xl px-2.5 py-2 text-left text-sm font-medium text-coral transition hover:bg-coral/10"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
