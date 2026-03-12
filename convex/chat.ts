import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Check for existing conversation between this user and the item
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .collect();

    const existing = conversations.find((c) =>
      c.participantIds.includes(user._id)
    );
    if (existing) return existing._id;

    // Create new conversation between item owner and current user
    return await ctx.db.insert("conversations", {
      itemId: args.itemId,
      participantIds: [item.userId, user._id],
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
  },
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

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body: args.body,
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
      .collect();
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
    return {
      ...conversation,
      item,
      isItemOwner: item?.userId === userId,
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
          otherUser: otherUser
            ? { name: otherUser.name, college: otherUser.college }
            : null,
        };
      })
    );

    return enriched;
  },
});
