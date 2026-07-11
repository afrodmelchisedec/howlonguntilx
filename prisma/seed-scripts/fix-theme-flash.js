const fs = require('fs');
const path = 'src/app/globals.css';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `:root {
  /* motion */
  --spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-soft:   cubic-bezier(0.25, 0.46, 0.45, 0.94);

  /* radii — iOS continuous-corner scale */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 20px;
  --r-xl: 28px;

  /* LIGHT THEME SURFACES */
  --bg-base:        #F2F1F6;   /* iOS systemGroupedBackground */
  --bg-elevated:     #FFFFFF;   /* card / sheet */
  --bg-elevated-2:   #FAFAFE;   /* nested card on top of elevated */
  --bg-overlay:      rgba(255,255,255,0.78);
  --border-hairline:  rgba(60,60,67,0.12);
  --text-primary:    #1C1C1E;
  --text-secondary:  rgba(60,60,67,0.6);
  --text-tertiary:   rgba(60,60,67,0.35);
  --shadow-card:     0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
  --shadow-elevated: 0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10);

  /* ACCENTS — vivid, iOS system-color inspired (shared both themes, tuned per theme below) */
  --accent-brand:      83, 74, 217;     /* indigo */
  --accent-blue:        10, 132, 255;
  --accent-green:       48, 209, 88;
  --accent-orange:      255, 149, 0;
  --accent-red:         255, 69, 58;
  --accent-pink:        255, 55, 95;
  --accent-purple:      191, 90, 242;
  --accent-teal:         99, 230, 226;
  --accent-yellow:      255, 214, 10;
  --accent-red:      444, 214, 10;

  /* category glow map (light) */
  --glow-brand:          83, 74, 217;
  --glow-holidays:       191, 90, 242;
  --glow-sports:         48, 209, 88;
  --glow-finance:        255, 149, 0;
  --glow-personal:       255, 55, 95;
  --glow-tech:           10, 132, 255;
  --glow-nature:         52, 199, 89;
  --glow-entertainment:  255, 214, 10;
  --glow-shopping:       255, 69, 58;
  --glow-space:          94, 92, 230;
  --glow-health:         255, 105, 97;
  --glow-work:           10, 132, 255;
  --glow-family:         255, 159, 10;
  --glow-education:      48, 209, 88;
  --glow-travel:         99, 230, 226;

  /* misc */
  --blur-glass: 24px;
}

.dark {
  --bg-base:         #000000;
  --bg-elevated:      #1C1C1E;
  --bg-elevated-2:    #2C2C2E;
  --bg-overlay:       rgba(28,28,30,0.78);
  --border-hairline:  rgba(255,255,255,0.10);
  --text-primary:    #F5F5F7;
  --text-secondary:  rgba(235,235,245,0.6);
  --text-tertiary:   rgba(235,235,245,0.35);
  --shadow-card:     0 1px 1px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5);
  --shadow-elevated: 0 4px 14px rgba(0,0,0,0.5), 0 20px 48px rgba(0,0,0,0.6);

  /* dark accents — slightly brighter to read well on black */
  --accent-brand:      125, 118, 255;
  --accent-blue:        64, 156, 255;
  --accent-green:       48, 219, 91;
  --accent-orange:      255, 159, 10;
  --accent-red:         255, 69, 58;
  --accent-pink:        255, 75, 110;
  --accent-purple:      218, 143, 255;
  --accent-teal:        100, 240, 235;
  --accent-yellow:      255, 214, 10;

  --glow-brand:          125, 118, 255;
  --glow-holidays:       218, 143, 255;
  --glow-sports:         48, 219, 91;
  --glow-finance:        255, 159, 10;
  --glow-personal:       255, 75, 110;
  --glow-tech:           64, 156, 255;
  --glow-nature:         88, 214, 113;
  --glow-entertainment:  255, 214, 10;
  --glow-shopping:       255, 90, 80;
  --glow-space:          138, 134, 255;
  --glow-health:         255, 120, 110;
  --glow-work:           64, 156, 255;
  --glow-family:         255, 175, 64;
  --glow-education:      88, 214, 113;
  --glow-travel:         100, 240, 235;
}`;

// Normalize CRLF so the block match works regardless of the file's actual line endings
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldBlock.replace(/\r\n/g, '\n');

