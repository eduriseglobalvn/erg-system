# 05 — Triển khai trên máy chủ tự dựng tại nhà (đích chính)

Máy: i5-7500, 16 GB RAM, SSD SATA 256 GB. Đã có sẵn trong repo BE: `ops/docker/` (compose, nginx, redis, giám sát), `ops/docker/deploy.sh`, `ops/backup/backup.sh`, `ops/bot/` (bot Telegram vận hành), Cloudflare Tunnel (`nginx/native.conf` ghi rõ cloudflared là client duy nhất). Tài liệu này **không dựng lại từ đầu** — nó liệt kê những gì đang có, những gì còn thiếu, và checklist go-live.

**Đã kiểm tra máy chủ thật ngày 11/11/2026** (SSH chỉ đọc). Kết quả từng dòng nằm ở mục 10 cuối file này; chi tiết và bằng chứng ở `01-phat-hien.md` mục G. Các bảng ở mục 2–8 là trạng thái **đích**; cột "Hiện có?" ghi theo repo, mục 10 ghi theo máy thật — khi hai nơi khác nhau thì mục 10 đúng.

## 1. Sơ đồ

```
Học sinh / giáo viên
        │ HTTPS
        ▼
   Cloudflare (DNS, TLS, WAF, cache tĩnh)
        │ Cloudflare Tunnel (đi ra từ máy nhà, không mở cổng router)
        ▼
 ┌──────────────────────── máy nhà ────────────────────────┐
 │ cloudflared (host)                                       │
 │   ├─ api.erg.edu.vn  → 127.0.0.1:8080  nginx (API)       │
 │   └─ lms.erg.edu.vn  → 127.0.0.1:8081  nginx (FE tĩnh)   │
 │ mạng docker "edge": nginx-api ─ backend (JVM, :1606)     │
 │ mạng docker "data" (internal): postgres, redis-state,    │
 │                                 redis-cache              │
 │ giám sát: prometheus, loki, grafana, alertmanager,       │
 │           exporter (chỉ bind 127.0.0.1)                  │
 │ cron: backup.sh 03:00 → mã hoá → R2 (ngoài máy)          │
 └──────────────────────────────────────────────────────────┘
```

Quyết định cần chủ dự án xác nhận: FE production đang ở **Vercel** (`vercel.json`, `.env.production` trỏ `https://api.erg.edu.vn`) hay ở **máy nhà** (`Dockerfile` + `deploy/nginx`)? Khuyến nghị: **giữ FE tĩnh ở Vercel hoặc Cloudflare Pages**. Lý do: file tĩnh phục vụ từ biên không tốn băng thông lên của đường truyền nhà, và máy nhà chết thì trang vẫn mở được để báo "đang bảo trì". Máy nhà chỉ chạy API + dữ liệu.

## 2. Hệ điều hành

| Việc | Lệnh / cấu hình | Hiện có? |
|---|---|---|
| Ubuntu Server 24.04 LTS, không giao diện | — | kiểm tra |
| Cập nhật bảo mật tự động | `unattended-upgrades` (chỉ security), khởi động lại 04:00 Chủ nhật nếu cần | kiểm tra |
| Người dùng `erg` không phải root, thuộc nhóm `docker` | `deploy.sh` dùng `erg@ssh.erg.edu.vn` | có (theo script) |
| SSH: chỉ khoá, tắt mật khẩu, tắt root | `PasswordAuthentication no`, `PermitRootLogin no` | kiểm tra |
| SSH không mở ra Internet | Đi qua Cloudflare Access (`ssh.erg.edu.vn`) hoặc Tailscale | có (theo tên miền) — kiểm tra Access policy có bắt MFA |
| Tường lửa | `ufw default deny incoming`; không mở 80/443/5432/6379 ra ngoài | kiểm tra |
| Router | **Không** port-forward. Tắt UPnP. | kiểm tra |
| `fail2ban` cho sshd | — | kiểm tra |
| Đồng bộ giờ | `systemd-timesyncd` hoặc `chrony`; múi giờ `Asia/Ho_Chi_Minh` | kiểm tra |
| Swap | swapfile 4 GB, `vm.swappiness=10` | kiểm tra |
| Giới hạn file | `fs.file-max`, `nofile 65535` cho docker | kiểm tra |
| Kernel mạng | `net.core.somaxconn=4096`, `net.ipv4.tcp_max_syn_backlog=4096` | kiểm tra |
| Mã hoá ổ | LUKS cho phân vùng dữ liệu (máy đặt ở nhà, có thể bị lấy trộm) | **cần quyết định**: mã hoá ổ thì sau mất điện phải nhập khoá mới khởi động được |
| Docker log | `/etc/docker/daemon.json`: `{"log-driver":"json-file","log-opts":{"max-size":"50m","max-file":"5"}}` | kiểm tra — thiếu thì đĩa 256 GB đầy vì log |

