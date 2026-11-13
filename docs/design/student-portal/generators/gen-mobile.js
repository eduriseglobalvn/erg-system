// Writes 6 student mobile artboards (390px) matching the new web screens H08–H13.
const fs = require("fs");
const path = require("path");
const out = process.argv[2];
const T = require("./tiers");

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

const tail = (h, script) => `</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":${h}}}'>
class Component extends DCLogic {
  renderVals() {
${script || "    return {};"}
  }
}
</script>
</body>
</html>
`;

const dock = (on) => {
  const it = [["home", "Trang chủ"], ["assignment", "Bài tập"], ["emoji_events", "Thi đua"], ["inbox", "Hộp thư"]];
  const btns = it.map(([icon, label]) => on === label
    ? `    <button type="button" class="dk on" aria-current="page"><span class="ms f" aria-hidden="true">${icon}</span>${label}</button>`
    : `    <button type="button" class="dk" aria-label="${label}${label === "Hộp thư" ? ", 2 chưa đọc" : ""}"><span class="ms" aria-hidden="true">${icon}</span>${label === "Hộp thư" ? '<span class="dot"></span>' : ""}</button>`).join("\n");
  return `  <nav class="dock" aria-label="Điều hướng học sinh">
${btns}
    <button type="button" class="dk" aria-label="Hồ sơ, bậc Đồng 2">${T.frame("dong", "MA", 26, { avStyle: "background:var(--p);color:#fff" })}</button>
  </nav>`;
};

const common = T.css + `
.pbody>*{flex-shrink:0}
.due{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.due.wn{background:var(--wnt);color:var(--wnx)}.due.n{background:var(--nt);color:var(--tx2)}.due.er{background:var(--ert);color:var(--erx)}
.bub{max-width:80%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.5}
.bub.them{background:var(--bg2);border:1px solid var(--dv);border-top-left-radius:6px}
.bub.me{background:var(--p);color:#fff;border-top-right-radius:6px;margin-left:auto}
.day{align-self:center;font-size:12px;font-weight:600;color:var(--tx3);padding:2px 10px;border-radius:999px;background:var(--bg2)}
.tag{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:700;background:var(--int);color:var(--inx)}
.rx{display:flex;gap:14px;align-items:center;font-size:12px;font-weight:600;color:var(--tx3)}
.rx span{display:inline-flex;align-items:center;gap:4px}
.comp{display:flex;gap:8px;align-items:center;padding:10px 12px;border-top:1px solid var(--dv);background:#fff}
.comp .box{flex:1;min-height:44px;border:1px solid var(--bd);border-radius:22px;padding:11px 14px;color:var(--tx3);font-size:14px}`;

