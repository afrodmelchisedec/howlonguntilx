#!/usr/bin/env bash
# ============================================================
# HowLongUntil — full project scaffold
# Run: bash scaffold.sh
# Creates the entire Next.js monorepo structure with all files
# ============================================================
set -e

ROOT="howlonguntilx"
echo "🚀 Scaffolding HowLongUntil platform..."

# ── helpers ──────────────────────────────────────────────────
mk() { mkdir -p "$1"; }
wf() { mkdir -p "$(dirname "$1")"; cat > "$1"; }   # write file from stdin

mk "$ROOT"
cd "$ROOT"

# ============================================================
# 1. ROOT CONFIG FILES
# ============================================================
wf "package.json" << 'EOF'
{
  "name": "howlonguntilx",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "@prisma/client": "^5.13.0",
    "prisma": "^5.13.0",
    "next-auth": "^4.24.7",
    "@auth/prisma-adapter": "^2.2.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "chrono-node": "^2.7.6",
    "clsx": "^2.1.1",
    "lucide-react": "^0.376.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "ts-node": "^10.9.2"
  }
}
EOF

wf "tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

wf "next.config.mjs" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['lh3.googleusercontent.com'] },
  async headers() {
    return [
      {
        source: '/embed',
        headers: [{ key: 'X-Frame-Options', value: 'ALLOWALL' }],
      },
    ];
  },
};

export default nextConfig;
EOF

wf "tailwind.config.ts" << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEEDFE',
          100: '#CECBF6',
          500: '#534AB7',
          600: '#3C3489',
          900: '#26215C',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
EOF

wf "postcss.config.mjs" << 'EOF'
const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };
export default config;
EOF

wf ".env.example" << 'EOF'
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/howlonguntilx"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# API
INTERNAL_API_SECRET="random-secret"

# Rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
EOF

wf ".gitignore" << 'EOF'
node_modules/
.next/
.env
.env.local
prisma/dev.db
EOF

# ============================================================
# 2. PRISMA SCHEMA
# ============================================================
wf "prisma/schema.prisma" << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String      @id @default(cuid())
  name          String?
  email         String?     @unique
  emailVerified DateTime?
  image         String?
  plan          Plan        @default(FREE)
  apiKey        String?     @unique @default(cuid())
  createdAt     DateTime    @default(now())

  accounts   Account[]
  sessions   Session[]
  timers     Timer[]
  apiUsage   ApiUsage[]
}

enum Plan {
  FREE
  PRO
}

model Timer {
  id          String   @id @default(cuid())
  userId      String
  name        String
  targetDate  DateTime
  category    String   @default("personal")
  isPublic    Boolean  @default(false)
  slug        String?  @unique
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Event {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  targetDate  DateTime
  category    String
  locale      String   @default("en")
  views       Int      @default(0)
  createdAt   DateTime @default(now())
}

model ApiUsage {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
EOF

wf "prisma/seed.ts" << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_EVENTS = [
  { slug: 'christmas', name: 'Christmas', category: 'holidays', targetDate: new Date('2025-12-25') },
  { slug: 'new-year', name: 'New Year', category: 'holidays', targetDate: new Date('2026-01-01') },
  { slug: 'halloween', name: 'Halloween', category: 'holidays', targetDate: new Date('2025-10-31') },
  { slug: 'easter', name: 'Easter', category: 'holidays', targetDate: new Date('2026-04-05') },
  { slug: 'valentines-day', name: "Valentine's Day", category: 'holidays', targetDate: new Date('2026-02-14') },
  { slug: 'summer-solstice', name: 'Summer Solstice', category: 'nature', targetDate: new Date('2025-06-21') },
];

async function main() {
  for (const ev of SEED_EVENTS) {
    await prisma.event.upsert({
      where: { slug: ev.slug },
      update: {},
      create: ev,
    });
  }
  console.log('✅ Seeded events');
}

main().finally(() => prisma.$disconnect());
EOF

# ============================================================
# 3. SOURCE TREE
# ============================================================
mk "src/app"
mk "src/components/ui"
mk "src/components/countdown"
mk "src/components/embed"
mk "src/lib"
mk "src/hooks"
mk "src/types"

# ── Global layout ────────────────────────────────────────────
wf "src/app/globals.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
}

/* smooth number transitions */
.tabular { font-variant-numeric: tabular-nums; }
EOF

wf "src/app/layout.tsx" << 'EOF'
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Nav } from '@/components/ui/Nav';