## 3. Cloudflare

| Việc | Giá trị |
|---|---|
| Tunnel | Một tunnel, hai hostname (`api`, `lms` nếu FE ở máy nhà). Token tunnel lưu trong `/etc/cloudflared`, quyền 600. |
| TLS | Full (strict) không áp dụng cho tunnel; bật "Always Use HTTPS", TLS tối thiểu 1.2, HSTS. |
| WAF | Bật Managed Rules. Rule riêng: chặn mọi đường dẫn không bắt đầu bằng `/api/`, `/ready`, `/healthz`, `/webhooks/` trên `api.erg.edu.vn`. |
| Rate limit ở biên | **Không** đặt theo IP thấp hơn giá trị nginx (trường học chung IP — OPS-01). Chỉ đặt một trần chống DDoS thô (ví dụ 1000 req/10 s/IP). |
| Cache | Không cache `/api/*`. Nếu FE ở máy nhà: cache `/assets/*` 1 năm. |
| Access | `ssh.erg.edu.vn`, `monitor.erg.edu.vn` (Grafana) sau Cloudflare Access, bắt đăng nhập + MFA. |
| IP thật | nginx đã lấy `CF-Connecting-IP` (`native.conf:6-8`). |

## 4. Ứng dụng (đã có — chỉnh theo kế hoạch)

Các thay đổi cấu hình cho máy này nằm ở `03-hieu-nang-2000ccu.md` mục 3–5 (task `G2-03`, `G1-05`). Tóm tắt giá trị đích trong `/opt/erg/ops/docker/.env.production` trên máy chủ:

```dotenv
SPRING_PROFILES_ACTIVE=prod
BACKEND_REPLICAS=1
BACKEND_CONTAINER_MEMORY=3g
POSTGRES_MAX_CONNECTIONS=60
DB__MAX_OPEN_CONNS=16
REDIS_CACHE_CONTAINER_MEMORY=1024m
REDIS_STATE_CONTAINER_MEMORY=512m
SPRING_THREADS_VIRTUAL_ENABLED=true
ERG_AUTH_LOGIN_RATE_LIMIT_SOURCE_PER_MINUTE=600
HTTP__CORS__ALLOWED_ORIGINS=https://lms.erg.edu.vn,https://erg.edu.vn   # chỉ các origin thật đang dùng
HTTP__TRUSTED_PROXY_CIDRS=172.16.0.0/12
SPRINGDOC_API_DOCS_ENABLED=false
ERG_GRAPHQL_INTROSPECTION_ENABLED=false
```

Kiểm tra trên máy chủ (agent **không** đọc file này từ repo; chủ dự án hoặc agent có quyền SSH chạy và dán kết quả không kèm giá trị bí mật):

```bash
cd /opt/erg/ops/docker
grep -cE '^(SECRET_|.*PASSWORD|.*_KEY)=.{20,}' .env.production      # số bí mật đã đặt, đủ dài
grep -E '^(SPRING_PROFILES_ACTIVE|BACKEND_REPLICAS|DB__MAX_OPEN_CONNS|POSTGRES_MAX_CONNECTIONS|HTTP__CORS__ALLOWED_ORIGINS|ERG_SECURITY)' .env.production
stat -c '%a %U' .env.production                                      # phải là 600 erg
grep -c 'replace-with\|change-me\|example' .env.production           # phải là 0
```

Bí mật: mỗi giá trị `SECRET_*`, mật khẩu Postgres/Redis phải khác nhau, tạo bằng `openssl rand -hex 32`. `SECRET_MEDIA_URL_SIGNING_KEY` phải **khác** `SECRET_AUTH__JWT_SECRET` (hiện `application.yml` cho phép dùng chung làm mặc định). Quy trình xoay vòng: `docs/runbooks/credential-rotation-p0-2.md` của BE.

## 5. Quy trình deploy

