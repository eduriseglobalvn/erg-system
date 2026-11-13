// Writes H16m (mobile) and H16 (web dialog): the "Lên bậc" celebration shown after the Monday tier update.
const fs = require("fs");
const path = require("path");
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
body{margin:0}${T.css}${extraCss}
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

const css = `
.lv{position:relative;overflow:hidden;background:linear-gradient(180deg,#F3F5F8 0,#fff 60%);display:flex;flex-direction:column;align-items:center;text-align:center}
.lv .rays{position:absolute;left:50%;top:190px;width:760px;height:760px;transform:translate(-50%,-50%);background:repeating-conic-gradient(rgba(138,148,166,.16) 0 7deg,rgba(138,148,166,0) 7deg 20deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 62%);mask:radial-gradient(circle,#000 0,transparent 62%);pointer-events:none}
.lv .glow{position:absolute;left:50%;top:190px;width:260px;height:260px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,0) 70%)}
.cf{position:absolute;width:8px;height:14px;border-radius:2px;opacity:.85}
.cf.r{width:7px;height:7px;border-radius:50%}
.lv>*{position:relative}
.kick{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:999px;background:#fff;border:1px solid var(--bd);font-size:12px;font-weight:700;color:var(--tx2)}
.big{font-size:34px;font-weight:700;letter-spacing:-.01em;line-height:1.15;margin:0}
.swap{display:flex;align-items:center;justify-content:center;gap:14px;padding:14px 16px;border-radius:16px;background:#fff;border:1px solid var(--bd);width:100%}
.swap .col{align-items:center;gap:4px}
.newfr{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:#fff;border:1px solid #D5DBE4;width:100%;text-align:left;box-shadow:0 0 0 4px #F1F3F6}
.nxt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;font-size:13px;color:var(--tx2)}
.prg{position:relative;flex:1;height:8px;border-radius:999px;background:var(--dv);overflow:hidden}
.prg>i{position:absolute;left:0;top:0;bottom:0;width:12%;border-radius:999px;background:linear-gradient(90deg,#DCE1E8,#8A94A6)}`;

const confetti = `
    <span class="cf" style="left:10%;top:70px;background:var(--p);transform:rotate(25deg)" aria-hidden="true"></span>
    <span class="cf" style="left:20%;top:180px;background:var(--gold);transform:rotate(-35deg)" aria-hidden="true"></span>
    <span class="cf r" style="left:28%;top:110px;background:var(--ok)" aria-hidden="true"></span>
    <span class="cf" style="right:12%;top:80px;background:var(--fire);transform:rotate(40deg)" aria-hidden="true"></span>
    <span class="cf" style="right:22%;top:200px;background:#8A94A6;transform:rotate(-15deg)" aria-hidden="true"></span>
    <span class="cf r" style="right:30%;top:60px;background:var(--p)" aria-hidden="true"></span>
    <span class="cf" style="left:6%;top:260px;background:#6C3FD1;transform:rotate(60deg)" aria-hidden="true"></span>
    <span class="cf r" style="right:7%;top:270px;background:var(--gold)" aria-hidden="true"></span>`;

const body = (pad) => `
    <div class="rays" aria-hidden="true"></div>
    <div class="glow" aria-hidden="true"></div>${confetti}
    <span class="kick" style="margin-top:${pad}px"><span class="ms f xs" style="color:var(--gold)" aria-hidden="true">celebration</span>Cập nhật bậc · thứ Hai 16/11</span>
    <div style="margin:22px 0 14px">${T.emblem("bac", 128)}</div>
    <h1 class="big">Lên bậc Bạc!</h1>
    <p class="t-s" style="font-size:15px;margin:6px 0 18px">Tuần qua bạn vượt <b>11 bạn</b> trong khối 7 · giờ ở top 63%</p>
    <div class="col g12" style="width:100%;gap:12px">
      <div class="swap" aria-label="Từ Đồng 1 lên Bạc 5">
        <div class="col">${T.emblem("dong", 40)}<span class="t-m b6">Đồng 1</span></div>
        <span class="ms" style="color:var(--tx3);font-size:28px" aria-hidden="true">arrow_forward</span>
        <div class="col">${T.emblem("bac", 48)}<span class="b6" style="font-size:13px">Bạc 5</span></div>
      </div>
      <div class="newfr">
        ${T.frame("bac", "MA", 56, { avStyle: "background:var(--p);color:#fff" })}
        <div class="f1"><div class="b6">Khung viền Bạc đã mở</div><div class="t-m">Hiện quanh ảnh của bạn trên bảng xếp hạng và trong menu</div></div>
      </div>
      <div class="nxt"><span class="t-m b6" style="white-space:nowrap">Tiếp: Bạc 4</span><div class="prg" aria-label="Vừa vào Bạc 5"><i></i></div><span class="t-m" style="white-space:nowrap">vượt 2 bạn</span></div>
    </div>`;

const mob = head("Học sinh · Lên bậc (mobile)", css) + `
<div class="phone lv" style="padding:0 20px">
${body(40)}
    <div class="col g8" style="width:100%;margin-top:auto;padding-bottom:28px;gap:8px">
      <button type="button" class="btn c lg" style="width:100%">Dùng khung Bạc</button>
      <button type="button" class="btn t" style="width:100%">Để sau</button>
      <span class="t-m">Đổi khung bất cứ lúc nào ở Hồ sơ › Khung viền</span>
    </div>
</div>
` + tail(390, 844);

const web = head("Học sinh · Lên bậc web", css + `
.backdrop{position:relative;width:1440px;height:900px;background:var(--bg);overflow:hidden}
.backdrop .ghost{position:absolute;inset:16px;display:flex;gap:16px;filter:blur(2px);opacity:.6}
.backdrop .ghost .s{width:232px;border-radius:20px;background:#fff}
.backdrop .ghost .m{flex:1;display:flex;flex-direction:column;gap:16px}
.backdrop .ghost .m i{display:block;border-radius:14px;background:#fff;border:1px solid var(--bd)}
.scrim{position:absolute;inset:0;background:rgba(29,29,31,.38)}
.dlg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;border-radius:20px;box-shadow:var(--sh);padding:28px 40px 28px}
.dlg .x{position:absolute;right:14px;top:14px}`) + `
<div class="backdrop">
  <div class="ghost" aria-hidden="true"><div class="s"></div><div class="m"><i style="height:70px"></i><i style="height:260px"></i><i style="flex:1"></i></div></div>
  <div class="scrim" aria-hidden="true"></div>
  <div class="dlg lv" role="dialog" aria-modal="true" aria-labelledby="lvt">
    <button type="button" class="ib ghost x" aria-label="Đóng"><span class="ms" aria-hidden="true">close</span></button>
${body(4).replace('class="big"', 'class="big" id="lvt"')}
    <div class="row g8" style="width:100%;margin-top:22px;justify-content:flex-end">
      <span class="t-m f1" style="text-align:left">Đổi khung sau ở menu tài khoản › Khung viền</span>
      <button type="button" class="btn t">Để sau</button>
      <button type="button" class="btn o"><span class="ms s" aria-hidden="true">stairs</span>Xem bậc của tôi</button>
      <button type="button" class="btn c">Dùng khung Bạc</button>
    </div>
  </div>
</div>
` + tail(1440, 900);

fs.writeFileSync(path.join(out, "H16m-LenBac.dc.html"), mob);
fs.writeFileSync(path.join(out, "H16-LenBac-Web.dc.html"), web);
console.log("written");