const newBlock = `:root {
  /* motion */
  --spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-soft:   cubic-bezier(0.25, 0.46, 0.45, 0.94);

  /* radii — iOS continuous-corner scale */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 20px;
  --r-xl: 28px;

  /* DARK THEME SURFACES — this is now the CSS default, no JS required to render correctly on first paint */
  --bg-base:         #000000;
  --bg-elevated:      #1C1C1E;
  --bg-elevated-2:    #2C2C2E;
  --bg-overlay:       rgba(28,28,30,0.78);
  --border-hairline:  rgba(255,255,255,0.10);
  --text-primary:    #F5F5F7;
  --text-secondary:  rgba(235,235,245,0.6);
  --text-tertiary:   rgba(235,235,245,0.35);
  --shadow-card:     0 1px 1px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5);
  --shadow-elevated: 0 4px 14px rgba(0,0,0,0.5), 0 20px 48px rgba(0,0,0,0.6);

  /* dark accents — slightly brighter to read well on black */
  --accent-brand:      125, 118, 255;
  --accent-blue:        64, 156, 255;
  --accent-green:       48, 219, 91;
  --accent-orange:      255, 159, 10;
  --accent-red:         255, 69, 58;
  --accent-pink:        255, 75, 110;
  --accent-purple:      218, 143, 255;
  --accent-teal:        100, 240, 235;
  --accent-yellow:      255, 214, 10;

  --glow-brand:          125, 118, 255;
  --glow-holidays:       218, 143, 255;
  --glow-sports:         48, 219, 91;
  --glow-finance:        255, 159, 10;
  --glow-personal:       255, 75, 110;
  --glow-tech:           64, 156, 255;
  --glow-nature:         88, 214, 113;
  --glow-entertainment:  255, 214, 10;
  --glow-shopping:       255, 90, 80;
  --glow-space:          138, 134, 255;
  --glow-health:         255, 120, 110;
  --glow-work:           64, 156, 255;
  --glow-family:         255, 175, 64;
  --glow-education:      88, 214, 113;
  --glow-travel:         100, 240, 235;

  /* misc */
  --blur-glass: 24px;
}

.light {
  --bg-base:        #F2F1F6;   /* iOS systemGroupedBackground */
  --bg-elevated:     #FFFFFF;   /* card / sheet */
  --bg-elevated-2:   #FAFAFE;   /* nested card on top of elevated */
  --bg-overlay:      rgba(255,255,255,0.78);
  --border-hairline:  rgba(60,60,67,0.12);
  --text-primary:    #1C1C1E;
  --text-secondary:  rgba(60,60,67,0.6);
  --text-tertiary:   rgba(60,60,67,0.35);
  --shadow-card:     0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
  --shadow-elevated: 0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10);

  --accent-brand:      83, 74, 217;     /* indigo */
  --accent-blue:        10, 132, 255;
  --accent-green:       48, 209, 88;
  --accent-orange:      255, 149, 0;
  --accent-red:         255, 69, 58;
  --accent-pink:        255, 55, 95;
  --accent-purple:      191, 90, 242;
  --accent-teal:         99, 230, 226;
  --accent-yellow:      255, 214, 10;

  --glow-brand:          83, 74, 217;
  --glow-holidays:       191, 90, 242;
  --glow-sports:         48, 209, 88;
  --glow-finance:        255, 149, 0;
  --glow-personal:       255, 55, 95;
  --glow-tech:           10, 132, 255;
  --glow-nature:         52, 199, 89;
  --glow-entertainment:  255, 214, 10;
  --glow-shopping:       255, 69, 58;
  --glow-space:          94, 92, 230;
  --glow-health:         255, 105, 97;
  --glow-work:           10, 132, 255;
  --glow-family:         255, 159, 10;
  --glow-education:      48, 209, 88;
  --glow-travel:         99, 230, 226;
}`;

if (!normalizedContent.includes(normalizedOld)) {
  console.log('❌ Exact :root/.dark block not found — file may have drifted. No changes made. Paste current globals.css to fix manually.');
} else {
  const updated = normalizedContent.replace(normalizedOld, newBlock);
  fs.writeFileSync(path, updated);
  console.log('✅ globals.css patched: dark is now the CSS default, .light is the override, duplicate/invalid --accent-red removed.');
}
