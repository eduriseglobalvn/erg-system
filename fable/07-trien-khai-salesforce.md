# 07 — "Salesforce": hai cách hiểu, chưa cách nào được xác nhận

> **Dừng lại trước khi làm.** Chủ dự án viết "safeforce". Trong mã nguồn và cấu hình của hai repo không có dòng nào nhắc Salesforce hay Heroku (đã tìm `salesforce`, `heroku`, `sfdc` bằng `git grep`, và file `Procfile`, `heroku.yml`; chỗ khớp duy nhất là tên gói phụ thuộc trong `bun.lock` của FE). Tài liệu này nêu hai cách hiểu, đánh giá từng cách, và việc cần làm khi được xác nhận. **Không agent nào được bắt đầu task `G4-09` khi câu hỏi mở số 1 trong `README.md` chưa có câu trả lời.**

| Cách hiểu | Nghĩa | Đánh giá ngắn |
|---|---|---|
| **A. Chạy hệ thống trên Heroku** (nền PaaS của Salesforce) | BE + FE + Postgres + Redis chạy trên Heroku thay cho máy nhà/AWS | Làm được, nhưng **không khuyến nghị** cho hệ thống này (mục 1.6) |
| **B. Nối dữ liệu với Salesforce CRM** | ERG vẫn chạy ở máy nhà/AWS; đồng bộ học viên/phụ huynh/lead với Salesforce | Là một dự án tích hợp riêng, cần đặc tả nghiệp vụ trước (mục 2) |

Mọi chi tiết về gói, giá, phiên bản, region của Heroku dưới đây viết theo hiểu biết chung, **chưa đối chiếu tài liệu Heroku hiện hành** — đánh dấu CẦN XÁC MINH, phải kiểm tra lại trên trang Heroku trước khi quyết định.

## 1. Cách hiểu A — triển khai trên Heroku

### 1.1 Ánh xạ thành phần

| Hiện tại (compose) | Trên Heroku | Điểm vướng |
|---|---|---|
| `backend` (JVM, cổng 1606) | Dyno `web`, deploy bằng container (`heroku.yml` + `Dockerfile` sẵn có) | Phải nghe cổng `$PORT` do Heroku cấp: `SERVER_PORT=$PORT`. Dyno 1 GB không đủ cho heap hiện tại (ngân sách `03`: 3 GB/replica) → cần loại dyno lớn (nhóm Performance). CẦN XÁC MINH dung lượng từng loại. |
| nginx (rate limit, `client_max_body_size`, header) | **Không có.** Router của Heroku đứng trước dyno. | Mất toàn bộ rate limit ở nginx (`native.conf`). Phải dựa vào Cloudflare + giới hạn trong ứng dụng (`AuthLoginRateLimiter`). Router cắt request quá 30 giây. |
| Postgres 17 | Heroku Postgres | (1) Không có superuser: kiểm tra từng migration Flyway có `CREATE EXTENSION`/`ALTER SYSTEM`/`CREATE ROLE` không. (2) Mô hình hai role (role Flyway chủ bảng + role runtime `erg_app` chịu RLS) phải dựng lại bằng tính năng credentials của Heroku Postgres — CẦN XÁC MINH là tạo được role không có `BYPASSRLS` và không phải chủ bảng; nếu không, `RuntimeDatabaseRoleGuard` chặn khởi động và RLS mất tác dụng. (3) Không chỉnh được `shared_buffers`, `random_page_cost`… — các tối ưu ở `03` mục 4 không áp dụng; hiệu năng phụ thuộc gói. (4) Giới hạn số kết nối theo gói. |
| `redis-state` + `redis-cache` (8.8, hai chính sách eviction khác nhau) | Hai add-on Heroku Key-Value Store riêng | Bắt buộc TLS (`rediss://`), chứng chỉ có thể tự ký → cấu hình Lettuce. Phiên bản 8.8 có thể chưa có. Xác nhận đặt được `noeviction` cho state. |
| Flyway khi khởi động | `release` phase trong `heroku.yml` | Tách migration khỏi khởi động dyno; migration lỗi thì bản phát hành không lên. |
| `backup.sh` + R2 | Sao lưu của Heroku Postgres (PG Backups / continuous protection theo gói) | Vẫn nên giữ một bản dump mã hoá ở R2: không để mọi bản sao lưu trong cùng một nhà cung cấp. |
| Prometheus/Loki/Grafana | Không chạy được dạng sidecar | Dùng log drain + add-on giám sát, hoặc đẩy metric ra ngoài. Dashboard và cảnh báo ở `05` mục 7 phải dựng lại. |
| Media, ảnh chấm công | Giữ R2 | Hệ thống file của dyno mất sau mỗi lần khởi động lại — không lưu gì cục bộ. Xác nhận BE không ghi file tạm cần giữ. |
| FE (nginx container hoặc Vercel) | Giữ Vercel / Cloudflare Pages | Buildpack tĩnh của Heroku đã ngừng phát triển; chạy nginx trong dyno chỉ để phát file tĩnh là tốn tiền vô ích. |

