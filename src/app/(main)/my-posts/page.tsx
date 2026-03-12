"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-found-green/10 text-found-green border-found-green",
  resolved: "bg-wvsu-blue/10 text-wvsu-blue border-wvsu-blue",
  expired: "bg-wvsu-muted/10 text-wvsu-muted border-wvsu-muted",
  flagged: "bg-lost-red/10 text-lost-red border-lost-red",
};

export default function MyPostsPage() {
  const items = useQuery(api.items.getMyItems);
  const resolveItem = useMutation(api.items.resolveItem);

  const handleResolve = async (itemId: Id<"items">) => {
    if (confirm("Mark this item as resolved?")) {
      await resolveItem({ itemId });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="font-display text-2xl text-wvsu-text mb-5">
        📌 My Posts
      </div>

      {items === undefined ? (
        <div className="text-sm text-wvsu-muted font-mono text-center py-12">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
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
              className="bg-white border-2 border-wvsu-border p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 ${
                      item.type === "lost"
                        ? "bg-lost-red text-white"
                        : "bg-found-green text-white"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 border ${
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-wvsu-light-blue text-wvsu-blue font-mono">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-wvsu-light-blue text-wvsu-blue font-mono">
                    📍 {item.locationZone}
                  </span>
                </div>
              </div>
              {item.status === "open" && (
                <button
                  onClick={() => handleResolve(item._id)}
                  className="text-[11px] font-bold text-found-green border-[1.5px] border-found-green px-3 py-1.5 uppercase tracking-wide hover:bg-found-green hover:text-white transition-all shrink-0"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
