import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const testInsert = mutation({
    args: {},
    handler: async (ctx) => {
        const id = await ctx.db.insert("daily_rifa", {
            title: "Daily Raffle #1",
            subtitle: "Win a new iPhone!",
            description: "Enter now for a chance to win.",
            image: "https://example.com/image.png",
        });
        return id;
    },
});
