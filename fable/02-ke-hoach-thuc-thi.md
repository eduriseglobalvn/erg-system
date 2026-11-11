# 02 — Kế hoạch thực thi

Đọc `README.md` (luật cho agent) trước. Làm **từ trên xuống**. Mỗi task: một nhánh, một PR, tick khi PR đã merge.

Ký hiệu: `FE` = `F:\ERG\erg-system`, `BE` = `F:\ERG\erg-spring`, `J/` = `src/main/java/com/erg/ergspringboot/`. Cột Model: S = Sonnet, O = Opus.

Lệnh kiểm tra chuẩn:

- **FE-CHECK:** `bunx tsc -p tsconfig.app.json --noEmit` → `bunx eslint .` → `bun run verify` → `bunx vitest run <các file test liên quan>`
- **BE-CHECK:** `./mvnw.cmd -q -Dtest=<Lớp test> test` → trước khi mở PR: `./mvnw.cmd verify`
- Cả hai: `trail check` trước commit.

## Tổng quan giai đoạn

| Giai đoạn | Mục tiêu | Điều kiện sang giai đoạn sau |
|---|---|---|
| G0 | Nền ổn định: CI xanh, kiểm tra contract chạy được, chốt nhánh | CI hai repo xanh trên nhánh tích hợp |
| G1 | Hết lỗi P0 không liên quan tải, luật tài khoản học sinh đúng | Mọi task G1 (trừ G1-10 chờ quyết định) đã xong, đã kiểm trên bản build; `G1-11` và `G1-12` làm trước tiên |
| G2 | Đạt 2000 CCU trên máy đích | Kết quả k6 đạt ngưỡng `03` mục 2 |
| G3 | Số liệu thống nhất giữa các màn hình | Bảng `04` mục 2 không còn dòng LỆCH / CHƯA SOÁT |
| G4 | Bảo mật còn lại + triển khai máy nhà hoàn chỉnh | Checklist go-live `05` mục 9 đạt |
| G5 | Dọn dẹp, soát phần chưa phủ | — |

G1 và G2 có thể chạy song song bởi hai agent nếu không đụng cùng file (G1 chủ yếu FE + cấu hình; G2 chủ yếu BE).

---

## G0 — Nền ổn định

- [ ] **G0-01 · Chốt nhánh tích hợp** · chủ dự án quyết định · không cần code
  - Hỏi chủ dự án ba câu ở `README.md` mục "Câu hỏi mở" (2, 3). Ghi câu trả lời vào dòng `Kết quả:` dưới đây.
  - BE: liệt kê nhánh chưa merge `git branch --no-merged <nhánh production>`; với mỗi nhánh ghi: giữ / merge / xoá. **Không tự xoá nhánh.**
  - Xong khi: biết rõ nhánh nào là gốc cho các PR của kế hoạch này ở cả hai repo.

- [ ] **G0-02 · FE: `.gitattributes` + kiểm tra contract chạy được** · FE · S · nhánh `chore/gitattributes-contract-check` · phát hiện DATA-04
  - Tạo `.gitattributes`: `* text=auto eol=lf` và dòng `*.png *.jpg *.ico *.woff2 *.pfx *.cer binary` (mỗi mẫu một dòng). Chạy `git add --renormalize .` rồi xem `git status` — chỉ được có thay đổi xuống dòng.
  - Thêm bước `bun run contract:check` vào `.github/workflows/ci.yml` sau `bun run verify`.
  - Nếu sau khi chuẩn hoá mà `node scripts/sync-api-contract.mjs --check` vẫn lệch: snapshot đã lạc hậu thật. Đồng bộ lại từ BE nhánh production (`bun run contract:rest:sync`, `bun run contract:rest:generate`, `bun run contract:graphql:sync`), sửa lỗi typecheck phát sinh.
  - Xong khi: `bun run contract:check` thoát mã 0 trên Windows và trên CI.

- [ ] **G0-03 · BE: đưa CI về xanh** · BE · O · nhánh `fix/ci-green` · phát hiện OPS-05, CODE-04
  - Chạy `./mvnw.cmd verify`, ghi danh sách test đỏ. Ghi nhận từ phiên trước: test khoảng trống Flyway, `TimekeepingModuleTest`, `ClassSizeRatchet`.
  - Với mỗi test đỏ: tìm nguyên nhân gốc (dùng skill `superpowers:systematic-debugging`). Không tắt test, không nâng ngưỡng ratchet để qua.
  - `ClassSizeRatchet`: tách `AssignmentRepository` (588 dòng) và `AttemptRepository` (479 dòng) theo việc — truy vấn cho học sinh / cho giáo viên / lệnh ghi. Giữ nguyên JPQL.
  - Commit `8ebb5ee wip: ...`: đọc diff, tách thành các commit có nghĩa hoặc hoàn tất phần dở. Hỏi chủ dự án nếu không rõ ý định.
  - Xong khi: `./mvnw.cmd verify` thoát mã 0; CI trên GitHub xanh.

- [ ] **G0-04 · FE: đưa CI về xanh** · FE · O · nhánh `fix/ci-green`
  - Chạy `bun run test` (không song song với `tsc -b`). Ghi nhận từ phiên trước: test `api-client`, `graphql-client`, `campaign-api`, `notification-api` đỏ sẵn.
  - Sửa nguyên nhân gốc. `src/test/mui-icon-imports.test.ts` chập chờn khi máy tải nặng — chạy riêng để xác nhận trước khi kết luận.
  - Xong khi: `bun run typecheck`, `bunx eslint .`, `bun run verify`, `bun run test`, `bun run build` đều thoát mã 0.

---

## G1 — Lỗi P0 ngoài phần tải

- [ ] **G1-01 · Mở camera và định vị cho chấm công** · FE · S · nhánh `fix/permissions-policy-timekeeping` · BUG-01
  - Sửa `deploy/nginx/security-headers.conf:5` và `vercel.json` (khoá `Permissions-Policy`) thành `camera=(self), microphone=(), geolocation=(self)`.
  - Kiểm: `docker compose up --build`, mở trang chấm công, `curl -sI http://localhost/ | grep -i permissions-policy`; trong console trình duyệt `await navigator.permissions.query({name:"camera"})` không trả `denied` do policy.
  - Xong khi: camera trực tiếp và định vị hoạt động trên bản build chạy qua nginx container.

