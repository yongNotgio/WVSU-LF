import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const awardKarmaPoints = mutation({
  args: {
    itemId: v.id("items"),
    finderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Unauthenticated");

    const owner = await ctx.db.get(ownerId);
    if (!owner) throw new Error("User not found");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== owner._id) throw new Error("Not the item owner");

    const finder = await ctx.db.get(args.finderId);
    if (!finder) throw new Error("Finder not found");

    // Award karma to finder (+50) and owner (+10)
    await ctx.db.patch(finder._id, { karma: (finder.karma ?? 0) + 50 });
    await ctx.db.patch(owner._id, { karma: (owner.karma ?? 0) + 10 });

    // Award college karma (+50 to finder's college)
    if (finder.college) {
      const college = await ctx.db
        .query("colleges")
        .withIndex("by_name", (q) => q.eq("name", finder.college!))
        .unique();
      if (college) {
        await ctx.db.patch(college._id, {
          totalKarma: college.totalKarma + 50,
        });
      }
    }

    // Resolve the item
    await ctx.db.patch(args.itemId, { status: "resolved" });
  },
});

export const confirmReturn = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (!conversation.participantIds.includes(userId)) {
      throw new Error("Not a participant");
    }

    const item = await ctx.db.get(conversation.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Only the item owner can confirm return");
    if (item.status !== "open") throw new Error("Item is already resolved");

    let finderId: typeof item.userId | null = null;
    for (const participantId of conversation.participantIds) {
      if (participantId !== item.userId) {
        finderId = participantId;
        break;
      }
    }
    if (!finderId) {
      throw new Error("No finder is attached to this conversation");
    }

    const finder = await ctx.db.get(finderId);
    if (!finder) throw new Error("Finder not found");

    const owner = await ctx.db.get(userId);
    if (!owner) throw new Error("User not found");

    await ctx.db.patch(finderId, { karma: (finder.karma ?? 0) + 50 });
    await ctx.db.patch(userId, { karma: (owner.karma ?? 0) + 10 });

    if (finder.college) {
      const college = await ctx.db
        .query("colleges")
        .withIndex("by_name", (q) => q.eq("name", finder.college!))
        .unique();
      if (college) {
        await ctx.db.patch(college._id, {
          totalKarma: college.totalKarma + 50,
        });
      }
    }

    await ctx.db.patch(item._id, { status: "resolved" });
  },
});

export const getGlobalLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const colleges = await ctx.db
      .query("colleges")
      .withIndex("by_totalKarma")
      .order("desc")
      .collect();
    return colleges;
  },
});

export const getTopFinders = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_karma")
      .order("desc")
      .take(10);

    return users
      .filter((u) => u.name && (u.karma ?? 0) > 0)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        college: u.college,
        karma: u.karma,
      }));
  },
});
