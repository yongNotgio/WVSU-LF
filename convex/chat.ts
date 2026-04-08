import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { deriveConversationRoles } from "./roles";

export const getOrCreateConversation = mutation({
  args: {
    itemId: v.id("items"),
    challengeAnswer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.isBanned) throw new Error("Your account has been banned.");
    if (user.shadowBannedUntil && user.shadowBannedUntil > Date.now()) {
      throw new Error("Your account is temporarily restricted. Try again later.");
    }
    if ((user.karma ?? 0) <= -50) {
      throw new Error("Your reputation is too low to submit claims.");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId === userId) {
      throw new Error("You cannot claim your own item.");
    }

    
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .collect();

    const existing = conversations.find(
      (c) => c.participantIds.includes(userId) && c.challengeStatus !== "rejected"
    );
    if (existing) return existing._id;

    const challengeAnswer = args.challengeAnswer?.trim();
    if (!challengeAnswer) {
      throw new Error("Please answer the verification challenge before submitting a claim.");
    }

    // Serial Claimer: 5 different items in 1 hour → -100 karma + 24h shadow-ban
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentClaims = await ctx.db
      .query("claims")
      .withIndex("by_claimerId", (q) => q.eq("claimerId", userId))
      .filter((q) => q.gte(q.field("_creationTime"), oneHourAgo))
      .collect();

    const uniqueItemIds: string[] = [];
    for (const claim of recentClaims) {
      if (!uniqueItemIds.includes(claim.itemId)) {
        uniqueItemIds.push(claim.itemId);
      }
    }
    // Serial Claimer: 5 different items in 1 hour → -100 karma + 24h shadow-ban
    if (uniqueItemIds.length >= 4 && !uniqueItemIds.includes(args.itemId)) {
      await ctx.db.patch(userId, {
        karma: (user.karma ?? 0) - 100,
        shadowBannedUntil: Date.now() + 24 * 60 * 60 * 1000,
      });
      throw new Error("Suspicious activity: too many claims. -100 Karma. 24-hour restriction applied.");
    }

    // Record claim for rate tracking
    await ctx.db.insert("claims", {
      itemId: args.itemId,
      claimerId: userId,
    });

    // Create conversation with pending verification
    const conversationId = await ctx.db.insert("conversations", {
      itemId: args.itemId,
      participantIds: [item.userId, userId],
      challengeAnswer,
      challengeStatus: "pending",
    });

    // Notify verifier that a new claim is waiting for review.
    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: item.userId,
      type: "verification",
      title: "New claim to verify",
      body: `Review the verification answer for \"${item.title}\".`,
      link: "/messages",
      conversationId,
      itemId: item._id,
    });

    return conversationId;
  },
});

export const verifyClaim = mutation({
  args: {
    conversationId: v.id("conversations"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const item = await ctx.db.get(conversation.itemId);
    if (!item) throw new Error("Item not found");
    if (item.status !== "open") throw new Error("Item is no longer open for verification.");

    const { verifierId } = deriveConversationRoles(item, conversation.participantIds);
    if (verifierId !== userId) {
      throw new Error("Only the verification owner can review this claim.");
    }

    if (conversation.challengeStatus !== "pending") throw new Error("This claim has already been reviewed.");

    await ctx.db.patch(args.conversationId, {
      challengeStatus: args.accept ? "accepted" : "rejected",
    });

    const { claimerId } = deriveConversationRoles(item, conversation.participantIds);
    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: claimerId,
      type: "verification",
      title: args.accept ? "Claim accepted" : "Claim rejected",
      body: args.accept
        ? `Your verification for \"${item.title}\" was accepted. You can now chat.`
        : `Your verification for \"${item.title}\" was rejected.`,
      link: "/messages",
      conversationId: conversation._id,
      itemId: item._id,
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    isMeetupProof: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(userId)) {
      throw new Error("Not a participant");
    }

    const claimStatus = conversation.challengeStatus ?? "accepted";
    if (claimStatus !== "accepted") {
      throw new Error("Verification must be accepted before chatting.");
    }

    const item = await ctx.db.get(conversation.itemId);
    if (!item) throw new Error("Item not found");
    const { finderId } = deriveConversationRoles(item, conversation.participantIds);

    const body = args.body?.trim();
    if (!body && !args.imageId) {
      throw new Error("Send a message or attach an image.");
    }

    if (args.isMeetupProof) {
      if (finderId !== userId) {
        throw new Error("Only the finder can upload meetup proof.");
      }
      if (!args.imageId) {
        throw new Error("Meetup proof requires an image.");
      }
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      body,
      imageId: args.imageId,
      isMeetupProof: args.isMeetupProof ?? false,
    });

    const recipientId = conversation.participantIds.find((id) => id !== userId);
    if (recipientId) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: recipientId,
        type: "message",
        title: "New message",
        body: args.isMeetupProof
          ? "A meetup proof message was sent."
          : body || "You received an image attachment.",
        link: "/messages",
        conversationId: conversation._id,
        itemId: item._id,
      });
    }

    return messageId;
  },
});

