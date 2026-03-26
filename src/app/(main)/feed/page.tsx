"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Sidebar } from "../../../components/Sidebar";
import { RightPanel } from "../../../components/RightPanel";
import { ItemCard } from "../../../components/ItemCard";
import { PostItemForm } from "../../../components/PostItemForm";
import { ChatOverlay } from "../../../components/ChatOverlay";
import { UserAvatar } from "../../../components/UserAvatar";
import { usePersistentChatHeads } from "../../../lib/usePersistentChatHeads";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { Package, ShieldCheck, X } from "lucide-react";

interface FeedItem extends Doc<"items"> {
  posterCollege?: string;
  posterKarma?: number;
  posterName?: string;
}

export default function FeedPage() {
  const [selectedZone, setSelectedZone] = useState("All Zones");
  const [typeFilter, setTypeFilter] = useState<"lost" | "found" | undefined>(
    undefined
  );
  const [showPostForm, setShowPostForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [claimingItem, setClaimingItem] = useState<FeedItem | null>(null);
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [claimError, setClaimError] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const stats = useQuery(api.auth.getUserStats);
  const myConversations = useQuery(api.chat.getMyConversations);
  const items = useQuery(api.items.getItems, {
    type: typeFilter,
    locationZone: selectedZone === "All Zones" ? undefined : selectedZone,
  });
  const getOrCreateConversation = useMutation(api.chat.getOrCreateConversation);
  const storageKey = `wvsulf.chatheads.${stats?._id ?? "guest"}`;
  const {
    openChatIds,
    setOpenChatIds,
    minimizedChatIds,
    setMinimizedChatIds,
    isHydrated,
  } = usePersistentChatHeads(storageKey);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!myConversations || !isHydrated) return;

    const validIds = new Set(myConversations.map((c) => c._id as string));
    setOpenChatIds((prev) => prev.filter((id) => validIds.has(id)));
    setMinimizedChatIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [isHydrated, myConversations, setMinimizedChatIds, setOpenChatIds]);

  const conversationMap = new Map(
    (myConversations ?? []).map((c: { _id: Id<"conversations"> }) => [c._id as string, c])
  );

  const activeConversations = openChatIds
    .filter((id) => !minimizedChatIds.includes(id))
    .map((id) => conversationMap.get(id))
    .filter(Boolean);

  const visibleActiveConversations = isMobile
    ? activeConversations.slice(-1)
    : activeConversations;

  const minimizedConversations = minimizedChatIds
    .map((id) => conversationMap.get(id))
    .filter(Boolean);

  const openChat = (conversationId: Id<"conversations">) => {
    const key = conversationId as string;
    setOpenChatIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setMinimizedChatIds((prev) => prev.filter((id) => id !== key));
  };

  const closeChat = (conversationId: Id<"conversations">) => {
    const key = conversationId as string;
    setOpenChatIds((prev) => prev.filter((id) => id !== key));
    setMinimizedChatIds((prev) => prev.filter((id) => id !== key));
  };

  const minimizeChat = (conversationId: Id<"conversations">) => {
    const key = conversationId as string;
    setMinimizedChatIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const restoreChat = (conversationId: Id<"conversations">) => {
    const key = conversationId as string;
    setMinimizedChatIds((prev) => prev.filter((id) => id !== key));
    setOpenChatIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleContact = (itemId: string) => {
    const item = items?.find((i: FeedItem) => i._id === itemId);
    if (item) {
      setExpandedItem(null);
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
      openChat(conversationId);
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Failed to submit claim.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="page">
      {/* Left Sidebar */}
      <div className="l-col hidden lg:block">
        <Sidebar selectedZone={selectedZone} onZoneChange={setSelectedZone} />
      </div>

      {/* Main Content */}
      <div className="c-col min-h-[calc(100vh-56px)]">
        <div className="feed-sticky-top">
          <div className="mb-4">
            <h1 className="font-display text-3xl font-bold text-wvsu-text tracking-tight">Lost <span className="text-wvsu-blue">&</span> Found</h1>
            <p className="text-sm text-wvsu-muted mt-1">Help reunite items with their owners</p>
          </div>
          <div className="feed-header mb-4 space-y-3 sm:space-y-0">
            <div className="tab-group">
              <button
                onClick={() => setTypeFilter(undefined)}
                className={`ftab ${!typeFilter ? "on" : ""}`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("lost")}
                className={`ftab ${typeFilter === "lost" ? "on" : ""}`}
              >
                Lost
              </button>
              <button
                onClick={() => setTypeFilter("found")}
                className={`ftab ${typeFilter === "found" ? "on" : ""}`}
              >
                Found
              </button>
            </div>
            <div className="feed-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="loc-sel h-9 min-w-[140px] w-full sm:w-auto"
              >
                <option value="All Zones">All Zones</option>
                {["Library", "CICT Bldg", "Pescar Bldg", "CBM Bldg", "COC Bldg", "NAB", "CON Bldg", "CAS Bldg", "Canteen Area", "Main Gate"].map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowPostForm(true)}
                className="new-post-btn text-sm w-full sm:w-auto"
              >
                + Post a Report
              </button>
            </div>
          </div>
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
          <div className="feed-stack">
            {items.map((item: FeedItem) => (
              <div
                key={item._id}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => setExpandedItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedItem(item);
                  }
                }}
              >
                <ItemCard
                  item={item}
                  currentUserId={stats?._id}
                  onContact={handleContact}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="r-col hidden lg:block">
        <RightPanel />
      </div>

      {/* Expanded Item Modal */}
      {expandedItem && (
        <div
          className="fixed inset-0 bg-black/50 z-[210] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setExpandedItem(null)}
        >
          <div
            className="w-full max-w-3xl bg-white border border-wvsu-blue/30 rounded-2xl shadow-xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setExpandedItem(null)}
                className="text-wvsu-muted hover:text-wvsu-text"
                aria-label="Close expanded item"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scale-[1.03] sm:scale-[1.05] origin-top">
              <ItemCard
                item={expandedItem}
                currentUserId={stats?._id}
                onContact={handleContact}
              />
            </div>
          </div>
        </div>
      )}

      {/* Post Form Modal */}
      {showPostForm && (
        <PostItemForm onClose={() => setShowPostForm(false)} />
      )}

      {/* Claim Verification Modal */}
      {claimingItem && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-wvsu-blue/30 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-wvsu-blue px-4 py-3 flex items-center justify-between">
              <div className="font-display text-lg text-white">Verification Step</div>
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
              <div className="bg-[#fff8e1] border border-wvsu-gold/70 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-wvsu-muted font-mono mb-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verification Challenge
                </div>
                <div className="text-[11px] text-wvsu-muted mb-1">
                  {claimingItem.type === "found"
                    ? "Answer to prove you are the owner of this item."
                    : "Answer to prove you are the finder for this lost report."}
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
                  placeholder={
                    claimingItem.type === "found"
                      ? "e.g., Correct color/brand/unique mark"
                      : "e.g., Where and when you found it"
                  }
                  className="w-full border border-wvsu-border rounded-xl px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
                />
              </div>
              <button
                onClick={handleSubmitClaim}
                disabled={!challengeAnswer.trim() || submittingClaim}
                className="w-full bg-wvsu-blue text-white py-2.5 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
              >
                {submittingClaim ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docked Chat Windows */}
      {stats && visibleActiveConversations.map((convo, index) => {
        if (!convo) return null;
        const desktopIndex = isMobile ? 0 : index;

        return (
          <ChatOverlay
            key={convo._id}
            conversationId={convo._id}
            currentUserId={stats._id}
            otherUserName={convo.otherUser?.name ?? "User"}
            challenge={convo.item?.challenge}
            nonMaximizedClassName="bottom-20 left-2 right-2 sm:left-auto sm:bottom-6"
            nonMaximizedStyle={
              isMobile
                ? { right: "0.5rem", left: "0.5rem" }
                : { right: `${16 + desktopIndex * 356}px` }
            }
            onMinimize={() => minimizeChat(convo._id)}
            onClose={() => closeChat(convo._id)}
          />
        );
      })}

      {/* Chat Heads */}
      {stats && minimizedConversations.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[110] flex items-center gap-2 max-w-[calc(100vw-1.5rem)] overflow-x-auto pb-1">
          {minimizedConversations.map((convo) => {
            if (!convo) return null;
            return (
              <button
                key={convo._id}
                onClick={() => restoreChat(convo._id)}
                className="relative w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white shrink-0"
                aria-label={`Restore chat with ${convo.otherUser?.name ?? "User"}`}
                type="button"
              >
                <UserAvatar
                  name={convo.otherUser?.name}
                  avatarType={convo.otherUser?.avatarType}
                  avatarUrl={convo.otherUser?.avatarUrl}
                  size={48}
                  className="w-full h-full"
                />
                {convo.hasUnread && (
                  <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-lost-red border border-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
