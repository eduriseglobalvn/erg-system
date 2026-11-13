// Writes H17/H17m (Khung viền của tôi) and H18/H18m (Bảng bậc & cấp — how XP maps to tier + division).
const fs = require("fs");
const path = require("path");
const { css: sbCss, sidebar } = require("./sidebar");
const T = require("./tiers");
const out = process.argv[2];

const head = (title, extraCss) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="./erg.css">
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400..600,0..1,0&amp;display=block">
<style>
body{margin:0}${extraCss}
</style>
</helmet>`;
const tail = (w, h) => `</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
const dock = () => `  <nav class="dock" aria-label="Điều hướng học sinh">
    <button type="button" class="dk" aria-label="Trang chủ"><span class="ms" aria-hidden="true">home</span></button>
    <button type="button" class="dk" aria-label="Bài tập"><span class="ms" aria-hidden="true">assignment</span></button>
    <button type="button" class="dk on" aria-current="page"><span class="ms f" aria-hidden="true">emoji_events</span>Thi đua</button>
    <button type="button" class="dk" aria-label="Hộp thư, 2 chưa đọc"><span class="ms" aria-hidden="true">inbox</span><span class="dot"></span></button>
    <button type="button" class="dk" aria-label="Hồ sơ, bậc Đồng 2">${T.frame("dong", "MA", 26, { avStyle: "background:var(--p);color:#fff" })}</button>
  </nav>`;
const fmt = (n) => n.toLocaleString("de-DE");
const me = (key, size, gem) => T.frame(key, "MA", size, { avStyle: "background:var(--p);color:#fff", gem });

// ---------- rank math (sample week, grade of 128) ----------
// sample curve: exponential through #92 = 1.240 XP, then linear to 0 for the last Sắt/Gỗ places
const xpAt = (r) => r >= 128 ? 0 : r <= 106 ? Math.round((9612 * Math.exp(-r / 44.9)) / 5) * 5 : Math.round((905 - (r - 106) * (905 / 22)) / 5) * 5;
let top = 1;
const table = T.TIERS.slice().reverse().map((t) => {
  const from = top, to = top + t.count - 1;
  top = to + 1;
  if (t.key === "ct") return { t, from, to, divs: [{ d: "", from, to, xp: xpAt(to) }] };
  const n = t.count, base = Math.floor(n / 5), extra = n % 5;
  let r = from;
  const divs = [1, 2, 3, 4, 5].map((d, i) => {
    const size = base + (i < extra ? 1 : 0);
    const o = { d: String(d), from: r, to: r + size - 1, xp: xpAt(r + size - 1) };
    r += size;
    return o;
  });
  return { t, from, to, divs };
});
const ME = { key: "dong", d: "2" };

// ---------- shared CSS ----------
const css = `
.step{display:flex;gap:12px;align-items:flex-start;flex:1;min-width:0}
.step .n{width:28px;height:28px;border-radius:50%;background:var(--p);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13px;flex-shrink:0}
.arrow{color:var(--tx3);align-self:center}
.src{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--dv);font-size:14px}
.src:first-child{border-top:0}
.cell{padding:8px 10px;border-radius:10px;background:var(--bg2);border:1px solid var(--dv);display:flex;flex-direction:column;gap:2px}
.cell.me{background:var(--pss);border-color:var(--p);box-shadow:0 0 0 2px #CFE3FB}
.cell .lv{font-size:12px;font-weight:700;color:var(--tx2)}
.cell .xp{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.cell .rk{font-size:11px;color:var(--tx3);font-variant-numeric:tabular-nums}
.youtag{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:999px;background:var(--p);color:#fff;font-size:10px;font-weight:700}
.fcard{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px 12px;border-radius:14px;border:1px solid var(--bd);background:#fff;text-align:center}
.fcard.on{border-color:var(--p);box-shadow:0 0 0 3px #CFE3FB}
.fcard.on::after{content:"check_circle";font-family:"Material Symbols Rounded";font-variation-settings:"FILL" 1;position:absolute;right:8px;top:8px;color:var(--p);font-size:20px}
.fcard.lock .fr{filter:grayscale(.9);opacity:.45}
.fcard.lock{background:var(--bg2)}
.fcard .why{font-size:11px;color:var(--tx3);line-height:1.35}
.nofr{width:56px;height:56px;border-radius:50%;border:2px dashed var(--bd2);display:grid;place-items:center;color:var(--tx3)}
.pv{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid var(--dv);background:#fff}`;

