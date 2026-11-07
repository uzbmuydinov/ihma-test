/**
 * IHMA malaka baholash — Telegram Mini App uchun backend (Google Apps Script).
 *
 * Nima qiladi:
 *   doPost  — Mini App so'rovlari: init / start / submit / result.
 *             Har so'rovda Telegram initData imzosi bot tokeni bilan tekshiriladi.
 *   notifyTick — har daqiqada: baholangan urinishlar egasiga botdan xabar yuboradi.
 *   setup   — bir marta: varaqlar, ustunlar, hisobot va daqiqalik triggerni yaratadi.
 *
 * Maxfiy qiymatlar kodda emas, Script Properties'da:
 *   BOT_TOKEN   — @BotFather bergan token (majburiy)
 *   MINIAPP_URL — Mini App manzili (GitHub Pages)
 *
 * Ideal javoblar bu faylda YO'Q. Ular alohida Kalitlar.gs orqali "Kalitlar" varag'iga yoziladi.
 */

var CFG = { minutes: 40, graceSec: 120, maxAnswer: 8000, authMaxAgeSec: 86400, claimStaleMin: 15, notifyBatch: 25 };
var SHEETS = { att: "Urinishlar", keys: "Kalitlar", rep: "Hisobot" };
var ST = { started: "boshlandi", pending: "navbatda", evaluating: "baholanmoqda", done: "baholandi", error: "xato" };

/* Ustunlar tartibi: [kod nomi, sarlavha]. Kod ustunlarni shu tartib bo'yicha topadi. */
var COLS = [
  ["id", "ID"], ["startedAt", "Boshlangan"], ["fio", "F.I.Sh."], ["regionName", "Hudud"], ["districtName", "Tuman / shahar"],
  ["roleName", "Lavozim"], ["caseName", "Keys"], ["status", "Holat"], ["total", "Ball"], ["max", "Maks."],
  ["clean", "Mustaqillik %"], ["submittedAt", "Topshirilgan"], ["minutes", "Davomiyligi (daq.)"], ["timing", "Vaqt"],
  ["answer", "Javob"], ["evaluatedAt", "Baholangan"], ["summary", "Xulosa"], ["resultJson", "Natija (JSON)"],
  ["notifiedAt", "Xabar yuborilgan"], ["tgId", "Telegram ID"], ["tgUser", "Telegram username"], ["tgName", "Telegram ismi"],
  ["lang", "Til"], ["regionId", "regionId"], ["districtId", "districtId"], ["roleId", "roleId"], ["caseId", "caseId"],
  ["deadline", "deadline"], ["claim", "claim"], ["note", "Izoh"],
  /* mezonlar boʻyicha ball (0–20; 2026-11-07 gacha 0–4), baholovchi yozadi — xarita va oʻquv guruhlari uchun */
  ["c1", "M1 Xatarlar"], ["c2", "M2 Himoya omillari"], ["c3", "M3 Kompleks xulosa"], ["c4", "M4 Xizmat rejasi"], ["c5", "M5 Advokatsiya"],
  /* javob maydoniga matn qoʻyish (paste) bloklangan; nechta urinish boʻlgani — halollik belgisi */
  ["pasteTries", "Nusxa qoʻyish urinishlari"]
];
var C = {};
COLS.forEach(function (c, i) { C[c[0]] = i + 1; });
var NCOL = COLS.length;
var TECH_FROM = C.regionId; // shu ustundan boshlab texnik ustunlar (yashiriladi)

