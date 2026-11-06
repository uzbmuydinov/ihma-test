/**
 * IHMA — natija hisoboti (PDF).
 * Bot xodimga yuboradigan PDF shu yerda chiziladi: umumiy ball shkalasi, mezonlar radari,
 * mezonlar shkalalari, kuchli tomonlar va eʼtibor qaratish kerak boʻlgan nuqtalar, mustaqillik, ekspert izohi.
 *
 * Tashqi xizmat yoki Google Docs ishlatilmaydi: PDF faylni shu kod oʻzi yozadi
 * (vektor shakllar + Montserrat shrifti, ReportData.gs). Shuning uchun tez va kvotasiz.
 * Koordinatalar yuqori-chap burchakdan, punktda (A4 = 595 x 842).
 */

var PDF_W = 595.28, PDF_H = 841.89;
var RC = {
  navy: "#173F8F", primary: "#2964C2", accent: "#2CCFBE", bg: "#E8F1FF", soft: "#EEF4FF", line: "#D3E1F7", line2: "#BCD2F5",
  text: "#1F2D4D", muted: "#5D6B85", white: "#FFFFFF", onDarkMuted: "#C9D8F5",
  ok: "#1F9D3A", okSoft: "#E7F6EA", okText: "#17762C", okLine: "#BFE6C8",
  warn: "#D39B17", warnSoft: "#FBF3DF", warnText: "#6B4E00", warnLine: "#EBD39A",
  bad: "#C0151A", badSoft: "#FCE9E9", badLine: "#F2C2C3"
};

/* Hisobot matnlari (3 tilda) */
var RT = {
  lat: {
    org: "Ijtimoiy himoya tizimi xodimlarining malakasini oshirish markazi", title: "KEYS BAHOLASH NATIJASI",
    kCase: "KEYS", kSubmitted: "TOPSHIRILGAN", kDuration: "DAVOMIYLIGI", kTiming: "TOPSHIRISH", minutes: "daqiqa",
    total: "UMUMIY BALL", profile: "MEZONLAR PROFILI", byCrit: "Mezonlar boʻyicha natija", strong: "KUCHLI TOMONLAR", weak: "EʼTIBOR QARATISH KERAK BOʻLGAN NUQTALAR",
    indep: "MUSTAQILLIK (TAXMIN)", expert: "EKSPERT IZOHI", expertTitle: "Ekspert izohi", summary: "UMUMIY XULOSA", awarded: "Ball berilgan asoslar", deducted: "Ball chegirilgan sabablar",
    none: "Qayd etilmagan", high: "Yuqori daraja", mid: "Oʻrta daraja", low: "Past daraja", cont: "davomi",
    caveat: "Mustaqillik — AI taxmini, yakuniy xulosa emas.",
    footer: "IHMA · Malaka baholash tizimi. Baho AI hakam (Claude) tomonidan ideal javob asosida qoʻyilgan.",
    timing: { "Vaqtida": "Vaqtida", "Avto": "Vaqt tugaganda avtomatik", "Kech": "Kechikib" }, file: "IHMA_natija"
  },
  cyr: {
    org: "Ижтимоий ҳимоя тизими ходимларининг малакасини ошириш маркази", title: "КЕЙС БАҲОЛАШ НАТИЖАСИ",
    kCase: "КЕЙС", kSubmitted: "ТОПШИРИЛГАН", kDuration: "ДАВОМИЙЛИГИ", kTiming: "ТОПШИРИШ", minutes: "дақиқа",
    total: "УМУМИЙ БАЛЛ", profile: "МЕЗОНЛАР ПРОФИЛИ", byCrit: "Мезонлар бўйича натижа", strong: "КУЧЛИ ТОМОНЛАР", weak: "ЭЪТИБОР ҚАРАТИШ КЕРАК БЎЛГАН НУҚТАЛАР",
    indep: "МУСТАҚИЛЛИК (ТАХМИН)", expert: "ЭКСПЕРТ ИЗОҲИ", expertTitle: "Эксперт изоҳи", summary: "УМУМИЙ ХУЛОСА", awarded: "Балл берилган асослар", deducted: "Балл чегирилган сабаблар",
    none: "Қайд этилмаган", high: "Юқори даража", mid: "Ўрта даража", low: "Паст даража", cont: "давоми",
    caveat: "Мустақиллик — AI тахмини, якуний хулоса эмас.",
    footer: "IHMA · Малака баҳолаш тизими. Баҳо AI ҳакам (Claude) томонидан идеал жавоб асосида қўйилган.",
    timing: { "Vaqtida": "Вақтида", "Avto": "Вақт тугаганда автоматик", "Kech": "Кечикиб" }, file: "IHMA_natija"
  },
  ru: {
    org: "Центр повышения квалификации работников системы социальной защиты", title: "РЕЗУЛЬТАТ ОЦЕНКИ КЕЙСА",
    kCase: "КЕЙС", kSubmitted: "СДАНО", kDuration: "ДЛИТЕЛЬНОСТЬ", kTiming: "СДАЧА", minutes: "мин",
    total: "ОБЩИЙ БАЛЛ", profile: "ПРОФИЛЬ ПО КРИТЕРИЯМ", byCrit: "Результат по критериям", strong: "СИЛЬНЫЕ СТОРОНЫ", weak: "НА ЧТО ОБРАТИТЬ ВНИМАНИЕ",
    indep: "САМОСТОЯТЕЛЬНОСТЬ (ОЦЕНКА)", expert: "КОММЕНТАРИЙ ЭКСПЕРТА", expertTitle: "Комментарий эксперта", summary: "ОБЩИЙ ВЫВОД", awarded: "За что начислены баллы", deducted: "За что сняты баллы",
    none: "Не отмечено", high: "Высокий уровень", mid: "Средний уровень", low: "Низкий уровень", cont: "продолжение",
    caveat: "Самостоятельность — оценка ИИ, не окончательный вывод.",
    footer: "IHMA · Система оценки квалификации. Оценка выставлена ИИ-экспертом (Claude) на основе эталонного ответа.",
    timing: { "Vaqtida": "Вовремя", "Avto": "Автоматически по истечении времени", "Kech": "С опозданием" }, file: "IHMA_natija"
  }
};

