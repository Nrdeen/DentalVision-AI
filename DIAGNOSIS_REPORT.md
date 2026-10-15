# Site Startup Slowness Diagnosis Report

## Summary

Vite reports "ready in 3646ms" but the site takes significantly longer to appear in the browser when accessing `http://localhost:8081/`.

## Investigation Results

### 1. package.json
- **Status:** Normal
- **Dev script:** `node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080`
- **Dependencies:** Standard TanStack Start stack, no unusual heavy dependencies

### 2. vite.config.ts
- **Status:** Contains potential blocking operation
- **Key finding:** `pgliteBootstrapPlugin()` in `configureServer` hook
- **Operation:** Calls `server.ssrLoadModule("/src/lib/db.ts")` and awaits `ensureDbReady()`
- **Impact:** This runs BEFORE the server handles traffic, blocking Vite's "ready" state

### 3. scripts/with-app-env.mjs
- **Status:** Normal
- **Purpose:** Wrapper to merge `.grok/app-env.json` into environment
- **No blocking operations found**

### 4. src/lib/db.ts - ensureDbReady()
- **Status:** HEAVY operation
- **When called:** 
  - During Vite dev server startup via `pgliteBootstrapPlugin`
  - On module import in production (lines 232-238)
- **Operations:**
  1. Creates PGLite instance (PostgreSQL compiled to WASM)
  2. Awaits `pg.waitReady`
  3. Creates `_migrations` table
  4. Globs and applies all `migrations/*.sql` files
  5. Runs SQL transactions for each migration
- **Migration found:** `migrations/auth/0001_auth.sql` (2739 bytes)
- **Note:** PGLite is WASM-based and can be slow to initialize

### 5. src/routes/index.tsx
- **Status:** No SSR load functions
- **Component:** Pure client-side component
- **No server-side data fetching**
- **No blocking operations**

### 6. src/routes/__root.tsx
- **Status:** Minimal
- **Components:** AuthProvider (passthrough), AppShell, PreviewHostBridge
- **No SSR loaders**

### 7. SSR Settings
- **TanStack Start:** Used with default SSR
- **Nitro:** Only in build/preview mode, not dev
- **No custom SSR configuration found**

### 8. Root/Layout Files
- **src/routes/__root.tsx:** Simple document shell
- **src/components/layout/app-shell.tsx:** Standard layout component
- **src/lib/auth/provider.tsx:** Passthrough provider (no heavy initialization)

### 9. Heavy Imports at Startup
- **@electric-sql/pglite:** Imported lazily in `src/lib/db.ts` (line 113)
- **No other heavy imports found in root files**

### 10. API Calls During Initial Render
- **None found:** No fetch requests in index.tsx or __root.tsx
- **No Python connections:** X-Ray and Intraoral servers are only called when user uploads images

### 11. Vite Plugins
- **pgliteBootstrapPlugin:** BLOCKS server startup (awaited in configureServer)
- **authPopupPlugin:** Middleware for /auth/popup (non-blocking)
- **tanstackStart:** Router plugin
- **tailwindcss:** CSS processing
- **grokPwaPlugin:** PWA manifest injection
- **viteReact:** React plugin

### 12. Circular Dependencies
- **None detected:** No obvious circular import patterns

## Root Cause Analysis

**PRIMARY SUSPECT:** `pgliteBootstrapPlugin` in `vite.config.ts`

**Evidence:**
1. The plugin calls `server.ssrLoadModule("/src/lib/db.ts")` and awaits `ensureDbReady()`
2. `ensureDbReady()` initializes PGLite (WASM-based PostgreSQL)
3. PGLite initialization includes:
   - WASM compilation/loading
   - Creating in-memory database
   - Running migrations (SQL transactions)
4. This happens in Vite's `configureServer` hook, which is awaited before the server is marked "ready"
5. Vite reports "ready in 3646ms" but this may not include the full PGLite bootstrap time if it happens asynchronously

**SECONDARY SUSPECT:** PGLite WASM initialization

**Evidence:**
1. WASM modules can be slow to load and compile
2. PGLite is a full PostgreSQL implementation compiled to WASM
3. The `await pg.waitReady` (line 121 in db.ts) suggests async initialization
4. Migration application (lines 139-162) runs SQL transactions

## Affected Files

1. **vite.config.ts** (lines 33-52): `pgliteBootstrapPlugin()`
2. **src/lib/db.ts** (lines 108-168): `createPgliteSql()` and migration logic
3. **migrations/auth/0001_auth.sql**: Auth schema migration

## Exact Slow Operation

**Operation:** PGLite database initialization + migration application

**Location:** `src/lib/db.ts` → `createPgliteSql()` → `migrate()` function

