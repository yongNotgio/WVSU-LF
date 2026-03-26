"use client";

import { CSSProperties, useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConfirmModal } from "./ConfirmModal";
import Image from "next/image";
import { Camera, Check, CheckCircle2, Clock3, Expand, ImagePlus, MessageSquare, Minus, Minimize2, SendHorizontal, ShieldCheck, X, XCircle } from "lucide-react";

interface ChatOverlayProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  otherUserName: string;
  challenge?: string;
  nonMaximizedClassName?: string;
  nonMaximizedStyle?: CSSProperties;
  onMinimize?: () => void;
  onClose: () => void;
}

export function ChatOverlay({
  conversationId,
  currentUserId,
  otherUserName,
  challenge,
  nonMaximizedClassName,
  nonMaximizedStyle,
  onMinimize,
  onClose,
}: ChatOverlayProps) {
  const messages = useQuery(api.chat.listMessages, { conversationId });
  const convoDetails = useQuery(api.chat.getConversationDetails, { conversationId });
  const sendMessage = useMutation(api.chat.sendMessage);
  const confirmReturn = useMutation(api.karma.confirmReturn);
  const verifyClaim = useMutation(api.chat.verifyClaim);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const markRead = useMutation(api.chat.markConversationRead);

  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showConfirmReceiveModal, setShowConfirmReceiveModal] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const meetupProofInputRef = useRef<HTMLInputElement>(null);

  const challengeStatus = convoDetails?.challengeStatus ?? "accepted";
  const isVerifier = convoDetails?.isVerifier ?? false;
  const isOwner = convoDetails?.isOwner ?? false;
  const isFinder = convoDetails?.isFinder ?? false;
  const canUploadMeetupProof = convoDetails?.canUploadMeetupProof ?? false;
  const canConfirmReturn = convoDetails?.canConfirmReturn ?? false;
  const roleLabel = isOwner ? "Owner" : isFinder ? "Finder" : "Participant";

  const showItemReceivedButton =
    convoDetails !== undefined &&
    convoDetails !== null &&
    canConfirmReturn &&
    !!convoDetails.hasMeetupProof;

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark conversation as read when opened and when new messages arrive
  useEffect(() => {
    markRead({ conversationId });
  }, [markRead, conversationId, messages?.length]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    await sendMessage({ conversationId, body: trimmed });
  };

  const handleImageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isMeetupProof: boolean
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const trimmed = body.trim();
      setBody("");
      await sendMessage({
        conversationId,
        body: trimmed || undefined,
        imageId: storageId,
        isMeetupProof,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (accept: boolean) => {
    setVerifying(true);
    try {
      await verifyClaim({ conversationId, accept });
      if (!accept) {
        setShowMismatchModal(false);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmReceived = async () => {
    setConfirming(true);
    try {
      await confirmReturn({ conversationId });
      setShowConfirmReceiveModal(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      style={!isMaximized ? nonMaximizedStyle : undefined}
      className={`fixed bg-white border border-[#1A9FD4]/30 z-[100] rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(26,159,212,0.15)] transition-all ${
        isMaximized
          ? "inset-3 sm:inset-5 md:inset-6"
          : `${nonMaximizedClassName ?? "bottom-4 right-4 sm:bottom-6 sm:right-6"} w-[340px] max-w-[calc(100vw-2rem)]`
      }`}
    >
      {/* Header */}
      <div className="bg-[#1A9FD4] px-4 py-3 flex items-center justify-between">
        <div className="text-xs font-bold text-white uppercase font-sans truncate flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0" />
          {otherUserName}
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="text-white/70 hover:text-white p-1"
              aria-label="Minimize to chat head"
              type="button"
            >
              <Minus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsMaximized((current) => !current)}
            className="text-white/70 hover:text-white p-1"
            aria-label={isMaximized ? "Minimize chat" : "Maximize chat"}
            type="button"
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-lg font-bold leading-none p-1"
            aria-label="Close chat"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-1.5 bg-[#E8F7FF] border-b border-[#B6E0FE] text-[10px] uppercase tracking-wider font-mono text-[#0B6E99]">
        Your role: {roleLabel}
      </div>

      {/* Pending: verifier sees challenge answer and accept/reject */}
      {challengeStatus === "pending" && isVerifier && (
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
              type="button"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              onClick={() => setShowMismatchModal(true)}
              disabled={verifying}
              className="flex-1 bg-lost-red text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-lost-red/90 disabled:opacity-50 inline-flex items-center justify-center gap-1"
              type="button"
            >
              <XCircle className="h-3.5 w-3.5" />
              Mismatch
            </button>
          </div>
        </div>
      )}

      {/* Pending: non-verifier sees waiting message */}
      {challengeStatus === "pending" && !isVerifier && (
        <div className="p-4 bg-[#fff8e1] border-b border-wvsu-gold text-center">
          <Clock3 className="h-5 w-5 mx-auto mb-1 text-wvsu-text" />
          <div className="text-xs font-bold text-wvsu-text uppercase font-mono">
            Waiting for verification
          </div>
          <div className="text-[11px] text-wvsu-muted mt-1">
            The verifier is reviewing your answer.
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
            {isVerifier
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
            className={`p-3 overflow-y-auto bg-wvsu-off-white flex flex-col gap-2 ${
              isMaximized ? "h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)]" : "h-44"
            }`}
          >
            {challenge && (
              <div className="bg-[#fff8e1] border border-wvsu-gold px-2.5 py-2 text-[11px] text-center self-center max-w-[90%] inline-flex items-center gap-1 justify-center">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verification passed
              </div>
            )}
            {messages?.map((msg: { _id: string; senderId: string; body?: string; imageUrl?: string | null; isMeetupProof?: boolean }) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg._id}
                  className={`max-w-[80%] px-3 py-2 text-xs rounded-xl ${
                    isMe
                      ? "bg-[#1A9FD4] text-white self-end"
                      : "bg-white border border-[#B6E0FE] text-[#212529] self-start"
                  }`}
                >
                  {msg.isMeetupProof && (
                    <div className="mb-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-80">
                      <Camera className="h-3 w-3" />
                      Meetup Proof
                    </div>
                  )}
                  {msg.imageUrl && (
                    <Image
                      src={msg.imageUrl}
                      alt="Chat attachment"
                      width={240}
                      height={160}
                      className="mb-2 max-h-40 w-full h-auto rounded object-cover"
                    />
                  )}
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
          {!canUploadMeetupProof && canConfirmReturn && !convoDetails?.hasMeetupProof && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1] text-[11px] text-wvsu-muted">
              Waiting for the finder to upload a meetup photo before you can confirm receipt.
            </div>
          )}

          {canUploadMeetupProof && !convoDetails?.hasMeetupProof && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1]">
              <button
                onClick={() => meetupProofInputRef.current?.click()}
                disabled={uploading}
                className="w-full bg-[#5BC4F5] text-[#212529] py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#1A9FD4] hover:text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : "Upload Meetup Proof (Finder)"}
              </button>
            </div>
          )}

          {showItemReceivedButton && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1]">
              <button
                onClick={() => setShowConfirmReceiveModal(true)}
                disabled={confirming}
                className="w-full bg-[#5BC4F5] text-[#212529] py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#1A9FD4] hover:text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
                type="button"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confirming ? "Confirming..." : "Item Received"}
              </button>
            </div>
          )}

          {/* Input */}
          {challengeStatus === "accepted" && convoDetails?.item?.status !== "resolved" && (
            <div className="flex border-t border-wvsu-border">
              <input
                ref={attachmentInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageSelected(event, false)}
              />
              <input
                ref={meetupProofInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageSelected(event, true)}
              />
              <button
                onClick={() => attachmentInputRef.current?.click()}
                disabled={uploading}
                className="border-r border-[#B6E0FE] px-3 text-[#1A9FD4] hover:bg-[#E8F7FF] disabled:opacity-50"
                type="button"
                aria-label="Attach image"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
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
                disabled={uploading}
                className="bg-[#1A9FD4] text-white px-4 font-bold text-sm hover:bg-[#5BC4F5] hover:text-[#212529] transition-colors"
                type="button"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={showMismatchModal}
        title="Reject this claim as a mismatch?"
        description="The claimer will be blocked from this item after you mark the verification as a mismatch."
        confirmLabel="Mark Mismatch"
        tone="danger"
        loading={verifying}
        onConfirm={() => handleVerify(false)}
        onClose={() => {
          if (!verifying) setShowMismatchModal(false);
        }}
      />

      <ConfirmModal
        open={showConfirmReceiveModal}
        title="Confirm item received?"
        description="This marks the item as returned and awards karma to the finder and owner."
        confirmLabel="Confirm Receipt"
        loading={confirming}
        onConfirm={handleConfirmReceived}
        onClose={() => {
          if (!confirming) setShowConfirmReceiveModal(false);
        }}
      />
    </div>
  );
}
