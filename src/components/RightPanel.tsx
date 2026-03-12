"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const RANK_STYLES: Record<number, string> = {
  1: "bg-wvsu-gold text-wvsu-blue-deeper",
  2: "bg-[#c0c0c0] text-[#333]",
  3: "bg-[#cd7f32] text-white",
};

export function RightPanel() {
  const colleges = useQuery(api.karma.getGlobalLeaderboard);
  const topFinders = useQuery(api.karma.getTopFinders);

  const maxKarma = colleges?.[0]?.totalKarma || 1;

  return (
    <aside className="bg-white border-l-2 border-wvsu-border sticky top-14 h-[calc(100vh-56px)] overflow-y-auto hidden lg:block">
      {/* College Rankings */}
      <div className="p-4">
        <div className="font-display text-[17px] text-wvsu-text mb-3">
          🏆 College Rankings
        </div>
        <div className="space-y-0">
          {colleges?.map((college: { _id: string; name: string; totalKarma: number }, i: number) => {
            const rank = i + 1;
            const barWidth =
              maxKarma > 0
                ? Math.round((college.totalKarma / maxKarma) * 100)
                : 0;
            return (
              <div
                key={college._id}
                className="flex items-center gap-2.5 py-2 border-b border-wvsu-border"
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center text-[11px] font-extrabold font-mono shrink-0 ${
                    RANK_STYLES[rank] ?? "bg-wvsu-light-blue text-wvsu-blue"
                  }`}
                >
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-wvsu-text">
                    {college.name}
                  </div>
                  <div className="h-1 bg-wvsu-light-blue mt-0.5">
                    <div
                      className="h-1 bg-wvsu-blue transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs font-bold font-mono text-wvsu-blue shrink-0">
                  {college.totalKarma}
                </div>
              </div>
            );
          })}
          {!colleges && (
            <div className="text-xs text-wvsu-muted py-4 text-center">
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Campus Heroes */}
      <div className="p-4 border-t-2 border-wvsu-border">
        <div className="font-display text-[17px] text-wvsu-text mb-3">
          🦸 Campus Heroes
        </div>
        <div className="space-y-0">
          {topFinders?.map((finder: { _id: Id<"users">; name?: string; college?: string; karma?: number }) => {
            const initials = (finder.name ?? "")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <div
                key={finder._id}
                className="flex items-center gap-2.5 py-2 border-b border-wvsu-border"
              >
                <div className="w-8 h-8 bg-wvsu-blue flex items-center justify-center text-white font-extrabold text-[13px] font-display shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-wvsu-text">
                    {finder.name}
                  </div>
                  <div className="text-[10px] text-wvsu-muted font-mono">
                    {finder.college}
                  </div>
                </div>
                <div className="text-[13px] font-extrabold text-wvsu-blue font-mono shrink-0">
                  ★ {finder.karma}
                </div>
              </div>
            );
          })}
          {topFinders?.length === 0 && (
            <div className="text-xs text-wvsu-muted py-4 text-center">
              No heroes yet — be the first!
            </div>
          )}
          {!topFinders && (
            <div className="text-xs text-wvsu-muted py-4 text-center">
              Loading...
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
