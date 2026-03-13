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
import { Package, ShieldCheck, X } from "lucide-react";

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
  const [claimingItem, setClaimingItem] = useState<Doc<"items"> | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [claimError, setClaimError] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const stats = useQuery(api.auth.getUserStats);
  const items = useQuery(api.items.getItems, {
    type: typeFilter,
    locationZone: selectedZone === "All Zones" ? undefined : selectedZone,
  });
  const getOrCreateConversation = useMutation(api.chat.getOrCreateConversation);

  const handleContact = (itemId: string) => {
    const item = items?.find((i: Doc<"items">) => i._id === itemId);
    if (item) {
      setClaimingItem(item);
      setChallengeAnswer("");
      setClaimError("");
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimingItem || !challengeAnswer.trim()) return;
    setSubmittingClaim(true);
    setClaimError("");
    try {
      const conversationId = await getOrCreateConversation({
        itemId: claimingItem._id,
        challengeAnswer: challengeAnswer.trim(),
      });
      setClaimingItem(null);
      setChatState({
        conversationId,
        otherUserName: "User",
        challenge: claimingItem.challenge,
      });
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Failed to submit claim.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px]">
      {/* Left Sidebar */}
      <Sidebar selectedZone={selectedZone} onZoneChange={setSelectedZone} />

      {/* Main Content */}
      <div className="p-6 min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="font-display text-2xl text-wvsu-text">
            Lost & Found Feed
          </div>
          <div className="flex items-center gap-2">
            <div className="w-30">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full text-sm font-semibold px-2 py-2 border border-wvsu-border rounded"
              >
                <option value="All Zones">All Zones</option>
                {["Library", "CICT Bldg", "CON Bldg", "CAS Bldg", "Canteen Area", "Main Gate"].map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowPostForm(true)}
              className="bg-wvsu-blue text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors"
            >
              + Post Item
            </button>
          </div>
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
            <Package className="h-10 w-10 mx-auto mb-3 text-wvsu-muted" />
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

      {/* Claim Verification Modal */}
      {claimingItem && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-wvsu-blue w-full max-w-sm shadow-[6px_6px_0_var(--blue)]">
            <div className="bg-wvsu-blue px-4 py-3 flex items-center justify-between">
              <div className="font-display text-lg text-white">Verify Ownership</div>
              <button
                onClick={() => setClaimingItem(null)}
                className="text-white/70 hover:text-white text-xl font-bold leading-none"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-xs text-wvsu-muted font-mono">
                Re: <span className="font-bold text-wvsu-text">{claimingItem.title}</span>
              </div>
              <div className="bg-[#fff8e1] border border-wvsu-gold p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-wvsu-muted font-mono mb-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verification Challenge
                </div>
                <div className="text-sm text-wvsu-text font-semibold">
                  {claimingItem.challenge}
                </div>
              </div>
              {claimError && (
                <div className="bg-lost-red/10 border border-lost-red text-lost-red text-xs px-3 py-2">
                  {claimError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitClaim();
                  }}
                  placeholder="Prove you're the owner / have the item..."
                  className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
                />
              </div>
              <button
                onClick={handleSubmitClaim}
                disabled={!challengeAnswer.trim() || submittingClaim}
                className="w-full bg-wvsu-blue text-white py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
              >
                {submittingClaim ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
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
