# Remove NextAuth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove NextAuth and make the app fully public so anyone can view and edit all chats and documents.

**Architecture:** Delete auth routes/pages and NextAuth wiring, remove all session checks, and un-scope data access from user IDs. Keep API behavior intact but treat data as public/shared.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle, Vercel SDKs

---

### Task 1: Remove auth routes and NextAuth provider

**Files:**
- Delete: `app/(auth)/auth.ts`
- Delete: `app/(auth)/auth.config.ts`
- Delete: `app/(auth)/actions.ts`
- Delete: `app/(auth)/api/auth/[...nextauth]/route.ts`
- Delete: `app/(auth)/api/auth/guest/route.ts`
- Delete: `app/(auth)/login/`
- Delete: `app/(auth)/register/`
- Modify: `app/layout.tsx`

**Step 1: Write the failing test**
- Skipped: no existing auth tests. Note this gap.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- Remove the files/directories listed above.
- In `app/layout.tsx`, remove `SessionProvider` import and wrapper.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Expected: PASS with no NextAuth imports remaining.

**Step 5: Commit**
```bash
git add app/layout.tsx app/(auth)
git commit -m "feat: remove auth routes and provider"
```

### Task 2: Remove auth from chat layout and chat page

**Files:**
- Modify: `app/(chat)/layout.tsx`
- Modify: `app/(chat)/chat/[id]/page.tsx`

**Step 1: Write the failing test**
- Skipped: no page-level tests. Note this gap.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- Remove `auth()` imports/calls and guest redirects.
- Stop using `session.user` for read-only logic; allow edits for everyone.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Expected: PASS.

**Step 5: Commit**
```bash
git add app/(chat)/layout.tsx app/(chat)/chat/[id]/page.tsx
git commit -m "feat: make chat pages public"
```

### Task 3: Remove auth from chat API routes

**Files:**
- Modify: `app/(chat)/api/chat/route.ts`
- Modify: `app/(chat)/api/history/route.ts`
- Modify: `app/(chat)/api/document/route.ts`
- Modify: `app/(chat)/api/vote/route.ts`
- Modify: `app/(chat)/api/suggestions/route.ts`
- Modify: `app/(chat)/api/files/upload/route.ts`

**Step 1: Write the failing test**
- Skipped: no API tests. Note this gap.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- Remove `auth()` imports and unauthorized branches.
- Remove ownership checks (e.g., `chat.userId !== session.user.id`).
- Remove userId filters in queries so all data is shared.
- If any create/update requires a userId, use a stable placeholder like `"public"`.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Expected: PASS.

**Step 5: Commit**
```bash
git add app/(chat)/api
git commit -m "feat: make chat APIs public"
```

### Task 4: Remove auth UI and user nav dependencies

**Files:**
- Modify or Delete: `components/sidebar-user-nav.tsx`
- Delete: `components/sign-out-form.tsx`
- Modify: `components/app-sidebar.tsx`
- Modify: `components/sidebar-history.tsx`

**Step 1: Write the failing test**
- Skipped: no component tests. Note this gap.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- Remove all `next-auth` imports (`useSession`, `signOut`, `User`).
- Update props to no longer require user/session data.
- Remove logout buttons and auth links from UI.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Expected: PASS.

**Step 5: Commit**
```bash
git add components
git commit -m "feat: remove auth UI and session hooks"
```

### Task 5: Remove NextAuth types from server helpers

**Files:**
- Modify: `lib/artifacts/server.ts`
- Modify: `lib/ai/tools/create-document.ts`
- Modify: `lib/ai/tools/update-document.ts`
- Modify: `lib/ai/tools/request-suggestions.ts`
- Modify: `lib/ai/entitlements.ts` (if still tied to auth types)

**Step 1: Write the failing test**
- Skipped: no unit tests for these helpers. Note this gap.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- Replace `Session` types with a local lightweight type or `null`.
- Ensure any `session.user.id` usage is optional or removed.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Expected: PASS.

**Step 5: Commit**
```bash
git add lib
git commit -m "feat: remove next-auth types from helpers"
```

### Task 6: Remove NextAuth dependency and env references

**Files:**
- Modify: `package.json`
- Modify: `.env*` (if present and containing NEXTAUTH_* vars)

**Step 1: Write the failing test**
- Skipped: no dependency tests. Note this gap.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- Remove `next-auth` from dependencies.
- Remove unused auth-related env vars.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Expected: PASS.

**Step 5: Commit**
```bash
git add package.json .env*
git commit -m "chore: remove next-auth dependency"
```

### Task 7: Final verification

**Files:**
- N/A

**Step 1: Write the failing test**
- Skipped.

**Step 2: Run test to verify it fails**
- Skipped.

**Step 3: Write minimal implementation**
- None.

**Step 4: Run test to verify it passes**
- Run: `pnpm lint`
- Optional: `pnpm build` (requires DB connectivity)
- Expected: PASS or report any failures.

**Step 5: Commit**
- Skipped: verification only.
