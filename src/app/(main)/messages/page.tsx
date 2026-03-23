"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChatOverlay } from "../../../components/ChatOverlay";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { UserAvatar } from "../../../components/UserAvatar";
import { Id } from "../../../../convex/_generated/dataModel";
import { Clock3, MessageSquare, Trash2 } from "lucide-react";

export default function MessagesPage() {
  const conversations = useQuery(api.chat.getMyConversations);
  const stats = useQuery(api.auth.getUserStats);
  const deleteConversation = useMutation(api.chat.deleteConversation);
  const [conversationToDelete, setConversationToDelete] = useState<Id<"conversations"> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeChatId, setActiveChatId] = useState<Id<"conversations"> | null>(
    null
  );

  const activeConvo = conversations?.find((c: { _id: Id<"conversations"> }) => c._id === activeChatId);

  const handleDeleteClick = (e: React.MouseEvent, convoId: Id<"conversations">) => {
    e.stopPropagation();
    setConversationToDelete(convoId);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    setDeleting(true);
    try {
      if (activeChatId === conversationToDelete) setActiveChatId(null);
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
            <button
              key={convo._id}
              onClick={() => setActiveChatId(convo._id)}
              className={`w-full bg-white border rounded-2xl p-4 flex items-center gap-3 text-left transition-all hover:border-wvsu-blue hover:shadow-sm group ${
                activeChatId === convo._id
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
            </button>
          ))}
        </div>
      )}

      {/* Chat Overlay */}
      {activeChatId && activeConvo && stats && (
        <ChatOverlay
          conversationId={activeChatId}
          currentUserId={stats._id}
          otherUserName={activeConvo.otherUser?.name ?? "User"}
          challenge={activeConvo.item?.challenge}
          onClose={() => setActiveChatId(null)}
        />
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