/* ================= Kichik PDF yozuvchi ================= */
function pdfDoc_() { return { pages: [], cur: null, used: {}, alphas: {} }; }
function pdfPage_(d) { d.cur = { ops: [] }; d.pages.push(d.cur); return d.cur; }
function pn_(v) { var r = Math.round(v * 100) / 100; return String(r === 0 ? 0 : r); }
function pY_(y) { return PDF_H - y; }
function prgb_(hex) {
  var n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (c) { return String(Math.round(c / 255 * 1000) / 1000); }).join(" ");
}
function pdfPaint_(d, fill, stroke, lw, alpha) {
  var o = d.cur.ops;
  if (alpha != null && alpha < 1) { var k = "GA" + Math.round(alpha * 100); d.alphas[k] = alpha; o.push("/" + k + " gs"); }
  if (fill) o.push(prgb_(fill) + " rg");
  if (stroke) o.push(prgb_(stroke) + " RG " + pn_(lw || 1) + " w");
  return fill && stroke ? "B" : fill ? "f" : "S";
}
function pdfRect_(d, x, y, w, h, fill, stroke, lw, alpha) {
  if (w <= 0 || h <= 0) return;
  d.cur.ops.push("q"); var m = pdfPaint_(d, fill, stroke, lw, alpha);
  d.cur.ops.push(pn_(x) + " " + pn_(pY_(y + h)) + " " + pn_(w) + " " + pn_(h) + " re " + m, "Q");
}
function pdfRRect_(d, x, y, w, h, r, fill, stroke, lw, alpha) {
  if (w <= 0 || h <= 0) return;
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  var k = 0.5523 * r, P = function (a, b) { return pn_(a) + " " + pn_(pY_(b)); };
  d.cur.ops.push("q"); var m = pdfPaint_(d, fill, stroke, lw, alpha);
  d.cur.ops.push(P(x + r, y) + " m " + P(x + w - r, y) + " l " + P(x + w - r + k, y) + " " + P(x + w, y + r - k) + " " + P(x + w, y + r) + " c " +
    P(x + w, y + h - r) + " l " + P(x + w, y + h - r + k) + " " + P(x + w - r + k, y + h) + " " + P(x + w - r, y + h) + " c " +
    P(x + r, y + h) + " l " + P(x + r - k, y + h) + " " + P(x, y + h - r + k) + " " + P(x, y + h - r) + " c " +
    P(x, y + r) + " l " + P(x, y + r - k) + " " + P(x + r - k, y) + " " + P(x + r, y) + " c h " + m, "Q");
}
function pdfPoly_(d, pts, close, fill, stroke, lw, alpha) {
  var s = pts.map(function (p, i) { return pn_(p[0]) + " " + pn_(pY_(p[1])) + (i ? " l" : " m"); }).join(" ");
  d.cur.ops.push("q", "1 j 1 J"); var m = pdfPaint_(d, fill, stroke, lw, alpha);
  d.cur.ops.push(s + (close ? " h " : " ") + m, "Q");
}
function pdfCircle_(d, cx, cy, r, fill, stroke, lw, alpha) {
  var k = 0.5523 * r, P = function (a, b) { return pn_(a) + " " + pn_(pY_(b)); };
  d.cur.ops.push("q"); var m = pdfPaint_(d, fill, stroke, lw, alpha);
  d.cur.ops.push(P(cx + r, cy) + " m " + P(cx + r, cy + k) + " " + P(cx + k, cy + r) + " " + P(cx, cy + r) + " c " +
    P(cx - k, cy + r) + " " + P(cx - r, cy + k) + " " + P(cx - r, cy) + " c " + P(cx - r, cy - k) + " " + P(cx - k, cy - r) + " " + P(cx, cy - r) + " c " +
    P(cx + k, cy - r) + " " + P(cx + r, cy - k) + " " + P(cx + r, cy) + " c h " + m, "Q");
}
/* Shrift: belgi -> glif raqami. Shriftda yoʻq belgi oʻxshashiga almashtiriladi, emoji tashlab yuboriladi. */
var PDF_FALLBACK = { 0x2BB: 0x2018, 0x2BC: 0x2019, 0x60: 0x2018, 0x9: 0x20, 0xA0: 0x20, 0x2212: 0x2D, 0x25CF: 0x2022 };
function pdfFont_(key) {
  var f = REPORT_FONTS[key];
  if (!f.map) { f.map = {}; for (var i = 0; i < f.cmap.length; i += 2) f.map[f.cmap[i]] = f.cmap[i + 1]; }
  return f;
}
function pdfGlyphs_(d, key, s) {
  var f = pdfFont_(key), out = [], used = d ? (d.used[key] = d.used[key] || {}) : null;
  for (var ch of String(s == null ? "" : s)) {
    var cp = ch.codePointAt(0), g = f.map[cp];
    if (g == null && PDF_FALLBACK[cp] != null) { cp = PDF_FALLBACK[cp]; g = f.map[cp]; }
    if (g == null) { if (cp < 32 || cp > 0xFFFF || (cp >= 0x2190 && cp <= 0x2BFF)) continue; cp = 0x3F; g = f.map[cp]; }
    out.push(g);
    if (used) used[g] = cp;
  }
  return out;
}
function pdfWidth_(key, s, size) {
  var f = pdfFont_(key), w = 0;
  pdfGlyphs_(null, key, s).forEach(function (g) { w += f.w[g] || 0; });
  return w * size / 1000;
}
function pdfText_(d, key, size, color, x, y, s, align) {
  var g = pdfGlyphs_(d, key, s);
  if (!g.length) return 0;
  var f = pdfFont_(key), w = 0;
  g.forEach(function (n) { w += f.w[n] || 0; });
  w = w * size / 1000;
  if (align === "right") x -= w; else if (align === "center") x -= w / 2;
  var hex = g.map(function (n) { return ("000" + n.toString(16)).slice(-4); }).join("");
  d.cur.ops.push("BT /F" + key + " " + pn_(size) + " Tf " + prgb_(color) + " rg " + pn_(x) + " " + pn_(pY_(y)) + " Td <" + hex + "> Tj ET");
  return w;
}
function pdfWrap_(key, s, size, maxW) {
  var lines = [];
  String(s == null ? "" : s).replace(/\r/g, "").split("\n").forEach(function (para) {
    var words = para.split(/\s+/).filter(Boolean), line = "";
    if (!words.length) { lines.push(""); return; }
    words.forEach(function (wd) {
      var test = line ? line + " " + wd : wd;
      if (pdfWidth_(key, test, size) <= maxW) { line = test; return; }
      if (line) lines.push(line);
      line = wd;
      while (pdfWidth_(key, line, size) > maxW && line.length > 1) {   // juda uzun soʻzni boʻlish
        var cut = line.length - 1;
        while (cut > 1 && pdfWidth_(key, line.slice(0, cut), size) > maxW) cut--;
        lines.push(line.slice(0, cut)); line = line.slice(cut);
      }
    });
    if (line) lines.push(line);
  });
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}
function pdfFit_(key, s, size, maxW) {   // bir qatorga sigʻmasa "…" bilan qisqartirish
  s = String(s || "");
  if (pdfWidth_(key, s, size) <= maxW) return s;
  while (s.length > 1 && pdfWidth_(key, s + "…", size) > maxW) s = s.slice(0, -1);
  return s.replace(/\s+$/, "") + "…";
}
function pdfLines_(d, key, size, color, x, y, lines, lh) {
  lines.forEach(function (ln, i) { pdfText_(d, key, size, color, x, y + i * lh, ln); });
  return y + lines.length * lh;
}

