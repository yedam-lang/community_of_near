'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { sb, VIS, ytId, fmtReg, toast, ok, todayKST, SU_URL } from '@/lib/supabase';

const TABS = [['home','홈'],['med','묵상'],['pray','기도'],['meet','모임·나눔'],['card','내 카드']];
const Seg = ({ items, v, set }: any) => <div className="tabs">{items.map(([k,l]:any)=><button key={k} className={v===k?'on':''} onClick={()=>set(k)}>{l}</button>)}</div>;
const ago = (s:string) => new Date(s).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'});

export default function MemberApp({ me, signOut }: any) {
  const [tab, setTab] = useState('home');
  const [d, setD] = useState<any>({});
  const [qr, setQr] = useState('');
  const load = async () => {
    const [verse, notice, sermons, qrs, med, pr, groups, events, shares, regs, plan] = await Promise.all([
      sb.from('daily_verse').select('*').maybeSingle(),
      sb.from('notices').select('*').order('created_at',{ascending:false}).limit(1),
      sb.from('sermons').select('*').order('preached_on',{ascending:false}),
      sb.from('app_settings').select('value').eq('key','qr_url').maybeSingle(),
      sb.from('meditations').select('*, author:members(name)').order('created_at',{ascending:false}).limit(50),
      sb.from('prayers').select('*, author:members(name,well)').order('created_at',{ascending:false}).limit(150),
      sb.from('groups').select('*, host:members(name), gm:group_members(user_id, user:members(name))').order('created_at',{ascending:false}),
      sb.from('events').select('*').order('created_at',{ascending:false}),
      sb.from('shares').select('*, author:members(name)').order('created_at',{ascending:false}).limit(50),
      sb.from('event_regs').select('*'),
      sb.from('reading_plan').select('ref').eq('day', todayKST()).maybeSingle(),
    ]);
    setD({ verse:verse.data, plan:plan.data?.ref, notice:notice.data?.[0], sermons:sermons.data||[], qrUrl:qrs.data?.value, med:med.data||[], pr:pr.data||[], groups:groups.data||[], events:events.data||[], shares:shares.data||[], regs:regs.data||[] });
    if (qrs.data?.value) QRCode.toString(qrs.data.value,{type:'svg',margin:0}).then(setQr);
  };
  useEffect(() => { load(); }, []);
  const act = async (p: PromiseLike<any>, msg?: string) => { const r = await p; if (ok(r)) { if (msg) toast(msg); load(); } };
  const report = (type:string, id:any) => { const reason = prompt('신고 사유를 적어 주세요'); if (reason) act(sb.from('reports').insert({ target_type:type, target_id:String(id), reason }), '신고했어요'); };
  const props = { me, d, act, report, load };

  return (
    <div className="wrap">
      {tab==='home' && <Home {...props} />}
      {tab==='med' && <Med {...props} />}
      {tab==='pray' && <Pray {...props} />}
      {tab==='meet' && <MeetShare {...props} />}
      {tab==='card' && <Card {...props} qr={qr} signOut={signOut} />}
      <nav className="tabbar">{TABS.map(([k,l]) => <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>
    </div>
  );
}

function Home({ me, d }: any) {
  const [sel, setSel] = useState<number|null>(null);
  const [open, setOpen] = useState(false);
  const list = d.sermons || [];              // 최신순
  const latest = list[0];
  const s = list.find((x:any)=>x.id===sel) || latest;
  const past = list.filter((x:any)=>x.id!==latest?.id);
  useEffect(() => {
    const o: any = (screen as any).orientation;
    const h = () => {
      if (!o?.lock) return;
      if (document.fullscreenElement) o.lock('landscape').catch(() => {});
      else { try { o.unlock(); } catch {} }
    };
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  return <>
    <h1>안녕하세요, {me.name}님</h1>
    {d.notice && <div className="alert"><b>긴급 공지 · {d.notice.title}</b><div>{d.notice.body}</div></div>}
    {(d.plan || d.verse) && <div className="card"><div className="mute">오늘의 본문 · 매일성경</div><h2>{d.plan || d.verse?.ref}</h2>
      {d.verse?.note && <div className="mute">{d.verse.note}</div>}
      <a href={SU_URL} target="_blank" rel="noopener noreferrer"><button className="line sm" style={{marginTop:8}}>매일성경에서 읽기</button></a></div>}
    <div className="card"><h2>{s && s.id!==latest?.id ? '지난 설교' : '이번 주 설교'}</h2>
      {s ? <><iframe key={s.id} className="video" src={`https://www.youtube-nocookie.com/embed/${ytId(s.youtube_url)}`} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        <div className="mute" style={{marginTop:6}}>{s.title} · {s.preached_on}</div>
        {s.id!==latest?.id && <button className="link" onClick={()=>setSel(null)}>이번 주 설교로 돌아가기</button>}</> : <div className="mute">등록된 설교가 없어요.</div>}
      <div style={{marginTop:10}}>
        <button className="line sm" onClick={()=>setOpen(!open)}>{open ? '지난 설교 닫기' : `지난 설교 보기 (${past.length})`}</button>
        {open && !past.length && <div className="mute" style={{marginTop:8}}>아직 지난 설교가 없어요.</div>}
        {open && past.length>0 && <div style={{marginTop:8}}>{past.map((x:any)=><div key={x.id} className="row between" style={{padding:'6px 0'}}>
          <span className="grow mute">{x.title} · {x.preached_on}</span>
          <button className="sm line" onClick={()=>{setSel(x.id);window.scrollTo({top:0,behavior:'smooth'});}}>{sel===x.id?'재생 중':'재생'}</button></div>)}</div>}
      </div>
    </div>
  </>;
}

function Med({ me, d, act, report }: any) {
  const [m, setM] = useState('');
  return <>
    <h1>묵상</h1>
    <div className="card"><h2>묵상 나누기</h2>
      <textarea value={m} onChange={e=>setM(e.target.value)} placeholder="오늘 마음에 남은 한 줄" />
      <button disabled={!m.trim()} onClick={()=>{act(sb.from('meditations').insert({ body:m.trim() }),'올렸어요');setM('');}}>올리기</button></div>
    {d.med?.map((x:any)=><div key={x.id} className="card"><div className="row between"><b>{x.author?.name}</b><span className="mute">{ago(x.created_at)}</span></div>
      <div style={{whiteSpace:'pre-wrap'}}>{x.body}</div>
      <div className="row"><button className="link" onClick={()=>report('meditation',x.id)}>신고</button>{x.author_id===me.id && <button className="link" onClick={()=>act(sb.from('meditations').delete().eq('id',x.id))}>삭제</button>}</div></div>)}
  </>;
}

const TO_ME = ['우물장 + 목회자','목회자'];
function Pray({ me, d, act, report }: any) {
  const minister = me.role==='사역자';
  const subs: [string,string][] = [['all','전체 기도']];
  if (!minister) subs.push(['well', me.well ? `${me.well} 기도` : '우물 기도']);
  if (minister || me.role==='우물장') subs.push(['tome','나에게 온 기도']);
  const [sub, setSub] = useState('all');
  const [p, setP] = useState(''); const [vis, setVis] = useState('전체');
  const pick = (k:string) => { setSub(k); if (k==='all') setVis('전체'); if (k==='well') setVis('소속 우물'); };
  const list = (d.pr||[]).filter((x:any) => sub==='all' ? x.vis==='전체' : sub==='well' ? x.vis==='소속 우물' : TO_ME.includes(x.vis) && x.author_id!==me.id);
  const empty = sub==='tome' ? '아직 받은 기도제목이 없어요.' : '아직 기도제목이 없어요.';
  return <>
    <h1>기도</h1>
    <Seg items={subs} v={sub} set={pick} />
    {sub!=='tome' && <div className="card"><h2>기도제목 올리기</h2>
      <textarea value={p} onChange={e=>setP(e.target.value)} placeholder="기도제목" />
      <label>공개 범위</label><select value={vis} onChange={e=>setVis(e.target.value)}>{VIS.map(v=><option key={v}>{v}</option>)}</select>
      <button disabled={!p.trim()} onClick={()=>{act(sb.from('prayers').insert({ body:p.trim(), vis }),'올렸어요');setP('');}}>올리기</button></div>}
    {list.map((x:any)=><div key={x.id} className="card"><div className="row between"><b>{x.author?.name}{sub==='tome' && x.author?.well ? ` · ${x.author.well}` : ''}</b><span className="pill">{x.vis}</span></div>
      <div style={{whiteSpace:'pre-wrap'}}>{x.body}</div>
      <div className="row"><span className="mute">{ago(x.created_at)}</span><button className="link" onClick={()=>report('prayer',x.id)}>신고</button>{x.author_id===me.id && <button className="link" onClick={()=>act(sb.from('prayers').delete().eq('id',x.id))}>삭제</button>}</div></div>)}
    {!list.length && <div className="mute">{empty}</div>}
  </>;
}

function MeetShare(props: any) {
  const [sub, setSub] = useState('meet');
  return <>
    <h1>모임 · 나눔</h1>
    <Seg items={[['meet','모임'],['share','나눔']]} v={sub} set={setSub} />
    {sub==='meet' ? <Meet {...props} /> : <Share {...props} />}
  </>;
}

function Meet({ me, d, act }: any) {
  const [t, setT] = useState(''); const [w, setW] = useState(''); const [cap, setCap] = useState(8);
  const regOf = (id:number) => d.regs?.find((r:any)=>r.event_id===id && r.user_id===me.id);
  return <>
    <div className="card"><h2>소모임 열기</h2>
      <input placeholder="모임 이름" value={t} onChange={e=>setT(e.target.value)} />
      <input placeholder="일시 (예: 수요일 저녁 8시)" value={w} onChange={e=>setW(e.target.value)} />
      <label>정원</label><input type="number" min={2} value={cap} onChange={e=>setCap(+e.target.value)} />
      <button disabled={!t.trim()} onClick={async()=>{ const r = await sb.from('groups').insert({ title:t.trim(), when_text:w, cap }).select().single();
        if (ok(r)) { await sb.from('group_members').insert({ group_id:r.data.id }); toast('열었어요'); setT(''); setW(''); act(Promise.resolve({})); } }}>열기</button></div>
    {d.groups?.map((g:any)=>{ const joined = g.gm.some((x:any)=>x.user_id===me.id);
      return <div key={g.id} className="card"><div className="row between"><b>{g.title}</b><span className="pill">{g.gm.length}/{g.cap}</span></div>
        <div className="mute">{g.when_text} · 개설 {g.host?.name}</div>
        <div className="mute">{g.gm.map((x:any)=>x.user?.name).join(', ')}</div>
        {joined ? <button className="line sm" onClick={()=>act(sb.from('group_members').delete().eq('group_id',g.id).eq('user_id',me.id),'나왔어요')}>나가기</button>
                : <button className="sm" disabled={g.gm.length>=g.cap} onClick={()=>act(sb.from('group_members').insert({ group_id:g.id }),'신청했어요')}>{g.gm.length>=g.cap?'마감':'한 번에 신청'}</button>}</div>; })}
    <h2 style={{marginTop:18}}>행사 · 리트릿</h2>
    {d.events?.map((e:any)=>{ const r = regOf(e.id); const on = r && r.status!=='cancel';
      return <div key={e.id} className="card"><div className="row between"><b>{e.title}</b><span className="pill">{e.kind}</span></div><div className="mute">{e.when_text}</div>
        {on ? <div className="row"><span className="pill">{r.status==='wait'?'대기 중':'신청 완료'}</span><button className="line sm" onClick={()=>act(sb.from('event_regs').update({ status:'cancel' }).eq('event_id',e.id).eq('user_id',me.id),'취소했어요')}>취소</button></div>
          : <button className="sm" onClick={()=>act(r ? sb.from('event_regs').delete().eq('event_id',e.id).eq('user_id',me.id).then(()=>sb.from('event_regs').insert({ event_id:e.id })) : sb.from('event_regs').insert({ event_id:e.id }),'신청했어요')}>신청</button>}</div>; })}
  </>;
}

function Share({ me, d, act, report }: any) {
  const [f, setF] = useState({ kind:'물품', title:'', body:'' });
  return <>
    <div className="card"><div className="row">{['물품','재능'].map(k=><button key={k} className={'sm '+(f.kind===k?'':'line')} onClick={()=>setF({...f,kind:k})}>{k}</button>)}</div>
      <input placeholder="제목" value={f.title} onChange={e=>setF({...f,title:e.target.value})} style={{marginTop:10}} />
      <textarea placeholder="설명" value={f.body} onChange={e=>setF({...f,body:e.target.value})} />
      <button disabled={!f.title.trim()} onClick={()=>{act(sb.from('shares').insert({ kind:f.kind, title:f.title.trim(), body:f.body }),'올렸어요');setF({kind:'물품',title:'',body:''});}}>올리기</button></div>
    {d.shares?.map((x:any)=><div key={x.id} className="card"><div className="row between"><b>{x.title}</b><span className="pill">{x.kind}</span></div>
      <div className="mute">{x.author?.name} · {ago(x.created_at)}</div><div style={{whiteSpace:'pre-wrap'}}>{x.body}</div>
      <div className="row"><button className="link" onClick={()=>report('share',x.id)}>신고</button>{x.author_id===me.id && <button className="link" onClick={()=>act(sb.from('shares').delete().eq('id',x.id))}>삭제</button>}</div></div>)}
  </>;
}

function Card({ me, d, qr, signOut }: any) {
  const mine = (a:any[]) => (a||[]).filter(x=>x.author_id===me.id);
  const myG = (d.groups||[]).filter((g:any)=>g.gm.some((x:any)=>x.user_id===me.id));
  const myE = (d.events||[]).filter((e:any)=>d.regs?.some((r:any)=>r.event_id===e.id&&r.user_id===me.id&&r.status!=='cancel'));
  return <>
    <h1>내 카드</h1>
    <div className="card-id"><div>커뮤니티 오브 니어 · {me.role}</div><h1 style={{margin:'6px 0'}}>{me.name}</h1>
      <div>{me.role!=='사역자' && me.well+' · '}{fmtReg(me)}</div>
      <div className="qr" dangerouslySetInnerHTML={{__html:qr}} /><div>QR을 찍으면 교회 정보가 나와요</div></div>
    <div className="card"><h2>내가 신청한 모임</h2>{[...myG.map((g:any)=>g.title),...myE.map((e:any)=>e.title)].map((t,i)=><div key={i}>{t}</div>)}{!myG.length&&!myE.length&&<div className="mute">아직 없어요.</div>}</div>
    <div className="card"><h2>내가 올린 묵상</h2>{mine(d.med).map((x:any)=><div key={x.id}>· {x.body}</div>)}</div>
    <div className="card"><h2>내가 올린 기도제목</h2>{mine(d.pr).map((x:any)=><div key={x.id}>· {x.body} <span className="pill">{x.vis}</span></div>)}</div>
    <button className="line" onClick={signOut}>로그아웃</button>
  </>;
}
