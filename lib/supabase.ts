import { createClient } from '@supabase/supabase-js';
export const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
export const WELLS = ['봄 우물','여름 우물','가을 우물','겨울 우물'];
export const ROLES = ['우물원','우물장','사역자'];
export const VIS = ['전체','소속 우물','우물장 + 목회자','목회자'];
export const fmtReg = (m:any) => `${m.reg_year}.${String(m.reg_month).padStart(2,'0')} 등록`;
export const ytId = (u:string) => { const m = (u||'').match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/); return m ? m[1] : ''; };
export const toast = (t:string) => window.dispatchEvent(new CustomEvent('toast',{detail:t}));
// 에러면 토스트 후 false
export const ok = (r:any) => { if (r.error) { toast('실패: ' + (r.error.message.includes('full') ? '정원이 찼어요' : r.error.message)); return false; } return true; };
export const SU_URL = 'https://sum.su.or.kr:8888/bible/today';
// 한국 시간 기준 오늘 (YYYY-MM-DD)
export const todayKST = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
// 읽기표 붙여넣기 해석: "11/1 야고보서 5:13-20", "2026-11-01 야고보서 5:13-20", "11월 1일 ..." 등
export const parsePlan = (text: string) => {
  const [ty, tm] = todayKST().split('-').map(Number);
  const rows: { day: string; ref: string }[] = []; const bad: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const m = line.match(/^(?:(\d{4})\s*[-./년]\s*)?(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?(?:\s*\([^)]*\))?[\s\t,]+(.+)$/);
    if (!m) { bad.push(line); continue; }
    const mo = +m[2], da = +m[3];
    let y = m[1] ? +m[1] : (mo < tm - 6 ? ty + 1 : ty);
    const dt = new Date(Date.UTC(y, mo - 1, da));
    if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== da) { bad.push(line); continue; }
    rows.push({ day: `${y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`, ref: m[4].trim().slice(0, 80) });
  }
  return { rows, bad };
};
