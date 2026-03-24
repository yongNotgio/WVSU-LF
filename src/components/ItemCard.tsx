"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Image from "next/image";
import { Briefcase, CreditCard, KeyRound, MapPin, NotebookPen, Package, Shirt, Smartphone, Watch, Zap, type LucideIcon } from "lucide-react";

interface ItemFeedCard extends Doc<"items"> {
  posterCollege?: string;
  posterKarma?: number;
  posterName?: string;
}

interface ItemCardProps {
  item: ItemFeedCard;
  currentUserId?: Id<"users">;
  onContact: (itemId: string) => void;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ELECTRONICS: Smartphone,
  BAGS: Briefcase,
  KEYS: KeyRound,
  STATIONERY: NotebookPen,
  ACCESSORIES: Watch,
  "ID/DOCUMENTS": CreditCard,
  CLOTHING: Shirt,
  OTHER: Package,
};

export function ItemCard({ item, currentUserId, onContact }: ItemCardProps) {
  const isLost = item.type === "lost";
  const isOwnItem = currentUserId === item.userId;
  const ItemIcon = CATEGORY_ICONS[item.category] ?? Package;
  const imageUrl = useQuery(
    api.items.getImageUrl,
    item.imageId ? { storageId: item.imageId } : "skip"
  );
  const timeAgo = getTimeAgo(item._creationTime);

  return (
    <article className={`post-card ${isLost ? "tag-lost" : "tag-found"}`}>
      <span className="post-tag">
        {isLost ? "🔴 Lost" : "🟢 Found"}
      </span>

      <div className="post-top">
        <div className={`post-img ${isLost ? "bg-[#FEF2F2]" : "bg-[#ECFDF5]"}`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              width={62}
              height={62}
              className="h-full w-full rounded-[10px] object-cover"
            />
          ) : (
            <ItemIcon className={`h-7 w-7 ${isLost ? "text-[#DC2626]" : "text-[#059669]"}`} />
          )}
        </div>
        <div className="post-info">
          <div className="post-title">{item.title}</div>
          <div className="post-desc">{item.description}</div>
        </div>
      </div>

      <div className="post-meta">
        <span className="post-meta-item">
          <MapPin className="h-[13px] w-[13px]" />
          {item.locationZone}
        </span>
        <span className="post-meta-item">
          <Zap className="h-[13px] w-[13px]" />
          {item.posterKarma ?? 0} pts
        </span>
        <span className="post-meta-item">{item.category}</span>
      </div>

      <div className="post-footer">
        <div className="post-user">
          <div className="post-user-avatar">
            {(item.posterName ?? "WU")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <div className="post-user-name">{item.posterName ?? "WVSU User"}</div>
            <div className="post-user-time">{timeAgo}</div>
          </div>
        </div>
        {isOwnItem ? (
          <div className="post-actions">
            <span className="post-action-btn">Your post</span>
          </div>
        ) : (
          <div className="post-actions">
            <button className="post-action-btn">View</button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContact(item._id);
              }}
              className="post-action-btn primary"
            >
              Contact {isLost ? "Owner" : "Finder"}
            </button>
          </div>
        )}
      </div>
    </article>
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