### 1.2 Bảo mật đặc thù Heroku

- **Origin lộ ra Internet.** App có địa chỉ `*.herokuapp.com` gọi được trực tiếp, bỏ qua Cloudflare. Hệ quả: kẻ tấn công tự đặt `CF-Connecting-IP`/`X-Forwarded-For` để né rate limit theo IP và làm sai log kiểm toán. Cách xử lý: Cloudflare thêm một header bí mật vào mọi request (Transform Rule), BE từ chối request thiếu header đó (một filter mới, đứng trước `ErgAuthenticationFilter`); đồng thời không tin `CF-Connecting-IP` khi thiếu header bí mật. Đây là **code mới** phải viết và test.
- `HTTP__TRUSTED_PROXY_CIDRS`: IP router Heroku không cố định → không cấu hình theo CIDR được như ở máy nhà. Phải dựa vào header bí mật ở trên.
- Bí mật: Config Vars (mã hoá khi lưu). Ai có quyền collaborator đều đọc được → giới hạn người có quyền, bật MFA.
- Dyno khởi động lại mỗi ngày: BE phải tắt êm (drain request đang chạy) — kiểm tra `server.shutdown=graceful` và thời gian chờ ≤ 30 giây.

### 1.3 Độ trễ

Heroku dạng thường (Common Runtime) chỉ có region Mỹ và châu Âu → mỗi request từ Việt Nam thêm khoảng 200–300 ms khứ hồi. Ngưỡng ở `03` mục 2 (đọc p95 < 300 ms) **không đạt được** từ đó. Region châu Á chỉ có ở gói Private Spaces (hợp đồng doanh nghiệp) — CẦN XÁC MINH danh sách region và giá.

### 1.4 Chi phí

Chưa tính. Một dyno đủ RAM cho JVM này + Postgres gói production + hai Redis thường đắt hơn rõ rệt so với phương án A của AWS (`06` mục 1) cho cùng tài nguyên. Phải lập bảng giá thật trước khi quyết định.

### 1.5 Việc cần làm nếu chủ dự án chọn A

1. Trả lời: có hợp đồng Salesforce/Heroku sẵn không, có Private Spaces không.
2. Thử nghiệm kỹ thuật 2–3 ngày trên một app Heroku thử với **dữ liệu giả**: (a) image hiện tại khởi động với `$PORT`; (b) toàn bộ migration Flyway chạy được trên Heroku Postgres; (c) tạo được role runtime chịu RLS, `RuntimeDatabaseRoleGuard` qua; (d) Redis TLS; (e) đo độ trễ từ Việt Nam.
3. Nếu (b) hoặc (c) thất bại → dừng, báo lại. Không nới RLS để chạy cho được.
4. Viết filter header bí mật (mục 1.2) + test.
5. Dựng lại giám sát và sao lưu ngoài nhà cung cấp.
6. Chạy lại k6 (`03` mục 7) trên Heroku. Số đo của máy nhà không chuyển sang được.

### 1.6 Khuyến nghị