/* Ma'lumotnomalar (ochiq ma'lumot) */
var REGIONS = {"qr":["Qoraqalpogʻiston Respublikasi","1735"],"andijon":["Andijon viloyati","1703"],"buxoro":["Buxoro viloyati","1706"],"fargona":["Fargʻona viloyati","1730"],"jizzax":["Jizzax viloyati","1708"],"xorazm":["Xorazm viloyati","1733"],"namangan":["Namangan viloyati","1714"],"navoiy":["Navoiy viloyati","1712"],"qashqadaryo":["Qashqadaryo viloyati","1710"],"samarqand":["Samarqand viloyati","1718"],"sirdaryo":["Sirdaryo viloyati","1724"],"surxondaryo":["Surxondaryo viloyati","1722"],"toshkentv":["Toshkent viloyati","1727"],"toshkentsh":["Toshkent shahri","1726"]};
var ROLES = {"director":"Inson markazi direktori","chief":"Bosh ijtimoiy xodim","supervisor":"Supervayzer","social":"Ijtimoiy xodim — mahallada kompleks ijtimoiy xizmat koʻrsatuvchi xodim"};
var DISTRICTS = {"1703203":"Andijon tumani","1703224":"Asaka tumani","1703206":"Baliqchi tumani","1703209":"Boʻston tumani","1703210":"Buloqboshi tumani","1703214":"Izboskan tumani","1703211":"Jalaquduq tumani","1703227":"Marxamat tumani","1703202":"Oltinkoʻl tumani","1703232":"Paxtaobod tumani","1703220":"Qoʻrgʻontepa tumani","1703230":"Shahrixon tumani","1703217":"Ulugʻnor tumani","1703236":"Xoʻjaobod tumani","1703401":"Andijon shahri","1703408":"Xonobod shahri","1706207":"Buxoro tumani","1706215":"Gʻijduvon tumani","1706246":"Jondor tumani","1706219":"Kogon tumani","1706204":"Olot tumani","1706240":"Peshku tumani","1706230":"Qorakoʻl tumani","1706232":"Qorovulbozor tumani","1706242":"Romitan tumani","1706258":"Shofirkon tumani","1706212":"Vobkent tumani","1706401":"Buxoro shahri","1706403":"Kogon shahri","1708201":"Arnasoy tumani","1708204":"Baxmal tumani","1708215":"Doʻstlik tumani","1708235":"Forish tumani","1708209":"Gʻallaorol tumani","1708223":"Mirzachoʻl tumani","1708228":"Paxtakor tumani","1708212":"Sharof Rashidov tumani","1708237":"Yangiobod tumani","1708225":"Zafarobod tumani","1708220":"Zarbdor tumani","1708218":"Zomin tumani","1708401":"Jizzax shahri","1710242":"Chiroqchi tumani","1710212":"Dehqonobod tumani","1710207":"Gʻuzor tumani","1710237":"Kasbi tumani","1710232":"Kitob tumani","1710229":"Koson tumani","1710240":"Koʻkdala tumani","1710233":"Mirishkor tumani","1710234":"Muborak tumani","1710235":"Nishon tumani","1710220":"Qamashi tumani","1710224":"Qarshi tumani","1710245":"Shahrisabz tumani","1710250":"Yakkabogʻ tumani","1710401":"Qarshi shahri","1710405":"Shahrisabz shahri","1712234":"Karmana tumani","1712211":"Konimex tumani","1712230":"Navbahor tumani","1712238":"Nurota tumani","1712216":"Qiziltepa tumani","1712244":"Tomdi tumani","1712248":"Uchquduq tumani","1712251":"Xatirchi tumani","1712412":"Gʻozgʻon shahri","1712401":"Navoiy shahri","1712408":"Zarafshon shahri","1714236":"Chortoq tumani","1714237":"Chust tumani","1714401365":"Davlatobod tumani","1714207":"Kosonsoy tumani","1714204":"Mingbuloq tumani","1714212":"Namangan tumani","1714216":"Norin tumani","1714219":"Pop tumani","1714224":"Toʻraqoʻrgʻon tumani","1714234":"Uchqoʻrgʻon tumani","1714229":"Uychi tumani","1714401367":"Yangi Namangan tumani","1714242":"Yangiqoʻrgʻon tumani","1714401":"Namangan shahri","1718206":"Bulungʻur tumani","1718212":"Ishtixon tumani","1718209":"Jomboy tumani","1718215":"Kattaqoʻrgʻon tumani","1718218":"Narpay tumani","1718235":"Nurobod tumani","1718203":"Oqdaryo tumani","1718227":"Pastdargʻom tumani","1718230":"Paxtachi tumani","1718224":"Payariq tumani","1718216":"Qoʻshrabot tumani","1718233":"Samarqand tumani","1718238":"Toyloq tumani","1718236":"Urgut tumani","1718406":"Kattaqoʻrgʻon shahri","1718401":"Samarqand shahri","1724212":"Boyovut tumani","1724220":"Guliston tumani","1724228":"Mirzaobod tumani","1724206":"Oqoltin tumani","1724226":"Sardoba tumani","1724216":"Sayxunobod tumani","1724231":"Sirdaryo tumani","1724235":"Xovos tumani","1724414":"Baxt shahri","1724401":"Guliston shahri","1724410":"Shirin shahri","1724413":"Yangiyer shahri","1726264":"Bektemir tumani","1726294":"Chilonzor tumani","1726273":"Mirobod tumani","1726269":"Mirzo Ulugʻbek tumani","1726280":"Olmazor tumani","1726277":"Shayxontohur tumani","1726283":"Sirgʻali tumani","1726262":"Uchtepa tumani","1726287":"Yakkasaroy tumani","1726292":"Yangihayot tumani","1726290":"Yashnobod tumani","1726266":"Yunusobod tumani","1727220":"Bekobod tumani","1727228":"Boʻka tumani","1727224":"Boʻstonliq tumani","1727256":"Chinoz tumani","1727212":"Ohangaron tumani","1727206":"Oqqoʻrgʻon tumani","1727253":"Oʻrtachirchiq tumani","1727249":"Parkent tumani","1727250":"Piskent tumani","1727248":"Qibray tumani","1727233":"Quyichirchiq tumani","1727265":"Toshkent tumani","1727259":"Yangiyoʻl tumani","1727239":"Yuqorichirchiq tumani","1727237":"Zangiota tumani","1727407":"Angren shahri","1727413":"Bekobod shahri","1727419":"Chirchiq shahri","1727401":"Nurafshon shahri","1727415":"Ohangaron shahri","1727404":"Olmaliq shahri","1727424":"Yangiyoʻl shahri","1730215":"Beshariq tumani","1730209":"Bogʻdod tumani","1730212":"Buvayda tumani","1730236":"Dangʻara tumani","1730233":"Fargʻona tumani","1730238":"Furqat tumani","1730203":"Oltiariq tumani","1730230":"Oʻzbekiston tumani","1730206":"Qoʻshtepa tumani","1730218":"Quva tumani","1730224":"Rishton tumani","1730226":"Soʻx tumani","1730227":"Toshloq tumani","1730221":"Uchkoʻprik tumani","1730242":"Yozyovon tumani","1730401":"Fargʻona shahri","1730412":"Margʻilon shahri","1730405":"Qoʻqon shahri","1730408":"Quvasoy shahri","1733204":"Bogʻot tumani","1733208":"Gurlan tumani","1733212":"Qoʻshkoʻpir tumani","1733230":"Shovot tumani","1733221":"Tuproqqalʼa tumani","1733217":"Urganch tumani","1733220":"Xazorasp tumani","1733226":"Xiva tumani","1733223":"Xonqa tumani","1733233":"Yangiariq tumani","1733236":"Yangibozor tumani","1733401":"Urganch shahri","1733406":"Xiva shahri","1735204":"Amudaryo tumani","1735207":"Beruniy tumani","1735209":"Boʻzatov tumani","1735240":"Chimboy tumani","1735250":"Ellikqalʼa tumani","1735212":"Kegeyli tumani","1735222":"Moʻynoq tumani","1735225":"Nukus tumani","1735218":"Qanlikoʻl tumani","1735211":"Qoraoʻzak tumani","1735215":"Qoʻngʻirot tumani","1735243":"Shumanay tumani","1735228":"Taxiatosh tumani","1735230":"Taxtakoʻpir tumani","1735233":"Toʻrtkoʻl tumani","1735236":"Xoʻjayli tumani","1735401":"Nukus shahri","1722202":"Angor tumani","1722203":"Bandixon tumani","1722204":"Boysun tumani","1722210":"Denov tumani","1722212":"Jarqoʻrgʻon tumani","1722207":"Muzrabot tumani","1722201":"Oltinsoy tumani","1722215":"Qiziriq tumani","1722214":"Qumqoʻrgʻon tumani","1722217":"Sariosiyo tumani","1722223":"Sherobod tumani","1722226":"Shoʻrchi tumani","1722220":"Termiz tumani","1722221":"Uzun tumani","1722401":"Termiz shahri"};
var CASES = {"k1-mavluda":{"n":1,"title":{"lat":"Mavluda va oʻgʻli","cyr":"Мавлуда ва ўғли","ru":"Мавлуда и её сын"}},"k2-ilhom-saida":{"n":2,"title":{"lat":"Ilhom va Saida oilasi","cyr":"Илҳом ва Саида оиласи","ru":"Семья Ильхома и Саиды"}},"k3-jasur":{"n":3,"title":{"lat":"Jasur","cyr":"Жасур","ru":"Жасур"}}};
var MSG = {"lat":{"done":"🏅 Hakam bahosi: {total} / {max} ({pct}%)\nKeys {case}\n\n{summary}\n\nBatafsil koʻrish uchun pastdagi tugmani bosing.","button":"Batafsil koʻrish","docHead":"🏅 Hakam bahosi: {total} / {max} ({pct}%)\n📋 Keys {case}","strong":"💪 Kuchli tomon","weak":"🎯 Eʼtibor qaratish kerak boʻlgan nuqta","docTail":"📎 Toʻliq hisobot — PDF faylda: radar, shkalalar va har bir mezon boʻyicha izoh. Natija sahifasi — pastdagi tugmada.","error":"Javobingizni (keys {case}) avtomatik baholashda muammo boʻldi. Uni admin koʻrib chiqadi."},"cyr":{"done":"🏅 Ҳакам баҳоси: {total} / {max} ({pct}%)\nКейс {case}\n\n{summary}\n\nБатафсил кўриш учун пастдаги тугмани босинг.","button":"Батафсил кўриш","docHead":"🏅 Ҳакам баҳоси: {total} / {max} ({pct}%)\n📋 Кейс {case}","strong":"💪 Кучли томон","weak":"🎯 Эътибор қаратиш керак бўлган нуқта","docTail":"📎 Тўлиқ ҳисобот — PDF файлда: радар, шкалалар ва ҳар бир мезон бўйича изоҳ. Натижа саҳифаси — пастдаги тугмада.","error":"Жавобингизни (кейс {case}) автоматик баҳолашда муаммо бўлди. Уни админ кўриб чиқади."},"ru":{"done":"🏅 Оценка эксперта: {total} / {max} ({pct}%)\nКейс {case}\n\n{summary}\n\nНажмите кнопку ниже, чтобы посмотреть подробности.","button":"Подробнее","docHead":"🏅 Оценка эксперта: {total} / {max} ({pct}%)\n📋 Кейс {case}","strong":"💪 Сильная сторона","weak":"🎯 На что обратить внимание","docTail":"📎 Полный отчёт — в PDF-файле: радар, шкалы и комментарий по каждому критерию. Страница результата — по кнопке ниже.","error":"При автоматической оценке вашего ответа (кейс {case}) возникла проблема. Его рассмотрит администратор."}};