// ---------- H03b · Thi đua mobile (3D podium + my rank) ----------
const thiDuaCss = common + `
.me-strip{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid #CFE3FB;background:linear-gradient(90deg,var(--pss),#fff 80%)}
.cdn{display:inline-flex;white-space:nowrap;flex-shrink:0;gap:4px;align-items:center}
.cdn b{min-width:28px;height:28px;padding:0 5px;border-radius:8px;background:#fff;border:1px solid var(--bd);display:inline-grid;place-items:center;font-size:14px;font-variant-numeric:tabular-nums}
.cdn span{font-size:11px;color:var(--tx3);font-weight:600;margin-right:6px}
.cdn span:last-child{margin-right:0}
.arena{position:relative;overflow:hidden;background:linear-gradient(180deg,#F7FAFF 0,#fff 60%);padding:14px 12px 4px}
.rays{position:absolute;left:50%;top:110px;width:560px;height:560px;transform:translate(-50%,-50%);background:repeating-conic-gradient(rgba(201,138,4,.10) 0 6deg,rgba(201,138,4,0) 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 60%);mask:radial-gradient(circle,#000 0,transparent 60%);pointer-events:none}
.cf{position:absolute;width:6px;height:11px;border-radius:2px;opacity:.75}
.p3{display:flex;align-items:flex-end;gap:6px;position:relative}
.p3 .c{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1px}
.coin{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:700;text-shadow:0 1px 0 rgba(0,0,0,.25);margin-bottom:6px}
.coin.s{background:radial-gradient(circle at 32% 28%,#fff 0,#C9D0DA 38%,#8A94A6 100%);box-shadow:0 3px 0 #626B7A}
.coin.b{background:radial-gradient(circle at 32% 28%,#FFE3CC 0,#DB8E58 38%,#B4632B 100%);box-shadow:0 3px 0 #7F421A}
.hero{position:relative;border-radius:50%;display:grid;place-items:center;font-weight:700;box-shadow:0 8px 14px rgba(29,29,31,.16)}
.hero::after{content:"";position:absolute;inset:3px;border-radius:50%;background:linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,0) 45%)}
.crown{font-size:30px;color:#E2A400;filter:drop-shadow(0 2px 0 #8F6200);margin-bottom:-4px;position:relative;z-index:1}
.p3 .nm{font-size:13px;font-weight:600;margin-top:6px;max-width:100%}
.p3 .xp{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
.cube{width:100%;margin-top:8px}
.cube .lid{height:20px;border-radius:5px 5px 0 0;transform:perspective(260px) rotateX(52deg);transform-origin:bottom;margin:0 4px -1px}
.cube .face{border-radius:0 0 4px 4px;display:grid;place-items:start center;padding-top:8px;font-size:24px;font-weight:700;line-height:1;box-shadow:inset 0 -8px 14px rgba(0,0,0,.06)}
.sh3{height:10px;width:96%;margin:-1px auto 0;border-radius:50%;background:radial-gradient(ellipse,rgba(29,29,31,.14),rgba(29,29,31,0) 70%)}
.trk{position:relative;height:8px;border-radius:999px;background:#fff;border:1px solid #CFE3FB}
.trk>i{position:absolute;left:0;top:0;bottom:0;width:90%;border-radius:999px;background:var(--p)}
.note3{display:flex;align-items:flex-start;justify-content:center;gap:6px;padding:10px 8px 12px;position:relative;font-size:12px;line-height:1.4;color:var(--tx2);text-align:center}`;

