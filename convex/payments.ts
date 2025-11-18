import { internalAction, action } from "./_generated/server";
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

// Public action to create boletos from webhook (with secret verification)
// Note: The webhook route already verifies Stripe signatures, this adds an extra layer of security
export const createBoletosFromWebhookPublic = action({
  args: {
    webhookSecret: v.string(),
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
    // Verify webhook secret matches expected value
    // The secret should be set in Convex environment variables via: npx convex env set STRIPE_WEBHOOK_SECRET <value>
    const expectedSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!expectedSecret) {
      throw new Error("Webhook secret not configured in Convex environment");
    }
    if (args.webhookSecret !== expectedSecret) {
      throw new Error("Invalid webhook secret");
    }

    // Call the internal mutation to create boletos
    await ctx.runMutation(internal.admin.createBoletos, {
      rifaId: args.rifaId,
      boletos: args.boletos,
    });
    
    return { success: true };
  },
});

