import Link from 'next/link';

const CATS=[
  {slug:'holidays',     label:'Holidays',      emoji:'🎄', cls:'gc-holidays'},
  {slug:'sports',       label:'Sports',        emoji:'⚽', cls:'gc-sports'},
  {slug:'finance',      label:'Finance',       emoji:'💰', cls:'gc-finance'},
  {slug:'tech',         label:'Tech',          emoji:'💻', cls:'gc-tech'},
  {slug:'nature',       label:'Nature',        emoji:'🌍', cls:'gc-nature'},
  {slug:'shopping',     label:'Shopping',      emoji:'🛍️', cls:'gc-shopping'},
  {slug:'entertainment',label:'Entertainment', emoji:'🎬', cls:'gc-entertainment'},
  {slug:'space',        label:'Space',         emoji:'🚀', cls:'gc-space'},
];

export function CategoryStrip(){
  return(
    <div className="py-3" style={{ borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)', background: 'var(--bg-elevated-2)' }}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sg">
          {CATS.map(c=>(
            <Link key={c.slug} href={'/categories/'+c.slug}
              className={`ios-card interactive glow ${c.cls} anim-fade-up flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap`}
              style={{ color: 'var(--text-secondary)' }}>
              <span>{c.emoji}</span><span>{c.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
