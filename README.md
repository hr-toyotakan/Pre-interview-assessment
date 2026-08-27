# แบบประเมินบุคลิกภาพก่อนสัมภาษณ์งาน (4 สี)

เว็บแบบประเมิน 9 ข้อ สำหรับให้ผู้สมัครงานภายนอกทำก่อนเข้าสัมภาษณ์
คำนวณบุคลิกภาพ 4 สี (แดง / ฟ้า / เหลือง / เขียว) และบันทึกผลลง Supabase

- **Frontend** — HTML/CSS/JS ล้วน ไม่ต้อง build ใช้ GitHub Pages ได้ทันที
- **Backend** — Supabase (PostgreSQL + Row Level Security + Auth)

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้าทำแบบประเมิน (สำหรับผู้สมัคร) |
| `admin.html` | หน้าดูผลทั้งหมด + ดาวน์โหลด CSV (สำหรับ HR ต้องล็อกอิน) |
| `config.js` | ใส่ URL / anon key ของ Supabase และตั้งค่าฟอร์ม |
| `data.js` | ชุดคำถาม 9 ข้อ + เฉลยสี + คำอธิบายบุคลิกภาพ |
| `app.js` | ตรรกะการทำแบบประเมินและการบันทึกผล |
| `styles.css` | สไตล์ทั้งหมด |
| `supabase/schema.sql` | สคริปต์สร้างตารางและ policy |
| `SETUP.md` | **คู่มือติดตั้งแบบละเอียดทีละคลิก + วิธีแก้ปัญหาที่พบบ่อย** |

---

## ขั้นตอนที่ 1 — ตั้งค่า Supabase

1. สมัคร/เข้าสู่ระบบที่ <https://supabase.com> แล้วกด **New project**
   (เลือก Region: `Southeast Asia (Singapore)` จะเร็วที่สุดสำหรับผู้ใช้ในไทย)
2. เปิด **SQL Editor → New query** คัดลอกทั้งไฟล์ `supabase/schema.sql` มาวาง แล้วกด **Run**
3. ไปที่ **Project Settings → API** คัดลอก 2 ค่านี้
   - `Project URL`
   - `anon` `public` key
4. สร้างบัญชี HR สำหรับเข้าหน้า `admin.html`
   **Authentication → Users → Add user** กรอกอีเมล + รหัสผ่าน และติ๊ก **Auto Confirm User**
5. ปิดการสมัครสมาชิกเอง เพื่อไม่ให้คนนอกสร้างบัญชีมาอ่านข้อมูล
   **Authentication → Providers → Email →** ปิด **Enable sign ups** แล้วกด Save

> **ความปลอดภัย:** anon key เปิดเผยในหน้าเว็บได้เป็นปกติ เพราะ RLS ใน `schema.sql`
> อนุญาตแค่ `INSERT` เท่านั้น ส่วนการ `SELECT` ต้องล็อกอินก่อน
> ห้ามนำ `service_role` key มาใส่ในไฟล์ฝั่งหน้าเว็บเด็ดขาด

---

## ขั้นตอนที่ 2 — แก้ `config.js`

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://abcdefgh.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi....",
  ORG_NAME: "บริษัท ตัวอย่าง จำกัด",
  FORM_TITLE: "แบบประเมินบุคลิกภาพก่อนสัมภาษณ์งาน",
  POSITIONS: ["เจ้าหน้าที่การตลาด", "โปรแกรมเมอร์", "ธุรการ"], // [] = ให้พิมพ์เอง
  REQUIRE_EMAIL: false,
  SHOW_RESULT_TO_CANDIDATE: true,   // false = ผู้สมัครเห็นแค่หน้าขอบคุณ
};
```

---

## ขั้นตอนที่ 3 — ขึ้น GitHub Pages

```bash
cd personality-assessment
git init
git add .
git commit -m "แบบประเมินบุคลิกภาพก่อนสัมภาษณ์งาน"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

จากนั้นในหน้า repo บน GitHub:

**Settings → Pages → Build and deployment → Source: `Deploy from a branch`**
เลือก Branch `main` / โฟลเดอร์ `/ (root)` แล้วกด **Save**

รอประมาณ 1 นาที เว็บจะขึ้นที่

```
https://<username>.github.io/<repo>/          ← ส่งลิงก์นี้ให้ผู้สมัคร
https://<username>.github.io/<repo>/admin.html ← หน้าดูผลของ HR
```

> repo นี้มี `.github/workflows/deploy.yml` ให้แล้ว หากต้องการ deploy แบบ GitHub Actions
> ให้เลือก **Settings → Pages → Source: `GitHub Actions`** แทน

---

## ขั้นตอนที่ 4 — ทดสอบ

เปิดในเครื่องก่อนได้ (ต้องเปิดผ่าน http ไม่ใช่ดับเบิลคลิกไฟล์):

```bash
python -m http.server 8000
```

แล้วเข้า <http://localhost:8000> — ถ้ายังไม่ได้ใส่ค่าใน `config.js`
ระบบจะทำงานใน "โหมดทดสอบ" คือคำนวณผลให้ดูแต่ไม่บันทึกลงฐานข้อมูล

การล็อกอินหน้า `admin.html` ใช้อีเมล+รหัสผ่าน จึง **ไม่จำเป็น** ต้องตั้ง Redirect URL
แต่แนะนำให้ใส่โดเมน GitHub Pages ไว้ที่ **Authentication → URL Configuration → Site URL**
เผื่อวันหลังเปิดใช้ลิงก์รีเซ็ตรหัสผ่านหรือ magic link

---

## เกณฑ์การให้คะแนน

แต่ละข้อเลือกได้ 1 ตัวเลือก แต่ละตัวเลือกผูกกับ 1 สี รวม 9 คะแนน
สีที่ได้คะแนนมากที่สุด = บุคลิกภาพเด่น (สีรอง = อันดับสอง)

| สี | บุคลิก | ลักษณะเด่น |
|---|---|---|
| 🔴 แดง | นักลงมือทำ | เด็ดขาด มุ่งผลลัพธ์ กล้าเสี่ยง |
| 🔵 ฟ้า | นักสร้างแรงบันดาลใจ | ชอบสังคม จูงใจเก่ง ปรับตัวไว |
| 🟡 เหลือง | ผู้ประสานใจ | ใจเย็น รับฟัง ทำงานเป็นทีม |
| 🟢 เขียว | นักวิเคราะห์ | ละเอียด เป็นระบบ มีวินัย |

เฉลยรายข้อทั้งหมดอยู่ในไฟล์ `data.js` (แก้ไข/เพิ่มคำถามได้จากไฟล์เดียวนี้)

---

## การแก้ไขคำถาม

เพิ่มหรือแก้คำถามได้ที่ `window.QUESTIONS` ใน `data.js`
ระบบคิดคะแนนจากจำนวนข้อจริงโดยอัตโนมัติ ไม่ต้องแก้โค้ดส่วนอื่น
(แถบคะแนนในหน้าผลลัพธ์จะปรับสเกลตามจำนวนข้อให้เอง)

## ข้อมูลส่วนบุคคล (PDPA)

- หน้าแรกมี checkbox ขอความยินยอมก่อนเริ่มทำ
- เก็บเฉพาะข้อมูลที่จำเป็นต่อการสมัครงาน
- ข้อมูลอ่านได้เฉพาะบัญชีที่ล็อกอินเท่านั้น (บังคับด้วย RLS)
- ควรกำหนดรอบลบข้อมูลผู้สมัครที่ไม่ผ่านการพิจารณา เช่น

```sql
delete from public.assessment_responses
where created_at < now() - interval '180 days';
```