const h03b = head("Học sinh · Thi đua (mobile mới)", thiDuaCss) + `
<div class="phone" style="height:1380px">
  <div class="ptop">
    <h1 class="t-h1 f1">Thi đua</h1>
    <button type="button" class="ib" aria-label="Cách tính XP"><span class="ms" aria-hidden="true">help</span></button>
  </div>
  <div class="pbody" style="gap:12px">
    <div class="me-strip" aria-label="Thứ hạng hiện tại của bạn">
      ${T.frame("dong", "MA", 40, { avStyle: "background:var(--p);color:#fff" })}
      <div class="f1 col g2">
        <span class="row g4"><span class="t-m b6">Thứ hạng tuần</span>${T.chip("dong", "Đồng 2")}</span>
        <span class="row g8"><span class="b7 tn" style="font-size:24px;line-height:1;color:var(--p)">#4</span><span class="t-m">/ 32 · Khối #12</span></span>
      </div>
      <span class="bd ok nd"><span class="ms xs" aria-hidden="true">arrow_upward</span>2</span>
    </div>

    <div class="seg"><button type="button" class="on">Tuần này</button><button type="button">Tháng 11</button><button type="button">Cả khóa</button></div>
    <div class="chips"><button type="button" class="chip on">Lớp 7A</button><button type="button" class="chip">Khối 7</button></div>

    <section class="card p0 arena" aria-label="Top 3 tuần này">
      <div class="row sp" style="position:relative;padding:0 4px 14px;margin-bottom:6px;border-bottom:1px dashed var(--bd)">
        <span class="t-h3">Top 3 tuần này</span>
        <span class="row g8"><span class="t-m">Chốt sau</span><span class="cdn" aria-label="2 ngày 14 giờ"><b>2</b><span>ngày</span><b>14</b><span>giờ</span></span></span>
      </div>
      <div class="rays" aria-hidden="true"></div>
      <span class="cf" style="left:8%;top:70px;background:var(--p);transform:rotate(25deg)" aria-hidden="true"></span>
      <span class="cf" style="right:9%;top:60px;background:var(--fire);transform:rotate(40deg)" aria-hidden="true"></span>
      <span class="cf" style="left:22%;top:140px;background:var(--gold);transform:rotate(-30deg)" aria-hidden="true"></span>
      <span class="cf" style="right:20%;top:150px;background:var(--ok);transform:rotate(-15deg)" aria-hidden="true"></span>
      <div class="p3">
        <div class="c">
          <span class="coin s">2</span>
          <span class="hero" style="width:54px;height:54px;font-size:17px;background:var(--nt);color:var(--nx);border:2px solid #fff;outline:2px solid var(--silver)">ĐH</span>
          <span class="nm ell">Đức Huy</span><span class="xp">486</span>
          <div class="cube"><div class="lid" style="background:linear-gradient(#F7F8FA,#E6E9EE)"></div><div class="face" style="height:64px;background:linear-gradient(#E3E7ED,#CDD3DC);color:#5B6474">2</div></div>
          <div class="sh3"></div>
        </div>
        <div class="c" style="flex:1.15">
          <span class="ms f crown" aria-hidden="true">crown</span>
          <span class="hero" style="width:70px;height:70px;font-size:21px;background:#FDF3D7;color:#7A5A00;border:3px solid #fff;outline:3px solid var(--gold);box-shadow:0 0 0 8px rgba(242,201,76,.22),0 10px 18px rgba(143,98,0,.22)">KT</span>
          <span class="nm ell" style="font-size:14px">Khánh Thy</span><span class="xp" style="font-size:19px">512</span>
          <div class="cube"><div class="lid" style="background:linear-gradient(#FFF8E1,#FBE7A8)"></div><div class="face" style="height:90px;background:linear-gradient(#F9E3A0,#EFC85E);color:#7A5A00">1</div></div>
          <div class="sh3"></div>
        </div>
        <div class="c">
          <span class="coin b">3</span>
          <span class="hero" style="width:54px;height:54px;font-size:17px;background:#F8E6DA;color:#7C3A12;border:2px solid #fff;outline:2px solid var(--bronze)">GB</span>
          <span class="nm ell">Gia Bảo</span><span class="xp">420</span>
          <div class="cube"><div class="lid" style="background:linear-gradient(#FDF1E8,#F4D9C5)"></div><div class="face" style="height:48px;background:linear-gradient(#F3D6C1,#E5B593);color:#7C3A12">3</div></div>
          <div class="sh3"></div>
        </div>
      </div>
      <div class="note3"><span class="ms f xs" style="color:var(--gold)" aria-hidden="true">military_tech</span><span>Top 3 lúc chốt bảng nhận huy hiệu Vàng · Bạc · Đồng</span></div>
    </section>

    <div class="card col g8" style="padding:14px;border-color:#CFE3FB;background:var(--pss)">
      <div class="row sp"><span class="b6">Còn 40 XP là lên bục</span><span class="t-m tn">380 / 420</span></div>
      <div class="trk" role="img" aria-label="380 trên 420 XP"><i></i></div>
      <button type="button" class="btn c" style="width:100%">Làm 1 bài để lên bục<span class="ms s" aria-hidden="true">arrow_forward</span></button>
    </div>

    <div class="card p0">
      <sc-for list="{{rows}}" as="r" hint-placeholder-count="6">
        <div class="li" style="min-height:58px;{{r.bg}}">
          <span class="b7 tn" style="width:24px;text-align:center">{{r.rank}}</span>
          <span class="fr t-{{r.tier}}"><span class="av">{{r.ini}}</span></span>
          <div class="f1" style="min-width:0"><div class="b6 ell">{{r.name}}</div><div class="row g4 t-m"><span class="ms f xs" style="color:var(--fire)" aria-hidden="true">local_fire_department</span>{{r.streak}} ngày</div></div>
          <span class="b7 tn">{{r.xp}}</span>
          <span class="ms s {{r.trendCls}}" aria-label="{{r.trendLabel}}">{{r.trend}}</span>
        </div>
      </sc-for>
      <button type="button" class="link" style="padding:12px 16px">Xem cả lớp<span class="ms xs" aria-hidden="true">chevron_right</span></button>
    </div>
    <p class="hint">XP: hoàn thành bài +10–40 · nộp trước hạn +10 · chuỗi ≥ 7 ngày ×1,2. Không hiện điểm số của ai.</p>
  </div>
${dock("Thi đua")}
</div>
` + tail(1380, `    const up = { trend: 'arrow_upward', trendCls: 'cok', trendLabel: 'Tăng hạng' };
    const down = { trend: 'arrow_downward', trendCls: 'cer', trendLabel: 'Giảm hạng' };
    const same = { trend: 'remove', trendCls: 'c3', trendLabel: 'Giữ hạng' };
    const row = function (rank, ini, name, streak, xp, t, me, tier) {
      return Object.assign({ tier: tier, rank: rank, ini: ini, name: name, streak: streak, xp: xp, bg: me ? 'background:var(--pss);box-shadow:inset 3px 0 0 var(--p)' : '' }, t);
    };
    return {
      rows: [
        row(4, 'MA', 'Minh Anh (bạn)', 12, 380, up, true, 'dong'),
        row(5, 'TL', 'Thảo Linh', 9, 362, down, false, 'vang'),
        row(6, 'QH', 'Quang Hải', 4, 318, up, false, 'vang'),
        row(7, 'NV', 'Ngọc Vy', 15, 296, same, false, 'bac'),
        row(8, 'TK', 'Tuấn Kiệt', 2, 241, down, false, 'dong')
      ]
    };`);

