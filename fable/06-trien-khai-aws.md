# 06 — Triển khai trên AWS (dự phòng / mở rộng)

AWS **không** phải đích chính. Đích chính là máy nhà (`05-trien-khai-vps-nha.md`). Tài liệu này dùng trong ba trường hợp:

| Trường hợp | Dùng phương án | Khi nào |
|---|---|---|
| Máy nhà chết, cần chạy tạm | A (một EC2) + mục 6 | Sự cố phần cứng, mất điện/mạng dài |
| Chuyển hẳn lên cloud, giữ cách vận hành cũ | A | Đường truyền nhà không đủ, hoặc không muốn trông máy |
| Vượt quá một máy (xem `03` mục 8) | B (dịch vụ quản lý) | Số đo k6 cho thấy một máy 4 nhân không đủ |

Chưa có tài khoản AWS nào được kiểm tra trong đợt rà này. Trong repo BE có sẵn `helm/` và cấu hình kind/keycloak nhưng **chưa** có Terraform/CloudFormation cho AWS. Mọi con số chi phí dưới đây là **ước lượng thô, chưa tra bảng giá** — phải tính lại bằng AWS Pricing Calculator trước khi quyết định.

Region: `ap-southeast-1` (Singapore) — gần Việt Nam nhất. Dữ liệu học sinh sẽ nằm ngoài Việt Nam: chủ dự án cần xác nhận điều này chấp nhận được về pháp lý (Nghị định 13/2023 về dữ liệu cá nhân, chuyển dữ liệu ra nước ngoài) trước khi dùng AWS lâu dài.

## 1. Phương án A — một EC2 chạy đúng compose hiện có

Giữ nguyên `ops/docker/compose.yml`, `deploy.sh`, `backup.sh`, Cloudflare Tunnel. Chỉ đổi máy.

| Thành phần | Chọn | Ghi chú |
|---|---|---|
| Máy | `m7i.xlarge` (4 vCPU, 16 GB, x86) | Bằng máy nhà về RAM, nhanh hơn về CPU. Không dùng Graviton (ARM) trừ khi đã build image `arm64` và chạy lại toàn bộ test. |
| Đĩa | EBS gp3 100 GB, mã hoá KMS, 3000 IOPS mặc định | Nhanh hơn SSD SATA về độ ổn định IOPS. Bật snapshot hằng ngày bằng Data Lifecycle Manager, giữ 7 bản. |
| Mạng | Subnet công cộng, **Security Group không mở cổng vào nào** | Lưu lượng vào đi qua Cloudflare Tunnel (cloudflared gọi ra). Không cần ALB, không cần Elastic IP. |
| Quản trị | SSM Session Manager | Không mở SSH. IAM role của máy: `AmazonSSMManagedInstanceCore` + quyền ghi CloudWatch Logs. |
| Metadata | IMDSv2 bắt buộc (`HttpTokens=required`), hop limit 1 | Chặn container đọc credential của máy. |
| Sao lưu | `backup.sh` → R2 như cũ **và** snapshot EBS | Hai lớp độc lập. |
| Hệ điều hành | Ubuntu 24.04, làm theo `05` mục 2 (trừ phần UPS/BIOS/router) | — |

Chi phí ước lượng: khoảng 200–250 USD/tháng trả theo giờ; giảm khoảng một phần ba với Savings Plan 1 năm. Cộng phí truyền dữ liệu ra (nhỏ nếu FE tĩnh ở Vercel/Pages).

Cấu hình ứng dụng: dùng đúng các giá trị ở `03` mục 3–5. Không tăng `BACKEND_REPLICAS` chỉ vì CPU nhanh hơn; đo lại bằng k6 rồi mới chỉnh.

## 2. Phương án B — dịch vụ quản lý

Chỉ làm khi có số đo cho thấy cần. Đây là một dự án hạ tầng riêng (ước 2–3 tuần cho một người đã quen AWS), không phải việc đổi cấu hình.

```
Cloudflare ──► ALB (HTTPS, ACM) ──► ECS Fargate: backend × 2 (2 AZ)
                                        │
                     ┌──────────────────┼───────────────────┐
                     ▼                  ▼                   ▼
              RDS PostgreSQL 17   ElastiCache "state"  ElastiCache "cache"
              Multi-AZ            (không eviction)     (allkeys-lru)
FE: S3 (riêng tư) ──► CloudFront (OAC)      Media: giữ R2 hoặc chuyển S3
Bí mật: Secrets Manager     Log/metric: CloudWatch (+ Grafana nếu muốn giữ dashboard)
```

