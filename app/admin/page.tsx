'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
import Auth from '@/components/Auth';
import Admin from '@/components/Admin';
import Toast from '@/components/Toast';

export default function AdminPage() {
  const [s, setS] = useState<any>({ loading: true });
  const load = async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return setS({ loading: false });
    const { data: a } = await sb.from('admins').select('kind').eq('user_id', session.user.id).maybeSingle();
    setS({ loading: false, session, kind: a?.kind });
  };
  useEffect(() => { load(); const { data } = sb.auth.onAuthStateChange(() => { load(); }); return () => data.subscription.unsubscribe(); }, []);
  const out = () => sb.auth.signOut();
  let body;
  if (s.loading) body = <div className="wrap mute">불러오는 중…</div>;
  else if (!s.session) body = <Auth />;
  else if (!s.kind) body = <div className="wrap"><div className="card">관리자 권한이 없는 계정이에요.</div><button className="link" onClick={out}>로그아웃</button></div>;
  else body = <Admin kind={s.kind} signOut={out} />;
  return <>{body}<Toast /></>;
}
