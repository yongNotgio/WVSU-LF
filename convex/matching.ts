import { query, internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const findPotentialMatches = query({
  args: { lostItemId: v.id("items") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const lostItem = await ctx.db.get(args.lostItemId);
    if (!lostItem) throw new Error("Item not found");
    if (lostItem.type !== "lost") throw new Error("Item is not a lost item");

    const categoryMatches = await ctx.db
      .query("items")
      .withIndex("by_status_category", (q) =>
        q.eq("status", "open").eq("category", lostItem.category)
      )
      .filter((q) => q.eq(q.field("type"), "found"))
      .order("desc")
      .collect();

    return categoryMatches.map((item) => ({
      ...item,
      locationMatch: item.locationZone === lostItem.locationZone,
    }));
  },
});

export const findMatchesInternal = internalQuery({
  args: { lostItemId: v.id("items") },
  handler: async (ctx, args) => {
    const lostItem = await ctx.db.get(args.lostItemId);
    if (!lostItem || lostItem.type !== "lost") return [];

    const matches = await ctx.db
      .query("items")
      .withIndex("by_status_category", (q) =>
        q.eq("status", "open").eq("category", lostItem.category)
      )
      .filter((q) => q.eq(q.field("type"), "found"))
      .collect();

    return matches.filter(
      (item) => item.locationZone === lostItem.locationZone
    );
  },
});

export const generateMatchNotification = action({
  args: { lostItemId: v.id("items") },
  handler: async (ctx, args): Promise<boolean> => {
    const matches: { _id: string }[] = await ctx.runQuery(
      internal.matching.findMatchesInternal,
      { lostItemId: args.lostItemId },
    );

    // High-confidence matches are those where both category and location match.
    // In a future iteration this could trigger push notifications or emails.
    return matches.length > 0;
  },
});
