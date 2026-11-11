# 03 — Chịu tải 2000 CCU trên i5-7500 / 16 GB / SSD SATA 256 GB

**Nói thẳng trước:** hiện chưa có bằng chứng nào cho thấy hệ thống chịu được 2000 CCU trên máy này. Bằng chứng cũ trong repo là rớt ngưỡng ở 500 VU (`F:\ERG\erg-spring\load\results\20260729T190558Z\comparison.md`: native, REST, 265 req/s, p95 2,5 giây). Tài liệu này đưa ra mô hình tải, các thay đổi cần làm, và **cổng đo** phải qua. Chỉ khi có file kết quả k6 đạt ngưỡng trên đúng máy đích mới được nói "đạt".

## 1. Phần cứng đích

| Thành phần | Thông số | Hệ quả |
|---|---|---|
| CPU | i5-7500, 4 nhân / 4 luồng, 3,4 GHz | JVM + Postgres + Redis + nginx + giám sát chia nhau 4 nhân. Không có chỗ cho việc thừa. |
| RAM | 16 GB | Phải đặt giới hạn cho từng container, chừa ≥ 3 GB cho page cache. |
| Đĩa | 1 SSD SATA 256 GB | ~500 MB/s tuần tự, fsync chậm hơn NVMe nhiều. Ghi WAL là điểm nghẽn khi nộp bài đồng loạt. |
| Mạng | Đường truyền gia đình + Cloudflare Tunnel | Băng thông lên là giới hạn thật; đo ở mục 7. |

## 2. Mô hình tải 2000 CCU

Định nghĩa dùng trong kế hoạch: **2000 học sinh cùng làm bài trong một khung giờ**, cộng 100 giáo viên xem tiến độ.

| Pha | Hành vi | Tải ước tính |
|---|---|---|
| A. Đăng nhập | 2000 lượt trong 5 phút, đỉnh dồn trong 60 giây đầu | Trung bình 7 lượt/s, đỉnh 30 lượt/s (mỗi lượt một lần băm Argon2 ≈ 16 MB, vài chục ms CPU) |
| B. Mở trang chủ + mở bài | Mỗi học sinh 3–5 request | Đỉnh 150 req/s trong 1–2 phút |
| C. Làm bài (30–45 phút) | Lưu nháp. Hiện tại: mỗi lần ngừng gõ 1,5 s. Sau PERF-04: tối đa 1 lần / 5 s và khi chuyển câu | Hiện tại có thể tới 300–600 lượt ghi/s; mục tiêu sau sửa ≤ 120 lượt ghi/s |
| D. Nộp bài | 2000 lượt nộp trong 2 phút cuối giờ | Trung bình 17 lượt/s, đỉnh 50 lượt/s; mỗi lượt chấm điểm + ghi nhiều bảng |
| E. Giáo viên | 100 người, làm mới tiến độ 15–30 s | 5 req/s, truy vấn tổng hợp nặng |

Ngưỡng chấp nhận (lấy theo `docs/performance/2026-07-workload-model.md` của BE):

| Loại | p95 | p99 | Lỗi |
|---|---|---|---|
| Đọc có cache (trang chủ, danh sách bài) | < 300 ms | < 800 ms | < 1 % |
| Lệnh ghi (lưu nháp, nộp bài) | < 800 ms | < 1,5 s | < 0,1 % với nộp bài |
| Đăng nhập | < 1,5 s | < 3 s | < 1 % (không tính 429 có chủ đích) |

Thêm hai điều kiện cứng: **không mất bài nộp nào** (đối chiếu số lượt nộp k6 gửi với số dòng `lms_attempts` trạng thái đã nộp) và **không OOM, không dùng swap quá 256 MB**.

## 3. Ngân sách RAM (tổng 16 GB)

| Thành phần | Giới hạn container | Ghi chú |
|---|---|---|
| Hệ điều hành + Docker + cloudflared | 1,2 GB | Ubuntu Server, không giao diện |
| Postgres 17 | 5 GB | `shared_buffers` 3 GB |
| Backend JVM, **1 replica** | 3 GB | Heap 75 % = 2,25 GB. Hai replica trên 4 nhân chỉ làm tăng tranh chấp CPU và nhân đôi cache L1. |
| Redis cache | 1 GB | `maxmemory 768mb`. Cache TTL 30–60 s, không cần 2 GB. |
| Redis state | 512 MB | `maxmemory 384mb`, `noeviction` giữ nguyên |
| nginx (API) + nginx (FE) | 128 MB | |
| Giám sát (Prometheus, Loki, Grafana, exporter) | 1,6 GB | Giữ nguyên `compose.monitor.yml` |
| **Tổng cấp phát** | **12,4 GB** | |
| Còn lại cho page cache | ≈ 3,6 GB | Postgres dựa vào phần này (`effective_cache_size`) |

