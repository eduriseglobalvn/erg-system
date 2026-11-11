# fable — kế hoạch rà soát và triển khai ERG (BE + FE)

Ngày lập: 10/11/2026, cập nhật 11/11/2026 (luật tài khoản học sinh, tài liệu 05–07, kiểm tra máy chủ production).

> **Chỉ deploy BE từ commit `b764c52` trở đi** (PR 16 đã gộp ngày 11/11/2026, `G1-17`, lỗi `BUG-02`): các commit `main` từ `a1ebab1` trở về `0cf9d24` khoá học sinh khỏi mọi API bài tập.
>
> **Làm trước tiên** (từ kiểm tra máy chủ): `G1-12` khoá đường SSH (đang cho đăng nhập bằng mật khẩu từ Internet) và `G1-11` sửa lỗi 500 khi học sinh mở gói đề bài. Xem `01-phat-hien.md` mục G. Bot Telegram không báo khi máy chết, khi deploy, khi hệ thống đứng: nguyên nhân và cách sửa ở mục H, task `G4-12` → `G4-15`. Người lập: Claude Fable 5.2 (vai senior engineer rà soát).
Thư mục này là **nguồn duy nhất** cho đợt việc này. Agent (Sonnet/Opus) làm việc theo đúng thứ tự trong `02-ke-hoach-thuc-thi.md`.

## Hai repo

| Repo | Đường dẫn | Nhánh lúc rà | Vai trò |
|---|---|---|---|
| FE | `F:\ERG\erg-system` | `fix/student-history-session` | React 19 + Vite 8 + MUI v9, PWA, Tauri |
| BE | `F:\ERG\erg-spring` | `feat/timekeeping` (HEAD `d8f80c4`) | Spring Boot 4.0.6, Java 25, Postgres 17, Redis 8.8 |

## Các file trong thư mục

| File | Nội dung | Đọc khi nào |
|---|---|---|
| `01-phat-hien.md` | Sổ phát hiện: mã, mức độ, bằng chứng `file:dòng`, tình huống lỗi, cách sửa | Trước khi sửa bất cứ mục nào |
| `02-ke-hoach-thuc-thi.md` | Danh sách task theo giai đoạn, có tiêu chí xong và lệnh kiểm tra | Luôn luôn — đây là backlog |
| `03-hieu-nang-2000ccu.md` | Mô hình tải 2000 CCU, ngân sách RAM/CPU cho i5-7500/16GB/SSD SATA 256GB, cấu hình Postgres/JVM/Redis/nginx, cổng k6 | Khi làm giai đoạn 2 và 4 |
| `04-dong-nhat-du-lieu.md` | Ma trận "số liệu → nguồn sự thật → màn hình", các chỗ đang lệch, quy trình soát màn hình còn lại | Khi làm giai đoạn 3 |
| `05-trien-khai-vps-nha.md` | Triển khai máy chủ tự dựng tại nhà (đích chính) | Giai đoạn 4 |
| `06-trien-khai-aws.md` | Triển khai AWS (phương án dự phòng / mở rộng) | Khi chủ dự án quyết định dùng |
| `07-trien-khai-salesforce.md` | Triển khai trên nền Salesforce (Heroku) — **đang là giả định**, xem mục "Câu hỏi mở" | Khi chủ dự án xác nhận |

## Luật cho agent thực thi

