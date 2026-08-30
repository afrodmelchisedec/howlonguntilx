const fs = require('fs')
const path = require('path')

function wf(p, c) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, c.trimStart(), 'utf8')
  console.log('  ✓', p)
}

const DIR = 'apps/web/src/components/premium'
console.log('\n  Recreating missing premium components...\n')

// ── RiskTimeline ─────────────────────────────────────────
wf(`${DIR}/RiskTimeline.tsx`, `
'use client'
import { useState, useEffect } from 'react'

interface TimePoint { label: string; risk: number; note: string }

function buildTimeline(category: string, query: string): TimePoint[] {
  const q = query.toLowerCase()
  if (category === 'food') {
    if (q.includes('rice') || q.includes('chicken') || q.includes('meat')) return [
      { label:'0 hrs', risk:2,  note:'Just cooked — safe' },
      { label:'1 hr',  risk:8,  note:'Still within safe window' },
      { label:'2 hrs', risk:35, note:'Approaching danger zone' },
      { label:'3 hrs', risk:62, note:'Bacteria multiplying rapidly' },
      { label:'4 hrs', risk:78, note:'High risk — discard advised' },
      { label:'6 hrs', risk:91, note:'Very high bacterial load' },
      { label:'8 hrs', risk:97, note:'Extremely unsafe — discard' },
    ]
    return [
      { label:'0 hrs', risk:3,  note:'Safe if freshly prepared' },
      { label:'2 hrs', risk:40, note:'Threshold — refrigerate now' },
      { label:'4 hrs', risk:75, note:'High risk' },
      { label:'6 hrs', risk:92, note:'Unsafe' },
    ]
  }
  if (category === 'travel') return [
    { label:'Day 1', risk:15, note:'Arrival — gut flora strong' },
    { label:'Day 2', risk:28, note:'Exposure begins' },
    { label:'Day 3', risk:42, note:'Peak risk window' },
    { label:'Day 7', risk:30, note:'Body adjusting' },
    { label:'Day 14',risk:22, note:'Significant adaptation' },
    { label:'Day 30',risk:14, note:'Near-local immunity' },
  ]
  if (category === 'health') return [
    { label:'Day 0', risk:80, note:'Symptoms at peak' },
    { label:'Day 1', risk:70, note:'Still symptomatic' },
    { label:'Day 2', risk:55, note:'Gradual improvement' },
    { label:'Day 3', risk:40, note:'Significantly better' },
    { label:'Day 5', risk:22, note:'Near recovery' },
    { label:'Day 7', risk:10, note:'Return to normal' },
  ]
  return [
    { label:'Now',     risk:60, note:'Current risk' },
    { label:'+1 day',  risk:50, note:'If unchanged' },
    { label:'+1 week', risk:35, note:'With precautions' },
    { label:'+1 month',risk:15, note:'Long term' },
  ]
}

interface Props { category: string; verdict: string; query: string; dark: boolean }

export function RiskTimeline({ category, verdict, query, dark }: Props) {
  const [hovered, setHovered] = useState<number|null>(null)
  const [animated, setAnimated] = useState(false)
  const points = buildTimeline(category, query)
  const W=580, H=180, PAD={t:20,r:20,b:40,l:40}
  const chartW=W-PAD.l-PAD.r, chartH=H-PAD.t-PAD.b

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  const pts = points.map((p,i) => ({
    x: PAD.l + (i/(points.length-1))*chartW,
    y: PAD.t + chartH - (p.risk/100)*chartH,
    ...p
  }))
  const pathD = animated ? pts.map((p,i)=>(i===0?\`M \${p.x} \${p.y}\`:\`L \${p.x} \${p.y}\`)).join(' ') : \`M \${pts[0].x} \${pts[0].y}\`
  const areaD = animated ? \`\${pathD} L \${pts[pts.length-1].x} \${PAD.t+chartH} L \${pts[0].x} \${PAD.t+chartH} Z\` : ''
  const riskColor=(r:number)=> r>70?'#FF3B30':r>40?'#FF9500':'#34C759'
  const hov = hovered!==null ? pts[hovered] : null
  const bg=dark?'#1C1C1E':'#fff', border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)', text=dark?'#fff':'#000', sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)', grid=dark?'rgba(84,84,88,0.3)':'rgba(60,60,67,0.08)'

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'20px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro Feature</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>📈 Risk Timeline</h3>
          <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>How risk changes over time</p>
        </div>
        {hov && (
          <div style={{background:riskColor(hov.risk),color:'#fff',borderRadius:10,padding:'8px 14px',textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:800}}>{hov.risk}%</div>
            <div style={{fontSize:11}}>{hov.label}</div>
          </div>
        )}
      </div>
      <svg width="100%" viewBox={\`0 0 \${W} \${H}\`} style={{overflow:'visible',display:'block'}}>
        {[0,25,50,75,100].map(pct => {
          const y=PAD.t+chartH-(pct/100)*chartH
          return (<g key={pct}>
            <line x1={PAD.l} y1={y} x2={PAD.l+chartW} y2={y} stroke={grid} strokeWidth={1} strokeDasharray="4,4"/>
            <text x={PAD.l-6} y={y+4} fontSize={10} fill={sub} textAnchor="end" fontFamily="system-ui">{pct}%</text>
          </g>)
        })}
        {areaD && <>
          <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF3B30" stopOpacity="0.3"/><stop offset="100%" stopColor="#FF3B30" stopOpacity="0.02"/></linearGradient></defs>
          <path d={areaD} fill="url(#rg)"/>
        </>}
        <path d={pathD} fill="none" stroke="#FF3B30" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{transition:'all 1.2s ease'}}/>
        {pts.map((p,i) => (
          <g key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
            <circle cx={p.x} cy={p.y} r={hovered===i?7:5} fill={riskColor(p.risk)} stroke={bg} strokeWidth={2} style={{transition:'r 0.2s'}}/>
            <text x={p.x} y={PAD.t+chartH+16} fontSize={10} fill={sub} textAnchor="middle" fontFamily="system-ui">{p.label}</text>
            {hovered===i && (
              <foreignObject x={p.x-90} y={p.y-52} width={180} height={46}>
                <div style={{background:dark?'#000':'#111',color:'#fff',borderRadius:8,padding:'6px 10px',fontSize:11,textAlign:'center',lineHeight:1.4}}>{p.note}</div>
              </foreignObject>
            )}
          </g>
        ))}
      </svg>
      <p style={{fontSize:11,color:sub,margin:'8px 0 0',textAlign:'center'}}>Hover over points for details</p>
    </div>
  )
}
`)