Hiện có: `ops/docker/deploy.sh <sha>` — giải nén mã, build image, sao lưu Postgres, **diễn tập migration trên bản sao**, đổi image, chờ health, ghi image trước để rollback. Đây là quy trình tốt; giữ.

Bổ sung:

1. **Khung giờ:** chỉ deploy ngoài 06:30–21:30 (task `G4-06`).
2. **Trước deploy:** CI xanh trên đúng SHA; đã chạy script index online nếu bản phát hành có (`ops/postgres/online/*.sql`).
3. **Sau deploy (5 phút):** `curl -fsS https://api.erg.edu.vn/ready`; đăng nhập thử một tài khoản giáo viên thử và một học sinh thử; mở Grafana xem tỉ lệ 5xx và p95; xem `docker logs erg-backend-1 | grep -E "ERROR|Flyway"`.
4. **Rollback:** đặt `ERG_APP_IMAGE` về `ERG_ROLLBACK_IMAGE`, `docker compose ... up -d --no-deps backend`. Migration chỉ tiến; nếu bản mới đã chạy migration phá tương thích thì rollback image **không** đủ — vì vậy mọi migration phải tương thích ngược với image trước (quy tắc `add → migrate → remove` của `AGENTS.md`).
5. **FE:** nếu ở Vercel — deploy theo commit, giữ bản trước để "Promote" lại. Nếu ở máy nhà — `deploy/docker/promote-release.sh` đã giữ bộ asset của bản trước cho client đang mở.

## 6. Sao lưu và khôi phục

Task `G1-04`. Mục tiêu: **RPO ≤ 24 giờ** (mất tối đa một ngày dữ liệu), **RTO ≤ 4 giờ** (dựng lại trong 4 giờ).

| Lớp | Tần suất | Nơi | Giữ |
|---|---|---|---|
| `pg_dumpall` + gzip + `age` | 03:00 hằng ngày | Cục bộ + R2 (bucket riêng, khoá API chỉ-ghi) | Cục bộ 7 ngày; R2: 7 ngày + 4 tuần + 6 tháng |
| Dump trước mỗi lần deploy | Mỗi deploy | Cục bộ `/opt/erg/backups` | 30 ngày (đã có) |
| `.env.production` + cấu hình cloudflared | Khi thay đổi | Trình quản lý mật khẩu của chủ dự án (không phải R2) | Mãi mãi |
| Ảnh chấm công, media | — | **Chưa có nơi lưu bền**: R2 chưa cấu hình trên production, ảnh sẽ nằm trong container (SRV-05, task `G1-15`) | Sau khi sửa: theo vòng đời bucket hoặc theo sao lưu volume |

Giảm RPO xuống vài phút (tuỳ chọn, làm sau): WAL archiving bằng `pgBackRest` hoặc `wal-g` lên R2. Chỉ làm khi mất một ngày điểm số là không chấp nhận được.

**Diễn tập khôi phục mỗi tháng** (`ops/backup/restore-drill.md`): tải bản mới nhất từ R2 về một máy khác, giải mã, `psql` vào container tạm, đếm dòng `users`, `lms_attempts`, `lms_assignments`, khởi động backend trỏ vào đó, đăng nhập. Ghi thời gian thực hiện.

## 7. Giám sát và cảnh báo

Hiện có: Prometheus, Alertmanager, Loki + Promtail, Grafana, node/postgres/redis exporter, dashboard `ops/observability/grafana/erg-backend-slo.json`, cảnh báo `BackupStale`, bot Telegram (`ops/bot`), workflow `uptime.yml`.

Cảnh báo phải có (kiểm tra từng cái tồn tại trong cấu hình Prometheus; thiếu thì thêm):

| Cảnh báo | Điều kiện |
|---|---|
| API chết | `/ready` lỗi 2 phút (kiểm tra **từ ngoài**: `uptime.yml` hoặc dịch vụ uptime, vì máy chết thì Prometheus cũng chết) |
| Tỉ lệ 5xx | > 1 % trong 5 phút |
| p95 | > 800 ms trong 10 phút |
| Hikari chờ connection | `hikaricp_connections_pending > 0` trong 2 phút |
| Đĩa | > 70 % cảnh báo, > 85 % khẩn |
| RAM / swap | swap dùng > 512 MB; container bị OOM-kill |
| Postgres | số connection > 80 % `max_connections`; replication/WAL không liên quan |
| Redis | `used_memory` > 90 % `maxmemory` (state: `noeviction` → ghi sẽ lỗi) |
| Sao lưu | bản cục bộ > 26 giờ; bản ngoài máy > 26 giờ |
| SMART | `smartmontools` + textfile collector: reallocated sectors tăng, wear level |
| Nhiệt độ CPU | > 85 °C (máy để ở nhà, quạt bụi) |
| Chứng chỉ / tunnel | cloudflared mất kết nối |

