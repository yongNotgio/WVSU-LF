"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Zap } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RANK_STYLES: Record<number, string> = {
  1: "background:#FFF3BF;color:#92400E;border:1px solid #FFE066;",
  2: "background:#F1F3F5;color:#868E96;border:1px solid #DEE2E6;",
  3: "background:#FFE8D6;color:#9A3412;border:1px solid #FFCBA4;",
};

function getDepartmentColor(collegeName: string): string {
  const name = collegeName.toUpperCase();

  if (name.includes("CICT")) return "#FB923C";
  if (name.includes("CAS")) return "#FACC15";
  if (name.includes("CBM")) return "#34D399";
  if (name.includes("COC")) return "#EF4444";
  if (name.includes("COD")) return "#A78BFA";
  if (name.includes("COE")) return "#38BDF8";
  if (name.includes("CON")) return "#F472B6";
  if (name.includes("PESCAR")) return "#8B5CF6";

  return "#38BDF8";
}

export function RightPanel() {
  const colleges = useQuery(api.karma.getGlobalLeaderboard);
  const [showAllColleges, setShowAllColleges] = useState(false);
  const topFinders = useQuery(api.karma.getTopFinders);
  const maxKarma = colleges?.[0]?.totalKarma || 1;

  return (
    <aside className="flex flex-col gap-4">
      {/* College Rankings */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Department Board</span>
          <span className="text-[11px] text-[#7A97A8]">This Month</span>
        </div>
        <div className="card-body !px-[14px] !py-3">
          {colleges?.slice(0, showAllColleges ? colleges.length : 5).map(
            (college: { _id: string; name: string; totalKarma: number }) => {
              const barWidth =
                maxKarma > 0 ? Math.round((college.totalKarma / maxKarma) * 100) : 0;
              const deptColor = getDepartmentColor(college.name);

              return (
                <div key={college._id} className="dept-bar">
                  <div className="dept-color" style={{ background: deptColor }}></div>
                  <span className="dept-name">{college.name}</span>
                  <div className="dept-track"><div className="dept-fill" style={{ width: `${barWidth}%`, background: deptColor }}></div></div>
                  <span className="dept-pts">{college.totalKarma}</span>
                </div>
              );
            }
          )}
          {!colleges && <div className="text-xs text-[#7A97A8] py-1 text-center">Loading...</div>}
          {colleges && colleges.length > 5 && (
            <div className="py-1 text-center">
              <button
                onClick={() => setShowAllColleges((s) => !s)}
                className="text-[.8rem] font-semibold text-[#1E6FA0] bg-transparent border-none cursor-pointer"
              >
                {showAllColleges ? "Show less" : `See more (${colleges.length - 5})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Campus Heroes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ fontSize: "14px" }}>Campus Heroes</span>
          <span className="text-[11px] text-[#3B9BD4] font-semibold cursor-pointer">See All</span>
        </div>
        <div className="card-body !px-3 !py-1.5">
          {topFinders?.map(
            (finder: { _id: Id<"users">; name?: string; college?: string; karma?: number }, i: number) => {
              let rankClass = "normal";
              if (i === 0) rankClass = "gold";
              if (i === 1) rankClass = "silver";
              if (i === 2) rankClass = "bronze";

              return (
                <div key={finder._id} className="leaderboard-item">
                  <div className={`lb-rank ${rankClass}`}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</div>
                  <div className="lb-info">
                    <div className="lb-name">{finder.name ?? "Unknown"}</div>
                    <div className="lb-sub">{finder.college ?? "WVSU"}</div>
                  </div>
                  <div className="lb-score">
                    <span className="inline-flex items-center gap-1"><Zap size={12} /> {finder.karma ?? 0}</span> <span>pts</span>
                  </div>
                </div>
              );
            }
          )}
          {topFinders?.length === 0 && (
            <div className="text-xs text-[#7A97A8] py-2 text-center">No heroes yet. Be the first.</div>
          )}
          {!topFinders && (
            <div className="text-xs text-[#7A97A8] py-2 text-center">Loading...</div>
          )}
        </div>
      </div>

    </aside>
  );
}
