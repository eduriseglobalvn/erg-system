// Writes H12 (Hộp thư) and H13 (Thảo luận) web artboards with the compact sidebar.
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

const shared = `
.split{display:grid;grid-template-columns:380px minmax(0,1fr);gap:0;flex:1;min-height:0;overflow:hidden}
.pane{display:flex;flex-direction:column;min-width:0;min-height:0}
.pane+.pane{border-left:1px solid var(--dv)}
.ph2{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--dv)}
.mi{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-bottom:1px solid var(--dv);position:relative}
.mi.on{background:var(--pss);box-shadow:inset 3px 0 0 var(--p)}
.mi .ud{width:8px;height:8px;border-radius:50%;background:var(--p);flex-shrink:0;margin-top:7px}
.mi .tt{font-weight:600;font-size:14px}
.mi.read .tt{font-weight:500;color:var(--tx2)}
.kind{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
.bub{max-width:76%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5}
.bub.them{background:var(--bg2);border:1px solid var(--dv);border-top-left-radius:6px}
.bub.me{background:var(--p);color:#fff;border-top-right-radius:6px;margin-left:auto}
.qref{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;border:1px solid var(--bd);background:#fff;font-size:13px}
.comp{display:flex;gap:8px;align-items:flex-end;padding:12px 18px;border-top:1px solid var(--dv)}
.comp .box{flex:1;min-height:44px;border:1px solid var(--bd);border-radius:12px;padding:11px 14px;color:var(--tx3);font-size:14px;background:#fff}
.day{align-self:center;font-size:12px;font-weight:600;color:var(--tx3);padding:2px 10px;border-radius:999px;background:var(--bg2)}`;