Không dùng Heroku cho hệ thống này, trừ khi tổ chức đã có hợp đồng Private Spaces ở châu Á. Lý do, theo thứ tự nặng nhẹ: (1) độ trễ từ Việt Nam với gói thường; (2) mô hình role Postgres + RLS của BE chưa chắc dựng lại được; (3) mất lớp nginx và toàn bộ tinh chỉnh Postgres đã lên kế hoạch; (4) chi phí. Nếu mục đích là "không phải trông máy" thì AWS phương án A hoặc B (`06`) đạt được với ít thay đổi hơn.

## 2. Cách hiểu B — tích hợp với Salesforce CRM

Đây là **tính năng mới**, không phải triển khai. Chưa có yêu cầu nghiệp vụ nên chỉ nêu khung; phải có đặc tả trước khi lập task.

Câu hỏi nghiệp vụ phải trả lời trước:

1. Đồng bộ **cái gì**: lead tuyển sinh, học viên, phụ huynh, lớp, học phí, kết quả học tập?
2. **Chiều nào**: Salesforce → ERG (lead thành học viên), ERG → Salesforce (báo cáo cho bộ phận tư vấn), hay hai chiều? Hai chiều thì bên nào là nguồn sự thật cho từng trường?
3. Tần suất: gần thời gian thực hay theo lô mỗi đêm?
4. Ai ở ERG đang dùng Salesforce, bản nào (có quyền API không)?

Khung kỹ thuật (theo cấu trúc sẵn có của BE):

| Mảng | Hướng |
|---|---|
| Vị trí code | Module `enterpriseconnectors` của BE (chưa được rà trong đợt này — xem `README.md` phần "Chưa làm"). Đọc module này trước khi thiết kế. |
| Xác thực | Connected App của Salesforce, luồng OAuth 2.0 JWT Bearer (server-to-server, không lưu mật khẩu người dùng). Khoá riêng nằm trong `.env.production`/Secrets Manager, xoay vòng được. |
| ERG → Salesforce | Mẫu outbox: ghi sự kiện trong cùng transaction với thay đổi nghiệp vụ, worker đẩy đi, có khoá idempotent (External ID trên object Salesforce), thử lại có giãn cách, hàng chờ lỗi. Không gọi Salesforce trong luồng request của người dùng. |
| Salesforce → ERG | Webhook có chữ ký hoặc kéo định kỳ theo `SystemModstamp`. Endpoint webhook phải kiểm chữ ký **trước khi** đọc thân request (cùng lỗi với `SEC-02`). |
| Khối lượng lớn | Bulk API 2.0 cho đồng bộ ban đầu; tôn trọng giới hạn API theo ngày của Salesforce. |
| Tenant | Mỗi tenant một cấu hình kết nối; mọi cache key và hàng outbox có `tenant_id` (`AGENTS.md`). |
| Dữ liệu cá nhân | Học sinh là trẻ vị thành niên: chỉ gửi trường thật cần; không gửi điểm chi tiết, bài làm, ảnh chấm công nếu chưa có căn cứ. Dữ liệu sẽ nằm ở máy chủ Salesforce ngoài Việt Nam — cần chủ dự án xác nhận về pháp lý (Nghị định 13/2023). |
| Đồng nhất dữ liệu | Bổ sung dòng vào ma trận `04-dong-nhat-du-lieu.md`: với mỗi trường đồng bộ, ghi rõ bên nào là nguồn sự thật. |

Việc cần làm nếu chủ dự án chọn B: mở một phiên đặc tả riêng (không dùng thư mục `fable/` này làm backlog cho nó), rà module `enterpriseconnectors`, rồi mới lập kế hoạch.

## 3. Trạng thái

- [ ] Chủ dự án xác nhận cách hiểu A, B, hay "bỏ qua".
- [ ] Nếu A: hoàn thành thử nghiệm kỹ thuật mục 1.5 bước 2 và ghi kết quả vào `G4-09`.
- [ ] Nếu B: tạo đặc tả tích hợp riêng.