// ---------- H18 web: table ----------
const cellHtml = (row, dv) => {
  const isMe = row.t.key === ME.key && dv.d === ME.d;
  return `<div class="cell${isMe ? " me" : ""}"><span class="lv">${row.t.key === "ct" ? "Không chia cấp" : "Cấp " + dv.d}${isMe ? ' <span class="youtag">Bạn</span>' : ""}</span><span class="xp">≥ ${fmt(dv.xp)} XP</span><span class="rk">hạng #${dv.from}–${dv.to}</span></div>`;
};
const webRows = table.map((row) => `        <div class="trow${row.t.key === ME.key ? " mine" : ""}">
          <div class="row g12" style="min-width:0">${T.emblem(row.t.key, 34)}<div style="min-width:0"><div class="b7">${row.t.name}</div><div class="t-m">${row.t.band} · ${row.t.count} bạn</div></div></div>
          ${row.t.key === "ct" ? `<div style="grid-column:span 5">${cellHtml(row, row.divs[0]).replace("Không chia cấp", "Không chia cấp · các bạn Cao thủ xếp theo XP")}</div>` : row.divs.slice().reverse().map((dv) => cellHtml(row, dv)).join("")}
        </div>`).join("\n");

const h18 = head("Học sinh · Bảng bậc & cấp web", sbCss + css + `
.trow{display:grid;grid-template-columns:220px repeat(5,minmax(0,1fr));gap:8px;align-items:center;padding:10px 20px;border-top:1px solid var(--dv)}
.trow.mine{background:#FBF6F1}
.thd{display:grid;grid-template-columns:220px repeat(5,minmax(0,1fr));gap:8px;padding:10px 20px;font-size:12px;font-weight:600;color:var(--tx3)}`) + `
<div class="desk" style="min-height:1320px;align-items:stretch">
${sidebar("Thi đua")}
  <main class="main" style="gap:18px">
    <div class="col g8">
      <button type="button" class="link" style="align-self:flex-start"><span class="ms xs" aria-hidden="true">arrow_back</span>Bậc của bạn</button>
      <div class="ph">
        <div class="col g4"><h1 class="t-h1" style="font-size:28px">Bảng bậc &amp; cấp</h1><p class="t-s" style="font-size:15px">Khối 7 · 128 bạn · mốc XP của tuần 46, tính lại 0 giờ thứ Hai</p></div>
        <div class="chips"><button type="button" class="chip on">Khối 7</button><button type="button" class="chip">Tuần trước</button></div>
      </div>
    </div>

    <div class="row top g16">
      <section class="card p20 col g16" style="flex:2 1 0" aria-labelledby="how">
        <h2 class="t-h3" id="how">Bậc và cấp được tính thế nào?</h2>
        <div class="row g12">
          <div class="step"><span class="n">1</span><div><div class="b6">Cộng XP cả khóa</div><div class="t-s">Mỗi bài nộp lần đầu đều cộng XP. XP chỉ tăng, không bị trừ.</div></div></div>
          <span class="ms arrow" aria-hidden="true">arrow_forward</span>
          <div class="step"><span class="n">2</span><div><div class="b6">Xếp hạng trong khối</div><div class="t-s">Xếp 128 bạn theo tổng XP. Bạn đang <b>#92</b> với 1.240 XP.</div></div></div>
          <span class="ms arrow" aria-hidden="true">arrow_forward</span>
          <div class="step"><span class="n">3</span><div><div class="b6">Tra bảng ra bậc, cấp</div><div class="t-s">Hạng #90–94 là <b>Đồng 2</b>. Cấp 5 thấp nhất, cấp 1 cao nhất.</div></div></div>
        </div>
      </section>
      <section class="card p20 col" style="flex:1 1 0;gap:6px" aria-labelledby="src">
        <h2 class="t-h3" id="src" style="margin-bottom:4px">XP đến từ đâu</h2>
        <div class="src"><span>Hoàn thành bài (lần nộp đầu)</span><b class="tn">+10 – 40</b></div>
        <div class="src"><span>Nộp trước hạn</span><b class="tn">+10</b></div>
        <div class="src"><span>Chuỗi từ 7 ngày liên tiếp</span><b class="tn">×1,2</b></div>
        <div class="src"><span class="c3">Làm lại, điểm số</span><span class="c3">không tính</span></div>
      </section>
    </div>

    <section class="card p0" aria-label="Bảng bậc và cấp">
      <div class="thd"><span>Bậc</span><span>Cấp 5 · mới vào</span><span>Cấp 4</span><span>Cấp 3</span><span>Cấp 2</span><span>Cấp 1 · sắp lên bậc</span></div>
${webRows}
    </section>
    <div class="row g8 t-m"><span class="ms xs" aria-hidden="true">info</span><span class="f1">"≥ XP" là mốc tối thiểu tuần này để vào cấp đó; mốc đổi theo cả khối mỗi tuần. Chỉ xét bạn đã nộp ít nhất 3 bài. Tụt cấp/bậc chỉ khi ở dưới mốc 2 tuần liên tiếp.</span></div>
  </main>
</div>
` + tail(1440, 1320);

