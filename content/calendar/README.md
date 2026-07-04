# Calendar source data

Drop a new `content/calendar/source/YYYY-MM-events.json` (or any filename —
the loader reads every `.json` file in this folder) to add more months.

Rules enforced by `src/lib/calendar.ts`:
- Top-level `year` (number) applies to every date in that file.
- Region keys must match `CALENDAR_REGIONS` in `calendar.ts`:
  united_states, europe, united_kingdom, africa, middle_east.
- `date` must be `"Month Day"` (e.g. `"July 14"`) — the parser only reads
  the month name + day number, so trailing text after the day is fine.
- A file can span multiple months (e.g. July 7 → August 7); the calendar
  groups by exact ISO date at request time, not by filename.
- `description` is required for the detail bubble to render text — always
  fill it in, one sentence, no verbatim quotes from source articles.

Copy TEMPLATE.json to start a new month.
