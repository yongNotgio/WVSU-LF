"use client";

import { Doc, Id } from "../../convex/_generated/dataModel";

interface ItemCardProps {
  item: Doc<"items">;
  currentUserId?: Id<"users">;
  onContact: (itemId: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  ELECTRONICS: "📱",
  BAGS: "🎒",
  KEYS: "🔑",
  STATIONERY: "📒",
  ACCESSORIES: "⌚",
  "ID/DOCUMENTS": "🪪",
  CLOTHING: "👕",
  OTHER: "📦",
};

export function ItemCard({ item, currentUserId, onContact }: ItemCardProps) {
  const isLost = item.type === "lost";
  const isOwnItem = currentUserId === item.userId;
  const emoji = CATEGORY_EMOJI[item.category] ?? "📦";

  const timeAgo = getTimeAgo(item._creationTime);

  return (
    <div
      className={`bg-white border-2 border-wvsu-border cursor-pointer hover:border-wvsu-blue hover:-translate-y-0.5 transition-all ${
        isLost ? "border-t-4 border-t-lost-red" : "border-t-4 border-t-found-green"
      }`}
    >
      {/* Image Area */}
      <div className="w-full h-[120px] bg-wvsu-light-blue flex items-center justify-center text-[40px] border-b border-wvsu-border relative">
        {emoji}
        <div
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-extrabold uppercase font-mono tracking-wider ${
            isLost ? "bg-lost-red text-white" : "bg-found-green text-white"
          }`}
        >
          {item.type}
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-sm font-bold text-wvsu-text font-display mb-1">
          {item.title}
        </div>
        <div className="text-xs text-wvsu-muted leading-snug mb-2.5 line-clamp-2">
          {item.description}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-wvsu-light-blue text-wvsu-blue font-mono tracking-wide">
            {item.category}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-wvsu-light-blue text-wvsu-blue font-mono tracking-wide">
            📍 {item.locationZone}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-wvsu-border bg-wvsu-off-white">
        <span className="text-[10px] text-wvsu-muted font-mono">{timeAgo}</span>
        {isOwnItem ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-wvsu-muted font-mono">
            Your post
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContact(item._id);
            }}
            className="text-[11px] font-bold text-wvsu-blue border-[1.5px] border-wvsu-blue px-2.5 py-1 uppercase tracking-wide hover:bg-wvsu-blue hover:text-white transition-all"
          >
            Contact {isLost ? "Owner" : "Finder"}
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