/* ================= HTTP ================= */
function doGet() {
  return ContentService.createTextOutput("IHMA API ishlayapti");
}

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var user = verifyInitData_(req.initData);
    if (!user) return json_({ ok: false, error: "auth" });
    if (req.action === "init") out = apiInit_(user);
    else if (req.action === "start") out = apiStart_(user, req);
    else if (req.action === "submit") out = apiSubmit_(user, req);
    else if (req.action === "result") out = apiResult_(user, req);
    else out = { ok: false, error: "action" };
  } catch (err) {
    out = { ok: false, error: "server", message: String((err && err.message) || err).slice(0, 200) };
  }
  out.serverNow = Date.now();
  return json_(out);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ================= Telegram initData tekshiruvi =================
 * secret = HMAC_SHA256(key="WebAppData", message=BOT_TOKEN)
 * hash   = hex(HMAC_SHA256(key=secret, message=data_check_string))
 * data_check_string: hash'dan boshqa barcha maydonlar, alifbo tartibida, "key=value", "\n" bilan.
 * Telegram'ning yangi "signature" maydoni bilan ham ishlashi uchun ikkala variant tekshiriladi.
 */
function verifyInitData_(initData) {
  if (!initData || typeof initData !== "string" || initData.length > 8192) return null;
  var token = prop_("BOT_TOKEN");
  if (!token) throw new Error("BOT_TOKEN sozlanmagan");
  var fields = {}, hash = "";
  initData.split("&").forEach(function (part) {
    var i = part.indexOf("=");
    if (i < 0) return;
    var k = decodeURIComponent(part.slice(0, i).replace(/\+/g, " "));
    var v = decodeURIComponent(part.slice(i + 1).replace(/\+/g, " "));
    if (k === "hash") hash = v; else fields[k] = v;
  });
  if (!hash) return null;
  var secret = Utilities.computeHmacSha256Signature(bytes_(token), bytes_("WebAppData"));
  var check = function (keys) {
    var dcs = keys.sort().map(function (k) { return k + "=" + fields[k]; }).join("\n");
    return hex_(Utilities.computeHmacSha256Signature(bytes_(dcs), secret)) === hash.toLowerCase();
  };
  var all = Object.keys(fields);
  var ok = check(all.slice()) || (fields.signature != null && check(all.filter(function (k) { return k !== "signature"; })));
  if (!ok) return null;
  var authDate = Number(fields.auth_date);
  if (!authDate || Date.now() / 1000 - authDate > CFG.authMaxAgeSec) return null;
  var u = {};
  try { u = JSON.parse(fields.user || "{}"); } catch (e) { return null; }
  if (!u.id) return null;
  return {
    id: String(u.id),
    username: u.username ? "@" + u.username : "",
    name: [u.first_name, u.last_name].filter(Boolean).join(" "),
    lang: u.language_code || ""
  };
}
function bytes_(s) { return Utilities.newBlob(String(s)).getBytes(); }
function hex_(arr) {
  return arr.map(function (b) { var v = (b + 256) % 256; return (v < 16 ? "0" : "") + v.toString(16); }).join("");
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }

