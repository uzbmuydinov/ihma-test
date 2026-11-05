# IHMA malaka baholash — Telegram Mini App (pilot)

Xodim Telegram bot ichida keysni yechadi. Javob Google jadvalga tushadi, Claude uni baholaydi, natija botga keladi.

```
Xodim (Telegram) → Mini App (shu repo, GitHub Pages) → Apps Script (apps-script/Code.gs) → Google Sheets
                                                                                   ↑            │
                                                         bot xabari (har daqiqa) ──┘            ▼
                                                                         Claude hakam (admin paneli / har soatlik vazifa)
```

| Fayl | Nima |
|---|---|
| `index.html` | Telegram ichida ochiladigan sahifa (3 til, hudud/tuman, 40 daqiqalik taymer, natija) |
| `apps-script/Code.gs` | Backend: javobni qabul qiladi, Telegram imzosini tekshiradi, botdan xabar yuboradi |
| `Kalitlar.gs` | **Repoda yo'q, maxfiy.** Ideal javoblar. Admin alohida oladi |

## O'rnatish (bir marta)

### 0. Claude maxfiylik sozlamasi
claude.ai → Settings → Privacy → **"Help improve Claude"** ni o'chiring (xodimlar javobi shu hisob orqali baholanadi).

### 1. Bot
1. Telegram'da **@BotFather** → `/newbot`.
2. Nomi: `IHMA malaka baholash`, username: masalan `ihma_baholash_bot` (oxiri `bot` bilan tugashi shart).
3. BotFather bergan **tokenni** saqlang. Uni hech kimga yubormang va GitHub'ga yozmang.

### 2. Google jadval va Apps Script
1. [sheets.google.com](https://sheets.google.com) → **Bo'sh jadval** → nomi: `IHMA malaka baholash`.
2. **Kengaytmalar → Apps Script**.
3. `Code.gs` dagi bor kodni o'chirib, shu repodagi `apps-script/Code.gs` ni to'liq qo'ying.
4. Chapda **+ → Script** → nomi `Kalitlar` → admin bergan `Kalitlar.gs` matnini qo'ying. **Saqlash** (💾).
5. ⚙️ **Project Settings → Script Properties → Add script property**:
   - `BOT_TOKEN` = BotFather tokeni
6. Muharrirda funksiya ro'yxatidan **`setup`** ni tanlab **Run**. Birinchi marta ruxsat so'raydi:
   Review permissions → hisobingiz → Advanced → *Go to … (unsafe)* → Allow.
   Execution log'da `Bot ulandi: @...` chiqishi kerak.
7. **`setupKeys`** ni tanlab **Run** → "Kalitlar" varag'ida 3 ta keys paydo bo'ladi.
8. **Deploy → New deployment** → ⚙️ **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** → **Web app URL** ni nusxalang (`…/exec` bilan tugaydi). Bu manzil maxfiy emas.

### 3. Sahifani ulash va joylash
1. `index.html` dagi `@@API_URL@@` o'rniga Web app URL qo'yiladi (Claude qiladi yoki o'zingiz).
2. GitHub: repo **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
   1–2 daqiqada sahifa ochiladi: `https://uzbmuydinov.github.io/ihma-test/`

### 4. Botga tugma
@BotFather → `/mybots` → botingiz → **Bot Settings → Menu Button** →
URL: `https://uzbmuydinov.github.io/ihma-test/`, matn: `Testni boshlash`.
Ixtiyoriy: `/setdescription` — "Malakani baholash testi. Pastdagi «Testni boshlash» tugmasini bosing."

### 5. Claude'ni jadvalga ulash
claude.ai → Settings → **Connectors → Google Sheets** → Connect (jadval turgan Google hisob bilan).

### 6. Sinov
Botni oching → **Start** → **Testni boshlash** → test → yuborish.
Jadvalda yangi qator `navbatda` holatida paydo bo'lishi kerak.

## Kod o'zgarganda
Apps Script'da kodni almashtirgach: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
Manzil o'zgarmaydi.

## Jadval ustunlari (Urinishlar)
Holat: `boshlandi` → `navbatda` → `baholanmoqda` → `baholandi` (yoki `xato`).
Baholovchi yozadigan ustunlar: H (Holat), I (Ball), J (Maks.), K (Mustaqillik %), P (Baholangan), Q (Xulosa), R (Natija JSON), AC (claim).
"Xabar yuborilgan" (S) to'lmaguncha bot har daqiqada tekshiradi.

## Xavfsizlik
- Har bir so'rovda Telegram `initData` imzosi bot tokeni bilan tekshiriladi: soxta so'rov rad etiladi, xodim faqat o'z natijasini ko'radi.
- Bot tokeni faqat Script Properties'da. Ideal javoblar faqat "Kalitlar" varag'ida (repoda yo'q).
