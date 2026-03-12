import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

    // Ban & reputation gates
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

    // Check existing conversations for this item
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .collect();

    // Blocked if previously rejected
    const rejected = conversations.find(
      (c) => c.participantIds.includes(userId) && c.challengeStatus === "rejected"
    );
    if (rejected) throw new Error("Your claim for this item was already rejected.");

    // Return existing pending/accepted conversation
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
    return await ctx.db.insert("conversations", {
      itemId: args.itemId,
      participantIds: [item.userId, userId],
      challengeAnswer,
      challengeStatus: "pending",
    });
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
    if (item.userId !== userId) throw new Error("Only the item poster can verify claims.");
    if (conversation.challengeStatus !== "pending") throw new Error("This claim has already been reviewed.");

    await ctx.db.patch(args.conversationId, {
      challengeStatus: args.accept ? "accepted" : "rejected",
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

    const body = args.body?.trim();
    if (!body && !args.imageId) {
      throw new Error("Send a message or attach an image.");
    }

    if (args.isMeetupProof) {
      if (item.userId !== userId) {
        throw new Error("Only the poster can upload meetup proof.");
      }
      if (!args.imageId) {
        throw new Error("Meetup proof requires an image.");
      }
    }

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      body,
      imageId: args.imageId,
      isMeetupProof: args.isMeetupProof ?? false,
    });
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
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
      .collect();
    const hasMeetupProof = messages.some(
      (message) =>
        message.senderId === item?.userId &&
        !!message.imageId &&
        !!message.isMeetupProof
    );

    return {
      ...conversation,
      item,
      isItemOwner: item?.userId === userId,
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

    // Enrich with item info and last message
    const enriched = await Promise.all(
      myConversations.map(async (convo) => {
        const item = await ctx.db.get(convo.itemId);
        const messages = await ctx.db
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

        return {
          ...convo,
          item,
          lastMessage: messages,
          lastMessagePreview: messages?.isMeetupProof
            ? "Meetup proof photo"
            : messages?.body || (messages?.imageId ? "Photo attachment" : ""),
          otherUser: otherUser
            ? { name: otherUser.name, college: otherUser.college }
            : null,
        };
      })
    );

    return enriched;
  },
});
