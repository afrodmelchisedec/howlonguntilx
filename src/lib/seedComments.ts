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

export const SUBSCRIPTION_DENSITY_COMMENTS: SeedComment[] = [
  { id: 's1', author: 'Farah',   avatarColor: '88, 214, 113',  text: 'Dragged all my subscriptions in and immediately saw three of them all hit the same week — no wonder that week always feels tight.', likes: 34, timeAgo: '1d ago' },
  { id: 's2', author: 'Callum',  avatarColor: '100, 200, 255', text: 'Found out I somehow had two Netflix entries at different prices. Definitely an old family plan I forgot to cancel.', likes: 58, timeAgo: '2d ago' },
  { id: 's3', author: 'Yuki',    avatarColor: '196, 132, 252', text: 'Spreading renewal dates across the month instead of clustering them at the start made such a visible difference on the heat bar.', likes: 22, timeAgo: '3d ago' },
  { id: 's4', author: 'Bianca',  avatarColor: '255, 180, 100', text: 'The duplicate billing warning is a genuinely useful fraud-awareness feature, not just a gimmick.', likes: 41, timeAgo: '4d ago' },
  { id: 's5', author: 'Hassan',  avatarColor: '255, 122, 165', text: 'Dragging a subscription chip across the calendar and watching the week bars shift color in real time is weirdly addictive.', likes: 27, timeAgo: '5d ago' },
  { id: 's6', author: 'Wren',    avatarColor: '120, 220, 200', text: 'Moved my gym renewal off the same day as rent hits and instantly felt better about my budget.', likes: 15, timeAgo: '6d ago' },
  { id: 's7', author: 'Idris',   avatarColor: '255, 159, 10',  text: 'Wish I had this before three subscriptions all renewed the same day my card got declined for something else.', likes: 46, timeAgo: '1w ago' },
  { id: 's8', author: 'Marisol', avatarColor: '134, 168, 255', text: 'The red pile-up badge on days with 3+ charges is such a clear visual warning, love the design.', likes: 19, timeAgo: '1w ago' },
  { id: 's9', author: 'Theo',    avatarColor: '250, 128, 114', text: 'Used this to finally map out every subscription I forgot I had. Cancelled two after seeing them laid out visually.', likes: 30, timeAgo: '2w ago' },
  { id: 's10', author: 'Amara',  avatarColor: '167, 222, 133', text: 'Simple concept but the heat bar recalculating instantly as you drag makes it so much more useful than a spreadsheet.', likes: 24, timeAgo: '2w ago' },
];


export const RECIPE_BATCH_DIAL_COMMENTS = [
  { id: 'c1', author: 'Priya', text: 'Scaled the cookie recipe to feed my whole office, genuinely useful.', likes: 14 },
  { id: 'c2', author: 'Owen', text: 'The dial feels so satisfying to drag, way better than typing a number in.', likes: 9 },
  { id: 'c3', author: 'Marcus', text: 'Hit the pancake batter for a birthday brunch, 20 servings and nobody went hungry.', likes: 22 },
  { id: 'c4', author: 'Fatima', text: 'The oven capacity tip actually saved me from ruining a batch, didn\'t think about pan space until it warned me.', likes: 31 },
  { id: 'c5', author: 'Devon', text: 'Wish the free tier went past 8 servings but I get why, upgraded within a week honestly.', likes: 7 },
  { id: 'c6', author: 'Lena', text: 'Copy list button is clutch, pasted straight into my grocery app.', likes: 18 },
  { id: 'c7', author: 'Carlos', text: 'Tried scaling the pasta sauce down to 2 servings for a solo dinner, math checked out perfectly.', likes: 5 },
  { id: 'c8', author: 'Aisha', text: 'This is way more fun than it has any right to be, kept spinning the dial just to watch the bars move.', likes: 27 },
  { id: 'c9', author: 'Tobias', text: 'Saved my batch size as Pro and it was still there when I came back the next day, nice touch.', likes: 11 },
  { id: 'c10', author: 'Grace', text: 'Made 60 servings of cookies for a school fundraiser, the dial made it stupidly easy to plan.', likes: 19 },
  { id: 'c11', author: 'Yusuf', text: 'The tactile drag is such a small thing but it makes the whole tool feel premium.', likes: 8 },
  { id: 'c12', author: 'Naomi', text: 'Only gripe is I want more recipes in the dropdown, otherwise this is my new favorite kitchen tool.', likes: 13 },
];
export const DEADLINE_BUFFER_COMMENTS = [
  { id: 'c1', author: 'Priya', text: 'Marking our office holidays finally made the sprint plan realistic instead of optimistic.', likes: 21 },
  { id: 'c2', author: 'Owen', text: 'The tight-phase warning caught that our QA window was basically nothing, saved us from a bad launch.', likes: 17 },
  { id: 'c3', author: 'Marcus', text: 'Dragging the launch date and watching the calendar reflow is oddly satisfying.', likes: 12 },
  { id: 'c4', author: 'Fatima', text: 'Added a 4th phase for "buffer" and it changed how our whole team thinks about padding timelines.', likes: 19 },
  { id: 'c5', author: 'Devon', text: 'Free tier is fine for quick estimates but I upgraded within a day for the holiday marking.', likes: 6 },
  { id: 'c6', author: 'Lena', text: 'Copy schedule button is great, pasted it straight into our project doc.', likes: 14 },
  { id: 'c7', author: 'Carlos', text: 'Never realized how many working days a long weekend actually eats until I saw the weekly bar chart.', likes: 9 },
  { id: 'c8', author: 'Aisha', text: 'This is the first planning tool that actually shows me the truth instead of just calendar days.', likes: 25 },
  { id: 'c9', author: 'Tobias', text: 'Saved my setup as Pro, came back a week later and everything was exactly where I left it.', likes: 10 },
  { id: 'c10', author: 'Grace', text: 'Used this to plan a product launch around a national holiday, the calendar heatmap made it obvious where the gap was.', likes: 15 },
  { id: 'c11', author: 'Yusuf', text: 'Dragging the phase divider feels so much more intuitive than typing percentages into a spreadsheet.', likes: 8 },
  { id: 'c12', author: 'Naomi', text: 'Wish free tier went past 30 days but honestly that\'s a fair line to draw for a Pro feature.', likes: 5 },
];

