// FILE: src/lib/seedComments.ts
export interface SeedComment {
  id: string;
  author: string;
  avatarColor: string; // "r, g, b"
  text: string;
  likes: number;
  timeAgo: string;
}

export const RUNWAY_LAB_COMMENTS: SeedComment[] = [
  { id: 'c1', author: 'Priya',  avatarColor: '88, 214, 113',  text: 'Dragging the split bar and watching Food shrink in real time made me realize I was way overspending on takeout lol.', likes: 24, timeAgo: '2d ago' },
  { id: 'c2', author: 'Marcus', avatarColor: '100, 200, 255', text: 'This is the first budgeting tool that actually made me want to keep tweaking numbers instead of closing the tab.', likes: 41, timeAgo: '3d ago' },
  { id: 'c3', author: 'Aisha',  avatarColor: '196, 132, 252', text: 'The chart turning red the second I raised fixed expenses past 80% was a genuinely useful gut-check.', likes: 18, timeAgo: '4d ago' },
  { id: 'c4', author: 'Dmitri', avatarColor: '255, 180, 100', text: 'Wish I had this before I signed my new lease. Would have seen the runway problem instantly.', likes: 33, timeAgo: '5d ago' },
  { id: 'c5', author: 'Lena',   avatarColor: '255, 122, 165', text: 'Simple idea, executed really well. The glow color change alone tells you everything before you even read the numbers.', likes: 12, timeAgo: '6d ago' },
  { id: 'c6', author: 'Tobias', avatarColor: '120, 220, 200', text: 'Used this to plan my two-week runway before payday and actually stuck to it for once.', likes: 27, timeAgo: '1w ago' },
  { id: 'c7', author: 'Grace',  avatarColor: '255, 159, 10',  text: 'The drag dividers on the split bar are so satisfying, ngl. More tools should work like this.', likes: 9, timeAgo: '1w ago' },
  { id: 'c8', author: 'Kenji',  avatarColor: '134, 168, 255', text: 'Bumped my income up and watched the projected balance line flatten out — very clear visual feedback.', likes: 15, timeAgo: '2w ago' },
  { id: 'c9', author: 'Nadia',  avatarColor: '250, 128, 114', text: 'Would love a version of this for weekly instead of just per-payday, but even as is it\'s genuinely useful.', likes: 21, timeAgo: '2w ago' },
  { id: 'c10', author: 'Owen',  avatarColor: '167, 222, 133', text: 'Showed this to my roommate and we spent 20 minutes just dragging sliders comparing our runways lol.', likes: 30, timeAgo: '3w ago' },
];

export const MEETING_OVERLAP_COMMENTS: SeedComment[] = [
  { id: 'm1', author: 'Sofia',   avatarColor: '88, 214, 113',  text: 'Our team is spread across 4 continents and this found our 45-minute window in about 10 seconds. Dragging the arcs is oddly fun.', likes: 37, timeAgo: '1d ago' },
  { id: 'm2', author: 'Jamal',   avatarColor: '100, 200, 255', text: 'The heat ring glowing gold the instant everyone overlaps is such a satisfying payoff, way better than a spreadsheet.', likes: 52, timeAgo: '2d ago' },
  { id: 'm3', author: 'Ines',    avatarColor: '196, 132, 252', text: 'Toggled our Tokyo teammate off just to see what our overlap would look like without them — genuinely useful what-if tool.', likes: 19, timeAgo: '3d ago' },
  { id: 'm4', author: 'Tariq',   avatarColor: '255, 180, 100', text: 'The rotating radar sweep is unnecessary and I love it. Makes checking timezones feel like a game instead of a chore.', likes: 44, timeAgo: '4d ago' },
  { id: 'm5', author: 'Chloe',   avatarColor: '255, 122, 165', text: 'Copy proposed time button saved me from typing out "9am EST / 2pm GMT / 11pm JST" in Slack for the hundredth time.', likes: 28, timeAgo: '5d ago' },
  { id: 'm6', author: 'Yusuf',   avatarColor: '120, 220, 200', text: 'Dragging a handle around the ring to adjust someone\'s hours feels way more intuitive than typing times into a form.', likes: 16, timeAgo: '6d ago' },
  { id: 'm7', author: 'Renata',  avatarColor: '255, 159, 10',  text: 'Bookmarked this for every new project kickoff now. Way faster than the usual timezone spreadsheet back-and-forth.', likes: 23, timeAgo: '1w ago' },
  { id: 'm8', author: 'Devon',   avatarColor: '134, 168, 255', text: 'The bubble glowing green when someone is currently working is such a small detail but genuinely helpful at a glance.', likes: 12, timeAgo: '1w ago' },
  { id: 'm9', author: 'Mei',     avatarColor: '250, 128, 114', text: 'Added all 6 of our remote teammates and it still stayed readable. Impressed it didn\'t turn into visual soup.', likes: 20, timeAgo: '2w ago' },
  { id: 'm10', author: 'Liam',   avatarColor: '167, 222, 133', text: 'Only wish it accounted for DST automatically, but as a quick visual sanity check it\'s become part of my weekly planning.', likes: 25, timeAgo: '2w ago' },
];
