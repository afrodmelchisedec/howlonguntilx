'use client';
import { TimerCard } from '@/components/countdown/TimerCard';
import { buildCountdownResponse } from '@/lib/countdown';
import { AnimatedMetricCard } from '@/components/ui/AnimatedMetricCard';
import { AnimatedProgressBar } from '@/components/ui/AnimatedProgressBar';
import { AnimatedMilestoneCard } from '@/components/ui/AnimatedMilestoneCard';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface Timer { id: string; name: string; targetDate: Date | string; category: string }

const CC: Record<string, { hex: string; rgb: string }> = {
  holidays:{hex:'#534AB7',rgb:'83,74,183'}, sports:{hex:'#1D9E75',rgb:'29,158,117'},
  finance:{hex:'#D85A30',rgb:'216,90,48'}, personal:{hex:'#D4537E',rgb:'212,83,126'},
  tech:{hex:'#BA7517',rgb:'186,117,23'}, nature:{hex:'#378ADD',rgb:'55,138,221'},
  entertainment:{hex:'#639922',rgb:'99,153,34'}, shopping:{hex:'#E24B4A',rgb:'226,75,74'},
  space:{hex:'#7B5EA7',rgb:'123,94,167'}, health:{hex:'#E85D75',rgb:'232,93,117'},
  work:{hex:'#4A90D9',rgb:'74,144,217'}, family:{hex:'#F5A623',rgb:'245,166,35'},
  education:{hex:'#7ED321',rgb:'126,211,33'}, travel:{hex:'#50E3C2',rgb:'80,227,194'},
};
const fb={hex:'#534AB7',rgb:'83,74,183'};
function C(s?:string){return CC[s??'']??fb;}

