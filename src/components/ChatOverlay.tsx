"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Check, CheckCircle2, Clock3, MessageSquare, SendHorizontal, ShieldCheck, X, XCircle } from "lucide-react";

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
  const verifyClaim = useMutation(api.chat.verifyClaim);

  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const challengeStatus = convoDetails?.challengeStatus ?? "accepted";
  const isItemPoster = convoDetails?.isItemOwner;
  const showItemReceivedButton =
    convoDetails !== undefined &&
    convoDetails !== null &&
    isItemPoster === false &&
    convoDetails.item?.status === "open" &&
    challengeStatus === "accepted";

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

  const handleVerify = async (accept: boolean) => {
    if (!accept && !confirm("Mark this as a mismatch? The user will be blocked from this item.")) return;
    setVerifying(true);
    try {
      await verifyClaim({ conversationId, accept });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[320px] bg-white border-2 border-wvsu-blue z-[100] shadow-[6px_6px_0_var(--blue)]">
      {/* Header */}
      <div className="bg-wvsu-blue px-3.5 py-2.5 flex items-center justify-between">
        <div className="text-xs font-bold text-white uppercase font-mono truncate flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          {otherUserName}
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-lg font-bold leading-none"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pending: Item poster sees the challenge answer and accept/reject */}
      {challengeStatus === "pending" && isItemPoster && (
        <div className="p-3 bg-[#fff8e1] border-b border-wvsu-gold space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-wvsu-muted font-mono flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Claim Review
          </div>
          <div className="text-xs text-wvsu-text">
            <span className="font-bold">Challenge:</span> {challenge ?? convoDetails?.item?.challenge}
          </div>
          <div className="text-xs text-wvsu-text bg-white border border-wvsu-border p-2">
            <span className="font-bold">Their answer:</span> {convoDetails?.challengeAnswer}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleVerify(true)}
              disabled={verifying}
              className="flex-1 bg-found-green text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-found-green/90 disabled:opacity-50 inline-flex items-center justify-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              onClick={() => handleVerify(false)}
              disabled={verifying}
              className="flex-1 bg-lost-red text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-lost-red/90 disabled:opacity-50 inline-flex items-center justify-center gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Mismatch
            </button>
          </div>
        </div>
      )}

      {/* Pending: Claimer sees waiting message */}
      {challengeStatus === "pending" && !isItemPoster && (
        <div className="p-4 bg-[#fff8e1] border-b border-wvsu-gold text-center">
          <Clock3 className="h-5 w-5 mx-auto mb-1 text-wvsu-text" />
          <div className="text-xs font-bold text-wvsu-text uppercase font-mono">
            Waiting for verification
          </div>
          <div className="text-[11px] text-wvsu-muted mt-1">
            The poster is reviewing your answer.
          </div>
        </div>
      )}

      {/* Rejected */}
      {challengeStatus === "rejected" && (
        <div className="p-4 bg-lost-red/10 border-b border-lost-red text-center">
          <XCircle className="h-5 w-5 mx-auto mb-1 text-lost-red" />
          <div className="text-xs font-bold text-lost-red uppercase font-mono">
            Claim Rejected
          </div>
          <div className="text-[11px] text-wvsu-muted mt-1">
            {isItemPoster
              ? "You marked this as a mismatch."
              : "Sorry! The details didn't match. Keep looking!"}
          </div>
        </div>
      )}

      {/* Accepted: Show messages */}
      {challengeStatus === "accepted" && (
        <>
          {/* Messages */}
          <div
            ref={bodyRef}
            className="p-3 h-40 overflow-y-auto bg-wvsu-off-white flex flex-col gap-2"
          >
            {challenge && (
              <div className="bg-[#fff8e1] border border-wvsu-gold px-2.5 py-2 text-[11px] text-center self-center max-w-[90%] inline-flex items-center gap-1 justify-center">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verification passed
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
            {messages?.length === 0 && (
              <div className="text-[11px] text-wvsu-muted text-center self-center">
                Verification accepted! Start chatting.
              </div>
            )}
          </div>

          {/* Resolved status */}
          {convoDetails?.item?.status === "resolved" && (
            <div className="px-3 py-1.5 bg-found-green/10 border-t border-wvsu-border text-center">
              <span className="text-[11px] font-bold text-found-green font-mono uppercase inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Item Returned - Karma Awarded
              </span>
            </div>
          )}

          {/* "Item Received" button - only the claimer confirms */}
          {showItemReceivedButton && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1]">
              <button
                onClick={async () => {
                  if (!confirm("Confirm you have received the item? Karma will be awarded.")) return;
                  setConfirming(true);
                  try {
                    await confirmReturn({ conversationId });
                  } finally {
                    setConfirming(false);
                  }
                }}
                disabled={confirming}
                className="w-full bg-found-green text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-found-green/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confirming ? "Confirming..." : "Item Received"}
              </button>
            </div>
          )}

          {/* Input */}
          {convoDetails?.item?.status !== "resolved" && (
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
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
