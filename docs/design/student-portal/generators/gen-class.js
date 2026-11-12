// Writes H14 (web) and H14m (mobile): full class leaderboard for the whole course, grouped by tier.
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

const fmt = (n) => n.toLocaleString("de-DE");
const tierOf = (xp) => T.TIERS.slice().reverse().find((t) => xp >= t.min);
const division = (t, xp) => {
  if (t.max == null) return "";
  const step = (t.max + 1 - t.min) / 5;
  return ["5", "4", "3", "2", "1"][Math.min(4, Math.floor((xp - t.min) / step))];
};

// [initials, name, course XP, streak, weekly move]
const students = [
  ["KT", "Khánh Thy", 9420, 15, 0], ["ĐH", "Đức Huy", 6880, 9, 1], ["GB", "Gia Bảo", 4310, 6, -1],
  ["TL", "Thảo Linh", 2900, 9, 0], ["QH", "Quang Hải", 2620, 4, 2], ["NV", "Ngọc Vy", 1720, 15, 0],
  ["MA", "Minh Anh", 1240, 12, 2], ["TK", "Tuấn Kiệt", 1010, 2, -1], ["LC", "Lan Chi", 860, 7, 1],
  ["PA", "Phương Anh", 640, 5, 0], ["BN", "Bảo Ngọc", 420, 1, -2], ["", "Bạn ẩn tên", 310, 3, 0],
  ["HM", "Hoàng Minh", 180, 0, 0], ["DK", "Đăng Khoa", 90, 1, 1],
];

const rows = students.map((s, i) => {
  const t = tierOf(s[2]);
  return { rank: i + 1, ini: s[0] || "?", name: s[1], xp: s[2], streak: s[3], move: s[4], t, div: division(t, s[2]), me: s[1] === "Minh Anh", hidden: !s[0] };
});
const groups = T.TIERS.slice().reverse().map((t) => ({ t, items: rows.filter((r) => r.t.key === t.key) }));

const trend = (m) => m > 0 ? `<span class="trend cok"><span class="ms xs" aria-hidden="true">arrow_upward</span>${m}</span>` : m < 0 ? `<span class="trend cer"><span class="ms xs" aria-hidden="true">arrow_downward</span>${-m}</span>` : `<span class="trend c3"><span class="ms xs" aria-hidden="true">remove</span></span>`;
const av = (r, size) => r.hidden
  ? `<span class="fr" style="background:var(--bd)"><span class="av" style="width:${size}px;height:${size}px;background:var(--bg2);color:var(--tx3)">?</span></span>`
  : T.frame(r.t.key, r.ini, size, { avStyle: r.me ? "background:var(--p);color:#fff" : "background:var(--nt);color:var(--nx)" });
const nameCell = (r) => `<span class="b6 ell${r.hidden ? " hidn" : ""}">${r.name}${r.me ? '<span class="pill">Bạn</span>' : ""}</span>`;
const tierLabel = (r) => T.chip(r.t.key, `${r.t.name}${r.div ? " " + r.div : ""}`);

const baseCss = `
.trend{display:inline-flex;align-items:center;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
.rk{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--nt);font-weight:700;font-size:13px;font-variant-numeric:tabular-nums}
.lr.me{background:var(--pss);box-shadow:inset 3px 0 0 var(--p)}
.lr.me .rk{background:var(--p);color:#fff}
.hidn{color:var(--tx3);font-style:italic;font-weight:500}
.pill{display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:999px;background:var(--p);color:#fff;font-size:10px;font-weight:700;margin-left:6px;vertical-align:middle}
.tg{display:flex;align-items:center;gap:10px;padding:10px 20px;background:var(--bg2);border-top:1px solid var(--dv);border-bottom:1px solid var(--dv)}
.tg .t-m{margin-left:auto}
.mebar{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:#fff;border:1px solid #CFE3FB;box-shadow:var(--sh)}`;