| Thành phần | Chọn ban đầu | Điểm phải kiểm tra trước (CẦN XÁC MINH) |
|---|---|---|
| Backend | ECS Fargate, 2 task × 2 vCPU / 4 GB, mỗi AZ một task | Health check ALB trỏ `/ready`. Thời gian tắt êm (`stopTimeout`) ≥ thời gian drain của ứng dụng. Job `@Scheduled`: 11 job đã dùng `platform/events/ClusterJobLock` (ĐÃ XÁC MINH bằng grep). 4 worker **không** dùng khoá này: `TransactionalOutboxWorker`, `NotificationOutboxWorker`, `ReportWorker`, `ReportAggregateReconciliationWorker` — phải đọc từng cái để xác nhận chúng tự nhận việc an toàn (ví dụ `FOR UPDATE SKIP LOCKED`) trước khi chạy 2 task; nếu không, sự kiện/thông báo bị gửi hai lần. Điều này cũng áp dụng cho máy nhà nếu đặt `BACKEND_REPLICAS=2`. |
| Postgres | RDS PostgreSQL 17, `db.m7g.large` (2 vCPU, 8 GB), Multi-AZ, gp3 100 GB, mã hoá, sao lưu tự động 7 ngày + PITR | (1) Tài khoản chủ của RDS **không** phải superuser thật: kiểm tra migration Flyway nào cần `SUPERUSER`, `CREATE EXTENSION` ngoài danh sách RDS cho phép, hoặc `ALTER SYSTEM`. (2) Tạo lại hai role: role Flyway (chủ bảng) và role runtime `erg_app` không có `BYPASSRLS` — `RuntimeDatabaseRoleGuard` phải qua. (3) Parameter group: chuyển các cờ ở `03` mục 4 (bỏ `shared_buffers`/`effective_cache_size` vì RDS tự đặt theo RAM; giữ `random_page_cost=1.1`, `work_mem`, `jit=off`, `pg_stat_statements`). |
| Số kết nối | Hikari 16 × 2 task = 32 | `max_connections` của `db.m7g.large` đủ. Thêm task thì cân lại; quá 4 task thì đặt RDS Proxy **sau khi** kiểm tra RLS dựa trên `set_config(..., true)` trong transaction vẫn đúng qua proxy (pin session). |
| Redis state | ElastiCache, 1 node chính + 1 bản sao, `maxmemory-policy noeviction`, bật TLS + AUTH | Repo dùng Redis 8.8. ElastiCache có thể chưa có đúng phiên bản này (đang cung cấp Valkey và Redis OSS 7.x): liệt kê lệnh Redis BE dùng (`trail grep "redisTemplate"`, script Lua nếu có) và xác nhận tương thích. |
| Redis cache | ElastiCache, 1 node, `allkeys-lru` | Như trên. Mất node này chỉ làm chậm, không mất dữ liệu. |
| Cân bằng tải | ALB, chỉ nhận từ dải IP Cloudflare (prefix list) hoặc dùng Cloudflare Tunnel vào ALB nội bộ | Nếu ALB mở công khai mà không khoá IP Cloudflare thì kẻ tấn công gọi thẳng origin, giả `CF-Connecting-IP` và vượt rate limit theo IP. `HTTP__TRUSTED_PROXY_CIDRS` phải là CIDR của VPC. |
| Bí mật | Secrets Manager, tiêm vào task qua `secrets` của task definition | Không đặt bí mật trong biến môi trường dạng chữ thường của task definition. |
| Log | CloudWatch Logs, giữ 14 ngày | `erg.logging.mask-sensitive=true` giữ nguyên. |

Chi phí ước lượng: khoảng 600–900 USD/tháng (RDS Multi-AZ và NAT Gateway là hai khoản lớn nhất). Gấp ba đến bốn lần phương án A. Đổi lại: tự chuyển AZ khi hỏng, khôi phục tới từng phút (PITR), không tự vá Postgres.

Chuyển dữ liệu từ máy nhà lên RDS: `pg_dump -Fc` từng database → `pg_restore` vào RDS trong một khung bảo trì (ngừng ghi, ước 30–60 phút tuỳ dung lượng — đo trước trên bản sao). Không dùng `pg_dumpall` cho RDS (không khôi phục được role hệ thống); tạo role bằng script riêng.

## 3. Mạng và bảo mật (cả hai phương án)

