// FILE: src/lib/fixedIntervalEventTemplates.ts
// Registry for non-annual "majors" (Olympics, World Cup) — each edition is
// bespoke content, not a per-year formula like yearlyEventTemplates.ts, so
// this is a flat map of fully-written entries keyed by slug.
//
// PROVISIONAL DATES: for editions where dates are not yet officially locked,
// `provisional: true` is set. The render layer (CountdownDisplay) shows a
// "⚡ PROVISIONAL" badge whenever content.provisional is true — see the
// patch in src/lib/renderEventPage.tsx.
//
// UPDATED [this session]: olympics-2030-winter and olympics-2034-winter
// now have officially scheduled dates (previously used shifted placeholder
// dates) — flipped provisional -> false and targetDate -> real dates.
// olympics-2034-winter was also rebranded "Utah 2034" in Nov 2025.
// world-cup-2034 remains genuinely provisional (Saudi Arabia; date may
// shift to Jan 2035 to avoid a Ramadan overlap — not yet confirmed by FIFA).
// Sources for every date/fact change are listed per-entry below.
//
// SEO SCORE NOTE: even a perfect import here caps at 80/100 until Category
// + Subcategory are set. The admin scorer's "Category + subcategory
// assigned" check (20pts) reads event.categoryId/subcategoryId — relational
// fields the import route (src/app/api/admin/events/import/route.ts) does
// not set; it only writes categorySlug. Category + Subcategory must be
// picked manually from the dropdowns in Admin > Events after import, same
// as existing 100% rows.
//
// heroImagePrompt: text-to-image prompts for generating each hero image.
// Deliberately generic/scenic (no logos, no specific real stadium branding)
// to avoid depicting trademarked marks tied to real organizations.

import type { EventContent } from './seo';

export interface FixedIntervalEventItem {
  slug: string;
  name: string;
  description: string;
  targetDate: string; // ISO
  categorySlug: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroImagePrompt: string;
  authorName: string;
  content: EventContent;
}

