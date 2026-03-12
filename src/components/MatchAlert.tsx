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
    <div className="bg-wvsu-gold border-2 border-[#c9a200] p-3 px-4 flex items-center gap-3 animate-slideDown">
      <Bot className="h-6 w-6 shrink-0 text-wvsu-blue-deeper" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-extrabold text-wvsu-blue-deeper uppercase tracking-wide">
          Potential Match Detected
        </div>
        <div className="text-xs text-wvsu-blue-deeper/80 truncate">
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
        className="bg-wvsu-blue text-white px-3.5 py-[7px] text-xs font-bold uppercase shrink-0 hover:bg-wvsu-blue-dark transition-colors"
      >
        View Match
      </Link>
      <button
        onClick={onDismiss}
        className="text-wvsu-blue-deeper/60 hover:text-wvsu-blue-deeper text-lg font-bold leading-none"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
