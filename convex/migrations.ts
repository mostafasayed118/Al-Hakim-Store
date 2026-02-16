import { mutation } from "./_generated/server";
import { requireAdmin } from "./utils";

/**
 * Migration: Set default stock for existing products
 * Run this once to set stock: 999 for all products without a stock value
 * 
 * Usage: Call this mutation from the Convex dashboard or from admin panel
 */
export const setDefaultStock = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const products = await ctx.db.query("products").collect();
    const now = Date.now();
    let updatedCount = 0;

    for (const product of products) {
      // Only update products that don't have a stock value
      if (product.stock === undefined || product.stock === null) {
        await ctx.db.patch(product._id, {
          stock: 999, // High default value for existing products
          updatedAt: now,
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      message: `Updated ${updatedCount} products with default stock value`,
      totalProducts: products.length,
      updatedCount,
    };
  },
});
