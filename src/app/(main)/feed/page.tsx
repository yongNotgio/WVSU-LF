"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Sidebar } from "../../../components/Sidebar";
import { RightPanel } from "../../../components/RightPanel";
import { ItemCard } from "../../../components/ItemCard";
import { PostItemForm } from "../../../components/PostItemForm";
import { ChatOverlay } from "../../../components/ChatOverlay";
import { Id, Doc } from "../../../../convex/_generated/dataModel";

export default function FeedPage() {
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [typeFilter, setTypeFilter] = useState<"lost" | "found" | undefined>(
    undefined
  );
  const [showPostForm, setShowPostForm] = useState(false);
  const [chatState, setChatState] = useState<{
    conversationId: Id<"conversations">;
    otherUserName: string;
    challenge?: string;
  } | null>(null);

  const stats = useQuery(api.auth.getUserStats);
  const items = useQuery(api.items.getItems, {
    type: typeFilter,
    locationZone: selectedZone === "All Zones" ? undefined : selectedZone,
  });
  const getOrCreateConversation = useMutation(api.chat.getOrCreateConversation);

  const handleContact = async (itemId: string) => {
    const conversationId = await getOrCreateConversation({
      itemId: itemId as Id<"items">,
    });

    // Fetch item info for chat
    const item = items?.find((i: { _id: string; challenge: string }) => i._id === itemId);

    setChatState({
      conversationId,
      otherUserName: "User",
      challenge: item?.challenge,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px]">
      {/* Left Sidebar */}
      <Sidebar selectedZone={selectedZone} onZoneChange={setSelectedZone} />

      {/* Main Content */}
      <div className="p-6 min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="font-display text-2xl text-wvsu-text">
            Lost & Found Feed
          </div>
          <button
            onClick={() => setShowPostForm(true)}
            className="bg-wvsu-blue text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors"
          >
            + Post Item
          </button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTypeFilter(undefined)}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              !typeFilter
                ? "bg-wvsu-blue text-white border-wvsu-blue"
                : "bg-white text-wvsu-muted border-wvsu-border hover:border-wvsu-blue hover:text-wvsu-blue"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("lost")}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              typeFilter === "lost"
                ? "bg-lost-red text-white border-lost-red"
                : "bg-white text-wvsu-muted border-wvsu-border hover:border-lost-red hover:text-lost-red"
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setTypeFilter("found")}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all ${
              typeFilter === "found"
                ? "bg-found-green text-white border-found-green"
                : "bg-white text-wvsu-muted border-wvsu-border hover:border-found-green hover:text-found-green"
            }`}
          >
            Found
          </button>
        </div>

        {/* Items Grid */}
        {items === undefined ? (
          <div className="text-center py-12">
            <div className="text-sm text-wvsu-muted font-mono">
              Loading items...
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📦</div>
            <div className="text-sm font-semibold text-wvsu-text mb-1">
              No items found
            </div>
            <div className="text-xs text-wvsu-muted">
              Be the first to post a lost or found item!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {items.map((item: Doc<"items">) => (
              <ItemCard
                key={item._id}
                item={item}
                currentUserId={stats?._id}
                onContact={handleContact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <RightPanel />

      {/* Post Form Modal */}
      {showPostForm && (
        <PostItemForm onClose={() => setShowPostForm(false)} />
      )}

      {/* Chat Overlay */}
      {chatState && stats && (
        <ChatOverlay
          conversationId={chatState.conversationId}
          currentUserId={stats._id}
          otherUserName={chatState.otherUserName}
          challenge={chatState.challenge}
          onClose={() => setChatState(null)}
        />
      )}
    </div>
  );
}
