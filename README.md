This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🔐 Security Model

Al-Hakim Store is a **Clerk-authenticated storefront** with one privileged role
(`admin`; everyone else is a customer). The public API is intentionally split
into an open storefront and a guarded admin surface.

| Claim | Reality |
|---|---|
| **Authentication** | ✅ Clerk via Convex auth; JWTs validated against the Clerk issuer (`CLERK_ISSUER_URL`) on the Convex deployment. |
| **Admin-only functions** | ✅ `users.updateRole` / `listAll` / `getByClerkId` / `deleteUser` all call `requireAdmin()` — unauthenticated callers get "Unauthorized". |
| **Webhook sync** | ✅ `users.syncUser` requires the shared `CLERK_WEBHOOK_SECRET` ("Forbidden: invalid webhook secret") — anonymous callers can't mint accounts, let alone admins (escalation closed). |
| **Public storefront (by design)** | ✅ `products.list` / `products.get` (catalog) and `orders.create` (guest checkout) are anonymous by design. |

**Required environment variables:**

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | `.env.local` | Clerk client/server |
| `CLERK_WEBHOOK_SECRET` | Convex deployment env | guards `users.syncUser` |
| `CLERK_ISSUER_URL` | Convex deployment env | Convex validates Clerk JWTs |
| `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_DEPLOYMENT` | `.env.local` | Convex client |

⚠️ **Known hardening items** (from the 2026 security audit): `products.generateUploadUrl`
mints storage upload URLs anonymously, `products.getWithStock` exposes
stock/inventory data, and `checkProductName` is anonymously callable. Guest
`orders.create` also decrements stock without authentication (abuse vector).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
