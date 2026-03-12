"use client";

import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";

interface MatchAlertProps {
  matchedItemId: Id<"items">;
  matchedTitle: string;
  locationMatch: boolean;
  onDismiss: () => void;
}

export function MatchAlert({
  matchedItemId,
  matchedTitle,
  locationMatch,
  onDismiss,
}: MatchAlertProps) {
  return (
    <div className="bg-wvsu-gold border-2 border-[#c9a200] p-3 px-4 flex items-center gap-3 animate-slideDown">
      <span className="text-2xl shrink-0">🤖</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-extrabold text-wvsu-blue-deeper uppercase tracking-wide">
          Potential Match Detected
        </div>
        <div className="text-xs text-wvsu-blue-deeper/80 truncate">
          &quot;{matchedTitle}&quot;
          {locationMatch && " — Same location zone!"}
        </div>
      </div>
      <Link
        href={`/feed?item=${matchedItemId}`}
        className="bg-wvsu-blue text-white px-3.5 py-[7px] text-xs font-bold uppercase shrink-0 hover:bg-wvsu-blue-dark transition-colors"
      >
        View Match
      </Link>
      <button
        onClick={onDismiss}
        className="text-wvsu-blue-deeper/60 hover:text-wvsu-blue-deeper text-lg font-bold leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
