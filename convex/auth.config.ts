/**
 * Convex Authentication Configuration for Clerk
 * 
 * This file configures Convex to validate JWT tokens from Clerk.
 * 
 * Setup Instructions:
 * 1. In Clerk Dashboard, go to JWT Templates
 * 2. Create a new template called "Convex"
 * 3. Use the following claims configuration:
 *    {
 *      "sub": "{{user.id}}",
 *      "email": "{{user.primary_email_address}}",
 *      "name": "{{user.first_name}} {{user.last_name}}",
 *      "role": "{{user.public_metadata.role}}"
 *    }
 * 4. Copy the JWKS URL from Clerk and set it in CONVEX_AUTH_JWKS_URL
 */

import { auth } from "./_generated/server";

// Export the auth configuration
export default auth({
  // The URL of the JWKS endpoint for your auth provider (Clerk)
  // Set this in your Convex dashboard environment variables
  // Example: https://your-app.clerk.accounts.dev/.well-known/jwks.json
  jwksUrl: process.env.CONVEX_AUTH_JWKS_URL,

  // The issuer of the JWT tokens (your Clerk instance)
  // Example: https://your-app.clerk.accounts.dev
  issuer: process.env.CLERK_JWT_ISSUER,

  // Cache the JWKS for 1 hour by default
  cacheMaxAgeMs: 60 * 60 * 1000,
});
