import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Action to generate upload URL
export const generateUploadUrl = action(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Query to get storage URL from storage ID
export const getStorageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Query to get all rifas
export const getAllRifas = query({
  args: {},
  handler: async (ctx) => {
    const rifas = await ctx.db.query("daily_rifa").collect();
    // Convert storage IDs to URLs if needed
    return Promise.all(
      rifas.map(async (rifa) => {
        // Check if image is a storage ID (starts with storage ID format)
        // Storage IDs look like: "k173abc123..."
        // URLs look like: "https://..."
        let imageUrl = rifa.image;
        try {
          // Try to parse as storage ID
          const storageId = rifa.image as any;
          if (storageId && typeof storageId === "string" && !storageId.startsWith("http")) {
            // It's likely a storage ID, get the URL
            const url = await ctx.storage.getUrl(storageId as any);
            if (url) {
              imageUrl = url;
            }
          }
        } catch (e) {
          // Not a storage ID, use as-is
        }
        return {
          ...rifa,
          image: imageUrl,
        };
      })
    );
  },
});

// Query to get paginated boletos
export const getBoletos = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    rifaId: v.optional(v.id("daily_rifa")), // Optional filter by rifa
  },
  handler: async (ctx, args) => {
    const { page, pageSize, rifaId } = args;
    const skip = (page - 1) * pageSize;

    // Build query with optional rifa filter
    let allBoletos;
    if (rifaId) {
      allBoletos = await ctx.db
        .query("boletos")
        .withIndex("by_rifa", (q) => q.eq("rifa", rifaId))
        .collect();
    } else {
      allBoletos = await ctx.db.query("boletos").collect();
    }
    
    // Sort: winners first, then by creation time (desc)
    const sortedBoletos = allBoletos.sort((a, b) => {
      // Winners come first
      const aWinner = a.winner ?? false;
      const bWinner = b.winner ?? false;
      if (aWinner !== bWinner) {
        return aWinner ? -1 : 1;
      }
      // Then by creation time (newest first)
      return b._creationTime - a._creationTime;
    });

    const total = sortedBoletos.length;
    const paginatedBoletos = sortedBoletos.slice(skip, skip + pageSize);

    // Get rifa information for each boleto
    const boletosWithRifa = await Promise.all(
      paginatedBoletos.map(async (boleto) => {
        const rifa = await ctx.db.get(boleto.rifa);
        return {
          ...boleto,
          rifaTitle: rifa?.title ?? "Unknown",
        };
      })
    );

    return {
      boletos: boletosWithRifa,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
});

// Mutation to set a rifa as selected (and unselect all others)
export const setSelectedRifa = mutation({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    // First, unselect all rifas
    const allRifas = await ctx.db.query("daily_rifa").collect();
    for (const rifa of allRifas) {
      if (rifa.selected) {
        await ctx.db.patch(rifa._id, { selected: false });
      }
    }
    
    // Then, set the selected rifa to true
    await ctx.db.patch(args.rifaId, { selected: true });
    
    return { success: true };
  },
});

// Mutation to create a new rifa
export const createRifa = mutation({
  args: {
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    image: v.string(),
    precio: v.number(),
    targetGoal: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("daily_rifa", {
      title: args.title,
      subtitle: args.subtitle,
      description: args.description,
      image: args.image,
      precio: args.precio,
      selected: false,
      targetGoal: args.targetGoal,
      currentBoletosSold: 0,
    });
    return id;
  },
});

// Mutation to update an existing rifa
export const updateRifa = mutation({
  args: {
    rifaId: v.id("daily_rifa"),
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    image: v.string(),
    precio: v.number(),
    targetGoal: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rifaId, {
      title: args.title,
      subtitle: args.subtitle,
      description: args.description,
      image: args.image,
      precio: args.precio,
      targetGoal: args.targetGoal,
    });
    return { success: true };
  },
});

// Mutation to set a boleto as winner
export const setBoletoWinner = mutation({
  args: {
    boletoId: v.id("boletos"),
    isWinner: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.boletoId, {
      winner: args.isWinner,
    });
    return { success: true };
  },
});

// Action to get a random boleto from a specific rifa (action instead of query for fresh random each time)
export const getRandomBoleto = action({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    const boletos = await ctx.runQuery(api.admin.getBoletosByRifa, {
      rifaId: args.rifaId,
    });
    
    if (boletos.length === 0) {
      return null;
    }
    
    // Get random boleto
    const randomIndex = Math.floor(Math.random() * boletos.length);
    const randomBoleto = boletos[randomIndex];
    
    // Get rifa information
    const rifa = await ctx.runQuery(api.admin.getRifaById, {
      rifaId: args.rifaId,
    });
    
    return {
      ...randomBoleto,
      rifaTitle: rifa?.title ?? "Unknown",
    };
  },
});

// Helper query to get all boletos for a rifa (used by action)
export const getBoletosByRifa = query({
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
export const getRifaById = query({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.rifaId);
  },
});

// Action to get all boletos with rifa info for animation
export const getAllBoletosWithRifaInfo = action({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    const boletos = await ctx.runQuery(api.admin.getBoletosByRifa, {
      rifaId: args.rifaId,
    });
    
    const rifa = await ctx.runQuery(api.admin.getRifaById, {
      rifaId: args.rifaId,
    });
    
    return boletos.map((boleto) => ({
      ...boleto,
      rifaTitle: rifa?.title ?? "Unknown",
    }));
  },
});

// Internal mutation to create boletos from Stripe webhook
export const createBoletos = internalMutation({
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
    // Create all boletos
    const createdBoletos = [];
    for (const boleto of args.boletos) {
      const id = await ctx.db.insert("boletos", {
        number: boleto.number,
        name: boleto.name,
        email: boleto.email,
        phone: boleto.phone,
        rifa: args.rifaId,
        stripePaymentIntentId: boleto.stripePaymentIntentId,
      });
      createdBoletos.push(id);
    }

    // Update the rifa's currentBoletosSold count
    const rifa = await ctx.db.get(args.rifaId);
    if (rifa) {
      const currentCount = rifa.currentBoletosSold ?? 0;
      await ctx.db.patch(args.rifaId, {
        currentBoletosSold: currentCount + args.boletos.length,
      });
    }

    return { success: true, boletosCreated: createdBoletos.length };
  },
});