Log: Loki giữ 14 ngày. Không ghi token, mật khẩu, nội dung bài làm (`erg.logging.mask-sensitive=true` đã bật).

## 8. Phần cứng và môi trường

- **UPS** tối thiểu 600 VA cho máy + modem + router; cấu hình `nut` hoặc `apcupsd` để tắt máy an toàn khi pin < 20 %.
- BIOS: "Restore on AC Power Loss" = Power On.
- Docker: mọi service đã `restart: unless-stopped`; kiểm tra `systemctl is-enabled docker cloudflared`.
- Đường truyền: ghi lại tốc độ **lên** thực tế. 2000 học sinh × ~3 KB/s trung bình khi làm bài ≈ 50 Mbps lên lúc đỉnh nếu FE tĩnh cũng đi qua đây; chỉ ~5–10 Mbps nếu FE ở Vercel/Pages.
- Đường truyền dự phòng: router có cổng WAN thứ hai hoặc USB 4G; Cloudflare Tunnel tự nối lại qua đường còn sống.
- Ổ thứ hai (khuyến nghị): một SSD nữa để chứa bản sao lưu cục bộ và WAL — tách khỏi ổ dữ liệu.
- Khi máy chết hẳn: theo `06-trien-khai-aws.md` mục 6 (dựng tạm trên AWS từ bản sao lưu).

## 9. Checklist go-live

Mỗi dòng phải có bằng chứng (lệnh + kết quả) trong `Kết quả:` của task `G4-07`.

**Bảo mật**
- [ ] Không có cổng nào của máy mở ra Internet (`nmap` từ ngoài vào IP công cộng: tất cả filtered/closed).
- [ ] SSH chỉ qua Cloudflare Access/Tailscale, chỉ khoá.
- [ ] `.env.production` quyền 600, không còn giá trị mẫu, các bí mật khác nhau.
- [ ] `curl -i https://api.erg.edu.vn/actuator/health` → 404; `/metrics` → 404; `/v3/api-docs` → 404/403; `/scalar` → 404/403.
- [ ] GraphQL introspection tắt: gửi `{__schema{types{name}}}` → lỗi.
- [ ] CORS: `curl -H "Origin: https://evil.example" -I https://api.erg.edu.vn/api/v1/health` không trả `Access-Control-Allow-Origin`.
- [ ] Header FE: CSP **cưỡng chế**, `Permissions-Policy` có `camera=(self)`, HSTS (task `G1-01`, `G1-02`).
- [ ] `erg.security.trusted-header-auth-enabled` không bật: `curl -H "X-User-ID: x" -H "X-Permissions: *" https://api.erg.edu.vn/api/v1/users` → 401.
- [ ] Luật tài khoản học sinh: 3 kiểm tra tay ở `G1-07`, `G1-08`.

**Dữ liệu**
- [ ] Sao lưu ngoài máy chạy 3 đêm liên tiếp; đã khôi phục thử thành công một lần.
- [ ] Runtime dùng role `erg_app` (không phải chủ sở hữu bảng); Flyway dùng role riêng (`RuntimeDatabaseRoleGuard`).
- [ ] RLS: ghi lại danh sách bảng **chưa** bật (dev: 115/133 bảng đã bật, 56 bảng `force`).

**Tải**
- [ ] Kết quả k6 đạt ngưỡng `03` mục 2 trên chính máy này (`G2-09`).
- [ ] `show shared_buffers` = 3GB; `docker stats` tổng giới hạn ≤ 12,5 GB.
- [ ] Đăng nhập 100 lượt trong 10 giây từ một IP: không 429.

**Vận hành**
- [ ] Mọi cảnh báo ở mục 7 đã thử kích hoạt một lần và tin nhắn tới Telegram.
- [ ] Rút điện máy (ngoài giờ): UPS giữ, hết pin máy tắt an toàn, có điện lại tự lên, dịch vụ tự chạy, `/ready` xanh trong ≤ 5 phút.
- [ ] Đã diễn tập rollback một lần.
- [ ] Có số điện thoại/Telegram của người trực và quy trình khi sự cố trong giờ kiểm tra.

