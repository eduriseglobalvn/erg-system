// Compact student sidebar shared by H08–H11 (each artboard stays self-contained, so it is inlined).
const tiers = require("./tiers");
const css = tiers.css + `
.sb{flex:0 0 232px;width:232px;background:#fff;border-radius:20px;box-shadow:var(--sh);padding:14px 10px 10px;display:flex;flex-direction:column;gap:2px;align-self:stretch}
.sb .brand{display:flex;align-items:center;gap:10px;padding:2px 8px 12px}
.sb .brand .lg{width:34px;height:34px;border-radius:10px;background:var(--p);color:#fff;display:grid;place-items:center}
.sb .me{display:flex;flex-direction:column;gap:10px;padding:12px;margin:0 2px 6px;border-radius:14px;background:var(--bg2);border:1px solid var(--dv)}
.sb .chipx{display:inline-flex;align-items:center;gap:3px;height:26px;padding:0 9px 0 6px;border-radius:999px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
.sbg{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3);padding:12px 10px 4px}
.sbn{display:flex;align-items:center;gap:10px;height:40px;padding:0 10px;border-radius:10px;font-size:14px;font-weight:500;color:#3A3A3C}
.sbn .ms{font-size:20px;color:var(--tx3)}
.sbn .f1{flex:1}
.sbn.on{background:var(--p);color:#fff;font-weight:600}
.sbn.on .ms{color:#fff}
.sbn .nb{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--int);color:var(--inx);font-size:11px;font-weight:700;display:inline-grid;place-items:center}
.sbn.on .nb{background:rgba(255,255,255,.22);color:#fff}
.sbn .nb.er{background:var(--er);color:#fff}
.sb .nudge{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:#FFF7ED;border:1px solid #FED7AA;color:#9A3412;font-size:12px;font-weight:600;line-height:1.35}
.sb .acc{display:flex;align-items:center;gap:8px;padding:8px 4px 2px 8px;border-top:1px solid var(--dv);margin-top:8px}
`;

const items = [
  ["g", "Học tập"],
  ["home", "Tổng quan"],
  ["assignment", "Bài tập", "4"],
  ["grade", "Điểm số"],
  ["g", "Lớp của tôi"],
  ["emoji_events", "Thi đua", "#4"],
  ["forum", "Thảo luận"],
  ["inbox", "Hộp thư", "2", "er"],
];

function sidebar(active) {
  const nav = items.map(([icon, label, badge, tone]) => {
    if (icon === "g") return `    <div class="sbg">${label}</div>`;
    const on = label === active;
    return `    <a class="sbn${on ? " on" : ""}" href="#"${on ? ' aria-current="page"' : ""}><span class="ms${on ? " f" : ""}" aria-hidden="true">${icon}</span><span class="f1">${label}</span>${badge ? `<span class="nb${tone ? " " + tone : ""}">${badge}</span>` : ""}</a>`;
  }).join("\n");
  return `  <aside class="sb" aria-label="Điều hướng học sinh">
    <div class="brand"><span class="lg"><span class="ms f s" aria-hidden="true">school</span></span><div class="f1"><div class="t-h3">ERG Học tập</div><div class="t-m">Cổng học sinh</div></div></div>
    <div class="me">
      <div class="row g12">${tiers.frame("dong", "MA", 36, { avStyle: "background:var(--p);color:#fff" })}<div class="f1" style="min-width:0"><div class="b6 ell">Nguyễn Minh Anh</div><div class="row g4" style="margin-top:2px">${tiers.chip("dong", "Đồng 2")}<span class="t-m">Lớp 7A</span></div></div></div>
      <div class="row g4"><span class="chipx" style="background:var(--pss);color:var(--inx)"><span class="ms f xs cp" aria-hidden="true">bolt</span>1.240 XP</span><span class="chipx" style="background:#FFEDD5;color:#9A3412"><span class="ms f xs" style="color:var(--fire)" aria-hidden="true">local_fire_department</span>12 ngày</span></div>
    </div>
${nav}
    <div class="f1"></div>
    <div class="nudge"><span class="ms f" style="color:var(--fire)" aria-hidden="true">local_fire_department</span><span>Làm 1 bài hôm nay để giữ chuỗi 13 ngày</span></div>
    <div class="acc"><span class="t-s f1">Tài khoản &amp; cài đặt</span><button type="button" class="ib ghost" aria-label="Đăng xuất" style="width:36px;height:36px"><span class="ms s" aria-hidden="true">logout</span></button></div>
  </aside>`;
}

module.exports = { css, sidebar };