// ---------- Bài tập tabs ----------
const seg = (on) => `<div class="seg"><button type="button"${on === "todo" ? ' class="on"' : ""}>Cần làm <span class="cnt">4</span></button><button type="button"${on === "done" ? ' class="on"' : ""}>Đã nộp <span class="cnt">5</span></button><button type="button"${on === "late" ? ' class="on"' : ""}>Quá hạn <span class="cnt er">2</span></button></div>`;
const ptopBT = `  <div class="ptop">
    <h1 class="t-h1 f1">Bài tập</h1>
    <button type="button" class="ib" aria-label="Tìm bài"><span class="ms" aria-hidden="true">search</span></button>
  </div>`;

const h02c = head("Học sinh · Bài tập cần làm (mobile mới)", common + `
.cont{background:var(--p);color:#fff;border-color:var(--p)}
.cont .bar{background:rgba(255,255,255,.25)}.cont .bar>i{background:#fff}`) + `
<div class="phone" style="height:1000px">
${ptopBT}
  <div class="pbody" style="gap:12px">
    ${seg("todo")}
    <section class="card col g8 cont" style="padding:16px" aria-labelledby="cont">
      <span class="row g4" style="font-size:11px;font-weight:700;opacity:.9"><span class="ms s" aria-hidden="true">play_circle</span>ĐANG LÀM DỞ · TOÁN</span>
      <h2 id="cont" style="margin:0;font-size:17px;font-weight:600;line-height:1.35">Luyện tập: Phương trình bậc nhất một ẩn</h2>
      <div style="font-size:13px;opacity:.88">12/20 câu · còn khoảng 6 phút · hạn 20:00 hôm nay</div>
      <div class="bar"><i style="width:60%"></i></div>
      <div class="row sp" style="margin-top:4px"><span class="bd nd" style="background:rgba(255,255,255,.18);color:#fff"><span class="ms f xs" aria-hidden="true">bolt</span>+50 XP</span><button type="button" class="btn" style="background:#fff;color:var(--p);padding:0 22px">Làm tiếp</button></div>
    </section>
    <sc-for list="{{groups}}" as="g" hint-placeholder-count="2">
      <div class="row sp" style="padding:4px 2px 0"><span class="t-ov">{{g.name}}</span><span class="t-m">{{g.sum}}</span></div>
      <sc-for list="{{g.items}}" as="a" hint-placeholder-count="2">
        <div class="card col g8" style="padding:14px 16px">
          <div class="row top g12">
            <span class="ico sm {{a.tone}}"><span class="ms f s" aria-hidden="true">{{a.icon}}</span></span>
            <div class="f1 col g2" style="min-width:0"><span class="b6">{{a.title}}</span><span class="t-m">{{a.meta}}</span></div>
          </div>
          <div class="row sp">
            <div class="row g8"><span class="due {{a.dueTone}}"><span class="ms xs" aria-hidden="true">schedule</span>{{a.left}}</span><span class="bd in nd">{{a.xp}}</span></div>
            <button type="button" class="btn o sm">{{a.cta}}</button>
          </div>
        </div>
      </sc-for>
    </sc-for>
  </div>
${dock("Bài tập")}
</div>
` + tail(1000, `    const a = function (icon, tone, title, meta, left, dueTone, xp, cta) { return { icon: icon, tone: tone, title: title, meta: meta, left: left, dueTone: dueTone, xp: xp, cta: cta }; };
    return {
      groups: [
        { name: 'Hôm nay', sum: '+40 XP', items: [
          a('quiz', '', 'Kiểm tra 15 phút: Đơn thức', 'Toán · 10 câu · làm 1 lần', 'Còn 4 giờ', 'wn', '+40 XP', 'Bắt đầu')
        ] },
        { name: 'Tuần này', sum: '2 bài · +55 XP', items: [
          a('menu_book', 'wn', 'Trắc nghiệm: Từ loại tiếng Việt', 'Ngữ văn · 10 câu', 'Ngày mai 21:00', 'n', '+30 XP', 'Bắt đầu'),
          a('translate', 'ok', 'Unit 4 · Vocabulary quiz', 'Tiếng Anh · 25 câu', 'Thứ Hai 16/11', 'n', '+25 XP', 'Bắt đầu')
        ] }
      ]
    };`);

