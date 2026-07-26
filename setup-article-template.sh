#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="."
COMPONENTS_DIR="$REPO_ROOT/src/components/articles"
IMAGES_DIR="$REPO_ROOT/public/images/defaults"

if [[ -z "${PEXELS_API_KEY:-}" ]]; then
  echo "PEXELS_API_KEY not set. Get a free key at https://www.pexels.com/api/ and run:"
  echo "   export PEXELS_API_KEY=your_key_here"
  exit 1
fi

mkdir -p "$COMPONENTS_DIR" "$IMAGES_DIR" "$REPO_ROOT/public/images/articles"

declare -A CATEGORY_QUERIES=(
  [health]="medical healthcare abstract"
  [finance]="finance business chart"
  [scam]="cybersecurity digital safety"
  [general]="abstract gradient background"
)

fetch_pexels_image () {
  local query="$1" outfile="$2"
  local url
  url=$(curl -s -H "Authorization: ${PEXELS_API_KEY}" \
    "https://api.pexels.com/v1/search?query=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$query")&per_page=1&orientation=landscape" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['photos'][0]['src']['large2x'] if d.get('photos') else '')")
  if [[ -n "$url" ]]; then
    curl -s -L "$url" -o "$outfile"
    echo "  saved $outfile"
  else
    echo "  no result for '$query' -- leaving $outfile untouched"
  fi
}

echo "Fetching default hero images from Pexels..."
for cat in "${!CATEGORY_QUERIES[@]}"; do
  fetch_pexels_image "${CATEGORY_QUERIES[$cat]}" "$IMAGES_DIR/$cat.jpg"
done
fetch_pexels_image "dental care tooth" "$REPO_ROOT/public/images/articles/tooth-infection-hero.jpg"

cat > "$COMPONENTS_DIR/ArticleDisclaimer.tsx" << 'EOF'
// FILE: src/components/articles/ArticleDisclaimer.tsx
interface DisclaimerCopy { icon: string; label: string; body: string }

const DISCLAIMERS: Record<string, DisclaimerCopy> = {
  health: {
    icon: '⚕️',
    label: 'HEALTH DISCLAIMER',
    body: 'This article is for general educational purposes only and is not medical advice, diagnosis, or treatment. Timelines and figures are typical ranges, not a prediction for your specific situation. Always consult a qualified healthcare provider for concerns about your health, and seek emergency care immediately if you have severe or worsening symptoms.',
  },
  finance: {
    icon: '💰',
    label: 'FINANCIAL DISCLAIMER',
    body: 'This article is for general informational purposes only and is not financial, investment, tax, or legal advice. Figures and timelines are estimates and can vary based on your individual circumstances. Consult a licensed financial advisor or professional before making financial decisions.',
  },
  scam: {
    icon: '🛡️',
    label: 'SAFETY DISCLAIMER',
    body: 'This article is for general awareness and educational purposes only. It does not constitute legal advice, and it is not a substitute for reporting suspected fraud to the appropriate authorities or your financial institution. If you believe you are a victim of a scam, act quickly and contact your bank or local law enforcement.',
  },
  general: {
    icon: 'ℹ️',
    label: 'DISCLAIMER',
    body: 'This article provides general, estimate-based information for educational purposes. Actual timelines can vary based on individual circumstances. It is not a substitute for professional advice specific to your situation.',
  },
};

export function ArticleDisclaimer({ categorySlug, glow }: { categorySlug?: string | null; glow: string }) {
  const copy = (categorySlug && DISCLAIMERS[categorySlug.toLowerCase()]) || DISCLAIMERS.general;
  return (
    <div
      className="ios-card-nested anim-fade-up mb-6 p-4 flex gap-3 items-start"
      style={{ border: `1px solid rgba(${glow}, 0.25)`, borderLeft: `3px solid rgb(${glow})` }}
      role="note"
      aria-label={copy.label}
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">{copy.icon}</span>
      <div className="min-w-0">
        <p className="text-caption font-bold mb-1" style={{ color: `rgb(${glow})`, letterSpacing: '0.05em' }}>{copy.label}</p>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{copy.body}</p>
      </div>
    </div>
  );
}
EOF
echo "  wrote $COMPONENTS_DIR/ArticleDisclaimer.tsx"

LAYOUT_FILE="$COMPONENTS_DIR/ArticleLayout.tsx"

if [[ ! -f "$LAYOUT_FILE" ]]; then
  echo "$LAYOUT_FILE not found -- check COMPONENTS_DIR path at top of this script."
  exit 1
fi

if ! grep -q "ArticleDisclaimer" "$LAYOUT_FILE"; then
  python3 - "$LAYOUT_FILE" << 'PYEOF'
import sys
path = sys.argv[1]
src = open(path).read()

src = src.replace(
    "import { ArticleFeaturedPiece } from './ArticleFeaturedPiece';",
    "import { ArticleFeaturedPiece } from './ArticleFeaturedPiece';\nimport { ArticleDisclaimer } from './ArticleDisclaimer';"
)

old_fallback = "const heroImageUrl = article.heroImageUrl || article.category?.featureImageUrl || '/images/default-article-hero.svg';"
new_fallback = (
    "const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {\n"
    "    health: '/images/defaults/health.jpg',\n"
    "    finance: '/images/defaults/finance.jpg',\n"
    "    scam: '/images/defaults/scam.jpg',\n"
    "  };\n"
    "  const categoryDefault = CATEGORY_DEFAULT_IMAGES[article.category?.slug?.toLowerCase() ?? ''] || '/images/defaults/general.jpg';\n"
    "  const heroImageUrl = article.heroImageUrl || article.category?.featureImageUrl || categoryDefault;"
)
src = src.replace(old_fallback, new_fallback)

src = src.replace(
    "      <ArticleTableOfContents headings={tocHeadings} glow={glow} />",
    "      <ArticleDisclaimer categorySlug={article.category?.slug} glow={glow} />\n\n      <ArticleTableOfContents headings={tocHeadings} glow={glow} />"
)

open(path, 'w').write(src)
print("  patched", path)
PYEOF
else
  echo "  already patched -- skipping"
fi

echo ""
echo "Done. Review with: git diff -- $COMPONENTS_DIR/ArticleLayout.tsx"
