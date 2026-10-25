# 커뮤니티 오브 니어

Next.js + Supabase. 성도 앱(`/`)과 관리자(`/admin`).

## 실행
1. `.env.local` 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 설정
2. `npm install && npm run dev`

## 첫 관리자 만들기
`/` 에서 가입 → Supabase SQL Editor 에서 실행:
```sql
update public.members set status='approved' where id=(select id from auth.users where email='내이메일');
insert into public.admins(user_id,kind) select id,'pastor' from auth.users where email='내이메일';
```
이후 `/admin` 으로 접속.