/* ================= Jadval yordamchilari ================= */
function sheet_(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error("Varaq topilmadi: " + name + ". setup() ni ishga tushiring.");
  /* yangi ustun qoʻshilgan boʻlsa (kod yangilanib, setup hali ishlamagan), jadvalni kengaytirib qoʻyamiz */
  if (name === SHEETS.att && !sheet_.wide) {
    var mc = sh.getMaxColumns();
    if (mc < NCOL) {
      sh.insertColumnsAfter(mc, NCOL - mc);
      sh.getRange(1, mc + 1, 1, NCOL - mc).setValues([COLS.slice(mc).map(function (c) { return c[1]; })]).setFontWeight("bold");
    }
    sheet_.wide = true;
  }
  return sh;
}
function rowObj_(vals) {
  var o = {};
  COLS.forEach(function (c, i) { o[c[0]] = vals[i]; });
  return o;
}
/* Xodim yozgan matn "=", "+", "-", "@" bilan boshlansa, Sheets uni formula deb o'qiydi
   (masalan =IMPORTXML(...) jadval ma'lumotini tashqariga chiqarishi mumkin).
   Oldiga ' qo'yilsa, katakda oddiy matn sifatida saqlanadi (' ko'rinmaydi). */
function cellSafe_(v) { return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v; }
function rowArr_(o) {
  return COLS.map(function (c) { return o[c[0]] == null ? "" : cellSafe_(o[c[0]]); });
}
/* Formuladagi argument ajratgichi jadval tiliga (locale) bog'liq: en_US — ",", uz_UZ / ru_RU — ";".
   uz_UZ da setFormula("=SUM(1,2)") 3 emas, 1,2 (o'nli son) beradi. Shuning uchun bir marta sinab aniqlaymiz. */
