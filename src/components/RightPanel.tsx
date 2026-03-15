"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Building2, UserRound, Zap } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RANK_STYLES: Record<number, string> = {
  1: "background:#FFF3BF;color:#92400E;border:1px solid #FFE066;",
  2: "background:#F1F3F5;color:#868E96;border:1px solid #DEE2E6;",
  3: "background:#FFE8D6;color:#9A3412;border:1px solid #FFCBA4;",
};

export function RightPanel() {
  const colleges = useQuery(api.karma.getGlobalLeaderboard);
  const [showAllColleges, setShowAllColleges] = useState(false);
  const topFinders = useQuery(api.karma.getTopFinders);
  const maxKarma = colleges?.[0]?.totalKarma || 1;

  return (
    <aside className="flex flex-col gap-2">
      {/* College Rankings */}
      <div className="bg-white border border-[#E9ECEF] rounded-[10px] shadow p-2 animate-[up_0.4s_var(--ease2)_both]">
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.75rem] font-extrabold text-[#212529] uppercase tracking-wide flex items-center gap-1 pb-2 mb-2 border-b border-[#E9ECEF]">
          <Building2 size={14} className="text-[#495057]" /> College Rankings
          <span className="ml-auto text-[.6rem] font-bold px-2 py-0.5 rounded bg-[#FFF3BF] text-[#92400E] border border-[#E9ECEF]">
            This Week
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {colleges?.slice(0, showAllColleges ? colleges.length : 5).map(
            (college: { _id: string; name: string; totalKarma: number }, i: number) => {
              const rank = i + 1;
              const barWidth =
                maxKarma > 0 ? Math.round((college.totalKarma / maxKarma) * 100) : 0;
              return (
                <div
                  key={college._id}
                  className="flex items-center gap-2 py-1 rounded-[7px] bg-[#F8F9FA] cursor-pointer transition-all"
                >
                  <div
                    className={`w-6 h-6 flex items-center justify-center text-[.74rem] font-extrabold font-['Plus_Jakarta_Sans',sans-serif] rounded-[7px] shrink-0 ${
                      rank === 1
                        ? "bg-[#FFF3BF] text-[#92400E] border border-[#FFE066]"
                        : rank === 2
                        ? "bg-[#F1F3F5] text-[#868E96] border border-[#DEE2E6]"
                        : rank === 3
                        ? "bg-[#FFE8D6] text-[#9A3412] border border-[#FFCBA4]"
                        : "bg-white text-[#ADB5BD] border border-[#E9ECEF]"
                    }`}
                  >
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[.75rem] font-bold text-[#212529] truncate">
                      {college.name}
                    </div>
                    <div className="text-[.62rem] text-[#ADB5BD] font-medium mt-0.5">
                      {college.totalKarma} pts
                    </div>
                    <div className="w-full h-1 bg-[#E9ECEF] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-1 bg-[#5BC4F5] rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            }
          )}
          {colleges && colleges.length > 5 && (
            <div className="py-1 text-center">
              <button
                onClick={() => setShowAllColleges((s) => !s)}
                className="text-[.85rem] font-semibold text-[#1A9FD4] underline bg-transparent border-none cursor-pointer"
              >
                {showAllColleges ? "Show less" : `See more (${colleges.length - 5} more)`}
              </button>
            </div>
          )}
          {!colleges && (
            <div className="text-xs text-[#868E96] py-2 text-center">Loading...</div>
          )}
        </div>
      </div>
      {/* Campus Heroes */}
      <div className="bg-white border border-[#E9ECEF] rounded-[10px] shadow p-2 animate-[up_0.4s_var(--ease2)_both]">
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.75rem] font-extrabold text-[#212529] uppercase tracking-wide flex items-center gap-1 pb-2 mb-2 border-b border-[#E9ECEF]">
          <UserRound size={14} className="text-[#495057]" /> Student Heroes
          <span className="ml-auto text-[.6rem] font-bold px-2 py-0.5 rounded bg-[#FFE3E3] text-[#C92A2A] border border-[#E9ECEF]">
            Top 5
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {topFinders?.map(
            (finder: { _id: Id<"users">; name?: string; college?: string; karma?: number }, i: number) => {
              const initials = (finder.name ?? "")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div
                  key={finder._id}
                  className="flex items-center gap-2 py-1 rounded-[7px] cursor-pointer transition-all"
                >
                  <div className="w-[13px] text-center font-['Plus_Jakarta_Sans',sans-serif] text-[.68rem] font-bold text-[#ADB5BD] shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-[7px] border border-[#E9ECEF] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[.65rem] text-[#495057] shrink-0 relative">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[.75rem] font-bold text-[#212529] flex items-center gap-1">
                      {finder.name}
                    </div>
                    <div className="text-[.62rem] text-[#ADB5BD] font-medium truncate">
                      {finder.college}
                    </div>
                  </div>
                  <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[.7rem] font-bold text-[#D97706] shrink-0 bg-[#FFF3BF] px-2 py-0.5 rounded border border-[#FFE066] inline-flex items-center gap-1">
                    <Zap size={12} /> {finder.karma}
                  </div>
                </div>
              );
            }
          )}
          {topFinders?.length === 0 && (
            <div className="text-xs text-[#868E96] py-2 text-center">No heroes yet. Be the first.</div>
          )}
          {!topFinders && (
            <div className="text-xs text-[#868E96] py-2 text-center">Loading...</div>
          )}
        </div>
      </div>
    </aside>
  );
}
