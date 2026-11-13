// Writes H15 (web) and H15m (mobile): "Bậc của bạn" tier ladder screens.
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
const range = (t) => `${t.band} · ${t.count} bạn`;
const CUR = 2; // Đồng
const state = (i) => (i < CUR ? "done" : i === CUR ? "cur" : "lock");

const ladderCss = `
.hero2{position:relative;overflow:hidden;background:linear-gradient(120deg,#FBF1E9 0,#fff 55%)}
.hero2::before{content:"";position:absolute;right:-80px;top:-80px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(227,160,107,.25),rgba(227,160,107,0) 70%)}
.prg{position:relative;height:12px;border-radius:999px;background:var(--dv);overflow:hidden}
.prg>i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#D08850,#9A4E1F)}
.div3{display:flex;gap:4px}.div3 span{flex:1;height:6px;border-radius:999px;background:var(--dv)}.div3 span.on{background:#B4632B}
.lad{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;position:relative}
.lad::before{content:"";position:absolute;left:6%;right:6%;top:34px;height:4px;border-radius:999px;background:linear-gradient(90deg,#B4632B 0 31%,var(--dv) 31%)}
.st{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:0 2px}
.st.lock .emb,.st.lock .fr{filter:grayscale(.85);opacity:.5}
.st .nm{font-size:14px;font-weight:700}
.st.cur .nm{color:#9A4E1F}
.here{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;background:var(--p);color:#fff;font-size:11px;font-weight:700}
.rule{display:flex;gap:12px;align-items:flex-start}
.rule .ico{flex-shrink:0}
.frm{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border-radius:14px;border:1px solid var(--bd);background:#fff;text-align:center}
.frm.on{border-color:var(--p);box-shadow:0 0 0 2px var(--pss)}
.frm.lock .fr{filter:grayscale(.85);opacity:.45}`;

const ladder = (size, fr) => T.TIERS.map((t, i) => {
  const s = state(i);
  const tag = s === "cur" ? `<span class="here">Bạn ở đây</span>` : s === "done" ? `<span class="row g4 t-m cok"><span class="ms f xs" aria-hidden="true">check_circle</span>Đã qua</span>` : `<span class="row g4 t-m"><span class="ms xs" aria-hidden="true">lock</span>${i === T.TIERS.length - 1 ? "Top khóa" : "Chưa mở"}</span>`;
  return `        <div class="st ${s}">${T.emblem(t.key, size)}<span class="nm">${t.name}</span><span class="t-m tn">${range(t)}</span>${T.frame(t.key, "MA", fr, { avStyle: "background:var(--p);color:#fff" })}${tag}</div>`;
}).join("\n");

const frames = T.TIERS.map((t, i) => {
  const old = t.key === "bk"; // unlocked in a previous course
  const s = i < CUR || old ? "" : i === CUR ? " on" : " lock";
  const lbl = i === CUR ? `<span class="t-m cp b6">Đang dùng</span>` : i < CUR || old ? `<span class="t-m">${old ? "Khóa hè 2026" : "Đã mở"}</span>` : `<span class="t-m">Bậc ${t.name}</span>`;
  return `<div class="frm${s}">${T.frame(t.key, "MA", 34, { avStyle: "background:var(--p);color:#fff" })}<span class="b6" style="font-size:12px">${t.name}</span>${lbl}</div>`;
}).join("");

const rules = `
          <div class="rule"><span class="ico sm"><span class="ms f s" aria-hidden="true">groups</span></span><div><div class="b6">Bậc theo vị trí của bạn trong khối 7</div><div class="t-s">Xếp 128 bạn trong khối theo tổng XP cả khóa rồi chia theo tỉ lệ: top 3% Cao thủ, 3–12% Kim cương, 12–25% Bạch kim, 25–45% Vàng… Cập nhật 0 giờ thứ Hai hằng tuần.</div></div></div>
          <div class="rule"><span class="ico sm wn"><span class="ms f s" aria-hidden="true">stairs</span></span><div><div class="b6">Mỗi bậc có 5 cấp: 5 → 4 → 3 → 2 → 1</div><div class="t-s">Chia đều theo vị trí trong bậc. Mốc XP để lên bậc thay đổi theo cả khối, nên luôn hiện "mốc tuần này" để bạn biết cần bao nhiêu XP.</div></div></div>
          <div class="rule"><span class="ico sm ok"><span class="ms f s" aria-hidden="true">verified_user</span></span><div><div class="b6">Có thể tụt bậc, nhưng có 1 tuần bảo vệ</div><div class="t-s">Chỉ tụt khi ở dưới mốc 2 lần cập nhật liên tiếp. Khung viền đã mở giữ mãi. Chỉ xét bạn đã nộp ít nhất 3 bài trong khóa.</div></div></div>`;

