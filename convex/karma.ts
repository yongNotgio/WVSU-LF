import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { deriveConversationRoles } from "./roles";

const DEFAULT_COLLEGES = [
  "CAS",
  "CBM",
  "COC",
  "COD",
  "COE",
  "CICT",
  "COM",
  "CON",
  "PESCAR",
  "COL",
  "ILS",
];

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

    
    await ctx.db.patch(finder._id, { karma: (finder.karma ?? 0) + 50 });
    await ctx.db.patch(owner._id, { karma: (owner.karma ?? 0) + 10 });

    
    if (finder.college) {
      const college = await ctx.db
        .query("colleges")
        .withIndex("by_name", (q) => q.eq("name", finder.college!))
        .unique();
      if (college) {
        await ctx.db.patch(college._id, {
          totalKarma: college.totalKarma + 50,
        });
      } else {
        await ctx.db.insert("colleges", {
          name: finder.college,
          totalKarma: 50,
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
    if (item.status !== "open") throw new Error("Item is already resolved");

    const { ownerId, finderId } = deriveConversationRoles(
      item,
      conversation.participantIds
    );
    const ownerUserId = ownerId as Id<"users">;
    const finderUserId = finderId as Id<"users">;

    // The owner confirms receipt once meetup proof is uploaded by the finder.
    if (ownerUserId !== userId) {
      throw new Error("Only the owner can confirm item received.");
    }

    const claimStatus = conversation.challengeStatus ?? "accepted";
    if (claimStatus !== "accepted") {
      throw new Error("Verification must be accepted before confirming return.");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
      .collect();
    const hasMeetupProof = messages.some(
      (message) =>
        message.senderId === finderUserId &&
        !!message.imageId &&
        !!message.isMeetupProof
    );
    if (!hasMeetupProof) {
      throw new Error("The finder must upload a meetup photo before confirmation.");
    }

    const finder = await ctx.db.get(finderUserId);
    if (!finder) throw new Error("Finder not found");

    const owner = await ctx.db.get(ownerUserId);
    if (!owner) throw new Error("Owner not found");

    // Consistent rewards regardless of who posted: Finder +50, Owner +10.
    await ctx.db.patch(finderUserId, { karma: (finder.karma ?? 0) + 50 });
    await ctx.db.patch(ownerUserId, { karma: (owner.karma ?? 0) + 10 });

    // College karma: finder +50, owner +10.
    if (finder.college) {
      const college = await ctx.db
        .query("colleges")
        .withIndex("by_name", (q) => q.eq("name", finder.college!))
        .unique();
      if (college) {
        await ctx.db.patch(college._id, {
          totalKarma: college.totalKarma + 50,
        });
      } else {
        await ctx.db.insert("colleges", {
          name: finder.college,
          totalKarma: 50,
        });
      }
    }

    if (owner.college) {
      const college = await ctx.db
        .query("colleges")
        .withIndex("by_name", (q) => q.eq("name", owner.college!))
        .unique();
      if (college) {
        await ctx.db.patch(college._id, {
          totalKarma: college.totalKarma + 10,
        });
      } else {
        await ctx.db.insert("colleges", {
          name: owner.college,
          totalKarma: 10,
        });
      }
    }

    await ctx.db.patch(item._id, { status: "resolved" });
  },
});

export const getGlobalLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const collegeTotals = new Map<string, number>();

    for (const name of DEFAULT_COLLEGES) {
      collegeTotals.set(name, 0);
    }

    for (const user of users) {
      if (!user.college) continue;
      collegeTotals.set(
        user.college,
        (collegeTotals.get(user.college) ?? 0) + (user.karma ?? 0)
      );
    }

    return Array.from(collegeTotals.entries())
      .map(([name, totalKarma]) => ({
        _id: `virtual-${name}` as const,
        _creationTime: 0,
        name,
        totalKarma,
      }))
      .sort(
        (left, right) =>
          right.totalKarma - left.totalKarma || left.name.localeCompare(right.name)
      );
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
