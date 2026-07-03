const PTS=[
  {icon:'⚡',title:'Real-time to the second',desc:'AI gives "about X days". We show a live clock ticking to the exact second.',cls:'gc-brand'},
  {icon:'📊',title:'Progress visualisation',desc:'See exactly how far through the cycle you are. AI cannot show a live bar.',cls:'gc-sports'},
  {icon:'🔗',title:'Shareable & embeddable',desc:'Share a live link or embed on any site. AI answers vanish when you close the tab.',cls:'gc-finance'},
  {icon:'🌍',title:'Location-aware events',desc:'Salary days, local holidays — we know Uganda vs UK vs US dates.',cls:'gc-nature'},
  {icon:'🔔',title:'Save & get notified',desc:'Sign in to save countdowns and reminders. AI has no memory of yesterday.',cls:'gc-personal'},
  {icon:'📱',title:'Works offline',desc:'Once loaded the clock keeps ticking. AI needs a live connection every time.',cls:'gc-tech'},
];

export function WhyUs(){
  return(
    <div className="mt-8 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <p className="text-caption mb-2 anim-fade-up" style={{ color: 'rgb(var(--accent-brand))' }}>Why not just ask AI?</p>
        <h2 className="text-title1 mb-8 anim-fade-up">6 things we do that AI cannot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sg">
          {PTS.map((p,i)=>(
            <div key={p.title} className={`ios-card glow ${p.cls} anim-fade-up p-5`} style={{animationDelay:(i*80)+'ms'}}>
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="text-headline mb-1.5">{p.title}</div>
              <div className="text-footnote leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}