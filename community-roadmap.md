# Roadmap: User-Generated Countdown Events ("Community")

Status doc for a multi-session build. Update checkboxes as work lands.
Any AI session picking this up: read this whole file first, check current
schema/files against what's marked done, then resume at the first unchecked item.

## Feature summary
Registered users create their own "How long until X?" countdown events
(reusing all existing countdown/progress-bar/embed machinery), publish them
public or private, and the public ones become a browsable, searchable,
sortable community feed with likes and deeply-nested threaded comments.
Admins can moderate (revoke/hide) any post. Image uploads (up to 4 per event)
are PRO-gated.

---

## OPEN DECISIONS — RESOLVED

- [x] **Image storage backend: Netlify Blobs** (native to host, no extra account).
- [x] **Moderation model: auto-publish immediately, moderate reactively.**
      Flag/report mechanism deferred until abuse is real.
- [x] **Slug collisions: kebab-case + random 4-char suffix** (e.g.
      `sarahs-wedding-a8f3`), same pattern as `Timer.slug`.
- [x] **Free-tier event cap: 3 events per FREE user.** Enforced server-side
      via existing `User.eventCount` field at Phase 3.

---

## Phase 1 — Schema ✅ DONE (2026-08-18)
Files: prisma/schema.prisma, migration `20260817230327_user_events`

New models added (additive only):
- `UserEvent` (+ `UserEventVisibility`, `UserEventModerationStatus` enums)
- `UserEventLike`
- `UserEventComment` (self-relation `Replies` for nested threads)
- `UserEventCommentLike`

Back-relations added to existing `User` (userEvents, userEventLikes,
userEventComments, userEventCommentLikes) and `Category` (userEvents,
unnamed relation — no clash with `EventCategory`/`EventSubcategory`).

Datasource block updated to add `directUrl = env("DIRECT_URL")` — this
was required to get `migrate dev` working against Neon's pooled connection
(see session log for the full debug story).

- [x] Schema written
- [x] `npx prisma migrate dev --name user_events` run successfully
- [x] `npx prisma generate` run successfully
- [x] Confirm new tables visible in `npx prisma studio` — all 4 tables present, 0 rows (fresh)

---

## Phase 2 — Slug + title generation helper
Files: new src/lib/userEventSlug.ts

**Confirmed:** no existing slug-generation utility in `src/lib` to mirror —
existing models (`Event`, `Timer`, `Article`, `Reviewer`) all just store
slugs as unique fields without a shared helper. Will write from scratch.

Reuse the same "How long until X?" convention already fixed on the main
Event model's H1 earlier in this project. User types only the bare title
("Sarah's Wedding"); server derives:
- slug: kebab-case + random 4-char suffix on collision
- Display heading always computed as "How long until {title}?" at render
  time (same pattern as CountdownDisplay.tsx — do NOT bake the "How long
  until" prefix into the stored title string, for the same reasons we
  avoided baking it into Event.name earlier in this project).

- [ ] Helper written + unit-testable pure function

---

## Phase 3 — Submission API + form
Files: src/app/api/user-events/route.ts (POST create, GET list-mine),
src/app/api/user-events/[id]/route.ts (PATCH edit, DELETE),
src/app/dashboard/events/new/page.tsx or modal, EventSubmitForm.tsx

Validation server-side (never trust client): title required, description
<=300 chars, targetDate valid & in future, image count <=1 for FREE / <=4
for PRO (check useEntitlement/session plan server-side, not client-side
only), visibility enum, **event count <=3 for FREE users (server-side
check against `User.eventCount`)**.

PRO image-limit UX: attempting a 2nd image on FREE triggers the existing
toast pattern — showToast("You need Pro to add more photos", "star") — reuse
useToast/ToastHost from src/components/ui/Toast.tsx exactly as used
elsewhere (**confirmed signature:** `showToast(message: string, icon?: string)`,
2.6s auto-dismiss, `anim-fade-up` class), don't invent a new toast system.