// H12 · Hộp thư
const h12 = head("Học sinh · Hộp thư web", shared) + `
<div class="desk" style="min-height:1000px;align-items:stretch">
${sidebar("Hộp thư")}
  <main class="main" style="gap:18px">
    <div class="ph">
      <div class="col g4"><h1 class="t-h1" style="font-size:28px">Hộp thư</h1><p class="t-s" style="font-size:15px">Thông báo của lớp, trả lời của giáo viên và tin thi đua ở cùng một chỗ</p></div>
      <div class="row g8"><div class="inp" style="width:260px;height:40px"><span class="ms s c3" aria-hidden="true">search</span><span class="c3 f1">Tìm trong hộp thư</span></div><button type="button" class="btn c"><span class="ms s" aria-hidden="true">edit</span>Hỏi giáo viên</button></div>
    </div>

    <section class="card p0 split" style="height:820px" aria-label="Hộp thư">
      <div class="pane">
        <div class="ph2" style="flex-wrap:wrap;gap:6px">
          <button type="button" class="chip on">Tất cả <span class="cnt">2</span></button>
          <button type="button" class="chip">Hỏi giáo viên <span class="cnt">1</span></button>
          <button type="button" class="chip">Thông báo</button>
          <button type="button" class="chip">Thi đua</button>
        </div>
        <div class="row sp t-m" style="padding:10px 18px 6px"><span class="b6">Hôm nay</span><button type="button" class="link" style="font-size:12px">Đánh dấu đã đọc hết</button></div>
        <sc-for list="{{items}}" as="m" hint-placeholder-count="6">
          <div class="{{m.cls}}">
            <span class="ico sm {{m.tone}}"><span class="ms f s" aria-hidden="true">{{m.icon}}</span></span>
            <div class="f1 col g2" style="min-width:0">
              <div class="row sp"><span class="kind" style="color:{{m.kc}}">{{m.kind}}</span><span class="t-m tn">{{m.time}}</span></div>
              <span class="tt ell">{{m.title}}</span>
              <span class="t-m ell">{{m.text}}</span>
            </div>
            <sc-if value="{{m.unread}}" hint-placeholder-val="{{false}}"><span class="ud" aria-label="Chưa đọc"></span></sc-if>
          </div>
        </sc-for>
      </div>

      <div class="pane">
        <div class="ph2">
          <span class="av" style="background:var(--okt);color:var(--okx)">TH</span>
          <div class="f1"><div class="b6">Cô Trần Thị Hạnh</div><div class="t-m">Toán · Lớp 7A · thường trả lời trong buổi tối</div></div>
          <span class="bd ok nd"><span class="ms f xs" aria-hidden="true">check_circle</span>Đã trả lời</span>
          <button type="button" class="ib ghost" aria-label="Thêm"><span class="ms" aria-hidden="true">more_horiz</span></button>
        </div>
        <div class="col g12 f1" style="padding:18px;overflow:hidden">
          <div class="qref"><span class="ico sm"><span class="ms f s" aria-hidden="true">calculate</span></span><div class="f1"><div class="b6">Luyện tập: Phương trình bậc nhất · Câu 7</div><div class="t-m">2x + 5 = 13 · bạn chọn x = 9 · đáp án x = 4</div></div><button type="button" class="link">Mở câu hỏi</button></div>
          <span class="day">Hôm qua</span>
          <div class="row top g8"><span class="av sm" style="background:var(--p);color:#fff">MA</span><div class="bub me">Cô ơi, câu 7 em chuyển 5 sang vế phải rồi cộng vào 13 nên ra 2x = 18. Em sai ở đâu ạ?</div></div>
          <span class="day">Hôm nay · 07:55</span>
          <div class="row top g8"><span class="av sm" style="background:var(--okt);color:var(--okx)">TH</span><div class="bub them">Em chuyển 5 sang vế phải thì phải <b>đổi dấu</b> thành −5 nhé: 2x = 13 − 5 = 8, nên x = 4.<br>Em thử làm lại câu 8 cùng dạng, cô thấy em làm được rồi đó.</div></div>
          <div class="row g8" style="padding-left:40px"><span class="bd in nd"><span class="ms xs" aria-hidden="true">replay</span>Làm lại câu 8</span><span class="bd nd"><span class="ms xs" aria-hidden="true">thumb_up</span>Cảm ơn cô</span></div>
        </div>
        <div class="comp">
          <button type="button" class="ib ghost" aria-label="Đính kèm ảnh bài làm"><span class="ms" aria-hidden="true">add_photo_alternate</span></button>
          <div class="box">Viết câu hỏi tiếp cho cô…</div>
          <button type="button" class="btn o" aria-label="Gửi"><span class="ms s" aria-hidden="true">send</span>Gửi</button>
        </div>
      </div>
    </section>
  </main>
</div>
` + tail(1440, 1000, `    const it = function (icon, tone, kind, kc, time, title, text, unread, on) {
      return { icon: icon, tone: tone, kind: kind, kc: kc, time: time, title: title, text: text, unread: unread, cls: 'mi' + (on ? ' on' : '') + (unread ? '' : ' read') };
    };
    return {
      items: [
        it('chat', 'ok', 'Hỏi giáo viên', 'var(--okx)', '07:55', 'Cô Hạnh đã trả lời câu 7', 'Em chuyển 5 sang vế phải thì phải đổi dấu…', true, true),
        it('assignment', '', 'Thông báo lớp 7A', 'var(--inx)', '07:00', 'Bài mới: Kiểm tra 15 phút Đơn thức', 'Cô Hạnh · hạn 20:00 hôm nay · +40 XP', true, false),
        it('forum', '', 'Thảo luận lớp', 'var(--inx)', 'Hôm qua', 'Gia Bảo trả lời bạn trong “Ôn tập chương 2”', 'Mình làm câu 4 theo cách đặt ẩn phụ…', false, false),
        it('emoji_events', 'wn', 'Thi đua', 'var(--wnx)', 'Hôm qua', 'Bạn lên hạng #4 lớp 7A', 'Còn 40 XP nữa là vào top 3 tuần này', false, false),
        it('campaign', 'wn', 'Trung tâm', 'var(--wnx)', '05/11', 'Nghỉ học thứ Sáu 20/11', 'Chào mừng Ngày Nhà giáo Việt Nam', false, false),
        it('workspace_premium', 'wn', 'Huy hiệu', 'var(--wnx)', '02/11', 'Bạn nhận huy hiệu “Bền bỉ”', 'Giữ chuỗi 7 ngày liên tiếp', false, false)
      ]
    };`);

// H13 · Thảo luận
const h13css = `
.tp{display:flex;gap:12px;padding:14px 18px;border-bottom:1px solid var(--dv)}
.tp.on{background:var(--pss);box-shadow:inset 3px 0 0 var(--p)}
.pin{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--wnx)}
.post{display:flex;gap:12px}
.post .bd2{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.rx{display:flex;gap:14px;align-items:center;font-size:12px;font-weight:600;color:var(--tx3)}
.rx span{display:inline-flex;align-items:center;gap:4px}
.reply{margin-left:52px;padding-left:16px;border-left:2px solid var(--dv);display:flex;flex-direction:column;gap:14px}
.tag{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:700}
.best{border:1px solid #BFE3CC;background:var(--okt);border-radius:14px;padding:12px 14px}`;