Swap: tạo swapfile 4 GB, `vm.swappiness=10`. Swap là lưới an toàn chống OOM-kill, không phải chỗ chạy thường xuyên.

Thay đổi cấu hình tương ứng (file mẫu, **không** sửa `.env.production` thật trong repo):

```dotenv
# ops/docker/.env.production.example
BACKEND_REPLICAS=1
BACKEND_CONTAINER_MEMORY=3g
REDIS_CACHE_CONTAINER_MEMORY=1024m
REDIS_STATE_CONTAINER_MEMORY=512m
POSTGRES_MAX_CONNECTIONS=60
DB__MAX_OPEN_CONNS=16
DB__MAX_IDLE_CONNS=4
SPRING_THREADS_VIRTUAL_ENABLED=true
```

`ops/docker/redis/cache.conf`: `maxmemory 768mb`. `ops/docker/redis/state.conf`: `maxmemory 384mb`.
`ops/docker/compose.yml`: thêm `mem_limit: 5g` và `shm_size: 512m` cho service `postgres`.

## 4. Postgres cho 16 GB / 4 nhân / SSD SATA

Thêm vào `command:` của service `postgres` trong `ops/docker/compose.yml` (mỗi cờ một cặp `- -c` / `- tên=giá trị`, theo đúng kiểu đang có):

| Tham số | Giá trị | Lý do |
|---|---|---|
| `shared_buffers` | `3GB` | ≈ 60 % giới hạn container |
| `effective_cache_size` | `7GB` | shared_buffers + page cache dự kiến |
| `work_mem` | `8MB` | 60 connection × vài phép sort vẫn an toàn |
| `maintenance_work_mem` | `512MB` | Vacuum, tạo index |
| `random_page_cost` | `1.1` | SSD |
| `effective_io_concurrency` | `200` | SSD |
| `wal_buffers` | `16MB` | |
| `max_wal_size` | `2GB` | Giảm checkpoint dày lúc nộp bài đồng loạt |
| `min_wal_size` | `512MB` | |
| `checkpoint_timeout` | `10min` | |
| `checkpoint_completion_target` | `0.9` | Đã là mặc định, ghi rõ |
| `synchronous_commit` | `on` | **Giữ nguyên.** Bài nộp đã báo thành công thì không được mất khi mất điện. |
| `jit` | `off` | Truy vấn OLTP ngắn; JIT chỉ tốn CPU biên dịch |
| `autovacuum_vacuum_scale_factor` | `0.05` | Bảng `lms_attempts`, `user_sessions` cập nhật liên tục |
| `autovacuum_naptime` | `20s` | |
| `idle_in_transaction_session_timeout` | `30s` | Chặn connection bị treo giữ khoá |
| `log_min_duration_statement` | `250ms` | Thấy truy vấn chậm trong Loki |
| `max_connections` | `60` | 1 backend × 16 + Flyway + exporter + dự phòng |

Không đặt `fsync=off` hay `full_page_writes=off`.

Dung lượng đĩa: đặt cảnh báo khi phân vùng dữ liệu > 70 %. Với 256 GB: hệ điều hành + image ≈ 30 GB, Prometheus/Loki giữ 15 ngày ≈ 10 GB, bản sao lưu cục bộ 7 ngày, phần còn lại cho Postgres. Khi DB > 60 GB phải lên kế hoạch thêm ổ.

## 5. JVM, Tomcat, pool, nginx

