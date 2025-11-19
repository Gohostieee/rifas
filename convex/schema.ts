import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boletos: defineTable({
    number: v.number(), // 10 digit positive int
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    rifa: v.id("daily_rifa"),
    stripePaymentIntentId: v.optional(v.string()), // Store Stripe payment intent ID
    winner: v.optional(v.boolean()), // Marks if this ticket is the winner
  })
    .index("by_rifa", ["rifa"]),
  daily_rifa: defineTable({
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    image: v.string(),
    precio: v.optional(v.number()),
    selected: v.optional(v.boolean()),
    targetGoal: v.optional(v.number()),
    currentBoletosSold: v.optional(v.number()),
  }),
});
