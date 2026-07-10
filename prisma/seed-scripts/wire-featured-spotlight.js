const fs = require('fs');
const path = 'src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const importOld = "import { FaqSection } from '@/components/ui/FaqSection';";
const importNew = "import { FaqSection } from '@/components/ui/FaqSection';\nimport { FeaturedSpotlight } from '@/components/ui/FeaturedSpotlight';";

if (content.includes(importOld) && !content.includes('FeaturedSpotlight')) {
  content = content.replace(importOld, importNew);
  console.log('✅ Import added');
} else if (content.includes('FeaturedSpotlight')) {
  console.log('⚠️ Import already present — skipping');
} else {
  console.log('❌ Could not find FaqSection import line — check file manually');
}

const faqBlockOld = `        {/* ══════════════════════════════════════════════════════
            FAQ — live slider + paginated archive
        ══════════════════════════════════════════════════════ */}
        <FaqSection initialFaqs={faqs} />`;

const faqBlockNew = `        <FeaturedSpotlight />

        {/* ══════════════════════════════════════════════════════
            FAQ — live slider + paginated archive
        ══════════════════════════════════════════════════════ */}
        <FaqSection initialFaqs={faqs} />`;

if (content.includes(faqBlockOld)) {
  content = content.replace(faqBlockOld, faqBlockNew);
  console.log('✅ <FeaturedSpotlight /> inserted above FAQ section');
} else if (content.includes('<FeaturedSpotlight />')) {
  console.log('⚠️ <FeaturedSpotlight /> already present — skipping');
} else {
  console.log('❌ Could not find the exact FAQ block to anchor against — paste current page.tsx content to fix manually');
}

fs.writeFileSync(path, content);
