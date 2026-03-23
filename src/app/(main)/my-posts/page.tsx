"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { FileText, MapPin, Pin } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-found-green/10 text-found-green border-found-green",
  resolved: "bg-wvsu-blue/10 text-wvsu-blue border-wvsu-blue",
  expired: "bg-wvsu-muted/10 text-wvsu-muted border-wvsu-muted",
  flagged: "bg-lost-red/10 text-lost-red border-lost-red",
};

export default function MyPostsPage() {
  const items = useQuery(api.items.getMyItems);
  const resolveItem = useMutation(api.items.resolveItem);
  const [itemToResolve, setItemToResolve] = useState<Id<"items"> | null>(null);
  const [resolving, setResolving] = useState(false);

  const handleConfirmResolve = async () => {
    if (!itemToResolve) return;
    setResolving(true);
    try {
      await resolveItem({ itemId: itemToResolve });
      setItemToResolve(null);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-1 py-2 sm:px-2">
      <div className="font-display text-2xl text-wvsu-text mb-5 flex items-center gap-2">
        <Pin className="h-6 w-6 text-wvsu-blue" />
        My Posts
      </div>

      {items === undefined ? (
        <div className="text-sm text-wvsu-muted font-mono text-center py-12">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 mx-auto mb-3 text-wvsu-muted" />
          <div className="text-sm font-semibold text-wvsu-text mb-1">
            No posts yet
          </div>
          <div className="text-xs text-wvsu-muted">
            Head to the Feed to post a lost or found item.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: Doc<"items">) => (
            <div
              key={item._id}
              className="bg-white border border-wvsu-border rounded-2xl p-4 flex items-start gap-4 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-md ${
                      item.type === "lost"
                        ? "bg-lost-red text-white"
                        : "bg-found-green text-white"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 border rounded-md ${
                      STATUS_STYLES[item.status] ?? ""
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-sm font-bold text-wvsu-text font-display">
                  {item.title}
                </div>
                <div className="text-xs text-wvsu-muted mt-1 line-clamp-2">
                  {item.description}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-wvsu-light-blue text-wvsu-blue font-mono rounded-md">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-wvsu-light-blue text-wvsu-blue font-mono rounded-md">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.locationZone}
                    </span>
                  </span>
                </div>
              </div>
              {item.status === "open" && (
                <button
                  onClick={() => setItemToResolve(item._id)}
                  className="text-[11px] font-bold text-found-green border border-found-green rounded-xl px-3 py-1.5 uppercase tracking-wide hover:bg-found-green hover:text-white transition-all shrink-0"
                  type="button"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={itemToResolve !== null}
        title="Mark item as resolved?"
        description="Use this after the item has been returned or the case has been closed. This action updates the post status immediately."
        confirmLabel="Resolve Item"
        loading={resolving}
        onConfirm={handleConfirmResolve}
        onClose={() => {
          if (!resolving) setItemToResolve(null);
        }}
      />
    </div>
  );
}