export const metadata: Metadata = {
  title: { template: '%s | HowLongUntil', default: 'HowLongUntil — Live countdown to any event' },
  description: 'Instant countdowns to any event — Christmas, New Year, your birthday, and more.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        <Providers>
          <Nav />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
EOF

# ── Home page ────────────────────────────────────────────────
wf "src/app/page.tsx" << 'EOF'
import { SearchBar } from '@/components/countdown/SearchBar';
import { PopularGrid } from '@/components/countdown/PopularGrid';
import { getPopularEvents } from '@/lib/events';

export default async function HomePage() {
  const events = await getPopularEvents();
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-medium mb-2">How long until…?</h1>
      <p className="text-gray-500 mb-10">Instant countdown to any event</p>
      <SearchBar />
      <PopularGrid events={events} />
    </div>
  );
}
EOF

# ── Dynamic event page ────────────────────────────────────────
wf "src/app/how-long-until-[slug]/page.tsx" << 'EOF'
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getEventBySlug, incrementViews } from '@/lib/events';
import { CountdownDisplay } from '@/components/countdown/CountdownDisplay';
import { EventSchema } from '@/components/countdown/EventSchema';
import { RelatedEvents } from '@/components/countdown/RelatedEvents';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return {};
  return {
    title: `How Long Until ${event.name}`,
    description: `Live countdown to ${event.name}. See exactly how many days, hours, and minutes remain.`,
  };
}

export default async function EventPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  await incrementViews(params.slug);
  return (
    <>
      <EventSchema event={event} />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <CountdownDisplay event={event} />
        <RelatedEvents category={event.category} currentSlug={params.slug} />
      </div>
    </>
  );
}
EOF

# ── Embed page ────────────────────────────────────────────────
wf "src/app/embed/page.tsx" << 'EOF'
import { EmbedGenerator } from '@/components/embed/EmbedGenerator';

export const metadata = { title: 'Embed a Countdown Widget' };

export default function EmbedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-medium mb-6">Embed a countdown</h1>
      <EmbedGenerator />
    </div>
  );
}
EOF

# ── Embed widget (iframe target) ─────────────────────────────
wf "src/app/embed/widget/page.tsx" << 'EOF'
import { getEventBySlug } from '@/lib/events';
import { EmbedWidget } from '@/components/embed/EmbedWidget';

interface Props { searchParams: { event?: string } }

export default async function EmbedWidgetPage({ searchParams }: Props) {
  const slug = searchParams.event ?? 'christmas';
  const event = await getEventBySlug(slug);
  return <EmbedWidget event={event} />;
}
EOF

# ── Dashboard ─────────────────────────────────────────────────
wf "src/app/dashboard/page.tsx" << 'EOF'
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserTimers } from '@/lib/timers';
import { TimerList } from '@/components/countdown/TimerList';
import { AddTimerButton } from '@/components/countdown/AddTimerButton';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/api/auth/signin');
  const timers = await getUserTimers(session.user.id);
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium">My countdowns</h1>
        <AddTimerButton />
      </div>
      <TimerList timers={timers} />
    </div>
  );
}
EOF

# ── API routes ────────────────────────────────────────────────
wf "src/app/api/countdown/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/events';
import { parseEventQuery } from '@/lib/parseEvent';
import { buildCountdownResponse } from '@/lib/countdown';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eventParam = searchParams.get('event') ?? '';

  const limited = await rateLimit(req);
  if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  let target: Date | null = null;
  let name = eventParam;

  const dbEvent = await getEventBySlug(eventParam.toLowerCase().replace(/\s+/g, '-'));
  if (dbEvent) {
    target = new Date(dbEvent.targetDate);
    name = dbEvent.name;
  } else {
    target = parseEventQuery(eventParam);
  }

  if (!target) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  return NextResponse.json(buildCountdownResponse(name, target));
}
EOF

