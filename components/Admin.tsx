'use client';
import { useEffect, useState } from 'react';
import { sb, WELLS, ROLES, VIS, fmtReg, ytId, toast, ok } from '@/lib/supabase';

const TABS = [['join','가입 승인'],['well','우물 관리'],['pray','기도 요청'],['rep','신고·이력'],['con','콘텐츠'],['meet','모임·행사']];

export default function Admin({ signOut, kind }: any) {
  const [tab, setTab] = useState('join');
  const [d, setD] = useState<any>({});
  const load = async () => {
    const [mem, pr, rep, log, sermons, groups, events, regs, qr, verse] = await Promise.all([
      sb.from('members').select('*, c:member_contacts(phone)').order('created_at'),
      sb.from('prayers').select('*, author:members(name,well,role)').order('created_at',{ascending:false}),
      sb.from('reports').select('*, who:members(name)').order('created_at',{ascending:false}),
      sb.from('admin_log').select('*').order('created_at',{ascending:false}).limit(30),
      sb.from('sermons').select('*').order('preached_on',{ascending:false}),
      sb.from('groups').select('*, host:members(name), gm:group_members(user:members(name))').order('created_at',{ascending:false}),
      sb.from('events').select('*').order('created_at',{ascending:false}),
      sb.from('event_regs').select('*, user:members(name)'),
      sb.from('app_settings').select('value').eq('key','qr_url').maybeSingle(),
      sb.from('daily_verse').select('*').maybeSingle(),
    ]);
    setD({ mem:mem.data||[], pr:pr.data||[], rep:rep.data||[], log:log.data||[], sermons:sermons.data||[], groups:groups.data||[], events:events.data||[], regs:regs.data||[], qr:qr.data?.value||'', verse:verse.data });
  };
  useEffect(() => { load(); }, []);
  const act = async (p: PromiseLike<any>, msg?: string, log?: string) => { const r = await p; if (ok(r)) { if (log) await sb.from('admin_log').insert({ text: log }); if (msg) toast(msg); load(); } };
  const P = { d, act };
  return (
    <div className="wrap wide">
      <div className="hd"><h1>관리자</h1><button className="line sm" onClick={signOut}>로그아웃</button></div>
      {kind==='staff' && <div className="mute" style={{marginBottom:8}}>행정 관리자: 목회자 공개 기도제목은 보이지 않아요.</div>}
      <div className="tabs">{TABS.map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
      {tab==='join' && <Join {...P} />}{tab==='well' && <Well {...P} />}{tab==='pray' && <Pray {...P} />}
      {tab==='rep' && <Rep {...P} />}{tab==='con' && <Con {...P} />}{tab==='meet' && <Meet {...P} />}
    </div>
  );
}

function Join({ d, act }: any) {
  const q = d.mem?.filter((m:any)=>m.status==='pending'||m.status==='hold') || [];
  const set = (m:any, status:string) => act(sb.from('members').update({ status }).eq('id',m.id), '처리했어요', `${m.name} 가입 ${status}`);
  return <>{!q.length && <div className="mute">대기 중인 신청이 없어요.</div>}
    {q.map((m:any)=><div key={m.id} className="card row between"><div className="grow"><b>{m.name}</b> <span className="pill">{m.role}</span>{m.status==='hold'&&<span className="pill">보류</span>}
      <div className="mute">{m.well||'소속 없음'} · {fmtReg(m)} · {m.c?.phone}</div></div>
      <div className="row"><button className="sm" onClick={()=>set(m,'approved')}>승인</button><button className="sm line" onClick={()=>set(m,'hold')}>보류</button><button className="sm line" onClick={()=>set(m,'rejected')}>거절</button></div></div>)}</>;
}

function Well({ d, act }: any) {
  const [w, setW] = useState(WELLS[0]);
  const list = (d.mem||[]).filter((m:any)=>m.status==='approved' && (w==='사역자' ? m.role==='사역자' : m.well===w));
  const change = (m:any, role:string, well:string|null) => {
    const patch:any = role==='사역자' ? { role, well:null } : { role, well: well || WELLS[0] };
    act(sb.from('members').update(patch).eq('id',m.id), '바꿨어요', `${m.name} → ${patch.role}${patch.well?' / '+patch.well:''}`);
  };
  const Row = (m:any) => <div key={m.id} className="card row between"><div className="grow"><b>{m.name}</b> {!m.active && <span className="pill">접근 중지</span>}<div className="mute">{m.c?.phone} · {fmtReg(m)}</div></div>
    <div className="row" style={{width:'auto'}}>
      <select style={{width:'auto',margin:0}} value={m.role} onChange={e=>change(m,e.target.value,m.well)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
      {m.role!=='사역자' && <select style={{width:'auto',margin:0}} value={m.well} onChange={e=>change(m,m.role,e.target.value)}>{WELLS.map(r=><option key={r}>{r}</option>)}</select>}
      <button className="sm line" onClick={()=>act(sb.from('members').update({ active:!m.active }).eq('id',m.id), m.active?'중지했어요':'복구했어요', `${m.name} ${m.active?'접근 중지':'복구'}`)}>{m.active?'접근 중지':'복구'}</button></div></div>;
  return <><div className="tabs">{[...WELLS,'사역자'].map(x=><button key={x} className={w===x?'on':''} onClick={()=>setW(x)}>{x}</button>)}</div>
    {w!=='사역자' && <><h2>우물장</h2>{list.filter((m:any)=>m.role==='우물장').map(Row)}<h2>우물원</h2></>}
    {list.filter((m:any)=>w==='사역자'||m.role!=='우물장').map(Row)}{!list.length && <div className="mute">성도가 없어요.</div>}</>;
}

function Pray({ d }: any) {
  const [v, setV] = useState('모두'); const [w, setW] = useState('모든 우물');
  const list = (d.pr||[]).filter((p:any)=>(v==='모두'||p.vis===v)&&(w==='모든 우물'||p.author?.well===w));
  return <><div className="row"><select style={{width:'auto'}} value={v} onChange={e=>setV(e.target.value)}>{['모두',...VIS].map(x=><option key={x}>{x}</option>)}</select>
    <select style={{width:'auto'}} value={w} onChange={e=>setW(e.target.value)}>{['모든 우물',...WELLS].map(x=><option key={x}>{x}</option>)}</select></div>
    {list.map((p:any)=><div key={p.id} className="card"><div className="row between"><b>{p.author?.name} <span className="mute">{p.author?.well||p.author?.role}</span></b><span className="pill">{p.vis}</span></div>
      <div style={{whiteSpace:'pre-wrap'}}>{p.body}</div></div>)}{!list.length && <div className="mute">기도제목이 없어요.</div>}</>;
}

function Rep({ d, act }: any) {
  return <><h2>신고</h2>{!d.rep?.length && <div className="mute">신고가 없어요.</div>}
    {d.rep?.map((r:any)=><div key={r.id} className="card row between"><div className="grow"><b>{r.target_type} #{r.target_id}</b> <span className="pill">{r.status==='open'?'접수':'처리됨'}</span>
      <div>{r.reason}</div><div className="mute">신고자 {r.who?.name}</div></div>
      {r.status==='open' && <button className="sm" onClick={()=>act(sb.from('reports').update({ status:'done' }).eq('id',r.id),'처리했어요',`신고 #${r.id} 처리`)}>처리 완료</button>}</div>)}
    <h2 style={{marginTop:16}}>조치 이력</h2>{d.log?.map((l:any)=><div key={l.id} className="mute">{new Date(l.created_at).toLocaleString('ko-KR')} · {l.text}</div>)}</>;
}

function Con({ d, act }: any) {
  const [s, setS] = useState({ title:'', date:new Date().toISOString().slice(0,10), url:'' });
  const [n, setN] = useState({ title:'', body:'', target:'전체' });
  const [verse, setVerse] = useState<any>(null); const [qr, setQr] = useState<string|null>(null);
  const vv = verse || d.verse || { ref:'', note:'' }; const qq = qr ?? d.qr ?? '';
  const urlOk = !!ytId(s.url);
  return <>
    <div className="card"><h2>주일 설교 링크 (유튜브 비공개)</h2>
      <input placeholder="제목" value={s.title} onChange={e=>setS({...s,title:e.target.value})} />
      <input type="date" value={s.date} onChange={e=>setS({...s,date:e.target.value})} />
      <input placeholder="https://youtu.be/..." value={s.url} onChange={e=>setS({...s,url:e.target.value})} />
      {s.url && !urlOk && <div className="mute">유튜브 링크 형식이 아니에요</div>}
      <button disabled={!urlOk||!s.title.trim()} onClick={()=>{act(sb.from('sermons').insert({ title:s.title.trim(), preached_on:s.date, youtube_url:s.url.trim() }),'올렸어요','설교 등록');setS({...s,title:'',url:''});}}>올리기</button>
      {d.sermons?.map((x:any)=><div key={x.id} className="row between" style={{marginTop:8}}><span className="mute">{x.title} · {x.preached_on}</span><button className="link" onClick={()=>act(sb.from('sermons').delete().eq('id',x.id),'지웠어요')}>삭제</button></div>)}</div>
    <div className="card"><h2>긴급 공지</h2>
      <input placeholder="제목" value={n.title} onChange={e=>setN({...n,title:e.target.value})} />
      <textarea placeholder="내용" value={n.body} onChange={e=>setN({...n,body:e.target.value})} />
      <select value={n.target} onChange={e=>setN({...n,target:e.target.value})}>{['전체',...WELLS].map(x=><option key={x}>{x}</option>)}</select>
      <button disabled={!n.title.trim()} onClick={()=>{act(sb.from('notices').insert(n),'올렸어요',`긴급 공지: ${n.title} (${n.target})`);setN({title:'',body:'',target:'전체'});}}>올리기</button>
      <div className="mute" style={{marginTop:6}}>앱 안 공지입니다. 휴대폰 푸시 알림은 아직 연결되지 않았어요.</div></div>
    <div className="card"><h2>오늘의 본문</h2>
      <input value={vv.ref} onChange={e=>setVerse({...vv,ref:e.target.value})} /><input value={vv.note} onChange={e=>setVerse({...vv,note:e.target.value})} />
      <button onClick={()=>act(sb.from('daily_verse').update({ ref:vv.ref, note:vv.note }).eq('id',1),'게시했어요','오늘의 본문 게시')}>게시하기</button></div>
    <div className="card"><h2>QR 연결 링크</h2>
      <input value={qq} onChange={e=>setQr(e.target.value)} placeholder="https://" />
      <button disabled={!/^https?:\/\/\S+$/.test(qq)} onClick={()=>act(sb.from('app_settings').update({ value:qq }).eq('key','qr_url'),'저장했어요','QR 링크 변경')}>저장</button></div>
  </>;
}

function Meet({ d, act }: any) {
  const [e, setE] = useState({ title:'', when_text:'', kind:'행사', cap:30 });
  return <>
    <h2>소모임</h2>{d.groups?.map((g:any)=><div key={g.id} className="card"><b>{g.title}</b> <span className="pill">{g.gm.length}/{g.cap}</span>
      <div className="mute">개설자 {g.host?.name} · 참여 {g.gm.map((x:any)=>x.user?.name).join(', ')}</div></div>)}
    <h2>행사 · 리트릿</h2>
    <div className="card"><input placeholder="행사 이름" value={e.title} onChange={x=>setE({...e,title:x.target.value})} />
      <input placeholder="일시" value={e.when_text} onChange={x=>setE({...e,when_text:x.target.value})} />
      <div className="row"><select style={{width:'auto'}} value={e.kind} onChange={x=>setE({...e,kind:x.target.value})}><option>행사</option><option>리트릿</option></select>
        <input type="number" style={{width:90}} value={e.cap} onChange={x=>setE({...e,cap:+x.target.value})} /></div>
      <button disabled={!e.title.trim()} onClick={()=>{act(sb.from('events').insert(e),'만들었어요');setE({...e,title:'',when_text:''});}}>만들기</button></div>
    {d.events?.map((ev:any)=>{ const r = (st:string)=>(d.regs||[]).filter((x:any)=>x.event_id===ev.id&&x.status===st).map((x:any)=>x.user?.name).join(', ');
      return <div key={ev.id} className="card"><div className="row between"><b>{ev.title}</b><span className="pill">{ev.kind} · 정원 {ev.cap}</span></div>
        <div className="mute">신청 {r('reg')||'-'}</div><div className="mute">대기 {r('wait')||'-'}</div><div className="mute">취소 {r('cancel')||'-'}</div></div>; })}</>;
}