/* PDF faylni baytlarga yigʻish */
function pdfBytes_(d, title) {
  var out = [], objs = [], offs = [];
  function str(s) { for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c > 127) throw new Error("PDF: ASCII emas"); out.push(c); } }
  function bytes(b) { for (var i = 0; i < b.length; i++) out.push(b[i] > 127 ? b[i] - 256 : b[i]); }
  function obj(body) { objs.push(body); return objs.length; }                 // body: string yoki {dict, data}
  function utf16hex(s) {
    var h = "FEFF";
    for (var i = 0; i < s.length; i++) h += ("000" + s.charCodeAt(i).toString(16).toUpperCase()).slice(-4);
    return "<" + h + ">";
  }
  var catalog = obj(null), pagesId = obj(null);
  var fontRef = {};
  Object.keys(d.used).forEach(function (key) {
    var f = pdfFont_(key), used = d.used[key];
    var file = obj({ dict: "/Length1 " + f.len + " /Filter /FlateDecode", data: Utilities.base64Decode(f.b64) });
    var desc = obj("<< /Type /FontDescriptor /FontName /" + f.name + " /Flags 32 /FontBBox [" + f.bbox.join(" ") + "] /ItalicAngle 0 /Ascent " + f.asc +
      " /Descent " + f.desc + " /CapHeight " + f.cap + " /StemV " + f.stemV + " /FontFile2 " + file + " 0 R >>");
    var cid = obj("<< /Type /Font /Subtype /CIDFontType2 /BaseFont /" + f.name + " /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>" +
      " /FontDescriptor " + desc + " 0 R /CIDToGIDMap /Identity /DW 600 /W [0 [" + f.w.join(" ") + "]] >>");
    var gids = Object.keys(used).map(Number).sort(function (a, b) { return a - b; });
    var cm = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n" +
      "/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
    for (var i = 0; i < gids.length; i += 100) {
      var part = gids.slice(i, i + 100);
      cm += part.length + " beginbfchar\n" + part.map(function (g) {
        return "<" + ("000" + g.toString(16)).slice(-4) + "> <" + ("000" + used[g].toString(16)).slice(-4) + ">";
      }).join("\n") + "\nendbfchar\n";
    }
    cm += "endcmap\nCMapName currentdict /CIDFont defineresource pop\nend\nend";
    var tu = obj({ dict: "", text: cm });
    fontRef[key] = obj("<< /Type /Font /Subtype /Type0 /BaseFont /" + f.name + " /Encoding /Identity-H /DescendantFonts [" + cid + " 0 R] /ToUnicode " + tu + " 0 R >>");
  });
  var gsRef = {};
  Object.keys(d.alphas).forEach(function (k) { gsRef[k] = obj("<< /Type /ExtGState /ca " + d.alphas[k] + " /CA " + d.alphas[k] + " >>"); });
  var res = "<< /Font << " + Object.keys(fontRef).map(function (k) { return "/F" + k + " " + fontRef[k] + " 0 R"; }).join(" ") + " >>" +
    (Object.keys(gsRef).length ? " /ExtGState << " + Object.keys(gsRef).map(function (k) { return "/" + k + " " + gsRef[k] + " 0 R"; }).join(" ") + " >>" : "") + " >>";
  var kids = d.pages.map(function (p) {
    var c = obj({ dict: "", text: p.ops.join("\n") });
    return obj("<< /Type /Page /Parent " + pagesId + " 0 R /MediaBox [0 0 " + PDF_W + " " + PDF_H + "] /Resources " + res + " /Contents " + c + " 0 R >>");
  });
  objs[catalog - 1] = "<< /Type /Catalog /Pages " + pagesId + " 0 R >>";
  objs[pagesId - 1] = "<< /Type /Pages /Kids [" + kids.map(function (k) { return k + " 0 R"; }).join(" ") + "] /Count " + kids.length + " >>";
  var info = obj("<< /Title " + utf16hex(title || "IHMA") + " /Producer (IHMA malaka baholash) /Creator (IHMA) >>");

  str("%PDF-1.7\n"); bytes([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]);
  objs.forEach(function (b, i) {
    offs[i] = out.length;
    str((i + 1) + " 0 obj\n");
    if (typeof b === "string") str(b);
    else {
      var data = b.data, isText = b.text != null;
      var len = isText ? b.text.length : data.length;
      str("<< /Length " + len + (b.dict ? " " + b.dict : "") + " >>\nstream\n");
      if (isText) str(b.text); else bytes(data);
      str("\nendstream");
    }
    str("\nendobj\n");
  });
  var xref = out.length;
  str("xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n");
  offs.forEach(function (o) { str(("000000000" + o).slice(-10) + " 00000 n \n"); });
  str("trailer\n<< /Size " + (objs.length + 1) + " /Root " + catalog + " 0 R /Info " + info + " 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  return out;
}

