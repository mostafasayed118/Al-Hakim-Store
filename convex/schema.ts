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
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()), // Cached URL for display

    // Product details
    size: v.optional(v.string()), // e.g., "250ml", "500ml", "1L"
    stock: v.optional(v.number()), // Optional inventory tracking
    isActive: v.boolean(), // Soft delete / visibility toggle

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),

  // Leads / Draft Orders table
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