// ---- Web ----
const cols = "44px 40px minmax(0,1.6fr) 140px 110px minmax(0,1.3fr) 80px";
const webRows = groups.map((g) => `      <div class="tg">${T.emblem(g.t.key, 26)}<span class="b7">${g.t.name}</span><span class="t-m tn">${g.t.band} khối</span><span class="t-m">${g.items.length ? g.items.length + " bạn" : "Chưa ai đạt — bạn sẽ là người đầu tiên?"}</span></div>
` + g.items.map((r) => `      <div class="lr${r.me ? " me" : ""}"><span class="rk">${r.rank}</span>${trend(r.move)}<div class="row g12" style="min-width:0">${av(r, 30)}${nameCell(r)}</div>${tierLabel(r)}<span class="row g4 t-s"><span class="ms f xs" style="color:var(--fire)" aria-hidden="true">local_fire_department</span>${r.streak} ngày</span><div class="bar sm"><i style="width:${Math.round(r.xp / 9420 * 100)}%"></i></div><span class="b7 tn" style="text-align:right">${fmt(r.xp)}</span></div>`).join("\n")).join("\n");

const web = head("Học sinh · Thi đua · Cả lớp web", sbCss + baseCss + `
.lr{display:grid;grid-template-columns:${cols};align-items:center;gap:14px;padding:0 20px;height:56px;border-top:1px solid var(--dv)}
.lh{display:grid;grid-template-columns:${cols};gap:14px;padding:10px 20px;font-size:12px;font-weight:600;color:var(--tx3);border-bottom:1px solid var(--bd)}
.lr .bar>i{background:var(--ps)}.lr.me .bar>i{background:var(--p)}`) + `
<div class="desk" style="min-height:1620px;align-items:stretch">
${sidebar("Thi đua")}
  <main class="main" style="gap:18px">
    <div class="col g8">
      <button type="button" class="link" style="align-self:flex-start"><span class="ms xs" aria-hidden="true">arrow_back</span>Thi đua</button>
      <div class="ph">
        <div class="col g4"><h1 class="t-h1" style="font-size:28px">Bảng xếp hạng cả lớp 7A</h1><p class="t-s" style="font-size:15px">Mùa 1 · khóa 2026–2027 · xếp theo bậc, cùng bậc thì ai nhiều XP hơn đứng trên</p></div>
        <div class="row g8 wrap">
          <div class="seg" style="width:330px"><button type="button">Tuần này</button><button type="button">Tháng 11</button><button type="button" class="on">Cả khóa học</button></div>
          <div class="chips"><button type="button" class="chip on">Lớp 7A</button><button type="button" class="chip">Khối 7</button></div>
        </div>
      </div>
    </div>

    <div class="mebar">
      ${T.emblem("dong", 36)}
      <div class="f1"><div class="b6">Bạn đang Đồng 2 · #92 / 128 khối · hạng 7 lớp · 1.240 XP</div><div class="t-m">Mốc tuần này: Đồng 1 1.325 XP (+85) · Bạc 1.480 XP (+240)</div></div>
      <div class="inp" style="width:220px;height:36px"><span class="ms s c3" aria-hidden="true">search</span><span class="c3 f1">Tìm bạn trong lớp</span></div>
      <button type="button" class="btn o sm"><span class="ms xs" aria-hidden="true">my_location</span>Tới chỗ của tôi</button>
    </div>

    <section class="card p0" aria-label="Bảng xếp hạng cả lớp theo bậc">
      <div class="lh"><span>Hạng</span><span></span><span>Học sinh</span><span>Bậc</span><span>Chuỗi ngày</span><span>XP so với hạng 1</span><span style="text-align:right">XP cả khóa</span></div>
${webRows}
      <div class="row sp" style="padding:12px 20px;border-top:1px solid var(--dv)"><span class="t-m">Hiện 14 / 32 bạn</span><button type="button" class="btn o sm">Xem tiếp 18 bạn</button></div>
    </section>
    <p class="hint">Tuần này / Tháng: xếp theo XP kiếm được trong kỳ, như bảng thi đua. Cả khóa học: xếp theo bậc, bậc chia theo tỉ lệ trong khối 7 và cập nhật mỗi thứ Hai. Bạn bật "Ẩn tên" hiện là "Bạn ẩn tên" và không hiện khung viền.</p>
  </main>
</div>
` + tail(1440, 1620);