// ── SafetyScorecard ──────────────────────────────────────
wf(`${DIR}/SafetyScorecard.tsx`, `
'use client'
import { useState } from 'react'

interface Dimension { label:string; score:number; description:string; icon:string }

function getDimensions(category:string, verdict:string, query:string): Dimension[] {
  const safe = verdict==='safe'?85:verdict==='unsafe'?12:45
  if (category==='food') return [
    {label:'Temperature Control',score:query.includes('fridge')?80:15,description:'How well temperature is managed',icon:'🌡️'},
    {label:'Time Safety',score:query.includes('overnight')||query.includes('hour')?20:60,description:'Time vs safe window',icon:'⏱️'},
    {label:'Bacterial Risk',score:Math.max(5,100-safe),description:'Likelihood of bacterial growth',icon:'🦠'},
    {label:'Toxin Risk',score:query.includes('rice')?85:35,description:'Risk of toxin production',icon:'☠️'},
    {label:'Storage Safety',score:query.includes('fridge')?85:20,description:'Appropriateness of storage',icon:'🧊'},
  ]
  if (category==='scam') return [
    {label:'Identity Risk',score:75,description:'Risk to personal identity',icon:'🪪'},
    {label:'Financial Risk',score:query.includes('crypto')||query.includes('money')?90:30,description:'Risk of financial loss',icon:'💰'},
    {label:'Data Exposure',score:query.includes('wifi')?70:25,description:'Risk of data interception',icon:'📡'},
    {label:'Account Security',score:query.includes('2fa')?10:65,description:'Current account protection',icon:'🔐'},
    {label:'Reversibility',score:query.includes('crypto')?5:60,description:'How easily damage can be undone',icon:'↩️'},
  ]
  if (category==='travel') return [
    {label:'Personal Safety',score:safe,description:'Direct physical safety',icon:'🛡️'},
    {label:'Local Risk Level',score:verdict==='safe'?20:65,description:'Risk in local environment',icon:'📍'},
    {label:'Health Infrastructure',score:query.includes('london')||query.includes('tokyo')?95:45,description:'Quality of local medical care',icon:'🏥'},
    {label:'Precaution Ease',score:70,description:'How easily precautions can be taken',icon:'✅'},
    {label:'Tourist Risk',score:verdict==='safe'?15:55,description:'Specific risk for visitors',icon:'✈️'},
  ]
  return [
    {label:'Immediate Risk',score:verdict==='unsafe'?85:50,description:'Risk requiring immediate action',icon:'🚨'},
    {label:'Long-term Impact',score:25,description:'Potential long-term effects',icon:'📅'},
    {label:'Population Safety',score:safe,description:'Safety for general population',icon:'👥'},
    {label:'Recovery Ease',score:verdict==='safe'?90:60,description:'How easily effects are reversed',icon:'💚'},
    {label:'Medical Consensus',score:85,description:'Strength of scientific evidence',icon:'🔬'},
  ]
}

interface Props { category:string; verdict:string; query:string; dark:boolean }

export function SafetyScorecard({ category, verdict, query, dark }: Props) {
  const [selected, setSelected] = useState<number|null>(null)
  const dims = getDimensions(category, verdict, query)
  const overall = Math.round(dims.reduce((s,d)=>s+d.score,0)/dims.length)
  const bg=dark?'#1C1C1E':'#fff', border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)', text=dark?'#fff':'#000', sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)', card=dark?'#2C2C2E':'#F2F2F7'
  const sc=(s:number)=>s>66?'#34C759':s>33?'#FF9500':'#FF3B30'
  const sl=(s:number)=>s>66?'Low Risk':s>33?'Moderate':'High Risk'
  const N=dims.length, CX=120, CY=110, R=80
  const angles=dims.map((_,i)=>(i*2*Math.PI)/N-Math.PI/2)
  const toXY=(a:number,r:number)=>({x:CX+r*Math.cos(a),y:CY+r*Math.sin(a)})
  const dataPoints=dims.map((d,i)=>toXY(angles[i],(d.score/100)*R))
  const dataPath=dataPoints.map((p,i)=>(i===0?\`M \${p.x} \${p.y}\`:\`L \${p.x} \${p.y}\`)).join(' ')+' Z'
  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'20px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro Feature</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>🎯 Safety Scorecard</h3>
        </div>
        <div style={{textAlign:'center',background:card,border:\`1px solid \${border}\`,borderRadius:12,padding:'12px 20px'}}>
          <div style={{fontSize:32,fontWeight:900,color:sc(100-overall)}}>{overall}</div>
          <div style={{fontSize:11,color:sub}}>Risk Score</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20,alignItems:'start'}}>
        <svg width={240} height={220} style={{overflow:'visible'}}>
          {[0.25,0.5,0.75,1].map((level,li)=>{
            const pts=angles.map(a=>toXY(a,level*R))
            const d=pts.map((p,i)=>(i===0?\`M \${p.x} \${p.y}\`:\`L \${p.x} \${p.y}\`)).join(' ')+' Z'
            return <path key={li} d={d} fill="none" stroke={dark?'#2C2C2E':'#E5E5EA'} strokeWidth={1}/>
          })}
          {angles.map((a,i)=>{const end=toXY(a,R);return <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke={dark?'#2C2C2E':'#E5E5EA'} strokeWidth={1}/>})}
          <path d={dataPath} fill="#FF3B30" fillOpacity={0.15} stroke="#FF3B30" strokeWidth={2}/>
          {dataPoints.map((p,i)=>(
            <circle key={i} cx={p.x} cy={p.y} r={selected===i?6:4} fill={sc(100-dims[i].score)} stroke={bg} strokeWidth={2} style={{cursor:'pointer',transition:'r 0.2s'}} onMouseEnter={()=>setSelected(i)} onMouseLeave={()=>setSelected(null)}/>
          ))}
          {dims.map((d,i)=>{const pos=toXY(angles[i],R+18);return <text key={i} x={pos.x} y={pos.y} fontSize={9} fill={selected===i?'#FF3B30':sub} textAnchor="middle" dominantBaseline="middle" fontFamily="system-ui">{d.icon}</text>})}
        </svg>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {dims.map((d,i)=>(
            <div key={i} style={{padding:'10px 12px',background:selected===i?card:'transparent',borderRadius:8,cursor:'pointer',transition:'background 0.2s',border:\`1px solid \${selected===i?'#FF3B3044':'transparent'}\`}} onMouseEnter={()=>setSelected(i)} onMouseLeave={()=>setSelected(null)}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:600,color:text}}>{d.icon} {d.label}</span>
                <span style={{fontSize:12,fontWeight:700,color:sc(100-d.score)}}>{sl(100-d.score)}</span>
              </div>
              <div style={{height:6,background:dark?'#2C2C2E':'#E5E5EA',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:\`\${d.score}%\`,height:'100%',background:sc(100-d.score),borderRadius:3,transition:'width 1s ease'}}/>
              </div>
              {selected===i&&<p style={{fontSize:11,color:sub,margin:'6px 0 0'}}>{d.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
`)