1. **Một task một lần.** Lấy task đầu tiên chưa tick trong `02-ke-hoach-thuc-thi.md`, đọc phát hiện tương ứng trong `01-phat-hien.md`, mở đúng file được trỏ tới, rồi mới sửa.
2. **Xác minh lại bằng chứng trước khi sửa.** Số dòng có thể đã trôi. Nếu code không còn như mô tả, ghi chú vào task và hỏi lại, không đoán.
3. **Mỗi task một nhánh + một PR.** Tên nhánh ghi sẵn trong task. Không gộp nhiều task vào một PR, trừ khi task ghi "làm chung với".
4. **Không commit** các thứ sau: FE `.claude/`, `chromewebdata_*.html`, `playwright-report/`, `progress.md`; BE `.openidea/`, `graft/`, file `.trail` scaffolding, `.env*` thật, `backups/`.
5. **Không đụng production.** Không nhập mật khẩu trên `lms.erg.edu.vn`. Không đọc/sửa `ops/docker/.env.production` thật (chỉ dùng file `.example`). Không chạy migration lên DB `erg` của người dùng; dùng DB thử riêng.
6. **Migration BE chỉ thêm, không sửa cái cũ** (`AGENTS.md` của erg-spring). Thay đổi contract đi theo `add → publish → sync → generate → migrate`.
7. **Tuân thủ `CLAUDE.md` (FE) và `AGENTS.md` (BE).** FE: import MUI theo path, dùng token, mỗi trang một nút `contained`, file LF. BE: tenant lấy từ security context, cache key có tenant, không log token/PII.
8. **Kiểm tra trước khi báo xong** (không chạy song song `tsc -b` và `vitest`):
   - FE: `bunx tsc -p tsconfig.app.json --noEmit` → `bunx eslint .` → `bun run verify` → test liên quan (`bunx vitest run <file>`).
   - BE: `./mvnw.cmd -q -Dtest=<TestClass> test` cho phần sửa, rồi `./mvnw.cmd verify` trước khi mở PR.
   - Chạy `trail check` trước commit/PR (cả hai repo dùng trail).
9. **Tick task** bằng cách đổi `- [ ]` thành `- [x]` trong `02-ke-hoach-thuc-thi.md` và thêm một dòng `Kết quả:` (PR, số đo trước/sau). Không sửa nội dung `01-phat-hien.md`; nếu phát hiện sai, thêm dòng `Đính chính:` ngay dưới mục đó.
10. **Trả lời người dùng bằng tiếng Việt.**

## Chọn model cho từng loại task

| Loại | Model | Lý do |
|---|---|---|
| Sửa cấu hình, header, `.gitattributes`, nâng phiên bản, xoá code chết | Sonnet | Việc rõ, phạm vi hẹp |
| Cache principal, gộp định nghĩa điểm trung bình, đổi cache eviction, giới hạn Argon2 | Opus | Đụng bảo mật/tính đúng dữ liệu, cần đọc rộng |
| Chạy k6, đọc số đo, chỉnh Postgres/JVM | Opus | Cần suy luận từ số liệu |
| Viết runbook triển khai, compose, script | Sonnet | Theo mẫu có sẵn trong `ops/docker` |

## Mức độ tin cậy của đợt rà này

Đã làm (có bằng chứng trong `01-phat-hien.md`):

- Đọc cấu hình bảo mật BE: `SecurityConfig`, `ErgAuthenticationFilter`, `ErgPrincipalService`, rate limit đăng nhập, CORS, upload media công khai, guard trusted-header.
- Đọc `application.yml`, `Dockerfile`, `ops/docker/*` (compose, nginx, redis), `deploy.sh`, `backup.sh`, file `.env.production.example`.
- Soát 66 controller BE: cái nào chỉ dựa vào luật "đã đăng nhập", cái nào gắn `@Profile("prototype")`.
- Tìm SQL nối chuỗi ở BE (không thấy chỗ nào đưa dữ liệu người dùng vào SQL).
- Truy vấn chỉ-đọc Postgres dev: cấu hình, index bảng nóng, khoá ngoại thiếu index, `pg_stat_statements`.
- FE: nơi lưu token, tìm `innerHTML`/`eval` (không có), cấu hình PWA, cache persist, header nginx/Vercel, Tauri CSP, `bun audit`, so endpoint FE với OpenAPI của BE, kiểm tra lock contract, tần suất lưu nháp bài làm.
- So các định nghĩa "điểm trung bình" giữa các màn hình.

**Chưa làm — agent không được coi là đã sạch:**