/* ================= Hisobot ================= */
function repLevel_(ratio, t) {
  if (ratio >= 0.75) return { c: RC.ok, soft: RC.okSoft, txt: RC.okText, line: RC.okLine, label: t.high };
  if (ratio >= 0.5) return { c: RC.warn, soft: RC.warnSoft, txt: RC.warnText, line: RC.warnLine, label: t.mid };
  return { c: RC.bad, soft: RC.badSoft, txt: RC.bad, line: RC.badLine, label: t.low };
}
function repNum_(v) { var r = Math.round(Number(v) * 10) / 10; return isFinite(r) ? String(r).replace(".", ",") : "—"; }
function repDate_(v, withTime) {
  var ms = v instanceof Date ? v.getTime() : (typeof v === "number" && v > 20000 && v < 100000 ? (v - 25569) * 86400000 - 5 * 3600000 : Date.parse(v));
  if (!isFinite(ms)) return String(v || "—");
  var t = new Date(ms + 5 * 3600000), p = function (n) { return ("0" + n).slice(-2); };
  return p(t.getUTCDate()) + "." + p(t.getUTCMonth() + 1) + "." + t.getUTCFullYear() + (withTime ? " " + p(t.getUTCHours()) + ":" + p(t.getUTCMinutes()) : "");
}
function repNames_(o, L) {
  var N = REPORT_NAMES, li = { lat: 0, cyr: 1, ru: 2 }[L];
  var reg = N.regions[o.regionId], role = N.roles[o.roleId], dis = N.districts[String(o.districtId)];
  return {
    region: reg ? reg[L] : String(o.regionName || ""),
    role: role ? role[L] : String(o.roleName || ""),
    district: dis ? dis[li] : String(o.districtName || ""),
    crit: N.crit[L], short: N.short[L]
  };
}
/* Mezonlar: ball nisbati bilan; kuchli — eng yuqori 2 ta, oʻsish — eng past 2 ta */
function repCrit_(res, names) {
  return (res.criteria || []).map(function (c, i) {
    var max = Number(c.max) || 4, sc = Math.max(0, Math.min(max, Number(c.score) || 0));
    return { i: i, n: i + 1, name: names.crit[i] || ("#" + (i + 1)), short: names.short[i] || ("#" + (i + 1)), score: sc, max: max, ratio: sc / max,
      awarded: (c.awarded || []).map(String), deducted: (c.deducted || []).map(String) };
  });
}
function repStrongWeak_(crit) {
  var s = crit.slice().sort(function (a, b) { return b.ratio - a.ratio || a.i - b.i; });
  var strong = s.filter(function (c) { return c.ratio > 0; }).slice(0, 2);
  var weak = s.slice().reverse().filter(function (c) { return strong.indexOf(c) < 0 && c.ratio < 1; }).slice(0, 2);
  return { strong: strong, weak: weak };
}