// ── ComparisonTable ──────────────────────────────────────
wf(`${DIR}/ComparisonTable.tsx`, `
'use client'
import { useState } from 'react'

interface CompItem { name:string;icon:string;safeWindow:string;risk:string;riskScore:number;tip:string;verdict:'safe'|'risky'|'unsafe' }

function getComparisons(category:string, query:string):{title:string;items:CompItem[]} {
  const q=query.toLowerCase()
  if (category==='food') {
    if (q.includes('rice')||q.includes('pasta')) return {title:'Starchy Foods at Room Temperature',items:[
      {name:'Cooked rice',icon:'🍚',safeWindow:'2 hours',risk:'High',riskScore:90,tip:'Bacillus cereus toxins survive reheating',verdict:'unsafe'},
      {name:'Cooked pasta',icon:'🍝',safeWindow:'2 hours',risk:'High',riskScore:82,tip:'Same risk as rice — refrigerate promptly',verdict:'unsafe'},
      {name:'Cooked potato',icon:'🥔',safeWindow:'2 hours',risk:'Medium',riskScore:60,tip:'Botulinum risk if foil-wrapped',verdict:'risky'},
      {name:'Bread',icon:'🍞',safeWindow:'3-5 days',risk:'Low',riskScore:18,tip:'Mould risk — check before eating',verdict:'safe'},
    ]}
    return {title:'Food Storage Safety Comparison',items:[
      {name:'Room temperature',icon:'🌡️',safeWindow:'2 hours',risk:'High',riskScore:80,tip:'Bacteria double every 20 mins in danger zone',verdict:'unsafe'},
      {name:'Refrigerator 4°C',icon:'❄️',safeWindow:'3-5 days',risk:'Low',riskScore:15,tip:'Best option for most cooked foods',verdict:'safe'},
      {name:'Freezer -18°C',icon:'🧊',safeWindow:'1-3 months',risk:'Very Low',riskScore:5,tip:'Pauses bacterial growth completely',verdict:'safe'},
    ]}
  }
  if (category==='scam') return {title:'Password Security Method Comparison',items:[
    {name:'Reused weak passwords',icon:'😰',safeWindow:'Until breach',risk:'Critical',riskScore:97,tip:'81% of breaches involve stolen/reused passwords',verdict:'unsafe'},
    {name:'Strong unique passwords',icon:'🧠',safeWindow:'Limited',risk:'Medium',riskScore:50,tip:'Hard to maintain across many accounts',verdict:'risky'},
    {name:'Password manager only',icon:'🔑',safeWindow:'Years',risk:'Low',riskScore:18,tip:'Major improvement — highly recommended',verdict:'safe'},
    {name:'Password manager + 2FA',icon:'🛡️',safeWindow:'Very long',risk:'Very Low',riskScore:5,tip:'Blocks 99.9% of automated attacks',verdict:'safe'},
  ]}
  if (category==='travel') return {title:'Water Safety Options',items:[
    {name:'Tap water (risky region)',icon:'🚰',safeWindow:'Never',risk:'High',riskScore:75,tip:'Waterborne illness risk for visitors',verdict:'unsafe'},
    {name:'Bottled water (sealed)',icon:'🍶',safeWindow:'Check expiry',risk:'Low',riskScore:10,tip:'Ensure seal is unbroken',verdict:'safe'},
    {name:'Boiled water',icon:'♨️',safeWindow:'After cooling',risk:'Very Low',riskScore:5,tip:'Kills all pathogens effectively',verdict:'safe'},
    {name:'Filter (LifeStraw)',icon:'💧',safeWindow:'Per filter life',risk:'Very Low',riskScore:8,tip:'Excellent for travel — removes 99.9% pathogens',verdict:'safe'},
  ]}
  return {title:'Safety Level Comparison',items:[
    {name:'No precautions',icon:'❌',safeWindow:'Unpredictable',risk:'High',riskScore:80,tip:'Always take basic precautions',verdict:'unsafe'},
    {name:'Basic precautions',icon:'⚠️',safeWindow:'Moderate',risk:'Medium',riskScore:45,tip:'Reduces risk significantly',verdict:'risky'},
    {name:'Full precautions',icon:'✅',safeWindow:'Long-term',risk:'Low',riskScore:12,tip:'Best practice approach',verdict:'safe'},
  ]}
}

interface Props { category:string;verdict:string;query:string;dark:boolean }

export function ComparisonTable({ category, verdict, query, dark }: Props) {
  const [sortBy,setSortBy]=useState<'risk'|'name'>('risk')
  const {title,items}=getComparisons(category,query)
  const sorted=[...items].sort((a,b)=>sortBy==='risk'?b.riskScore-a.riskScore:a.name.localeCompare(b.name))
  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)',row=dark?'#2C2C2E':'#F2F2F7'
  const vc:any={safe:{bg:dark?'#0F2A1A':'#EAF3DE',text:'#34C759'},risky:{bg:dark?'#2A1A0A':'#FAEEDA',text:'#FF9500'},unsafe:{bg:dark?'#2A0A0A':'#FCEBEB',text:'#FF3B30'}}
  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'20px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro Feature</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>⚖️ Comparison Table</h3>
          <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>{title}</p>
        </div>
        <div style={{display:'flex',gap:6}}>
          {(['risk','name'] as const).map(s=>(
            <button key={s} onClick={()=>setSortBy(s)} style={{padding:'5px 12px',background:sortBy===s?'#FF3B30':row,color:sortBy===s?'#fff':sub,border:\`1px solid \${border}\`,borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:sortBy===s?700:400}}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {sorted.map((item,i)=>(
        <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 100px 80px 80px',gap:8,padding:'12px',background:i%2===0?row:'transparent',borderRadius:8,marginBottom:4,alignItems:'center'}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:text}}>{item.icon} {item.name}</div>
            <div style={{fontSize:11,color:sub,marginTop:2}}>{item.tip}</div>
          </div>
          <div style={{fontSize:12,color:sub}}>{item.safeWindow}</div>
          <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700,background:vc[item.verdict].bg,color:vc[item.verdict].text}}>{item.risk}</span>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{flex:1,height:6,background:dark?'#2C2C2E':'#E5E5EA',borderRadius:3,overflow:'hidden'}}>
              <div style={{width:\`\${item.riskScore}%\`,height:'100%',background:vc[item.verdict].text,borderRadius:3}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:vc[item.verdict].text,width:28,textAlign:'right'}}>{item.riskScore}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
`)

// ── SafetyActionPlan ─────────────────────────────────────
wf(`${DIR}/SafetyActionPlan.tsx`, `
'use client'
import { useState, useEffect } from 'react'

interface Step { id:string;priority:'urgent'|'high'|'medium'|'low';action:string;detail:string;timeframe:string;icon:string }

function getSteps(category:string, verdict:string, query:string): Step[] {
  if (category==='food') return [
    {id:'discard',priority:'urgent',icon:'🗑️',action:'Discard unsafe food immediately',detail:'Do not taste it. Bacterial toxins can be present without visible spoilage or smell.',timeframe:'Right now'},
    {id:'clean',priority:'high',icon:'🧼',action:'Clean all surfaces that contacted the food',detail:'Use hot soapy water or food-safe sanitiser on plates, utensils and surfaces.',timeframe:'Next 5 minutes'},
    {id:'store',priority:'high',icon:'❄️',action:'Refrigerate future portions within 1 hour',detail:'Divide into shallow containers to cool quickly. Fridge should be at or below 4°C.',timeframe:'Every time you cook'},
    {id:'label',priority:'medium',icon:'🏷️',action:'Label containers with date',detail:'Use masking tape and a marker to remove guesswork about storage duration.',timeframe:'Today'},
    {id:'thermometer',priority:'low',icon:'🌡️',action:'Get a food thermometer',detail:'Check internal temperatures: chicken 74°C, beef 71°C, fish 63°C.',timeframe:'This week'},
  ]
  if (category==='scam') return [
    {id:'pw',priority:'urgent',icon:'🔑',action:'Install a password manager today',detail:'Bitwarden is free and open source. Generate unique passwords for every account.',timeframe:'Today'},
    {id:'2fa',priority:'urgent',icon:'📱',action:'Enable 2FA on email and bank accounts',detail:'Download Google Authenticator or Authy. Enable 2FA in account security settings.',timeframe:'Next 30 minutes'},
    {id:'breach',priority:'high',icon:'🔍',action:'Check if your email has been breached',detail:'Visit haveibeenpwned.com. If breached, change those passwords immediately.',timeframe:'Today'},
    {id:'update',priority:'high',icon:'⬆️',action:'Update all software and operating systems',detail:'Most breaches exploit known vulnerabilities that patches already fix.',timeframe:'This week'},
    {id:'vpn',priority:'medium',icon:'🌐',action:'Use a VPN on public WiFi',detail:'Mullvad or ProtonVPN are privacy-focused. Never use free VPNs.',timeframe:'Before next public WiFi session'},
  ]
  if (category==='health') return [
    {id:'temp',priority:'urgent',icon:'🌡️',action:'Take your temperature accurately',detail:'Above 39.4°C (103°F) — seek medical attention. Above 40°C — emergency.',timeframe:'Right now'},
    {id:'rest',priority:'urgent',icon:'🛏️',action:'Rest completely — no exercise',detail:'Exercise raises core temperature further and can worsen a manageable fever.',timeframe:'Until 24hrs fever-free'},
    {id:'hydrate',priority:'high',icon:'💧',action:'Drink at least 2-3 litres of water today',detail:'Fever increases fluid loss. Electrolyte drinks can help if you cannot eat.',timeframe:'Today and tomorrow'},
    {id:'medication',priority:'high',icon:'💊',action:'Take paracetamol or ibuprofen to manage temperature',detail:'Follow package dosing instructions. Take ibuprofen with food.',timeframe:'Every 4-6 hours as needed'},
    {id:'doctor',priority:'medium',icon:'🏥',action:'Contact a doctor if fever persists beyond 3 days',detail:'Telehealth available 24/7 online. Do not wait if symptoms worsen rapidly.',timeframe:'Day 3 if not improving'},
  ]
  return [
    {id:'advisory',priority:'urgent',icon:'📋',action:'Check your government travel advisory',detail:'UK: gov.uk/foreign-travel-advice, US: travel.state.gov',timeframe:'Before travelling'},
    {id:'insurance',priority:'high',icon:'🛡️',action:'Get comprehensive travel and medical insurance',detail:'Ensure it covers emergency evacuation and hospital care.',timeframe:'At least 2 weeks before travel'},
    {id:'vaccinations',priority:'high',icon:'💉',action:'Check vaccination requirements 6-8 weeks before travel',detail:'Some vaccines require multiple doses over weeks.',timeframe:'6-8 weeks before departure'},
    {id:'water',priority:'medium',icon:'💧',action:'Pack water purification supplies',detail:'LifeStraw, Sawyer filter, or iodine tablets.',timeframe:'Before packing'},
  ]
}

interface Props { category:string;verdict:string;query:string;dark:boolean;userName?:string }

export function SafetyActionPlan({ category, verdict, query, dark, userName }: Props) {
  const key=\`isitsafe_plan_\${query.slice(0,30).replace(/\\s/g,'_')}\`
  const [checked,setChecked]=useState<Set<string>>(new Set())
  const steps=getSteps(category,verdict,query)

  useEffect(()=>{ try{const s=localStorage.getItem(key);if(s)setChecked(new Set(JSON.parse(s)))}catch{} },[key])

  function toggle(id:string) {
    setChecked(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);localStorage.setItem(key,JSON.stringify([...n]));return n})
  }

  const completed=steps.filter(s=>checked.has(s.id)).length
  const progress=Math.round((completed/steps.length)*100)
  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)'
  const pc:any={urgent:'#FF3B30',high:'#FF9500',medium:'#007AFF',low:'#34C759'}
  const pl:any={urgent:'🚨 Urgent',high:'⚡ High',medium:'📌 Medium',low:'✅ Low'}

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'22px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro Feature</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>📋 {userName?userName.split(' ')[0]+"'s ":''}Safety Action Plan</h3>
          <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>Personalised steps — progress saves automatically</p>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:800,color:progress===100?'#34C759':'#FF3B30'}}>{progress}%</div>
          <div style={{fontSize:11,color:sub}}>complete</div>
        </div>
      </div>
      <div style={{height:6,background:dark?'#2C2C2E':'#E5E5EA',borderRadius:3,overflow:'hidden',marginBottom:18}}>
        <div style={{width:\`\${progress}%\`,height:'100%',background:progress===100?'#34C759':'#FF3B30',borderRadius:3,transition:'width 0.5s ease'}}/>
      </div>
      {steps.map((step,i)=>(
        <div key={step.id} onClick={()=>toggle(step.id)}
          style={{display:'flex',gap:14,padding:'12px 14px',marginBottom:8,borderRadius:10,cursor:'pointer',opacity:checked.has(step.id)?0.6:1,transition:'all 0.2s',border:\`1px solid \${checked.has(step.id)?'#34C759':border}\`,background:checked.has(step.id)?(dark?'#0F2A1A':'#EAF3DE'):'transparent'}}>
          <div style={{width:22,height:22,borderRadius:'50%',border:\`2px solid \${checked.has(step.id)?'#34C759':pc[step.priority]}\`,background:checked.has(step.id)?'#34C759':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,transition:'all 0.2s'}}>
            {checked.has(step.id)&&<span style={{color:'#fff',fontSize:12,fontWeight:700}}>✓</span>}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
              <span style={{fontSize:14}}>{step.icon}</span>
              <span style={{fontSize:14,fontWeight:600,color:checked.has(step.id)?sub:text,textDecoration:checked.has(step.id)?'line-through':'none'}}>{step.action}</span>
              <span style={{fontSize:10,padding:'1px 7px',borderRadius:10,background:pc[step.priority]+'22',color:pc[step.priority],fontWeight:700,flexShrink:0}}>{pl[step.priority]}</span>
            </div>
            <p style={{margin:'0 0 4px',fontSize:13,color:sub,lineHeight:1.5}}>{step.detail}</p>
            <span style={{fontSize:11,color:'#007AFF',fontWeight:600}}>⏰ {step.timeframe}</span>
          </div>
        </div>
      ))}
      {progress===100&&<div style={{marginTop:12,padding:'14px',background:dark?'#0F2A1A':'#EAF3DE',borderRadius:10,textAlign:'center',border:\`1px solid \${dark?'#1A4A2A':'#C5E0A0'}\`}}>
        <div style={{fontSize:24,marginBottom:6}}>🎉</div>
        <p style={{margin:0,fontSize:14,fontWeight:700,color:'#34C759'}}>All steps complete! You are well protected.</p>
      </div>}
    </div>
  )
}
`)

