"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChatOverlay } from "../../../components/ChatOverlay";
import { Id } from "../../../../convex/_generated/dataModel";
import { Clock3, MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const conversations = useQuery(api.chat.getMyConversations);
  const stats = useQuery(api.auth.getUserStats);
  const [activeChatId, setActiveChatId] = useState<Id<"conversations"> | null>(
    null
  );

  const activeConvo = conversations?.find((c: { _id: Id<"conversations"> }) => c._id === activeChatId);

  return (
    <div className="max-w-3xl mx-auto p-6">
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
        <div className="space-y-2">
          {conversations.map((convo) => (
            <button
              key={convo._id}
              onClick={() => setActiveChatId(convo._id)}
              className={`w-full bg-white border-2 p-4 flex items-center gap-3 text-left transition-all hover:border-wvsu-blue ${
                activeChatId === convo._id
                  ? "border-wvsu-blue"
                  : "border-wvsu-border"
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-wvsu-blue flex items-center justify-center text-white font-extrabold text-sm font-display shrink-0">
                {convo.otherUser?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "??"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-wvsu-text truncate flex items-center gap-1.5">
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
                  {convo.lastMessage && (
                    <div className="text-[10px] text-wvsu-muted font-mono shrink-0">
                      {getTimeAgo(convo.lastMessage._creationTime)}
                    </div>
                  )}
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
                  <div className="text-xs text-wvsu-muted truncate mt-0.5">
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