// ---- Web ----
const web = head("Học sinh · Bậc của bạn web", sbCss + ladderCss) + `
<div class="desk" style="min-height:1180px;align-items:stretch">
${sidebar("Thi đua")}
  <main class="main" style="gap:20px">
    <div class="ph">
      <div class="col g4"><h1 class="t-h1" style="font-size:28px">Bậc của bạn</h1><p class="t-s" style="font-size:15px">Mùa 1 · khóa 2026–2027 · xếp theo tỉ lệ trong khối 7 (128 bạn) · cập nhật 0 giờ thứ Hai</p></div>
      <div class="seg" style="width:300px"><button type="button">Thi đua tuần</button><button type="button" class="on">Bậc cả khóa</button></div>
    </div>

    <section class="card p24 row g24 hero2" aria-labelledby="mytier">
      <div class="row g20" style="position:relative">
        ${T.emblem("dong", 110)}
        <div class="col g8">
          <span class="t-ov">Bậc hiện tại</span>
          <h2 id="mytier" style="margin:0;font-size:34px;font-weight:700;color:#8A431A;line-height:1.1">Đồng 2</h2>
          <span class="t-s"><b class="tn">1.240 XP</b> cả khóa · #92 / 128 khối 7 · top 72%</span>
          <div class="div3" style="width:220px" aria-label="Cấp 2 trong 5 cấp của bậc Đồng"><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span></span></div>
          <span class="t-m">Đồng 5 → 4 → 3 → <b>2</b> → 1</span>
        </div>
      </div>
      <div class="col g16 f1" style="position:relative;max-width:520px;margin-left:auto">
        <div class="col g8">
          <div class="row sp"><span class="b6">Vượt 3 bạn trong khối lên Đồng 1</span><span class="t-m tn">mốc tuần này 1.325 XP</span></div>
          <div class="prg"><i style="width:88%"></i></div>
        </div>
        <div class="col g8">
          <div class="row sp"><span class="row g8 b6">${T.frame("bac", "MA", 26, { avStyle: "background:var(--p);color:#fff" })}Vượt 8 bạn lên Bạc, mở khung viền Bạc</span><span class="t-m tn">mốc tuần này 1.480 XP</span></div>
          <div class="prg"><i style="width:63%;background:linear-gradient(90deg,#DCE1E8,#8A94A6)"></i></div>
        </div>
        <div class="row g8"><button type="button" class="btn c">Làm bài lấy XP<span class="ms s" aria-hidden="true">arrow_forward</span></button><span class="t-m">3 bài đang mở · tới +145 XP</span></div>
      </div>
    </section>

    <section class="card p24 col g20" aria-labelledby="lad">
      <div class="sec"><h2 class="t-h3" id="lad">8 bậc trong mùa</h2><span class="t-m">Tỉ lệ cố định, mốc XP đổi theo cả khối · mỗi bậc mở một khung viền</span></div>
      <div class="lad">
${ladder(64, 30)}
      </div>
    </section>

    <div class="row top g20">
      <section class="card p24 col g16" style="flex:1 1 0" aria-labelledby="rules"><h2 class="t-h3" id="rules">Luật lên bậc</h2>${rules}
      </section>
      <section class="card p24 col g16" style="flex:1 1 0" aria-labelledby="frames">
        <div class="sec"><h2 class="t-h3" id="frames">Khung viền của bạn</h2><span class="t-m"><button type="button" class="link">Đổi khung<span class="ms xs" aria-hidden="true">chevron_right</span></button></span></div>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">${frames}</div>
      </section>
    </div>
  </main>
</div>
` + tail(1440, 1180);