// ── SafetyMonitor ────────────────────────────────────────
wf(`${DIR}/SafetyMonitor.tsx`, `
'use client'
import { useState, useEffect, useCallback } from 'react'

interface LiveEvent { id:number;query:string;location:string;verdict:'safe'|'risky'|'unsafe';time:string;flag:string }

const LOCS=[{city:'London',flag:'🇬🇧'},{city:'New York',flag:'🇺🇸'},{city:'Nairobi',flag:'🇰🇪'},{city:'Tokyo',flag:'🇯🇵'},{city:'Sydney',flag:'🇦🇺'},{city:'Mumbai',flag:'🇮🇳'},{city:'Berlin',flag:'🇩🇪'},{city:'Lagos',flag:'🇳🇬'},{city:'Toronto',flag:'🇨🇦'},{city:'Bangkok',flag:'🇹🇭'},{city:'Kampala',flag:'🇺🇬'},{city:'Dubai',flag:'🇦🇪'}]
const QS:Record<string,string[]>={food:['Is chicken left out overnight safe?','Is reheated rice safe?','Is expired yogurt safe?','Is raw fish safe after 4 hours?'],scam:['Is this email link safe?','Is public WiFi safe without VPN?','Is this website legit?','Is it safe to share my card online?'],health:['Is it safe to exercise with a fever?','Is ibuprofen safe on empty stomach?','Is vaping safer than smoking?'],travel:['Is tap water safe in Bali?','Is street food safe in India?','Is it safe to travel to Colombia?','Is tap water safe in Mexico?']}
const VERDICTS:('safe'|'risky'|'unsafe')[]=['safe','risky','unsafe']
function wv():'safe'|'risky'|'unsafe'{const r=Math.random();return r<0.3?'safe':r<0.8?'risky':'unsafe'}
function ago(ms:number){const s=Math.round(ms/1000);return s<60?\`\${s}s ago\`:\`\${Math.round(s/60)}m ago\`}

interface Props { category:string;dark:boolean }

export function SafetyMonitor({ category, dark }: Props) {
  const [events,setEvents]=useState<LiveEvent[]>([])
  const [total,setTotal]=useState(Math.floor(Math.random()*40000)+80000)
  const [risk,setRisk]=useState(Math.floor(Math.random()*30)+35)
  const [paused,setPaused]=useState(false)
  const id=useState({n:0})[0]
  const qs=QS[category]||QS.food

  const addEvent=useCallback(()=>{
    const loc=LOCS[Math.floor(Math.random()*LOCS.length)]
    const e:LiveEvent={id:++id.n,query:qs[Math.floor(Math.random()*qs.length)],location:loc.city,flag:loc.flag,verdict:wv(),time:new Date().toISOString()}
    setEvents(p=>[e,...p].slice(0,8));setTotal(t=>t+1);setRisk(r=>Math.min(95,Math.max(5,r+(Math.random()-0.5)*4)))
  },[qs])

  useEffect(()=>{for(let i=0;i<5;i++)setTimeout(()=>addEvent(),i*200)},[])
  useEffect(()=>{if(paused)return;const t=setInterval(addEvent,2800+Math.random()*2000);return()=>clearInterval(t)},[paused,addEvent])

  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)',row=dark?'#2C2C2E':'#F2F2F7'
  const vc:any={safe:{bg:dark?'#0F2A1A':'#EAF3DE',text:'#34C759',label:'Safe'},risky:{bg:dark?'#2A1A0A':'#FAEEDA',text:'#FF9500',label:'Risky'},unsafe:{bg:dark?'#2A0A0A':'#FCEBEB',text:'#FF3B30',label:'Not Safe'}}
  const rc=risk>65?'#FF3B30':risk>40?'#FF9500':'#34C759'

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'22px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro Feature</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>🌍 Live Safety Monitor</h3>
          <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>Real-time checks happening globally</p>
        </div>
        <button onClick={()=>setPaused(p=>!p)} style={{padding:'6px 14px',background:paused?'#34C759':row,color:paused?'#fff':sub,border:\`1px solid \${border}\`,borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600}}>
          {paused?'▶ Resume':'⏸ Pause'}
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
        {[{label:'Checks today',value:total.toLocaleString(),color:text},{label:'Global risk index',value:Math.round(risk)+'%',color:rc},{label:'Status',value:paused?'Paused':'Live 🟢',color:paused?sub:'#34C759'}].map((s,i)=>(
          <div key={i} style={{background:row,border:\`1px solid \${border}\`,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:sub,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {events.map((e,i)=>{
          const age=Date.now()-new Date(e.time).getTime()
          const isNew=age<3500
          return (
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:isNew?vc[e.verdict].bg:row,border:\`1px solid \${isNew?vc[e.verdict].text+'44':border}\`,transition:'all 0.5s ease'}}>
              <span style={{fontSize:18,flexShrink:0}}>{e.flag}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:text,fontWeight:isNew?600:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.query}</div>
                <div style={{fontSize:11,color:sub}}>{e.location} · {ago(age)}</div>
              </div>
              <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:700,background:vc[e.verdict].bg,color:vc[e.verdict].text,flexShrink:0}}>{vc[e.verdict].label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
`)