- [ ] **G1-02 · Bật CSP cưỡng chế** · FE · O · nhánh `fix/enforce-csp` · SEC-01
  - Tạm đổi header thành `Content-Security-Policy` trong `security-headers.conf`, build, chạy container, đi qua: đăng nhập 4 cổng, trang chủ học sinh, làm một bài có ảnh/âm thanh, ngân hàng câu hỏi, xem PDF (`pdfjs-dist` cần `worker-src 'self' blob:`), lịch, chấm công, bật thông báo đẩy.
  - Ghi mọi vi phạm trong console. Sửa nguồn vi phạm trước; chỉ nới policy khi buộc phải (ví dụ `media-src`/`img-src` cho miền R2, `connect-src` cho FCM nếu bật push). Không thêm `'unsafe-inline'` hay `'unsafe-eval'` vào `script-src`.
  - Thêm `object-src 'none'`. Áp cùng giá trị cho `vercel.json`.
  - Xong khi: không còn vi phạm ở các luồng trên; header cưỡng chế ở cả hai file; có test/skript `scripts/` kiểm tra hai file dùng cùng một chuỗi CSP.

- [ ] **G1-03 · Bỏ các lời gọi endpoint không tồn tại** · FE · O · nhánh `fix/access-management-endpoints` · DATA-02, DATA-03, CODE-03
  - Đọc `04-dong-nhat-du-lieu.md` mục 2.4. Với từng hàm trong `src/features/lcms/admin-operations/api/access-management-api.ts` (dòng 260, 273, 315, 354, 361, 369): tìm thao tác tương đương trong `src/features/access-management/api/access-management-api.ts`. Có → chuyển component `user-access-control-*.tsx` sang dùng. Không có và BE cũng không có → ẩn chức năng, hiện trạng thái "chưa hỗ trợ" (dùng component trạng thái rỗng sẵn có trong `erg-mui`), ghi vào `Kết quả:` để lên kế hoạch BE.
  - `src/features/lms/infrastructure/lms-dashboard-api.ts:247,265`: đổi sang `/api/v1/lms/education-units` nếu contract có POST/PATCH; nếu không thì ẩn nút tạo/sửa.
  - Xoá file cũ khi không còn import; xoá khối `legacy` và các khoá `legacy*` trong `src/lib/api/api-endpoints.ts`.
  - Xong khi: script so endpoint (mục 2.4) chỉ còn các tiền tố gốc; mở màn hình phân quyền trên dev với BE thật không có request 403/404 nào trong tab Network.

- [ ] **G1-04 · Sao lưu ra ngoài máy, có mã hoá** · BE · S · nhánh `ops/offsite-backup` · OPS-02, SEC-08
  - Sửa `ops/backup/backup.sh`: sau khi tạo `pg_full_$DATE.sql.gz`, mã hoá bằng `age -r "$BACKUP_AGE_RECIPIENT"`, đẩy lên `rclone copy` tới remote `$BACKUP_RCLONE_REMOTE` (bucket R2 riêng, khác bucket media). Bỏ `-a "$REDIS_STATE_PASSWORD"` (container đã có `REDISCLI_AUTH`).
  - Giữ: 7 bản ngày + 4 bản tuần + 6 bản tháng trên remote; cục bộ giữ 7 ngày như cũ.
  - Ghi thêm chỉ số `erg_backup_offsite_last_success_timestamp_seconds` vào file `.prom`; thêm cảnh báo trong cấu hình Prometheus khi quá 26 giờ.
  - Cập nhật `ops/backup/restore-drill.md`: các bước tải về, giải mã, khôi phục vào container tạm, đếm dòng vài bảng chính.
  - Khoá bí mật `age` **không** nằm trên máy chủ và không vào repo. Thêm biến mẫu vào `.env.production.example`.
  - Xong khi: chạy script trên môi trường dev với remote thử, khôi phục thành công từ file đã mã hoá, ghi thời gian khôi phục vào `Kết quả:`.

- [ ] **G1-05 · Nới giới hạn theo IP, sửa upload** · BE (+FE) · O · nhánh `fix/rate-limit-school-nat` · OPS-01, OPS-03, SEC-02
  - Thứ tự bắt buộc: **SEC-02 trước** (kiểm chữ ký trước khi đọc thân trong `J/controller/lcms/LcmsMediaController.java:47-58`, có test) → rồi mới thêm `client_max_body_size 4m`.
  - `ops/docker/nginx/native.conf`: các giá trị ở `03-hieu-nang-2000ccu.md` mục 5. `.env.production.example`: `ERG_AUTH_LOGIN_RATE_LIMIT_SOURCE_PER_MINUTE=600`.
  - Kiểm tra test hợp đồng nginx/k6 hiện có không bị vỡ (`grep -rn "erg_login\|limit_req" src/test scripts`).
  - FE (PR riêng, nhánh `feat/handle-429`): trong lớp API client, khi nhận 429 có `Retry-After` ≤ 10 thì chờ và thử lại một lần cho request GET; hiển thị toast "Hệ thống đang đông, vui lòng thử lại sau N giây" cho trường hợp còn lại. Một test.
  - Xong khi: kịch bản k6 đăng nhập 100 lượt trong 10 giây từ một IP không có 429 nào; dò mật khẩu một tài khoản vẫn bị chặn sau 5 lần sai.

- [ ] **G1-06 · Thống nhất điểm trung bình lớp** · BE · O · nhánh `fix/class-average-latest-attempt` · DATA-01 (phần 1)
  - `J/lms/persistence/AttemptRepository.java:427-441`: nối `LatestHandedInAttempt.OF_ATTEMPT` vào `summarizeClassWorkspaceScores` như đã làm ở dòng 467-468.
  - Test tích hợp: một học sinh nộp 40, 60, 90 cùng một bài → điểm TB lớp = 90, số lượt tính = 1.
  - Kiểm tra cache `lmsClassWorkspace` có bị xoá khi học sinh nộp lại không (`J/lms/LmsReadCacheInvalidator.java`).
  - Xong khi: test xanh; ghi con số trước/sau trên dữ liệu thử vào `Kết quả:`.

