import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createItem = mutation({
  args: {
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    locationZone: v.string(),
    challenge: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("items", {
      type: args.type,
      title: args.title,
      description: args.description,
      category: args.category,
      locationZone: args.locationZone,
      challenge: args.challenge,
      status: "open",
      userId: user._id,
      imageId: args.imageId,
    });
  },
});

export const getItems = query({
  args: {
    type: v.optional(v.union(v.literal("lost"), v.literal("found"))),
    locationZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let itemsQuery;

    if (args.type) {
      itemsQuery = ctx.db
        .query("items")
        .withIndex("by_status_type", (q) =>
          q.eq("status", "open").eq("type", args.type!)
        );
    } else {
      itemsQuery = ctx.db
        .query("items")
        .withIndex("by_status", (q) => q.eq("status", "open"));
    }

    let items = await itemsQuery.order("desc").collect();

    if (args.locationZone) {
      items = items.filter((item) => item.locationZone === args.locationZone);
    }

    return items;
  },
});

export const getMyItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    return await ctx.db
      .query("items")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.itemId);
  },
});

export const resolveItem = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.itemId, { status: "resolved" });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
