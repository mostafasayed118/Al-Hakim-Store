import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',  // Protect all admin routes
]);

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',           // Home page
  '/api/webhooks/(.*)', // Webhook endpoints
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect admin routes - require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
