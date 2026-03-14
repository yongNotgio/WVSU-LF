"use client";

import Link from "next/link";
import { Id } from "../../convex/_generated/dataModel";
import { Bot, MapPin, X } from "lucide-react";

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
    <div className="bg-[#FFF3BF] border border-[#FFE066] rounded-[10px] p-4 flex items-center gap-3 shadow animate-slideDown">
      <Bot className="h-6 w-6 shrink-0 text-[#1A9FD4]" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-extrabold text-[#1A9FD4] uppercase tracking-wide">
          Potential Match Detected
        </div>
        <div className="text-xs text-[#1A9FD4]/80 truncate">
          &quot;{matchedTitle}&quot;
          {locationMatch && (
            <span className="inline-flex items-center gap-1 ml-1">
              <MapPin className="h-3 w-3" />
              Same location zone
            </span>
          )}
        </div>
      </div>
      <Link
        href={`/feed?item=${matchedItemId}`}
        className="bg-[#5BC4F5] text-[#212529] px-4 py-2 text-xs font-bold uppercase shrink-0 rounded-[8px] hover:bg-[#1A9FD4] hover:text-white transition-colors"
      >
        View Match
      </Link>
      <button
        onClick={onDismiss}
        className="text-[#1A9FD4]/60 hover:text-[#1A9FD4] text-lg font-bold leading-none"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