function formulaSep_(sh) {
  var c = sh.getRange(1, 26);
  c.setFormula("=SUM(1,2)");
  SpreadsheetApp.flush();
  var sep = c.getValue() === 3 ? "," : ";";
  c.clearContent();
  return sep;
}
/* 1-ustun matn, qolganlari formula (kod ichida "," bilan yozilgan, jadval tiliga moslab almashtiriladi). */
function putFormulaRows_(sh, r, rows, sep) {
  sh.getRange(r, 1, rows.length, 1).setValues(rows.map(function (x) { return [x[0]]; }));
  sh.getRange(r, 2, rows.length, rows[0].length - 1).setFormulas(rows.map(function (x) {
    return x.slice(1).map(function (f) { return sep === "," ? f : f.replace(/,/g, sep); });
  }));
  return sh.getRange(r, 1, rows.length, rows[0].length);
}
function readRow_(sh, r) { return rowObj_(sh.getRange(r, 1, 1, NCOL).getValues()[0]); }
function writeRow_(sh, r, o) { sh.getRange(r, 1, 1, NCOL).setValues([rowArr_(o)]); }
function column_(sh, col) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, col, last - 1, 1).getValues().map(function (x) { return x[0]; });
}
/* urinish ID bo'yicha qator raqami (yo'q bo'lsa 0) */
function findRowById_(sh, id) {
  var ids = column_(sh, C.id);
  for (var i = ids.length - 1; i >= 0; i--) if (String(ids[i]) === String(id)) return i + 2;
  return 0;
}
/* shu Telegram foydalanuvchisining barcha qatorlari: [{row, o}] */
function userRows_(sh, tgId) {
  var tg = column_(sh, C.tgId), out = [];
  for (var i = 0; i < tg.length; i++) if (String(tg[i]) === String(tgId)) out.push(i + 2);
  return out.map(function (r) { return { row: r, o: readRow_(sh, r) }; });
}
function iso_(v) {
  if (!v) return "";
  var d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
function makeId_() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function caseName_(id, lang) { var c = CASES[id]; return c ? "№" + c.n + " · " + (c.title[lang] || c.title.lat) : id; }
function shortView_(o) {
  return {
    id: String(o.id), caseId: o.caseId, status: o.status,
    total: o.total === "" ? null : Number(o.total), max: o.max === "" ? null : Number(o.max),
    startedAt: iso_(o.startedAt), submittedAt: iso_(o.submittedAt)
  };
}

/* ================= API ================= */
function apiInit_(user) {
  var sh = sheet_(SHEETS.att);
  var rows = userRows_(sh, user.id);
  var active = null, profile = null;
  rows.forEach(function (x) {
    if (x.o.status === ST.started) active = { id: String(x.o.id), caseId: x.o.caseId, deadline: Number(x.o.deadline), startedAt: iso_(x.o.startedAt) };
    profile = { fio: x.o.fio, region: x.o.regionId, district: String(x.o.districtId), role: x.o.roleId };
  });
  var history = rows.filter(function (x) { return x.o.status !== ST.started; }).map(function (x) { return shortView_(x.o); })
    .sort(function (a, b) { return String(b.submittedAt || b.startedAt).localeCompare(String(a.submittedAt || a.startedAt)); });
  return { ok: true, user: { id: user.id, name: user.name }, active: active, history: history, profile: profile };
}

/* F.I.Sh. jadvalga faqat oʻzbek lotin alifbosida yoziladi (xodim kirillda yozsa ham).
   Kirill → lotin: 1995-yilgi rasmiy qoidalar. "е" soʻz boshida va unlidan keyin "ye", "ц" unlidan keyin "ts", aks holda "s".
   Lotincha apostroflar bir xil koʻrinishga keltiriladi: oʻ, gʻ (U+02BB) va tutuq belgisi ʼ (U+02BC). */
var UZ_CYR_ = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
  "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "ʼ",
  "ь": "", "ы": "i", "э": "e", "ю": "yu", "я": "ya", "ё": "yo", "ў": "oʻ", "қ": "q", "ғ": "gʻ", "ҳ": "h" };