- Chưa chạy load test nào trong đợt này. Số 2000 CCU **chưa được chứng minh**; bằng chứng cũ trong repo cho thấy bản native rớt ngưỡng ở 500 VU (`load/results/20260729T190558Z/comparison.md`). Xem `03-hieu-nang-2000ccu.md`.
- Máy chủ production **đã được kiểm tra ngày 11/11/2026** qua SSH chỉ đọc (chủ dự án cho phép): hệ điều hành, Docker, tên biến và giá trị không bí mật của `.env.production`, cấu hình và thống kê Postgres/Redis, sao lưu, giám sát, log 25 giờ, và thử từ ngoài Internet. Kết quả: `01-phat-hien.md` mục G, `05-trien-khai-vps-nha.md` mục 10. **Chưa làm trên máy chủ:** không in giá trị bí mật nào; không thử rút điện, không thử khôi phục sao lưu, không chạy tải; chưa xem bảng điều khiển Cloudflare (Access, WAF, DNS) và Vercel; chưa đọc dữ liệu cá nhân của người dùng.
- Bản sao `.env.production` trong repo trên máy lập trình vẫn không được đọc; agent không đọc file này.
- Chưa soát từng dòng 1.158 file Java và 1.894 file FE. Đã đi sâu ở đường nóng: đăng nhập, phiên, học sinh làm bài, điểm, cache, triển khai.
- Chưa soát các module: CRM, CMS công khai (`erg`), timekeeping chi tiết nghiệp vụ, notification campaign, reporting worker, enterprise connectors, OIDC/BFF, Tauri Rust (`src-tauri/src`).
- Chưa chạy OWASP Dependency-Check cho BE (CI có job này, chưa xem kết quả).
- Chưa kiểm thử xâm nhập thực tế (IDOR từng endpoint, vượt tenant). Chỉ đọc code.

## Luật đã chốt (không được làm trái)

- **Tài khoản học sinh** (chốt 11/11/2026): không onboarding, không ép đổi mật khẩu, không ép xác thực email; chỉ vào cổng học sinh; đi nhầm cổng giáo viên/quản trị thì tự chuyển về cổng học sinh. Chi tiết và bằng chứng: `01-phat-hien.md` mục 0; task `G1-07` → `G1-10`.
- **Điểm của học sinh ở một bài** = điểm lần nộp mới nhất; bài luyện tập cũng phải nộp mới tính (chốt 10/11/2026, learning `.trail/learnings/2026-11-10-a-student-s-handed-in-work-vuong.md`).
- **Một tài khoản học sinh, một tab** trong cùng trình duyệt (`use-single-student-tab.ts`).
- **UI:** giữ MUI v9, không thêm shadcn/Tailwind (`CLAUDE.md`).

## Câu hỏi mở cho chủ dự án (không chặn giai đoạn 0–3)

0. **Xác nhận cách hiểu câu "phải gửi xác thực qua Mail":** kế hoạch hiểu là học sinh **không** bị bắt xác thực email (cùng nhóm với "không onboarding, không đổi mật khẩu"). Nếu ý là ngược lại (học sinh *phải* xác thực email) thì sửa STU-01 trước khi làm `G1-07`.

1. **"safeforce" nghĩa là gì?** Trong hai repo không có chữ Salesforce/Heroku nào. Tài liệu `07` giả định là **Heroku (nền PaaS của Salesforce)**. Nếu ý là *đồng bộ dữ liệu với Salesforce CRM* thì đó là một dự án tích hợp khác (module `enterpriseconnectors`), cần viết lại `07`.
2. **Nhánh nào là production?** Đã biết một phần sau khi kiểm tra máy chủ: BE production chạy image `erg-spring:9d2e6f7-jvm` (commit 10/11/2026, có trong `origin/main`); FE production chạy trên **Vercel**. Còn phải hỏi: Vercel build từ nhánh nào, và `feat/timekeeping` (đang chứa commit `wip` `8ebb5ee`) sẽ gộp về `main` khi nào.
3. **Nhánh FE `fix/student-history-session` merge vào đâu?** (câu hỏi còn treo từ phiên trước).
4. **2000 CCU là 2000 học sinh làm bài cùng lúc, hay 2000 người đang đăng nhập?** Kế hoạch tính theo trường hợp nặng hơn: 2000 học sinh cùng làm bài, cùng nộp trong 2 phút.
5. **Học sinh vào từ mạng trường (chung một IP) hay từ nhà?** Ảnh hưởng trực tiếp tới rate limit (phát hiện `OPS-01`).
