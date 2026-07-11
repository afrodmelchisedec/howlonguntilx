const fs = require('fs');

const files = [
  'src/components/pro-tools/darkSkyComments.ts',
  'src/components/pro-tools/energyRhythmComments.ts',
  'src/components/pro-tools/entertainmentComments.ts',
  'src/components/pro-tools/focusBlockComments.ts',
  'src/components/pro-tools/foodFestivalComments.ts',
  'src/components/pro-tools/fraudResponseComments.ts',
  'src/components/pro-tools/harvestSeasonsComments.ts',
  'src/components/pro-tools/jetlagComments.ts',
  'src/components/pro-tools/moneyMilestonesComments.ts',
  'src/components/pro-tools/payrollComments.ts',
  'src/components/pro-tools/phishingIdentityComments.ts',
  'src/components/pro-tools/savingsGoalComments.ts',
  'src/components/pro-tools/sportsGamesComments.ts',
  'src/components/pro-tools/taxDeadlineComments.ts',
  'src/components/pro-tools/techEventsComments.ts',
];

const palette = ['88, 214, 113','100, 200, 255','196, 132, 252','255, 180, 100','255, 122, 165','120, 220, 200','255, 159, 10','134, 168, 255','250, 128, 114','167, 222, 133'];
const times = ['1d ago','2d ago','3d ago','4d ago','5d ago','6d ago','1w ago','1w ago','2w ago','2w ago','3w ago','3w ago'];

const re = /\{ id: '([^']+)', author: '([^']+)', text: '((?:[^'\\]|\\.)*)', likes: (\d+) \}/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let i = 0;
  const updated = content.replace(re, (match, id, author, text, likes) => {
    const avatarColor = palette[i % palette.length];
    const timeAgo = times[i % times.length];
    i++;
    return `{ id: '${id}', author: '${author}', avatarColor: '${avatarColor}', text: '${text}', likes: ${likes}, timeAgo: '${timeAgo}' }`;
  });
  fs.writeFileSync(file, updated);
  console.log(`${file}: fixed ${i} entries`);
}