export const FIXED_INTERVAL_EVENTS: Record<string, FixedIntervalEventItem> = {
  'olympics-2032': {
    slug: 'olympics-2032',
    name: '2032 Brisbane Olympics',
    description: 'Countdown to the 2032 Olympics in Brisbane, Australia — Opening Ceremony July 23, 2032, Closing Ceremony August 8.',
    targetDate: '2032-07-23T00:00:00.000Z',
    categorySlug: 'time',
    heroImageUrl: '/images/questions/2032-brisbane-olympics-hero.jpeg',
    heroImageAlt: 'Brisbane skyline with Olympic rings above the river at dusk',
    heroImagePrompt: 'Brisbane, Australia city skyline along the river at golden hour, warm sunset light, modern skyscrapers reflected in the water, wide cinematic landscape shot, no text or logos',
    authorName: 'Afrod M (Msc Statistics at Makerere University)',
    content: {
      provisional: false,
      body: [
        { type: 'heading', text: 'When Do the 2032 Olympics Start?' },
        { type: 'paragraph', text: 'July 23, 2032. The Opening Ceremony lands in Brisbane, Australia, with the Games running through August 8 — sixteen days across Queensland.' },
        { type: 'heading', text: "Australia's Third Summer Games" },
        { type: 'paragraph', text: 'Brisbane hosts events across the Gold Coast and Sunshine Coast alongside the city itself. It is the country\'s first Summer Games since Sydney 2000, and its third overall after Melbourne 1956.' },
        { type: 'heading', text: 'The Venue Plan, Finally Settled' },
        { type: 'paragraph', text: 'Brisbane was awarded the Games back in 2021, but the venue question dragged on for years through two political reviews and three separate plans. In March 2025, Queensland finally locked in the current layout: a new 63,000-seat main stadium at Victoria Park, expected to cost around AU$3.6 billion, which will host athletics plus the opening and closing ceremonies before becoming the long-term home of the Brisbane Lions and cricket.' },
        { type: 'paragraph', text: 'The historic Gabba, long Brisbane\'s home cricket and AFL ground, will host cricket one last time at the Games before being decommissioned. Swimming gets a fresh home too — the inner-city Centenary Pool is being rebuilt into a 25,000-seat national aquatic centre next to the new stadium, while the Brisbane Showgrounds gains its own 20,000-seat venue beside a relocated athletes\' village.' },
        { type: 'paragraph', text: 'Some sports head further afield: hockey moves to a revamped Gold Coast venue left over from the 2018 Commonwealth Games, and rowing is set for the Fitzroy River in central Queensland. Construction on the main stadium is expected to begin around 2027, leaving about five years to build before the Games open.' },
        { type: 'paragraph', text: 'Other upgrades are part of the same package: the Queensland Tennis Centre is getting a new 3,000-seat showcourt, and a proposed $2.5 billion indoor arena and entertainment venue — originally slated for federal funding — has instead been put out to private tender, with the freed-up public money redirected to other Games infrastructure.' },
      ],
      faqs: [
        { question: 'How many days until the 2032 Olympics?', answer: 'Check the live countdown above — it updates automatically toward the July 23, 2032 Opening Ceremony.' },
        { question: 'Where will the 2032 Olympics be held?', answer: 'Brisbane, Australia, with most venues in the city itself and some events on the Gold Coast, Sunshine Coast, and in central Queensland.' },
        { question: 'Has Australia hosted the Olympics before?', answer: 'Yes — Melbourne in 1956 and Sydney in 2000. Brisbane 2032 will be the third time.' },
        { question: 'Is a new stadium being built for Brisbane 2032?', answer: 'Yes — a 63,000-seat stadium at Victoria Park, confirmed in March 2025 after years of debate over the venue plan, expected to cost roughly AU$3.6 billion.' },
      ],
      sources: [
        { label: 'Britannica — Olympic Games Host Cities', url: 'https://www.britannica.com/sports/Olympic-Games-host-cities' },
        { label: 'ESPN — Brisbane New Stadium Confirmed', url: 'https://www.espn.com/olympics/story/_/id/44393791/brisbane-olympic-games-2032-new-stadium-60000-seats' },
      ],
      heroFact: 'The 2032 Olympics open in Brisbane, Australia on July 23, 2032 and run through August 8 — Australia\'s third time hosting the Summer Games, and the first with a purpose-built stadium at Victoria Park.',
      quickFacts: [
        { label: 'Opening Ceremony', value: 'July 23, 2032' },
        { label: 'Closing Ceremony', value: 'August 8, 2032' },
        { label: 'Host', value: 'Brisbane, Australia' },
        { label: 'Main venue', value: 'New 63,000-seat stadium, Victoria Park' },
      ],
      relatedSlugs: ['world-cup-2030', 'winter-olympics-2030', 'winter-olympics-2034', 'world-cup-2034'],
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  },

  'world-cup-2030': {
    slug: 'world-cup-2030',
    name: '2030 FIFA World Cup',
    description: 'Countdown to the 2030 FIFA World Cup, the centenary tournament co-hosted by Morocco, Portugal and Spain — June 8 to July 21, 2030.',
    targetDate: '2030-06-08T00:00:00.000Z',
    categorySlug: 'time',
    heroImageUrl: '/images/questions/2030-world-cup-hero.jpeg',
    heroImageAlt: 'Stadium at dusk with a football World Cup atmosphere',
    heroImagePrompt: 'Generic modern football stadium exterior at dusk, floodlights on, warm sky, atmospheric wide shot, no team logos, no crests, no visible branding or signage',
    authorName: 'Afrod M (Msc Statistics at Makerere University)',
    content: {
      provisional: false,
      body: [
        { type: 'heading', text: 'When Does the 2030 World Cup Start?' },
        { type: 'paragraph', text: 'June 8, 2030, running through July 21 — a 44-day tournament, the longest in World Cup history, built around its spread across three continents.' },
        { type: 'heading', text: 'A Centenary Tournament, Six Countries' },
        { type: 'paragraph', text: 'Morocco, Portugal and Spain will co-host the main tournament, confirmed by FIFA in December 2024. To mark 100 years since the first World Cup, three opening centenary matches are scheduled for the weekend of June 8–9 in Uruguay, Argentina and Paraguay — the same three countries tied to the original 1930 edition, which Uruguay hosted and won.' },
        { type: 'heading', text: 'Where the Games Will Be Played' },
        { type: 'paragraph', text: 'FIFA approved 23 proposed stadiums across the three main hosts: Spain brings the largest share with 11 venues, Morocco has 6 across six cities, and Portugal has 3 across two cities. The exact final list is expected to be ratified around December 2026.' },
        { type: 'paragraph', text: 'Morocco\'s centrepiece is a newly built stadium outside Casablanca, the Grand Stade Hassan II, designed for a 115,000-capacity crowd — which would make it the largest football stadium in the world if it holds that figure. It is one of the favourites to host the final, alongside Spain\'s renovated Santiago Bernabéu in Madrid and Barcelona\'s Camp Nou, though FIFA has not yet confirmed the final\'s venue.' },
        { type: 'paragraph', text: 'For Spain, it will be the country\'s first World Cup in 48 years. For Portugal and Morocco, it will be their first time hosting the tournament outright. The multi-continent format has also drawn criticism from environmental groups over the long-haul travel it requires of teams and fans.' },
        { type: 'paragraph', text: 'The tournament keeps the 48-team, expanded format introduced at the 2026 World Cup in the United States, Canada, and Mexico, up from 32 teams at every edition before that. It follows directly on from that 2026 tournament, which wrapped up in July.' },
        { type: 'paragraph', text: 'Six nations have already locked in automatic places as hosts: Morocco, Portugal and Spain, plus centenary hosts Argentina, Paraguay and Uruguay. The other 42 spots will be split among the confederations through qualifying campaigns expected to run from 2027 through 2029, using the same 12-group, 48-team structure as 2026 — the top two from each group plus the eight best third-place finishers advance to a 32-team knockout bracket. FIFA has said it will confirm the exact confederation quotas once the 2026 tournament concludes.' },
      ],
      faqs: [
        { question: 'How many days until the 2030 World Cup?', answer: 'Check the live countdown above — it updates automatically toward the June 8, 2030 opening match.' },
        { question: 'Where is the 2030 World Cup being held?', answer: 'Primarily Morocco, Portugal and Spain, with one celebratory opening match each in Uruguay, Argentina and Paraguay.' },
        { question: 'Why is it called the centenary World Cup?', answer: 'It marks 100 years since the first-ever World Cup, held and won by Uruguay in 1930.' },
        { question: 'Where will the World Cup final be played?', answer: 'Not yet confirmed — Madrid\'s Bernabéu, Barcelona\'s Camp Nou, and Casablanca\'s Grand Stade Hassan II are the reported contenders.' },
        { question: 'Who has already qualified for the 2030 World Cup?', answer: 'Only the six hosts so far — Morocco, Portugal, Spain, Argentina, Paraguay and Uruguay. The remaining 42 places will be decided through qualifying from 2027–2029.' },
      ],
      sources: [
        { label: 'FIFA — 2030/2034 Host Nations Confirmed', url: 'https://www.fifa.com/en/tournaments/mens/worldcup/articles/2030-2034-host-nations-confirmed' },
        { label: 'Olympics.com — 2030 World Cup Stadiums List', url: 'https://www.olympics.com/en/news/fifa-world-cup-2030-stadiums-spain-portugal-morocco-list' },
      ],
      heroFact: 'The 2030 World Cup runs June 8 – July 21, co-hosted by Morocco, Portugal and Spain, with centenary matches in Uruguay, Argentina and Paraguay, across 23 proposed stadiums.',
      quickFacts: [
        { label: 'Opening match', value: 'June 8, 2030 (Montevideo, centenary match)' },
        { label: 'Final', value: 'July 21, 2030 (venue TBC)' },
        { label: 'Main hosts', value: 'Morocco, Portugal, Spain' },
        { label: 'Centenary hosts', value: 'Uruguay, Argentina, Paraguay (1 match each)' },
      ],
      relatedSlugs: ['olympics-2032', 'winter-olympics-2030', 'winter-olympics-2034', 'world-cup-2034'],
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  },

  'olympics-2030-winter': {
    slug: 'winter-olympics-2030',
    name: '2030 French Alps Winter Olympics',
    description: 'Countdown to the 2030 Winter Olympics in the French Alps, officially scheduled for February 1–17, 2030.',
    targetDate: '2030-02-01T00:00:00.000Z', // now the officially scheduled Opening Ceremony date, not a placeholder
    categorySlug: 'time',
    heroImageUrl: '/images/questions/2030-french-alps-olympics-hero.jpeg',
    heroImageAlt: 'Snow-covered French Alps mountain landscape',
    heroImagePrompt: 'Snow-covered French Alps mountain peaks under a clear blue sky, dramatic golden-hour light on the snow, wide alpine landscape, no people, no text or logos',
    authorName: 'Afrod M (Msc Statistics at Makerere University)',
    content: {
      provisional: false,
      body: [
        { type: 'heading', text: 'When Do the 2030 Winter Olympics Start?' },
        { type: 'paragraph', text: 'The French Alps Winter Olympics are now officially scheduled for February 1 to 17, 2030, with the Paralympic Games following from March 1 to 10. Unlike earlier in the planning process, these dates are locked in, not a placeholder.' },
        { type: 'heading', text: 'A Venue Plan Still Being Finalized' },
        { type: 'paragraph', text: 'The original plan had ice sports — figure skating, hockey, curling, and short track — hosted in Nice on the Mediterranean coast. That changed in mid-2026 after Nice\'s newly elected mayor objected to converting the city\'s football stadium into a temporary ice rink. Organizers and the IOC subsequently agreed to move all ice sports inland to Lyon instead, a decision the IOC approved at the end of June 2026.' },
        { type: 'paragraph', text: 'Speed skating, which France has no dedicated arena for, was originally expected to be hosted in Turin, Italy, reusing a rink from the 2006 Winter Games there. As of mid-2026, however, organizers were instead pursuing an arrangement with the Thialf arena in Heerenveen, Netherlands — long considered speed skating\'s spiritual home. A fully finalized venue plan, including the exact allocation of every sport, is still expected to be announced later in 2026.' },
        { type: 'paragraph', text: 'The mountain venues have been more settled throughout: Alpine skiing is split between Courchevel and Val d\'Isère in Savoie, sliding sports (bobsleigh, luge, skeleton) reuse and upgrade the historic La Plagne track from the Albertville 1992 Games, and cross-country skiing and biathlon are set for La Clusaz and Le Grand-Bornand in Haute-Savoie.' },
        { type: 'heading', text: 'France\'s Fourth Winter Games' },
        { type: 'paragraph', text: 'This will be France\'s fourth time hosting the Winter Olympics, after Chamonix 1924, Grenoble 1968, and Albertville 1992, and its second Olympics in six years following Paris\'s 2024 Summer Games. In June 2026, the IOC also approved ski mountaineering as a newly added sport for these Games and doubled the athlete quota for it, from 36 to 72 competitors.' },
        { type: 'paragraph', text: 'Because the venue plan is still moving, expect further updates before 2030: the Lyon ice-sports decision was only approved in principle in June 2026, the speed skating arrangement with the Netherlands was still pending final agreement at that point, and the opening ceremony location has not yet been announced.' },
      ],
      faqs: [
        { question: 'Are the 2030 Winter Olympics dates confirmed?', answer: 'Yes — the Games are officially scheduled for February 1–17, 2030, with the Paralympics from March 1–10, 2030.' },
        { question: 'Where will ice sports be held at the 2030 Winter Olympics?', answer: 'Lyon, not Nice as originally planned — the IOC approved the change in June 2026 after a dispute over Nice\'s stadium.' },
        { question: 'Has France hosted the Winter Olympics before?', answer: 'Yes — three times before: Chamonix 1924, Grenoble 1968, and Albertville 1992. 2030 will be the fourth.' },
      ],
      sources: [
        { label: 'Olympics.com — French Alps 2030 FAQ', url: 'https://www.olympics.com/en/news/olympic-winter-games-french-alps-2030-questions-answered-faq' },
        { label: 'NBC Sports — Lyon Approved for Ice Sports', url: 'https://www.nbcsports.com/olympics/news/french-alps-2030-winter-olympics-lyon-nice' },
        { label: 'Wikipedia — 2030 Winter Olympics', url: 'https://en.wikipedia.org/wiki/2030_Winter_Olympics' },
      ],
      heroFact: 'The 2030 Winter Olympics run February 1–17 in the French Alps — France\'s fourth time hosting the Winter Games, with ice sports moved to Lyon after a mid-2026 venue dispute in Nice.',
      quickFacts: [
        { label: 'Opening Ceremony', value: 'February 1, 2030' },
        { label: 'Closing Ceremony', value: 'February 17, 2030' },
        { label: 'Host', value: 'French Alps, France' },
        { label: 'Ice sports venue', value: 'Lyon' },
      ],
      relatedSlugs: ['olympics-2032', 'world-cup-2030', 'winter-olympics-2034', 'world-cup-2034'],
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  },

  'olympics-2034-winter': {
    slug: 'winter-olympics-2034',
    name: '2034 Utah Winter Olympics',
    description: 'Countdown to the 2034 Winter Olympics in Utah (Salt Lake City), officially scheduled for February 10–26, 2034.',
    targetDate: '2034-02-10T00:00:00.000Z', // now the officially scheduled Opening Ceremony date, not a placeholder
    categorySlug: 'time',
    heroImageUrl: '/images/questions/2034-salt-lake-city-olympics-hero.jpeg',
    heroImageAlt: 'Salt Lake City skyline with snow-capped mountains behind it',
    heroImagePrompt: 'Snow-capped mountain range behind a modern city skyline at dusk, winter atmosphere, soft blue and orange light, wide landscape shot, no text or logos',
    authorName: 'Afrod M (Msc Statistics at Makerere University)',
    content: {
      provisional: false,
      body: [
        { type: 'heading', text: 'When Do the 2034 Winter Olympics Start?' },
        { type: 'paragraph', text: 'The Winter Olympics in Utah are scheduled for February 10 to 26, 2034, with the Paralympic Games following from March 10 to 19. Salt Lake City was elected host at the 142nd IOC Session in Paris on July 24, 2024, by a delegate vote of 83 to 6, and in November 2025 the Games were rebranded from "Salt Lake City 2034" to "Utah 2034" to better reflect the wider set of host communities involved.' },
        { type: 'heading', text: 'A Second Turn for Utah' },
        { type: 'paragraph', text: 'Salt Lake City previously hosted the 2002 Winter Games, and 2034 will make it just the second American city — alongside Lake Placid — to host the Winter Olympics twice. Ten of the thirteen competition venues are being reused directly from 2002, and all venues sit within roughly an hour of the Olympic Village at the University of Utah, whose Rice-Eccles Stadium is set to serve as the Games\' main stadium.' },
        { type: 'paragraph', text: 'Beyond Salt Lake City itself, events will be spread across Park City, Soldier Hollow, Snowbasin, and Provo. Polling around the bid put local public support above 80 percent, and Utah organizers have said the Games will not require state or local taxpayer funding, relying instead on ticket sales, sponsorships, and IOC broadcast revenue.' },
        { type: 'paragraph', text: 'The IOC has already begun coordinating preparations across all four upcoming Games at once — Los Angeles 2028, the French Alps in 2030, Brisbane in 2032, and Utah in 2034 — reflecting the unusually long planning runway host cities now get compared to earlier decades.' },
        { type: 'heading', text: 'A Longer Bid Than Most' },
        { type: 'paragraph', text: 'Salt Lake City had originally hoped to bid for the 2030 Games, but held off because that timeline sat too close to the 2028 Los Angeles Summer Olympics. It entered the IOC\'s formal "Targeted Dialogue" process in late 2023 alongside the French Alps before the final host vote in mid-2024.' },
        { type: 'paragraph', text: 'With ten years between confirmation and the Games themselves, Utah 2034 has one of the longest lead times of any modern Olympics — giving organizers time to finalize sponsorships, ticketing, and the remaining venue details well ahead of the opening ceremony.' },
      ],
      faqs: [
        { question: 'Are the 2034 Winter Olympics dates confirmed?', answer: 'Yes — the Games are scheduled for February 10–26, 2034, with the Paralympics from March 10–19, 2034.' },
        { question: 'Has Salt Lake City hosted before?', answer: 'Yes — the 2002 Winter Olympics. 2034 will be its second time, making it one of only two U.S. cities to host the Winter Games twice.' },
        { question: 'Why is it called "Utah 2034" instead of "Salt Lake City 2034"?', answer: 'The Games were rebranded in November 2025 to reflect that venues are spread across Salt Lake City, Park City, Soldier Hollow, Snowbasin, and Provo.' },
      ],
      sources: [
        { label: 'Wikipedia — 2034 Winter Olympics', url: 'https://en.wikipedia.org/wiki/2034_Winter_Olympics' },
        { label: 'Olympics.com — Utah 2034', url: 'https://www.olympics.com/en/olympic-games/utah-2034' },
      ],
      heroFact: 'The 2034 Winter Olympics — rebranded "Utah 2034" — run February 10–26 in Salt Lake City and nearby Utah venues, 32 years after the city\'s 2002 Games.',
      quickFacts: [
        { label: 'Opening Ceremony', value: 'February 10, 2034' },
        { label: 'Closing Ceremony', value: 'February 26, 2034' },
        { label: 'Host', value: 'Utah, USA' },
        { label: 'Main venue', value: 'Rice-Eccles Stadium, University of Utah' },
      ],
      relatedSlugs: ['olympics-2032', 'world-cup-2030', 'winter-olympics-2030', 'world-cup-2034'],
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  },

  'world-cup-2034': {
    slug: 'world-cup-2034',
    name: '2034 FIFA World Cup',
    description: 'Countdown to the 2034 FIFA World Cup in Saudi Arabia. Exact dates are not yet confirmed by FIFA — this page uses a provisional placeholder.',
    targetDate: '2034-06-11T00:00:00.000Z', // placeholder: mirrors 2026 World Cup dates (Jun 11 - Jul 19), shifted to 2034
    categorySlug: 'time',
    heroImageUrl: '/images/questions/2034-saudi-arabia-world-cup-hero.jpeg',
    heroImageAlt: 'Modern stadium exterior at night in Saudi Arabia',
    heroImagePrompt: 'Generic modern desert-city stadium exterior at night, dramatic architectural lighting, desert skyline in background, no text or logos, no real branding',
    authorName: 'Afrod M (Msc Statistics at Makerere University)',
    content: {
      provisional: true,
      body: [
        { type: 'heading', text: 'When Does the 2034 World Cup Start?' },
        { type: 'paragraph', text: 'FIFA confirmed Saudi Arabia as host in December 2024 at the same Extraordinary Congress that awarded 2030, but exact dates have still not been officially announced. Multiple reports since late 2025 indicate organizers are now planning to hold the tournament in January 2035 — while still branding it the "2034 World Cup" — rather than the traditional November–December window, because that period overlaps with Ramadan in 2034.' },
        { type: 'heading', text: 'Why a January Start Is on the Table' },
        { type: 'paragraph', text: 'During Ramadan, observant Muslims fast from sunrise to sunset, which would complicate play for Muslim athletes and staff if matches fell in daylight hours during that month. Saudi summers are also far too hot to play in, which already ruled out the tournament\'s traditional June–July slot. Moving into winter would echo Qatar 2022, the first World Cup ever shifted out of its usual mid-year window, that time to avoid extreme summer heat.' },
        { type: 'heading', text: 'A Single-Nation Tournament, After Two Multi-Country Editions' },
        { type: 'paragraph', text: 'Unlike the multi-country 2026 (USA/Canada/Mexico) and 2030 (Morocco/Portugal/Spain) editions, 2034 will be hosted entirely within Saudi Arabia, across five cities: Riyadh, Jeddah, Al Khobar, Abha, and NEOM. Saudi Arabia was the only bidder after Australia withdrew from the race, and the hosting decision was made by acclamation rather than a competitive vote.' },
        { type: 'paragraph', text: 'The tournament\'s official bid book, confirmed on July 31, 2024, lists 15 stadiums across those five cities, 11 of them newly built, including a planned 92,000-seat King Salman International Stadium in Riyadh expected to host the opening match and the final.' },
        { type: 'heading', text: 'What Comes After' },
        { type: 'paragraph', text: 'FIFA\'s confederation rotation rules — which prevent a continent from hosting back-to-back editions — mean the 2038 tournament is expected to be open only to bidders from CONCACAF or Oceania, though no formal bidding process has opened for it yet. A possible January 2035 date would also place the tournament close to the 2034 Asian Games, also scheduled for Riyadh, one of the scheduling pressures reportedly factoring into FIFA\'s final decision.' },
      ],
      faqs: [
        { question: 'Are the 2034 World Cup dates confirmed?', answer: 'No — only the host (Saudi Arabia) is confirmed. Multiple reports since late 2025 point to a possible shift into January 2035 to avoid a Ramadan overlap, but FIFA has not made a final announcement.' },
        { question: 'Where will matches be played?', answer: 'Five host cities in Saudi Arabia: Riyadh, Jeddah, Al Khobar, Abha, and NEOM.' },
        { question: 'Why might the 2034 World Cup move to January 2035?', answer: 'The traditional November–December window overlaps with Ramadan in 2034, and Saudi summers are too hot for the usual June–July slot — similar reasoning to Qatar\'s 2022 shift to winter.' },
      ],
      sources: [
        { label: 'Wikipedia — 2034 FIFA World Cup', url: 'https://en.wikipedia.org/wiki/2034_FIFA_World_Cup' },
        { label: 'Morocco World News — Saudi Arabia to Host in January 2035', url: 'https://www.moroccoworldnews.com/2025/10/263221/saudi-arabia-to-host-2034-world-cup-in-january-2035-due-to-ramadan/' },
      ],
      heroFact: 'The 2034 World Cup will be hosted entirely by Saudi Arabia — exact dates are not yet officially confirmed and may shift to January 2035 to avoid overlapping with Ramadan.',
      quickFacts: [
        { label: 'Host', value: 'Saudi Arabia (single nation)' },
        { label: 'Expected window', value: 'Nov/Dec 2034 or possibly Jan 2035 (unconfirmed)' },
        { label: 'Status', value: 'Host confirmed; exact dates pending FIFA announcement' },
        { label: 'Confirmed as host', value: 'December 11, 2024 (FIFA Extraordinary Congress)' },
      ],
      relatedSlugs: ['olympics-2032', 'world-cup-2030', 'winter-olympics-2030', 'winter-olympics-2034'],
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  },
};

export function buildFixedIntervalEventItem(key: string): FixedIntervalEventItem {
  const item = FIXED_INTERVAL_EVENTS[key];
  if (!item) throw new Error('Unknown fixed-interval key: ' + key + '. Valid keys: ' + Object.keys(FIXED_INTERVAL_EVENTS).join(', '));
  return item;
}
