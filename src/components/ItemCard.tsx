"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Image from "next/image";
import { Briefcase, CreditCard, KeyRound, MapPin, NotebookPen, Package, Shirt, Smartphone, Watch, type LucideIcon } from "lucide-react";

interface ItemCardProps {
  item: Doc<"items">;
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
    <div className="icard bg-white border border-[#E9ECEF] rounded-[14px] shadow-md flex flex-col overflow-hidden cursor-pointer transition-all animate-[up_0.35s_var(--ease2)_both]">
      {/* Image Area */}
      <div className={`ic-thumb w-full h-[180px] flex items-center justify-center text-[38px] border-b border-[#E9ECEF] flex-shrink-0 transition-transform overflow-hidden relative ${isLost ? 'bg-[#FFE3E3]' : 'bg-[#D3F9D8]'}`}> 
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="absolute inset-0 object-cover"
            />
            <div className={`absolute inset-0 ${isLost ? 'bg-[#FFE3E3]/20' : 'bg-[#D3F9D8]/20'}`} />
          </>
        ) : (
          <ItemIcon className={`h-12 w-12 ${isLost ? 'text-[#C92A2A]' : 'text-[#1C7C34]'}`} />
        )}
      </div>
      {/* Body */}
      <div className="ic-main flex-1 px-3 pt-3 pb-2 flex flex-col min-w-0">
        <div className="ic-top flex items-center gap-1.5 mb-2">
          <span className={`tag ${isLost ? 'tag-lost' : 'tag-found'} font-['Plus_Jakarta_Sans',sans-serif] text-[.62rem] font-bold uppercase px-2 py-0.5 rounded bg-[${isLost ? '#FFE3E3' : '#D3F9D8'}] text-[${isLost ? '#C92A2A' : '#1C7C34'}]`}>{isLost ? 'Lost' : 'Found'}</span>
          <span className="tag-cat text-[.67rem] font-medium text-[#868E96]">{item.category}</span>
          {/* Status dot: open = active, resolved = done, expired/flagged = pend */}
          <span className={`sdot ml-auto w-[7px] h-[7px] rounded-full flex-shrink-0 ${item.status === 'open' ? 'bg-[#51CF66] shadow-[0_0_0_3px_rgba(81,207,102,.2)]' : item.status === 'resolved' ? 'bg-[#ADB5BD]' : 'bg-[#FCC419] shadow-[0_0_0_3px_rgba(252,196,25,.2)]'}`}></span>
        </div>
        <div className="ic-title font-['Plus_Jakarta_Sans',sans-serif] text-[.88rem] font-bold text-[#212529] leading-[1.3] mb-1.5">{item.title}</div>
        <div className="ic-desc text-[.73rem] text-[#868E96] leading-snug mb-2 flex-1 line-clamp-2">{item.description}</div>
        <div className="ic-chips flex gap-1 flex-wrap mb-2.5">
          <span className="chip inline-flex items-center gap-1 bg-[#F8F9FA] border border-[#E9ECEF] px-2 py-0.5 rounded text-[.65rem] font-semibold text-[#868E96]">{item.category}</span>
          <span className="chip inline-flex items-center gap-1 bg-[#F8F9FA] border border-[#E9ECEF] px-2 py-0.5 rounded text-[.65rem] font-semibold text-[#868E96]"><MapPin className="h-3 w-3" />{item.locationZone}</span>
        </div>
      </div>
      {/* Footer */}
      <div className="ic-foot flex items-center justify-between gap-1.5 pt-2 border-t border-[#E9ECEF] mt-auto bg-[#F8F9FA]">
        <span className="ptime text-[.62rem] text-[#ADB5BD]">{timeAgo}</span>
        {isOwnItem ? (
          <span className="done-tag px-2.5 py-1 flex-shrink-0 bg-[#F8F9FA] border border-[#E9ECEF] rounded text-[#ADB5BD] font-['Outfit',sans-serif] text-[.7rem] font-semibold">Your post</span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContact(item._id);
            }}
            className="claim-btn px-3 py-1.5 bg-[#5BC4F5] text-[#212529] border-none rounded font-['Outfit',sans-serif] text-[.73rem] font-bold cursor-pointer whitespace-nowrap flex-shrink-0 shadow-md transition-all hover:scale-105 hover:shadow-lg"
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