- [ ] Create/edit API routes
- [ ] Submission form UI (category picker reusing existing Category tree,
      date picker, description with live char counter, image dropzone gated
      by Netlify Blobs)
- [ ] Server-side plan check on image count (never trust client-side gating alone)
- [ ] Server-side FREE-tier cap of 3 events, checked against `User.eventCount`

---

## Phase 4 — Individual UserEvent page
Files: src/app/community/[slug]/page.tsx (confirmed no clash — existing
Event.slug route lives at src/app/[slug]/page.tsx)

Reuses, unmodified where possible:
- CountdownDisplay.tsx (H1 + digits)
- ProgressBar.tsx
- ShareBar.tsx + EmbedCountdownButton.tsx (the embed system built this
  session already works for ANY slug+targetDate — just needs
  /embed/widget to also resolve UserEvent slugs, not only Event slugs.
  **Confirmed current lookup:** `src/app/embed/widget/page.tsx` calls
  `getEventBySlug(slug)` from `src/lib/events.ts`, with a fallback to
  `parseEventQuery(slug)` for untracked free-text dates. Need to extend
  this to also try `prisma.userEvent.findUnique({ where: { slug } })`
  before falling through to the free-text parser.)
- Like button — new UserEventLikeButton.tsx, same interaction pattern as
  existing Like model usage elsewhere

New: image gallery (1-4 photos), author byline + created date, description
block, comment thread (Phase 6).

- [ ] Page route + data fetching (increment viewCount)
- [ ] Reused countdown/progress/embed components wired to UserEvent
- [ ] /embed/widget extended to resolve UserEvent slugs too
- [ ] Like button + optimistic UI

---

## Phase 5 — Image upload
Files: src/app/api/user-events/upload/route.ts, upload UI in submit form

- [x] Storage backend decided: **Netlify Blobs**
- [ ] Upload API route (validates file type/size, enforces plan-based count cap server-side)
- [ ] Frontend dropzone/preview component

---

## Phase 6 — Threaded comments
Files: src/components/community/CommentThread.tsx,
src/components/community/Comment.tsx,
src/app/api/user-events/[id]/comments/route.ts (GET tree, POST new),
src/app/api/comments/[id]/route.ts (PATCH/DELETE — soft delete),
src/app/api/comments/[id]/like/route.ts

Design: fetch all comments for a UserEvent in one query, build the tree
client-side from parentId (simpler and fewer round-trips than N+1 fetching
per depth level). Recursive Comment component renders replies inline.
Thread lines: absolutely-positioned vertical CSS lines per depth level
(border-left on a padded wrapper, offset by depth * indentPx), iOS-style
spring-in animation on new replies (reuse anim-fade-up class already used
elsewhere in the codebase, or a new spring keyframe if that reads too flat
for a comment reveal).

- [ ] Comment API routes (nested fetch + create + soft-delete + like)
- [ ] Recursive comment component with thread lines
- [ ] Reply composer (inline, collapses others when open)
- [ ] Comment like button

---

## Phase 7 — Discovery/listing page
Files: src/app/community/page.tsx, CommunityFeed.tsx,
extend src/app/api/search/route.ts (or new src/app/api/user-events/feed/route.ts)

**Confirmed existing search pattern** (`src/app/api/search/route.ts`):
`rateLimit()` + `checkApiCredits()` guards, `q` param min length 2,
`{ contains: q, mode: 'insensitive' }` filter, parallel `Promise.all`
across models, results capped and combined. Mirror this shape for the
feed endpoint but add sort tabs + category filter + cursor pagination
on top.