| Chỗ | Hiện tại | Đề xuất | Ghi chú |
|---|---|---|---|
| Virtual thread | tắt | bật (`SPRING_THREADS_VIRTUAL_ENABLED=true`) | Request chờ DB không giữ luồng hệ điều hành. Đo trước/sau; nếu thấy pinning (log `jdk.tracePinnedThreads`) thì báo lại. |
| Hikari `maximum-pool-size` | 8 (mẫu) / 25 (mặc định) | 16 | 4 nhân Postgres xử lý tốt ~10–16 truy vấn đồng thời; nhiều hơn chỉ tăng tranh chấp |
| Hikari `connection-timeout` | 5000 ms | 2000 ms | Lỗi nhanh hơn, nginx thử lại được |
| Tomcat `threads.max` | 200 | 200 | Giữ; với virtual thread tham số này ít ý nghĩa |
| JVM | `-XX:MaxRAMPercentage=75` | thêm `-XX:+UseZGC -XX:+ZGenerational` **chỉ nếu** đo thấy GC pause > 100 ms với G1 | Mặc định G1 thường đủ cho heap 2 GB; không đổi khi chưa đo |
| Argon2 đồng thời | không giới hạn | `Semaphore(8)` | PERF-03 |
| Cache principal | không có | Caffeine 30 s, 10.000 mục | PERF-01 |

nginx API (`ops/docker/nginx/native.conf`) — nới giới hạn theo IP vì cả trường chung một IP (OPS-01):

```nginx
limit_req_zone $binary_remote_addr zone=erg_general:10m rate=300r/s;
limit_req_zone $binary_remote_addr zone=erg_login:10m   rate=30r/s;
limit_req_zone $binary_remote_addr zone=erg_graphql:10m rate=150r/s;
# trong server {}
client_max_body_size 4m;
# location = /api/v1/auth/login : burst=100 nodelay; limit_conn erg_connections 300;
# location = /api/v1/graphql    : burst=300 nodelay; limit_conn erg_connections 1500;
# location /                    : burst=600;         limit_conn erg_connections 3000;
```

Biến môi trường: `ERG_AUTH_LOGIN_RATE_LIMIT_SOURCE_PER_MINUTE=600`, `ERG_AUTH_LOGIN_RATE_LIMIT_DEVICE_PER_MINUTE=20` (giữ), `ERG_AUTH_LOGIN_RATE_LIMIT_ACCOUNT_PER_MINUTE=10` (giữ — đây là hàng rào chống dò mật khẩu). Khoá tài khoản sau 5 lần sai trong 15 phút giữ nguyên.

Các con số nginx trên là điểm khởi đầu; chỉnh lại theo kết quả mục 7.

## 6. Thứ tự tối ưu (làm theo đúng thứ tự, đo sau mỗi bước)

1. **Đo nền** trước khi sửa gì (mục 7, kịch bản S1–S4 ở 200 / 500 / 1000 VU). Lưu vào `load/results/<ngày>-baseline/`.
2. PERF-01 cache principal + bỏ resolve trùng. Kỳ vọng: số câu SQL mỗi request giảm ≥ 4. Kiểm bằng test đếm truy vấn (Hibernate statistics đã bật ở profile `dev`).
3. PERF-02 cấu hình Postgres + PERF-07 ngân sách RAM.
4. OPS-01 nới rate limit + OPS-03 `client_max_body_size`.
5. PERF-03 semaphore Argon2.
6. PERF-04 giảm tần suất lưu nháp (FE).
7. PERF-08 index `student_progress`.
8. PERF-05 xoá cache theo phạm vi (12 chỗ LMS trước).
9. PERF-06 virtual thread + pool 16.
10. Đo lại đủ S1–S5 ở 2000 VU. Nếu chưa đạt: đọc `pg_stat_statements` (`ops/postgres/top-queries.sql`), sửa 3 truy vấn tốn tổng thời gian nhiều nhất, lặp lại.

Không làm bước sau khi bước trước chưa có số đo. Nếu một bước không cải thiện số đo, hoàn tác nó.

## 7. Cổng đo bằng k6

Hạ tầng đã có: `load/k6/*.js`, `load/scripts/benchmark.ps1`, `ops/docker/compose.benchmark.yml`, dữ liệu mẫu `load/fixtures/seed-postgres-scale.sql` (4.500 học sinh, 10 tenant).

**Nơi đo:** máy đích i5-7500 (hoặc máy có cấu hình bằng/yếu hơn). Máy phát tải k6 phải là **máy khác** trong cùng LAN, đi qua nginx. Đo trên máy dev 16 luồng không tính.