const h02d = head("Học sinh · Bài quá hạn (mobile)", common) + `
<div class="phone">
${ptopBT}
  <div class="pbody" style="gap:12px">
    ${seg("late")}
    <div class="card row top g12" style="padding:14px 16px;background:var(--ert);border-color:#F6C9C3">
      <span class="ms f" style="color:var(--er)" aria-hidden="true">event_busy</span>
      <div class="f1 t-s" style="color:var(--erx)"><b>2 bài đã quá hạn.</b> Bài còn mở vẫn nộp muộn được và vẫn nhận XP hoàn thành, chỉ mất +10 XP nộp trước hạn.</div>
    </div>
    <sc-for list="{{rows}}" as="a" hint-placeholder-count="2">
      <div class="card col g10" style="padding:14px 16px;gap:10px">
        <div class="row top g12">
          <span class="ico sm {{a.tone}}"><span class="ms f s" aria-hidden="true">{{a.icon}}</span></span>
          <div class="f1 col g2" style="min-width:0"><span class="b6">{{a.title}}</span><span class="t-m">{{a.meta}}</span></div>
        </div>
        <div class="row g8 wrap"><span class="due er"><span class="ms xs" aria-hidden="true">history</span>{{a.over}}</span><span class="t-m {{a.openCls}} b6">{{a.open}}</span><span class="t-m">{{a.openSub}}</span></div>
        <div class="row sp">
          <span class="bd nd {{a.xpCls}}">{{a.xp}}</span>
          <sc-if value="{{a.canSubmit}}" hint-placeholder-val="{{true}}"><button type="button" class="btn o sm">Nộp muộn</button></sc-if>
          <sc-if value="{{a.closed}}" hint-placeholder-val="{{false}}"><button type="button" class="btn o sm"><span class="ms xs" aria-hidden="true">chat</span>Hỏi cô</button></sc-if>
        </div>
      </div>
    </sc-for>
    <p class="hint">Quá hạn không làm mất chuỗi ngày: chỉ cần mỗi ngày nộp ít nhất 1 bài bất kỳ.</p>
  </div>
${dock("Bài tập")}
</div>
` + tail(844, `    return {
      rows: [
        { icon: 'science', tone: 'n', title: 'KHTN: Nguyên tử và phân tử', meta: 'KHTN · 25 câu · thầy Lê Văn Nam', over: 'Quá 2 ngày', open: 'Còn mở', openCls: 'cok', openSub: 'đến 15/11 21:00', xp: '+30 XP', xpCls: 'in', canSubmit: true, closed: false },
        { icon: 'calculate', tone: '', title: 'Kiểm tra 15 phút: Phân số', meta: 'Toán · 10 câu · cô Trần Thị Hạnh', over: 'Quá 5 ngày', open: 'Đã đóng', openCls: 'cer', openSub: 'cô đã chốt điểm', xp: 'Không còn XP', xpCls: '', canSubmit: false, closed: true }
      ]
    };`);