- VPC riêng, 2 AZ. Phương án B: backend, RDS, ElastiCache ở subnet riêng tư; chỉ ALB ở subnet công cộng.
- Security Group theo chuỗi: ALB → backend:1606; backend → RDS:5432, Redis:6379. Không có rule `0.0.0.0/0` vào cổng nào ngoài 443 của ALB (và cái đó cũng nên khoá về dải Cloudflare).
- Tài khoản: bật MFA cho root, không dùng root hằng ngày, IAM Identity Center hoặc user có MFA. Không tạo access key dài hạn cho người.
- CI deploy: GitHub OIDC → IAM role giới hạn theo repo và nhánh (`token.actions.githubusercontent.com:sub`). Không lưu `AWS_ACCESS_KEY_ID` trong GitHub Secrets.
- Bật: CloudTrail (mọi region), GuardDuty, mã hoá mặc định EBS, chặn truy cập công khai S3 ở cấp tài khoản.
- **AWS Budgets**: cảnh báo ở 50 % / 80 % / 100 % ngân sách tháng, gửi email chủ dự án. Làm việc này trước khi tạo tài nguyên đầu tiên.
- Bucket sao lưu (nếu chuyển từ R2 sang S3): bật versioning + Object Lock (chế độ governance) để bản sao lưu không bị xoá bởi credential bị lộ.

## 4. FE trên AWS

Khuyến nghị vẫn là giữ FE ở Vercel hoặc Cloudflare Pages (`05` mục 1). Nếu muốn gom về AWS:

| Việc | Cấu hình |
|---|---|
| Lưu trữ | S3 riêng tư, CloudFront với Origin Access Control |
| SPA | CloudFront custom error: 403 và 404 → `/index.html`, mã trả 200 |
| Cache | `index.html`, `sw.js`, `manifest.webmanifest`: `no-cache`. `/assets/*` (có hash): `public, max-age=31536000, immutable` |
| Header | Response Headers Policy chép **đúng** bộ header ở `deploy/nginx/security-headers.conf` sau khi đã sửa theo `G1-01` (Permissions-Policy cho camera/định vị) và `G1-02` (CSP cưỡng chế). Ba nơi cấu hình header (nginx, `vercel.json`, CloudFront) phải giống nhau — chỉ giữ nơi đang dùng thật, xoá nơi không dùng. |
| Build | CI build với `VITE_API_BASE=https://api.erg.edu.vn`, `aws s3 sync dist/ --delete` cho `/assets` **không** dùng `--delete` (client đang mở còn cần chunk cũ), rồi invalidation `/index.html` và `/sw.js` |
| Tên miền | ACM ở `us-east-1` cho CloudFront; DNS vẫn ở Cloudflare (bản ghi "DNS only" để tránh hai lớp CDN) |

## 5. So sánh nhanh

| | Máy nhà | AWS A (một EC2) | AWS B (quản lý) |
|---|---|---|---|
| Chi phí tháng | Điện + mạng | ~200–250 USD (ước) | ~600–900 USD (ước) |
| Hỏng một máy/đĩa | Ngừng tới khi dựng lại (≤ 4 giờ theo mục 6) | Ngừng tới khi dựng lại từ snapshot (~30 phút) | Tự chuyển AZ (vài phút) |
| Mất dữ liệu tối đa | 24 giờ (sao lưu đêm) | 24 giờ, hoặc theo snapshot | Vài phút (PITR) |
| Công vận hành | Cao (phần cứng, điện, mạng) | Trung bình | Thấp hơn, nhưng cần người biết AWS |
| Độ trễ tới học sinh VN | Thấp nhất | ~30–50 ms thêm | ~30–50 ms thêm |
| Thay đổi code/cấu hình | Không | Không | Có (role DB, Redis TLS, health check, job trùng) |

## 6. Diễn tập khôi phục thảm hoạ: dựng lại trên AWS từ bản sao lưu ngoài máy, ≤ 4 giờ

Task `G4-08`. Mục tiêu: chứng minh rằng khi máy nhà mất hẳn, hệ thống chạy lại được trong 4 giờ với dữ liệu của đêm trước. **Chưa diễn tập thì coi như chưa có sao lưu.**

### 6.1 Chuẩn bị trước (làm một lần, không tính vào 4 giờ)

- [ ] Tài khoản AWS có sẵn, đã bật MFA, Budgets, một IAM role cho người trực.
- [ ] Launch template cho phương án A (AMI Ubuntu 24.04, `m7i.xlarge`, gp3 100 GB mã hoá, IMDSv2, role SSM, user-data cài Docker + cloudflared + `age` + `rclone`).
- [ ] Image backend nằm trong registry (GHCR hoặc ECR), gắn tag theo SHA. Hiện `deploy.sh` build ngay trên máy production (`OPS-04`) — nếu chưa sửa, cộng thêm 15–20 phút build từ mã nguồn vào bước 3.
- [ ] Trong trình quản lý mật khẩu của chủ dự án (không nằm trên máy nhà, không nằm trong R2): khoá riêng `age`, bản sao `.env.production`, token Cloudflare Tunnel, khoá **chỉ-đọc** của bucket sao lưu R2.
- [ ] Runbook này in ra hoặc lưu ở nơi mở được khi máy nhà chết.