- [ ] **G1-07 · Học sinh không bao giờ bị onboarding / ép đổi mật khẩu / xác thực email** · BE rồi FE · O · nhánh `fix/student-lifecycle-exempt` · STU-01
  - Đọc `01-phat-hien.md` mục 0 và STU-01. Làm đúng 6 bước sửa theo thứ tự; viết 4 test bắt buộc **trước** khi sửa (phải đỏ trước, xanh sau).
  - Trước khi viết migration: đếm trên DB thử số tài khoản bị ảnh hưởng và ghi vào `Kết quả:`

    ```sql
    select count(*) from users u
    where exists (select 1 from user_role_assignments a where a.user_id = u.id and a.role_id = 'role_lms_student' and a.revoked_at is null)
      and not exists (select 1 from user_role_assignments a where a.user_id = u.id and a.role_id <> 'role_lms_student' and a.revoked_at is null)
      and (u.must_change_password or not coalesce(u.is_profile_completed, false) or not coalesce(u.recovery_email_verified, false));
    ```

    (Kiểm tra lại tên cột và cả bảng nối `user_roles` nếu vai trò còn được gán theo đường cũ — `ErgPrincipalService.roles` đọc cả `user.getRoles()` lẫn `UserRoleAssignment`.)
  - Tìm mọi nơi khác đọc ba cờ: `grep -rn "getMustChangePassword\|getIsProfileCompleted\|getRecoveryEmailVerified" J/` — mỗi kết quả phải đi qua hàm chính sách mới hoặc được ghi lý do vì sao không cần.
  - FE: `src/platform/auth/components/portal-route-gates.tsx` (`needsOnboarding`), `src/platform/auth/router/auth-route-context.ts`, `src/routes/portals/auth-routes.tsx` (route `/onboarding`: học sinh vào đây thì chuyển về trang chủ học sinh).
  - Xong khi: 4 test BE + test FE xanh; đăng nhập thử trên localhost bằng một học sinh có `must_change_password=true` trong DB thử → vào thẳng trang chủ học sinh, không có request nào trả `ACCOUNT_LIFECYCLE_RESTRICTED`.

- [ ] **G1-08 · Học sinh đi nhầm cổng thì tự về cổng học sinh** · FE · O · nhánh `fix/student-wrong-portal-redirect` · STU-02
  - Sửa `throwAuthRedirect` trong `src/app/router/route-guards.ts` và nhánh từ chối trong `PortalAuthGate` (`portal-route-gates.tsx:77-79`). Dùng một hàm chung `isStudentOnlySession(auth)` (đặt cạnh `hasAdminLikeClaims` trong `src/platform/auth/permissions/`), dựa trên `projectVerifiedWorkspaces`.
  - Đích: `/student` trên host LMS, `/` trên host học sinh (xem `enforceCanonicalWorkspaceHost`). Dùng `replace: true`.
  - Viết bảng test ở STU-02 trong `src/routes/` (có sẵn `admin-route-security.test.ts`, `app-routes.workspace.test.ts` làm mẫu). Cập nhật snapshot route nếu cần (file snapshot dùng LF).
  - Kiểm cả đường đăng nhập: học sinh đăng nhập ở form giáo viên phải đáp xuống trang chủ học sinh (`resolveWorkspaceLandingTarget`), không phải `/access-denied`.
  - Xong khi: test bảng xanh; kiểm tay trên localhost với tài khoản học sinh: gõ `/teacher/home`, `/admin` → về trang chủ học sinh, không nháy trang lỗi.

- [ ] **G1-09 · Khoá phạm vi API của token học sinh bằng test ma trận** · BE · O · nhánh `test/student-api-allowlist` · STU-03
  - Bước 1: liệt kê API cổng học sinh thật sự gọi (từ FE: `src/features/elearning/**`, `src/features/lcms/quiz/quiz-runtime/api/**`, `src/features/lcms/quiz/player/**`). Đó là danh sách cho phép.
  - Bước 2: test `@SpringBootTest` duyệt mọi mapping của `RequestMappingHandlerMapping` + mọi trường gốc trong `schema.graphqls`, gọi bằng principal có đúng 8 quyền của `role_lms_student`. Ngoài danh sách cho phép → phải 401/403 (không được 200, không được 500).
  - Bước 3: thu hẹp ngoại lệ trong `AuthorizationCapabilityPolicy.hasWorkspace` xuống các tiền tố trong danh sách cho phép. Giữ test `learnerReachesLmsApisWithoutBecomingATeacher`.
  - Xong khi: test ma trận xanh và đỏ đúng khi thử bỏ một chú thích quyền ở một endpoint giáo viên.

- [ ] **G1-10 · Quyền tự phục vụ của học sinh** · BE+FE · S · STU-04 — **chờ chủ dự án chọn (a) hoặc (b)**
  - Trước khi hỏi: mở cổng học sinh trên localhost, xem tab Network có request nào 403 không (`/users/me`, `/notifications/*`, `/notification-devices`). Ghi danh sách vào câu hỏi.

### G1 bổ sung — từ kiểm tra máy chủ production (11/11/2026)

Thứ tự ưu tiên trong nhóm này: `G1-12` (khoá SSH) và `G1-11` (lỗi 500 gói đề) làm **trước mọi task G1 khác**.

- [ ] **G1-11 · Sửa lỗi 500 khi mở gói đề bài** · BE · O · nhánh `fix/quiz-package-cache-type` · SRV-01
  - Viết test đỏ trước: `CacheDescriptorContributorTest` mã hoá một `QuizPackageResponse` thật qua descriptor `quizRuntimePackage` → hiện đang ném `IllegalArgumentException`.
  - Sửa `J/config/LmsCacheDescriptorContributor.java:30,37` theo SRV-01 bước (1); sửa `ErgTieredCache.put` theo bước (2); thêm ca test ở `ErgTieredCacheTest`.
  - Mở rộng test: duyệt **mọi** descriptor, mã hoá rồi giải mã một giá trị mẫu đúng kiểu trả về của phương thức `@Cacheable` tương ứng.
  - Xong khi: test xanh; sau deploy, `docker logs erg-nginx-1 --since 24h | grep '/package' | grep -c '" 500 '` = 0 và Redis cache có key của `quizRuntimePackage`.

