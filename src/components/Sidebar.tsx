"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import { api } from "../../convex/_generated/api";
import { UserAvatar } from "./UserAvatar";

interface SidebarProps {
  selectedZone: string;
  onZoneChange: (zone: string) => void;
}

export function Sidebar({ selectedZone: _selectedZone, onZoneChange: _onZoneChange }: SidebarProps) {
  void _selectedZone;
  void _onZoneChange;
  const stats = useQuery(api.auth.getUserStats);
  const items = useQuery(api.items.getItems, {});

  const resolvedCount = items?.filter((item) => item.status === "resolved").length ?? 0;

  return (
    <aside className="flex flex-col gap-4 overflow-visible">
      {/* Profile Card */}
      <div className="profile-card mt-1">
        <div className="profile-avatar rounded-full overflow-hidden">
          <div className="w-full h-full rounded-full bg-transparent border-0 shadow-none flex items-center justify-center">
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarUrl={stats?.avatarUrl}
              size={58}
              className="w-full h-full rounded-full"
            />
          </div>
        </div>
        <div className="profile-name">{stats?.name || "Campus User"}</div>
        <div className="profile-dept">{stats?.college || "West Visayas State University"}</div>
        <div className="profile-badge">⭐ Community Rank · #{stats?.rank ?? 0}</div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-num">{stats?.activePosts ?? 0}</div>
            <div className="profile-stat-label">Active Posts</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-num">{resolvedCount}</div>
            <div className="profile-stat-label">Resolved</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-num">{stats?.karma ?? 0}</div>
            <div className="profile-stat-label">Points</div>
          </div>
        </div>
      </div>

      {/* Project Card */}
      <div className="donate-card">
        <div className="donate-ill-wrap">
          <Image
            src="/devcoffee.png"
            alt="Developers sharing coffee"
            width={460}
            height={460}
            className="donate-ill"
            priority={false}
          />
        </div>
        <div className="donate-title">Keep the devs caffeinated.</div>
        <div className="donate-sub">Buy us a coffee if this helps your day.</div>
        <div className="donate-quote">&quot;1 coffee = 100 lines of bug-free code (hopefully).&quot;</div>
        <button className="donate-btn" onClick={() => window.location.reload()}>
          Donate
        </button>
      </div>
    </aside>
  );
}
