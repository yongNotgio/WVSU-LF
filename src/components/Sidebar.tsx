"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

interface SidebarProps {
  selectedZone: string;
  onZoneChange: (zone: string) => void;
}

export function Sidebar({ selectedZone: _selectedZone, onZoneChange: _onZoneChange }: SidebarProps) {
  const stats = useQuery(api.auth.getUserStats);

  return (
    <aside className="flex flex-col gap-4 overflow-visible">
      {/* Profile Card */}
      <div className="relative rounded-2xl shadow-sm border border-[#E9ECEF] mt-2 bg-white overflow-hidden">
        <div className="h-14 bg-gradient-to-r from-[#5BC4F5] to-[#1A9FD4]" />
        <div className="flex justify-center -mt-8 mb-2 z-10 relative">
          <div className="w-[56px] h-[56px] rounded-full overflow-hidden bg-white border-4 border-white shadow-md flex items-center justify-center">
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarUrl={stats?.avatarUrl}
              size={56}
              className="w-full h-full rounded-full"
            />
          </div>
        </div>
        <div className="px-4 pb-4 pt-2">
          <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.95rem] font-extrabold text-[#212529] text-center">{stats?.name || "Juan Dela Cruz"}</div>
          <div className="text-[.7rem] text-[#868E96] font-medium text-center mt-1">{stats?.college || "College of Engineering · 3rd Year"}</div>
          <div className="h-px bg-[#E9ECEF] my-3.5" />
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-[10px] py-2 px-1.5 flex flex-col items-center cursor-default transition-all">
              <div className="text-[.95rem] font-extrabold text-[#D97706] leading-none inline-flex items-center gap-1">
                <Trophy size={14} /> #{stats?.rank ?? 4}
              </div>
              <div className="text-[.61rem] text-[#868E96] font-semibold mt-1 text-center">IT Rank</div>
            </div>
            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-[10px] py-2 px-1.5 flex flex-col items-center cursor-default transition-all">
              <div className="text-[.95rem] font-extrabold text-[#1A9FD4] leading-none">{stats?.karma ?? 340}</div>
              <div className="text-[.61rem] text-[#868E96] font-semibold mt-1 text-center">Karma pts</div>
            </div>
            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-[10px] py-2 px-1.5 flex flex-col items-center cursor-default transition-all">
              <div className="text-[.95rem] font-extrabold text-[#212529] leading-none">{stats?.activePosts ?? 5}</div>
              <div className="text-[.61rem] text-[#868E96] font-semibold mt-1 text-center">Active Posts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Donate Card */}
      <div className="rounded-2xl shadow-sm border border-[#E9ECEF] p-5 text-center transition-all duration-200 relative overflow-hidden bg-white">
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.87rem] font-extrabold text-[#212529] mb-2">☕ Fuel the Devs!</div>
        <div className="text-[.71rem] text-[#868E96] font-medium leading-tight mb-20">Built by students, for students. Help us keep the servers running. </div>
        <div className="absolute left-1/2 bottom-6 transform -translate-x-1/2 z-0 pointer-events-none">
          <img src="/devcoffee.png" alt="Dev Coffee" className="-mb-3 w-50 h-50 object-contain opacity-100 pointer-events-none select-none" />
        </div>
        <button
          className="relative z-20 inline-flex items-center gap-1.5 px-4 py-2 bg-[#5BC4F5] text-[#212529] rounded-xl font-['Outfit',sans-serif] text-[.8rem] font-bold shadow-sm transition-all mt-0 hover:-translate-y-0.5"
          onClick={() => window.location.reload()}
        >
          Donate Now
        </button>
      </div>
    </aside>
  );
}
