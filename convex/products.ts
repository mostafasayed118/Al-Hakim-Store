import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";

/**
 * Get all active products (public query - no auth required)
 * Generates signed URLs for product images
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Generate signed URLs for each product's image
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        let imageUrl: string | null = null;

        // If product has a storage ID, generate a fresh signed URL
        if (product.storageId) {
          try {
            const url = await ctx.storage.getUrl(product.storageId);
            imageUrl = url;
          } catch (error) {
            console.error("Error generating image URL:", error);
          }
        }

        return {
          ...product,
          imageUrl,
        };
      })
    );

    return productsWithUrls;
  },
});

/**
 * Get a single product by ID (public query)
 */
export const get = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);

    if (!product) return null;

    // Generate signed URL for the image
    let imageUrl: string | null = null;
    if (product.storageId) {
      try {
        const url = await ctx.storage.getUrl(product.storageId);
        imageUrl = url;
      } catch (error) {
        console.error("Error generating image URL:", error);
      }
    }

    return {
      ...product,
      imageUrl,
    };
  },
});

/**
 * Get all products including inactive ones (admin only)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const products = await ctx.db
      .query("products")
      .order("desc")
      .collect();

    // Generate signed URLs for each product's image
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        let imageUrl: string | null = null;

        if (product.storageId) {
          try {
            const url = await ctx.storage.getUrl(product.storageId);
            imageUrl = url;
          } catch (error) {
            console.error("Error generating image URL:", error);
          }
        }

        return {
          ...product,
          imageUrl,
        };
      })
    );

    return productsWithUrls;
  },
});

/**
 * Create a new product (admin only)
 * Accepts storageId from file upload
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    storageId: v.optional(v.id("_storage")),
    size: v.optional(v.string()),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();

    const productId = await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      storageId: args.storageId,
      size: args.size,
      stock: args.stock,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return productId;
  },
});

/**
 * Update an existing product (admin only)
 */
export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    size: v.optional(v.string()),
    stock: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { productId, ...updates } = args;

    // Get existing product
    const existing = await ctx.db.get(productId);
    if (!existing) {
      throw new Error("Product not found");
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.size !== undefined) updateData.size = updates.size;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    // Handle image update
    if (updates.storageId !== undefined) {
      updateData.storageId = updates.storageId;
    }

    await ctx.db.patch(productId, updateData);

    return productId;
  },
});

/**
 * Soft delete a product (admin only)
 * Sets isActive to false instead of deleting
 */
export const remove = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.productId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.productId;
  },
});

/**
 * Permanently delete a product (admin only)
 * Use with caution - this cannot be undone
 */
export const permanentDelete = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Delete associated image from storage if exists
    if (product.storageId) {
      await ctx.storage.delete(product.storageId);
    }

    // Permanently delete the product
    await ctx.db.delete(args.productId);

    return args.productId;
  },
});

/**
 * Generate upload URL for product images
 * Returns a URL that can be used to upload an image to Convex storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Update stock for a product (admin only)
 */
export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("المنتج غير موجود");
    }

    if (args.stock < 0) {
      throw new Error("المخزون لا يمكن أن يكون سالباً");
    }

    await ctx.db.patch(args.productId, {
      stock: args.stock,
      updatedAt: Date.now(),
    });

    return args.productId;
  },
});

/**
 * Get products with stock information (public query)
 * Returns products with current stock count
 */
export const getWithStock = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Generate signed URLs for each product's image
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        let imageUrl: string | null = null;

        if (product.storageId) {
          try {
            const url = await ctx.storage.getUrl(product.storageId);
            imageUrl = url;
          } catch (error) {
            console.error("Error generating image URL:", error);
          }
        }

        return {
          ...product,
          imageUrl,
          inStock: (product.stock ?? 0) > 0,
        };
      })
    );

    return productsWithUrls;
  },
});

/**
 * Get stock statistics (admin only)
 */
export const getStockStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const stats = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + (p.stock ?? 0), 0),
      outOfStock: products.filter((p) => (p.stock ?? 0) === 0).length,
      lowStock: products.filter((p) => {
        const stock = p.stock ?? 0;
        return stock > 0 && stock <= 5;
      }).length,
      inStock: products.filter((p) => (p.stock ?? 0) > 5).length,
    };

    return stats;
  },
});
