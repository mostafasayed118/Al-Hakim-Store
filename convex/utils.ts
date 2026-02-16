import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Helper function to check if the current user is an admin
 * Throws an error if the user is not authenticated or not an admin
 * 
 * The role is passed via Clerk JWT template with the following structure:
 * {
 *   "sub": "{{user.id}}",
 *   "iat": {{token.iat}},
 *   "m": {
 *     "role": "{{user.public_metadata.role}}"
 *   }
 * }
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: يجب تسجيل الدخول");
  }

  // Debug: Log the entire identity object to see available claims
  console.log("Identity object:", JSON.stringify(identity, null, 2));

  // The role is stored in the 'm' claim (metadata) from the JWT template
  const metadata = (identity as any).m;
  const role = metadata?.role;

  // Debug: Log the role extraction
  console.log("Metadata:", metadata);
  console.log("Role:", role);

  if (role !== "admin") {
    throw new Error("Forbidden: هذه الميزة متاحة للمسؤولين فقط");
  }
}
