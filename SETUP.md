# คู่มือติดตั้งแบบละเอียด (ทีละคลิก)

ใช้เวลารวมประมาณ 15-20 นาที ทำครั้งเดียวจบ ไม่ต้องเขียนโค้ดเพิ่ม

สิ่งที่ต้องเตรียม
- บัญชี GitHub (ฟรี)
- บัญชี Supabase (ฟรี — สมัครด้วย GitHub ได้เลย)
- Git ติดตั้งในเครื่อง (ถ้าไม่มี ใช้วิธีอัปโหลดผ่านหน้าเว็บใน**ขั้นที่ 4 ทางเลือก ข**)

> หน้าจอของ Supabase/GitHub อาจขยับตำแหน่งเมนูบ้างตามเวอร์ชัน
> ถ้าหาเมนูไม่เจอ ให้ใช้ช่องค้นหาในแดชบอร์ด (กด `Ctrl/Cmd + K`) แล้วพิมพ์ชื่อเมนู

---

## ขั้นที่ 1 — สร้างโปรเจกต์ Supabase และรัน SQL

### 1.1 สร้างโปรเจกต์

1. เข้า <https://supabase.com> กด **Start your project** / **Sign in** (แนะนำ *Continue with GitHub*)
2. ที่หน้า Dashboard กด **New project**
3. กรอกข้อมูล
   - **Organization** — ถ้ายังไม่มี กด *New organization* ตั้งชื่อบริษัท เลือกแพลน **Free**
   - **Project name** — เช่น `hr-assessment`
   - **Database Password** — กด *Generate a password* แล้ว **คัดลอกเก็บไว้ในที่ปลอดภัย**
     (ไม่ได้ใช้ในเว็บนี้ แต่จำเป็นถ้าจะต่อฐานข้อมูลตรงในอนาคต และดูย้อนหลังไม่ได้)
   - **Region** — เลือก **Southeast Asia (Singapore)** เร็วที่สุดสำหรับผู้ใช้ในไทย
4. กด **Create new project** แล้วรอประมาณ 1-2 นาทีจนสถานะเปลี่ยนจาก *Setting up* เป็นพร้อมใช้งาน

### 1.2 รันสคริปต์สร้างตาราง

1. เมนูซ้ายมือ เลือกไอคอน **SQL Editor**
2. กด **New query** (หรือ *+*)
3. เปิดไฟล์ `supabase/schema.sql` ในเครื่อง **คัดลอกทั้งไฟล์** มาวางในช่อง
4. กด **Run** (หรือ `Ctrl + Enter`)
5. ต้องขึ้นข้อความ **Success. No rows returned** — ถือว่าผ่าน

### 1.3 ตรวจว่าตารางเกิดจริง

1. เมนูซ้าย → **Table Editor**
2. ต้องเห็นตาราง **`assessment_responses`** อยู่ใน schema `public`
3. คลิกที่ตาราง จะเห็นคอลัมน์ `full_name`, `answers`, `scores`, `primary_color` ฯลฯ (ยังไม่มีข้อมูล = ปกติ)

### 1.4 ตรวจว่า RLS เปิดอยู่ (สำคัญมาก)

1. เมนูซ้าย → **Authentication** → **Policies**
   (บางเวอร์ชันอยู่ที่ **Database → Policies**)
2. หาตาราง `assessment_responses` ต้องเห็น
   - ป้าย **RLS enabled** (ไม่ใช่ *RLS disabled*)
   - policy 4 อัน: `anyone can submit`, `authenticated can read`,
     `authenticated can update notes`, `authenticated can delete`

ถ้าเห็นครบ = คนภายนอกส่งแบบประเมินได้ แต่ **อ่านข้อมูลผู้สมัครไม่ได้**

---

## ขั้นที่ 2 — คัดลอกกุญแจมาใส่ `config.js`

### 2.1 หากุญแจ

1. เมนูซ้ายล่าง → **Project Settings** (ไอคอนเฟือง) → **API Keys**
   (บางเวอร์ชันชื่อ **API**)
2. คัดลอก 2 ค่านี้