// ---- Mobile ----
const mList = T.TIERS.slice().reverse().map((t) => {
  const i = T.TIERS.indexOf(t), s = state(i);
  const right = s === "cur" ? `<span class="here">Bạn ở đây</span>` : s === "done" ? `<span class="ms f s cok" aria-label="Đã qua">check_circle</span>` : `<span class="ms s c3" aria-label="Chưa mở">lock</span>`;
  return `      <div class="li st2 ${s}" style="min-height:60px;${s === "cur" ? "background:#FBF1E9" : ""}">${T.emblem(t.key, 34)}<div class="f1"><div class="b6">${t.name}</div><div class="t-m tn">${range(t)}</div></div>${T.frame(t.key, "MA", 26, { avStyle: "background:var(--p);color:#fff" })}${right}</div>`;
}).join("\n");

const mob = head("Học sinh · Bậc của bạn (mobile)", T.css + ladderCss + `
.pbody>*{flex-shrink:0}
.st2.lock .emb,.st2.lock .fr{filter:grayscale(.85);opacity:.5}`) + `
<div class="phone" style="height:1380px">
  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại Thi đua"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <div class="f1"><h1 class="t-h1" style="font-size:20px">Bậc của bạn</h1><div class="t-m">Mùa 1 · khóa 2026–2027</div></div>
    <button type="button" class="ib" aria-label="Luật lên bậc"><span class="ms" aria-hidden="true">help</span></button>
  </div>
  <div class="pbody" style="gap:12px">
    <section class="card col g12 hero2" style="padding:18px;align-items:center;text-align:center">
      <div style="position:relative">${T.emblem("dong", 84)}</div>
      <div style="position:relative"><div style="font-size:28px;font-weight:700;color:#8A431A;line-height:1.1">Đồng 2</div><div class="t-s"><b class="tn">1.240 XP</b> cả khóa · #92 / 128 khối</div></div>
      <div class="div3" style="width:180px;position:relative"><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span></span></div>
      <div class="col g6" style="width:100%;position:relative;gap:6px;text-align:left">
        <div class="row sp"><span class="b6">Vượt 3 bạn trong khối lên Đồng 1</span><span class="t-m tn">mốc tuần này 1.325 XP</span></div>
        <div class="prg"><i style="width:88%"></i></div>
        <div class="row sp" style="margin-top:6px"><span class="t-s">Vượt 8 bạn lên <b>Bạc</b></span><span class="t-m tn">mốc 1.480 XP</span></div>
        <div class="prg" style="height:8px"><i style="width:63%;background:linear-gradient(90deg,#DCE1E8,#8A94A6)"></i></div>
      </div>
      <button type="button" class="btn c" style="width:100%;position:relative">Làm bài lấy XP<span class="ms s" aria-hidden="true">arrow_forward</span></button>
    </section>
    <div class="t-ov" style="padding:4px 2px 0">8 bậc trong mùa</div>
    <div class="card p0">
${mList}
    </div>
    <div class="card col g12" style="padding:16px">${rules}
    </div>
  </div>
  <nav class="dock" aria-label="Điều hướng học sinh">
    <button type="button" class="dk" aria-label="Trang chủ"><span class="ms" aria-hidden="true">home</span></button>
    <button type="button" class="dk" aria-label="Bài tập"><span class="ms" aria-hidden="true">assignment</span></button>
    <button type="button" class="dk on" aria-current="page"><span class="ms f" aria-hidden="true">emoji_events</span>Thi đua</button>
    <button type="button" class="dk" aria-label="Hộp thư, 2 chưa đọc"><span class="ms" aria-hidden="true">inbox</span><span class="dot"></span></button>
    <button type="button" class="dk" aria-label="Hồ sơ và huy hiệu">${T.frame("dong", "MA", 26, { avStyle: "background:var(--p);color:#fff" })}</button>
  </nav>
</div>
` + tail(390, 1380);

fs.writeFileSync(path.join(out, "H15-Bac-Web.dc.html"), web);
fs.writeFileSync(path.join(out, "H15m-Bac.dc.html"), mob);
console.log("written");
