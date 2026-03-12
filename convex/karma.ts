import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const awardKarmaPoints = mutation({
  args: {
    itemId: v.id("items"),
    finderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const owner = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
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
