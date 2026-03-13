"use client";

import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutList, LogOut, MapPin, MessageSquare, Pin, ShieldCheck, Trophy } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

const ZONES = [
  "All Zones",
  "Library",
  "CICT Bldg",
  "CON Bldg",
  "CAS Bldg",
  "Canteen Area",
  "Main Gate",
];

interface SidebarProps {
  selectedZone: string;
  onZoneChange: (zone: string) => void;
}

export function Sidebar({ selectedZone, onZoneChange }: SidebarProps) {
  const stats = useQuery(api.auth.getUserStats);
  const unreadCount = useQuery(api.chat.getUnreadCount);
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const navItems = [
    { Icon: LayoutList, label: "Feed", href: "/feed", badge: null },
    { Icon: Pin, label: "My Posts", href: "/my-posts", badge: null },
    { Icon: MessageSquare, label: "Messages", href: "/messages", badge: unreadCount && unreadCount > 0 ? String(unreadCount) : null },
    { Icon: Trophy, label: "Leaderboard", href: "/leaderboard", badge: null },
    { Icon: ShieldCheck, label: "Campus Heroes", href: "/leaderboard#heroes", badge: null },
  ];

  return (
    <aside className="bg-white border-r-2 border-wvsu-border sticky top-14 h-[calc(100vh-56px)] hidden lg:flex lg:flex-col">
      {/* Profile Card (compact) */}
      <div className="p-3">
        <div className="rounded-lg overflow-hidden bg-wvsu-blue p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md overflow-hidden ring-2 ring-white/20 flex-shrink-0">
              <UserAvatar
                name={stats?.name}
                avatarType={stats?.avatarType}
                avatarUrl={stats?.avatarUrl}
                size={40}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate" title={stats?.name ?? undefined}>
                {stats?.name || "Loading..."}
              </div>
              <div className="-mt-1">
                <span className="text-xs text-white/85 font-mono truncate">
                  {stats?.college || "No college set"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-white/8 rounded-md p-1.5 text-center">
              <div className="text-sm font-extrabold text-wvsu-gold font-mono leading-none">
                {stats?.karma ?? 0}
              </div>
              <div className="text-[8px] text-white/50 uppercase tracking-wider">
                Karma
              </div>
            </div>
            <div className="bg-white/8 rounded-md p-1.5 text-center">
              <div className="text-sm font-extrabold text-wvsu-gold font-mono leading-none">
                #{stats?.rank ?? "--"}
              </div>
              <div className="text-[8px] text-white/50 uppercase tracking-wider">
                Rank
              </div>
            </div>
            <div className="bg-white/8 rounded-md p-1.5 text-center">
              <div className="text-sm font-extrabold text-wvsu-gold font-mono leading-none">
                {stats?.activePosts ?? 0}
              </div>
              <div className="text-[8px] text-white/50 uppercase tracking-wider">
                Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy the devs a coffee (moved below profile) */}
      <div className="px-4 mb-4">
        <div className="rounded-lg p-2 border border-wvsu-border bg-gradient-to-br from-white to-white/95 text-center">
          <div className="-mb-6">
            <div className="text-base font-bold text-wvsu-text">
              Buy the devs a coffee
            </div>
            <div className="text-sm text-wvsu-muted mt-0">
              Support the project — small donations keep us caffeinated ☕
            </div>
          </div>

          {/* Large image with minimal top spacing so it sits closer to the Donate button */}
          <img src="/devcoffee.png" alt="Buy devs a coffee" className="w-48 h-48 mx-auto object-cover rounded-md shadow-sm mt-0 -mb-5" />

          {/* Slightly pull the Donate button up to meet the image */}
          <div className="-mt-12">
            <a href="" target="_blank" rel="noreferrer" className="inline-block w-full text-center px-3 py-3 bg-wvsu-gold text-wvsu-blue font-bold rounded-md hover:opacity-90 transition">
              Donate
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
