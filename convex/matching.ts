import { getAuthUserId } from "@convex-dev/auth/server";
import { query, internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Scoring utilities
// ---------------------------------------------------------------------------

// Campus zone adjacency for proximity scoring
const ZONE_ADJACENCY: Record<string, string[]> = {
  "Library": ["CICT Bldg", "CAS Bldg", "Canteen Area"],
  "CICT Bldg": ["Library", "CON Bldg", "Canteen Area"],
  "CON Bldg": ["CICT Bldg", "CAS Bldg"],
  "CAS Bldg": ["Library", "CON Bldg"],
  "Canteen Area": ["CICT Bldg", "Main Gate", "Gymnasium", "Library"],
  "Main Gate": ["Canteen Area"],
  "Gymnasium": ["Canteen Area"],
  "Other": [],
};

/** Levenshtein edit-distance between two strings. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = 0;
    }
  }
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}


function keywordScore(text1: string, text2: string): number {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  if (words1.length === 0 || words2.length === 0) return 0;

  let total = 0;
  for (const w1 of words1) {
    let best = 0;
    for (const w2 of words2) {
      const maxLen = Math.max(w1.length, w2.length);
      const sim = maxLen > 0 ? 1 - levenshtein(w1, w2) / maxLen : 1;
      if (sim > best) best = sim;
    }
    total += best;
  }
  return total / words1.length;
}

/** Location proximity score: 1 = same zone, 0.5 = adjacent, 0 = far */
function locationScore(zone1: string, zone2: string): number {
  if (zone1 === zone2) return 1;
  const adjacent = ZONE_ADJACENCY[zone1] ?? [];
  return adjacent.includes(zone2) ? 0.5 : 0;
}

// ---------------------------------------------------------------------------
// Queries & actions
// ---------------------------------------------------------------------------

export const findPotentialMatches = query({
  args: { lostItemId: v.id("items") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const lostItem = await ctx.db.get(args.lostItemId);
    if (!lostItem) throw new Error("Item not found");
    if (lostItem.type !== "lost") throw new Error("Item is not a lost item");

    const foundItems = await ctx.db
      .query("items")
      .withIndex("by_status_type", (q) =>
        q.eq("status", "open").eq("type", "found")
      )
      .collect();

    const lostText = `${lostItem.title} ${lostItem.description}`;

    const scored = foundItems.map((item) => {
      const catScore = item.category === lostItem.category ? 40 : 0;
      const locScore = locationScore(lostItem.locationZone, item.locationZone) * 30;
      const kwScore = keywordScore(lostText, `${item.title} ${item.description}`) * 30;
      const matchScore = Math.round(catScore + locScore + kwScore);

      return {
        ...item,
        matchScore,
        categoryMatch: item.category === lostItem.category,
        locationMatch: item.locationZone === lostItem.locationZone,
      };
    });

    return scored
      .filter((item) => item.matchScore >= 20)
      .sort((a, b) => b.matchScore - a.matchScore);
  },
});

export const findMatchesInternal = internalQuery({
  args: { lostItemId: v.id("items") },
  handler: async (ctx, args) => {
    const lostItem = await ctx.db.get(args.lostItemId);
    if (!lostItem || lostItem.type !== "lost") return [];

    const foundItems = await ctx.db
      .query("items")
      .withIndex("by_status_type", (q) =>
        q.eq("status", "open").eq("type", "found")
      )
      .collect();

    const lostText = `${lostItem.title} ${lostItem.description}`;

    return foundItems
      .map((item) => {
        const catScore = item.category === lostItem.category ? 40 : 0;
        const locScore =
          locationScore(lostItem.locationZone, item.locationZone) * 30;
        const kwScore =
          keywordScore(lostText, `${item.title} ${item.description}`) * 30;
        return {
          ...item,
          matchScore: Math.round(catScore + locScore + kwScore),
        };
      })
      .filter((item) => item.matchScore >= 50);
  },
});

export const generateMatchNotification = action({
  args: { lostItemId: v.id("items") },
  handler: async (ctx, args): Promise<boolean> => {
    const matches = await ctx.runQuery(
      internal.matching.findMatchesInternal,
      { lostItemId: args.lostItemId }
    );
    return matches.length > 0;
  },
});