- [ ] **G1-12 · Khoá đường SSH vào máy chủ** · việc tay của chủ dự án · SRV-02
  - Làm đúng 4 bước ở SRV-02. Agent **không** tự đổi mật khẩu hay sửa `sshd_config` trên production; agent chỉ chuẩn bị file cấu hình và lệnh kiểm tra để chủ dự án chạy.
  - Xong khi: `sshd -T | grep passwordauthentication` → `no`; `ssh` từ một máy không có khoá bị từ chối ngay; `curl -sI https://ssh.erg.edu.vn/` chuyển hướng sang trang đăng nhập Cloudflare Access.

- [ ] **G1-13 · Cấu hình gửi email thật** · chủ dự án cấp thông tin + việc tay · SRV-03
  - Phụ thuộc câu hỏi mở số 0. Sau khi có SMTP: gửi thử thư xác thực tới một hộp thư của chủ dự án; kiểm 12 tài khoản `recovery_email_verified=false`.
  - Xong khi: log backend không có lỗi gửi thư; một tài khoản thử hoàn tất xác thực email từ đầu đến cuối.

- [ ] **G1-14 · Xoay mật khẩu Postgres và Redis** · việc tay ngoài giờ + PR sửa file mẫu · SRV-04
  - PR (BE, nhánh `ops/env-example-no-usable-defaults`): để trống 4 mật khẩu trong `.env.production.example`; `deploy.sh` dừng nếu biến nào trong 4 biến trống hoặc trùng giá trị mẫu cũ.
  - Việc tay: theo SRV-04. Chạy `backup.sh` trước. Sau đó chạy 4 lệnh kiểm tra ở `05` mục 4.
  - Xong khi: so `.env.production` với file mẫu không còn khoá bí mật nào trùng; backend và 3 exporter đều `up` trong Prometheus.

- [ ] **G1-15 · Chốt nơi lưu ảnh chấm công trước khi bật chấm công** · BE + việc tay · O · nhánh `fix/tk-photo-storage-guard` · SRV-05
  - Code: kiểm tra khởi động như SRV-05 mô tả, kèm test. Xác minh luôn đường tải media của LCMS khi R2 trống.
  - Việc tay: cấu hình R2 hoặc volume + sao lưu; đặt `SECRET_TK_PHOTO_URL_SIGNING_KEY`.
  - Xong khi: chấm công thử một lượt, deploy lại, ảnh vẫn mở được.

- [ ] **G1-16 · Redis state không vượt giới hạn container** · BE · S · làm chung với `G2-03` · SRV-06

- [x] **G1-17 · Học sinh gọi được API `/api/v1/lms` trên `main`; CI `main` xanh lại** · BE · O · nhánh `fix/learner-lms-api-access` · BUG-02
  - Sửa `AuthorizationCapabilityPolicy.hasWorkspace` (cùng dòng với `f29cca4` trên `feat/timekeeping`), sinh lại checksum schema GraphQL.
  - Xong khi: PR gộp vào `main`, CI `main` xanh ở ba job "Compile, architecture and integration", "Portal contract — lms", "OpenAPI contract lock and compatibility". Không deploy `main` trước đó.
  - Tiến độ 11/11/2026 (Fable 5.2): đã mở PR https://github.com/eduriseglobalvn/erg-spring-boot/pull/16 (commit `4566b5e`, `79c01ec`). Đã tái hiện lỗi trên máy; test mới thất bại trước khi sửa và đạt sau; chạy tay 114 bộ test (LMS, e-learning, bảo mật), 397 test, không lỗi. 
  - Kết quả: PR https://github.com/eduriseglobalvn/erg-spring-boot/pull/16 · merge 11/11/2026 (`b764c52`) · bởi Fable 5.2. Trước: CI `main` đỏ 3 job, học sinh nhận 403 `PORTAL_SESSION_MISMATCH` trên `/api/v1/lms`. Sau: CI của PR xanh 8/8 (gồm `./mvnw verify` và test tích hợp). Chưa làm / còn lại: chưa xem kết quả lần chạy CI trên chính `main` sau khi gộp; chưa thử đăng nhập học sinh thật; chưa deploy.

---

## G2 — Hiệu năng tới 2000 CCU

Đọc `03-hieu-nang-2000ccu.md` trước. Mỗi task ghi **số đo trước và sau**.

- [ ] **G2-01 · Viết kịch bản k6 còn thiếu và đo nền** · BE · O · nhánh `perf/k6-exam-scenarios` · PERF-10
  - Viết `load/k6/erg-login-storm.js`, `erg-exam-session.js`, `erg-teacher-progress.js` theo bảng ở `03` mục 7, theo kiểu của `erg-5k-steady.js`. Token/tài khoản lấy từ `load/fixtures/manifest.yaml`.
  - Đo nền ở 200 / 500 / 1000 VU trên máy đích (hoặc máy tương đương, ghi rõ cấu hình). Lưu `load/results/<ngày>-baseline/` (thư mục này bị gitignore — đính kèm bản tóm tắt vào PR).
  - Xong khi: có bảng số nền cho S1–S5 và biết kịch bản nào rớt trước, ở bao nhiêu VU.

- [ ] **G2-02 · Cache principal, bỏ resolve trùng** · BE · O · nhánh `perf/principal-cache` · PERF-01
  - Bước 1 (test trước): test tích hợp đếm số câu SQL cho một request GET có xác thực (Hibernate `Statistics` + đếm lời gọi `JdbcTemplate`). Ghi con số hiện tại.
  - Bước 2: `ErgPrincipalService.fromBearerToken(token, tenant)` — thêm overload nhận tenant đã resolve để `ErgAuthenticationFilter:128` không gọi `resolveTenantId` lần hai (dòng 67).
  - Bước 3: cache Caffeine `hash token → ErgPrincipal`, `expireAfterWrite 30s`, `maximumSize 10_000`. Chỉ cache kết quả **thành công**. Khoá là hash, không phải token thô.
  - Bước 4: xoá mục cache khi: logout, logout-all, thu hồi phiên, phiên bị thay thế (`session_replaced`), đổi vai trò/quyền/trạng thái người dùng, đổi mật khẩu. Tìm các điểm này: `grep -rn "setRevokedAt\|revokedReason\|status_changed_inactive" J/`. Đa instance: phát qua `RedisCacheGenerationService`; một instance: xoá trực tiếp.
  - Bước 5: test bảo mật — sau logout, request kế tiếp với token cũ phải 401 **ngay** (không chờ 30 s); sau khi bị khoá tài khoản, tối đa 30 s.
  - Bước 6: ghi chính sách vào `docs/architecture/module-cache-descriptors.md`.
  - Xong khi: số câu SQL xác thực mỗi request (cache ấm) = 0; test thu hồi phiên xanh; S1 cải thiện có số đo.

