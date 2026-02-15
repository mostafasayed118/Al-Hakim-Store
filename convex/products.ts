import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper function to check if the current user is an admin.
 * Throws an error if the user is not authenticated or not an admin.
 */
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: Please sign in");
  }

  // Check role from JWT claims (set via Clerk JWT template)
  const role = identity.role as string | undefined;

  if (role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return identity;
}

/**
 * Get all active products (public query - no auth required)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    return products;
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
    return product;
  },
});

/**
 * Get all products including inactive ones (admin only)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    await requireAdmin(ctx);

    const products = await ctx.db
      .query("products")
      .order("desc")
      .collect();

    return products;
  },
});

/**
 * Create a new product (admin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    size: v.optional(v.string()),
    stock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdmin(ctx);

    const now = Date.now();

    // Generate image URL if storage ID is provided
    let imageUrl: string | undefined;
    if (args.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    }

    const productId = await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      imageStorageId: args.imageStorageId,
      imageUrl,
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
    imageStorageId: v.optional(v.id("_storage")),
    size: v.optional(v.string()),
    stock: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
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
    if (updates.imageStorageId !== undefined) {
      updateData.imageStorageId = updates.imageStorageId;
      if (updates.imageStorageId) {
        updateData.imageUrl = await ctx.storage.getUrl(updates.imageStorageId);
      } else {
        updateData.imageUrl = undefined;
      }
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
    // Verify admin access
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
    // Verify admin access
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Delete associated image from storage if exists
    if (product.imageStorageId) {
      await ctx.storage.delete(product.imageStorageId);
    }

    // Permanently delete the product
    await ctx.db.delete(args.productId);

    return args.productId;
  },
});

/**
 * Generate upload URL for product images (admin only)
 * Returns a URL that can be used to upload an image to Convex storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    await requireAdmin(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});