// ── SafetyTracker ────────────────────────────────────────
wf(`${DIR}/SafetyTracker.tsx`, `
'use client'
import { useState, useEffect } from 'react'

interface LogEntry { date:string;query:string;verdict:string;category:string;note:string }
interface Props { dark:boolean;userName?:string;category:string;query:string;verdict:string }

export function SafetyTracker({ dark, userName, category, query, verdict }: Props) {
  const KEY='isitsafe_tracker_log'
  const [log,setLog]=useState<LogEntry[]>([])
  const [note,setNote]=useState('')
  const [added,setAdded]=useState(false)
  const [view,setView]=useState<'heatmap'|'list'>('heatmap')

  useEffect(()=>{try{const s=localStorage.getItem(KEY);if(s)setLog(JSON.parse(s))}catch{}},[])

  function save(entries:LogEntry[]){setLog(entries);localStorage.setItem(KEY,JSON.stringify(entries))}

  function addToLog(){
    const entry:LogEntry={date:new Date().toISOString().slice(0,10),query,verdict,category,note:note.trim()||'No note'}
    save([entry,...log].slice(0,200));setAdded(true);setNote('');setTimeout(()=>setAdded(false),2500)
  }

  const today=new Date()
  const days:{date:string;count:number;verdict:string}[]=[]
  for(let i=69;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i)
    const ds=d.toISOString().slice(0,10)
    const entries=log.filter(e=>e.date===ds)
    const dom=entries.length===0?'':entries.filter(e=>e.verdict==='unsafe').length>0?'unsafe':entries.filter(e=>e.verdict==='risky').length>0?'risky':'safe'
    days.push({date:ds,count:entries.length,verdict:dom})
  }

  let streak=0
  for(let i=0;i<30;i++){const d=new Date(today);d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);if(log.some(e=>e.date===ds))streak++;else break}

  const cell=(v:string,c:number)=>{if(c===0)return dark?'#2C2C2E':'#E5E5EA';if(v==='unsafe')return '#FF3B30';if(v==='risky')return '#FF9500';return '#34C759'}
  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)',input=dark?'#2C2C2E':'#F2F2F7',row=dark?'#2C2C2E':'#F2F2F7'
  const weeks=[];for(let w=0;w<10;w++)weeks.push(days.slice(w*7,w*7+7))

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'22px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro · Personal</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>📅 Safety Tracker</h3>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{textAlign:'center',background:row,border:\`1px solid \${border}\`,borderRadius:10,padding:'8px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:streak>0?'#FF9500':sub}}>🔥 {streak}</div>
            <div style={{fontSize:10,color:sub}}>day streak</div>
          </div>
          <div style={{textAlign:'center',background:row,border:\`1px solid \${border}\`,borderRadius:10,padding:'8px 14px'}}>
            <div style={{fontSize:20,fontWeight:800,color:text}}>{log.length}</div>
            <div style={{fontSize:10,color:sub}}>total</div>
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:16}}>
        {(['heatmap','list'] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:'5px 14px',background:view===v?'#FF3B30':row,color:view===v?'#fff':sub,border:\`1px solid \${border}\`,borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:view===v?700:400}}>
            {v==='heatmap'?'🗓 Heatmap':'📋 Log'}
          </button>
        ))}
      </div>
      {view==='heatmap'&&(
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',gap:3,overflowX:'auto',paddingBottom:4}}>
            {weeks.map((week,wi)=>(
              <div key={wi} style={{display:'flex',flexDirection:'column',gap:3}}>
                {week.map((day,di)=>(
                  <div key={di} title={\`\${day.date}: \${day.count} check\${day.count!==1?'s':''}\`}
                    style={{width:14,height:14,borderRadius:3,background:cell(day.verdict,day.count),cursor:'default',transition:'transform 0.15s'}}
                    onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.4)')}
                    onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}/>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {view==='list'&&(
        <div style={{maxHeight:200,overflowY:'auto',marginBottom:16}}>
          {log.length===0&&<p style={{color:sub,fontSize:13,textAlign:'center',padding:'20px 0'}}>No entries yet</p>}
          {log.slice(0,20).map((e,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:row,borderRadius:8,marginBottom:6,border:\`1px solid \${border}\`}}>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,fontWeight:700,flexShrink:0,background:e.verdict==='safe'?'#EAF3DE':e.verdict==='unsafe'?'#FCEBEB':'#FAEEDA',color:e.verdict==='safe'?'#34C759':e.verdict==='unsafe'?'#FF3B30':'#FF9500'}}>{e.verdict}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.query}</div>
                <div style={{fontSize:11,color:sub}}>{e.date} · {e.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',gap:8}}>
        <input value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addToLog()} placeholder="Add a note (optional)..."
          style={{flex:1,padding:'10px 14px',background:input,border:\`1px solid \${border}\`,borderRadius:10,fontSize:13,color:text,outline:'none'}}/>
        <button onClick={addToLog} style={{padding:'10px 18px',background:added?'#34C759':'#FF3B30',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',transition:'background 0.3s',whiteSpace:'nowrap'}}>
          {added?'✓ Logged!':'+ Log this'}
        </button>
      </div>
    </div>
  )
}
`)

