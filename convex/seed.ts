import { internalMutation } from "./_generated/server";

export const seedColleges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("colleges").collect();
    if (existing.length > 0) return;

    const colleges = ["CICT", "CON", "CAS", "CED", "CBAA", "COE", "COM"];
    for (const name of colleges) {
      await ctx.db.insert("colleges", { name, totalKarma: 0 });
    }
  },
});
