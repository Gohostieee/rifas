import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

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
        // Handle missing rifa ID gracefully (for migration/cleanup)
        if (!boleto.rifa) {
            return {
                ...boleto,
                rifaTitle: "Deleted Rifa / Unknown",
            };
        }
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
    const boletos = (await ctx.runQuery(internal.helpers.getBoletosByRifa, {
      rifaId: args.rifaId,
    })) as Doc<"boletos">[];
    
    if (!boletos || boletos.length === 0) {
      return null;
    }
    
    // Get random boleto
    const randomIndex = Math.floor(Math.random() * boletos.length);
    const randomBoleto = boletos[randomIndex];
    
    // Get rifa information
    const rifa = (await ctx.runQuery(internal.helpers.getRifaById, {
      rifaId: args.rifaId,
    })) as Doc<"daily_rifa"> | null;
    
    return {
      ...randomBoleto,
      rifaTitle: rifa?.title ?? "Unknown",
    };
  },
});

// Action to get all boletos with rifa info for animation
export const getAllBoletosWithRifaInfo = action({
  args: {
    rifaId: v.id("daily_rifa"),
  },
  handler: async (ctx, args) => {
    const boletos = (await ctx.runQuery(internal.helpers.getBoletosByRifa, {
      rifaId: args.rifaId,
    })) as Doc<"boletos">[];
    
    const rifa = (await ctx.runQuery(internal.helpers.getRifaById, {
      rifaId: args.rifaId,
    })) as Doc<"daily_rifa"> | null;
    
    if (!boletos) return [];

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
      number: v.optional(v.number()),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      stripePaymentIntentId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Get the rifa to check current count
    const rifa = await ctx.db.get(args.rifaId);
    if (!rifa) {
      throw new Error("Rifa not found");
    }

    let currentCount = rifa.currentBoletosSold ?? 0;
    const createdBoletos = [];

    for (const boleto of args.boletos) {
      let number = boleto.number;

      // If number is not provided, generate it
      if (number === undefined) {
        // Determine range based on current count
        let min, max;
        if (currentCount < 10000) {
          // 4 digits: 0000 - 9999
          min = 0;
          max = 9999;
        } else if (currentCount < 100000) {
          // 5 digits: 10000 - 99999
          min = 10000;
          max = 99999;
        } else {
          // 6 digits: 100000 - 999999
          min = 100000;
          max = 999999;
        }

        // Try to generate a unique number
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
          
          // Check if this number already exists for this rifa
          const existing = await ctx.db
            .query("boletos")
            .withIndex("by_rifa_number", (q) => 
              q.eq("rifa", args.rifaId).eq("number", candidate)
            )
            .first();
            
          if (!existing) {
            number = candidate;
            break;
          }
          
          attempts++;
        }

        // If we failed to find a unique number in the preferred range, try the next range
        if (number === undefined) {
          // Move to next tier immediately if current is full or we're unlucky
          const nextMin = max + 1;
          const nextMax = (max * 10) + 9;
          
          // Just generate one in the larger range (less likely to collide)
          number = Math.floor(Math.random() * (nextMax - nextMin + 1)) + nextMin;
        }
      }

      // Insert the boleto
      const id = await ctx.db.insert("boletos", {
        number: number!,
        name: boleto.name,
        email: boleto.email,
        phone: boleto.phone,
        rifa: args.rifaId,
        stripePaymentIntentId: boleto.stripePaymentIntentId,
      });
      
      createdBoletos.push(id);
      
      // Increment local count for next iteration
      currentCount++;
    }

    // Update the rifa's currentBoletosSold count in DB
    await ctx.db.patch(args.rifaId, {
      currentBoletosSold: currentCount,
    });

    return { success: true, boletosCreated: createdBoletos.length };
  },
});

// Mutation to delete invalid boletos (those missing rifa)
export const cleanupInvalidBoletos = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Scan all boletos - this might be slow if there are many, but filtering by index is better if possible
    // Since rifa is optional now, we can't strictly filter by missing index easily without full scan in some DBs,
    // but Convex `filter` works.
    const allBoletos = await ctx.db.query("boletos").collect();
    
    const invalidBoletos = allBoletos.filter(b => !b.rifa);

    for (const boleto of invalidBoletos) {
      await ctx.db.delete(boleto._id);
    }

    return { deleted: invalidBoletos.length };
  },
});
