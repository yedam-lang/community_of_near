'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
import Auth from '@/components/Auth';
import MemberApp from '@/components/MemberApp';
import Toast from '@/components/Toast';

export default function Home() {
  const [s, setS] = useState<any>({ loading: true });
  const load = async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return setS({ loading: false });
    const { data: me } = await sb.from('members').select('*').eq('id', session.user.id).maybeSingle();
    setS({ loading: false, session, me });
  };
  useEffect(() => { load(); const { data } = sb.auth.onAuthStateChange(() => { load(); }); return () => data.subscription.unsubscribe(); }, []);
  const out = () => sb.auth.signOut();
  let body;
  if (s.loading) body = <div className="wrap mute">불러오는 중…</div>;
  else if (!s.session) body = <Auth />;
  else if (!s.me) body = <Msg t="계정 정보를 찾을 수 없어요" out={out} />;
  else if (s.me.status !== 'approved') body = <Msg t={s.me.status==='rejected' ? '가입이 승인되지 않았어요. 교회 관리자에게 문의해 주세요.' : s.me.status==='hold' ? '확인 중이에요. 조금만 기다려 주세요.' : '가입 신청이 접수되었어요. 관리자가 승인하면 이용할 수 있어요.'} out={out} reload={load} />;
  else if (!s.me.active) body = <Msg t="이용이 중지되었어요. 교회 관리자에게 문의해 주세요." out={out} />;
  else body = <MemberApp me={s.me} signOut={out} />;
  return <>{body}<Toast /></>;
}
function Msg({ t, out, reload }: any) {
  return <div className="wrap"><h1>커뮤니티 오브 니어</h1><div className="card">{t}</div>
    {reload && <button className="line" onClick={reload}>새로고침</button>} <button className="link" onClick={out}>로그아웃</button></div>;
}
