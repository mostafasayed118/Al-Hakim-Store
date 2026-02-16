import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";

/**
 * Generate a unique order reference
 * Format: ORD-YYYY-XXXXXX (e.g., ORD-2024-ABC123)
 */
function generateOrderReference(): string {
  const prefix = "ORD";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * Create a new order and decrement stock
 * This is called when a user clicks "Order" button
 */
export const create = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("المنتج غير موجود");
    }

    // Check stock availability (treat undefined as unlimited stock for backward compatibility)
    const currentStock = product.stock ?? 0;
    if (currentStock < args.quantity) {
      throw new Error(`المخزون غير كافٍ. المتاح: ${currentStock} فقط`);
    }

    const now = Date.now();
    const orderReference = generateOrderReference();

    // Create the order
    const orderId = await ctx.db.insert("orders", {
      productId: args.productId,
      productName: product.name,
      productPrice: product.price,
      quantity: args.quantity,
      userName: args.userName,
      userEmail: args.userEmail,
      status: "pending",
      orderReference,
      createdAt: now,
      updatedAt: now,
    });

    // Decrement stock
    await ctx.db.patch(args.productId, {
      stock: currentStock - args.quantity,
      updatedAt: now,
    });

    return {
      orderId,
      orderReference,
      productName: product.name,
      productPrice: product.price,
      quantity: args.quantity,
    };
  },
});

/**
 * Get all orders (admin only)
 */
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_created_at")
        .order("desc")
        .collect();
    }

    return orders;
  },
});

/**
 * Get a single order by ID (admin only)
 */
export const get = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.orderId);
  },
});

/**
 * Update order status (admin only)
 */
export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("الطلب غير موجود");
    }

    const now = Date.now();

    // If cancelling, restore stock
    if (args.status === "cancelled" && order.status !== "cancelled") {
      const product = await ctx.db.get(order.productId);
      if (product) {
        const currentStock = product.stock ?? 0;
        await ctx.db.patch(order.productId, {
          stock: currentStock + order.quantity,
          updatedAt: now,
        });
      }
    }

    // If un-cancelling, decrement stock again
    if (order.status === "cancelled" && args.status !== "cancelled") {
      const product = await ctx.db.get(order.productId);
      if (product) {
        const currentStock = product.stock ?? 0;
        if (currentStock < order.quantity) {
          throw new Error(`المخزون غير كافٍ. المتاح: ${currentStock} فقط`);
        }
        await ctx.db.patch(order.productId, {
          stock: currentStock - order.quantity,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
      notes: args.notes,
      updatedAt: now,
    });

    return args.orderId;
  },
});

/**
 * Get order statistics (admin only)
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allOrders = await ctx.db.query("orders").collect();

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status === "pending").length,
      confirmed: allOrders.filter((o) => o.status === "confirmed").length,
      shipped: allOrders.filter((o) => o.status === "shipped").length,
      delivered: allOrders.filter((o) => o.status === "delivered").length,
      cancelled: allOrders.filter((o) => o.status === "cancelled").length,
      totalRevenue: allOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.productPrice * o.quantity, 0),
    };

    return stats;
  },
});