- [ ] **G2-03 · Cấu hình Postgres và ngân sách RAM** · BE · S · nhánh `perf/postgres-memory-budget` · PERF-02, PERF-07
  - Số thật trên production (11/11/2026, `01` mục G.1): Postgres và nginx chưa có `mem_limit`; backend 1 bản 4 GB; Redis state `maxmemory 768mb` > giới hạn 512 MB (SRV-06); thêm `statement_timeout`, `idle_in_transaction_session_timeout`, `log_min_duration_statement=500` vào cấu hình Postgres. Các biến `BACKEND_CONTAINER_MEMORY`, `SPRING_THREADS_VIRTUAL_ENABLED` chưa có trong `.env.production` — thêm vào file mẫu.
  - Áp `03` mục 3 và 4 vào `ops/docker/compose.yml`, `compose.native.yml`, `redis/cache.conf`, `redis/state.conf`, `.env.production.example`, và `compose.benchmark.yml` (để đo đúng cấu hình sẽ chạy).
  - Chạy `docker compose ... config --quiet`; khởi động stack benchmark; `show shared_buffers; show random_page_cost;` ra đúng giá trị.
  - Cập nhật `ops/docker/README.md` phần production (bảng bộ nhớ).
  - Xong khi: stack khởi động sạch; tổng `mem_limit` ≤ 12,5 GB; đo lại S1, S3.

- [ ] **G2-04 · Giới hạn băm mật khẩu đồng thời** · BE · O · nhánh `perf/argon2-concurrency` · PERF-03
  - `J/auth/internal/credential/PasswordService.java`: `Semaphore(8, true)` quanh `encode` và `matches` (kể cả nhánh băm giả chống dò thời gian). `tryAcquire(2, SECONDS)`; hết hạn ném ngoại lệ ánh xạ sang 429 + `Retry-After: 2`. Số 8 lấy từ cấu hình `erg.auth.password-hash-concurrency`.
  - Test: 50 luồng gọi `matches`; số luồng đồng thời trong vùng găng ≤ 8.
  - Xong khi: S2 (đăng nhập dồn dập) không OOM, heap đỉnh ghi vào `Kết quả:`.

- [ ] **G2-05 · Giảm tần suất và kích thước lưu nháp** · FE · O · nhánh `perf/draft-save-cadence` · PERF-04
  - `src/features/lcms/quiz/player/player-shell-runtime/use-player-sync-effects.ts`: debounce 5000 ms; lưu ngay khi đổi câu, khi `document.visibilityState` thành `hidden`, và trước khi nộp.
  - Chỉ gửi các câu đã đổi kể từ lần lưu thành công gần nhất (giữ bản chụp đã lưu trong ref, so từng `questionId`; câu bị xoá gửi `null`). BE đã gộp theo từng câu trong `saveDraft` — không cần sửa BE. Xác nhận lại bằng test BE hiện có hoặc thêm một test: lưu `{q1}` rồi `{q2}` → bài làm có cả hai.
  - Bỏ `events` khỏi payload nháp sau khi xác nhận `saveDraft` không dùng (`grep -n "events()" LmsAttemptUseCase.java`). Sự kiện vẫn đi theo đường `sync`/nộp bài.
  - Không được làm mất tính năng đã có: reload/thoát ra vào lại vẫn còn câu trả lời (đã kiểm ở phiên 10/11 — chạy lại `player-submit-visibility.test.tsx` và test của `local-quiz-attempt-store`).
  - Xong khi: test mới khẳng định 10 thay đổi liên tiếp trong 3 giây chỉ tạo 1 request; kiểm tay trên dev: gõ, reload, câu trả lời còn.

- [ ] **G2-06 · Index cho `student_progress`** · BE · S · nhánh `perf/student-progress-index` · PERF-08
  - Migration mới (số kế tiếp trong `src/main/resources/db/migration/postgres/`): `create index if not exists idx_student_progress_tenant_assignment on student_progress (tenant_id, assignment_id);` Bản online `create index concurrently` đặt ở `ops/postgres/online/<ngày>-student-progress-tenant-assignment.sql` để chạy tay trên production trước khi deploy.
  - Chụp `EXPLAIN (ANALYZE, BUFFERS)` của `summarizeAssignment` trước/sau trên dữ liệu `seed-postgres-scale.sql`.
  - Xong khi: kế hoạch truy vấn dùng index mới; test khoảng trống Flyway xanh.

- [ ] **G2-07 · Xoá cache theo phạm vi cho lệnh LMS** · BE · O · nhánh `perf/scoped-cache-eviction-lms` · PERF-05
  - Phạm vi đợt này: 12 chỗ trong `J/lms/internal/core/LmsOperationalCommandService.java` và các chỗ trong `StudentGroupCommands.java`. Dùng cơ chế của `J/lms/LmsReadCacheInvalidator.java` (xoá theo tenant + trường/lớp).
  - Test: tenant A sửa lớp → mục cache của tenant B vẫn còn.
  - Các file còn lại (authoring, calendar, curriculum, school, learningcontent): tạo task con G2-07b sau khi có số đo cho thấy cần.
  - Xong khi: `grep -c "allEntries = true"` trong hai file trên = 0; test cách ly tenant xanh.

