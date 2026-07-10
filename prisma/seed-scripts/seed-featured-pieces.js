// FILE: prisma/seed-scripts/seed-featured-pieces.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIECES = [
  {
    kind: 'history',
    title: 'The night the ball first dropped in Times Square',
    sourceLabel: 'Times Square Alliance',
    body: `Long before countdown apps existed, New York City needed a very public, very visible way to mark the exact second one year ended and another began — and the solution came from an unlikely place: maritime navigation.\n\nBefore radio and satellites, ships at sea told time using "time balls" — large spheres mounted on hills or towers near harbors, dropped at a precise, pre-announced moment (often exactly noon) so sailors could set their chronometers by sight from miles away. The concept had been used since the early 1800s at observatories and ports around the world.\n\nIn 1907, The New York Times borrowed this old maritime trick for a very new purpose: ringing in the New Year with unmistakable precision. A 700-pound iron-and-wood ball, studded with 100 light bulbs, was hoisted up a flagpole above One Times Square and lowered over the course of exactly one minute, timed to strike midnight the moment it reached the bottom.\n\nThe ball has changed dramatically since then — today's version is a geodesic sphere nearly 12 feet across, covered in over 2,600 Waterford crystal triangles and thousands of LEDs — but the underlying idea hasn't changed in over a century: give a crowd of strangers a shared, visible countdown, and let them experience the exact moment together.\n\nThat's the same instinct behind every countdown clock on this site. A number ticking toward zero isn't just information — it's an invitation to wait for something, together, on purpose.`,
  },
  {
    kind: 'fact',
    title: 'Your clock has been secretly wrong 27 times since 1972',
    sourceLabel: 'International Earth Rotation and Reference Systems Service',
    body: `Here's something most countdown timers quietly ignore: a "day" isn't actually a fixed unit. Earth's rotation is very slowly, unevenly slowing down — nudged by tidal friction from the moon, shifts in the planet's molten core, even the redistribution of ice and water across seasons.\n\nTo keep our clocks in sync with the actual position of the sun overhead, timekeeping authorities occasionally insert a "leap second" — one extra second added to a specific day, almost always June 30th or December 31st. Since the practice began in 1972, 27 leap seconds have been added to Coordinated Universal Time (UTC), the standard nearly every digital clock, server, and countdown app ultimately relies on.\n\nIt sounds trivial, but leap seconds have caused real chaos. In 2012, a bug related to a leap-second insertion crashed Reddit, LinkedIn, and Yelp simultaneously. Airline reservation systems have needed emergency patches. The disruption got serious enough that in November 2022, the world's major timekeeping bodies voted to phase out leap seconds entirely by 2035, favoring a larger, less disruptive adjustment instead — likely a full "leap minute" sometime after 2035, given decades of accumulated drift.\n\nSo the next time a countdown app tells you an event starts in exactly 14 days, 6 hours, 32 minutes, and 9 seconds — know that the "9 seconds" is standing on top of over 50 years of humanity quietly patching the gap between how we measure time and how the planet actually spins.`,
  },
  {
    kind: 'quote',
    title: '"The bad news is time flies. The good news is you\'re the pilot."',
    sourceLabel: 'Michael Altshuler',
    body: `It's one of the more quoted lines in modern productivity and self-help writing, usually credited to motivational speaker and author Michael Altshuler — and it captures something genuinely useful buried under its bumper-sticker phrasing.\n\nMost advice about time falls into one of two unhelpful extremes. One extreme treats time as something to be feared — a countdown to loss, an enemy to be raced against, every ticking second a small defeat. The other extreme treats it as infinite and unstructured — "there's always tomorrow," "you have plenty of time" — which quietly encourages drifting rather than choosing.\n\nAltshuler's line rejects both. It accepts, plainly, that time moves whether you engage with it or not — the "flying" part isn't negotiable. But it reframes the relationship: you're not a passenger being carried along helplessly. You're flying the plane. The minutes and days aren't happening to you; you're the one making decisions about where they go.\n\nThat's a genuinely different posture than most time-related advice offers. It doesn't promise you can slow time down, and it doesn't ask you to pretend time doesn't matter. It just insists that within the time you do have, direction is a choice, not a given.\n\nIt's a fitting idea for a site built entirely around counting down to things — because a countdown, at its best, isn't dread. It's a plan. Every number ticking toward zero on this site represents someone who decided a date mattered enough to track it on purpose, instead of just letting it arrive.`,
  },
  {
    kind: 'fact',
    title: 'The oldest known countdown wasn\'t for a rocket. It was for a flood.',
    sourceLabel: 'British Museum',
    body: `Rocket launches get credit for popularizing the modern "3-2-1" countdown — but the idea of publicly, deliberately counting down to a fixed future moment is thousands of years older than spaceflight, and one of the earliest known examples comes from ancient Mesopotamia.\n\nSurviving cuneiform tablets from ancient Babylon describe systems for tracking the Nile's flood cycle and predicting agricultural deadlines — not with a single ticking number, but with structured calendars counting days toward a known, recurring event that entire harvests depended on. Getting the count wrong wasn't an inconvenience; it could mean planting too early and losing a season's crop, or too late and missing the flood's fertile silt entirely.\n\nThe rocket-launch countdown as we know it — spoken aloud, descending toward a dramatic zero — has a surprisingly specific and much more recent origin: film. Fritz Lang's 1929 silent film "Frau im Mond" ("Woman in the Moon") is widely credited with inventing the theatrical backward countdown to a rocket launch, purely because Lang thought counting up ("1, 2, 3, liftoff") lacked dramatic tension. NASA and Soviet engineers later adopted the same descending pattern for real launches, largely because it worked exactly as well operationally as it did dramatically — a shared, unambiguous signal for exactly when to act.\n\nSo in a real sense, every countdown on this site sits at the intersection of two very old human instincts: the practical need to prepare for a moment that matters, and the very human desire to make the waiting feel like part of the story.`,
  },
];

async function main() {
  for (const p of PIECES) {
    const existing = await prisma.featuredPiece.findFirst({ where: { title: p.title } });
    if (existing) {
      await prisma.featuredPiece.update({ where: { id: existing.id }, data: p });
      console.log('↻ Updated:', p.title);
    } else {
      await prisma.featuredPiece.create({ data: p });
      console.log('✅ Created:', p.title);
    }
  }
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
