# HowLongUntil

Lightning-fast countdown platform.

## Quick start

```bash
cp .env.example .env      # fill in DATABASE_URL + auth vars
make setup                # install, push schema, seed events
make dev                  # http://localhost:3000
```

## Key URLs

| Path | Description |
|------|-------------|
| `/` | Home + search |
| `/how-long-until-[slug]` | Event countdown page |
| `/embed` | Embed generator |
| `/embed/widget?event=christmas` | Embeddable iframe |
| `/dashboard` | User saved timers |
| `/api/countdown?event=christmas` | REST API |
| `/api/sitemap` | XML sitemap |

## Deploy to Vercel

```bash
npx vercel --prod
```

Set env vars in Vercel dashboard then run:

```bash
npx vercel env pull .env.local
npm run db:push && npm run db:seed
```
