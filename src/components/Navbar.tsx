"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const stats = useQuery(api.auth.getUserStats);

  const pathname = usePathname();
  const navLinks = [
    { label: "Feed", href: "/feed" },
    { label: "My Posts", href: "/my-posts" },
    { label: "Messages", href: "/messages" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 bg-wvsu-blue border-b-[3px] border-wvsu-blue-deeper">
      {/* Brand */}
      <Link href="/feed" className="flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-white border-2 border-wvsu-gold flex items-center justify-center font-display text-sm text-wvsu-blue font-black tracking-tighter">
          W
        </div>
        <div className="font-display text-lg text-white tracking-wide">
          WVS<span className="text-wvsu-gold">ULF</span>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-0.5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-wider border-b-2 transition-all ${
              pathname?.startsWith(link.href)
                ? "text-white border-b-wvsu-gold"
                : "text-white/75 border-transparent hover:text-white hover:border-wvsu-gold"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Karma Badge */}
      <div className="flex items-center gap-2 bg-wvsu-blue-deeper border border-white/15 px-3 py-1.5 text-[13px] font-bold text-wvsu-gold font-mono">
        <div className="w-[7px] h-[7px] bg-wvsu-gold rounded-full animate-pulse" />
        ★ {stats?.karma ?? 0} KARMA
      </div>
    </nav>
  );
}
