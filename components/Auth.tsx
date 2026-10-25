'use client';
import { useState } from 'react';
import { sb, WELLS, ROLES, toast } from '@/lib/supabase';
export default function Auth() {
  const [mode, setMode] = useState<'in'|'up'>('in');
  const now = new Date();
  const [f, setF] = useState<any>({ email:'', password:'', name:'', phone:'', reg_year: now.getFullYear(), reg_month: now.getMonth()+1, role:'우물원', well:WELLS[0], consent:false });
  const set = (k:string,v:any) => setF({ ...f, [k]: v });
  const [busy, setBusy] = useState(false);
  const submit = async (e:any) => {
    e.preventDefault(); setBusy(true);
    if (mode === 'in') {
      const { error } = await sb.auth.signInWithPassword({ email:f.email, password:f.password });
      if (error) toast('로그인 실패: 이메일/비밀번호를 확인해 주세요');
    } else {
      const { error, data } = await sb.auth.signUp({ email:f.email, password:f.password, options:{ data:{ name:f.name.trim(), phone:f.phone.trim(), reg_year:+f.reg_year, reg_month:+f.reg_month, role:f.role, well:f.well } } });
      if (error) toast('가입 실패: ' + error.message);
      else if (!data.session) toast('메일의 확인 링크를 누른 뒤 로그인해 주세요');
    }
    setBusy(false);
  };
  return (
    <div className="wrap">
      <h1>커뮤니티 오브 니어</h1>
      <form onSubmit={submit} className="card">
        <label>이메일</label><input type="email" required value={f.email} onChange={e=>set('email',e.target.value)} />
        <label>비밀번호 (6자 이상)</label><input type="password" required minLength={6} value={f.password} onChange={e=>set('password',e.target.value)} />
        {mode === 'up' && <>
          <label>이름</label><input required value={f.name} onChange={e=>set('name',e.target.value)} />
          <label>연락처</label><input required inputMode="tel" placeholder="010-0000-0000" value={f.phone} onChange={e=>set('phone',e.target.value)} />
          <div className="row"><div className="grow"><label>등록 연도</label><input type="number" required value={f.reg_year} onChange={e=>set('reg_year',e.target.value)} /></div>
            <div className="grow"><label>등록 월</label><input type="number" min={1} max={12} required value={f.reg_month} onChange={e=>set('reg_month',e.target.value)} /></div></div>
          <label>구분</label><select value={f.role} onChange={e=>set('role',e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
          {f.role !== '사역자' && <><label>소속 우물</label><select value={f.well} onChange={e=>set('well',e.target.value)}>{WELLS.map(r=><option key={r}>{r}</option>)}</select></>}
          <label className="row" style={{color:'var(--fg)'}}><input type="checkbox" style={{width:'auto',margin:0}} checked={f.consent} onChange={e=>set('consent',e.target.checked)} />
            <span>이름·연락처·기도제목 등 종교 관련 개인정보 수집·이용에 동의합니다 (필수)</span></label>
        </>}
        <button style={{width:'100%',marginTop:10}} disabled={busy || (mode==='up' && !f.consent)}>{mode==='in' ? '로그인' : '가입 신청'}</button>
      </form>
      <button className="link" onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in' ? '처음이세요? 가입 신청' : '이미 계정이 있어요'}</button>
    </div>
  );
}
