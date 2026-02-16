import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk via webhook
  users: defineTable({
    // Clerk identifiers
    clerkId: v.string(), // Clerk user ID (sub)
    email: v.string(),

    // Profile information
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Role management (synced from Clerk publicMetadata)
    role: v.optional(v.string()), // "admin" | undefined (customer)

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Products table
  products: defineTable({
    // Basic product info
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // Store in cents or smallest currency unit

    // Image stored in Convex File Storage
    storageId: v.optional(v.id("_storage")),

    // Product details
    size: v.optional(v.string()), // e.g., "250ml", "500ml", "1L"
    stock: v.optional(v.number()), // Inventory tracking (optional for backward compatibility)
    stockUnit: v.optional(v.string()), // Unit type: "piece", "bottle", "container", "carton", "jar", "liter", "kg"
    isActive: v.boolean(), // Soft delete / visibility toggle

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),

  // Orders table - tracks actual orders with stock reservation
  orders: defineTable({
    // Product reference
    productId: v.id("products"),
    productName: v.string(),
    productPrice: v.number(),
    quantity: v.number(), // Number of items ordered

    // User reference (if logged in)
    userId: v.optional(v.id("users")),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),

    // Order status
    status: v.union(
      v.literal("pending"),    // Order placed, awaiting processing
      v.literal("confirmed"),  // Order confirmed by admin
      v.literal("shipped"),    // Order shipped
      v.literal("delivered"),  // Order delivered
      v.literal("cancelled")   // Order cancelled (stock restored)
    ),

    // Order reference (human-readable)
    orderReference: v.string(), // e.g., "ORD-2024-ABC123"

    // Notes
    notes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Leads / Draft Orders table (WhatsApp click tracking)
  leads: defineTable({
    // Reference to user (if logged in)
    userId: v.optional(v.id("users")),

    // Contact info (captured at time of click)
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),

    // Product reference
    productId: v.id("products"),
    productName: v.string(),
    productPrice: v.number(),

    // Order reference
    orderReference: v.string(), // Human-readable: "OO-2024-ABC123"

    // WhatsApp click tracking
    whatsappClickedAt: v.number(),
    whatsappUrl: v.string(), // The URL that was generated

    // Lead status (for admin to track)
    status: v.string(), // "pending" | "contacted" | "converted" | "lost"

    // Admin notes
    notes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});
