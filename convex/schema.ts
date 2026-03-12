import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    college: v.optional(v.string()),
    karma: v.optional(v.number()),
    strikes: v.optional(v.number()),
    shadowBannedUntil: v.optional(v.number()),
    isBanned: v.optional(v.boolean()),
  })
    .index("by_college", ["college"])
    .index("by_karma", ["karma"]),

  items: defineTable({
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    locationZone: v.string(),
    challenge: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("resolved"),
      v.literal("expired"),
      v.literal("flagged")
    ),
    userId: v.id("users"),
    imageId: v.optional(v.id("_storage")),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"])
    .index("by_status_category", ["status", "category"])
    .index("by_status_type", ["status", "type"]),

  conversations: defineTable({
    itemId: v.id("items"),
    participantIds: v.array(v.id("users")),
    challengeAnswer: v.optional(v.string()),
    challengeStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected")
      )
    ),
  }).index("by_itemId", ["itemId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    isMeetupProof: v.optional(v.boolean()),
  }).index("by_conversationId", ["conversationId"]),

  colleges: defineTable({
    name: v.string(),
    totalKarma: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_totalKarma", ["totalKarma"]),

  claims: defineTable({
    itemId: v.id("items"),
    claimerId: v.id("users"),
  })
    .index("by_claimerId", ["claimerId"])
    .index("by_itemId_claimerId", ["itemId", "claimerId"]),

  reports: defineTable({
    itemId: v.id("items"),
    reporterId: v.id("users"),
    reason: v.string(),
  })
    .index("by_itemId", ["itemId"])
    .index("by_itemId_reporterId", ["itemId", "reporterId"]),
});
