# 🍰 ระบบจัดการสมาชิกร้านเค้กที่รัก

เว็บแอปสมาชิก + สะสมคะแนนของร้านเค้ก (เข้าผ่าน LINE Rich Menu)
อ้างอิงสเปกใน [ROADMAP.md](./ROADMAP.md) · dev by Kru_Boat

## เทคโนโลยี

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** (ธีมสีชมพูเค้ก `cake-*`)
- **react-router-dom** — routing
- **react-i18next** — ระบบ 2 ภาษา TH/EN (ตรวจภาษาอัตโนมัติ + จดจำใน localStorage)
- **@supabase/supabase-js** — DB / Auth / Storage
- **@line/liff** — LIFF auto-login (ใช้จริงใน Phase 2)
- Deploy: **Netlify**

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env   # ใส่ค่า Supabase / LIFF จริง
npm run dev            # http://localhost:5173
```

## คำสั่ง

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` | dev server (HMR) |
| `npm run build` | typecheck + build ขึ้น `dist/` |
| `npm run preview` | ดูผล build |
| `npm run lint` | ตรวจ lint |

## โครงสร้างโฟลเดอร์

```
src/
├─ components/      # Layout, Footer, LanguageSwitcher
├─ i18n/            # ตั้งค่า i18next + locales/{th,en}.json
├─ lib/             # supabase.ts (client)
├─ pages/           # HomePage, PromotionsPage, MenuPage
├─ App.tsx          # router
└─ main.tsx         # entry (โหลด i18n + Suspense)
```

## Environment Variables

ดู [.env.example](./.env.example) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LIFF_ID`
(ไฟล์ `.env` ถูก gitignore ไว้แล้ว — อย่า commit)

## สถานะการพัฒนา

- [x] **Phase 0** — Setup (scaffold, Tailwind, i18n, layout, Netlify config) ✅
- [x] **Phase 1** — DB schema + RLS + Google Auth + กรอกโปรไฟล์ครั้งแรก ✅ *(โค้ดเสร็จ — รอเชื่อม Supabase จริง ดู [supabase/README.md](./supabase/README.md))*
- [ ] **Phase 2** — LINE OA & LIFF
- [ ] **Phase 3** — หน้าบ้านสมาชิก
- [ ] **Phase 4** — หลังบ้านแอดมิน
- [ ] **Phase 5** — Telegram + คูปองรายเดือน
- [ ] **Phase 6** — ขัดเงา + ส่งมอบ