| ช่องในหน้า Supabase | ตัวอย่างค่า | เอาไปใส่ที่ |
|---|---|---|
| **Project URL** | `https://abcdefghijk.supabase.co` | `SUPABASE_URL` |
| **anon** / **public** key<br>(เวอร์ชันใหม่ชื่อ **Publishable key**) | `eyJhbGciOi...` หรือ `sb_publishable_...` | `SUPABASE_ANON_KEY` |

> ⛔ **ห้าม** คัดลอกช่อง **`service_role`** หรือ **Secret key** มาใส่เด็ดขาด
> กุญแจนั้นข้าม RLS ได้ทั้งหมด ถ้าหลุดขึ้นเว็บ = ใครก็อ่าน/ลบข้อมูลผู้สมัครได้

### 2.2 แก้ไฟล์

เปิด `config.js` ด้วย Notepad / VS Code แล้วแก้ให้เป็นแบบนี้

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://abcdefghijk.supabase.co",   // ← วางของจริง
  SUPABASE_ANON_KEY: "eyJhbGciOi...",                // ← วางของจริง

  ORG_NAME: "บริษัท ตัวอย่าง จำกัด",
  FORM_TITLE: "แบบประเมินบุคลิกภาพก่อนสัมภาษณ์งาน",

  // ระบุตำแหน่งให้เลือกจาก dropdown  ([] = ให้ผู้สมัครพิมพ์เอง)
  POSITIONS: ["เจ้าหน้าที่การตลาด", "โปรแกรมเมอร์", "ธุรการ"],

  REQUIRE_EMAIL: true,              // บังคับกรอกอีเมล
  SHOW_RESULT_TO_CANDIDATE: true,   // false = ผู้สมัครเห็นแค่หน้าขอบคุณ
};
```

**ข้อควรระวังตอนแก้**
- อย่าลบเครื่องหมาย `"` หรือ `,` ท้ายบรรทัด
- URL ต้องไม่มี `/` ปิดท้าย
- คัดลอกกุญแจให้ครบทั้งสตริง (ยาวมาก อย่าให้ขาด)

### 2.3 ทดสอบในเครื่องก่อนขึ้นจริง

เปิด Command Prompt / Terminal ที่โฟลเดอร์โปรเจกต์ แล้วสั่ง

```bash
python -m http.server 8000
```

เปิดเบราว์เซอร์ไปที่ <http://localhost:8000>

- ถ้าแถบเหลือง "ยังไม่ได้ตั้งค่า Supabase" **หายไป** = ใส่ค่าถูกแล้ว
- ลองทำแบบประเมินจนจบ 9 ข้อ ต้องขึ้นข้อความเขียว **"บันทึกผลเรียบร้อยแล้ว"**
- กลับไปที่ Supabase → **Table Editor → assessment_responses** ต้องเห็นแถวข้อมูลที่เพิ่งส่ง

> ต้องเปิดผ่าน `http://localhost` เท่านั้น
> ถ้าดับเบิลคลิกไฟล์ `index.html` ตรง ๆ (`file:///...`) เบราว์เซอร์จะบล็อกการเชื่อมต่อ

---

## ขั้นที่ 3 — สร้างบัญชี HR และปิดการสมัครสมาชิกเอง

### 3.1 สร้าง user ให้ HR

1. เมนูซ้าย → **Authentication** → **Users**
2. กด **Add user** → เลือก **Create new user**
3. กรอก
   - **Email** — อีเมลของ HR เช่น `hr@company.com`
   - **Password** — ตั้งรหัสผ่านที่คาดเดายาก (อย่างน้อย 8 ตัว)
   - ✅ ติ๊ก **Auto Confirm User** — **ห้ามลืม** ไม่งั้นล็อกอินไม่ได้เพราะยังไม่ยืนยันอีเมล
4. กด **Create user**
5. ถ้ามี HR หลายคน ทำซ้ำได้เรื่อย ๆ ทุกคนจะเห็นข้อมูลชุดเดียวกัน

### 3.2 ปิดไม่ให้คนนอกสมัครเอง (สำคัญมาก)

ถ้าไม่ปิด ใครก็ตามที่เห็น anon key ในหน้าเว็บ จะสมัครบัญชีเองแล้วเข้าไปอ่านข้อมูลผู้สมัครได้