wf "src/app/api/auth/[...nextauth]/route.ts" << 'EOF'
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
EOF

wf "src/app/api/timers/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTimer, getUserTimers } from '@/lib/timers';
import { timerSchema } from '@/lib/validators';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const timers = await getUserTimers(session.user.id);
  return NextResponse.json(timers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = timerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const timer = await createTimer(session.user.id, parsed.data);
  return NextResponse.json(timer, { status: 201 });
}
EOF

wf "src/app/api/sitemap/route.ts" << 'EOF'
import { NextResponse } from 'next/server';
import { getAllEventSlugs } from '@/lib/events';

export async function GET() {
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  const slugs = await getAllEventSlugs();
  const urls = [
    `<url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...slugs.map(s =>
      `<url><loc>${base}/how-long-until-${s}</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
EOF

# ============================================================
# 4. LIB / BUSINESS LOGIC
# ============================================================
wf "src/lib/db.ts" << 'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF

wf "src/lib/auth.ts" << 'EOF'
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
  pages: { signIn: '/auth/signin' },
};
EOF

wf "src/lib/events.ts" << 'EOF'
import { prisma } from './db';

export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({ where: { slug } });
}

export async function getPopularEvents(limit = 8) {
  return prisma.event.findMany({
    orderBy: { views: 'desc' },
    take: limit,
  });
}

export async function getAllEventSlugs() {
  const events = await prisma.event.findMany({ select: { slug: true } });
  return events.map(e => e.slug);
}

export async function incrementViews(slug: string) {
  await prisma.event.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });
}

export async function getRelatedEvents(category: string, excludeSlug: string, limit = 4) {
  return prisma.event.findMany({
    where: { category, NOT: { slug: excludeSlug } },
    orderBy: { views: 'desc' },
    take: limit,
  });
}
EOF

wf "src/lib/countdown.ts" << 'EOF'
export interface CountdownData {
  event: string;
  target_date: string;
  days_left: number;
  hours_left: number;
  minutes_left: number;
  seconds_left: number;
  progress_percent: number;
  is_past: boolean;
}