**Steps:**
1. Import and instantiate `@electric-sql/pglite` (WASM)
2. Await `pg.waitReady`
3. Create `_migrations` table
4. Glob all `migrations/*.sql` files
5. For each pending migration:
   - Begin transaction
   - Execute SQL
   - Insert migration record
   - Commit transaction

## Classification

**Type:** Server-side blocking operation during dev server startup

**Is it frontend, SSR, Vite, or backend?**
- **Vite dev server plugin** (blocking startup)
- **Not frontend** (no client-side impact)
- **Not SSR** (happens before SSR)
- **Not backend API** (database initialization)

**Is it safe to fix without touching AI inference code?**
- **YES:** This is completely separate from AI inference (X-Ray/Intraoral models)
- **Fix only affects database initialization**
- **No impact on Python servers or model inference**

## Recommended Fix

### Option 1: Skip PGLite bootstrap if no migrations exist (Recommended)

**Location:** `vite.config.ts` line 38

**Change:**
```typescript
// Current:
if (!hasGlobbedMigrations(server.config.root)) return;

// Proposed:
if (!hasGlobbedMigrations(server.config.root)) {
  console.log("[app-builder] No migrations found, skipping PGLite bootstrap");
  return;
}
```

**Rationale:** The current code already checks for migrations and returns early if none exist. The issue is that `migrations/auth/0001_auth.sql` DOES exist, so the bootstrap runs. However, if the app doesn't actually use the database (no auth, no user data), this is wasted work.

### Option 2: Make PGLite bootstrap non-blocking (Advanced)

**Location:** `vite.config.ts` lines 33-52

**Change:**
```typescript
async configureServer(server) {
  if (!hasGlobbedMigrations(server.config.root)) return;
  // Don't await - let it run in background
  server.ssrLoadModule("/src/lib/db.ts").then(async (mod) => {
    if (typeof mod.ensureDbReady === "function") {
      try {
        await mod.ensureDbReady();
        console.log("[app-builder] PGLite bootstrap complete");
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
      }
    }
  }).catch(err => {
    console.error("[app-builder] DB module load failed:", err);
  });
}
```

**Rationale:** Allows Vite to start immediately while DB initializes in background. First request to DB might be slow, but subsequent requests are fast.

**Risk:** If a request needs the DB before bootstrap completes, it will fail. This is acceptable for preview/demo usage but risky for production.

### Option 3: Disable PGLite entirely if not needed (Simplest)

**Location:** `vite.config.ts` lines 33-52

**Change:**
```typescript
async configureServer(server) {
  // Skip PGLite bootstrap entirely for this project
  // The app doesn't use auth or database features
  console.log("[app-builder] Skipping PGLite bootstrap (not used in this project)");
  return;
}
```

**Rationale:** The DentaAI project doesn't appear to use Better Auth or database features (no user login, no data persistence). The auth provider is a passthrough. Skipping DB bootstrap eliminates the delay entirely.

**Risk:** If you later add auth/database features, you'll need to re-enable this.

## Recommendation

**I recommend Option 3** (Disable PGLite bootstrap entirely) for the following reasons:

1. **The app doesn't use auth/database:**
   - AuthProvider is a passthrough (src/lib/auth/provider.tsx)
   - No user login functionality
   - No data persistence
   - No server functions that query the database

2. **Simplest fix:** One line change, no complex logic

3. **Zero risk for current functionality:** Removing unused DB initialization won't affect X-Ray or Intraoral inference

4. **Fastest startup:** Eliminates the entire PGLite WASM initialization delay

**Alternative:** If you plan to add auth/database later, use Option 1 (check for migrations and skip if not needed) or Option 2 (non-blocking bootstrap).

## Verification Needed

To confirm this is the root cause, please:

1. Check the Vite terminal output when starting the dev server
2. Look for logs like "[app-builder] DB bootstrap" or errors
3. Measure the time between "Vite v8.3.1 ready" and the first browser request completing
4. Try temporarily commenting out the `pgliteBootstrapPlugin()` in vite.config.ts and see if startup is faster

## Conclusion

The slowness is almost certainly caused by PGLite (WASM PostgreSQL) initialization during Vite dev server startup. This is a standard TanStack Start pattern for database-enabled apps, but the DentaAI project doesn't actually use database features, so this initialization is unnecessary overhead.

**Root cause:** PGLite WASM database initialization in `pgliteBootstrapPlugin`  
**Evidence:** Vite config awaits `ensureDbReady()` which loads WASM and runs migrations  
**Affected file:** `vite.config.ts` (lines 33-52) and `src/lib/db.ts`  
**Exact slow operation:** PGLite instance creation + migration application  
**Classification:** Vite dev server plugin (blocking startup)  
**Safe to fix:** YES - completely separate from AI inference code
