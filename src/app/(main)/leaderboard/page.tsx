"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const RANK_STYLES: Record<number, string> = {
  1: "bg-wvsu-gold text-wvsu-blue-deeper",
  2: "bg-[#c0c0c0] text-[#333]",
  3: "bg-[#cd7f32] text-white",
};

export default function LeaderboardPage() {
  const colleges = useQuery(api.karma.getGlobalLeaderboard);
  const topFinders = useQuery(api.karma.getTopFinders);

  const maxKarma = colleges?.[0]?.totalKarma || 1;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* College Rankings */}
      <div className="mb-10">
        <div className="font-display text-2xl text-wvsu-text mb-5">
          🏆 College Rankings
        </div>
        <div className="bg-white border-2 border-wvsu-border">
          {colleges === undefined ? (
            <div className="text-sm text-wvsu-muted font-mono text-center py-12">
              Loading...
            </div>
          ) : (
            colleges.map((college: { _id: string; name: string; totalKarma: number }, i: number) => {
              const rank = i + 1;
              const barWidth =
                maxKarma > 0
                  ? Math.round((college.totalKarma / maxKarma) * 100)
                  : 0;
              return (
                <div
                  key={college._id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-wvsu-border last:border-b-0"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-sm font-extrabold font-mono shrink-0 ${
                      RANK_STYLES[rank] ?? "bg-wvsu-light-blue text-wvsu-blue"
                    }`}
                  >
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-wvsu-text">
                      {college.name}
                    </div>
                    <div className="h-1.5 bg-wvsu-light-blue mt-1">
                      <div
                        className="h-1.5 bg-wvsu-blue transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-extrabold font-mono text-wvsu-blue shrink-0">
                    ★ {college.totalKarma}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Campus Heroes */}
      <div id="heroes">
        <div className="font-display text-2xl text-wvsu-text mb-5">
          🦸 Campus Heroes
        </div>
        <div className="bg-white border-2 border-wvsu-border">
          {topFinders === undefined ? (
            <div className="text-sm text-wvsu-muted font-mono text-center py-12">
              Loading...
            </div>
          ) : topFinders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🦸</div>
              <div className="text-sm font-semibold text-wvsu-text mb-1">
                No heroes yet
              </div>
              <div className="text-xs text-wvsu-muted">
                Return a lost item to earn karma and become a Campus Hero!
              </div>
            </div>
          ) : (
            topFinders.map((finder: { _id: Id<"users">; name?: string; college?: string; karma?: number }, i: number) => {
              const initials = (finder.name ?? "")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div
                  key={finder._id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-wvsu-border last:border-b-0"
                >
                  <div className="text-sm font-extrabold font-mono text-wvsu-muted w-6 text-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 bg-wvsu-blue flex items-center justify-center text-white font-extrabold text-sm font-display shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-wvsu-text">
                      {finder.name}
                    </div>
                    <div className="text-[10px] text-wvsu-muted font-mono">
                      {finder.college}
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-wvsu-blue font-mono shrink-0">
                    ★ {finder.karma}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
