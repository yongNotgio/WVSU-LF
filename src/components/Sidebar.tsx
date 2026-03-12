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
    <aside className="bg-white border-r-2 border-wvsu-border sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden lg:flex lg:flex-col">
      {/* Profile Card */}
      <div className="p-4">
        <div className="bg-wvsu-blue p-3.5">
          <div className="w-10 h-10 rounded-sm overflow-hidden mb-2">
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarSeed={stats?.avatarSeed}
              avatarUrl={stats?.avatarUrl}
              size={40}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {stats?.name || "Loading..."}
          </div>
          <div className="text-[11px] text-white/60 font-mono mt-0.5">
            {stats?.college || "No college set"}
          </div>
          <div className="flex gap-2 mt-2.5">
            <div className="flex-1 bg-white/10 border border-white/15 p-1.5 text-center">
              <span className="block text-base font-extrabold text-wvsu-gold font-mono">
                {stats?.karma ?? 0}
              </span>
              <span className="text-[9px] text-white/50 uppercase tracking-wider">
                Karma
              </span>
            </div>
            <div className="flex-1 bg-white/10 border border-white/15 p-1.5 text-center">
              <span className="block text-base font-extrabold text-wvsu-gold font-mono">
                #{stats?.rank ?? "--"}
              </span>
              <span className="text-[9px] text-white/50 uppercase tracking-wider">
                Rank
              </span>
            </div>
            <div className="flex-1 bg-white/10 border border-white/15 p-1.5 text-center">
              <span className="block text-base font-extrabold text-wvsu-gold font-mono">
                {stats?.activePosts ?? 0}
              </span>
              <span className="text-[9px] text-white/50 uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-6 border-b border-wvsu-border mb-5">
        <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-2.5">
          Navigation
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-5 py-2 text-[13.5px] font-semibold border-l-[3px] transition-all ${
              pathname?.startsWith(item.href.split("#")[0])
                ? "bg-wvsu-light-blue text-wvsu-blue border-l-wvsu-blue"
                : "text-wvsu-muted border-transparent hover:bg-wvsu-light-blue hover:text-wvsu-blue hover:border-l-wvsu-blue"
            }`}
          >
            <item.Icon className="h-4 w-4 shrink-0" />
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-wvsu-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Zone Filter */}
      <div className="px-4">
        <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-2.5">
          Filter by Zone
        </div>
        {ZONES.map((zone) => (
          <button
            key={zone}
            onClick={() =>
              onZoneChange(zone === "All Zones" ? "" : zone)
            }
            className={`flex items-center gap-2.5 w-full text-left px-2 py-2 text-[13.5px] font-semibold border-l-[3px] transition-all ${
              (zone === "All Zones" && !selectedZone) ||
              zone === selectedZone
                ? "bg-wvsu-light-blue text-wvsu-blue border-l-wvsu-blue"
                : "text-wvsu-muted border-transparent hover:bg-wvsu-light-blue hover:text-wvsu-blue hover:border-l-wvsu-blue"
            }`}
          >
            <MapPin className="h-4 w-4 shrink-0" />
            {zone}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 mt-auto pt-4 pb-4 border-t border-wvsu-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full text-left px-2 py-2 text-[13.5px] font-semibold text-lost-red border-l-[3px] border-transparent hover:bg-lost-red/5 hover:border-l-lost-red transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
