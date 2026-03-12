"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChatOverlayProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  otherUserName: string;
  challenge?: string;
  onClose: () => void;
}

export function ChatOverlay({
  conversationId,
  currentUserId,
  otherUserName,
  challenge,
  onClose,
}: ChatOverlayProps) {
  const messages = useQuery(api.chat.listMessages, { conversationId });
  const convoDetails = useQuery(api.chat.getConversationDetails, { conversationId });
  const sendMessage = useMutation(api.chat.sendMessage);
  const confirmReturn = useMutation(api.karma.confirmReturn);

  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    await sendMessage({ conversationId, body: trimmed });
  };

  return (
    <div className="fixed bottom-6 right-6 w-[300px] bg-white border-2 border-wvsu-blue z-[100] shadow-[6px_6px_0_var(--blue)]">
      {/* Header */}
      <div className="bg-wvsu-blue px-3.5 py-2.5 flex items-center justify-between">
        <div className="text-xs font-bold text-white uppercase font-mono truncate">
          💬 {otherUserName}
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-lg font-bold leading-none"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        ref={bodyRef}
        className="p-3 h-40 overflow-y-auto bg-wvsu-off-white flex flex-col gap-2"
      >
        {challenge && (
          <div className="bg-[#fff8e1] border border-wvsu-gold px-2.5 py-2 text-[11px] text-center self-center max-w-[90%]">
            🔒 Verification: &quot;{challenge}&quot;
          </div>
        )}
        {messages?.map((msg: { _id: string; senderId: string; body: string }) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg._id}
              className={`max-w-[75%] px-2.5 py-2 text-xs ${
                isMe
                  ? "bg-wvsu-blue text-white self-end"
                  : "bg-white border border-wvsu-border text-wvsu-text self-start"
              }`}
            >
              {msg.body}
            </div>
          );
        })}
        {messages?.length === 0 && !challenge && (
          <div className="text-[11px] text-wvsu-muted text-center self-center">
            Start the conversation!
          </div>
        )}
      </div>

      {/* Resolved status */}
      {convoDetails?.item?.status === "resolved" && (
        <div className="px-3 py-1.5 bg-found-green/10 border-t border-wvsu-border text-center">
          <span className="text-[11px] font-bold text-found-green font-mono uppercase">
            ✅ Item Returned — Karma Awarded
          </span>
        </div>
      )}

      {/* Confirm Return button (visible to item owner only) */}
      {convoDetails?.isItemOwner && convoDetails?.item?.status === "open" && (
        <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1]">
          <button
            onClick={async () => {
              if (!confirm("Confirm that the item has been returned? This will award karma to the finder.")) return;
              setConfirming(true);
              try {
                await confirmReturn({ conversationId });
              } finally {
                setConfirming(false);
              }
            }}
            disabled={confirming}
            className="w-full bg-found-green text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-found-green/90 transition-colors disabled:opacity-50"
          >
            {confirming ? "Confirming..." : "✅ Confirm Return & Award Karma"}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex border-t-2 border-wvsu-border">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 border-none px-3 py-2.5 text-xs font-sans outline-none bg-transparent"
        />
        <button
          onClick={handleSend}
          className="bg-wvsu-blue text-white px-3.5 font-bold text-sm hover:bg-wvsu-blue-dark transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}
