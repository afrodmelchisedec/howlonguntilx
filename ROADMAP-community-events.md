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

## OPEN DECISIONS - must be resolved before Phase 1 starts

- [ ] Image storage backend. You're on Netlify, whose functions have an
      ephemeral/read-only filesystem in production - fs.writeFileSync (your
      current pattern, used for plugin releases/calendar admin) will NOT
      persist uploaded images in prod, even though it'll appear to work in
      local dev. Options: (a) Cloudinary/S3/R2 (small setup cost, works
      properly), (b) Netlify Blobs (native to your host, no extra account),
      (c) ship free-tier with NO uploads and let PRO users paste an image URL
      instead of uploading (zero infra work, weakest UX). Recommend (b) or
      (a). Pick one before Phase 5.
- [ ] Moderation model. Auto-publish public posts immediately (moderate
      after the fact / reactive takedown), or hold in a PENDING queue until
      an admin approves? Recommend auto-publish + reactive moderation to
      keep the submission flow frictionless - flag/report mechanism can come
      later if abuse becomes real.
- [ ] Slug collisions. Two users both create "Sarah's Wedding" - suffix
      with a short random id (sarahs-wedding-a8f3) same way Timer.slug
      likely needs uniqueness. Confirm this is fine.
- [ ] Free vs PRO limits beyond images - is there a cap on how many
      events a free user can create (mirrors User.eventCount field that
      already exists on the schema, currently unused for this purpose)?
      Needs a number.

---

## Phase 1 - Schema
Files: prisma/schema.prisma, new migration

New models (additive only, no changes to existing models except back-relations):

model UserEvent {
  id            String     @id @default(cuid())
  slug          String     @unique
  title         String
  description   String
  targetDate    DateTime
  images        Json?
  visibility    UserEventVisibility @default(PUBLIC)
  moderationStatus UserEventModerationStatus @default(APPROVED)
  moderatedById String?
  moderatedAt   DateTime?
  moderationNote String?

  authorId      String
  author        User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  categoryId    String?
  category      Category?  @relation(fields: [categoryId], references: [id])

  likeCount     Int        @default(0)
  commentCount  Int        @default(0)
  viewCount     Int        @default(0)

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  likes    UserEventLike[]
  comments UserEventComment[]

  @@index([visibility, moderationStatus, createdAt])
  @@index([visibility, moderationStatus, likeCount])
  @@index([categoryId])
  @@index([authorId])
}

enum UserEventVisibility { PUBLIC PRIVATE }
enum UserEventModerationStatus { APPROVED REJECTED REMOVED }

model UserEventLike {
  id          String    @id @default(cuid())
  userId      String
  userEventId String
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userEvent   UserEvent @relation(fields: [userEventId], references: [id], onDelete: Cascade)
  @@unique([userId, userEventId])
}

model UserEventComment {
  id          String    @id @default(cuid())
  userEventId String
  userEvent   UserEvent @relation(fields: [userEventId], references: [id], onDelete: Cascade)
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parentId    String?
  parent      UserEventComment? @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     UserEventComment[] @relation("Replies")
  body        String
  likeCount   Int       @default(0)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  likes UserEventCommentLike[]

  @@index([userEventId, parentId])
}

model UserEventCommentLike {
  id        String  @id @default(cuid())
  userId    String
  commentId String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment   UserEventComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  @@unique([userId, commentId])
}

Back-relations to add inside existing model User:
  userEvents            UserEvent[]
  userEventLikes        UserEventLike[]
  userEventComments     UserEventComment[]
  userEventCommentLikes UserEventCommentLike[]

Back-relation inside existing model Category:
  userEvents UserEvent[]

- [ ] Schema written
- [ ] npx prisma migrate dev --name user_events run successfully
- [ ] npx prisma generate run

---

## Phase 2 - Slug + title generation helper
Files: new src/lib/userEventSlug.ts

Reuse the same "How long until X?" convention already fixed on the main
Event model's H1 earlier in this project. User types only the bare title
("Sarah's Wedding"); server derives:
- slug: kebab-case + random 4-char suffix on collision
- Display heading always computed as "How long until {title}?" at render
  time (same pattern as CountdownDisplay.tsx - do NOT bake the "How long
  until" prefix into the stored title string, for the same reasons we
  avoided baking it into Event.name earlier in this project).

- [ ] Helper written + unit-testable pure function

---