export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Not a participant");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect()
      .then((messages) =>
        Promise.all(
          messages.map(async (message) => ({
            ...message,
            imageUrl: message.imageId
              ? await ctx.storage.getUrl(message.imageId)
              : null,
          }))
        )
      );
  },
});

export const getConversationDetails = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    if (!conversation.participantIds.includes(userId)) return null;

    const item = await ctx.db.get(conversation.itemId);
    if (!item) return null;

    const { ownerId, finderId, verifierId } = deriveConversationRoles(
      item,
      conversation.participantIds
    );

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
      .collect();
    const hasMeetupProof = messages.some(
      (message) =>
        message.senderId === finderId &&
        !!message.imageId &&
        !!message.isMeetupProof
    );

    const isOwner = ownerId === userId;
    const isFinder = finderId === userId;

    return {
      ...conversation,
      item,
      isItemOwner: item.userId === userId,
      isVerifier: verifierId === userId,
      isOwner,
      isFinder,
      myRole: isOwner ? "owner" : "finder",
      otherRole: isOwner ? "finder" : "owner",
      canUploadMeetupProof:
        isFinder &&
        item.status === "open" &&
        (conversation.challengeStatus ?? "accepted") === "accepted",
      canConfirmReturn:
        isOwner &&
        item.status === "open" &&
        (conversation.challengeStatus ?? "accepted") === "accepted",
      hasMeetupProof,
    };
  },
});

export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(user._id)
    );

    // Enrich with item info, last message, unread status, and avatar info
    const enriched = await Promise.all(
      myConversations.map(async (convo) => {
        const item = await ctx.db.get(convo.itemId);
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", convo._id)
          )
          .order("desc")
          .first();

        const otherUserId = convo.participantIds.find(
          (id) => id !== user._id
        );
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

        let otherAvatarUrl: string | null = null;
        if (otherUser?.avatarId) {
          otherAvatarUrl = await ctx.storage.getUrl(otherUser.avatarId);
        }

        // Check unread status
        const readRecord = await ctx.db
          .query("conversationReads")
          .withIndex("by_conversationId_userId", (q) =>
            q.eq("conversationId", convo._id).eq("userId", user._id)
          )
          .unique();

        const hasUnread =
          !!lastMessage &&
          lastMessage.senderId !== user._id &&
          (!readRecord || lastMessage._creationTime > readRecord.lastSeenAt);

        return {
          ...convo,
          item,
          lastMessage,
          lastMessagePreview: lastMessage?.isMeetupProof
            ? "Meetup proof photo"
            : lastMessage?.body || (lastMessage?.imageId ? "Photo attachment" : ""),
          hasUnread,
          otherUser: otherUser
            ? {
                name: otherUser.name,
                college: otherUser.college,
                avatarType: otherUser.avatarType,
                avatarSeed: otherUser.avatarSeed,
                avatarUrl: otherAvatarUrl,
              }
            : null,
        };
      })
    );

    // Sort by newest message first
    enriched.sort((a, b) => {
      const aTime = a.lastMessage?._creationTime ?? a._creationTime;
      const bTime = b.lastMessage?._creationTime ?? b._creationTime;
      return bTime - aTime;
    });

    return enriched;
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(userId)) {
      throw new Error("Not a participant");
    }

    // Delete all messages (and their stored images)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    for (const msg of messages) {
      if (msg.imageId) {
        await ctx.storage.delete(msg.imageId);
      }
      await ctx.db.delete(msg._id);
    }

    // Delete read records
    const reads = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
    for (const read of reads) {
      await ctx.db.delete(read._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});

export const markConversationRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(userId)) {
      throw new Error("Not a participant");
    }

    const existing = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
    } else {
      await ctx.db.insert("conversationReads", {
        conversationId: args.conversationId,
        userId,
        lastSeenAt: Date.now(),
      });
    }
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const user = await ctx.db.get(userId);
    if (!user) return 0;

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(user._id)
    );

    let unreadCount = 0;
    for (const convo of myConversations) {
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", convo._id)
        )
        .order("desc")
        .first();

      if (!lastMessage || lastMessage.senderId === user._id) continue;

      const readRecord = await ctx.db
        .query("conversationReads")
        .withIndex("by_conversationId_userId", (q) =>
          q.eq("conversationId", convo._id).eq("userId", user._id)
        )
        .unique();

      if (!readRecord || lastMessage._creationTime > readRecord.lastSeenAt) {
        unreadCount++;
      }
    }

    return unreadCount;
  },
});
