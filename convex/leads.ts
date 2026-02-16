import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";

/**
 * Generate a unique order reference
 * Format: OO-YYYY-XXXXXX (e.g., OO-2024-ABC123)
 */
function generateOrderReference(): string {
  const prefix = "OO";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * Create a new lead when user clicks "Order on WhatsApp"
 * This is called before redirecting to WhatsApp
 */
export const create = mutation({
  args: {
    productId: v.id("products"),
    productName: v.string(),
    productPrice: v.number(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate order reference
    const orderReference = generateOrderReference();

    // Build WhatsApp URL for storage
    // The phone number should be set in environment variables
    const phoneNumber = process.env.WHATSAPP_NUMBER?.replace(/[\+\s]/g, "") || "";

    // Build the message in Egyptian Arabic
    const messageLines = [
      `سلام عليكم، في طلب جديد على المنتج`,
      ``,
      `المنتج: ${args.productName}`,
      `السعر: ${(args.productPrice / 100).toFixed(2)} جنيه`,
      `رقم الطلب: ${orderReference}`,
    ];

    if (args.userName) {
      messageLines.push(`اسم العميل: ${args.userName}`);
    }

    if (args.userEmail) {
      messageLines.push(`البريد الإلكتروني: ${args.userEmail}`);
    }

    messageLines.push(``, `العميل يريد طلب هذا المنتج.`);

    const message = encodeURIComponent(messageLines.join("\n"));
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    // Create the lead
    const leadId = await ctx.db.insert("leads", {
      userName: args.userName,
      userEmail: args.userEmail,
      productId: args.productId,
      productName: args.productName,
      productPrice: args.productPrice,
      orderReference,
      whatsappClickedAt: now,
      whatsappUrl,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return {
      leadId,
      orderReference,
      whatsappUrl,
    };
  },
});

/**
 * Get all leads (admin only)
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let leads;

    if (args.status) {
      leads = await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      leads = await ctx.db
        .query("leads")
        .withIndex("by_created_at")
        .order("desc")
        .collect();
    }

    return leads;
  },
});

/**
 * Get a single lead by ID (admin only)
 */
export const get = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const lead = await ctx.db.get(args.leadId);
    return lead;
  },
});

/**
 * Update lead status (admin only)
 */
export const updateStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.string(), // "pending" | "contacted" | "converted" | "lost"
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }

    await ctx.db.patch(args.leadId, {
      status: args.status,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return args.leadId;
  },
});

/**
 * Get lead statistics (admin only)
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allLeads = await ctx.db.query("leads").collect();

    const stats = {
      total: allLeads.length,
      pending: allLeads.filter((l) => l.status === "pending").length,
      contacted: allLeads.filter((l) => l.status === "contacted").length,
      converted: allLeads.filter((l) => l.status === "converted").length,
      lost: allLeads.filter((l) => l.status === "lost").length,
    };

    return stats;
  },
});
