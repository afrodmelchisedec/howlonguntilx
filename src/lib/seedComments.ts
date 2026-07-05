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