// ---------- Hộp thư · chat ----------
const h12m = head("Học sinh · Hộp thư · hỏi cô (mobile)", common + `
.qref{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;border:1px solid var(--bd);background:#fff;font-size:13px}`) + `
<div class="phone">
  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại Hộp thư"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <span class="av" style="background:var(--okt);color:var(--okx)">TH</span>
    <div class="f1" style="min-width:0"><div class="b6 ell">Cô Trần Thị Hạnh</div><div class="t-m ell">Toán · thường trả lời buổi tối</div></div>
  </div>
  <div class="pbody" style="gap:12px">
    <div class="qref"><span class="ico sm"><span class="ms f s" aria-hidden="true">calculate</span></span><div class="f1" style="min-width:0"><div class="b6 ell">Phương trình bậc nhất · Câu 7</div><div class="t-m">Bạn chọn x = 9 · đáp án x = 4</div></div><span class="ms s c3" aria-hidden="true">chevron_right</span></div>
    <span class="day">Hôm qua</span>
    <div class="bub me">Cô ơi, câu 7 em chuyển 5 sang vế phải rồi cộng vào 13 nên ra 2x = 18. Em sai ở đâu ạ?</div>
    <span class="day">Hôm nay · 07:55</span>
    <div class="row top g8"><span class="av sm" style="background:var(--okt);color:var(--okx)">TH</span><div class="bub them">Em chuyển 5 sang vế phải thì phải <b>đổi dấu</b> thành −5 nhé: 2x = 13 − 5 = 8, nên x = 4.<br>Em thử làm lại câu 8 cùng dạng nhé.</div></div>
    <div class="row g8 wrap" style="padding-left:40px"><button type="button" class="chip"><span class="ms xs" aria-hidden="true">replay</span>Làm lại câu 8</button><button type="button" class="chip"><span class="ms xs" aria-hidden="true">thumb_up</span>Cảm ơn cô</button></div>
  </div>
  <div class="comp">
    <button type="button" class="ib ghost" aria-label="Đính kèm ảnh bài làm"><span class="ms" aria-hidden="true">add_photo_alternate</span></button>
    <div class="box">Hỏi tiếp cô…</div>
    <button type="button" class="ib" style="background:var(--p);color:#fff;border-color:var(--p)" aria-label="Gửi"><span class="ms s" aria-hidden="true">send</span></button>
  </div>
</div>
` + tail(844);

// ---------- Thảo luận ----------
const ptopTL = `  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <h1 class="t-h1 f1">Thảo luận 7A</h1>
    <button type="button" class="ib" aria-label="Tìm chủ đề"><span class="ms" aria-hidden="true">search</span></button>
  </div>`;

