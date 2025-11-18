import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Internal action to create boletos (called from webhook)
export const createBoletosFromWebhook = internalAction({
  args: {
    rifaId: v.id("daily_rifa"),
    boletos: v.array(v.object({
      number: v.number(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      stripePaymentIntentId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Call the internal mutation to create boletos
    await ctx.runMutation(internal.admin.createBoletos, {
      rifaId: args.rifaId,
      boletos: args.boletos,
    });
    
    return { success: true };
  },
});