function themeColor(varName: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

export function OverviewPanel({timers,popular,onAdd,onDelete,session}:any){
  const chartRef=useRef<HTMLCanvasElement>(null);
  const donutRef=useRef<HTMLCanvasElement>(null);
  const name=session.user.name?.split(' ')[0]??'there';
  const isAdmin=session.user.role==='ADMIN';

  const urgent=timers.filter((t:Timer)=>{const{days_left}=buildCountdownResponse(t.name,new Date(t.targetDate));return days_left<=7&&days_left>=0;});
  const avgProg=timers.length?Math.round(timers.reduce((s:number,t:Timer)=>s+buildCountdownResponse(t.name,new Date(t.targetDate)).progress_percent,0)/timers.length):0;
  const nearest=[...timers].map((t:Timer)=>({...t,days:buildCountdownResponse(t.name,new Date(t.targetDate)).days_left})).filter((t:any)=>t.days>=0).sort((a:any,b:any)=>a.days-b.days)[0];
  const nearestDays=nearest?.days??0;
  const nearestRgb=nearestDays===0?'239,68,68':nearestDays<=3?'249,115,22':nearestDays<=7?'251,191,36':'29,158,117';

  useEffect(()=>{
    if(!chartRef.current||!timers.length)return;
    const tickColor = themeColor('--text-tertiary', '#888');
    const gridColor = themeColor('--border-hairline', 'rgba(0,0,0,0.04)');
    import('chart.js').then(({Chart,registerables})=>{
      Chart.register(...registerables);
      const ex=Chart.getChart(chartRef.current!);if(ex)ex.destroy();
      new Chart(chartRef.current!,{type:'bar',data:{
        labels:timers.slice(0,8).map((t:Timer)=>t.name.slice(0,10)),
        datasets:[{data:timers.slice(0,8).map((t:Timer)=>buildCountdownResponse(t.name,new Date(t.targetDate)).days_left),
          backgroundColor:timers.slice(0,8).map((t:Timer)=>C(t.category).hex),borderRadius:8,borderSkipped:false}]},
        options:{responsive:true,maintainAspectRatio:false,animation:{duration:900,easing:'easeOutQuart'},
          plugins:{legend:{display:false}},
          scales:{x:{ticks:{font:{size:10},color:tickColor},grid:{display:false}},
            y:{ticks:{font:{size:10},color:tickColor},grid:{color:gridColor}}}}});
    });
  },[timers]);

  const catE=Object.entries(timers.reduce((a:any,t:Timer)=>{a[t.category]=(a[t.category]??0)+1;return a;},{}));
  useEffect(()=>{
    if(!donutRef.current||!catE.length)return;
    import('chart.js').then(({Chart,registerables})=>{
      Chart.register(...registerables);
      const ex=Chart.getChart(donutRef.current!);if(ex)ex.destroy();
      new Chart(donutRef.current!,{type:'doughnut',data:{labels:catE.map(([k])=>k),
        datasets:[{data:catE.map(([,v])=>v),backgroundColor:catE.map(([k])=>C(k as string).hex),borderWidth:2,borderColor:'transparent',hoverOffset:8}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'68%',animation:{duration:900},plugins:{legend:{display:false}}}});
    });
  },[timers]);

  const thr=[0,3,10,25,50];const levels=['Start','Beginner','Tracker','Planner','Master'];
  const idx=thr.filter(t=>timers.length>=t).length-1;
  const level=levels[Math.min(idx,4)];const nextThr=thr[Math.min(idx+1,4)];
  const streakProg=Math.min(100,Math.round((timers.length/nextThr)*100));

  return (
    <div className="anim-fade-in">
      {isAdmin&&(
        <div className="ios-card mb-4 flex items-center gap-2 text-xs font-semibold px-4 py-2.5"
          style={{ color: 'rgb(var(--accent-orange))', background: 'rgba(var(--accent-orange),0.08)', border: '1px solid rgba(var(--accent-orange),0.25)' }}>
          Admin mode — all features unlocked
          <Link href="/admin" className="ml-auto underline font-bold">Admin panel</Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 anim-fade-up">
        <div>
          <h1 className="text-title1">Hey, {name} <span className="inline-block">👋</span></h1>
          <p className="text-footnote mt-0.5">{timers.length===0?'Add your first countdown':'Tracking '+timers.length+' countdown'+(timers.length>1?'s':'')}</p>
        </div>
        <button onClick={onAdd} className="btn-filled press">+ Add countdown</button>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 sg">
        <AnimatedMetricCard label="Tracking"     rawValue={timers.length}  sub="countdowns"         rgb="83,74,183" />
        <AnimatedMetricCard label="Nearest"      rawValue={nearestDays}    suffix="d" sub={nearest?.name?.slice(0,14)??'none'} rgb={nearestRgb} />
        <AnimatedMetricCard label="Avg progress" rawValue={avgProg}         suffix="%" sub="to events"    rgb="29,158,117" />
        <AnimatedMetricCard label="Urgent"       rawValue={urgent.length}  sub="within 7 days"      rgb={urgent.length>0?'239,68,68':'150,150,160'} />
      </div>

      {/* streak + milestone */}
      <div className="grid grid-cols-2 gap-3 mb-5 sg">
        <div className="ios-card glow gc-brand p-4 anim-fade-up">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-caption">Your level</p>
              <p className="text-headline mt-0.5">⭐ {level}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular" style={{ color: 'rgb(var(--accent-brand))' }}>{timers.length}</p>
              <p className="text-caption">countdowns</p>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: streakProg+'%', background: 'linear-gradient(90deg, rgb(var(--accent-brand)), rgb(var(--accent-purple)))' }}/>
          </div>
          <p className="text-caption mt-1">{timers.length}/{nextThr} to {levels[Math.min(idx+1,4)]}</p>
        </div>
        {nearest
          ? <AnimatedMilestoneCard name={nearest.name} days={nearestDays} rgb={nearestRgb}/>
          : <div className="ios-card p-4 anim-fade-up"><p className="text-caption mb-1">Next milestone</p><p className="text-footnote mt-2">Add a countdown!</p></div>
        }
      </div>

      {urgent.length > 0 && (
        <div className="ios-card glow gc-family relative overflow-hidden mb-8 p-6 anim-scale-in">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full" style={{ background: 'rgba(var(--accent-orange),0.15)', filter: 'blur(60px)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="pulse-dot w-2 h-2" style={{ background: 'rgb(var(--accent-orange))' }} />
              <p className="text-caption" style={{ color: 'rgb(var(--accent-orange))' }}>Priority Schedule</p>
            </div>
            <div className="space-y-4">
              {urgent.map((t: Timer) => {
                const { days_left, hours_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
                const isFinished = new Date() > new Date(t.targetDate);
                const isUrgent = days_left === 0 && !isFinished;
                return (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isFinished ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full" style={{ background: 'rgba(var(--accent-green),0.15)' }}>
                          <svg className="w-4 h-4" style={{ color: 'rgb(var(--accent-green))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: isUrgent ? 'rgb(var(--accent-red))' : 'rgb(var(--accent-orange))' }} />
                      )}
                      <h4 className="text-headline" style={isFinished ? { color: 'var(--text-tertiary)', textDecoration: 'line-through' } : {}}>
                        {t.name}
                      </h4>
                    </div>
                    <div className="pill" style={{
                      background: isFinished ? 'var(--bg-elevated-2)' : isUrgent ? 'rgba(var(--accent-red),0.12)' : 'rgba(var(--accent-orange),0.12)',
                      color: isFinished ? 'var(--text-tertiary)' : isUrgent ? 'rgb(var(--accent-red))' : 'rgb(var(--accent-orange))',
                    }}>
                      {isFinished ? 'FINISHED' : isUrgent ? `${hours_left}h LEFT` : `${days_left}d AWAY`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {timers.length>0&&(
        <div className="mb-6">
          <p className="text-caption mb-3">Live countdowns</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sg">
            {timers.map((t:Timer, i:number)=><TimerCard key={t.id} timer={t} onDelete={onDelete} index={i}/>)}
          </div>
        </div>
      )}

      {timers.length>0&&(
        <div className="grid grid-cols-3 gap-4 mb-5 sg">
          <div className="ios-card glow gc-brand col-span-2 p-5 anim-fade-up">
            <p className="text-headline mb-3">Days remaining</p>
            <div style={{height:150}}><canvas ref={chartRef}/></div>
          </div>
          <div className="ios-card glow gc-brand p-5 anim-fade-up">
            <p className="text-headline mb-3">By category</p>
            <div style={{height:100}}><canvas ref={donutRef}/></div>
            <div className="flex flex-wrap gap-1 mt-2">
              {catE.map(([k])=>{const col=C(k as string);return(<span key={k as string} className="pill capitalize" style={{background:'rgba('+col.rgb+',0.12)',color:col.hex}}>{k}</span>);})}
            </div>
          </div>
        </div>
      )}

      {timers.length>0&&(
        <div className="ios-card glow gc-brand p-5 mb-5 anim-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-headline">Progress to each event</p>
            <p className="text-caption">hover each bar to animate</p>
          </div>
          {timers.slice(0,8).map((t:Timer)=>{
            const{progress_percent}=buildCountdownResponse(t.name,new Date(t.targetDate));
            const col=C(t.category);
            return <AnimatedProgressBar key={t.id} label={t.name.slice(0,16)} percent={progress_percent} color={col.hex} rgb={col.rgb}/>;
          })}
        </div>
      )}

      {timers.length===0&&(
        <div className="ios-card glow gc-brand anim-scale-in text-center py-20" style={{ border: '2px dashed var(--border-hairline)' }}>
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-headline mb-1">No countdowns yet</p>
          <p className="text-footnote mb-5">Add a deadline, birthday, or any event</p>
          <button onClick={onAdd} className="btn-filled">+ Add my first countdown</button>
        </div>
      )}

      <div className="anim-fade-up mt-4">
        <p className="text-caption mb-3">Popular — add in one click</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sg">
          {popular.map((ev:any)=>{
            const{days_left}=buildCountdownResponse(ev.name,new Date(ev.targetDate));
            const col=C(ev.category);
            return(
              <a key={ev.slug} href={'/how-long-until-'+ev.slug} className="ios-card interactive press anim-fade-up flex items-center justify-between p-3">
                <span className="font-semibold truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{ev.name}</span>
                <span className="font-black text-sm ml-2 flex-shrink-0 tabular" style={{color:col.hex}}>{days_left}d</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