function reportPdf_(o, res) {
  var L = RT[o.lang] ? o.lang : "lat", t = RT[L], names = repNames_(o, L);
  var crit = repCrit_(res, names), total = Number(res.total), max = Number(res.max) || 20;
  if (!isFinite(total)) total = crit.reduce(function (s, c) { return s + c.score; }, 0);
  var ratio = Math.max(0, Math.min(1, total / max)), lv = repLevel_(ratio, t);
  var d = pdfDoc_(), M = 40, CW = PDF_W - 2 * M, BOTTOM = PDF_H - 64;
  var fio = String(o.fio || "").trim() || "—";
  var caseName = caseName_(o.caseId, L);
  var evalDate = repDate_(o.evaluatedAt instanceof Date || typeof o.evaluatedAt === "number" ? o.evaluatedAt : new Date(), false);

  /* --- 1-sahifa: sarlavha --- */
  pdfPage_(d);
  pdfRect_(d, 0, 0, PDF_W, 90, RC.navy);
  pdfRect_(d, 0, 90, PDF_W, 3, RC.accent);
  repBrand_(d, M, 25, 40);
  pdfText_(d, "b", 20, RC.white, M + 52, 46, "IHMA");
  pdfLines_(d, "r", 8.5, RC.onDarkMuted, M + 52, 61, pdfWrap_("r", t.org, 8.5, 280), 11);
  pdfText_(d, "s", 8, RC.accent, PDF_W - M, 42, t.title, "right");
  pdfText_(d, "b", 12, RC.white, PDF_W - M, 60, evalDate, "right");

  var y = 124;
  y = pdfLines_(d, "b", 21, RC.navy, M, y, pdfWrap_("b", fio, 21, CW), 25);
  var sub = [names.role, [names.region, names.district].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  y = pdfLines_(d, "r", 9.5, RC.muted, M, y - 4, pdfWrap_("r", sub, 9.5, CW), 13) + 10;

  /* maʼlumot qatori */
  var cols = [
    [t.kCase, caseName], [t.kSubmitted, repDate_(o.submittedAt, true)],
    [t.kDuration, o.minutes !== "" && o.minutes != null ? o.minutes + " " + t.minutes : "—"], [t.kTiming, t.timing[o.timing] || o.timing || "—"]
  ];
  var colW = CW / 4, vals = cols.map(function (c) { return pdfWrap_("s", c[1], 9.5, colW - 24); });
  var stripH = 30 + Math.max.apply(null, vals.map(function (v) { return v.length; })) * 12.5 + 8;
  pdfRRect_(d, M, y, CW, stripH, 10, RC.soft);
  cols.forEach(function (c, i) {
    var x = M + i * colW + 16;
    if (i) pdfRect_(d, M + i * colW, y + 12, 0.8, stripH - 24, RC.line);
    pdfText_(d, "s", 7, RC.muted, x, y + 20, c[0]);
    pdfLines_(d, "s", 9.5, RC.text, x, y + 35, vals[i], 12.5);
  });
  y += stripH + 16;

  /* chap karta: umumiy ball + mustaqillik */
  var top = y, H = 226, LW = 248, x = M;
  pdfRRect_(d, x, top, LW, H, 12, RC.white, RC.line, 0.8);
  pdfText_(d, "s", 7.5, RC.muted, x + 20, top + 28, t.total);
  var wT = pdfText_(d, "b", 46, RC.navy, x + 20, top + 82, repNum_(total));
  pdfText_(d, "s", 16, RC.muted, x + 20 + wT + 6, top + 82, "/ " + max);
  var pill = lv.label + " · " + Math.round(ratio * 100) + "%", pw = pdfWidth_("s", pill, 8.5) + 22;
  pdfRRect_(d, x + 20, top + 96, pw, 20, 10, lv.soft);
  pdfCircle_(d, x + 29, top + 106, 2.6, lv.c);
  pdfText_(d, "s", 8.5, lv.txt, x + 36, top + 109.5, pill);
  var sx = x + 20, sw = LW - 40, sy = top + 136;
  pdfRRect_(d, sx, sy, sw, 10, 5, RC.soft);
  if (ratio > 0.02) pdfRRect_(d, sx, sy, sw * ratio, 10, 5, lv.c);
  [0.5, 0.75].forEach(function (z) { pdfRect_(d, sx + sw * z - 0.6, sy, 1.2, 10, RC.white); });
  var mx = sx + sw * ratio;
  pdfPoly_(d, [[mx - 5, sy - 9], [mx + 5, sy - 9], [mx, sy - 2]], true, RC.navy);
  [[0, "0"], [0.5, String(max / 2)], [0.75, String(max * 0.75)], [1, String(max)]].forEach(function (k) {
    pdfText_(d, "r", 7, RC.muted, sx + sw * k[0], sy + 21, k[1], k[0] === 0 ? null : k[0] === 1 ? "right" : "center");
  });
  var ind = res.independence || {}, clean = ind.clean == null || ind.clean === "" ? null : Math.max(0, Math.min(100, Number(ind.clean)));
  var iy = top + 166;
  pdfRect_(d, x + 20, iy, sw, 0.8, RC.line);
  pdfText_(d, "s", 7.5, RC.muted, x + 20, iy + 20, t.indep);
  var wI = pdfText_(d, "b", 15, RC.navy, x + 20, iy + 40, clean == null ? "—" : Math.round(clean) + "%");
  if (ind.verdict) pdfText_(d, "r", 8, RC.muted, x + 20 + wI + 8, iy + 39, pdfFit_("r", ind.verdict, 8, sw - wI - 8));
  pdfRRect_(d, x + 20, iy + 48, sw, 6, 3, RC.soft);
  if (clean) pdfRRect_(d, x + 20, iy + 48, sw * clean / 100, 6, 3, RC.accent);

  /* oʻng karta: radar */
  var x2 = M + LW + 16, w2 = CW - LW - 16;
  pdfRRect_(d, x2, top, w2, H, 12, RC.white, RC.line, 0.8);
  pdfText_(d, "s", 7.5, RC.muted, x2 + 20, top + 28, t.profile);
  if (crit.length >= 3) repRadar_(d, crit, x2 + w2 / 2, top + 132, 58, t, x2 + 10, x2 + w2 - 10);

  /* mezonlar shkalalari */
  y = top + H + 24;
  pdfText_(d, "b", 12.5, RC.navy, M, y, t.byCrit);
  y += 14;
  crit.forEach(function (c) {
    var l = repLevel_(c.ratio, t);
    pdfCircle_(d, M + 9, y + 8, 9, RC.soft);
    pdfText_(d, "b", 8, RC.primary, M + 9, y + 11, String(c.n), "center");
    pdfText_(d, "s", 9.5, RC.text, M + 26, y + 11.5, pdfFit_("s", c.name, 9.5, CW - 26 - 64));
    pdfText_(d, "b", 9.5, l.txt, PDF_W - M, y + 11.5, repNum_(c.score) + " / " + c.max, "right");
    var bx = M + 26, bw = CW - 26, by = y + 18;
    pdfRRect_(d, bx, by, bw, 7, 3.5, RC.soft);
    if (c.ratio > 0) pdfRRect_(d, bx, by, Math.max(7, bw * c.ratio), 7, 3.5, l.c);
    for (var k = 1; k < c.max; k++) pdfRect_(d, bx + bw * k / c.max - 0.6, by, 1.2, 7, RC.white);
    y += 29;
  });
  y += 4;

  /* kuchli tomonlar va eʼtibor qaratish kerak boʻlgan nuqtalar */
  var sw2 = repStrongWeak_(crit), cw2 = (CW - 16) / 2;
  var mk = function (items, key) {
    var parts = [];
    items.forEach(function (c) {
      parts.push({ k: "h", lines: pdfWrap_("s", c.name + " — " + repNum_(c.score) + "/" + c.max, 9, cw2 - 32) });
      (key === "a" ? c.awarded : c.deducted).slice(0, 2).forEach(function (b) { parts.push({ k: "b", lines: pdfWrap_("r", b, 8.5, cw2 - 44) }); });
    });
    var h = 38 + parts.reduce(function (s, p) { return s + p.lines.length * (p.k === "h" ? 12 : 11.5) + (p.k === "h" ? 4 : 3); }, 0) + 8;
    return { parts: parts, h: items.length ? h : 0 };
  };
  var A = mk(sw2.strong, "a"), B = mk(sw2.weak, "d"), bh = Math.max(A.h, B.h), moved = false;
  if (bh) {
    if (y + bh > BOTTOM) { repContPage_(d, fio, t, M, true); y = 84; moved = true; }
    [[A, M, t.strong, RC.okSoft, RC.okLine, RC.okText, RC.ok, "+"], [B, M + cw2 + 16, t.weak, RC.warnSoft, RC.warnLine, RC.warnText, RC.warn, "−"]].forEach(function (q) {
      var blk = q[0], bx = q[1];
      if (!blk.h) return;
      pdfRRect_(d, bx, y, cw2, bh, 12, q[3], q[4], 0.8);
      pdfCircle_(d, bx + 19, y + 19, 3, q[6]);
      var hw = cw2 - 42, hs = Math.min(8, 8 * hw / Math.max(1, pdfWidth_("s", q[2], 8)));   // uzun sarlavha sigʻsin
      pdfText_(d, "s", hs, q[5], bx + 28, y + 22, q[2]);
      var yy = y + 40;
      blk.parts.forEach(function (p) {
        if (p.k === "h") { yy = pdfLines_(d, "s", 9, RC.text, bx + 16, yy, p.lines, 12) + 4; }
        else { pdfText_(d, "b", 9, q[6], bx + 18, yy, q[7]); yy = pdfLines_(d, "r", 8.5, RC.text, bx + 28, yy, p.lines, 11.5) + 3; }
      });
    });
    y += bh;
  }

  /* --- ekspert izohi (2-sahifa va davomi) --- */
  if (moved) y += 26; else { repContPage_(d, fio, t, M, true); y = 92; }
  pdfText_(d, "b", 12.5, RC.navy, M, y, t.expertTitle);
  y += 14;
  var summary = String(res.summary || "").trim();
  if (summary) {
    var sl = pdfWrap_("r", summary, 10, CW - 36), sh = 40 + sl.length * 14.5 + 6;
    pdfRRect_(d, M, y, CW, sh, 12, RC.soft);
    pdfText_(d, "s", 7.5, RC.primary, M + 18, y + 22, t.summary);
    pdfLines_(d, "r", 10, RC.text, M + 18, y + 40, sl, 14.5);
    y += sh + 14;
  }
  crit.forEach(function (c) {
    var l = repLevel_(c.ratio, t), inner = CW - 36;
    var nameL = pdfWrap_("b", c.name, 10.5, inner - 100);
    var blocks = [[t.awarded, c.awarded, RC.okText, RC.ok, "+"], [t.deducted, c.deducted, RC.bad, RC.bad, "−"]].map(function (b) {
      var items = b[1].length ? b[1].map(function (s) { return pdfWrap_("r", s, 9, inner - 16); }) : [pdfWrap_("r", t.none, 9, inner)];
      return { label: b[0], items: items, empty: !b[1].length, color: b[2], mark: b[3], sym: b[4], h: 13 + items.reduce(function (s, it) { return s + it.length * 12 + 3; }, 0) };
    });
    var ch = 26 + nameL.length * 14 + 14 + blocks[0].h + blocks[1].h - 2;
    if (y + ch > BOTTOM) { repContPage_(d, fio, t, M, true); y = 86; }
    pdfRRect_(d, M, y, CW, ch, 12, RC.white, RC.line, 0.8);
    pdfCircle_(d, M + 27, y + 24, 10, RC.soft);
    pdfText_(d, "b", 8.5, RC.primary, M + 27, y + 27.2, String(c.n), "center");
    pdfLines_(d, "b", 10.5, RC.navy, M + 46, y + 28, nameL, 14);
    var badge = repNum_(c.score) + " / " + c.max, bw2 = pdfWidth_("b", badge, 9) + 18;
    pdfRRect_(d, PDF_W - M - 18 - bw2, y + 14, bw2, 18, 6, l.soft);
    pdfText_(d, "b", 9, l.txt, PDF_W - M - 18 - bw2 / 2, y + 26.5, badge, "center");
    var yy = y + 26 + nameL.length * 14;
    pdfRRect_(d, M + 18, yy - 6, inner, 5, 2.5, RC.soft);
    if (c.ratio > 0) pdfRRect_(d, M + 18, yy - 6, Math.max(5, inner * c.ratio), 5, 2.5, l.c);
    yy += 14;
    blocks.forEach(function (b) {
      pdfText_(d, "s", 7.5, b.color, M + 18, yy, b.label.toUpperCase());
      yy += 13;
      b.items.forEach(function (it) {
        if (!b.empty) pdfText_(d, "b", 9, b.mark, M + 18, yy, b.sym);
        yy = pdfLines_(d, "r", 9, b.empty ? RC.muted : RC.text, M + (b.empty ? 18 : 30), yy, it, 12) + 3;
      });
    });
    y += ch + 12;
  });
  /* mustaqillik izohi */
  var notes = (ind.notes || []).map(String);
  if (ind.verdict || notes.length) {
    var nl = notes.map(function (s) { return pdfWrap_("r", s, 9, CW - 52); });
    var vl = ind.verdict ? pdfWrap_("b", ind.verdict + (clean != null ? " · " + Math.round(clean) + "%" : ""), 10, CW - 36) : [];
    var ih = 40 + vl.length * 14 + nl.reduce(function (s, it) { return s + it.length * 12 + 3; }, 0) + 20;
    if (y + ih > BOTTOM) { repContPage_(d, fio, t, M, true); y = 86; }
    pdfRRect_(d, M, y, CW, ih, 12, RC.soft);
    pdfText_(d, "s", 7.5, RC.primary, M + 18, y + 22, t.indep);
    var yv = pdfLines_(d, "b", 10, RC.navy, M + 18, y + 40, vl, 14);
    nl.forEach(function (it) { pdfText_(d, "b", 9, RC.muted, M + 22, yv, "·"); yv = pdfLines_(d, "r", 9, RC.text, M + 34, yv, it, 12) + 3; });
    pdfText_(d, "r", 7.5, RC.muted, M + 18, yv + 8, t.caveat);
  }

  /* pastki yozuv har sahifada */
  var total_p = d.pages.length;
  d.pages.forEach(function (p, i) {
    d.cur = p;
    pdfRect_(d, M, PDF_H - 46, CW, 0.7, RC.line);
    pdfLines_(d, "r", 6.8, RC.muted, M, PDF_H - 33, pdfWrap_("r", t.footer, 6.8, CW - 50), 9);
    pdfText_(d, "s", 7.5, RC.muted, PDF_W - M, PDF_H - 33, (i + 1) + " / " + total_p, "right");
  });
  var title = "IHMA — " + fio;
  return Utilities.newBlob(pdfBytes_(d, title), "application/pdf", repFileName_(fio, t) + ".pdf");
}

function repBrand_(d, x, y, s) {
  pdfRRect_(d, x, y, s, s, s * 0.25, RC.primary);
  var k = s / 24, P = function (a, b) { return [x + 6 * k + (a - 4) * k * 0.86, y + 2.2 * k + b * k * 0.82]; };
  pdfPoly_(d, [P(12, 3), P(20, 6), P(20, 12), P(18.8, 15.8), P(15.8, 19.2), P(12, 21), P(8.2, 19.2), P(5.2, 15.8), P(4, 12), P(4, 6)], true, null, RC.white, 1.8);
  pdfPoly_(d, [P(8.5, 12), P(11, 14.5), P(15.5, 9.5)], false, null, RC.white, 1.8);
}
function repContPage_(d, fio, t, M, expert) {
  pdfPage_(d);
  pdfRect_(d, 0, 0, PDF_W, 58, RC.navy);
  pdfRect_(d, 0, 58, PDF_W, 3, RC.accent);
  repBrand_(d, M, 15, 28);
  pdfText_(d, "b", 12, RC.white, M + 38, 30, "IHMA");
  pdfText_(d, "r", 8.5, RC.onDarkMuted, M + 38, 43, pdfFit_("r", fio, 8.5, 300));
  pdfText_(d, "s", 8, RC.accent, PDF_W - M, 36, expert ? t.expert : t.title, "right");
}
function repRadar_(d, crit, cx, cy, R, t, xMin, xMax) {
  var n = crit.length, maxC = Math.max.apply(null, crit.map(function (c) { return c.max; }));
  var pt = function (i, r) { var a = (-90 + i * 360 / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]; };
  var ring = function (r) { var a = []; for (var i = 0; i < n; i++) a.push(pt(i, r)); return a; };
  pdfPoly_(d, ring(R), true, RC.soft, RC.line2, 0.9);
  for (var k = 1; k < maxC; k++) pdfPoly_(d, ring(R * k / maxC), true, null, RC.line, 0.7);
  for (var i = 0; i < n; i++) { var p = pt(i, R); pdfPoly_(d, [[cx, cy], [p[0], p[1]]], false, null, RC.line, 0.7); }
  for (k = 1; k <= maxC; k++) pdfText_(d, "r", 6, RC.muted, cx + 3, cy - R * k / maxC + 2.5, String(k));
  var data = crit.map(function (c, i) { return pt(i, R * c.ratio); });
  pdfPoly_(d, data, true, RC.primary, null, 0, 0.22);
  pdfPoly_(d, data, true, null, RC.primary, 1.6);
  crit.forEach(function (c, i) {
    var p = data[i], l = repLevel_(c.ratio, t);
    pdfCircle_(d, p[0], p[1], 3.4, l.c, RC.white, 1.1);
    var q = pt(i, R + 13), align = q[2] > 0.3 ? null : q[2] < -0.3 ? "right" : "center";
    var room = align === "right" ? q[0] - xMin : align === null ? xMax - q[0] : 90;
    var lines = pdfWrap_("s", c.short, 7.5, Math.max(40, Math.min(80, room)));
    var y0 = q[3] < -0.5 ? q[1] - 4 - (lines.length) * 9 : q[3] > 0.5 ? q[1] + 8 : q[1] - (lines.length * 9) / 2 + 3;
    lines.forEach(function (ln, j) { pdfText_(d, "s", 7.5, RC.text, q[0], y0 + j * 9, ln, align); });
    pdfText_(d, "b", 7.5, l.txt, q[0], y0 + lines.length * 9, repNum_(c.score) + "/" + c.max, align);
  });
}
var REP_TR = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "", "ы": "i", "ь": "", "э": "e", "ю": "yu", "я": "ya", "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h" };
function repFileName_(fio, t) {
  var s = String(fio).toLowerCase().split("").map(function (ch) { return REP_TR[ch] != null ? REP_TR[ch] : ch; }).join("");
  s = s.replace(/[ʻʼ'`’‘]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  s = s.split("_").map(function (w) { return w ? w[0].toUpperCase() + w.slice(1) : w; }).join("_");
  return t.file + (s ? "_" + s : "");
}