// ── RiskAdjuster ─────────────────────────────────────────
wf(`${DIR}/RiskAdjuster.tsx`, `
'use client'
import { useState } from 'react'

interface Param { id:string;label:string;icon:string;min:number;max:number;value:number;unit:string;step:number }

function getParams(category:string,query:string):{title:string;params:Param[]} {
  if(category==='food')return{title:'Adjust Food Safety Parameters',params:[
    {id:'hours',label:'Hours left out',icon:'⏱️',min:0,max:12,value:2,unit:'hrs',step:0.5},
    {id:'temp',label:'Room temperature',icon:'🌡️',min:15,max:40,value:22,unit:'°C',step:1},
    {id:'reheats',label:'Times reheated',icon:'🔥',min:0,max:5,value:1,unit:'x',step:1},
    {id:'covered',label:'Food was covered',icon:'🫙',min:0,max:1,value:0,unit:'',step:1},
  ]}
  if(category==='scam')return{title:'Adjust Security Risk Parameters',params:[
    {id:'pwlen',label:'Password length',icon:'🔑',min:4,max:32,value:8,unit:' chars',step:1},
    {id:'reuse',label:'Times password reused',icon:'♻️',min:0,max:20,value:3,unit:'x',step:1},
    {id:'twofa',label:'2FA enabled',icon:'📱',min:0,max:1,value:0,unit:'',step:1},
    {id:'manager',label:'Using password manager',icon:'🗝️',min:0,max:1,value:0,unit:'',step:1},
  ]}
  if(category==='health')return{title:'Adjust Health Risk Parameters',params:[
    {id:'temp',label:'Body temperature',icon:'🌡️',min:36,max:41,value:38.5,unit:'°C',step:0.1},
    {id:'days',label:'Days symptomatic',icon:'📅',min:0,max:14,value:2,unit:' days',step:1},
    {id:'exercise',label:'Exercise intensity',icon:'💪',min:0,max:10,value:5,unit:'/10',step:1},
    {id:'hydration',label:'Daily water intake',icon:'💧',min:0,max:4,value:1.5,unit:'L',step:0.5},
  ]}
  return{title:'Adjust Travel Risk Parameters',params:[
    {id:'vaccinated',label:'Vaccinations up to date',icon:'💉',min:0,max:1,value:0,unit:'',step:1},
    {id:'insurance',label:'Travel insurance',icon:'🛡️',min:0,max:1,value:0,unit:'',step:1},
    {id:'duration',label:'Trip duration',icon:'🗓️',min:1,max:30,value:7,unit:' days',step:1},
    {id:'adventure',label:'Activity risk level',icon:'🧗',min:0,max:10,value:5,unit:'/10',step:1},
  ]}
}

function calcRisk(category:string,params:Param[]):number {
  const v:Record<string,number>={}
  params.forEach(p=>{v[p.id]=p.value})
  if(category==='food'){let r=5;r+=Math.min(70,v.hours*12);r+=Math.max(0,(v.temp-20)*2);r+=v.reheats*8;r-=v.covered*15;return Math.min(99,Math.max(1,Math.round(r)))}
  if(category==='scam'){let r=80;r-=Math.min(35,(v.pwlen-4)*2.5);r+=v.reuse*3;r-=v.twofa*30;r-=v.manager*25;return Math.min(99,Math.max(1,Math.round(r)))}
  if(category==='health'){let r=10;r+=Math.max(0,(v.temp-37.5)*20);r+=v.days*3;r+=v.exercise*4;r-=v.hydration*8;return Math.min(99,Math.max(1,Math.round(r)))}
  let r=60;r-=v.vaccinated*25;r-=v.insurance*15;r+=Math.min(15,v.duration*0.5);r+=v.adventure*2;return Math.min(99,Math.max(1,Math.round(r)))
}

function vFromRisk(r:number):{label:string;color:string;bg:string} {
  if(r<30)return{label:'Safe ✅',color:'#34C759',bg:'#EAF3DE'}
  if(r<65)return{label:'Risky ⚠️',color:'#FF9500',bg:'#FAEEDA'}
  return{label:'Not Safe ❌',color:'#FF3B30',bg:'#FCEBEB'}
}

interface Props { category:string;query:string;dark:boolean }

export function RiskAdjuster({ category, query, dark }: Props) {
  const {title,params:init}=getParams(category,query)
  const [params,setParams]=useState<Param[]>(init)
  const risk=calcRisk(category,params)
  const v=vFromRisk(risk)
  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)',slBg=dark?'#2C2C2E':'#F2F2F7'

  function update(id:string,value:number){setParams(p=>p.map(x=>x.id===id?{...x,value}:x))}

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'22px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro · Interactive</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>🎛️ Risk Adjuster</h3>
          <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>{title}</p>
        </div>
        <button onClick={()=>setParams(init)} style={{padding:'6px 14px',background:slBg,border:\`1px solid \${border}\`,borderRadius:20,fontSize:12,color:sub,cursor:'pointer'}}>↺ Reset</button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background:v.bg,borderRadius:12,marginBottom:22,transition:'all 0.4s ease',border:\`1.5px solid \${v.color}44\`}}>
        <div>
          <div style={{fontSize:28,fontWeight:900,color:v.color,transition:'all 0.3s'}}>{v.label}</div>
          <div style={{fontSize:13,color:dark?'#CCC':'#555',marginTop:2}}>Calculated risk: <strong style={{color:v.color}}>{risk}/100</strong></div>
        </div>
        <div style={{flex:1}}>
          <div style={{height:10,background:dark?'#2C2C2E':'#E5E5EA',borderRadius:5,overflow:'hidden'}}>
            <div style={{width:\`\${risk}%\`,height:'100%',background:v.color,borderRadius:5,transition:'width 0.5s ease,background 0.3s ease'}}/>
          </div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:18}}>
        {params.map(p=>{
          const isBool=p.max===1&&p.step===1
          return (
            <div key={p.id}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:600,color:text}}>{p.icon} {p.label}</span>
                <span style={{fontSize:13,fontWeight:800,color:'#FF3B30',minWidth:60,textAlign:'right'}}>{isBool?(p.value===1?'Yes ✓':'No ✗'):\`\${p.value}\${p.unit}\`}</span>
              </div>
              {isBool?(
                <div style={{display:'flex',gap:8}}>
                  {['No','Yes'].map((label,val)=>(
                    <button key={val} onClick={()=>update(p.id,val)} style={{flex:1,padding:'8px',background:p.value===val?'#FF3B30':slBg,color:p.value===val?'#fff':sub,border:\`1px solid \${p.value===val?'#FF3B30':border}\`,borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>{label}</button>
                  ))}
                </div>
              ):(
                <input type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={e=>update(p.id,parseFloat(e.target.value))} style={{width:'100%',accentColor:'#FF3B30',height:6,cursor:'pointer'}}/>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
`)

// ── SmartReminders ───────────────────────────────────────
wf(`${DIR}/SmartReminders.tsx`, `
'use client'
import { useState, useEffect } from 'react'

interface Reminder { id:string;text:string;query:string;triggerAt:number;triggered:boolean;category:string }

function getDefaults(category:string,verdict:string):{text:string;delayMin:number;icon:string}[] {
  if(category==='food')return[
    {text:'Refrigerate food now — 2-hour rule',delayMin:120,icon:'❄️'},
    {text:'Check fridge — is food still safe?',delayMin:60*24*3,icon:'🔍'},
    {text:'Weekly fridge clear — remove old items',delayMin:60*24*7,icon:'🧹'},
  ]
  if(category==='scam')return[
    {text:'Change compromised passwords today',delayMin:60,icon:'🔑'},
    {text:'Enable 2FA on your most important accounts',delayMin:60*24,icon:'📱'},
    {text:'Monthly security audit',delayMin:60*24*30,icon:'🛡️'},
  ]
  if(category==='health')return[
    {text:'Take temperature — monitoring fever',delayMin:120,icon:'🌡️'},
    {text:'Drink water — staying hydrated',delayMin:60,icon:'💧'},
    {text:'Health check-in — how are you feeling?',delayMin:60*24,icon:'💚'},
  ]
  return[
    {text:'Check travel advisory updates',delayMin:60*24*7,icon:'✈️'},
    {text:'Confirm vaccinations are up to date',delayMin:60*24*14,icon:'💉'},
    {text:'Review travel insurance policy',delayMin:60*24*3,icon:'🛡️'},
  ]
}

function fmtDelay(min:number){if(min<60)return \`\${min} min\`;if(min<1440)return \`\${Math.round(min/60)} hr\`;if(min<10080)return \`\${Math.round(min/1440)} day\`;return \`\${Math.round(min/10080)} week\`}
function fmtDT(ts:number){return new Date(ts).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}

interface Props { category:string;query:string;verdict:string;dark:boolean }

export function SmartReminders({ category, query, verdict, dark }: Props) {
  const KEY='isitsafe_reminders'
  const [reminders,setReminders]=useState<Reminder[]>([])
  const [custom,setCustom]=useState('')
  const [delay,setDelay]=useState(60)
  const [notif,setNotif]=useState<NotificationPermission>('default')
  const [added,setAdded]=useState<string|null>(null)
  const defaults=getDefaults(category,verdict)

  useEffect(()=>{try{const s=localStorage.getItem(KEY);if(s)setReminders(JSON.parse(s));if('Notification' in window)setNotif(Notification.permission)}catch{}},[])

  async function reqNotif(){if('Notification' in window){const p=await Notification.requestPermission();setNotif(p)}}

  function addR(text:string,delayMin:number){
    const r:Reminder={id:Math.random().toString(36).slice(2),text,query,triggerAt:Date.now()+delayMin*60000,triggered:false,category}
    const next=[r,...reminders];setReminders(next);localStorage.setItem(KEY,JSON.stringify(next));setAdded(r.id);setTimeout(()=>setAdded(null),2000)
  }

  function removeR(id:string){const next=reminders.filter(r=>r.id!==id);setReminders(next);localStorage.setItem(KEY,JSON.stringify(next))}

  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)',input=dark?'#2C2C2E':'#F2F2F7',row=dark?'#2C2C2E':'#F2F2F7'
  const pending=reminders.filter(r=>!r.triggered)

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'22px 24px',marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
        <div>
          <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro · Reminders</div>
          <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>🔔 Smart Reminders</h3>
          <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>Get notified when safety action is needed</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:pending.length>0?'#FF9500':'#34C759'}}/>
          <span style={{fontSize:12,color:sub}}>{pending.length} pending</span>
        </div>
      </div>
      {notif!=='granted'&&(
        <div style={{padding:'12px 16px',background:dark?'rgba(0,122,255,0.12)':'rgba(0,122,255,0.06)',border:'1px solid rgba(0,122,255,0.25)',borderRadius:10,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:13,color:dark?'rgba(100,180,255,0.9)':'#185FA5'}}>{notif==='denied'?'🔕 Notifications blocked':'🔔 Enable browser notifications'}</span>
          {notif!=='denied'&&<button onClick={reqNotif} style={{padding:'6px 14px',background:'#007AFF',color:'#fff',border:'none',borderRadius:8,fontSize:12,cursor:'pointer',fontWeight:600,flexShrink:0}}>Enable</button>}
        </div>
      )}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:sub,textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:10}}>Quick Add</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {defaults.map((d,i)=>(
            <button key={i} onClick={()=>addR(d.text,d.delayMin)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:row,border:\`1px solid \${border}\`,borderRadius:10,cursor:'pointer',textAlign:'left',transition:'all 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='#FF3B30')}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=border)}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:18}}>{d.icon}</span>
                <span style={{fontSize:13,color:text}}>{d.text}</span>
              </div>
              <span style={{fontSize:11,color:sub,flexShrink:0,marginLeft:8}}>in {fmtDelay(d.delayMin)}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:'14px',background:row,borderRadius:10,border:\`1px solid \${border}\`,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:sub,marginBottom:10}}>✏️ Custom reminder</div>
        <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Enter reminder text..."
          style={{width:'100%',padding:'9px 12px',background:input,border:\`1px solid \${border}\`,borderRadius:8,fontSize:13,color:text,marginBottom:8,boxSizing:'border-box' as any,outline:'none'}}/>
        <div style={{display:'flex',gap:8}}>
          <select value={delay} onChange={e=>setDelay(Number(e.target.value))} style={{flex:1,padding:'8px 10px',background:input,border:\`1px solid \${border}\`,borderRadius:8,fontSize:13,color:text,outline:'none'}}>
            {[{l:'In 30 minutes',v:30},{l:'In 1 hour',v:60},{l:'In 2 hours',v:120},{l:'In 4 hours',v:240},{l:'Tomorrow',v:1440},{l:'In 3 days',v:4320},{l:'In 1 week',v:10080}].map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <button onClick={()=>{if(custom.trim()){addR(custom,delay);setCustom('')}}} style={{padding:'8px 16px',background:'#FF3B30',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Set</button>
        </div>
      </div>
      {pending.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:sub,textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:8}}>⏳ Scheduled ({pending.length})</div>
          {pending.map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:dark?'rgba(0,122,255,0.12)':'rgba(0,122,255,0.06)',borderRadius:10,marginBottom:6,border:'1px solid rgba(0,122,255,0.25)'}}>
              <span style={{fontSize:16}}>🔔</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.text}</div>
                <div style={{fontSize:11,color:sub}}>Fires at {fmtDT(r.triggerAt)}</div>
              </div>
              <button onClick={()=>removeR(r.id)} style={{background:'none',border:'none',color:sub,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
`)

