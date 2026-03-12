"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConfirmModal } from "./ConfirmModal";
import Image from "next/image";
import { Camera, Check, CheckCircle2, Clock3, Expand, ImagePlus, MessageSquare, Minimize2, SendHorizontal, ShieldCheck, X, XCircle } from "lucide-react";

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
  const isItemPoster = convoDetails?.isItemOwner;
  const showItemReceivedButton =
    convoDetails !== undefined &&
    convoDetails !== null &&
    isItemPoster === false &&
    convoDetails.item?.status === "open" &&
    challengeStatus === "accepted" &&
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
      className={`fixed bg-white border-2 border-wvsu-blue z-[100] shadow-[6px_6px_0_var(--blue)] transition-all ${
        isMaximized
          ? "inset-4 md:inset-6"
          : "bottom-6 right-6 w-[320px] max-w-[calc(100vw-3rem)]"
      }`}
    >
      {/* Header */}
      <div className="bg-wvsu-blue px-3.5 py-2.5 flex items-center justify-between">
        <div className="text-xs font-bold text-white uppercase font-mono truncate flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          {otherUserName}
        </div>
        <div className="flex items-center gap-1">
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
            className={`p-3 overflow-y-auto bg-wvsu-off-white flex flex-col gap-2 ${
              isMaximized ? "h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)]" : "h-40"
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
                  className={`max-w-[75%] px-2.5 py-2 text-xs ${
                    isMe
                      ? "bg-wvsu-blue text-white self-end"
                      : "bg-white border border-wvsu-border text-wvsu-text self-start"
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
                      className="mb-2 max-h-40 w-full rounded object-cover"
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
          {!isItemPoster && convoDetails?.item?.status === "open" && challengeStatus === "accepted" && !convoDetails?.hasMeetupProof && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1] text-[11px] text-wvsu-muted">
              Waiting for the poster to upload a meetup photo before you can confirm item received.
            </div>
          )}

          {isItemPoster && convoDetails?.item?.status === "open" && challengeStatus === "accepted" && !convoDetails?.hasMeetupProof && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1]">
              <button
                onClick={() => meetupProofInputRef.current?.click()}
                disabled={uploading}
                className="w-full bg-wvsu-gold text-wvsu-blue-deeper py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : "Upload Meetup Proof"}
              </button>
            </div>
          )}

          {showItemReceivedButton && (
            <div className="px-3 py-2 border-t border-wvsu-border bg-[#fff8e1]">
              <button
                onClick={() => setShowConfirmReceiveModal(true)}
                disabled={confirming}
                className="w-full bg-found-green text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-found-green/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
                type="button"
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
                className="border-r border-wvsu-border px-3 text-wvsu-blue hover:bg-wvsu-light-blue disabled:opacity-50"
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
                className="bg-wvsu-blue text-white px-3.5 font-bold text-sm hover:bg-wvsu-blue-dark transition-colors"
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
        description="This will mark the item as returned and award karma to the participants involved."
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
