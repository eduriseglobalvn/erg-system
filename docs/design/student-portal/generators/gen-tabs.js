// Writes H10 (Cần làm) and H11 (Quá hạn) web artboards with the compact sidebar.
const fs = require("fs");
const path = require("path");
const { css, sidebar } = require("./sidebar");
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
body{margin:0}${css}${extraCss}
</style>
</helmet>`;

const tail = (w, h, script) => `</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() {
${script}
  }
}
</script>
</body>
</html>
`;

const pageHead = (on) => `    <div class="ph">
      <div class="col g4"><h1 class="t-h1" style="font-size:28px">Bài tập</h1><p class="t-s" style="font-size:15px">Thứ Năm, 12/11 · 4 bài cần làm · làm xong nhận tới +145 XP</p></div>
      <div class="inp" style="width:280px;height:40px"><span class="ms s c3" aria-hidden="true">search</span><span class="c3 f1">Tìm bài tập</span><span class="bd nd sq">Ctrl K</span></div>
    </div>
    <div class="row sp wrap g12">
      <div class="seg" style="width:480px"><button type="button"${on === "todo" ? ' class="on"' : ""}>Cần làm <span class="cnt">4</span></button><button type="button"${on === "done" ? ' class="on"' : ""}>Đã nộp <span class="cnt">5</span></button><button type="button"${on === "late" ? ' class="on"' : ""}>Quá hạn <span class="cnt er">2</span></button></div>
      <div class="chips"><button type="button" class="chip on">Tất cả</button><button type="button" class="chip">Toán</button><button type="button" class="chip">Ngữ văn</button><button type="button" class="chip">Tiếng Anh</button><button type="button" class="chip">KHTN</button></div>
    </div>`;

const rowCss = `
.ar{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(0,1.1fr) minmax(0,1.2fr) 84px 120px;align-items:center;gap:16px;padding:14px 20px;border-top:1px solid var(--dv)}
.ar:first-of-type{border-top:0}
.grp{display:flex;align-items:center;justify-content:space-between;padding:12px 20px 8px;background:var(--bg2);border-top:1px solid var(--dv);border-bottom:1px solid var(--dv)}
.due{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.due.wn{background:var(--wnt);color:var(--wnx)}.due.n{background:var(--nt);color:var(--tx2)}.due.er{background:var(--ert);color:var(--erx)}
.cont{background:var(--p);border-color:var(--p);color:#fff}
.cont .bar{background:rgba(255,255,255,.25)}.cont .bar>i{background:#fff}`;

// H10 · Cần làm
const h10 = head("Học sinh · Bài tập cần làm web", rowCss) + `
<div class="desk" style="min-height:1000px;align-items:stretch">
${sidebar("Bài tập")}
  <main class="main" style="gap:18px">
${pageHead("todo")}
    <section class="card p24 row wrap g24 cont" aria-labelledby="cont">
      <div class="col g8" style="flex:1 1 420px;min-width:0">
        <span class="row g4" style="font-size:12px;font-weight:600;opacity:.9"><span class="ms s" aria-hidden="true">play_circle</span>ĐANG LÀM DỞ · TOÁN</span>
        <h2 id="cont" style="margin:0;font-size:22px;font-weight:600;line-height:1.3">Luyện tập: Phương trình bậc nhất một ẩn</h2>
        <div style="font-size:14px;opacity:.88">Đã làm 12/20 câu · còn khoảng 6 phút · hạn 20:00 hôm nay · cô Trần Thị Hạnh</div>
        <div class="bar" style="max-width:460px"><i style="width:60%"></i></div>
      </div>
      <div class="col g8" style="align-items:flex-end;justify-content:center">
        <span class="bd nd" style="background:rgba(255,255,255,.18);color:#fff"><span class="ms f xs" aria-hidden="true">bolt</span>+50 XP nếu nộp trước 20:00</span>
        <button type="button" class="btn lg" style="background:#fff;color:var(--p);padding:0 32px">Làm tiếp</button>
      </div>
    </section>

    <section class="card p0" aria-label="Bài cần làm">
      <div class="ar" style="padding:10px 20px;background:var(--bg2);border-bottom:1px solid var(--bd)"><span class="t-m b6">Bài</span><span class="t-m b6">Hạn nộp</span><span class="t-m b6">Trạng thái</span><span class="t-m b6">Thưởng</span><span></span></div>
      <sc-for list="{{groups}}" as="g" hint-placeholder-count="2">
        <div class="grp"><span class="t-ov">{{g.name}}</span><span class="t-m">{{g.sum}}</span></div>
        <sc-for list="{{g.items}}" as="a" hint-placeholder-count="2">
          <div class="ar">
            <div class="row g12" style="min-width:0"><span class="ico sm {{a.tone}}"><span class="ms f s" aria-hidden="true">{{a.icon}}</span></span><div style="min-width:0"><div class="b6 ell">{{a.title}}</div><div class="t-m ell">{{a.meta}}</div></div></div>
            <div class="col g2"><span class="due {{a.dueTone}}"><span class="ms xs" aria-hidden="true">schedule</span>{{a.left}}</span><span class="t-m">{{a.due}}</span></div>
            <div class="col g4"><span class="t-s">{{a.state}}</span><div class="bar sm"><i style="width:{{a.pct}}"></i></div></div>
            <span class="bd in nd">{{a.xp}}</span>
            <button type="button" class="btn o sm" style="justify-self:end">{{a.cta}}</button>
          </div>
        </sc-for>
      </sc-for>
    </section>
    <p class="hint">Nộp trước hạn được thêm +10 XP. Bài kiểm tra chỉ làm 1 lần; bài luyện tập làm lại được nhưng chỉ tính XP lần nộp đầu.</p>
  </main>
</div>
` + tail(1440, 1000, `    const a = function (icon, tone, title, meta, left, dueTone, due, state, pct, xp, cta) { return { icon: icon, tone: tone, title: title, meta: meta, left: left, dueTone: dueTone, due: due, state: state, pct: pct, xp: xp, cta: cta }; };
    return {
      groups: [
        { name: 'Hôm nay', sum: '2 bài · +90 XP', items: [
          a('calculate', '', 'Luyện tập: Phương trình bậc nhất một ẩn', 'Toán · 20 câu · khoảng 15 phút', 'Còn 4 giờ', 'wn', '20:00 hôm nay', 'Đang làm 12/20', '60%', '+50 XP', 'Làm tiếp'),
          a('quiz', '', 'Kiểm tra 15 phút: Đơn thức', 'Toán · 10 câu · 15 phút · làm 1 lần', 'Còn 4 giờ', 'wn', '20:00 hôm nay', 'Chưa làm', '0%', '+40 XP', 'Bắt đầu')
        ] },
        { name: 'Tuần này', sum: '2 bài · +55 XP', items: [
          a('menu_book', 'wn', 'Trắc nghiệm: Từ loại tiếng Việt', 'Ngữ văn · 10 câu trắc nghiệm', 'Còn 1 ngày', 'n', '21:00 ngày mai', 'Chưa làm', '0%', '+30 XP', 'Bắt đầu'),
          a('translate', 'ok', 'Unit 4 · Vocabulary quiz', 'Tiếng Anh · 25 câu · khoảng 10 phút', 'Còn 4 ngày', 'n', 'Thứ Hai 16/11', 'Chưa làm', '0%', '+25 XP', 'Bắt đầu')
        ] }
      ]
    };`);

// H11 · Quá hạn
const h11 = head("Học sinh · Bài quá hạn web", rowCss) + `
<div class="desk" style="min-height:900px;align-items:stretch">
${sidebar("Bài tập")}
  <main class="main" style="gap:18px">
${pageHead("late")}
    <section class="card row g16" style="background:var(--ert);border-color:#F6C9C3" aria-labelledby="late-note">
      <span class="ico er"><span class="ms f" aria-hidden="true">event_busy</span></span>
      <div class="f1"><h2 class="t-h3" id="late-note" style="color:var(--erx)">2 bài đã quá hạn</h2><div class="t-s" style="color:var(--erx)">Bài còn mở thì vẫn nộp muộn được và vẫn nhận XP hoàn thành, chỉ mất +10 XP nộp trước hạn. Bài đã đóng thì hỏi giáo viên.</div></div>
    </section>

    <section class="card p0" aria-label="Bài quá hạn">
      <div class="ar" style="padding:10px 20px;background:var(--bg2);border-bottom:1px solid var(--bd)"><span class="t-m b6">Bài</span><span class="t-m b6">Hạn nộp</span><span class="t-m b6">Nộp muộn</span><span class="t-m b6">Thưởng</span><span></span></div>
      <sc-for list="{{rows}}" as="a" hint-placeholder-count="2">
        <div class="ar">
          <div class="row g12" style="min-width:0"><span class="ico sm {{a.tone}}"><span class="ms f s" aria-hidden="true">{{a.icon}}</span></span><div style="min-width:0"><div class="b6 ell">{{a.title}}</div><div class="t-m ell">{{a.meta}}</div></div></div>
          <div class="col g2"><span class="due er"><span class="ms xs" aria-hidden="true">history</span>{{a.over}}</span><span class="t-m">{{a.due}}</span></div>
          <div class="col g2"><span class="t-s {{a.openCls}}">{{a.open}}</span><span class="t-m">{{a.openSub}}</span></div>
          <span class="bd nd {{a.xpCls}}">{{a.xp}}</span>
          <div class="row g4" style="justify-content:flex-end">
            <sc-if value="{{a.canSubmit}}" hint-placeholder-val="{{true}}"><button type="button" class="btn o sm">Nộp muộn</button></sc-if>
            <sc-if value="{{a.closed}}" hint-placeholder-val="{{false}}"><button type="button" class="btn o sm"><span class="ms xs" aria-hidden="true">chat</span>Hỏi cô</button></sc-if>
          </div>
        </div>
      </sc-for>
    </section>
    <p class="hint">Quá hạn không làm mất chuỗi ngày: chuỗi chỉ cần mỗi ngày nộp ít nhất 1 bài bất kỳ.</p>
  </main>
</div>
` + tail(1440, 900, `    return {
      rows: [
        { icon: 'science', tone: 'n', title: 'KHTN: Nguyên tử và phân tử', meta: 'KHTN · 25 câu · thầy Lê Văn Nam', over: 'Quá 2 ngày', due: '10/11 21:00', open: 'Còn mở', openCls: 'cok', openSub: 'đến 15/11 21:00', xp: '+30 XP', xpCls: 'in', canSubmit: true, closed: false },
        { icon: 'calculate', tone: '', title: 'Kiểm tra 15 phút: Phân số', meta: 'Toán · 10 câu · cô Trần Thị Hạnh', over: 'Quá 5 ngày', due: '07/11 08:00', open: 'Đã đóng', openCls: 'cer', openSub: 'giáo viên đã chốt điểm', xp: 'Không còn XP', xpCls: '', canSubmit: false, closed: true }
      ]
    };`);

fs.writeFileSync(path.join(out, "H10-CanLam-Web.dc.html"), h10);
fs.writeFileSync(path.join(out, "H11-QuaHan-Web.dc.html"), h11);
console.log("written");
