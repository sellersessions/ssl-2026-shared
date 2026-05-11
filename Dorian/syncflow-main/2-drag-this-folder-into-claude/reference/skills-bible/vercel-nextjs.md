# Vercel + Next.js — Expert Reference for Amazon Brand Application Development

> **Scope:** Everything the syncflow system needs to know about building custom dashboards, internal ops tools, seller portals, and client-facing interfaces with Next.js and Vercel. Covers the full stack from project architecture through production deployment — integrated with Supabase, SP-API, and the broader syncflow platform.  
> **Stack Context:** Next.js (App Router) + Supabase + Vercel + SP-API + n8n  
> **Audience:** Practitioners building Amazon brand applications — not a neutral survey. When we say "do this," we mean it.  
> **Last Updated:** May 2026

---

## Table of Contents

1. [When This Stack Is the Right Choice](#1-when-this-stack-is-the-right-choice)
2. [Next.js App Router Architecture](#2-nextjs-app-router-architecture)
3. [Supabase ↔ Next.js Integration](#3-supabase--nextjs-integration)
4. [Authentication with Supabase Auth](#4-authentication-with-supabase-auth)
5. [API Routes — Route Handlers](#5-api-routes--route-handlers)
6. [Environment Variables](#6-environment-variables)
7. [Deployment to Vercel](#7-deployment-to-vercel)
8. [Preview vs Production Environment Strategy](#8-preview-vs-production-environment-strategy)
9. [Edge Runtime vs Node.js Runtime](#9-edge-runtime-vs-nodejs-runtime)
10. [Data Fetching Patterns for Amazon Dashboards](#10-data-fetching-patterns-for-amazon-dashboards)
11. [Connecting to SP-API from Next.js](#11-connecting-to-sp-api-from-nextjs)
12. [UI Stack — shadcn/ui + Tailwind + Radix](#12-ui-stack--shadcnui--tailwind--radix)
13. [Vercel Analytics and Speed Insights](#13-vercel-analytics-and-speed-insights)
14. [Cost Structure](#14-cost-structure)
15. [Common Gotchas](#15-common-gotchas)
16. [Amazon Brand App Patterns with Code Sketches](#16-amazon-brand-app-patterns-with-code-sketches)
17. [Dos & Don'ts](#17-dos--donts)
18. [Quick Reference Cheat Sheet](#18-quick-reference-cheat-sheet)

---

## 1. When This Stack Is the Right Choice

### The Decision Threshold

The single biggest mistake in Amazon operations tooling is building a custom app when an off-the-shelf tool would do. Custom software has real costs: development time, maintenance, onboarding, and the ongoing opportunity cost of every feature you don't build for your actual business. Be honest before you reach for Next.js.

**Stay in off-the-shelf tools when:**
- The workflow fits ClickUp, Notion, or Airtable natively — task management, SOPs, content calendars, client CRM
- You need reporting that Looker Studio or Metabase (pointed at Supabase) can deliver — basic dashboards with simple filters
- The audience is your internal ops team who is already trained on those tools
- The data refresh cycle is daily or weekly — no real-time requirements
- You need it working in two days, not two weeks

**Build with Next.js + Vercel when:**
- You need to display data that requires complex joins, live SP-API calls, or real-time updates — things a BI tool can't express cleanly
- You are building a **client-facing portal**: white-labelled, with your brand, where clients log in to see their account data. You cannot put clients inside your ClickUp workspace
- You need **calculated metrics** assembled from multiple data sources: SP-API orders + Ads API ASIN performance + Supabase historical baseline — all combined into one view
- You are building something with **interactive workflows**: a tool where users submit forms, trigger automations (n8n webhooks), or approve/reject actions — not just read data
- The UX requirements exceed what embedded Metabase or Retool can express — custom charts, drag-and-drop interfaces, conditional layouts
- You are building a **multi-tenant SaaS** feature for syncflow clients — each client sees only their data, with their branding, at their subdomain
- You need server-side logic that protects credentials (SP-API LWA tokens, Supabase service role keys) that must never touch the browser

### The Honest Assessment: Retool and Metabase

**Retool** is worth considering for internal tools with moderate complexity. It gives you pre-built components (tables, forms, charts, modals) and connects directly to Supabase via REST or direct SQL. If the tool is purely for your internal team and the component library covers your needs, Retool is faster to build and easier to maintain. The threshold for choosing Next.js over Retool is: does the tool need custom UI logic Retool components can't express, does it need to be client-facing, or does it need server-side computation beyond simple queries? If all three answers are no, use Retool.

**Metabase** (self-hosted on Railway or pointed at Supabase) is the right choice for analytical dashboards — visualising aggregated Amazon data (BSR trends, PPC ROAS by campaign type, inventory days-of-supply). Don't build charts in Next.js when Metabase would do. Metabase is a tool for answering "show me the data." Next.js is a tool for "do something with the data."

### What Next.js + Vercel Is Clearly Best For

| Use Case | Verdict |
|---|---|
| Client-facing performance dashboard | **Build it** — white-label, auth, real data |
| Internal ASIN manager (bulk edit listings) | **Build it** — form-heavy, SP-API write operations |
| PPC approval workflow (manager approves bid changes) | **Build it** — interactive, role-based access |
| Multi-brand inventory alert board | **Build it** — real-time, computed thresholds |
| Basic order count dashboard | **Metabase** — overkill to build custom |
| SOPs and task assignment | **ClickUp** — don't replace what works |
| Ad performance trend analysis | **Metabase + Supabase** — BI tool wins |
| Client CRM | **Notion or ClickUp** — custom is waste |

---

## 2. Next.js App Router Architecture

### Why App Router, Not Pages Router

Next.js has two routing systems: the legacy Pages Router (`/pages` directory) and the App Router (`/app` directory), introduced in Next.js 13 and stable since 13.4. For all new syncflow projects, use the App Router. The Pages Router is in maintenance mode — it won't receive new features. App Router unlocks React Server Components, streaming, nested layouts, and co-located data fetching that fundamentally changes how you build with Next.js.

### Folder Structure

```
my-app/
├── app/
│   ├── layout.tsx              # Root layout — applies to entire app
│   ├── page.tsx                # Route: /
│   ├── loading.tsx             # Root loading UI (suspense boundary)
│   ├── error.tsx               # Root error boundary
│   ├── not-found.tsx           # 404 page
│   │
│   ├── (auth)/                 # Route group — no URL segment
│   │   ├── login/
│   │   │   └── page.tsx        # Route: /login
│   │   ├── signup/
│   │   │   └── page.tsx        # Route: /signup
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts    # Route: /auth/callback (Supabase OAuth)
│   │
│   ├── (dashboard)/            # Route group — protected routes
│   │   ├── layout.tsx          # Dashboard shell (nav, sidebar)
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Route: /dashboard
│   │   │   └── loading.tsx     # Dashboard-level loading state
│   │   ├── asins/
│   │   │   ├── page.tsx        # Route: /asins (list)
│   │   │   └── [asin]/
│   │   │       └── page.tsx    # Route: /asins/B073XTWVM6 (detail)
│   │   └── campaigns/
│   │       └── page.tsx        # Route: /campaigns
│   │
│   └── api/
│       ├── sp-api/
│       │   └── orders/
│       │       └── route.ts    # Route handler: /api/sp-api/orders
│       └── webhooks/
│           └── n8n/
│               └── route.ts    # Route handler: /api/webhooks/n8n
│
├── components/
│   ├── ui/                     # shadcn/ui generated components
│   ├── charts/                 # Recharts or Chart.js wrappers
│   ├── tables/                 # Data table components
│   └── forms/                  # Form components
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # createServerClient helper
│   │   └── client.ts           # createBrowserClient helper
│   ├── sp-api/
│   │   ├── auth.ts             # LWA token refresh
│   │   └── client.ts           # SP-API request wrapper
│   └── utils.ts                # cn(), formatters, etc.
│
├── hooks/                      # Client-side React hooks
├── types/                      # TypeScript type definitions
├── middleware.ts               # Auth protection (Supabase session refresh)
├── next.config.ts
├── tailwind.config.ts
└── .env.local
```

### Route Groups

Route groups (folders wrapped in parentheses, e.g., `(auth)`, `(dashboard)`) are a critical App Router feature. They let you:
- Apply different layouts to different sections without affecting the URL
- Protect all dashboard routes with a single layout check
- Keep auth routes (login, signup) outside the dashboard layout

The `(dashboard)` layout wraps all authenticated routes. That layout's `layout.tsx` is where you check session existence and render the sidebar/nav shell. The `(auth)` routes use a minimal layout — or the root layout directly.

### Layouts, Pages, Loading, and Error

Every route segment can export four special files:

| File | Purpose | Renders As |
|---|---|---|
| `layout.tsx` | Persistent wrapper — doesn't re-render on navigation | React component with `{children}` |
| `page.tsx` | The route's content — renders inside its layout chain | React component |
| `loading.tsx` | Shown while `page.tsx` is streaming | Suspense fallback |
| `error.tsx` | Shown when `page.tsx` throws | Error boundary (must be `'use client'`) |
| `not-found.tsx` | Shown when `notFound()` is called | React component |

```tsx
// app/(dashboard)/layout.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

### Server Components vs Client Components

This is the most important mental model shift in App Router. Get this wrong and you'll have performance issues, security leaks, and hydration errors.

**Server Components** (default — no directive needed):
- Rendered on the server at request time or build time
- Can directly `await` database queries, API calls
- Never shipped to the browser — zero bundle impact
- Cannot use browser APIs (`window`, `localStorage`, event listeners)
- Cannot use React hooks (`useState`, `useEffect`, `useContext`)

**Client Components** (`'use client'` directive at top of file):
- Rendered on the client (and also pre-rendered on server for initial HTML)
- Can use hooks, browser APIs, event handlers
- Their code IS shipped to the browser — keep them lean
- Cannot directly call server-side resources (database, secrets)

```tsx
// Server Component — data fetched on the server, no bundle cost
// app/(dashboard)/asins/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { AsinTable } from '@/components/tables/asin-table'

export default async function AsinsPage() {
  const supabase = await createServerClient()
  const { data: asins } = await supabase
    .from('asins')
    .select('asin, title, current_bsr, units_sold_7d')
    .order('units_sold_7d', { ascending: false })
    .limit(100)

  return <AsinTable asins={asins ?? []} />
}
```

```tsx
// Client Component — interactivity, hooks, event handlers
// components/tables/asin-table.tsx
'use client'

import { useState } from 'react'
import { type Asin } from '@/types'

export function AsinTable({ asins }: { asins: Asin[] }) {
  const [search, setSearch] = useState('')

  const filtered = asins.filter(a =>
    a.asin.includes(search) || a.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter ASINs..."
        className="mb-4 w-full rounded border px-3 py-2"
      />
      <table>
        {/* table rows */}
      </table>
    </div>
  )
}
```

**The composition pattern:** Server Components fetch data and pass it as props to Client Components. Client Components handle interactivity. This is the correct mental model. The data fetch never goes near the browser. The interactive layer never touches the database directly.

**Decision rule: default to Server Components.** Add `'use client'` only when you need hooks, browser APIs, or event handlers. Don't add it "just to be safe" — that defeats the purpose.

---

## 3. Supabase ↔ Next.js Integration

### The Right Package: @supabase/ssr

For App Router, use `@supabase/ssr`. This is not `@supabase/supabase-js` alone — that package doesn't handle the cookie-based session management that SSR requires. The `@supabase/ssr` package wraps the base client with cookie adapters for both server and browser contexts.

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### createServerClient vs createBrowserClient

These are two different client factories with different cookie access patterns:

| | `createServerClient` | `createBrowserClient` |
|---|---|---|
| **Used in** | Server Components, Route Handlers, `middleware.ts` | Client Components |
| **Cookie access** | Via Next.js `cookies()` (read/write) | Via `document.cookie` |
| **Auth session** | Reads from httpOnly cookies | Reads from browser cookies |
| **Bundle cost** | Zero — server only | Included in client bundle |
| **Import** | `@supabase/ssr` | `@supabase/ssr` |

```ts
// lib/supabase/server.ts
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types/supabase'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components — can't set cookies there
            // The middleware handles the refresh instead
          }
        },
      },
    }
  )
}
```

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### TypeScript Types from Supabase

Generate type definitions from your Supabase schema and import them everywhere. This gives you full type safety end-to-end.

```bash
npx supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

Add this to your `package.json` scripts:
```json
{
  "scripts": {
    "types": "supabase gen types typescript --project-id your-project-ref > types/supabase.ts"
  }
}
```

Run `npm run types` after every migration. The generated `Database` type goes into the `createServerClient<Database>` and `createBrowserClient<Database>` calls — you get autocomplete on table names, column names, and return types throughout your app.

### Server Component Data Fetching Pattern

```tsx
// Correct: data fetched on server, typed, passed to component
export default async function CampaignsPage() {
  const supabase = await createServerClient()
  
  const { data: campaigns, error } = await supabase
    .from('ppc_campaigns')
    .select(`
      id,
      campaign_name,
      campaign_type,
      budget,
      spend_7d,
      sales_7d,
      acos_7d,
      status
    `)
    .eq('status', 'enabled')
    .order('spend_7d', { ascending: false })

  if (error) throw error  // Caught by nearest error.tsx

  return <CampaignTable campaigns={campaigns} />
}
```

---

## 4. Authentication with Supabase Auth

### middleware.ts — The Gatekeeper

Middleware runs on every request before the page renders. For Supabase auth, middleware has one critical job: **refresh the session token** so it doesn't expire while the user is active. Without this, users get logged out mid-session.

```ts
// middleware.ts (root of project, not inside /app)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not call supabase.auth.getSession() in middleware
  // getUser() makes a network call to Supabase — it's authoritative
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Return supabaseResponse, not NextResponse.next()
  // The cookies must be forwarded for session refresh to work
  return supabaseResponse
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Critical:** Always use `supabase.auth.getUser()` in middleware, not `getSession()`. `getSession()` reads from the cookie without verifying with the server — it can be spoofed. `getUser()` makes a real network call to Supabase to verify the JWT. It's slightly slower but it's the secure choice.

### Auth Callback Route (OAuth + Magic Links)

```ts
// app/auth/callback/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error`)
}
```

This route handles:
- Email magic link callbacks
- OAuth callbacks (Google, GitHub, etc.)
- PKCE flow (the default and most secure)

### Login Page

```tsx
// app/(auth)/login/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in — send to dashboard
  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  )
}
```

```tsx
// components/auth/login-form.tsx — Client Component
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleMagicLink() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (!error) {
      // Show "check your email" message
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleMagicLink() }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  )
}
```

### Protecting API Routes

```ts
// In any Route Handler that requires auth:
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Proceed with authenticated logic
}
```

---

## 5. API Routes — Route Handlers

### When to Use What

This is one of the most consequential architectural decisions in a syncflow app. The table below is the decision matrix — follow it.

| Scenario | Use |
|---|---|
| SP-API calls from the browser | **Next.js Route Handler** — NEVER call SP-API client-side |
| Data that must be server-gated (credentials in env vars) | **Route Handler** |
| Light webhook receiver (from n8n, Supabase, or Stripe) | **Route Handler** |
| Background data sync jobs, scheduled operations | **n8n** — it has retry logic, scheduling, logging |
| Complex multi-step automation (conditional logic, multiple APIs) | **n8n** |
| Heavy computation, ML inference, long-running tasks | **Supabase Edge Function** or **n8n** |
| Database operations triggered by user action (form submit) | **Server Action** (Next.js 14+) — no API route needed |
| Real-time subscriptions | **Supabase Realtime** directly from browser client |

**The core rule: Route Handlers are for things that require server-side secrets or server-side processing triggered by a browser request.** For async workflows and background jobs, n8n is the right tool — it has persistence, retries, observability, and a visual editor. Don't build a custom job queue in Next.js when n8n already solves it.

### Route Handler Anatomy

```ts
// app/api/sp-api/orders/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSpApiOrders } from '@/lib/sp-api/orders'

// Named exports for each HTTP method
export async function GET(request: Request) {
  // 1. Auth check
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse params
  const { searchParams } = new URL(request.url)
  const marketplaceId = searchParams.get('marketplaceId') ?? 'ATVPDKIKX0DER'
  const daysBack = parseInt(searchParams.get('days') ?? '7', 10)

  // 3. SP-API call (server-side only — credentials in env vars)
  try {
    const orders = await getSpApiOrders({ marketplaceId, daysBack })
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('SP-API orders fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  // Handle POST...
}
```

### Server Actions (Next.js 14+)

For form submissions that write to Supabase, use Server Actions instead of creating a Route Handler + fetch call. They eliminate the API boilerplate.

```tsx
// app/(dashboard)/asins/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAsinNote(asin: string, note: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('asins')
    .update({ notes: note, updated_at: new Date().toISOString() })
    .eq('asin', asin)

  revalidatePath('/asins')
}
```

```tsx
// Usage in a Client Component
'use client'
import { updateAsinNote } from './actions'

export function AsinNoteForm({ asin }: { asin: string }) {
  return (
    <form action={async (formData) => {
      'use server'
      await updateAsinNote(asin, formData.get('note') as string)
    }}>
      <textarea name="note" />
      <button type="submit">Save Note</button>
    </form>
  )
}
```

---

## 6. Environment Variables

### The Two Categories: Public and Secret

Next.js has a strict rule: environment variables are **server-only by default**. To expose a variable to the browser, prefix it with `NEXT_PUBLIC_`. Anything without that prefix is inaccessible in Client Components and the browser bundle.

| Variable | Prefix | Accessible In | Use For |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Everywhere | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Everywhere | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server only | Bypasses RLS — dangerous if leaked |
| `SP_API_CLIENT_ID` | No | Server only | LWA client credentials |
| `SP_API_CLIENT_SECRET` | No | Server only | LWA client credentials |
| `SP_API_REFRESH_TOKEN` | No | Server only | Per-seller refresh token |
| `N8N_WEBHOOK_SECRET` | No | Server only | Validate incoming n8n webhooks |

**Never prefix SP-API credentials, service role keys, or webhook secrets with `NEXT_PUBLIC_`.** This would expose them in the browser bundle and anyone with DevTools could read them.

### File Hierarchy

```
.env                    # Committed to git — non-sensitive defaults only
.env.local              # NOT committed — local development secrets
.env.development        # Committed — development-specific non-secrets
.env.production         # Committed — production non-secrets (secrets go in Vercel)
```

In practice for syncflow, almost everything sensitive goes in `.env.local` for local dev and Vercel's environment variable UI for deployed environments. The `.env` file at the root should only contain safe defaults that can be committed.

```bash
# .env.local (local development — never commit this)

# Supabase (dev project)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SP-API (use sandbox credentials for local dev)
SP_API_CLIENT_ID=amzn1.application-oa2-client.xxx
SP_API_CLIENT_SECRET=xxx
SP_API_REFRESH_TOKEN=Atzr|xxx
SP_API_REGION=us-east-1
SP_API_MARKETPLACE_ID=ATVPDKIKX0DER

# n8n
N8N_WEBHOOK_SECRET=your-random-secret-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Environment Variable Configuration

In Vercel, go to **Project → Settings → Environment Variables**. You can scope each variable to one or more environments:

- **Production** — live site
- **Preview** — all preview deployments (PRs, branches)
- **Development** — pulled when you run `vercel env pull`

```bash
# Pull Vercel env vars to .env.local for local dev
vercel env pull .env.local
```

This syncs your Vercel environment variables locally without you manually copying them. Run this when you join a project or when variables change.

---

## 7. Deployment to Vercel

### GitHub Integration (Recommended)

Connect your Next.js repository to Vercel once — after that, every push triggers a deployment automatically.

```
git push origin main          → Production deployment
git push origin feature/xxx   → Preview deployment (unique URL)
Pull Request opened           → Preview deployment (linked in PR)
```

Setup steps:
1. `vercel.com` → **Add New Project** → Import Git Repository
2. Select your GitHub repo
3. Vercel auto-detects Next.js and configures the build (`next build`)
4. Add environment variables in the Vercel dashboard
5. First deploy runs automatically

### Vercel CLI (Manual Deploys)

```bash
# Install globally
npm install -g vercel

# Login
vercel login

# Link current directory to a Vercel project
vercel link

# Deploy preview (same as git push to non-main branch)
vercel deploy

# Deploy to production (equivalent to merging to main)
vercel deploy --prod
```

### Custom Domains

```bash
# Add domain via CLI
vercel domains add yourdomain.com

# Or in dashboard: Project → Settings → Domains
# Vercel handles SSL automatically via Let's Encrypt
```

For client portals, use subdomains per client:
```
client1.syncflow.app
client2.syncflow.app
```

Configure wildcard subdomains in Vercel and route by subdomain in your middleware — `request.headers.get('host')` gives you the subdomain, which you use to look up the tenant in Supabase.

### next.config.ts Essentials

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from external domains (Amazon product images, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
    ],
  },

  // Redirect www to non-www (or vice versa)
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'www.yourdomain.com' }],
        destination: 'https://yourdomain.com/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
```

---

## 8. Preview vs Production Environment Strategy

### The Problem With Shared Environments

A common mistake: using the same Supabase project for both preview deployments and production. This means every PR preview is hitting live data, every test migration could corrupt production tables, and every developer experiment runs against real credentials. Don't do this.

### The Correct Setup

```
Environment         Supabase Project          SP-API Credentials
─────────────────   ───────────────────────   ─────────────────────────
Production          syncflow-prod              Live LWA credentials
Preview/Staging     syncflow-staging           SP-API Sandbox credentials
Local Dev           syncflow-dev (or local)    SP-API Sandbox credentials
```

Each environment gets completely separate Supabase projects — separate URLs, separate keys, separate data. In Vercel, scope environment variables to their environment:

- `NEXT_PUBLIC_SUPABASE_URL` → different values for Production vs Preview
- `SP_API_REFRESH_TOKEN` → sandbox token for Preview, live token for Production only

This way, when a developer opens a PR and Vercel creates a preview deployment, it points at the staging Supabase project and the SP-API sandbox. Nothing touches production data.

### Schema Parity

Keep staging schema in sync with production using migrations (Supabase CLI). The migration workflow:

```bash
# Create a migration
supabase migration new add_inventory_threshold_column

# Apply to local
supabase db reset

# Test migration, then push to staging
supabase db push --project-ref staging-project-ref

# After testing, push to production
supabase db push --project-ref prod-project-ref
```

Never run raw `ALTER TABLE` statements in the dashboard on production. Always go through migrations.

---

## 9. Edge Runtime vs Node.js Runtime

### What's the Difference

Next.js Route Handlers and middleware can run in two runtimes:

**Edge Runtime:**
- Based on the V8 isolate model (same as Cloudflare Workers)
- Starts in ~0ms — no cold starts
- Global distribution — runs close to the user
- Limited API surface: no `fs`, no `net`, no `child_process`, no Node.js built-ins
- Memory capped at 128MB
- Maximum execution time: 30 seconds
- **Cost on Vercel:** cheaper — Edge Functions are billed differently from Serverless Functions

**Node.js Runtime (default):**
- Full Node.js environment — all npm packages work
- Cold starts of 50–500ms (varies by package size)
- Runs in the region you configure (default: `iad1` — US East)
- No memory or package restrictions within reason
- **Cost on Vercel:** slightly more expensive, counts against function execution limits

### Decision Matrix

| Use Case | Runtime | Reason |
|---|---|---|
| Middleware (session refresh) | **Edge** | Zero cold start, runs on every request |
| SP-API calls | **Node.js** | Uses AWS SDK or heavy HTTP libraries |
| Simple data proxy (Supabase → client) | **Edge** | Fast, cheap, no Node.js dependencies |
| PDF generation | **Node.js** | Libraries like Puppeteer require Node |
| JWT verification | **Edge** | Crypto APIs available in edge |
| Any use of `aws-sdk` or `@aws-sdk/*` | **Node.js** | Not compatible with Edge |
| n8n webhook receivers | **Edge** | Fast, stateless, just parse JSON |
| Heavy computation | **Node.js** | Edge memory and CPU limits |

```ts
// Opt into Edge Runtime for a Route Handler
export const runtime = 'edge'

export async function GET(request: Request) {
  // Only Edge-compatible code here
}
```

```ts
// Explicitly declare Node.js runtime (it's the default, but be explicit for clarity)
export const runtime = 'nodejs'
```

For most syncflow Route Handlers (SP-API calls, Supabase queries), use Node.js runtime. For middleware, Edge is the right choice and is the default in Next.js middleware.

---

## 10. Data Fetching Patterns for Amazon Dashboards

### The Four Patterns

Next.js App Router supports four fundamentally different data fetching strategies. Each has a specific use case.

#### 1. Static Generation (Build Time)

```tsx
// Data fetched once at build time — fastest possible response
// Good for: static content, documentation, rarely-changing reference data

export default async function MarketplacesPage() {
  // This runs at build time, not per-request
  const marketplaces = await fetchMarketplaceList()
  return <MarketplaceGrid marketplaces={marketplaces} />
}
```

Not appropriate for Amazon dashboards where data changes constantly.

#### 2. ISR — Incremental Static Regeneration

```tsx
// Data fetched at build time AND refreshed on a schedule
// Good for: hourly metrics, BSR snapshots, daily reporting data

// app/(dashboard)/overview/page.tsx
export const revalidate = 3600  // Revalidate every hour

export default async function OverviewPage() {
  const supabase = await createServerClient()
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: false })
    .limit(30)

  return <MetricsSummary metrics={metrics ?? []} />
}
```

Use ISR for metrics that refresh on a known schedule. The `revalidate` value (in seconds) tells Next.js how often to regenerate the page. The first visitor after the interval triggers a background revalidation — subsequent visitors get the cached version instantly. This is excellent for dashboards showing hourly aggregates.

**On-demand revalidation** (when data updates): call `revalidatePath('/overview')` from a Server Action or Route Handler after a data sync completes. This immediately invalidates the cached page.

#### 3. Server-Side Rendering (Per-Request)

```tsx
// Data fetched fresh on every request
// Good for: user-specific data, real-time inventory counts, anything that changes frequently

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: inventory } = await supabase
    .from('inventory_levels')
    .select('asin, quantity_available, days_of_supply')
    .eq('seller_id', user!.id)  // User-specific — can't cache this

  return <InventoryBoard inventory={inventory ?? []} />
}
```

User-specific data **must** be server-side rendered — you can't cache it. Any page where the user is logged in and sees their own data should use `dynamic = 'force-dynamic'` or will be dynamic automatically because it reads cookies (session) on every request.

#### 4. Client-Side Fetching (SWR / React Query)

```tsx
// Data fetched in the browser, with polling or mutation
// Good for: real-time updates, optimistic UI, high-frequency refreshes

'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function LiveInventoryWidget({ asin }: { asin: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/inventory/${asin}`,
    fetcher,
    { refreshInterval: 30_000 }  // Poll every 30 seconds
  )

  if (isLoading) return <Skeleton />
  if (error) return <ErrorBadge />

  return (
    <div>
      <span>{data.quantity_available} units</span>
      <span>{data.days_of_supply} days of supply</span>
    </div>
  )
}
```

Use client-side SWR for:
- Data that changes faster than ISR can handle (real-time inventory)
- User-initiated refreshes (a "refresh" button)
- Optimistic updates (immediately show the result of an action without waiting for server)

### The Pattern Decision Tree

```
Is the data the same for all users?
  └── Yes: Is it mostly static (changes rarely)?
            └── Yes: Static Generation
            └── No: ISR (revalidate = appropriate interval)
  └── No (user-specific):
        Does it need to be real-time or polled?
          └── Yes: Client-Side SWR
          └── No: Server-Side Rendering (dynamic)
```

For most Amazon dashboards: use **ISR for aggregated metrics** (they're the same for all viewers of that brand account), **SSR for user-specific views**, and **client-side SWR** only where real-time polling is genuinely necessary.

---

## 11. Connecting to SP-API from Next.js

### The Ironclad Rule

**SP-API calls MUST happen server-side. Always. No exceptions.**

Why: your LWA client credentials (`client_id`, `client_secret`) and the seller's `refresh_token` must never appear in the browser bundle or be readable in DevTools. If someone inspects your app's network requests and sees SP-API calls being made from the browser, credentials have already been exposed. Fix this immediately.

The correct architecture:
```
Browser → Next.js Route Handler (server) → SP-API
                  ↑
         Credentials in env vars
         Never sent to client
```

### LWA Token Refresh Pattern

SP-API uses Login With Amazon (LWA) OAuth. You have a long-lived `refresh_token` (stored in Supabase Vault or env vars). Before each API call, you exchange it for a short-lived `access_token`.

```ts
// lib/sp-api/auth.ts
interface LwaTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getLwaAccessToken(): Promise<string> {
  // Use cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SP_API_REFRESH_TOKEN!,
      client_id: process.env.SP_API_CLIENT_ID!,
      client_secret: process.env.SP_API_CLIENT_SECRET!,
    }),
  })

  if (!response.ok) {
    throw new Error(`LWA token refresh failed: ${response.status}`)
  }

  const data: LwaTokenResponse = await response.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}
```

**Note on caching:** The simple in-memory cache above works for a single serverless function instance, but serverless functions are stateless — each cold start gets a fresh instance. For production, cache the access token in Supabase or a Redis store (Upstash) with the expiration. This prevents hammering the LWA endpoint with refresh calls.

### SP-API Request Wrapper

```ts
// lib/sp-api/client.ts
import { getLwaAccessToken } from './auth'

const SP_API_BASE_URLS: Record<string, string> = {
  'us-east-1': 'https://sellingpartnerapi-na.amazon.com',
  'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
  'us-west-2': 'https://sellingpartnerapi-fe.amazon.com',
}

export async function spApiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getLwaAccessToken()
  const region = process.env.SP_API_REGION ?? 'us-east-1'
  const baseUrl = SP_API_BASE_URLS[region]

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`SP-API error ${response.status}: ${JSON.stringify(error)}`)
  }

  return response.json()
}
```

```ts
// lib/sp-api/orders.ts
import { spApiRequest } from './client'

export async function getOrders(params: {
  marketplaceIds: string[]
  createdAfter: string
  orderStatuses?: string[]
}) {
  const query = new URLSearchParams({
    MarketplaceIds: params.marketplaceIds.join(','),
    CreatedAfter: params.createdAfter,
    ...(params.orderStatuses && {
      OrderStatuses: params.orderStatuses.join(','),
    }),
  })

  return spApiRequest<{ payload: { Orders: any[]; NextToken?: string } }>(
    `/orders/v0/orders?${query}`
  )
}
```

### Credential Retrieval from Supabase Vault

For multi-seller setups where each seller has their own SP-API credentials, store credentials in Supabase Vault rather than environment variables.

```ts
// For multi-tenant: retrieve seller's SP-API credentials from Supabase Vault
export async function getSellerCredentials(sellerId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .rpc('get_seller_sp_api_credentials', { seller_id: sellerId })

  if (error || !data) throw new Error('Could not retrieve seller credentials')

  return {
    clientId: data.client_id,
    clientSecret: data.client_secret,
    refreshToken: data.refresh_token,
    marketplaceId: data.marketplace_id,
  }
}
```

The Supabase function `get_seller_sp_api_credentials` decrypts vault secrets server-side using `vault.decrypted_secrets`. The decrypted values never leave the database directly — only the specific fields needed are returned, and only to authenticated sessions with appropriate RLS.

---

## 12. UI Stack — shadcn/ui + Tailwind + Radix

### Why This Combination

For Amazon brand dashboards and internal tools, the UI stack recommendation is:

- **shadcn/ui** — component library (not a dependency, it copies components into your codebase)
- **Tailwind CSS** — utility-first CSS framework
- **Radix UI** — headless, accessible primitives (shadcn is built on top of Radix)
- **Recharts** — React charting library (for Amazon metrics visualisations)
- **TanStack Table** — headless table library (for ASIN/order/campaign data tables)

This stack is chosen because:
- shadcn components are **in your codebase** — you own and can modify every component
- Radix provides **accessibility out of the box** — dialogs, dropdowns, tooltips, all keyboard navigable
- Tailwind means **no CSS file sprawl** — styles are co-located with components
- The combination is standard enough that AI coding tools (including Claude) know it extremely well

### Setup

```bash
# Initialize Next.js with Tailwind
npx create-next-app@latest my-app --typescript --tailwind --app

# Initialize shadcn/ui
npx shadcn@latest init

# You'll be asked:
# Which style? → Default (or New York — a slightly different aesthetic)
# Base color? → Slate or Zinc (for internal tools)
# CSS variables for colors? → Yes

# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add skeleton
```

### Theming for Brand Colours

shadcn uses CSS variables for theming. Customize in `globals.css`:

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;      /* Your brand blue */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --accent: 210 40% 96.1%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    /* Amazon orange for alerts/highlights */
    --amazon-orange: 35 100% 50%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode overrides */
  }
}
```

### Data Tables with TanStack Table

For Amazon dashboards, data tables are everywhere. TanStack Table is the right tool:

```bash
npm install @tanstack/react-table
```

```tsx
'use client'

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Asin = {
  asin: string
  title: string
  bsr: number
  units_7d: number
  revenue_7d: number
}

const columns: ColumnDef<Asin>[] = [
  { accessorKey: 'asin', header: 'ASIN' },
  { accessorKey: 'title', header: 'Title' },
  {
    accessorKey: 'bsr',
    header: 'BSR',
    cell: ({ row }) => row.original.bsr.toLocaleString(),
  },
  {
    accessorKey: 'revenue_7d',
    header: '7d Revenue',
    cell: ({ row }) => `$${row.original.revenue_7d.toFixed(2)}`,
  },
]

export function AsinDataTable({ data }: { data: Asin[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className="cursor-pointer select-none"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 13. Vercel Analytics and Speed Insights

### Setup

```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

That's it. Vercel automatically activates both for Pro+ projects.

### What to Monitor for Internal Tools

For internal Amazon dashboards, the standard web metrics (Lighthouse scores, SEO) are irrelevant. Focus on:

**Speed Insights:**
- **FCP (First Contentful Paint)** — how long until users see something. Target < 1.5s for internal tools
- **LCP (Largest Contentful Paint)** — when the main data table or chart appears. Target < 2.5s
- Watch for regressions after adding new data fetches or third-party libraries

**Vercel Analytics:**
- **Page load times by route** — find which dashboard pages are slow
- **Error rates** — catch 500s from Route Handlers early
- **Most visited pages** — prioritise performance improvements on high-traffic pages

For internal tools, Core Web Vitals scores matter less than actual page load times for your users. Use the Real User Monitoring data from Speed Insights to understand what your actual users experience, not synthetic Lighthouse scores.

---

## 14. Cost Structure

### Vercel Pricing Tiers

| Tier | Price | Function Executions | Bandwidth | Seats | What Breaks You Out |
|---|---|---|---|---|---|
| **Hobby** | Free | 100K / month | 100 GB | 1 (personal only) | Commercial use, team, scale |
| **Pro** | $20/mo/seat | 1M / month (then $0.60/M) | 1 TB | Up to 10 | Fine for most syncflow apps |
| **Enterprise** | Custom | Custom | Custom | Unlimited | Large orgs, SLA requirements |

### What Triggers the Pro Requirement

- **Commercial use** — Hobby explicitly prohibits commercial usage. Any syncflow client app is commercial. Start on Pro.
- **Team members** — Hobby is one person. The moment a second developer needs to deploy, you need Pro.
- **Custom domains on multiple projects** — possible on Pro, more limited on Hobby
- **Preview deployments for collaboration** — technically available on Hobby but Pro has no restrictions

### Cost Gotchas

**Function execution overages:** On Pro, you get 1M serverless function invocations included. If your Amazon dashboard polls SP-API via Route Handlers every 30 seconds for 100 users, that's 100 × 2 calls/min × 60 × 24 × 30 = ~8.6M calls/month. That's 7.6M in overage at $0.60/M = ~$4.56 extra. Not catastrophic, but watch it.

**Bandwidth:** If you serve large images (Amazon product images), make sure to use Next.js `<Image>` which optimises and caches images on Vercel's CDN. Serving raw external images through your domain runs up bandwidth unnecessarily.

**Build minutes:** Vercel Pro includes 24,000 build minutes/month. A typical Next.js build is 1–3 minutes. 24,000 / 2 = 12,000 deploys/month before overages. You won't hit this.

**Edge Function executions** are billed separately from Serverless Function executions and are much cheaper per invocation. Middleware runs as Edge — that's included separately and generously.

### Practical Cost For a Typical syncflow App

A client-facing portal with:
- 10–20 active users
- Supabase data fetching (not billable to Vercel)
- A handful of Route Handlers for SP-API calls
- Deployed on Pro

Monthly Vercel cost: **$20/month** (the base Pro fee). Function executions stay well within 1M. Bandwidth stays well within 1 TB. Vercel is not the expensive part — Supabase is, and even that is $25–50/month for the Pro tier.

---

## 15. Common Gotchas

### Cold Starts

Serverless functions have cold starts — the first invocation after a period of inactivity takes longer because the runtime needs to initialise. For Route Handlers:

- **Heavy packages = longer cold starts.** The AWS SDK v3 adds significant cold start time. Use only the specific `@aws-sdk/client-*` you need, not the entire SDK.
- **Edge functions have near-zero cold starts.** For latency-critical endpoints, consider Edge Runtime if you don't need Node.js built-ins.
- **Vercel Pro has "Fluid Compute"** — automatically scales function instances and reduces cold starts by reusing warm instances. Enable it in project settings.

Mitigation: keep Route Handlers lean, use dynamic imports for heavy libraries, and accept that the first request after idle will be slower.

### Large Bundle Sizes

Every Client Component's code is shipped to the browser. Common mistakes:

```tsx
// ❌ Wrong — imports the entire date-fns library
import { format } from 'date-fns'

// ✓ Correct — same thing, same import, but ensure you're not bundling server-only code
// The real gotcha is importing server modules in client components:
// ❌ Wrong — this causes a build error or leaks server code
'use client'
import { createServerClient } from '@/lib/supabase/server'  // ERROR: uses cookies()

// ✓ Correct — use the browser client in Client Components
import { createClient } from '@/lib/supabase/client'
```

Use `@next/bundle-analyzer` to inspect your bundle:

```bash
npm install @next/bundle-analyzer
```

```ts
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer({ /* your config */ })
```

```bash
ANALYZE=true npm run build
```

### ISR Cache Invalidation

ISR caches pages at the CDN edge. When your data updates, the old cached version is still served until the revalidation interval passes — OR until you call `revalidatePath()`.

For Amazon dashboards where n8n syncs data to Supabase, add a revalidation call at the end of the n8n workflow:

```ts
// app/api/webhooks/revalidate/route.ts
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.N8N_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await request.json()
  revalidatePath(path ?? '/')

  return NextResponse.json({ revalidated: true })
}
```

n8n calls this endpoint after completing a sync. Pages are invalidated immediately.

### CORS with Supabase

If you're calling Supabase directly from client-side components (using the browser client), there's no CORS issue — Supabase is configured to allow requests from your domain. The CORS issues arise when:

- You try to call Supabase from a Route Handler with `fetch` using a URL that's not in your Supabase allowed origins list
- You're in local development calling a production Supabase project with `localhost` as origin

Add your Vercel preview domains to Supabase's allowed origins in `Project Settings → API → CORS`.

### Build Time with Many Dynamic Routes

If you have hundreds of ASIN detail pages and try to statically generate them all at build time using `generateStaticParams`, builds will be very slow (or time out on Vercel's 45-minute build limit).

**Solution:** Use `dynamicParams = true` with a small `generateStaticParams` set for the most-visited pages, and let Next.js render the rest on demand and cache them.

```tsx
// app/(dashboard)/asins/[asin]/page.tsx

// Pre-generate only top 50 ASINs at build time
export async function generateStaticParams() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('asins')
    .select('asin')
    .order('units_sold_30d', { ascending: false })
    .limit(50)

  return (data ?? []).map(({ asin }) => ({ asin }))
}

// All other ASINs will render on first request and be cached
export const dynamicParams = true
```

---

## 16. Amazon Brand App Patterns with Code Sketches

### Pattern 1: ASIN Performance Dashboard

The most common syncflow app: a dashboard showing BSR, sales velocity, and inventory for a brand's ASIN catalogue, pulling from Supabase (which is synced by n8n from SP-API).

```
Architecture:
n8n (scheduled) → SP-API → Supabase (asins, daily_metrics tables)
User browser → Next.js page (ISR, revalidate=3600) → Supabase → rendered table
```

```tsx
// app/(dashboard)/performance/page.tsx
export const revalidate = 3600  // Refresh hourly

export default async function PerformancePage() {
  const supabase = await createServerClient()

  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select(`
      asin,
      date,
      units_ordered,
      ordered_revenue,
      sessions,
      unit_session_percentage,
      asins (
        title,
        current_bsr,
        image_url
      )
    `)
    .eq('date', new Date().toISOString().split('T')[0])  // Today
    .order('ordered_revenue', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ASIN Performance — Today</h1>
      <PerformanceTable metrics={metrics ?? []} />
    </div>
  )
}
```

```tsx
// components/performance-table.tsx
'use client'

import { Badge } from '@/components/ui/badge'

type Metric = {
  asin: string
  units_ordered: number
  ordered_revenue: number
  unit_session_percentage: number
  asins: { title: string; current_bsr: number; image_url: string } | null
}

export function PerformanceTable({ metrics }: { metrics: Metric[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2">ASIN</th>
          <th className="text-left py-2">Title</th>
          <th className="text-right py-2">BSR</th>
          <th className="text-right py-2">Units</th>
          <th className="text-right py-2">Revenue</th>
          <th className="text-right py-2">CVR</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map(m => (
          <tr key={m.asin} className="border-b hover:bg-muted/50">
            <td className="py-2 font-mono text-xs">{m.asin}</td>
            <td className="py-2 max-w-[200px] truncate">{m.asins?.title}</td>
            <td className="py-2 text-right">{m.asins?.current_bsr.toLocaleString()}</td>
            <td className="py-2 text-right">{m.units_ordered}</td>
            <td className="py-2 text-right">${m.ordered_revenue.toFixed(2)}</td>
            <td className="py-2 text-right">
              <Badge variant={m.unit_session_percentage > 15 ? 'default' : 'secondary'}>
                {m.unit_session_percentage.toFixed(1)}%
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Pattern 2: PPC Spend Tracker

A client-facing view showing ad spend, ACOS, and ROAS by campaign, refreshed daily by n8n.

```tsx
// app/(dashboard)/ppc/page.tsx
export const revalidate = 86400  // Daily refresh

export default async function PPCPage() {
  const supabase = await createServerClient()

  const { data: campaigns } = await supabase
    .from('ppc_campaigns')
    .select('campaign_name, campaign_type, spend, sales, acos, impressions, clicks, ctr')
    .eq('status', 'enabled')
    .order('spend', { ascending: false })

  const totalSpend = campaigns?.reduce((sum, c) => sum + c.spend, 0) ?? 0
  const totalSales = campaigns?.reduce((sum, c) => sum + c.sales, 0) ?? 0
  const blendedAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Spend" value={`$${totalSpend.toFixed(2)}`} />
        <SummaryCard label="Total Sales" value={`$${totalSales.toFixed(2)}`} />
        <SummaryCard
          label="Blended ACOS"
          value={`${blendedAcos.toFixed(1)}%`}
          variant={blendedAcos < 25 ? 'good' : blendedAcos < 35 ? 'neutral' : 'bad'}
        />
      </div>

      {/* Campaign breakdown */}
      <CampaignTable campaigns={campaigns ?? []} />
    </div>
  )
}
```

### Pattern 3: Real-Time Inventory Alert Board

Inventory levels change continuously. This pattern combines ISR for the initial render with client-side Supabase Realtime for live updates.

```tsx
// app/(dashboard)/inventory/page.tsx — Server Component, initial load
export const revalidate = 1800  // Base data refreshes every 30 min

export default async function InventoryPage() {
  const supabase = await createServerClient()

  const { data: inventory } = await supabase
    .from('inventory_levels')
    .select('asin, sku, quantity_available, days_of_supply, reorder_threshold, asins(title)')
    .order('days_of_supply', { ascending: true })

  return <InventoryAlertBoard initialData={inventory ?? []} />
}
```

```tsx
// components/inventory-alert-board.tsx — Client Component with Realtime
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

type InventoryRow = {
  asin: string
  sku: string
  quantity_available: number
  days_of_supply: number
  reorder_threshold: number
  asins: { title: string } | null
}

export function InventoryAlertBoard({ initialData }: { initialData: InventoryRow[] }) {
  const [inventory, setInventory] = useState(initialData)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory_levels' },
        (payload) => {
          setInventory(prev =>
            prev.map(item =>
              item.asin === payload.new.asin
                ? { ...item, ...payload.new }
                : item
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const alerts = inventory.filter(i => i.days_of_supply < i.reorder_threshold)
  const healthy = inventory.filter(i => i.days_of_supply >= i.reorder_threshold)

  return (
    <div>
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-red-600 font-semibold mb-3">⚠ Reorder Alerts ({alerts.length})</h2>
          {alerts.map(item => (
            <div key={item.asin} className="flex items-center justify-between p-3 bg-red-50 rounded mb-2">
              <div>
                <span className="font-mono text-xs">{item.asin}</span>
                <p className="text-sm">{item.asins?.title}</p>
              </div>
              <Badge variant="destructive">{item.days_of_supply}d remaining</Badge>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Healthy ({healthy.length})</h2>
        {healthy.map(item => (
          <div key={item.asin} className="flex items-center justify-between p-2 border-b">
            <span className="font-mono text-xs">{item.asin}</span>
            <Badge variant="secondary">{item.days_of_supply}d</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 17. Dos & Don'ts

### ✅ Dos

1. **Always use the App Router and Server Components by default.** Add `'use client'` only when you genuinely need hooks or browser APIs. The default is server. Treat client-side rendering as an opt-in exception.

2. **Keep SP-API calls 100% server-side.** Route Handlers, Server Components, Server Actions. Never `fetch` SP-API from a browser context. One slip and credentials are in the wild.

3. **Use TypeScript everywhere, including generated Supabase types.** Run `npm run types` after every migration and commit the generated file. Type errors at compile time are infinitely better than runtime crashes in a client's dashboard.

4. **Scope environment variables correctly.** Audit your `.env.local` — anything without `NEXT_PUBLIC_` is server-only. Anything with it is public. When in doubt, don't add the prefix.

5. **Use ISR for aggregate Amazon data.** BSR snapshots, daily metrics summaries, PPC totals — these are the same for all users viewing a brand account. Cache them with `revalidate`. Reserve SSR for user-specific or session-specific data.

6. **Use `revalidatePath()` from n8n webhook endpoints** after data sync jobs complete. ISR doesn't know when your data refreshed — you need to tell it.

7. **Generate and commit Supabase TypeScript types.** Run `supabase gen types typescript` and check the output into git. This gives you end-to-end type safety from the database column to the React component prop.

8. **Use preview deployments for every PR.** Every branch push gets a unique URL. Share that URL with the client or team member who needs to review the change before it goes live. This is one of Vercel's killer features — use it.

9. **Separate Supabase projects per environment.** Never share a Supabase project between production and preview. Migrations, experiments, and bugs in preview must not touch live data.

10. **Use Server Actions for form submissions that write to Supabase.** No need for a Route Handler + a `fetch` call from the client. `'use server'` in an async function co-located with your form is cleaner, safer, and requires less code.

11. **Cache SP-API access tokens.** The LWA `access_token` is valid for 1 hour. Don't call the token endpoint before every SP-API request. Cache in Supabase or Upstash Redis and refresh only when it's within 60 seconds of expiry.

12. **Use `next/image` for all Amazon product images.** It handles format conversion (WebP), lazy loading, and responsive sizing automatically. Serving raw JPEG product images from Amazon CDN through your domain wastes bandwidth.

### ❌ Don'ts

1. **Don't add `'use client'` to every component "just in case."** This defeats Server Components entirely. If you have a file with `'use client'` that doesn't use hooks, browser APIs, or event handlers, remove the directive.

2. **Don't put the Supabase Service Role Key in a `NEXT_PUBLIC_` variable.** The service role key bypasses RLS entirely. If it leaks to the browser, anyone can read and write any data in your database. This is a catastrophic security failure.

3. **Don't call `supabase.auth.getSession()` for auth decisions.** `getSession()` reads the cookie without verifying with Supabase's server — it can be tampered with. Use `getUser()` for any security-critical check.

4. **Don't build background jobs in Next.js Route Handlers.** Route Handlers are for request/response cycles. Long-running jobs, scheduled operations, retryable workflows — that's n8n. Don't reinvent the infrastructure n8n already provides.

5. **Don't use the Pages Router for new projects.** It's in maintenance mode. App Router is the future of Next.js. Starting a new project in the Pages Router in 2025+ is accumulating technical debt from day one.

6. **Don't import server-only modules in Client Components.** `cookies()`, `headers()`, `createServerClient` from `@supabase/ssr` with Next.js cookies — all of these will cause build errors or silent failures in Client Components. If you get a "cookies can only be used in a Server Component" error, you've done this.

7. **Don't put sensitive seller data in URL query parameters.** `?refresh_token=Atzr|xxx` or `?client_secret=xxx` are visible in server logs, browser history, and referrer headers. Pass credentials through headers or environment variables.

8. **Don't deploy to production without testing in preview.** Use Vercel preview deployments as your staging environment. Every PR should have a preview URL. Merge to main only after testing on preview — which points at your staging Supabase project with sandbox SP-API credentials.

9. **Don't use `dynamic = 'force-dynamic'` on every page.** It disables all caching, making every request a fresh server render. Only use it on pages with user-specific data that genuinely cannot be cached.

10. **Don't import the entire `@aws-sdk` package.** If you need AWS SDK for anything (e.g., signing SP-API requests with SigV4), import only the specific clients you need: `@aws-sdk/client-sts`, `@aws-sdk/signature-v4`. The full SDK is enormous and will kill your cold start times.

11. **Don't use localStorage in Server Components or for session data.** `localStorage` doesn't exist on the server. Session data lives in httpOnly cookies managed by Supabase Auth. Any state that needs to persist across sessions goes in Supabase.

12. **Don't build a custom multi-tenant auth system.** Supabase Auth + RLS + middleware is the complete solution. Don't roll your own JWT verification, session management, or tenant isolation — the surface area for bugs is enormous and the cost of getting it wrong (data leakage between tenants) is catastrophic.

---

## 18. Quick Reference Cheat Sheet

### Commands

```bash
# Create new project
npx create-next-app@latest my-app --typescript --tailwind --app

# Initialize shadcn/ui
npx shadcn@latest init

# Run dev server
npm run dev

# Type-check
npm run build  # Includes type checking

# Generate Supabase types
npx supabase gen types typescript --project-id <ref> > types/supabase.ts

# Deploy preview
vercel deploy

# Deploy production
vercel deploy --prod

# Pull Vercel env vars locally
vercel env pull .env.local

# Analyze bundle
ANALYZE=true npm run build
```

### Key Files Reference

| File | Purpose |
|---|---|
| `middleware.ts` | Session refresh on every request |
| `app/layout.tsx` | Root HTML shell, Analytics, SpeedInsights |
| `app/auth/callback/route.ts` | Handle OAuth + magic link callbacks |
| `lib/supabase/server.ts` | `createServerClient()` factory |
| `lib/supabase/client.ts` | `createBrowserClient()` factory |
| `lib/sp-api/auth.ts` | LWA token refresh with caching |
| `types/supabase.ts` | Generated DB types — never edit manually |
| `.env.local` | Local secrets — never commit |

### Data Fetching Decision

```
Need user-specific data? → SSR (force-dynamic)
Data same for all, changes hourly? → ISR (revalidate=3600)
Data changes in real-time? → Supabase Realtime subscription
User triggers an action? → Server Action or Route Handler
```

### Runtime Decision

```
Middleware → Edge (always)
SP-API calls → Node.js (needs full HTTP stack)
Simple JSON proxy → Edge (fast, cheap)
Any AWS SDK usage → Node.js (required)
```

### Environment Variable Checklist

```
NEXT_PUBLIC_SUPABASE_URL ✓ (public — needed browser-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY ✓ (public — anon key is safe)
SUPABASE_SERVICE_ROLE_KEY ✗ (server only — bypasses RLS)
SP_API_CLIENT_ID ✗ (server only)
SP_API_CLIENT_SECRET ✗ (server only)
SP_API_REFRESH_TOKEN ✗ (server only — per-seller)
N8N_WEBHOOK_SECRET ✗ (server only)
NEXT_PUBLIC_APP_URL ✓ (public — used for OAuth redirect)
```

### Vercel Project Checklist

- [ ] Connected to GitHub repo
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Environment variables set for Production, Preview, Development separately
- [ ] Production Supabase URL/keys in Production env only
- [ ] Staging/sandbox credentials in Preview env
- [ ] Custom domain configured with SSL
- [ ] Analytics and Speed Insights enabled
- [ ] `vercel env pull .env.local` shared with team

---

*Maintained by syncflow. Cross-reference: `supabase.md`, `amazon-sp-api.md`, `n8n-skill-research.md`*