**Kịch bản cần có** (S1, S4 đã có file; S2, S3, S5 phải viết mới trong `load/k6/`):

| Mã | File | Nội dung | Ngưỡng |
|---|---|---|---|
| S1 | `erg-5k-steady.js` (đặt `TARGET_VUS=2000`) | Đọc danh sách bài, nghỉ 1 s | p95 < 300 ms, lỗi < 0,1 % |
| S2 | `erg-login-storm.js` (mới) | 2000 đăng nhập, tăng dần trong 60 s, từ **một** IP | p95 < 1,5 s; không 429 từ giới hạn theo IP; không OOM |
| S3 | `erg-exam-session.js` (mới) | Mỗi VU: mở trang chủ → bắt đầu bài → lưu nháp 5 s/lần trong 10 phút → nộp | Lưu nháp p95 < 800 ms; nộp p95 < 800 ms |
| S4 | `erg-5k-submission-burst.js` (2000 VU) | 2000 lượt nộp trong 120 s | 0 lượt mất; p99 < 1,5 s |
| S5 | `erg-teacher-progress.js` (mới) | 100 VU đọc tiến độ bài giao 15 s/lần, chạy **cùng lúc** với S3 | p95 < 800 ms |

Cuối cùng chạy **ngâm 2 giờ** ở 1000 VU kịch bản S3: RSS của JVM không tăng dần, Redis không vượt `maxmemory`, đĩa không đầy.

**Mỗi lần đo ghi lại** (theo `load/README.md`): p50/p95/p99, req/s hoàn thành, số lỗi theo mã, `hikaricp_connections_pending`, CPU từng container, `iowait`, kích thước WAL, bộ nhớ Redis, RSS và GC của JVM, swap. Kèm commit SHA và checksum dữ liệu mẫu.

**Cách đếm bài nộp bị mất** (S4):

```sql
select count(*) from lms_attempts
where lower(status) in ('submitted','graded','completed','needs_review','review_required')
  and updated_at >= :thoi_diem_bat_dau;
```

Con số này phải bằng số lượt nộp k6 nhận được mã 2xx.

**Đo đường truyền:** từ một máy ngoài mạng nhà, `k6` 200 VU tải trang chủ qua `https://lms.erg.edu.vn`. Nếu p95 qua Internet cao hơn p95 trong LAN quá 300 ms thì nghẽn nằm ở đường truyền lên, không phải ở máy chủ. Khi đó xem `06-trien-khai-aws.md`.

## 8. Khi nào phải chuyển khỏi máy này

Chuyển sang AWS (hoặc thêm máy thứ hai) nếu sau khi làm hết mục 6 mà còn một trong các dấu hiệu:

- CPU tổng > 85 % kéo dài ở 2000 VU kịch bản S3.
- `iowait` > 20 % khi nộp bài đồng loạt (SSD SATA không theo kịp fsync).
- Băng thông lên của đường truyền nhà bão hoà.
- Cần chạy 2 replica backend để deploy không gián đoạn trong giờ học.

Phương án trung gian rẻ nhất: giữ máy nhà, chuyển riêng Postgres sang một máy có NVMe.

## 9. FE: những gì ảnh hưởng tới tải máy chủ

| Việc | Vị trí | Trạng thái |
|---|---|---|
| Lưu nháp 1,5 s, gửi toàn bộ | `src/features/lcms/quiz/player/player-shell-runtime/use-player-sync-effects.ts:52-73` | Phải sửa (PERF-04) |
| Polling | `use-employee-management.ts:48` (30 s), `assignment-progress-export-control.tsx:28` (2 s khi job đang chạy), `timekeeping-admin-query.ts:31` | Chấp nhận được; không thêm polling mới dưới 15 s |
| Thử lại khi lỗi | `src/lib/query-policy.ts` — chỉ thử lại lỗi ≥ 500, tối đa 2 lần | Tốt. Thêm xử lý 429 theo `Retry-After` (OPS-01) |
| Gói quiz | BE cache `quizRuntimePackage` 10 phút; FE giữ trong IndexedDB | **Đang lỗi trên production**: 43 % lượt tải đầu trả 500 và Redis không bao giờ giữ được gói đề (SRV-01, task `G1-11`). Phải sửa trước khi đo tải. |
| Tài nguyên tĩnh | `/assets/*` cache 1 năm, `immutable` | Tốt |
