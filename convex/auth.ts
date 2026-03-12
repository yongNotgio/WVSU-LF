import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(userId);
    if (!existing) throw new Error("User not found");

    await ctx.db.patch(userId, {
      email: existing.email ?? identity.email ?? "",
      name: existing.name ?? identity.name ?? "",
      college: existing.college ?? "",
      karma: existing.karma ?? 0,
    });

    return userId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
    college: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      name: args.name,
      college: args.college,
      email: user.email ?? "",
      karma: user.karma ?? 0,
    });

    const existingCollege = await ctx.db
      .query("colleges")
      .withIndex("by_name", (q) => q.eq("name", args.college))
      .unique();
    if (!existingCollege && DEFAULT_COLLEGES.includes(args.college)) {
      await ctx.db.insert("colleges", { name: args.college, totalKarma: 0 });
    }
  },
});

export const updateAvatar = mutation({
  args: {
    mode: v.union(v.literal("multiavatar"), v.literal("upload")),
    avatarSeed: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    if (args.mode === "multiavatar") {
      if (!args.avatarSeed) throw new Error("Seed required");
      await ctx.db.patch(userId, {
        avatarType: "multiavatar" as const,
        avatarSeed: args.avatarSeed,
      });
    } else {
      if (!args.avatarId) throw new Error("Avatar image required");
      await ctx.db.patch(userId, {
        avatarType: "upload" as const,
        avatarId: args.avatarId,
      });
    }
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    let avatarUrl: string | null = null;
    if (user.avatarId) {
      avatarUrl = await ctx.storage.getUrl(user.avatarId);
    }

    return { ...user, avatarUrl };
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const activePosts = await ctx.db
      .query("items")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    let rank = 1;
    if (user.college) {
      const collegeUsers = await ctx.db
        .query("users")
        .withIndex("by_college", (q) => q.eq("college", user.college))
        .collect();
      rank = collegeUsers.filter((u) => (u.karma ?? 0) > (user.karma ?? 0)).length + 1;
    }

    let avatarUrl: string | null = null;
    if (user.avatarId) {
      avatarUrl = await ctx.storage.getUrl(user.avatarId);
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      karma: user.karma,
      rank,
      activePosts: activePosts.length,
      avatarType: user.avatarType,
      avatarSeed: user.avatarSeed,
      avatarUrl,
    };
  },
});