- [ ] **G2-08 · Virtual thread và pool** · BE · O · nhánh `perf/virtual-threads-pool` · PERF-06
  - Bật `SPRING_THREADS_VIRTUAL_ENABLED=true`, pool 16, `connection-timeout` 2000 trong file mẫu và compose benchmark.
  - Chạy S3 ở 1000 VU với `-Djdk.tracePinnedThreads=short`; có pinning lặp lại ở đường nóng → ghi lại và dừng, không tự sửa thư viện.
  - Kiểm tra `TenantContext` (ThreadLocal) vẫn đúng với virtual thread: chạy bộ test cách ly tenant.
  - Xong khi: S1/S3 không tệ hơn trước; không có lỗi lẫn tenant.

- [ ] **G2-09 · Đo chấp nhận 2000 CCU** · BE · O · PERF-10
  - Chạy đủ S1–S5 ở 2000 VU và ngâm 2 giờ ở 1000 VU theo `03` mục 7, trên máy đích, máy phát tải riêng.
  - Chưa đạt: lấy 3 truy vấn đứng đầu `ops/postgres/top-queries.sql`, tạo task G2-10.. cho từng cái, lặp lại.
  - Xong khi: mọi ngưỡng ở `03` mục 2 đạt; kết quả tóm tắt đưa vào `docs/performance/` của BE; hoặc có kết luận bằng số liệu rằng phải theo `03` mục 8.

---

## G3 — Đồng nhất dữ liệu

- [ ] **G3-01 · Xếp loại và ngưỡng điểm về một nơi** · FE+BE · O · nhánh `fix/grade-band-single-source`
  - `src/features/lms/classroom/components/class-management-page.tsx:445-448` tự tính A/B/C/D/E. Tìm mọi nơi khác có ngưỡng 90/80/70/60 (`grep -rnE ">= ?(90|80|70|60)" src/features J/`). Chọn một nơi (ưu tiên BE trả `gradeBand`); nếu để FE thì một hàm duy nhất có test trong `src/domain/`.

- [ ] **G3-02 · `student_progress` khớp `lms_attempts`** · BE · O · nhánh `fix/student-progress-score-source` · DATA-01 (phần 2)
  - Làm đúng 4 bước ở `04` mục 2.2. Đồng thời sửa `QuizReportService.java:98,124,135` còn một nhánh tính.
  - Soát luôn cột "đã nộp" chỉ đếm `submitted` (`04` mục 2.3): dùng `LmsStatePolicy.completedAttemptStates()`.

- [ ] **G3-03 · BE trả cờ `handedIn`, FE bỏ danh sách trạng thái** · BE rồi FE · S · DATA-07
  - BE: thêm trường vào card bài giao (GraphQL), cập nhật schema + checksum theo `docs/api-contract-workflow.md`. FE: đồng bộ contract, dùng trường mới, xoá `HANDED_IN_STATES` ở `student-dashboard-api.ts:200`, cập nhật test.

- [ ] **G3-04 · Script chặn endpoint ngoài contract** · FE · S · nhánh `chore/endpoint-contract-gate` · DATA-02
  - Thêm `scripts/check-api-endpoints-in-contract.mjs` (logic ở `04` mục 2.4, cho phép danh sách tiền tố gốc), nối vào `bun run verify`. Có test `node --test`.

- [ ] **G3-05 · Thông báo không dùng dữ liệu giả ở production** · FE · O · nhánh `fix/notification-mock-gate` · DATA-05
  - Đọc `notification-api.ts`, `notification-feed-api.ts`, `notification-device-api.ts`: ghi điều kiện dùng kho giả. Chỉ cho phép khi `runtimeFixturesEnabled()`. Dùng `import()` động trong nhánh dev để bundler loại khỏi bản production. Thêm bước CI grep `dist/` tìm một chuỗi đặc trưng của fixture.

- [ ] **G3-06 · Danh sách bài của học sinh quá 50 mục** · FE (+BE) · S · DATA-06
  - Kiểm tra FE có dùng `nextCursor`. Chưa → thêm "Xem thêm" ở tab Bài tập và Bài đã nộp. Test với 60 bài.

- [ ] **G3-07 · Soát các màn hình CHƯA SOÁT** · FE+BE · O · mỗi nhóm màn hình một PR
  - Theo `04` mục 4, đúng thứ tự 6 nhóm. Cập nhật bảng `04` mục 2 (đây là ngoại lệ được sửa file `04`). Mỗi chỗ lệch tìm thấy: thêm mục `DATA-xx` vào cuối `01-phat-hien.md` và một task G3-xx ở đây.

- [ ] **G3-08 · Độ trễ theo màn hình** · FE · S · DATA-08
  - Với mỗi dòng ở `04` mục 3 có cột "Cần thêm": kiểm tra và bổ sung `invalidateQueries` / nút làm mới / nhãn thời điểm cập nhật.

- [ ] **G3-09 · Múi giờ và hạn nộp** · FE+BE · O
  - Chạy hai lệnh grep ở `04` mục 5; soát hạn nộp, "hôm nay" của chấm công, ranh giới ngày trong báo cáo. Mỗi lỗi một test.

- [ ] **G3-10 · Tìm nguyên nhân 409 khi bắt đầu làm bài** · BE+FE · O · SRV-09
  - Lấy mã lỗi của các 409 trên `POST /api/v1/lms/attempts` (log backend theo `requestId`); đối chiếu `LmsAttemptUseCase.start` và nơi FE gọi. Ghi kết luận vào `04` rồi mới sửa.

---

## G4 — Bảo mật còn lại và triển khai

- [ ] **G4-01 · Guard trusted-header cho mọi profile ngoài `test`** · BE · S · nhánh `fix/trusted-header-guard` · SEC-03
- [ ] **G4-02 · Nâng phụ thuộc FE, thêm audit vào CI** · FE · S · nhánh `chore/deps-audit` · SEC-04
  - `bun audit fix`; nâng `@tanstack/react-router`, `pdfjs-dist`, `vite`, `vitest`, `@graphql-codegen/cli`. Chạy đủ FE-CHECK + `bun run build` + `bun run budget:check`. Thêm `bun audit --audit-level=high` vào CI; ngoại lệ ghi trong file có lý do và ngày hết hạn.