const h13m = head("Học sinh · Thảo luận lớp (mobile)", common + `
.pin{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--wnx)}
.fab{position:absolute;right:16px;bottom:92px;height:52px;padding:0 20px;border-radius:999px;box-shadow:var(--sh)}`) + `
<div class="phone" style="position:relative">
${ptopTL}
  <div class="pbody" style="gap:12px">
    <div class="chips"><button type="button" class="chip on">Mới nhất</button><button type="button" class="chip">Chưa có trả lời <span class="cnt">2</span></button><button type="button" class="chip">Của tôi</button></div>
    <div class="chips"><button type="button" class="chip on">Tất cả</button><button type="button" class="chip">Toán</button><button type="button" class="chip">Ngữ văn</button><button type="button" class="chip">Tiếng Anh</button></div>
    <sc-for list="{{topics}}" as="t" hint-placeholder-count="5">
      <div class="card row top g12" style="padding:14px 16px;{{t.bg}}">
        <span class="av sm" style="background:{{t.abg}};color:{{t.afg}}">{{t.ini}}</span>
        <div class="f1 col g4" style="min-width:0">
          <sc-if value="{{t.pinned}}" hint-placeholder-val="{{false}}"><span class="pin"><span class="ms f xs" aria-hidden="true">push_pin</span>Cô ghim</span></sc-if>
          <span class="b6" style="line-height:1.35">{{t.title}}</span>
          <div class="row g8 t-m"><span class="tag">{{t.subj}}</span><span class="ell">{{t.who}} · {{t.time}}</span></div>
          <div class="rx"><span><span class="ms xs" aria-hidden="true">chat_bubble</span>{{t.replies}}</span><span><span class="ms xs" aria-hidden="true">favorite</span>{{t.likes}}</span><sc-if value="{{t.solved}}" hint-placeholder-val="{{false}}"><span style="color:var(--ok)"><span class="ms f xs" aria-hidden="true">check_circle</span>Có lời giải</span></sc-if></div>
        </div>
      </div>
    </sc-for>
  </div>
  <button type="button" class="btn c fab"><span class="ms s" aria-hidden="true">add</span>Đặt câu hỏi</button>
${dock("")}
</div>
` + tail(844, `    const t = function (ini, abg, afg, title, subj, who, time, replies, likes, solved, pinned) {
      return { ini: ini, abg: abg, afg: afg, title: title, subj: subj, who: who, time: time, replies: replies, likes: likes, solved: solved, pinned: pinned, bg: pinned ? 'border-color:#F6DDA0;background:#FFFBEF' : '' };
    };
    return {
      topics: [
        t('TH', 'var(--okt)', 'var(--okx)', 'Lịch kiểm tra giữa kỳ I và phần cần ôn', 'Toán', 'Cô Hạnh', '08/11', 4, 21, false, true),
        t('MA', 'var(--p)', '#fff', 'Ôn tập chương 2: câu 4 làm theo cách nào nhanh nhất?', 'Toán', 'Minh Anh', 'hôm qua', 3, 8, true, false),
        t('TL', 'var(--nt)', 'var(--nx)', 'Phân biệt danh từ chung và danh từ riêng trong bài 3', 'Ngữ văn', 'Thảo Linh', 'hôm qua', 0, 2, false, false),
        t('QH', 'var(--nt)', 'var(--nx)', 'Unit 4: “interested in” hay “interested on”?', 'Tiếng Anh', 'Quang Hải', '10/11', 5, 6, true, false)
      ]
    };`);