1. เมนูซ้าย → **Authentication** → **Sign In / Providers**
   (บางเวอร์ชันคือ **Authentication → Providers**)
2. คลิกที่ **Email**
3. ปิดสวิตช์ **Allow new users to sign up** (บางเวอร์ชันชื่อ *Enable sign ups*)
4. กด **Save**

> ตรวจซ้ำ: เปิด `admin.html` แล้วลองล็อกอินด้วยอีเมลมั่ว ๆ ต้องขึ้น error เท่านั้น
> ห้ามมีปุ่มหรือช่องทางให้สมัครสมาชิกใหม่

### 3.3 (แนะนำ) ตั้ง Site URL

หลังได้ลิงก์ GitHub Pages ในขั้นที่ 4 แล้ว ให้กลับมาที่
**Authentication → URL Configuration → Site URL** แล้วใส่
`https://<username>.github.io/<repo>/`

ไม่จำเป็นสำหรับการล็อกอินด้วยรหัสผ่าน แต่จำเป็นถ้าวันหลังจะเปิดใช้ลิงก์รีเซ็ตรหัสผ่าน

---

## ขั้นที่ 4 — ขึ้น GitHub Pages

### 4.1 สร้าง repository

1. เข้า <https://github.com> กด **+** มุมขวาบน → **New repository**
2. ตั้งค่า
   - **Repository name** — เช่น `hr-assessment`
   - **Public** ⚠️ **ต้องเป็น Public** เพราะ GitHub Pages ของบัญชีฟรีใช้กับ private repo ไม่ได้
     (ปลอดภัย เพราะ RLS ป้องกันไว้แล้ว — anon key ถูกออกแบบให้เปิดเผยได้)
   - **อย่า** ติ๊ก *Add a README file* (เรามีอยู่แล้ว)
3. กด **Create repository**

### 4.2 ทางเลือก ก — อัปโหลดด้วย Git (แนะนำ)

เปิด Terminal ที่โฟลเดอร์ `D:\personality-assessment` แล้วรันทีละบรรทัด

```bash
git init
git add .
git commit -m "แบบประเมินบุคลิกภาพก่อนสัมภาษณ์งาน"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

- แทน `<username>` และ `<repo>` ด้วยของจริง
- ถ้าถาม username/password ให้ใช้ **Personal Access Token** แทนรหัสผ่าน
  (GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  → Generate new token → ติ๊กสิทธิ์ `repo`)

### 4.3 ทางเลือก ข — อัปโหลดผ่านหน้าเว็บ (ไม่ต้องใช้ Git)

1. ในหน้า repo กด **uploading an existing file**
2. ลากไฟล์ทั้งหมด **รวมถึงโฟลเดอร์ `supabase`** เข้าไปวาง
3. กด **Commit changes**

> วิธีนี้จะไม่ได้ไฟล์ที่ขึ้นต้นด้วยจุด (`.nojekyll`, `.github`) เพราะเบราว์เซอร์ซ่อนไว้
> เว็บยังทำงานได้ปกติ แค่ต้องใช้ **Deploy from a branch** ในขั้นถัดไป

### 4.4 เปิด GitHub Pages

1. ในหน้า repo → แท็บ **Settings** (ด้านบน)
2. เมนูซ้าย → **Pages**
3. หัวข้อ **Build and deployment**
   - **Source** → เลือก **Deploy from a branch**
   - **Branch** → เลือก **`main`** และโฟลเดอร์ **`/ (root)`**
4. กด **Save**
5. รอ 1-3 นาที กด refresh หน้า Pages จะขึ้นแถบเขียว
   **"Your site is live at ..."**

ถ้าอยากใช้ GitHub Actions แทน (repo นี้มี workflow ให้แล้ว)
ให้เลือก **Source → GitHub Actions** แล้วดูสถานะที่แท็บ **Actions**

---

## ขั้นที่ 5 — แจกลิงก์และตรวจงานจริง

### 5.1 ลิงก์ที่ได้

| ใคร | ลิงก์ |
|---|---|
| **ผู้สมัคร** | `https://<username>.github.io/<repo>/` |
| **HR** | `https://<username>.github.io/<repo>/admin.html` |