// ---------- H18m mobile ----------
const mobTiers = table.map((row) => {
  const mine = row.t.key === ME.key;
  if (!mine) return `      <div class="li" style="min-height:58px">${T.emblem(row.t.key, 30)}<div class="f1"><div class="b6">${row.t.name}</div><div class="t-m">${row.t.band} · hạng #${row.from}–${row.to}</div></div><span class="t-s tn b6">≥ ${fmt(row.divs[row.divs.length - 1].xp)}</span><span class="ms s c3" aria-hidden="true">expand_more</span></div>`;
  return `      <div class="col" style="padding:12px 14px;gap:10px;background:#FBF6F1;border-top:1px solid var(--dv);border-bottom:1px solid var(--dv)">
        <div class="row g12">${T.emblem(row.t.key, 30)}<div class="f1"><div class="b6">${row.t.name} <span class="youtag">Bạn · cấp 2</span></div><div class="t-m">${row.t.band} · hạng #${row.from}–${row.to}</div></div><span class="ms s c3" aria-hidden="true">expand_less</span></div>
        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${row.divs.slice().reverse().map((dv) => `<div class="cell${dv.d === ME.d ? " me" : ""}" style="padding:6px;align-items:center;text-align:center"><span class="lv">${dv.d}</span><span class="xp" style="font-size:12px">${fmt(dv.xp)}</span></div>`).join("")}</div>
        <div class="t-m">Số to là cấp (5 thấp → 1 cao), số dưới là XP tối thiểu tuần này.</div>
      </div>`;
}).join("\n");

const h18m = head("Học sinh · Bảng bậc & cấp (mobile)", T.css + css + `
.pbody>*{flex-shrink:0}
.li+.li{border-top:1px solid var(--dv)}`) + `
<div class="phone" style="height:1240px">
  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại Bậc của bạn"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <div class="f1"><h1 class="t-h1" style="font-size:20px">Bảng bậc &amp; cấp</h1><div class="t-m">Khối 7 · mốc tuần 46</div></div>
  </div>
  <div class="pbody" style="gap:12px">
    <div class="card col g12" style="padding:14px 16px">
      <div class="step"><span class="n">1</span><div><div class="b6">Cộng XP cả khóa</div><div class="t-s">Bài nộp lần đầu +10–40, trước hạn +10, chuỗi 7 ngày ×1,2</div></div></div>
      <div class="step"><span class="n">2</span><div><div class="b6">Xếp hạng trong khối 7</div><div class="t-s">Bạn #92 / 128 với 1.240 XP</div></div></div>
      <div class="step"><span class="n">3</span><div><div class="b6">Tra bảng: hạng #90–94 = Đồng 2</div><div class="t-s">Mỗi bậc 5 cấp: 5 thấp nhất → 1 cao nhất</div></div></div>
    </div>
    <div class="card p0" style="overflow:hidden">
${mobTiers}
    </div>
    <p class="hint">Mốc XP đổi theo cả khối mỗi thứ Hai. Tụt cấp/bậc chỉ khi ở dưới mốc 2 tuần liên tiếp.</p>
  </div>
${dock()}
</div>
` + tail(390, 1240);

// ---------- H17 frames ----------
const frameItems = [
  { key: "go", st: "open", why: "Đã mở" },
  { key: "sat", st: "open", why: "Đã mở" },
  { key: "dong", st: "on", why: "Đang dùng" },
  { key: "bac", st: "lock", why: "Lên Bạc để mở · còn vượt 8 bạn" },
  { key: "vang", st: "lock", why: "Lên Vàng để mở" },
  { key: "bk", st: "open", why: "Đã đạt ở khóa hè 2026" },
  { key: "kc", st: "lock", why: "Lên Kim cương để mở" },
  { key: "ct", st: "lock", why: "Lên Cao thủ để mở" },
];
const tName = (k) => T.TIERS.find((t) => t.key === k).name;
const fcards = (size) => `<div class="fcard"><span class="nofr"><span class="ms" aria-hidden="true">block</span></span><span class="b6" style="font-size:13px">Không dùng</span><span class="why">Ảnh không có khung</span></div>` +
  frameItems.map((f) => `<div class="fcard${f.st === "on" ? " on" : ""}${f.st === "lock" ? " lock" : ""}">${me(f.key, size)}<span class="b6" style="font-size:13px">${tName(f.key)}${f.st === "lock" ? ' <span class="ms xs c3" aria-hidden="true">lock</span>' : ""}</span><span class="why">${f.why}</span></div>`).join("");

