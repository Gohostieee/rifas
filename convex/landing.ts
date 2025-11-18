import { query } from "./_generated/server";

// Query to get the currently selected rifa, or the most recent one if none is selected
export const getSelectedRifa = query({
  args: {},
  handler: async (ctx) => {
    // First, try to find a selected rifa
    const selectedRifa = await ctx.db
      .query("daily_rifa")
      .filter((q) => q.eq(q.field("selected"), true))
      .first();

    if (selectedRifa) {
      // Convert storage ID to URL if needed
      let imageUrl = selectedRifa.image;
      try {
        const storageId = selectedRifa.image as any;
        if (storageId && typeof storageId === "string" && !storageId.startsWith("http")) {
          const url = await ctx.storage.getUrl(storageId as any);
          if (url) {
            imageUrl = url;
          }
        }
      } catch (e) {
        // Not a storage ID, use as-is
      }
      return {
        ...selectedRifa,
        image: imageUrl,
      };
    }

    // If no selected rifa, get the most recent one (by _id, which is creation order)
    const allRifas = await ctx.db.query("daily_rifa").collect();
    if (allRifas.length === 0) {
      return null;
    }

    // Sort by _id descending to get the most recent
    const mostRecent = allRifas.sort((a, b) => {
      return a._id > b._id ? -1 : 1;
    })[0];

    // Convert storage ID to URL if needed
    let imageUrl = mostRecent.image;
    try {
      const storageId = mostRecent.image as any;
      if (storageId && typeof storageId === "string" && !storageId.startsWith("http")) {
        const url = await ctx.storage.getUrl(storageId as any);
        if (url) {
          imageUrl = url;
        }
      }
    } catch (e) {
      // Not a storage ID, use as-is
    }

    return {
      ...mostRecent,
      image: imageUrl,
    };
  },
});

// Query to get all inactive rifas (not currently selected)
export const getInactiveRifas = query({
  args: {},
  handler: async (ctx) => {
    // Get all rifas that are not selected
    const allRifas = await ctx.db.query("daily_rifa").collect();
    const inactiveRifas = allRifas.filter((rifa) => !rifa.selected);
    
    // Sort by _id descending to get most recent first
    inactiveRifas.sort((a, b) => {
      return a._id > b._id ? -1 : 1;
    });
    
    // Convert storage IDs to URLs if needed
    return Promise.all(
      inactiveRifas.map(async (rifa) => {
        let imageUrl = rifa.image;
        try {
          const storageId = rifa.image as any;
          if (storageId && typeof storageId === "string" && !storageId.startsWith("http")) {
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