export function buildCountdownResponse(name: string, target: Date): CountdownData {
  const now = Date.now();
  const diff = target.getTime() - now;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / 86_400_000);
  const hours = Math.floor((absDiff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((absDiff % 3_600_000) / 60_000);
  const seconds = Math.floor((absDiff % 60_000) / 1_000);

  // Approximate % of year elapsed toward target
  const yearMs = 365 * 86_400_000;
  const progress = isPast ? 100 : Math.max(0, Math.min(100, Math.round(((yearMs - absDiff) / yearMs) * 100)));

  return {
    event: name,
    target_date: target.toISOString(),
    days_left: isPast ? 0 : days,
    hours_left: isPast ? 0 : hours,
    minutes_left: isPast ? 0 : minutes,
    seconds_left: isPast ? 0 : seconds,
    progress_percent: progress,
    is_past: isPast,
  };
}
EOF

wf "src/lib/parseEvent.ts" << 'EOF'
import * as chrono from 'chrono-node';

const KNOWN: Record<string, () => Date> = {
  christmas: () => nextOccurrence(12, 25),
  'new year': () => new Date(`${new Date().getFullYear() + 1}-01-01`),
  halloween: () => nextOccurrence(10, 31),
  easter: () => getEaster(new Date().getFullYear()),
};

function nextOccurrence(month: number, day: number): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  if (d <= now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

function getEaster(year: number): Date {
  const f = Math.floor;
  const a = year % 19, b = f(year / 100), c = year % 100;
  const d = f(b / 4), e = b % 4, g = f((b + 8) / 25);
  const h = f((b - g + 1) / 3), i = (19 * a + b - d - h + 15) % 30;
  const k = f(c / 4), l = c % 4;
  const m = (32 + 2 * e + 2 * k - i - l) % 7;
  const n = f((a + 11 * i + 22 * m) / 451);
  const month = f((i + m - 7 * n + 114) / 31);
  const day = ((i + m - 7 * n + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function parseEventQuery(query: string): Date | null {
  const key = query.toLowerCase().trim();
  if (KNOWN[key]) return KNOWN[key]();
  const parsed = chrono.parseDate(query);
  return parsed ?? null;
}
EOF

wf "src/lib/timers.ts" << 'EOF'
import { prisma } from './db';
import type { TimerInput } from './validators';

export async function getUserTimers(userId: string) {
  return prisma.timer.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' },
  });
}

export async function createTimer(userId: string, data: TimerInput) {
  return prisma.timer.create({
    data: { ...data, userId, targetDate: new Date(data.targetDate) },
  });
}

export async function deleteTimer(userId: string, timerId: string) {
  return prisma.timer.deleteMany({ where: { id: timerId, userId } });
}
EOF

wf "src/lib/validators.ts" << 'EOF'
import { z } from 'zod';

export const timerSchema = z.object({
  name: z.string().min(1).max(100),
  targetDate: z.string().datetime(),
  category: z.string().default('personal'),
});

export type TimerInput = z.infer<typeof timerSchema>;
EOF

wf "src/lib/rateLimit.ts" << 'EOF'
import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (swap for Upstash Redis in production)
const store = new Map<string, { count: number; reset: number }>();
const LIMIT = 60;
const WINDOW_MS = 60_000;

export async function rateLimit(req: NextRequest): Promise<boolean> {
  const ip = req.headers.get('x-forwarded-for') ?? 'anon';
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > LIMIT) return true;
  return false;
}
EOF

# ============================================================
# 5. COMPONENTS
# ============================================================

# ── UI primitives ─────────────────────────────────────────────
wf "src/components/ui/Providers.tsx" << 'EOF'
'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
EOF

wf "src/components/ui/ThemeProvider.tsx" << 'EOF'
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    apply(saved ?? preferred);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => apply(theme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
EOF

wf "src/components/ui/Nav.tsx" << 'EOF'
'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';

export function Nav() {
  const { data: session } = useSession();
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-medium text-lg">
        How<span className="text-brand-500">Long</span>Until
      </Link>
      <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/embed" className="hover:text-gray-900 dark:hover:text-white">Embed</Link>
        <a href="/api/countdown?event=christmas" target="_blank" className="hover:text-gray-900 dark:hover:text-white">API</a>
        {session ? (
          <>
            <Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
            <button onClick={() => signOut()} className="hover:text-gray-900 dark:hover:text-white">Sign out</button>
          </>
        ) : (
          <Link href="/api/auth/signin" className="hover:text-gray-900 dark:hover:text-white">Sign in</Link>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
EOF

wf "src/components/ui/ThemeToggle.tsx" << 'EOF'
'use client';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle theme">
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
EOF

# ── Countdown components ──────────────────────────────────────
wf "src/components/countdown/SearchBar.tsx" << 'EOF'
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const [value, setValue] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    const slug = value.trim().toLowerCase().replace(/\s+/g, '-');
    router.push(`/how-long-until-${slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
      <input
        className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500"
        placeholder="Christmas, 8pm, New Year…"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="bg-brand-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-brand-600 transition-colors"
      >
        Go
      </button>
    </form>
  );
}
EOF

wf "src/components/countdown/CountdownDisplay.tsx" << 'EOF'
'use client';
import { useCountdown } from '@/hooks/useCountdown';
import { ProgressBar } from './ProgressBar';

interface Props {
  event: { name: string; targetDate: Date | string };
}

export function CountdownDisplay({ event }: Props) {
  const target = new Date(event.targetDate);
  const { days, hours, minutes, seconds, progress } = useCountdown(target);

  return (
    <div>
      <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Time remaining until</p>
      <h1 className="text-3xl font-medium mb-8">{event.name}</h1>

      <div className="flex justify-center gap-0 mb-6">
        {[
          { val: String(days).padStart(3, '0'), label: 'days' },
          { val: String(hours).padStart(2, '0'), label: 'hours' },
          { val: String(minutes).padStart(2, '0'), label: 'min' },
          { val: String(seconds).padStart(2, '0'), label: 'sec' },
        ].map((unit, i, arr) => (
          <div key={unit.label} className={`text-center px-5 ${i < arr.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="text-5xl font-medium tabular leading-none">{unit.val}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">{unit.label}</div>
          </div>
        ))}
      </div>

      <ProgressBar progress={progress} />
    </div>
  );
}
EOF

wf "src/components/countdown/ProgressBar.tsx" << 'EOF'
interface Props { progress: number }

export function ProgressBar({ progress }: Props) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{progress}% elapsed</span>
        <span>{100 - progress}% remaining</span>
      </div>
      <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
EOF

wf "src/components/countdown/PopularGrid.tsx" << 'EOF'
import Link from 'next/link';
import { buildCountdownResponse } from '@/lib/countdown';

interface Event { slug: string; name: string; targetDate: Date | string }
interface Props { events: Event[] }

export function PopularGrid({ events }: Props) {
  return (
    <div className="mt-12">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Popular countdowns</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {events.map(ev => {
          const { days_left } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
          return (
            <Link
              key={ev.slug}
              href={`/how-long-until-${ev.slug}`}
              className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl text-left hover:border-brand-500 transition-colors"
            >
              <div className="text-sm font-medium mb-1">{ev.name}</div>
              <div className="text-2xl font-medium text-brand-500">{days_left}</div>
              <div className="text-xs text-gray-400">days</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
EOF

wf "src/components/countdown/EventSchema.tsx" << 'EOF'
interface Event { name: string; targetDate: Date | string; slug: string }
interface Props { event: Event }

export function EventSchema({ event }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: new Date(event.targetDate).toISOString(),
    url: `https://howlonguntilx.com/how-long-until-${event.slug}`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
EOF

wf "src/components/countdown/RelatedEvents.tsx" << 'EOF'
import Link from 'next/link';
import { getRelatedEvents } from '@/lib/events';

interface Props { category: string; currentSlug: string }

export async function RelatedEvents({ category, currentSlug }: Props) {
  const events = await getRelatedEvents(category, currentSlug);
  if (!events.length) return null;
  return (
    <div className="mt-12 text-left">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Related</p>
      <div className="flex flex-wrap gap-2">
        {events.map(ev => (
          <Link
            key={ev.slug}
            href={`/how-long-until-${ev.slug}`}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-sm hover:border-brand-500 hover:text-brand-500 transition-colors"
          >
            {ev.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
EOF

wf "src/components/countdown/TimerList.tsx" << 'EOF'
'use client';
import { buildCountdownResponse } from '@/lib/countdown';

interface Timer { id: string; name: string; targetDate: Date | string }
interface Props { timers: Timer[] }

export function TimerList({ timers }: Props) {
  if (!timers.length) {
    return <p className="text-gray-400 text-center py-16">No countdowns yet. Add one!</p>;
  }
  return (
    <div className="space-y-3">
      {timers.map(t => {
        const { days_left, hours_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
        return (
          <div key={t.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-sm text-gray-400">{new Date(t.targetDate).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-medium text-brand-500">{days_left}d</div>
              <div className="text-xs text-gray-400">{hours_left}h remaining</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
EOF

wf "src/components/countdown/AddTimerButton.tsx" << 'EOF'
'use client';
import { useState } from 'react';

export function AddTimerButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  async function save() {
    await fetch('/api/timers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, targetDate: new Date(date).toISOString() }),
    });
    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
        + Add countdown
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-80 space-y-4">
            <h2 className="font-medium">New countdown</h2>
            <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" placeholder="Event name" value={name} onChange={e => setName(e.target.value)} />
            <input type="datetime-local" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" value={date} onChange={e => setDate(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 bg-brand-500 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
EOF

# ── Embed components ──────────────────────────────────────────
wf "src/components/embed/EmbedGenerator.tsx" << 'EOF'
'use client';
import { useState } from 'react';

export function EmbedGenerator() {
  const [event, setEvent] = useState('christmas');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const base = process.env.NEXT_PUBLIC_URL ?? 'https://howlonguntilx.com';
  const code = `<iframe src="${base}/embed/widget?event=${event}&theme=${theme}" width="300" height="160" frameborder="0" loading="lazy"></iframe>`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-500 mb-1">Event</label>
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent" value={event} onChange={e => setEvent(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">Theme</label>
        <select className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent" value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-2">Preview</p>
        <iframe src={`/embed/widget?event=${event}&theme=${theme}`} width={300} height={160} className="border border-gray-200 dark:border-gray-700 rounded" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-2">Embed code</p>
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="mt-2 text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          Copy code
        </button>
      </div>
    </div>
  );
}
EOF

wf "src/components/embed/EmbedWidget.tsx" << 'EOF'
'use client';
import { useCountdown } from '@/hooks/useCountdown';

interface Props {
  event: { name: string; targetDate: Date | string } | null;
}

export function EmbedWidget({ event }: Props) {
  const target = event ? new Date(event.targetDate) : new Date('2025-12-25');
  const { days, hours, minutes, seconds } = useCountdown(target);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center font-sans bg-white dark:bg-gray-950">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">time until</p>
      <p className="text-lg font-medium mb-3">{event?.name ?? 'Christmas'}</p>
      <div className="flex gap-3 text-2xl font-medium text-brand-500">
        <span>{String(days).padStart(3,'0')}d</span>
        <span>{String(hours).padStart(2,'0')}h</span>
        <span>{String(minutes).padStart(2,'0')}m</span>
        <span>{String(seconds).padStart(2,'0')}s</span>
      </div>
    </div>
  );
}
EOF

# ============================================================
# 6. HOOKS
# ============================================================
wf "src/hooks/useCountdown.ts" << 'EOF'
'use client';
import { useState, useEffect } from 'react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progress: number;
  isPast: boolean;
}

export function useCountdown(target: Date): CountdownState {
  const [state, setState] = useState<CountdownState>(compute(target));

  useEffect(() => {
    const id = setInterval(() => setState(compute(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return state;
}

function compute(target: Date): CountdownState {
  const now = Date.now();
  const diff = target.getTime() - now;
  const isPast = diff <= 0;
  const absDiff = Math.abs(diff);

  const days    = Math.floor(absDiff / 86_400_000);
  const hours   = Math.floor((absDiff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((absDiff % 3_600_000) / 60_000);
  const seconds = Math.floor((absDiff % 60_000) / 1_000);

  const yearMs  = 365 * 86_400_000;
  const progress = isPast ? 100 : Math.max(0, Math.min(100, Math.round(((yearMs - absDiff) / yearMs) * 100)));

  return { days, hours, minutes, seconds, progress, isPast };
}
EOF

# ============================================================
# 7. TYPES
# ============================================================
wf "src/types/next-auth.d.ts" << 'EOF'
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
EOF

# ============================================================
# 8. WORDPRESS PLUGIN
# ============================================================
mk "wordpress-plugin/howlonguntilx"

wf "wordpress-plugin/howlonguntilx/howlonguntilx.php" << 'EOF'
<?php
/**
 * Plugin Name: HowLongUntil Countdown
 * Description: Embed countdown timers via shortcode or Gutenberg block.
 * Version: 1.0.0
 * Author: HowLongUntil
 */
defined('ABSPATH') || exit;

define('HLU_API', 'https://howlonguntilx.com/api/countdown');
define('HLU_EMBED', 'https://howlonguntilx.com/embed/widget');

// ── Shortcode: [howlonguntilx event="christmas"] ───────────────
function hlu_shortcode(array $atts): string {
    $atts = shortcode_atts(['event' => 'christmas', 'theme' => 'light', 'width' => '300', 'height' => '160'], $atts);
    $url  = add_query_arg(['event' => esc_attr($atts['event']), 'theme' => esc_attr($atts['theme'])], HLU_EMBED);
    return sprintf(
        '<iframe src="%s" width="%s" height="%s" frameborder="0" loading="lazy" style="border:none;border-radius:8px;"></iframe>',
        esc_url($url),
        esc_attr($atts['width']),
        esc_attr($atts['height'])
    );
}
add_shortcode('howlonguntilx', 'hlu_shortcode');

// ── REST proxy for API data ────────────────────────────────────
function hlu_register_rest(): void {
    register_rest_route('hlu/v1', '/countdown', [
        'methods'             => 'GET',
        'callback'            => 'hlu_rest_callback',
        'permission_callback' => '__return_true',
    ]);
}
add_action('rest_api_init', 'hlu_register_rest');

function hlu_rest_callback(WP_REST_Request $req): WP_REST_Response|WP_Error {
    $event = sanitize_text_field($req->get_param('event'));
    $url   = add_query_arg(['event' => $event], HLU_API);
    $resp  = wp_remote_get($url, ['timeout' => 5]);
    if (is_wp_error($resp)) return $resp;
    $data = json_decode(wp_remote_retrieve_body($resp), true);
    return new WP_REST_Response($data, 200);
}

// ── Gutenberg block ────────────────────────────────────────────
function hlu_register_block(): void {
    register_block_type(plugin_dir_path(__FILE__) . 'block');
}
add_action('init', 'hlu_register_block');
EOF

wf "wordpress-plugin/howlonguntilx/block/block.json" << 'EOF'
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "hlu/countdown",
  "title": "HowLongUntil Countdown",
  "category": "embeds",
  "attributes": {
    "event":  { "type": "string", "default": "christmas" },
    "theme":  { "type": "string", "default": "light" },
    "width":  { "type": "number", "default": 300 },
    "height": { "type": "number", "default": 160 }
  },
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
EOF

wf "wordpress-plugin/howlonguntilx/block/render.php" << 'EOF'
<?php
$url = add_query_arg(
    ['event' => esc_attr($attributes['event']), 'theme' => esc_attr($attributes['theme'])],
    'https://howlonguntilx.com/embed/widget'
);
?>
<iframe
  src="<?php echo esc_url($url); ?>"
  width="<?php echo esc_attr($attributes['width']); ?>"
  height="<?php echo esc_attr($attributes['height']); ?>"
  frameborder="0"
  loading="lazy"
  style="border:none;border-radius:8px;">
</iframe>
EOF

wf "wordpress-plugin/howlonguntilx/block/index.js" << 'EOF'
const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl, SelectControl, RangeControl } = wp.components;

registerBlockType('hlu/countdown', {
  edit({ attributes, setAttributes }) {
    const { event, theme, width, height } = attributes;
    const src = `https://howlonguntilx.com/embed/widget?event=${event}&theme=${theme}`;
    return wp.element.createElement('div', null,
      wp.element.createElement(InspectorControls, null,
        wp.element.createElement(PanelBody, { title: 'Countdown Settings', initialOpen: true },
          wp.element.createElement(TextControl, { label: 'Event', value: event, onChange: v => setAttributes({ event: v }) }),
          wp.element.createElement(SelectControl, { label: 'Theme', value: theme, options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }], onChange: v => setAttributes({ theme: v }) }),
          wp.element.createElement(RangeControl, { label: 'Width', value: width, min: 200, max: 800, onChange: v => setAttributes({ width: v }) }),
          wp.element.createElement(RangeControl, { label: 'Height', value: height, min: 100, max: 400, onChange: v => setAttributes({ height: v }) })
        )
      ),
      wp.element.createElement('iframe', { src, width, height, frameBorder: '0', style: { border: 'none', borderRadius: '8px' } })
    );
  },
  save: () => null,
});
EOF

# ============================================================
# 9. DEPLOYMENT
# ============================================================
wf "vercel.json" << 'EOF'
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret"
  }
}
EOF

wf "Makefile" << 'EOF'
.PHONY: dev build db-push db-seed

dev:
	npm run dev

build:
	npm run build

db-push:
	npm run db:push

db-seed:
	npm run db:seed

install:
	npm install

setup: install db-push db-seed
	@echo "✅ Ready — run: make dev"
EOF

wf "README.md" << 'EOF'
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
EOF

echo ""
echo "✅ Scaffold complete!"
echo ""
echo "📁 Structure created under: $ROOT/"
echo ""
echo "Next steps:"
echo "  cd $ROOT"
echo "  cp .env.example .env"
echo "  # Edit .env with your DATABASE_URL + auth credentials"
echo "  make setup"
echo "  make dev"
echo ""
echo "WordPress plugin: $ROOT/wordpress-plugin/howlonguntilx/"