export const PASSWORD_ROTATION_COMMENTS = [
  { id: 'c1', author: 'Priya', text: 'Discovered my banking password was over a year old the second I loaded this, genuinely useful wake-up call.', likes: 24 },
  { id: 'c2', author: 'Owen', text: 'Dragging accounts by sensitivity and watching the health score update is weirdly addictive.', likes: 14 },
  { id: 'c3', author: 'Marcus', text: 'The priority order list is exactly what I needed, no more guessing what to rotate first.', likes: 18 },
  { id: 'c4', author: 'Fatima', text: 'Marked three accounts as rotated today and watched the health score jump, satisfying.', likes: 16 },
  { id: 'c5', author: 'Devon', text: 'Free tier is enough to get started but I upgraded fast just for the exact date picker.', likes: 7 },
  { id: 'c6', author: 'Lena', text: 'Copy list button let me paste my rotation plan straight into my task manager.', likes: 11 },
  { id: 'c7', author: 'Carlos', text: 'Never thought about sensitivity affecting how often I should rotate a password, makes total sense now.', likes: 13 },
  { id: 'c8', author: 'Aisha', text: 'This is the first security tool that actually tells me what to do instead of just lecturing me.', likes: 22 },
  { id: 'c9', author: 'Tobias', text: 'Saved my account list as Pro, came back a month later and the urgency bars had all updated on their own since the dates are real.', likes: 20 },
  { id: 'c10', author: 'Grace', text: 'Used this to finally get my work accounts under control before an IT audit, huge time saver.', likes: 17 },
  { id: 'c11', author: 'Yusuf', text: 'The critical warning banner for my ancient banking password was the push I needed.', likes: 9 },
  { id: 'c12', author: 'Naomi', text: 'Simple idea, executed really well, the drag line makes prioritizing feel intuitive instead of a chore.', likes: 12 },
];

export const CALENDAR_COMMENTS = [
  { id: 'c1', author: 'Priya', text: 'The past/present/future bubble popping in when you click a day is such a nice touch.', likes: 19 },
  { id: 'c2', author: 'Owen', text: 'Hovering days for the little preview card before committing to a click feels so smooth.', likes: 12 },
  { id: 'c3', author: 'Marcus', text: 'Saved my birthday and a few anniversaries, love having the quick-jump strip at the top.', likes: 15 },
  { id: 'c4', author: 'Fatima', text: 'Today\'s cell pulsing gently makes it so easy to spot at a glance.', likes: 10 },
  { id: 'c5', author: 'Devon', text: 'Upgraded just to browse past months, the free version got me curious enough.', likes: 6 },
  { id: 'c6', author: 'Lena', text: 'Copied a fact straight into a group chat, worked perfectly.', likes: 9 },
  { id: 'c7', author: 'Carlos', text: 'The region filter is great for narrowing down to just African or Middle Eastern history.', likes: 8 },
  { id: 'c8', author: 'Aisha', text: 'This finally feels like a fun tool to explore instead of a plain grid of numbers.', likes: 21 },
  { id: 'c9', author: 'Tobias', text: 'The slide animation when switching months is subtle but makes a real difference.', likes: 7 },
  { id: 'c10', author: 'Grace', text: 'Clicking a day that has no events still feels good instead of just being dead space.', likes: 11 },
];
