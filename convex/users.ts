import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";

/**
 * Debug query to check the current user's JWT claims
 * This helps diagnose authentication issues
 */
export const debugIdentity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return { 
        authenticated: false, 
        message: "No identity found - user not authenticated" 
      };
    }
    
    // Return all claims for debugging
    return {
      authenticated: true,
      subject: identity.subject,
      issuer: identity.issuer,
      name: identity.name,
      email: identity.email,
      // Include all raw claims
      allClaims: {
        ...identity,
        // Explicitly check for metadata claim
        m: (identity as any).m,
        metadata: (identity as any).metadata,
        // Check other possible locations
        role: (identity as any).role,
        publicMetadata: (identity as any).publicMetadata,
      }
    };
  },
});

/**
 * Get user by Clerk ID (admin only)
 */
export const getByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Authorization check - only admins can look up users by Clerk ID
    await requireAdmin(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

/**
 * Authorization helper for webhook-only mutations (e.g. Clerk user sync).
 *
 * The Clerk webhook route verifies the svix signature before calling, so these
 * mutations are legitimately invoked without a user identity. This guard:
 * 1. Rejects any authenticated (client-side) caller outright.
 * 2. Requires a shared secret that matches the Convex deployment env var,
 *    so unauthenticated attackers cannot invoke them directly.
 * SECURITY: This function ONLY uses server-side authentication context.
 */
async function requireWebhookSecret(ctx: QueryCtx | MutationCtx, secret: string) {
  // Defense layer 1: a Clerk-authenticated client must not be able to call this.
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    throw new Error("Forbidden: webhook mutations are server-only");
  }

  // Defense layer 2: shared-secret check.
  const expected = process.env.CLERK_WEBHOOK_SECRET;
  if (!expected) {
    throw new Error(
      "CLERK_WEBHOOK_SECRET is not configured in the Convex deployment",
    );
  }
  if (secret !== expected) {
    throw new Error("Forbidden: invalid webhook secret");
  }
}

/**
 * Sync or create user from Clerk webhook
 * Called when user.created or user.updated webhook is received
 */
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    // Authorization check - only the verified Clerk webhook may sync users
    await requireWebhookSecret(ctx, args.secret);

    const now = Date.now();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        role: args.role,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      role: args.role,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Update user role (admin only)
 * TODO: Add proper admin authentication
 */
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authorization check - only admins can change roles
    await requireAdmin(ctx);

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

/**
 * Delete user (called from Clerk webhook user.deleted)
 */
export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    // Authorization check - only the verified Clerk webhook may delete users
    await requireWebhookSecret(ctx, args.secret);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }

    return user?._id;
  },
});

/**
 * Get all users (admin only)
 * TODO: Add proper admin authentication
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    // Authorization check - only admins can list all users
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    return users;
  },
});