const h13 = head("Học sinh · Thảo luận lớp web", shared + h13css) + `
<div class="desk" style="min-height:1000px;align-items:stretch">
${sidebar("Thảo luận")}
  <main class="main" style="gap:18px">
    <div class="ph">
      <div class="col g4"><h1 class="t-h1" style="font-size:28px">Thảo luận lớp 7A</h1><p class="t-s" style="font-size:15px">Hỏi bạn, giúp bạn. Giáo viên xem và duyệt mọi bài viết.</p></div>
      <div class="row g8"><div class="inp" style="width:240px;height:40px"><span class="ms s c3" aria-hidden="true">search</span><span class="c3 f1">Tìm chủ đề</span></div><button type="button" class="btn c"><span class="ms s" aria-hidden="true">add</span>Đặt câu hỏi</button></div>
    </div>

    <section class="card p0 split" style="height:820px;grid-template-columns:400px minmax(0,1fr)" aria-label="Thảo luận">
      <div class="pane">
        <div class="ph2" style="flex-wrap:wrap;gap:6px">
          <button type="button" class="chip on">Mới nhất</button>
          <button type="button" class="chip">Chưa có trả lời <span class="cnt">2</span></button>
          <button type="button" class="chip">Của tôi</button>
        </div>
        <div class="ph2" style="gap:6px;padding:10px 18px"><button type="button" class="chip on">Tất cả</button><button type="button" class="chip">Toán</button><button type="button" class="chip">Ngữ văn</button><button type="button" class="chip">Tiếng Anh</button></div>
        <sc-for list="{{topics}}" as="t" hint-placeholder-count="6">
          <div class="{{t.cls}}">
            <span class="av sm" style="background:{{t.bg}};color:{{t.fg}}">{{t.ini}}</span>
            <div class="f1 col g4" style="min-width:0">
              <sc-if value="{{t.pinned}}" hint-placeholder-val="{{false}}"><span class="pin"><span class="ms f xs" aria-hidden="true">push_pin</span>Cô ghim</span></sc-if>
              <span class="b6" style="font-size:14px;line-height:1.35">{{t.title}}</span>
              <div class="row g8 t-m"><span class="tag" style="background:var(--int);color:var(--inx)">{{t.subj}}</span><span>{{t.who}} · {{t.time}}</span></div>
              <div class="rx"><span><span class="ms xs" aria-hidden="true">chat_bubble</span>{{t.replies}}</span><span><span class="ms xs" aria-hidden="true">favorite</span>{{t.likes}}</span><sc-if value="{{t.solved}}" hint-placeholder-val="{{false}}"><span style="color:var(--ok)"><span class="ms f xs" aria-hidden="true">check_circle</span>Đã có lời giải</span></sc-if></div>
            </div>
          </div>
        </sc-for>
      </div>

      <div class="pane">
        <div class="ph2"><span class="tag" style="background:var(--int);color:var(--inx)">Toán</span><span class="b6 f1 ell">Ôn tập chương 2: câu 4 làm theo cách nào nhanh nhất?</span><button type="button" class="btn t sm"><span class="ms xs" aria-hidden="true">notifications</span>Theo dõi</button></div>
        <div class="col g16 f1" style="padding:18px 22px;overflow:hidden">
          <div class="post">
            <span class="av" style="background:var(--p);color:#fff">MA</span>
            <div class="bd2">
              <div class="row g8"><span class="b6">Minh Anh</span><span class="pill" style="height:18px;font-size:10px;padding:0 6px;border-radius:999px;background:var(--p);color:#fff;display:inline-flex;align-items:center;font-weight:700">Bạn</span><span class="t-m">· hôm qua 20:12</span></div>
              <div style="font-size:15px;line-height:1.55">Câu 4 trong đề ôn: <b>(x + 2)² − 3(x + 2) = 0</b>. Mình khai triển ra thì dài quá, có cách nào gọn hơn không mọi người?</div>
              <div class="rx"><span><span class="ms xs" aria-hidden="true">favorite</span>8</span><span><span class="ms xs" aria-hidden="true">chat_bubble</span>3 trả lời</span></div>
            </div>
          </div>

          <div class="reply">
            <div class="best">
              <div class="post">
                <span class="av sm" style="background:var(--okt);color:var(--okx)">TH</span>
                <div class="bd2">
                  <div class="row g8"><span class="b6">Cô Trần Thị Hạnh</span><span class="tag" style="background:#fff;color:var(--okx)"><span class="ms f xs" aria-hidden="true">verified</span>&nbsp;Giáo viên chọn là lời giải hay</span></div>
                  <div style="font-size:14px;line-height:1.55">Đặt t = x + 2 thì thành t² − 3t = 0 ⇒ t(t − 3) = 0. Vậy x + 2 = 0 hoặc x + 2 = 3, tức x = −2 hoặc x = 1.</div>
                  <div class="rx"><span style="color:var(--er)"><span class="ms f xs" aria-hidden="true">favorite</span>12</span><span>Trả lời</span></div>
                </div>
              </div>
            </div>
            <div class="post">
              <span class="av sm" style="background:#F8E6DA;color:#7C3A12">GB</span>
              <div class="bd2">
                <div class="row g8"><span class="b6">Gia Bảo</span><span class="t-m">· hôm qua 21:03</span></div>
                <div style="font-size:14px;line-height:1.55">Mình cũng đặt ẩn phụ, nhưng mình đặt nhân tử chung (x + 2) luôn: (x + 2)(x + 2 − 3) = 0, nhanh hơn một bước.</div>
                <div class="rx"><span><span class="ms xs" aria-hidden="true">favorite</span>5</span><span>Trả lời</span></div>
              </div>
            </div>
            <div class="reply" style="margin-left:40px">
              <div class="post">
                <span class="av sm" style="background:var(--p);color:#fff">MA</span>
                <div class="bd2">
                  <div class="row g8"><span class="b6">Minh Anh</span><span class="t-m">· 07:40</span></div>
                  <div style="font-size:14px;line-height:1.55">À hiểu rồi, cảm ơn Bảo và cô ạ!</div>
                  <div class="rx"><span><span class="ms xs" aria-hidden="true">favorite</span>2</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="comp">
          <span class="av sm" style="background:var(--p);color:#fff">MA</span>
          <div class="box">Viết trả lời… (lịch sự, đúng chủ đề)</div>
          <button type="button" class="btn o"><span class="ms s" aria-hidden="true">send</span>Gửi</button>
        </div>
      </div>
    </section>
  </main>
</div>
` + tail(1440, 1000, `    const t = function (ini, bg, fg, title, subj, who, time, replies, likes, solved, pinned, on) {
      return { ini: ini, bg: bg, fg: fg, title: title, subj: subj, who: who, time: time, replies: replies, likes: likes, solved: solved, pinned: pinned, cls: 'tp' + (on ? ' on' : '') };
    };
    return {
      topics: [
        t('TH', 'var(--okt)', 'var(--okx)', 'Lịch kiểm tra giữa kỳ I và phần cần ôn', 'Toán', 'Cô Hạnh', '08/11', 4, 21, false, true, false),
        t('MA', 'var(--p)', '#fff', 'Ôn tập chương 2: câu 4 làm theo cách nào nhanh nhất?', 'Toán', 'Minh Anh', 'hôm qua', 3, 8, true, false, true),
        t('TL', 'var(--nt)', 'var(--nx)', 'Phân biệt danh từ chung và danh từ riêng trong bài 3', 'Ngữ văn', 'Thảo Linh', 'hôm qua', 0, 2, false, false, false),
        t('QH', 'var(--nt)', 'var(--nx)', 'Unit 4: “interested in” hay “interested on”?', 'Tiếng Anh', 'Quang Hải', '10/11', 5, 6, true, false, false),
        t('NV', 'var(--nt)', 'var(--nx)', 'Câu 9 bài KHTN nguyên tử có đáp án không ạ?', 'KHTN', 'Ngọc Vy', '09/11', 0, 1, false, false, false)
      ]
    };`);

fs.writeFileSync(path.join(out, "H12-HopThu-Web.dc.html"), h12);
fs.writeFileSync(path.join(out, "H13-ThaoLuan-Web.dc.html"), h13);
console.log("written");