const h13m2 = head("Học sinh · Thảo luận · chủ đề (mobile)", common + `
.post{display:flex;gap:10px}
.post .b2{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.reply{margin-left:18px;padding-left:12px;border-left:2px solid var(--dv);display:flex;flex-direction:column;gap:14px}
.best{border:1px solid #BFE3CC;background:var(--okt);border-radius:14px;padding:12px}`) + `
<div class="phone" style="height:1000px">
  <div class="ptop" style="gap:8px">
    <button type="button" class="ib ghost" aria-label="Quay lại danh sách"><span class="ms" aria-hidden="true">arrow_back</span></button>
    <div class="f1"><div class="b6">Chủ đề</div><div class="t-m">Toán · 3 trả lời</div></div>
    <button type="button" class="ib" aria-label="Theo dõi chủ đề"><span class="ms" aria-hidden="true">notifications</span></button>
  </div>
  <div class="pbody" style="gap:14px">
    <div class="post">
      <span class="av sm" style="background:var(--p);color:#fff">MA</span>
      <div class="b2">
        <div class="row g8 t-m"><span class="b6" style="color:var(--tx)">Minh Anh (bạn)</span><span>· hôm qua 20:12</span></div>
        <div class="b6" style="font-size:16px;line-height:1.4">Ôn tập chương 2: câu 4 làm theo cách nào nhanh nhất?</div>
        <div style="font-size:14px;line-height:1.55">Câu 4: <b>(x + 2)² − 3(x + 2) = 0</b>. Mình khai triển ra thì dài quá, có cách nào gọn hơn không?</div>
        <div class="rx"><span><span class="ms xs" aria-hidden="true">favorite</span>8</span><span><span class="ms xs" aria-hidden="true">chat_bubble</span>3</span></div>
      </div>
    </div>
    <div class="reply">
      <div class="best">
        <div class="post">
          <span class="av sm" style="background:#fff;color:var(--okx)">TH</span>
          <div class="b2">
            <div class="row g4 wrap"><span class="b6">Cô Hạnh</span><span class="tag" style="background:#fff;color:var(--okx)"><span class="ms f xs" aria-hidden="true">verified</span>&nbsp;Giáo viên</span></div>
            <div style="font-size:14px;line-height:1.55">Đặt t = x + 2 thì t² − 3t = 0 ⇒ t(t − 3) = 0. Vậy x = −2 hoặc x = 1.</div>
            <div class="rx"><span style="color:var(--er)"><span class="ms f xs" aria-hidden="true">favorite</span>12</span><span>Trả lời</span></div>
          </div>
        </div>
      </div>
      <div class="post">
        <span class="av sm" style="background:#F8E6DA;color:#7C3A12">GB</span>
        <div class="b2">
          <div class="row g8 t-m"><span class="b6" style="color:var(--tx)">Gia Bảo</span><span>· 21:03</span></div>
          <div style="font-size:14px;line-height:1.55">Đặt nhân tử chung luôn: (x + 2)(x + 2 − 3) = 0, nhanh hơn một bước.</div>
          <div class="rx"><span><span class="ms xs" aria-hidden="true">favorite</span>5</span><span>Trả lời</span></div>
        </div>
      </div>
      <div class="reply" style="margin-left:10px">
        <div class="post">
          <span class="av sm" style="background:var(--p);color:#fff">MA</span>
          <div class="b2">
            <div class="row g8 t-m"><span class="b6" style="color:var(--tx)">Minh Anh</span><span>· 07:40</span></div>
            <div style="font-size:14px;line-height:1.55">À hiểu rồi, cảm ơn Bảo và cô ạ!</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="comp">
    <span class="av sm" style="background:var(--p);color:#fff">MA</span>
    <div class="box">Viết trả lời…</div>
    <button type="button" class="ib" style="background:var(--p);color:#fff;border-color:var(--p)" aria-label="Gửi"><span class="ms s" aria-hidden="true">send</span></button>
  </div>
</div>
` + tail(1000);

const files = {
  "H03b-ThiDua.dc.html": h03b,
  "H02c-CanLam.dc.html": h02c,
  "H02d-QuaHan.dc.html": h02d,
  "H12m-HopThu-Chat.dc.html": h12m,
  "H13m-ThaoLuan.dc.html": h13m,
  "H13m2-ThaoLuan-ChuDe.dc.html": h13m2,
};
for (const [n, s] of Object.entries(files)) fs.writeFileSync(path.join(out, n), s);
console.log(Object.keys(files).join(" "));