## 10. Kết quả kiểm tra máy chủ thật (11/11/2026)

Đối chiếu với các bảng ở mục 2–8. "Đạt" = đúng trạng thái đích. Bằng chứng: `01-phat-hien.md` mục G.

| Hạng mục | Thực tế | Kết luận |
|---|---|---|
| Hệ điều hành | Ubuntu **26.04.1** LTS (không phải 24.04), không giao diện | Đạt |
| Cập nhật bảo mật tự động | Bật; 19 gói chờ; không cần khởi động lại | Đạt |
| Người dùng `erg` | Có, thuộc nhóm `docker`, `sudo` không cần mật khẩu cho mọi lệnh | Thu hẹp `sudo` (SRV-10) |
| SSH chỉ khoá | **Không**: `PasswordAuthentication yes`, `X11Forwarding yes` | **Chưa đạt — SRV-02, `G1-12`** |
| SSH sau Cloudflare Access + MFA | Không thấy lớp Access | **Chưa đạt — SRV-02** |
| Tường lửa | ufw mặc định chặn; còn 4 rule thừa (80, 443, 8080, 3000) và 22 mở cho LAN | Dọn (SRV-10) |
| `fail2ban` | Chạy, nhưng không thấy IP thật của kết nối qua tunnel | Không thay được Access |
| Đồng bộ giờ, múi giờ | Đồng bộ bật; múi giờ **UTC** (không phải `Asia/Ho_Chi_Minh`) | Chấp nhận, ghi vào runbook |
| Swap | 4 GB, `swappiness=10` | Đạt |
| Giới hạn file / kernel mạng | `fs.file-max=65535`, `somaxconn=65535`, `tcp_max_syn_backlog=1024` | Chỉnh (SRV-08) |
| Log Docker | 50 MB × 5 | Đạt |
| Mã hoá ổ | Chưa kiểm | Vẫn cần quyết định |
| Tunnel | `cloudflared` chạy bằng systemd, dùng file token; mọi cổng publish ở `127.0.0.1` | Đạt |
| Grafana sau Access | Không; trang đăng nhập mở công khai | Chưa đạt — SRV-07, `G4-10` |
| FE | Chạy ở **Vercel** (vùng `hkg1`) | Đúng khuyến nghị mục 1; bỏ câu hỏi "FE ở đâu" |
| Bản BE | `erg-spring:9d2e6f7-jvm`, 1 bản, 4 GB, heap 75 % | Chỉnh theo `G2-03` |
| `.env.production` | Quyền 600; khoá ứng dụng đều riêng và đủ dài; **4 mật khẩu DB/Redis trùng file mẫu**; SMTP còn giá trị mẫu; R2 trống | **Chưa đạt — SRV-03, SRV-04, SRV-05** |
| Postgres | 17.11, toàn cấu hình mặc định, không giới hạn bộ nhớ | Chưa đạt — `G2-03` |
| Redis | 8.8.0; state `maxmemory` 768 MB > giới hạn 512 MB | Chưa đạt — SRV-06 |
| Sao lưu cục bộ | Chạy mỗi đêm 03:00 giờ VN + trước mỗi deploy | Đạt |
| Sao lưu ngoài máy, mã hoá | Không có; chưa cài `age`/`rclone` | **Chưa đạt — OPS-02, `G1-04`** |
| Giám sát | 5 target `up`, 17 luật, Telegram, bot chạy | Bổ sung luật (SRV-11) |
| Báo tin khi máy chết / deploy / đứng | Không có: kiểm tra từ ngoài (`uptime.yml`) thiếu secret và chỉ chạy 4–8 giờ/lần; `deploy.sh` không gửi tin; bot không thử tunnel | **Chưa đạt — BOT-01..05, `G4-12` → `G4-15`** |
| SMART, nhiệt độ, UPS | Chưa cài công cụ nào; CPU đang 28–37 °C | Chưa đạt — SRV-08 |
| Khởi động lại tự động | `docker`, `cloudflared` đều `enabled`; container `unless-stopped` | Đạt (chưa thử rút điện) |
| Từ ngoài vào | `/actuator`, `/v3/api-docs`, `/scalar` 404; giả header 401; `/metrics` 200 (2 chỉ số) | Chặn `/metrics` (`G4-04`) |
| HSTS | Không thấy trên `api` và `lms` | Chưa đạt — SRV-07 |