Sort tabs: Most anticipated (soonest targetDate first), Most engagement
(likeCount + commentCount desc), Most recent (createdAt desc). Category
pills (reuse CATEGORY_META pattern from PluginShortcodeTable.tsx). Search
bar hits a new query param on the feed endpoint (title + description
contains, same insensitive mode pattern as /api/search). Infinite scroll
via cursor pagination (take + cursor on id, NOT offset pagination — offset
gets slow/inconsistent as the table grows), triggered by an
IntersectionObserver on a sentinel div + "Load more" fallback button for
no-JS/accessibility.

Card design: image (or gradient placeholder if free-tier/no image),
truncated description, author, category pill, live mini-countdown digits,
like count.

- [ ] Feed API (sort + category filter + search + cursor pagination)
- [ ] Card component
- [ ] Sort tabs + category pills + search bar
- [ ] Infinite scroll + load-more fallback
- [ ] Nav link added to NAV_LINKS in src/lib/nav-links.ts
      (**confirmed shape:** `{ label, href, cls, icon, description, ext? }`,
      append after the existing 6 entries — suggest `cls: 'gc-brand'` or a
      new unused `gc-*` variant, check existing CSS before picking)

---

## Phase 8 — Moderation (Admin)
Files: new tab in src/app/admin/AdminClient.tsx + src/app/admin/page.tsx
data fetch, src/app/api/admin/user-events/[id]/route.ts (PATCH moderationStatus)

**Confirmed existing admin page pattern** (`src/app/admin/page.tsx`):
session/role check via `getServerSession` + redirect if not `ADMIN`,
parallel `Promise.all` of `prisma.*.findMany` calls, computed `stats`
object passed alongside raw data into `<AdminClient users={...} events={...}
stats={...} />`. Will add a `userEvents` fetch to that same `Promise.all`
and extend `stats` with community counts, then add a new tab inside
`AdminClient.tsx` following its existing tab structure.

Admin table: list all UserEvents (search/filter by status/visibility),
one-click "Remove" (sets moderationStatus = REMOVED, keeps DB row for
audit instead of hard delete), reason note field. Removed posts return
404/hidden everywhere public-facing but stay in DB.

User-side "my events" dashboard (src/app/dashboard/events/page.tsx):
list own events, edit/delete, see own moderation status if flagged.

- [ ] Admin moderation tab (list + remove + reason)
- [ ] User's own "My Events" management dashboard
- [ ] Removed/private posts properly 404 for non-owners everywhere (page,
      embed, search, feed — audit all four)

---

## Phase 9 — Polish pass
- [ ] iOS-style transitions on card entry (stagger fade-up, already have
      anim-fade-up precedent to match rest of site)
- [ ] Empty states (no events yet, no comments yet, search no results)
- [ ] Mobile responsiveness pass on comment thread indentation (deep
      threads need a max-indent clamp on narrow screens or they overflow)

---

## Session log
(append a line each session so future sessions know what actually landed vs what's still just planned)

- 2026-08-18: Roadmap created. No implementation started yet.
- 2026-08-18: **Phase 1 complete.** Open decisions resolved (Netlify Blobs,
  auto-publish/reactive moderation, slug suffix, 3-event FREE cap). Schema
  models added and migrated (`20260817230327_user_events`). Notable debugging
  detour: (1) heredoc paste got truncated in Git Bash mid-append, requiring
  a truncate-and-retry in smaller chunks; (2) single-line enum syntax
  (`enum X { A B }`) isn't valid Prisma syntax, values must be one per line;
  (3) `migrate dev` timed out acquiring the Neon advisory lock over the
  pooled connection — fixed by adding `directUrl = env("DIRECT_URL")` to
  the datasource block; (4) still timed out intermittently even on the
  direct connection despite `db pull` and `pg_locks` showing nothing wrong
  server-side — resolved by adding `connect_timeout=30` to `DIRECT_URL` and
  retrying immediately after a warm `db pull`. Also flagged: a Neon DB
  password was pasted in plaintext in chat earlier in the session and
  should be rotated when convenient — not yet confirmed done.
  Next: Phase 2 (slug helper — confirmed no existing utility to mirror,
  writing from scratch).
