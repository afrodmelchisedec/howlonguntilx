# Article Content Standards

Checklist for every new tool-event / evergreen article seed script, to avoid
Google's "scaled content abuse" and AdSense "low value content" flags. These
policies target *reproducible thin templates*, not individual pages — so the
bar is: could someone tell this article apart from a sibling article if you
swapped the subject name?

## Before publishing, confirm:

1. **~250+ words of genuinely unique prose analysis**, excluding chart labels,
   FAQ boilerplate, and widget/embed text. "Genuinely unique" means it could
   not be produced by swapping the event/tool name into a sibling article's
   paragraph unchanged.

2. **Every specific factual or statistical claim has a citation.** Use the
   `paragraph` block's optional `sourceUrl` / `sourceLabel` fields. One
   citation per distinct claim; prefer the primary/official source (e.g. the
   organizing body's own press release) over aggregators.

3. **At least one paragraph is analysis, not restated fact.** A fact ("dates
   are X") is not analysis. Analysis answers "so what does that mean for the
   reader" — e.g. a booking-timing implication, a historical-trend
   observation, a practical consequence.

4. **FAQ items are specific to this subject**, not generic boilerplate reused
   verbatim across every article in the tool. Reusing structure ("Where is X
   held?") is fine; reusing the *answer content* unchanged is not.

5. **Author is a real named person/team with a working link to `/about`.**
   Confirm `authorName` isn't left on the schema default unless intentional.

6. **`dateModified` is genuine.** Don't hand-set `updatedAt` — it's Prisma-
   managed via `@updatedAt` already; just make sure real edits actually run
   through `article.upsert(...update: {...})` with the changed fields
   included, not just `blocks`.

## Before copying an existing seed script as a starting point:

Put the new script's unique paragraphs next to the source script's paragraphs.
If more than ~50% of the sentence structure is interchangeable (same shape,
different noun), rewrite rather than mad-lib.