// ── SafetyProfile ────────────────────────────────────────
wf(`${DIR}/SafetyProfile.tsx`, `
'use client'
import { useState, useEffect } from 'react'

interface ProfileData { foodSafety:number;digitalSecurity:number;healthAwareness:number;travelPreparedness:number;overallScore:number;lastUpdated:string }

const QS=[
  {id:'fridge',cat:'foodSafety',text:'How often do you check food expiry dates before eating?',opts:['Never','Sometimes','Usually','Always']},
  {id:'temp',cat:'foodSafety',text:'Do you know the safe temperature range for your fridge?',opts:['No idea','Roughly','Yes (4°C or below)','Yes, I check it regularly']},
  {id:'pwmanager',cat:'digitalSecurity',text:'Do you use a password manager?',opts:['No','Considering it','Sometimes','Yes, always']},
  {id:'twofa',cat:'digitalSecurity',text:'Do you have 2FA enabled on important accounts?',opts:['No','1-2 accounts','Most accounts','All accounts']},
  {id:'meds',cat:'healthAwareness',text:'Do you check if it is safe before taking medications together?',opts:['Never','Sometimes','Usually','Always']},
  {id:'sick',cat:'healthAwareness',text:'Do you modify exercise when sick or unwell?',opts:['Never','Rarely','Usually','Always']},
  {id:'advisory',cat:'travelPreparedness',text:'Do you check travel advisories before travelling?',opts:['Never','Sometimes','Usually','Always']},
  {id:'insurance',cat:'travelPreparedness',text:'Do you get travel insurance for international trips?',opts:['Never','Rarely','Usually','Always']},
]

interface Props { dark:boolean;userName?:string }

export function SafetyProfile({ dark, userName }: Props) {
  const [answers,setAnswers]=useState<Record<string,number>>({})
  const [profile,setProfile]=useState<ProfileData|null>(null)
  const [step,setStep]=useState(0)
  const [show,setShow]=useState(false)
  const [anim,setAnim]=useState(0)
  const KEY='isitsafe_profile'

  useEffect(()=>{try{const s=localStorage.getItem(KEY);if(s){setProfile(JSON.parse(s));setShow(true)}}catch{}},[])
  useEffect(()=>{
    if(profile&&show){let c=0;const t=setInterval(()=>{c+=2;if(c>=profile.overallScore){setAnim(profile.overallScore);clearInterval(t)}else setAnim(c)},20);return()=>clearInterval(t)}
  },[profile,show])

  function answer(val:number){
    const q=QS[step]
    const all={...answers,[q.id]:val}
    setAnswers(all)
    if(step<QS.length-1){setStep(s=>s+1)}
    else{
      const cats:Record<string,number[]>={foodSafety:[],digitalSecurity:[],healthAwareness:[],travelPreparedness:[]}
      QS.forEach(q=>{if(all[q.id]!==undefined)cats[q.cat].push((all[q.id]/3)*100)})
      const avg=(a:number[])=>a.length?Math.round(a.reduce((s,b)=>s+b,0)/a.length):50
      const p:ProfileData={foodSafety:avg(cats.foodSafety),digitalSecurity:avg(cats.digitalSecurity),healthAwareness:avg(cats.healthAwareness),travelPreparedness:avg(cats.travelPreparedness),overallScore:0,lastUpdated:new Date().toISOString()}
      p.overallScore=avg([p.foodSafety,p.digitalSecurity,p.healthAwareness,p.travelPreparedness])
      setProfile(p);setShow(true);localStorage.setItem(KEY,JSON.stringify(p))
    }
  }

  const bg=dark?'#1C1C1E':'#fff',border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)',text=dark?'#fff':'#000',sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)',row=dark?'#2C2C2E':'#F2F2F7'
  const sc=(s:number)=>s>=75?'#34C759':s>=50?'#FF9500':'#FF3B30'
  const sl=(s:number)=>s>=75?'Strong':s>=50?'Moderate':'Needs Work'
  const R=54,C=2*Math.PI*R,dash=C-(anim/100)*C

  return (
    <div style={{background:bg,border:\`1px solid \${border}\`,borderRadius:18,padding:'22px 24px',marginBottom:14}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11,color:'#FF3B30',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>⭐ Pro · Profile</div>
        <h3 style={{fontSize:15,fontWeight:700,color:text,margin:0}}>👤 {userName?userName.split(' ')[0]+"'s ":''}Safety Profile</h3>
        <p style={{fontSize:12,color:sub,margin:'4px 0 0'}}>Your personalised safety awareness score</p>
      </div>
      {!show?(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:sub,marginBottom:8}}>
            <span>Question {step+1} of {QS.length}</span><span>{Math.round((step/QS.length)*100)}% complete</span>
          </div>
          <div style={{height:4,background:dark?'#2C2C2E':'#E5E5EA',borderRadius:2,overflow:'hidden',marginBottom:20}}>
            <div style={{width:\`\${(step/QS.length)*100}%\`,height:'100%',background:'#FF3B30',transition:'width 0.4s ease'}}/>
          </div>
          <h4 style={{fontSize:15,fontWeight:700,color:text,margin:'0 0 16px',lineHeight:1.5}}>{QS[step].text}</h4>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {QS[step].opts.map((opt,i)=>(
              <button key={i} onClick={()=>answer(i)}
                style={{padding:'13px 16px',background:row,border:\`1px solid \${border}\`,borderRadius:10,fontSize:14,color:text,cursor:'pointer',textAlign:'left',fontWeight:500,transition:'all 0.15s'}}
                onMouseEnter={e=>{(e.currentTarget.style.borderColor='#FF3B30');(e.currentTarget.style.background=dark?'#1A0A0A':'#FFF5F5')}}
                onMouseLeave={e=>{(e.currentTarget.style.borderColor=border);(e.currentTarget.style.background=row)}}>
                <span style={{color:'#FF3B30',fontWeight:700,marginRight:10}}>{['A','B','C','D'][i]}.</span>{opt}
              </button>
            ))}
          </div>
        </div>
      ):profile&&(
        <div>
          <div style={{display:'flex',gap:24,alignItems:'center',marginBottom:24}}>
            <svg width={140} height={140} viewBox="0 0 140 140">
              <circle cx={70} cy={70} r={R} fill="none" stroke={dark?'#2C2C2E':'#E5E5EA'} strokeWidth={12}/>
              <circle cx={70} cy={70} r={R} fill="none" stroke={sc(anim)} strokeWidth={12} strokeDasharray={C} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 70 70)" style={{transition:'stroke-dashoffset 0.1s linear,stroke 0.3s'}}/>
              <text x={70} y={65} textAnchor="middle" fontSize={28} fontWeight={900} fill={sc(anim)} fontFamily="system-ui">{anim}</text>
              <text x={70} y={85} textAnchor="middle" fontSize={11} fill={sub} fontFamily="system-ui">/100</text>
            </svg>
            <div>
              <div style={{fontSize:24,fontWeight:800,color:sc(profile.overallScore),marginBottom:4}}>{sl(profile.overallScore)}</div>
              <div style={{fontSize:13,color:sub,lineHeight:1.6}}>Overall Safety Awareness</div>
              <button onClick={()=>{setShow(false);setStep(0);setAnswers({});setAnim(0)}} style={{marginTop:10,padding:'5px 12px',background:'transparent',border:\`1px solid \${border}\`,borderRadius:20,fontSize:11,color:sub,cursor:'pointer'}}>Retake quiz</button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[{l:'Food Safety',s:profile.foodSafety,i:'🍽️'},{l:'Digital Security',s:profile.digitalSecurity,i:'🔐'},{l:'Health Awareness',s:profile.healthAwareness,i:'💊'},{l:'Travel Prep',s:profile.travelPreparedness,i:'✈️'}].map((cat,i)=>(
              <div key={i}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
                  <span style={{fontWeight:600,color:text}}>{cat.i} {cat.l}</span>
                  <span style={{fontWeight:700,color:sc(cat.s)}}>{cat.s}/100 — {sl(cat.s)}</span>
                </div>
                <div style={{height:8,background:dark?'#2C2C2E':'#E5E5EA',borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:\`\${cat.s}%\`,height:'100%',background:sc(cat.s),borderRadius:4,transition:\`width 1.2s ease \${i*0.15}s\`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
`)

