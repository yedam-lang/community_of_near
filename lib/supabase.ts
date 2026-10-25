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
