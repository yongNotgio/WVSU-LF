"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChatOverlay } from "../../../components/ChatOverlay";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { UserAvatar } from "../../../components/UserAvatar";
import { usePersistentChatHeads } from "../../../lib/usePersistentChatHeads";
import { Id } from "../../../../convex/_generated/dataModel";
import { Clock3, MessageSquare, Trash2 } from "lucide-react";

export default function MessagesPage() {
  const conversations = useQuery(api.chat.getMyConversations);
  const stats = useQuery(api.auth.getUserStats);
  const deleteConversation = useMutation(api.chat.deleteConversation);
  const [conversationToDelete, setConversationToDelete] = useState<Id<"conversations"> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    if (!conversations || !isHydrated) return;

    const validIds = new Set(conversations.map((c) => c._id as string));
    setOpenChatIds((prev) => prev.filter((id) => validIds.has(id)));
    setMinimizedChatIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [conversations, isHydrated, setMinimizedChatIds, setOpenChatIds]);

  const conversationMap = new Map(
    (conversations ?? []).map((c: { _id: Id<"conversations"> }) => [c._id as string, c])
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

  const handleDeleteClick = (e: React.MouseEvent, convoId: Id<"conversations">) => {
    e.stopPropagation();
    setConversationToDelete(convoId);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    setDeleting(true);
    try {
      closeChat(conversationToDelete);
      await deleteConversation({ conversationId: conversationToDelete });
      setConversationToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-1 py-2 sm:px-2">
      <div className="font-display text-2xl text-wvsu-text mb-5 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-wvsu-blue" />
        Messages
      </div>

      {conversations === undefined ? (
        <div className="text-sm text-wvsu-muted font-mono text-center py-12">
          Loading...
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-wvsu-muted" />
          <div className="text-sm font-semibold text-wvsu-text mb-1">
            No conversations yet
          </div>
          <div className="text-xs text-wvsu-muted">
            Contact an item owner or finder to start a conversation.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((convo) => (
            <div
              key={convo._id}
              role="button"
              tabIndex={0}
              onClick={() => openChat(convo._id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openChat(convo._id);
                }
              }}
              className={`w-full bg-white border rounded-2xl p-4 flex items-center gap-3 text-left transition-all hover:border-wvsu-blue hover:shadow-sm group ${
                openChatIds.includes(convo._id as string)
                  ? "border-wvsu-blue"
                  : convo.hasUnread
                    ? "border-wvsu-gold"
                    : "border-wvsu-border"
              }`}
            >
              {/* Unread indicator */}
              {convo.hasUnread && (
                <div className="w-2.5 h-2.5 bg-wvsu-gold rounded-full shrink-0 animate-pulse" />
              )}

              {/* Avatar */}
              <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0">
                <UserAvatar
                  name={convo.otherUser?.name}
                  avatarType={convo.otherUser?.avatarType}
                  avatarUrl={convo.otherUser?.avatarUrl}
                  size={40}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className={`text-sm text-wvsu-text truncate flex items-center gap-1.5 ${convo.hasUnread ? "font-bold" : "font-semibold"}`}>
                    {convo.otherUser?.name ?? "Unknown User"}
                    {convo.challengeStatus === "pending" && (
                      <span className="text-[9px] bg-wvsu-gold/20 text-wvsu-gold border border-wvsu-gold px-1.5 py-0.5 font-mono uppercase shrink-0">
                        Pending
                      </span>
                    )}
                    {convo.challengeStatus === "rejected" && (
                      <span className="text-[9px] bg-lost-red/10 text-lost-red border border-lost-red px-1.5 py-0.5 font-mono uppercase shrink-0">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {convo.lastMessage && (
                      <div className="text-[10px] text-wvsu-muted font-mono">
                        {getTimeAgo(convo.lastMessage._creationTime)}
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDeleteClick(e, convo._id)}
                      className="text-wvsu-muted hover:text-lost-red opacity-0 group-hover:opacity-100 transition-all p-0.5"
                      aria-label="Delete conversation"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-wvsu-muted font-mono mt-0.5">
                  Re: {convo.item?.title ?? "Unknown item"}
                </div>
                {convo.challengeStatus === "pending" && (
                  <div className="text-[11px] text-wvsu-gold mt-0.5 font-semibold flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Awaiting verification review
                  </div>
                )}
                {convo.lastMessage && convo.challengeStatus !== "pending" && (
                  <div className={`text-xs truncate mt-0.5 ${convo.hasUnread ? "text-wvsu-text font-semibold" : "text-wvsu-muted"}`}>
                    {convo.lastMessagePreview ?? "No messages yet"}
                  </div>
                )}
                {!convo.lastMessage && convo.challengeStatus !== "pending" && (
                  <div className="text-xs text-wvsu-muted truncate mt-0.5">
                    No messages yet
                  </div>
                )}
              </div>
            </div>
          ))}
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
                className="relative w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white"
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

      <ConfirmModal
        open={conversationToDelete !== null}
        title="Delete conversation?"
        description="This will permanently remove the conversation and all of its messages for both participants."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleting) setConversationToDelete(null);
        }}
      />
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
