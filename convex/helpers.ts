import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Helper query to get all boletos for a rifa (used by action)
export const getBoletosByRifa = internalQuery({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boletos")
      .withIndex("by_rifa", (q) => q.eq("rifa", args.rifaId))
      .collect();
  },
});

// Helper query to get rifa by ID (used by action)
export const getRifaById = internalQuery({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.rifaId);
  },
});