### 6.2 Các bước và ngân sách thời gian

| # | Việc | Thời gian | Kiểm tra |
|---|---|---|---|
| 1 | Xác nhận sự cố không sửa nhanh được; báo người dùng (kênh Zalo/Telegram của trường) | 15 phút | — |
| 2 | Khởi chạy EC2 từ launch template; vào máy bằng SSM | 15 phút | `docker version`, `cloudflared --version` |
| 3 | Lấy mã ở đúng SHA đang chạy production; kéo image (hoặc build) | 20 phút | `docker image ls` có image đúng tag |
| 4 | Đặt `.env.production` (quyền 600) | 10 phút | 4 lệnh kiểm tra ở `05` mục 4 |
| 5 | Tải bản sao lưu mới nhất từ R2, giải mã bằng `age`, kiểm tra kích thước và ngày | 20 phút | `gzip -t` không lỗi; ngày bản sao lưu < 26 giờ |
| 6 | Bật Postgres rỗng, khôi phục bản dump | 30–60 phút (đo trong diễn tập) | Đếm dòng `users`, `lms_assignments`, `lms_attempts`; so với số ghi trong log sao lưu nếu có |
| 7 | Bật Redis, backend (Flyway không được chạy migration mới — cùng SHA) | 15 phút | `curl -fsS localhost:8080/ready` |
| 8 | Chạy cloudflared với **cùng tunnel** — lưu lượng tự về máy mới, không đổi DNS | 10 phút | `curl -fsS https://api.erg.edu.vn/ready` từ máy ngoài |
| 9 | Kiểm tra nghiệp vụ: đăng nhập giáo viên thử, học sinh thử; mở một bài đã giao; nộp một bài thử | 20 phút | Điểm hiện đúng ở cả cổng học sinh và giáo viên |
| 10 | Bật lại cron sao lưu trên máy mới; báo người dùng; ghi lại khoảng dữ liệu bị mất | 15 phút | Bản sao lưu đầu tiên từ máy mới xuất hiện trên R2 |
| | **Tổng** | **~3 giờ** + 1 giờ dự phòng | |

Điều chắc chắn mất: mọi bài làm, điểm, điểm danh ghi sau bản sao lưu đêm trước. Phiên đăng nhập còn hiệu lực nếu `user_sessions` có trong bản sao lưu; bài đang làm dở lưu ở Redis state thì mất (FE còn bản nháp cục bộ — xác nhận hành vi này trong diễn tập).

### 6.3 Cách diễn tập mà không đụng production

Làm đủ bước 2–7 và 9 trên EC2, nhưng **bỏ bước 8**: không nối tunnel production. Thay vào đó dùng `ssm start-session` chuyển tiếp cổng để gọi API, hoặc một tunnel thử với tên miền thử. Dùng tài khoản thử có trong dữ liệu sao lưu; **không** đặt lại mật khẩu của người dùng thật. Xong thì huỷ EC2 và ổ đĩa (dữ liệu học sinh thật nằm trên đó).

Ghi vào `Kết quả:` của `G4-08`: thời gian từng bước, dung lượng bản sao lưu, thời gian khôi phục, mọi chỗ runbook sai hoặc thiếu.

### 6.4 Quay về máy nhà

Ngoài giờ học: chặn ghi (tắt backend trên AWS) → `backup.sh` trên AWS → khôi phục trên máy nhà → bật backend ở nhà → chuyển cloudflared về máy nhà → kiểm tra như bước 9 → huỷ tài nguyên AWS. Không chạy hai nơi cùng ghi một lúc.

## 7. Checklist khi dùng AWS lâu dài

- [ ] Chủ dự án đã xác nhận việc đặt dữ liệu học sinh ở Singapore.
- [ ] Budgets + cảnh báo đã bật; đã tính chi phí bằng Pricing Calculator.
- [ ] Không có Security Group nào mở `0.0.0.0/0` ngoài 443 (và 443 đã khoá về Cloudflare nếu có ALB).
- [ ] Không có access key dài hạn; CI dùng OIDC.
- [ ] IMDSv2 bắt buộc; EBS/RDS/S3 mã hoá.
- [ ] Toàn bộ checklist `05` mục 9 (phần bảo mật, dữ liệu, tải) chạy lại trên môi trường AWS — số đo k6 của máy nhà **không** chuyển sang được.
- [ ] Phương án B: đã chạy toàn bộ test tích hợp BE trỏ vào RDS + ElastiCache thật (role DB, RLS, lệnh Redis), không chỉ Testcontainers.