// ── PremiumDashboard ─────────────────────────────────────
wf(`${DIR}/PremiumDashboard.tsx`, `
'use client'
import { useState } from 'react'
import { RiskTimeline } from './RiskTimeline'
import { SafetyScorecard } from './SafetyScorecard'
import { ComparisonTable } from './ComparisonTable'
import { SafetyActionPlan } from './SafetyActionPlan'
import { SafetyMonitor } from './SafetyMonitor'
import { SafetyTracker } from './SafetyTracker'
import { RiskAdjuster } from './RiskAdjuster'
import { SmartReminders } from './SmartReminders'
import { SafetyProfile } from './SafetyProfile'

interface Props { category:string;verdict:string;query:string;dark:boolean;user:any }

const TABS=[
  {id:'overview',label:'Overview',icon:'📊'},
  {id:'analysis',label:'Analysis',icon:'🔬'},
  {id:'tools',label:'Tools',icon:'🛠️'},
  {id:'profile',label:'My Profile',icon:'👤'},
  {id:'monitor',label:'Live',icon:'🌍'},
]

export function PremiumDashboard({ category, verdict, query, dark, user }: Props) {
  const [tab,setTab]=useState('overview')
  const bg=dark?'#000':'#F2F2F7', surface=dark?'#1C1C1E':'#fff', border=dark?'rgba(84,84,88,0.6)':'rgba(60,60,67,0.12)', text=dark?'#fff':'#000', sub=dark?'rgba(235,235,245,0.6)':'rgba(60,60,67,0.6)'

  return (
    <div style={{background:bg,borderRadius:22,border:\`1px solid \${border}\`,overflow:'hidden',marginBottom:20,boxShadow:dark?'0 4px 40px rgba(0,0,0,0.5)':'0 4px 24px rgba(0,0,0,0.08)'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#FF3B30,#AF52DE)',padding:'20px 24px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <span style={{fontSize:11,background:'rgba(255,255,255,0.2)',color:'#fff',padding:'2px 10px',borderRadius:20,fontWeight:700}}>
              {user?.plan==='admin'?'🔑 ADMIN':'⭐ PRO'} DASHBOARD
            </span>
            <h2 style={{fontSize:18,fontWeight:800,color:'#fff',margin:'8px 0 0'}}>Safety Intelligence for {user?.name?.split(' ')[0]||'You'}</h2>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.7)',margin:'4px 0 0'}}>{query.charAt(0).toUpperCase()+query.slice(1)}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            {[{l:'Category',v:category},{l:'Verdict',v:verdict==='safe'?'Safe ✅':verdict==='unsafe'?'Not Safe ❌':'Risky ⚠️'}].map((s,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'8px 14px',textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:800,color:'#fff'}}>{s.v}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:'10px 18px',background:tab===t.id?surface:'transparent',color:tab===t.id?text:'rgba(255,255,255,0.7)',border:'none',borderRadius:'10px 10px 0 0',fontSize:13,fontWeight:tab===t.id?700:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,transition:'all 0.2s'}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div style={{padding:'20px 20px 4px',background:bg}}>
        {tab==='overview'&&<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {[
              {icon:'🔥',label:'Risk Level',value:verdict==='safe'?'Low':verdict==='unsafe'?'High':'Medium',color:verdict==='safe'?'#34C759':verdict==='unsafe'?'#FF3B30':'#FF9500'},
              {icon:'📅',label:'Category',value:category.charAt(0).toUpperCase()+category.slice(1),color:'#AF52DE'},
              {icon:'✅',label:'Checks Done',value:String(user?.totalChecks||1),color:'#007AFF'},
              {icon:'🎯',label:'Profile Score',value:(()=>{try{const p=JSON.parse(localStorage.getItem('isitsafe_profile')||'{}');return p.overallScore?p.overallScore+'/100':'Take quiz'}catch{return 'Take quiz'}})(),color:'#FF3B30'},
            ].map((s,i)=>(
              <div key={i} style={{background:surface,border:\`1px solid \${border}\`,borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                <div style={{fontSize:16,fontWeight:800,color:s.color}}>{s.value}</div>
                <div style={{fontSize:11,color:sub}}>{s.label}</div>
              </div>
            ))}
          </div>
          <RiskTimeline category={category} verdict={verdict} query={query} dark={dark}/>
          <SafetyActionPlan category={category} verdict={verdict} query={query} dark={dark} userName={user?.name}/>
        </>}
        {tab==='analysis'&&<>
          <SafetyScorecard category={category} verdict={verdict} query={query} dark={dark}/>
          <ComparisonTable category={category} verdict={verdict} query={query} dark={dark}/>
        </>}
        {tab==='tools'&&<>
          <RiskAdjuster category={category} query={query} dark={dark}/>
          <SmartReminders category={category} query={query} verdict={verdict} dark={dark}/>
          <SafetyTracker dark={dark} userName={user?.name} category={category} query={query} verdict={verdict}/>
        </>}
        {tab==='profile'&&<SafetyProfile dark={dark} userName={user?.name}/>}
        {tab==='monitor'&&<SafetyMonitor category={category} dark={dark}/>}
      </div>
    </div>
  )
}
`)

console.log('\n  All 9 premium components recreated!')
console.log('  Run: pnpm dev\n')
