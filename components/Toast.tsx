'use client';
import { useEffect, useState } from 'react';
export default function Toast() {
  const [t, setT] = useState('');
  useEffect(() => {
    let id: any; const h = (e: any) => { setT(e.detail); clearTimeout(id); id = setTimeout(() => setT(''), 2500); };
    window.addEventListener('toast', h); return () => window.removeEventListener('toast', h);
  }, []);
  return t ? <div className="toast" role="status">{t}</div> : null;
}
