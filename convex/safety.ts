import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const reportPost = mutation({
  args: {
    itemId: v.id("items"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Prevent duplicate reports
    const existingReport = await ctx.db
      .query("reports")
      .withIndex("by_itemId_reporterId", (q) =>
        q.eq("itemId", args.itemId).eq("reporterId", user._id)
      )
      .unique();
    if (existingReport) throw new Error("Already reported");

    await ctx.db.insert("reports", {
      itemId: args.itemId,
      reporterId: user._id,
      reason: args.reason,
    });

    // Auto-flag if threshold reached
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .collect();

    if (reports.length >= 3) {
      await ctx.db.patch(args.itemId, { status: "flagged" });
    }
  },
});

export const autoArchiveOldPosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const oldItems = await ctx.db
      .query("items")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .filter((q) => q.lt(q.field("_creationTime"), thirtyDaysAgo))
      .collect();

    for (const item of oldItems) {
      await ctx.db.patch(item._id, { status: "expired" });
    }
  },
});