// ---- Mobile ----
const mobRows = groups.filter((g) => g.items.length).map((g) => `      <div class="tg" style="padding:8px 14px">${T.emblem(g.t.key, 22)}<span class="b7" style="font-size:13px">${g.t.name}</span><span class="t-m">${g.items.length} bạn</span></div>
` + g.items.map((r) => `      <div class="lr${r.me ? " me" : ""}"><span class="rk">${r.rank}</span>${av(r, 30)}<div style="min-width:0"><div class="ell">${nameCell(r)}</div><div class="row g4" style="margin-top:2px">${tierLabel(r)}</div></div><span class="b7 tn">${fmt(r.xp)}</span></div>`).join("\n")).join("\n");

const mob = head("Học sinh · Thi đua · Cả lớp (mobile)", T.css + baseCss + `
.pbody>*{flex-shrink:0}
.lr{display:grid;grid-template-columns:30px 40px minmax(0,1fr) auto;align-items:center;gap:10px;padding:0 14px;height:62px;border-top:1px solid var(--dv)}
.tg+.lr{border-top:0}
.mebar{position:absolute;left:12px;right:12px;bottom:92px;z-index:4}`) + `
<div class="phone" style="height:1620px">
  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại Thi đua"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <div class="f1"><h1 class="t-h1" style="font-size:20px">Cả lớp 7A</h1><div class="t-m">Mùa 1 · 32 bạn</div></div>
    <button type="button" class="ib" aria-label="Tìm bạn"><span class="ms" aria-hidden="true">search</span></button>
  </div>
  <div class="pbody" style="gap:10px;padding-bottom:180px">
    <div class="seg"><button type="button">Tuần này</button><button type="button">Tháng 11</button><button type="button" class="on">Cả khóa</button></div>
    <div class="chips"><button type="button" class="chip on">Lớp 7A</button><button type="button" class="chip">Khối 7</button></div>
    <div class="card p0" style="overflow:hidden">
${mobRows}
    </div>
    <button type="button" class="btn o" style="width:100%">Xem tiếp 18 bạn</button>
  </div>
  <div class="mebar">
    ${T.emblem("dong", 30)}
    <div class="f1" style="min-width:0"><div class="b6 ell">Đồng 2 · hạng 7</div><div class="t-m ell">+85 XP lên Đồng 1</div></div>
    <button type="button" class="btn o sm">Tới chỗ tôi</button>
  </div>
  <nav class="dock" aria-label="Điều hướng học sinh">
    <button type="button" class="dk" aria-label="Trang chủ"><span class="ms" aria-hidden="true">home</span></button>
    <button type="button" class="dk" aria-label="Bài tập"><span class="ms" aria-hidden="true">assignment</span></button>
    <button type="button" class="dk on" aria-current="page"><span class="ms f" aria-hidden="true">emoji_events</span>Thi đua</button>
    <button type="button" class="dk" aria-label="Hộp thư, 2 chưa đọc"><span class="ms" aria-hidden="true">inbox</span><span class="dot"></span></button>
    <button type="button" class="dk" aria-label="Hồ sơ và huy hiệu">${T.frame("dong", "MA", 26, { avStyle: "background:var(--p);color:#fff" })}</button>
  </nav>
</div>
` + tail(390, 1620);

fs.writeFileSync(path.join(out, "H14-CaLop-Web.dc.html"), web);
fs.writeFileSync(path.join(out, "H14m-CaLop.dc.html"), mob);
console.log("written", rows.map((r) => r.name + ":" + r.t.name + r.div).join(", "));