## Phase 3 - Submission API + form
Files: src/app/api/user-events/route.ts (POST create, GET list-mine),
src/app/api/user-events/[id]/route.ts (PATCH edit, DELETE),
src/app/dashboard/events/new/page.tsx or modal, EventSubmitForm.tsx

Validation server-side (never trust client): title required, description
<=300 chars, targetDate valid & in future, image count <=1 for FREE / <=4
for PRO (check useEntitlement/session plan server-side, not client-side
only), visibility enum.

PRO image-limit UX: attempting a 2nd image on FREE triggers the existing
toast pattern - showToast("You need Pro to add more photos", "star") - reuse
useToast/ToastHost from src/components/ui/Toast.tsx exactly as used
elsewhere, don't invent a new toast system.

- [ ] Create/edit API routes
- [ ] Submission form UI (category picker reusing existing Category tree,
      date picker, description with live char counter, image dropzone gated
      by Phase "Open decision: image storage")
- [ ] Server-side plan check on image count (never trust client-side gating alone)

---

## Phase 4 - Individual UserEvent page
Files: src/app/community/[slug]/page.tsx (needs a decision to avoid clashing
with existing Event.slug route at src/app/[slug]/page.tsx)

Reuses, unmodified where possible:
- CountdownDisplay.tsx (H1 + digits)
- ProgressBar.tsx
- ShareBar.tsx + EmbedCountdownButton.tsx (the embed system built this
  session already works for ANY slug+targetDate - just needs
  /embed/widget to also resolve UserEvent slugs, not only Event slugs -
  one small change in src/app/embed/widget/page.tsx's lookup)
- Like button - new UserEventLikeButton.tsx, same interaction pattern as
  existing Like model usage elsewhere

New: image gallery (1-4 photos), author byline + created date, description
block, comment thread (Phase 6).

- [ ] Page route + data fetching (increment viewCount)
- [ ] Reused countdown/progress/embed components wired to UserEvent
- [ ] /embed/widget extended to resolve UserEvent slugs too
- [ ] Like button + optimistic UI

---

## Phase 5 - Image upload (blocked on Open Decision above)
Files: src/app/api/user-events/upload/route.ts, upload UI in submit form

- [ ] Storage backend decided & configured
- [ ] Upload API route (validates file type/size, enforces plan-based count cap server-side)
- [ ] Frontend dropzone/preview component

---

## Phase 6 - Threaded comments
Files: src/components/community/CommentThread.tsx,
src/components/community/Comment.tsx,
src/app/api/user-events/[id]/comments/route.ts (GET tree, POST new),
src/app/api/comments/[id]/route.ts (PATCH/DELETE - soft delete),
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

## Phase 7 - Discovery/listing page
Files: src/app/community/page.tsx, CommunityFeed.tsx,
extend src/app/api/search/route.ts (or new src/app/api/user-events/feed/route.ts)

Sort tabs: Most anticipated (soonest targetDate first), Most engagement
(likeCount + commentCount desc), Most recent (createdAt desc). Category
pills (reuse CATEGORY_META pattern from PluginShortcodeTable.tsx). Search
bar hits a new query param on the feed endpoint (title + description
contains, same insensitive mode pattern as /api/search). Infinite scroll
via cursor pagination (take + cursor on id, NOT offset pagination - offset
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

---

## Phase 8 - Moderation (Admin)
Files: new tab in src/app/admin/AdminClient.tsx + src/app/admin/page.tsx
data fetch, src/app/api/admin/user-events/[id]/route.ts (PATCH moderationStatus)

Admin table: list all UserEvents (search/filter by status/visibility),
one-click "Remove" (sets moderationStatus = REMOVED, keeps DB row for
audit instead of hard delete), reason note field. Removed posts return
404/hidden everywhere public-facing but stay in DB.

User-side "my events" dashboard (src/app/dashboard/events/page.tsx):
list own events, edit/delete, see own moderation status if flagged.

- [ ] Admin moderation tab (list + remove + reason)
- [ ] User's own "My Events" management dashboard
- [ ] Removed/private posts properly 404 for non-owners everywhere (page,
      embed, search, feed - audit all four)

---

## Phase 9 - Polish pass
- [ ] iOS-style transitions on card entry (stagger fade-up, already have
      anim-fade-up precedent to match rest of site)
- [ ] Empty states (no events yet, no comments yet, search no results)
- [ ] Mobile responsiveness pass on comment thread indentation (deep
      threads need a max-indent clamp on narrow screens or they overflow)

---

## Session log
(append a line each session so future sessions know what actually landed vs what's still just planned)

- 2026-08-18: Roadmap created. No implementation started yet.