- [ ] **G4-03 · "Ghi nhớ đăng nhập" ở cổng học sinh** · FE · S · SEC-05 — **chờ chủ dự án quyết định**
- [ ] **G4-04 · Kiểm `/metrics` công khai** · BE · S · SEC-06
- [ ] **G4-05 · Ghim SHA cho Actions của BE; thêm gitleaks cho FE** · BE+FE · S · SEC-07, SEC-09
- [ ] **G4-06 · Chặn deploy trong giờ học** · BE · S · nhánh `ops/deploy-window` · OPS-04
- [ ] **G4-07 · Hoàn thiện triển khai máy nhà** · BE+FE · S/O
  - Làm lần lượt checklist ở `05-trien-khai-vps-nha.md` mục 9; mỗi mục chưa đạt là một PR nhỏ hoặc một việc tay trên máy chủ (ghi lại lệnh đã chạy vào `Kết quả:`).
- [ ] **G4-08 · Diễn tập dựng lại trên AWS từ bản sao lưu** · O · OPS-06
  - Theo `06-trien-khai-aws.md` mục 6. Đo thời gian từ lúc bắt đầu tới lúc đăng nhập được. Mục tiêu ≤ 4 giờ.
- [ ] **G4-09 · Triển khai Salesforce/Heroku** — **chỉ làm khi chủ dự án xác nhận câu hỏi mở số 1** · `07-trien-khai-salesforce.md`

- [ ] **G4-10 · Grafana sau Access, rút CORS, bật HSTS** · việc tay + BE/FE · S · SRV-07
  - Access cho `monitor.erg.edu.vn` làm cùng lúc `G1-12`. CORS: sửa trên máy chủ và trong file mẫu. HSTS: bật ở Cloudflare.
  - Xong khi: `curl -sI https://monitor.erg.edu.vn/` chuyển sang Access; `curl -sI https://api.erg.edu.vn/ready | grep -i strict-transport` có kết quả.
- [ ] **G4-11 · Chỉnh hệ điều hành, dọn cấu hình thừa, bổ sung cảnh báo** · việc tay + BE · S · SRV-08, SRV-10, SRV-11
  - Mỗi thay đổi trên máy chủ ghi lệnh đã chạy vào `Kết quả:`. Xoá `compose.watchtower.yml` bằng PR. Thêm luật cảnh báo bằng PR vào `ops/docker/monitor/prometheus/alerts.yml`.

### G4 bổ sung — bot vận hành báo đủ sự kiện (`01` mục H)

Mã bot: `F:\ERG\erg-spring\ops\bot` (Go, chỉ thư viện chuẩn, không thêm dependency). Build và test theo `ops/bot/README.md` (`go test ./...` trong container `golang`). Mọi tin nhắn viết bằng tiếng Việt, theo kiểu các tin đang có trong `watchdog.go`. **Cài bản bot mới lên máy chủ là thay đổi production: chỉ làm khi chủ dự án đồng ý, ngoài giờ học.** Không chạy bản bot thứ hai với cùng token (README của bot).

- [ ] **G4-12 · Báo khi máy chủ chết: heartbeat ra ngoài + tin khởi động lại** · BE (`ops/bot`) + việc tay · O · nhánh `ops/bot-heartbeat` · BOT-01, BOT-05
  - Code: goroutine `heartbeat` gọi `BOT_HEARTBEAT_URL` mỗi 60 giây (bỏ qua nếu biến trống); file `last-alive`; tin khởi động phân biệt "máy khởi động lại" và "bot khởi động lại" kèm thời gian ngừng. Test đơn vị cho phần tính thời gian ngừng.
  - Việc tay của chủ dự án: tạo một "check" ở dịch vụ giám sát ngoài (chu kỳ 1 phút, ân hạn 3 phút, kênh Telegram), dán URL vào `/opt/erg/bot/bot.env`; đặt 2 secret Telegram cho repo BE (`gh secret set TELEGRAM_BOT_TOKEN`, `gh secret set TELEGRAM_CHAT_ID`).
  - Xong khi: `systemctl stop erg-ops-bot` 4 phút (ngoài giờ) → có tin "mất heartbeat" từ dịch vụ ngoài; bật lại → có tin phục hồi và tin "Bot khởi động lại (máy chủ vẫn chạy)"; chạy tay `uptime.yml` với URL sai tạm thời trên một nhánh thử → có tin Telegram.
  - Tiến độ 11/11/2026 (Fable 5.2): **đã viết mã và commit `a8462f9` trên nhánh `ops/bot-alerts` (chưa push, chưa cài lên máy chủ).** `ops/bot/notify.go` (`alive`, `bootMessage`, `lastAlive`, `hostUptime`), biến `BOT_HEARTBEAT_URL`, `BOT_ALIVE_FILE`; test `TestBootMessageTellsRebootFromBotRestart`. Còn lại: việc tay của chủ dự án (dịch vụ giám sát ngoài, 2 secret GitHub) và phép thử "Xong khi".

- [ ] **G4-13 · Báo deploy: bắt đầu, thành công, thất bại, rollback** · BE (`ops/docker/deploy.sh`, `ops/bot`) · S · nhánh `ops/deploy-notify` · BOT-02
  - `deploy.sh`: hàm `notify()` như `backup.sh:26-29` (token đi qua stdin của curl, không lộ trong `ps`); `trap ERR`; 3 loại tin theo BOT-02. Gửi tin không được làm deploy thất bại (`|| true`).
  - Bot: phát hiện đổi image trong `watchOnce` (thêm trường vào `svcState`), sửa nhãn `health: starting`, `/rollback` báo vào chat chung. Thêm ca test vào `bot_test.go` cho "image đổi → đúng một tin" và "starting dưới 3 phút → không báo lỗi".
  - Xong khi: deploy thử trên máy dev (`compose.dev.yml`) sinh đủ tin bắt đầu + thành công; cố ý làm hỏng một bước → có tin thất bại ghi đúng bước.
  - Tiến độ 11/11/2026 (Fable 5.2): **đã viết mã và commit `a8462f9` trên nhánh `ops/bot-alerts` (chưa push, chưa cài).** `deploy.sh` có `notify`/`on_error` (đã thử bằng curl giả: bắt đầu, xong, lỗi trước và sau khi đổi bản, không có token); bot báo `đổi bản A → B` rồi `bản mới đã chạy ổn` (`svcState.changes`), nhãn 🟡 cho `health: starting`. `/rollback` được báo qua chính tin đổi bản. Lưu ý: lần deploy đầu tiên mang `deploy.sh` mới vẫn chạy bản cũ trên máy chủ nên chưa có tin; từ lần sau mới có. Chưa thử deploy thật trên máy dev.