var UZ_CYR_VOW_ = "аеёиоуўэюяы";
function uzLatin_(s) {
  s = String(s == null ? "" : s);
  return s.replace(/[^\s\-]+/g, function (w) {
    var caps = w.length > 1 && w === w.toUpperCase() && w !== w.toLowerCase();
    var out = "";
    for (var i = 0; i < w.length; i++) {
      var ch = w.charAt(i), lo = ch.toLowerCase(), prev = i > 0 ? w.charAt(i - 1).toLowerCase() : "";
      var r;
      if (lo === "е") r = (!prev || UZ_CYR_VOW_.indexOf(prev) >= 0 || prev === "ъ" || prev === "ь" || !/[а-яёўқғҳa-z]/.test(prev)) ? "ye" : "e";
      else if (lo === "ц") r = prev && UZ_CYR_VOW_.indexOf(prev) >= 0 ? "ts" : "s";
      else if (UZ_CYR_.hasOwnProperty(lo)) r = UZ_CYR_[lo];
      else { out += ch; continue; }
      if (ch !== lo && r) r = caps ? r.toUpperCase() : r.charAt(0).toUpperCase() + r.slice(1);
      out += r;
    }
    /* apostroflar: oʻ / gʻ va tutuq belgisi */
    out = out.replace(/([oOgG])['`‘’ʻʼ´]/g, "$1ʻ").replace(/(^|[^oOgG])['`‘’ʻ´]/g, "$1ʼ");
    return out;
  });
}

function apiStart_(user, req) {
  var fio = uzLatin_(String(req.fio || "").trim().replace(/\s+/g, " ")).slice(0, 120);
  var region = String(req.region || ""), district = String(req.district || ""), role = String(req.role || "");
  var lang = ["lat", "cyr", "ru"].indexOf(req.lang) >= 0 ? req.lang : "lat";
  if (fio.split(" ").length < 2) return { ok: false, error: "fio" };
  if (!REGIONS[region]) return { ok: false, error: "region" };
  if (!DISTRICTS[district] || district.indexOf(REGIONS[region][1]) !== 0) return { ok: false, error: "district" };
  if (!ROLES[role]) return { ok: false, error: "role" };
  return withLock_(function () {
    var sh = sheet_(SHEETS.att);
    var rows = userRows_(sh, user.id);
    var act = rows.filter(function (x) { return x.o.status === ST.started; })[0];
    if (act) return { ok: true, resumed: true, attempt: { id: String(act.o.id), caseId: act.o.caseId, deadline: Number(act.o.deadline), startedAt: iso_(act.o.startedAt), fio: String(act.o.fio) } };
    /* keys: xodim eng kam yechganlari orasidan tasodifiy */
    var used = {};
    Object.keys(CASES).forEach(function (id) { used[id] = 0; });
    rows.forEach(function (x) { if (used[x.o.caseId] != null) used[x.o.caseId]++; });
    var min = Math.min.apply(null, Object.keys(used).map(function (k) { return used[k]; }));
    var pool = Object.keys(used).filter(function (k) { return used[k] === min; });
    var caseId = pool[Math.floor(Math.random() * pool.length)];
    var now = new Date();
    var o = {
      id: makeId_(), startedAt: now, fio: fio, regionName: REGIONS[region][0], districtName: DISTRICTS[district],
      roleName: ROLES[role], caseName: caseName_(caseId), status: ST.started,
      tgId: user.id, tgUser: user.username, tgName: user.name, lang: lang,
      regionId: region, districtId: district, roleId: role, caseId: caseId,
      deadline: now.getTime() + CFG.minutes * 60000
    };
    writeRow_(sh, sh.getLastRow() + 1, o); // appendRow emas: cellSafe_ (') aniq setValues orqali ishlaydi
    return { ok: true, attempt: { id: o.id, caseId: caseId, deadline: o.deadline, startedAt: now.toISOString(), fio: fio } };
  });
}

function apiSubmit_(user, req) {
  var id = String(req.attemptId || "");
  var answer = String(req.answer == null ? "" : req.answer).slice(0, CFG.maxAnswer);
  if (!answer.trim() && !req.auto) return { ok: false, error: "empty" };
  return withLock_(function () {
    var sh = sheet_(SHEETS.att);
    var r = findRowById_(sh, id);
    if (!r) return { ok: false, error: "notfound" };
    var o = readRow_(sh, r);
    if (String(o.tgId) !== user.id) return { ok: false, error: "notfound" };
    if (o.status !== ST.started) return { ok: true, status: o.status, already: true };
    var now = new Date();
    var late = now.getTime() > Number(o.deadline) + CFG.graceSec * 1000;
    o.answer = answer.trim() ? answer : "(javob bo'sh)";
    o.submittedAt = now;
    o.minutes = Math.max(1, Math.round((now.getTime() - new Date(o.startedAt).getTime()) / 60000));
    o.timing = late ? "Kech" : (req.auto ? "Avto" : "Vaqtida");
    o.pasteTries = Math.max(0, Math.min(9999, parseInt(req.pasteTries, 10) || 0));
    o.status = ST.pending;
    writeRow_(sh, r, o);
    return { ok: true, status: o.status };
  });
}

function apiResult_(user, req) {
  var sh = sheet_(SHEETS.att);
  var r = findRowById_(sh, String(req.attemptId || ""));
  if (!r) return { ok: false, error: "notfound" };
  var o = readRow_(sh, r);
  if (String(o.tgId) !== user.id) return { ok: false, error: "notfound" };
  var result = null;
  if (o.status === ST.done && o.resultJson) { try { result = JSON.parse(o.resultJson); } catch (e) { result = null; } }
  return {
    ok: true,
    attempt: {
      id: String(o.id), caseId: o.caseId, fio: o.fio, region: o.regionId, district: String(o.districtId), role: o.roleId, lang: o.lang,
      startedAt: iso_(o.startedAt), submittedAt: iso_(o.submittedAt), status: o.status, timing: o.timing,
      minutes: o.minutes === "" ? null : Number(o.minutes), result: result
    }
  };
}

/* ================= Bot xabarlari (har daqiqada) ================= */
function notifyTick() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var sh = sheet_(SHEETS.att);
    var last = sh.getLastRow();
    if (last < 2) return;
    var n = last - 1;
    var status = sh.getRange(2, C.status, n, 1).getValues();
    var notified = sh.getRange(2, C.notifiedAt, n, 1).getValues();
    var claims = sh.getRange(2, C.claim, n, 1).getValues();
    var sent = 0, now = Date.now();
    for (var i = 0; i < n && sent < CFG.notifyBatch; i++) {
      var st = status[i][0], r = i + 2;
      /* osilib qolgan "baholanmoqda" holatini navbatga qaytarish */
      if (st === ST.evaluating) {
        var t = Date.parse(String(claims[i][0]).split("|")[1] || "");
        if (!t || now - t > CFG.claimStaleMin * 60000) { sh.getRange(r, C.status).setValue(ST.pending); sh.getRange(r, C.claim).setValue(""); }
        continue;
      }
      if ((st === ST.done || st === ST.error) && !notified[i][0]) {
        var o = readRow_(sh, r);
        var res = sendResult_(o);
        sh.getRange(r, C.notifiedAt).setValue(res.ok ? new Date() : "xato: " + res.code);
        sent++;
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function sendResult_(o) {
  var m = MSG[o.lang] || MSG.lat;
  var url = (prop_("MINIAPP_URL") || "") + "?a=" + encodeURIComponent(String(o.id));
  var markup = prop_("MINIAPP_URL") ? { inline_keyboard: [[{ text: m.button, web_app: { url: url } }]] } : null;
  if (o.status !== ST.done) return tg_("sendMessage", { chat_id: String(o.tgId), text: m.error.replace("{case}", caseName_(o.caseId, o.lang)) });
  var res = null;
  try { res = JSON.parse(String(o.resultJson || "")); } catch (e) { res = null; }
  /* admin "Ball" ustunini qoʻlda tuzatgan boʻlsa — jadvaldagi qiymat ustun */
  if (res && o.total !== "" && o.total != null && isFinite(Number(o.total))) res.total = Number(o.total);
  /* 1) PDF hisobot (Report.gs) + izohda qisqa xulosa + "Batafsil koʻrish" tugmasi */
  if (res && res.criteria && res.criteria.length && typeof reportPdf_ === "function") {
    try {
      var r = tgDoc_(o.tgId, reportPdf_(o, res), docCaption_(o, res, m), markup);
      if (r.ok || r.code === 403) return r;            // 403 — foydalanuvchi botni bloklagan, matn ham bormaydi
      Logger.log("PDF yuborilmadi (" + r.code + " " + (r.body && r.body.description) + "), matn yuboriladi: " + o.id);
    } catch (err) { Logger.log("PDF xatosi: " + err + " · " + o.id); }
  }
  /* 2) zaxira: oddiy matnli xabar */
  var total = Number(o.total), max = Number(o.max) || 20;
  var text = m.done.replace("{total}", fmt_(total)).replace("{max}", max).replace("{pct}", Math.round(total / max * 100))
    .replace("{case}", caseName_(o.caseId, o.lang)).replace("{summary}", String(o.summary || "").slice(0, 600));
  var payload = { chat_id: String(o.tgId), text: text };
  if (markup) payload.reply_markup = markup;
  return tg_("sendMessage", payload);
}
/* PDF izohi (Telegram cheklovi 1024 belgi): ball, keys, xulosa, kuchli tomon va eʼtibor qaratish kerak boʻlgan nuqta */
function docCaption_(o, res, m) {
  var L = REPORT_NAMES.crit[o.lang] ? o.lang : "lat";
  var crit = repCrit_(res, { crit: REPORT_NAMES.crit[L], short: REPORT_NAMES.short[L] }), sw = repStrongWeak_(crit);
  var total = Number(res.total), max = Number(res.max) || 20;
  if (!isFinite(total)) total = Number(o.total) || 0;
  var head = m.docHead.replace("{total}", fmt_(total)).replace("{max}", max).replace("{pct}", Math.round(total / max * 100)).replace("{case}", caseName_(o.caseId, o.lang));
  var pick = function (label, c) { return c ? label + ": " + c.name + " — " + fmt_(c.score) + "/" + c.max : ""; };
  var mid = [pick(m.strong, sw.strong[0]), pick(m.weak, sw.weak[0])].filter(Boolean).join("\n");
  var tail = (mid ? "\n\n" + mid : "") + "\n\n" + m.docTail;
  var summary = String(res.summary || o.summary || "").trim(), room = 1000 - head.length - tail.length - 6;
  if (summary.length > room) summary = summary.slice(0, Math.max(0, room - 1)).replace(/\s+\S*$/, "") + "…";
  return head + (summary ? "\n\n📝 " + summary : "") + tail;
}
function tgDoc_(chatId, blob, caption, markup) {
  var payload = { chat_id: String(chatId), document: blob, caption: caption };
  if (markup) payload.reply_markup = JSON.stringify(markup);
  var res = UrlFetchApp.fetch("https://api.telegram.org/bot" + prop_("BOT_TOKEN") + "/sendDocument", { method: "post", payload: payload, muteHttpExceptions: true });
  var code = res.getResponseCode(), body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) {}
  return { ok: code === 200 && body.ok === true, code: code, body: body };
}
function fmt_(v) { return String(Math.round(v * 10) / 10).replace(".", ","); }
function tg_(method, payload) {
  var res = UrlFetchApp.fetch("https://api.telegram.org/bot" + prop_("BOT_TOKEN") + "/" + method, {
    method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var code = res.getResponseCode(), body = {};
  try { body = JSON.parse(res.getContentText()); } catch (e) {}
  return { ok: code === 200 && body.ok === true, code: code, body: body };
}

/* ================= Bir martalik sozlash ================= */
function setup() {
  if (!prop_("BOT_TOKEN")) throw new Error("Avval Script Properties'ga BOT_TOKEN qo'shing (Project Settings → Script Properties).");
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone("Asia/Tashkent");

  /* Urinishlar */
  var sh = ss.getSheetByName(SHEETS.att) || ss.insertSheet(SHEETS.att);
  if (sh.getMaxColumns() < NCOL) sh.insertColumnsAfter(sh.getMaxColumns(), NCOL - sh.getMaxColumns());
  sh.getRange(1, 1, 1, NCOL).setValues([COLS.map(function (c) { return c[1]; })]).setFontWeight("bold");
  sh.setFrozenRows(1);
  ["id", "tgId", "districtId", "deadline", "claim"].forEach(function (k) { sh.getRange(1, C[k], sh.getMaxRows(), 1).setNumberFormat("@"); });
  ["startedAt", "submittedAt", "evaluatedAt", "notifiedAt"].forEach(function (k) { sh.getRange(2, C[k], sh.getMaxRows() - 1, 1).setNumberFormat("dd.mm.yyyy hh:mm"); });
  sh.setColumnWidth(C.answer, 360);
  sh.setColumnWidth(C.summary, 280);
  sh.hideColumns(TECH_FROM, C.note - TECH_FROM + 1);   // texnik ustunlar yashiriladi, mezon ballari koʻrinib turadi
  sh.showColumns(C.c1, NCOL - C.c1 + 1);

  /* Kalitlar (to'ldirish — Kalitlar.gs dagi setupKeys()) */
  var ks = ss.getSheetByName(SHEETS.keys) || ss.insertSheet(SHEETS.keys);
  if (ks.getLastRow() < 1) ks.getRange(1, 1, 1, 6).setValues([["caseId", "№", "Nomi", "Vaziyat (keys matni)", "Topshiriq", "Ideal javob"]]).setFontWeight("bold");

  /* Hisobot */
  var rp = ss.getSheetByName(SHEETS.rep) || ss.insertSheet(SHEETS.rep);
  rp.clear();
  var sep = formulaSep_(rp);
  var L = function (k) { return colLetter_(C[k]); };
  var A = "'" + SHEETS.att + "'!";
  var head = [["Hudud", "Urinishlar", "Baholangan", "O'rtacha ball", "Navbatda"]];
  var regionRows = Object.keys(REGIONS).map(function (id, i) {
    var r = i + 2, nm = "$A" + r;
    return [REGIONS[id][0],
      "=COUNTIF(" + A + L("regionName") + ":" + L("regionName") + "," + nm + ")",
      "=COUNTIFS(" + A + L("regionName") + ":" + L("regionName") + "," + nm + "," + A + L("status") + ":" + L("status") + ",\"" + ST.done + "\")",
      "=IFERROR(ROUND(AVERAGEIFS(" + A + L("total") + ":" + L("total") + "," + A + L("regionName") + ":" + L("regionName") + "," + nm + "," + A + L("status") + ":" + L("status") + ",\"" + ST.done + "\"),1),\"\")",
      "=COUNTIFS(" + A + L("regionName") + ":" + L("regionName") + "," + nm + "," + A + L("status") + ":" + L("status") + ",\"" + ST.pending + "\")"];
  });
  rp.getRange(1, 1, 1, 5).setValues(head).setFontWeight("bold");
  putFormulaRows_(rp, 2, regionRows, sep);
  var tr = regionRows.length + 2;
  putFormulaRows_(rp, tr, [["Jami", "=SUM(B2:B" + (tr - 1) + ")", "=SUM(C2:C" + (tr - 1) + ")",
    "=IFERROR(ROUND(AVERAGEIF(" + A + L("status") + ":" + L("status") + ",\"" + ST.done + "\"," + A + L("total") + ":" + L("total") + "),1),\"\")",
    "=SUM(E2:E" + (tr - 1) + ")"]], sep).setFontWeight("bold");
  var r0 = tr + 2;
  rp.getRange(r0, 1, 1, 4).setValues([["Lavozim", "Urinishlar", "Baholangan", "O'rtacha ball"]]).setFontWeight("bold");
  var roleRows = Object.keys(ROLES).map(function (id, i) {
    var r = r0 + 1 + i, nm = "$A" + r;
    return [ROLES[id],
      "=COUNTIF(" + A + L("roleName") + ":" + L("roleName") + "," + nm + ")",
      "=COUNTIFS(" + A + L("roleName") + ":" + L("roleName") + "," + nm + "," + A + L("status") + ":" + L("status") + ",\"" + ST.done + "\")",
      "=IFERROR(ROUND(AVERAGEIFS(" + A + L("total") + ":" + L("total") + "," + A + L("roleName") + ":" + L("roleName") + "," + nm + "," + A + L("status") + ":" + L("status") + ",\"" + ST.done + "\"),1),\"\")"];
  });
  putFormulaRows_(rp, r0 + 1, roleRows, sep);
  rp.setColumnWidth(1, 300);

  /* Mini App manzili (o'zgartirish: Script Properties) */
  if (!prop_("MINIAPP_URL")) PropertiesService.getScriptProperties().setProperty("MINIAPP_URL", "https://uzbmuydinov.github.io/ihma-test/");

  /* Har daqiqalik xabar yuboruvchi */
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "notifyTick") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("notifyTick").timeBased().everyMinutes(1).create();

  var me = tg_("getMe", {});
  Logger.log(me.ok ? "Bot ulandi: @" + me.body.result.username : "Bot tokeni ishlamadi: " + me.code + " " + JSON.stringify(me.body));
  Logger.log("Tayyor. Endi Deploy → New deployment → Web app.");
}

function colLetter_(n) {
  var s = "";
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* Tekshiruv: Apps Script muharririda ishga tushiring, Logger'da natija chiqadi */
function selfTest() {
  var sh = sheet_(SHEETS.att), ks = sheet_(SHEETS.keys);
  Logger.log("Urinishlar: " + Math.max(0, sh.getLastRow() - 1) + " ta qator");
  Logger.log("Kalitlar: " + Math.max(0, ks.getLastRow() - 1) + " ta keys (3 ta bo'lishi kerak)");
  Logger.log("MINIAPP_URL: " + prop_("MINIAPP_URL"));
  var me = tg_("getMe", {});
  Logger.log(me.ok ? "Bot: @" + me.body.result.username : "Bot tokeni xato: " + me.code);
  Logger.log("Triggerlar: " + ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }).join(", "));
}
