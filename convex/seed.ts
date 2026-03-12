import { internalMutation } from "./_generated/server";

export const seedColleges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("colleges").collect();
    if (existing.length > 0) return;

    const colleges = [
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
    for (const name of colleges) {
      await ctx.db.insert("colleges", { name, totalKarma: 0 });
    }
  },
});