const previews = `
        <div class="pv"><span class="b7 tn" style="width:22px">7</span>${me("dong", 30)}<div class="f1"><div class="b6">Minh Anh <span class="youtag">Bạn</span></div><div class="t-m">Bảng xếp hạng</div></div><b class="tn">1.240</b></div>
        <div class="pv">${me("dong", 30)}<div class="f1"><div class="b6">Minh Anh</div><div class="t-m">Bài viết trong Thảo luận</div></div></div>`;

const h17 = head("Học sinh · Khung viền của tôi web", sbCss + css) + `
<div class="desk" style="min-height:1000px;align-items:stretch">
${sidebar("")}
  <main class="main" style="gap:18px">
    <div class="ph">
      <div class="col g4"><h1 class="t-h1" style="font-size:28px">Khung viền ảnh đại diện</h1><p class="t-s" style="font-size:15px">Mở từ menu tài khoản › Khung viền, hoặc từ trang Bậc của bạn. Đổi bất cứ lúc nào.</p></div>
      <div class="row g8"><button type="button" class="btn t">Hủy</button><button type="button" class="btn c">Lưu khung</button></div>
    </div>
    <div class="row top g20">
      <section class="card p24 col g16" style="flex:0 0 360px;align-items:center;text-align:center" aria-labelledby="pv">
        <h2 class="t-ov" id="pv" style="margin:0;align-self:flex-start">Xem trước</h2>
        ${me("dong", 112)}
        <div><div class="t-h2">Nguyễn Minh Anh</div><div class="row g4" style="justify-content:center;margin-top:4px">${T.chip("dong", "Đồng 2")}<span class="t-m">Lớp 7A</span></div></div>
        <div class="col g8" style="width:100%;text-align:left">${previews}</div>
      </section>
      <section class="card p24 col g16 f1" aria-labelledby="all">
        <div class="sec"><h2 class="t-h3" id="all">Khung của bạn</h2><span class="t-m">4 / 8 đã mở · khung đã mở giữ mãi, kể cả khi tụt bậc hay sang khóa mới</span></div>
        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px">${fcards(52)}</div>
        <div class="row g8 t-m"><span class="ms xs" aria-hidden="true">info</span><span class="f1">Khung chỉ là trang trí, không đổi bậc hay XP. Bậc thật luôn hiện ở nhãn cạnh tên.</span></div>
      </section>
    </div>
  </main>
</div>
` + tail(1440, 1000);

const h17m = head("Học sinh · Khung viền của tôi (mobile)", T.css + css + `
.pbody>*{flex-shrink:0}
.save{position:absolute;left:16px;right:16px;bottom:92px;z-index:4}`) + `
<div class="phone" style="height:1060px">
  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại Hồ sơ"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <div class="f1"><h1 class="t-h1" style="font-size:20px">Khung viền</h1><div class="t-m">Hồ sơ › Khung viền · 4 / 8 đã mở</div></div>
  </div>
  <div class="pbody" style="gap:12px;padding-bottom:170px">
    <div class="card col g12" style="padding:16px;align-items:center;text-align:center">
      ${me("dong", 84)}
      <div><div class="b6" style="font-size:16px">Nguyễn Minh Anh</div><div class="row g4" style="justify-content:center;margin-top:4px">${T.chip("dong", "Đồng 2")}</div></div>
      <div class="col g8" style="width:100%;text-align:left">${previews}</div>
    </div>
    <div class="t-ov" style="padding:2px">Chọn khung</div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${fcards(44)}</div>
    <p class="hint">Khung đã mở giữ mãi, kể cả khi tụt bậc hay sang khóa mới.</p>
  </div>
  <button type="button" class="btn c lg save">Lưu khung Đồng</button>
${dock()}
</div>
` + tail(390, 1060);

fs.writeFileSync(path.join(out, "H18-BangBac-Web.dc.html"), h18);
fs.writeFileSync(path.join(out, "H18m-BangBac.dc.html"), h18m);
fs.writeFileSync(path.join(out, "H17-Khung-Web.dc.html"), h17);
fs.writeFileSync(path.join(out, "H17m-Khung.dc.html"), h17m);
console.log(table.map((r) => r.t.name + " " + r.divs.map((d) => d.d + ":#" + d.from + "-" + d.to + "≥" + d.xp).join(" ")).join("\n"));