- [ ] **G4-14 · Báo khi hệ thống đứng mà container vẫn khoẻ** · BE (`ops/bot`) · O · nhánh `ops/bot-probes` · BOT-03
  - Trước khi code: xác minh `/ready` có kiểm DB và Redis không (đọc cấu hình readiness trong `application.yml` và lớp health tương ứng). Nếu không, chọn một endpoint đọc nhẹ đi tới DB cho phép thử (c).
  - Ba phép thử + danh sách container bắt buộc theo BOT-03. Mỗi phép thử một trạng thái riêng, 3 lần hỏng liên tiếp mới báo, báo một lần cho mỗi đợt hỏng, báo khi khoẻ lại. Test bảng trong `bot_test.go`.
  - Xong khi (ngoài giờ, trên production hoặc máy dev): `systemctl stop cloudflared` 2 phút → tin "tunnel hỏng, máy vẫn sống"; `docker pause erg-backend-1` 2 phút → tin "backend không trả lời"; cả hai có tin phục hồi.
  - Tiến độ 11/11/2026 (Fable 5.2): **đã viết mã và commit `a8462f9` trên nhánh `ops/bot-alerts` (chưa push, chưa cài).** Đã xác minh: `/ready` kiểm cả Postgres và Redis (`PlatformHealthController.java:55`), nhưng Redis hỏng vẫn trả 200 với `checks.redis=false`, nên container vẫn healthy; vì vậy probe đọc cả phần `checks`. Chỉ cần **hai** phép thử (không cần phép thử thứ ba đi tới DB): `BOT_PROBE_LOCAL_URL` (mặc định `http://127.0.0.1:8080/ready`, đã thử trên máy chủ: 200) và `BOT_PROBE_PUBLIC_URL` (mặc định `https://api.erg.edu.vn/ready`). Container bắt buộc: `BOT_REQUIRED_SERVICES` cộng mọi container bot từng thấy. Thêm: báo khi Docker không trả lời. Mã ở `ops/bot/probe.go`, `watchdog.go`; test `TestCheckReady`, `TestProbeMessagesSeparateBackendFromTunnel`, `TestWatchdogReportsNewImageAndMissingContainer`. Chưa làm phép thử "Xong khi" trên máy thật.

- [ ] **G4-15 · Không mất tin khi Telegram lỗi; thử đường Alertmanager** · BE (`ops/bot`) + việc tay · S · nhánh `ops/bot-notify-retry` · BOT-04, BOT-05
  - Hàng chờ gửi lại theo BOT-04, có test.
  - Việc tay ngoài giờ: gửi một cảnh báo giả `severity="warning"`, tên `TestAlert`, tới `http://127.0.0.1:9093/api/v2/alerts`; xác nhận tin tới Telegram cả lúc bắn lẫn lúc hết; ghi ảnh chụp/giờ vào `Kết quả:`.
  - Tiến độ 11/11/2026 (Fable 5.2): **đã viết mã và commit `a8462f9` trên nhánh `ops/bot-alerts` (chưa push, chưa cài).** Hàng chờ `outbox` trong `ops/bot/notify.go` (tối đa 200 tin, trong bộ nhớ, gửi lại 5 giây → 1 phút, tin trễ có ghi giờ xảy ra); `telegram.go` phân biệt lỗi tạm thời (mất kết nối, 429, 5xx) với lỗi vĩnh viễn. Việc tay được thay bằng lệnh bot `/testalert` (bắn alert `BotTestAlert` vào Alertmanager). Chưa chạy `/testalert` trên production.
  - Ghi chú chung G4-12 → G4-15: bốn task cùng sửa `watchdog.go` và `bot.go` nên nằm chung một commit `a8462f9` trên nhánh `ops/bot-alerts` của `F:ERGerg-spring`, tách từ `origin/main` (`a1ebab1`); gộp một PR thay vì bốn nhánh. Đã push và mở PR https://github.com/eduriseglobalvn/erg-spring-boot/pull/15 (11/11/2026), chưa merge. CI của repo không chạy `go test` cho `ops/bot`; test bot phải chạy tay theo lệnh trong `ops/bot/README.md`. Kiểm: `go vet` sạch, `go test ./...` đạt (chạy trong `golang:1.24-alpine`).

---

## G5 — Dọn dẹp và soát tiếp

- [ ] **G5-01 · Soát các vùng chưa phủ** · O
  - Danh sách ở `README.md` mục "Chưa làm". Mỗi module một lượt theo skill `ponytail:ponytail-audit`, kết quả thêm vào cuối `01-phat-hien.md` với mã mới. Ưu tiên: (1) IDOR — với mỗi endpoint nhận `{id}`, kiểm service có lọc theo tenant **và** theo quyền sở hữu; (2) timekeeping (ảnh riêng tư, URL ký); (3) reporting worker; (4) notification campaigns; (5) Tauri (`src-tauri/src`, `docs/security/desktop-threat-model.md`).
- [ ] **G5-02 · Xoá code thử nghiệm BE** · BE · S · CODE-01 — hỏi chủ dự án trước khi xoá.
- [ ] **G5-03 · Bỏ hai gói font thừa** · FE · S · CODE-02
- [ ] **G5-04 · Bỏ index thừa của `lms_attempts`** · BE · S · PERF-09 — chỉ sau khi có số `idx_scan` từ production ≥ 7 ngày.
- [ ] **G5-05 · Nén ở FE nginx** · FE · S · PERF-11 — chỉ khi `curl` cho thấy chưa nén.

---

## Mẫu ghi kết quả (dán dưới task khi xong)

```
Kết quả: PR <link> · merge <ngày> · bởi <model>
Trước: <số đo hoặc hiện tượng>
Sau:   <số đo hoặc hiện tượng>
Chưa làm / còn lại: <nếu có>
```
