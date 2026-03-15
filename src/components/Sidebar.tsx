"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Coffee, MapPin, Trophy } from "lucide-react";
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

  return (
    <aside className="flex flex-col gap-4 p-0 overflow-visible">
      {/* Profile Card */}
      <div className="relative rounded-[10px] shadow-md border border-[#E9ECEF] mt-2 bg-white">
        <div className="flex justify-center -mt-8 mb-2 z-10 relative">
          <div className="w-[56px] h-[56px] rounded-full overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center">
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarUrl={stats?.avatarUrl}
              size={56}
              className="w-full h-full rounded-full"
            />
          </div>
        </div>
        <div className="px-3 pb-3 pt-2">
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

      {/* Zone Filter */}
      <div className="rounded-[14px] shadow-md border border-[#E9ECEF] p-4 bg-white">
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.72rem] font-extrabold text-[#212529] uppercase tracking-wide mb-2 inline-flex items-center gap-1">
          <MapPin size={13} className="text-[#495057]" /> Campus Zone
        </div>
        <select
          value={selectedZone}
          onChange={(event) => onZoneChange(event.target.value)}
          className="w-full border border-[#E9ECEF] rounded-[9px] px-3 py-2 text-[.8rem] font-semibold outline-none focus:border-[#5BC4F5] transition-colors bg-white"
        >
          {ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      {/* Donate Card */}
      <div className="rounded-[14px] shadow-md border border-[#E9ECEF] p-4 text-center cursor-pointer transition-all duration-200 relative overflow-hidden bg-white">
        <span className="mb-2 flex justify-center text-[#A16207]"><Coffee size={26} /></span>
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.87rem] font-extrabold text-[#212529] mb-1">Buy the Devs a Coffee</div>
        <div className="text-[.71rem] text-[#868E96] font-medium leading-tight mb-3">WVSULF is free. Help keep the servers running with a small donation!</div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5BC4F5] text-[#212529] rounded-[9px] font-['Outfit',sans-serif] text-[.8rem] font-bold shadow-md transition-all">
          <Coffee size={14} /> Donate Now
        </button>
      </div>
    </aside>
  );
}