### 5.2 ทดสอบครบวงจร (ทำก่อนส่งให้ผู้สมัครจริง)

1. เปิดลิงก์ผู้สมัครในมือถือ กรอกชื่อทดสอบ ทำครบ 9 ข้อ
2. ต้องขึ้น **"บันทึกผลเรียบร้อยแล้ว"** สีเขียว
3. เปิด `admin.html` → ล็อกอินด้วยบัญชี HR → ต้องเห็นแถวข้อมูลที่เพิ่งทำ
4. คลิกที่แถว → ต้องกางดูคำตอบรายข้อได้
5. กด **⬇ ดาวน์โหลด CSV** → เปิดด้วย Excel ต้องอ่านภาษาไทยได้ไม่เพี้ยน
6. ลบแถวทดสอบทิ้งที่ Supabase → Table Editor (คลิกขวาที่แถว → Delete row)

### 5.3 วิธีส่งให้ผู้สมัคร

ตัวอย่างข้อความ

> เรียนคุณ [ชื่อ]
> ก่อนวันสัมภาษณ์ รบกวนทำแบบประเมินบุคลิกภาพสั้น ๆ 9 ข้อ (ใช้เวลา 3-5 นาที) ตามลิงก์นี้ครับ
> https://xxx.github.io/hr-assessment/
> ไม่มีคำตอบถูกหรือผิด ขอให้เลือกข้อที่ตรงกับตัวคุณมากที่สุด
> ผลไม่มีผลต่อการตัดสินรับเข้าทำงาน ใช้เพื่อเตรียมประเด็นพูดคุยเท่านั้นครับ

---

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `new row violates row-level security policy` | ยังไม่ได้รัน `schema.sql` หรือ policy `anyone can submit` หาย → รัน SQL ใหม่อีกครั้ง |
| `Invalid API key` | คัดลอก anon key ไม่ครบ หรือเผลอเอา service_role มาใส่ → คัดลอกใหม่ทั้งสตริง |
| `Failed to fetch` / `TypeError: fetch` | `SUPABASE_URL` ผิด (มี `/` ปิดท้าย, พิมพ์ตก) หรือโปรเจกต์ Supabase ถูก pause → เข้าแดชบอร์ดกด Restore |
| ล็อกอิน admin ขึ้น `Invalid login credentials` | ไม่ได้ติ๊ก **Auto Confirm User** ตอนสร้าง user → ลบ user แล้วสร้างใหม่ |
| หน้า GitHub Pages ขึ้น **404** | เลือก branch/folder ผิด (ต้องเป็น `main` + `/ (root)`) หรือ `index.html` ไม่ได้อยู่ชั้นบนสุดของ repo |
| แก้ไฟล์แล้วเว็บไม่เปลี่ยน | GitHub Pages แคชไว้ → รอ 1-2 นาที แล้วกด `Ctrl + F5` |
| ตาราง admin ว่างทั้งที่มีคนทำแล้ว | ล็อกอินหมดอายุ → กดออกจากระบบแล้วเข้าใหม่ |
| CSV เปิดใน Excel เป็นตัวยึกยือ | ไฟล์มี BOM อยู่แล้ว ถ้ายังเพี้ยนให้เปิดผ่าน Data → From Text/CSV แล้วเลือก UTF-8 |
| Supabase ฟรีถูก pause | โปรเจกต์ฟรีที่ไม่มีการใช้งาน 7 วันจะถูก pause → เข้าแดชบอร์ดกด **Restore project** |

---

## หลังใช้งานจริง

- **ลบข้อมูลผู้สมัครเก่าเป็นรอบ ๆ** (PDPA) — SQL Editor รัน

  ```sql
  delete from public.assessment_responses
  where created_at < now() - interval '180 days';
  ```

- **ดูภาพรวมสถิติ** — SQL Editor รัน `select * from public.assessment_summary;`
- **แก้คำถาม/คำอธิบายผล** — แก้ไฟล์ `data.js` ไฟล์เดียว แล้ว `git push` ใหม่
- **สำรองข้อมูล** — กดปุ่มดาวน์โหลด CSV ในหน้า admin เป็นระยะ
