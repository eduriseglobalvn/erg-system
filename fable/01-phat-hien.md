# 01 — Sổ phát hiện

Quy ước:

- **Mức độ:** `P0` chặn go-live · `P1` sửa trước khi có 2000 CCU · `P2` nên sửa · `P3` dọn dẹp.
- **Trạng thái bằng chứng:** `ĐÃ XÁC MINH` = đã đọc code/cấu hình hoặc đã đo. `CẦN XÁC MINH` = suy luận hợp lý, task tương ứng bắt đầu bằng bước kiểm chứng.
- BE = `F:\ERG\erg-spring`, FE = `F:\ERG\erg-system`. Đường dẫn Java rút gọn: `J/` = `src/main/java/com/erg/ergspringboot/`.
- Mã task tương ứng nằm trong `02-ke-hoach-thuc-thi.md`.

Tổng 60 mục: 16 mục P0, 22 mục P1, 15 mục P2, 7 mục P3. (43 mục từ đọc code ngày 10/11/2026 + 11 mục `SRV-*` từ kiểm tra máy chủ production ngày 11/11/2026 — mục G ở cuối file — + 5 mục `BOT-*` về bot vận hành và đường báo tin — mục H. Mục G cũng ghi những phát hiện cũ nào đã được xác nhận trên máy thật.)

---

## 0. Luật tài khoản học sinh (chủ dự án chốt 11/11/2026)

Luật, đúng theo lời chủ dự án:

1. Tài khoản học sinh **không** bị bắt onboarding, **không** bị bắt đổi mật khẩu, **không** bị bắt xác thực qua email.
2. Tài khoản học sinh **chỉ** vào được cổng học sinh.
3. Học sinh đi nhầm sang trang giáo viên hoặc quản trị thì **tự chuyển về cổng học sinh** (không dừng ở trang "không có quyền").

"Tài khoản học sinh" trong code = principal mà tập workspace chỉ gồm `STUDENT` (vai trò `lms.learner`, id `role_lms_student`). Người vừa là giáo viên vừa xem được cổng học sinh **không** thuộc luật này.

### STU-01 · P0 · Học sinh vẫn có thể bị khoá vào onboarding / đổi mật khẩu / xác thực email · ĐÃ XÁC MINH

- **Hiện trạng tốt:** `J/lms/internal/core/StudentAccountProvisioner.java:56-58` tạo học sinh với `isProfileCompleted=true`, `recoveryEmailVerified=true`, `mustChangePassword=false`.
- **Chỗ thủng — các đường khác bật lại cờ:**
  - `J/users/internal/create/UserProvisioningUseCase.java:103` — đặt lại mật khẩu cho **bất kỳ** tài khoản nào đều `setMustChangePassword(true)`. Giáo viên đặt lại mật khẩu cho học sinh → học sinh bị bắt đổi mật khẩu.
  - `J/users/internal/profile/UserProfileUseCase.java` hàm `apply` — sau mỗi lần sửa hồ sơ: `isProfileCompleted = có họ tên && có số điện thoại`. Học sinh không có số điện thoại sửa hồ sơ → thành "chưa hoàn tất".
  - `UserProvisioningUseCase.java:74-77` — tạo người dùng qua màn hình nhân sự rồi gán vai trò học sinh → trạng thái `INVITED`, `mustChangePassword=true`, email chưa xác thực.
  - Dòng dữ liệu học sinh cũ tạo trước khi có `StudentAccountProvisioner`.
- **Hậu quả ở BE:** `J/platform/security/ErgPrincipalService.java` hàm `isLifecycleRestricted` (áp cho mọi tài khoản) → `ErgAuthenticationFilter.java:81-85` trả 403 `ACCOUNT_LIFECYCLE_RESTRICTED` cho mọi API trừ nhóm onboarding. Mà vai trò học sinh chỉ có 8 quyền (`elearning.announcement.read_self`, `elearning.assignment.read_self`, `elearning.dashboard.read`, `elearning.discussion.write_self`, `lms.assignment.read_self`, `lms.assignment.submit`, `lms.quiz.play`, `lms.schedule.read_self`), **không có** `profile.self` → các API onboarding (`/api/v1/users/me/**`) cũng 403. Học sinh kẹt hẳn, không tự gỡ được.
- **Hậu quả ở FE:** `src/platform/auth/components/portal-route-gates.tsx:61-62` và `src/app/router/route-guards.ts:133-134` đẩy sang `/onboarding` (trang của giáo viên: `teacher-onboarding-page.tsx`).
- **Sửa (một nơi quyết định, không vá từng đường):**
  1. BE: thêm một hàm duy nhất, ví dụ `StudentAccountPolicy.isStudentOnly(roles, permissions, denied)` dựa trên `WorkspaceCapabilityMapper.canonicalWorkspacesFromVerifiedGrants(...)` = đúng `[STUDENT]`.
  2. `ErgPrincipalService.isLifecycleRestricted` trả `false` khi `isStudentOnly`.
  3. `J/auth/internal/login/LoginResponseMapper.java:85-100` (`lifecycle(user)`): với học sinh trả `status=ACTIVE`, `nextSteps=[]`.
  4. `UserProvisioningUseCase.reset`: không bật `mustChangePassword` cho tài khoản học sinh.
  5. Migration mới (chỉ thêm): với mọi user có gán `role_lms_student` và không có vai trò nào khác, đặt ba cờ về trạng thái "đã xong". Chạy thử trên DB thử trước.
  6. FE (phòng thủ thêm): `needsOnboarding` và nhánh `"onboarding"` trả `false` khi workspace của phiên chỉ là `STUDENT`.
- **Test bắt buộc:** học sinh có `mustChangePassword=true` trong DB vẫn gọi được `/api/v1/lms/students/me/assignments` (200); giáo viên có cờ đó vẫn bị 403; đặt lại mật khẩu học sinh không bật cờ; đăng nhập học sinh trả `lifecycle.nextSteps=[]`.
- **Nếu bỏ qua:** Cả lớp bị khoá ngoài ngay sau khi giáo viên đặt lại mật khẩu hàng loạt trước giờ kiểm tra.

### STU-02 · P0 · Học sinh vào nhầm trang giáo viên/quản trị bị dừng ở "không có quyền" · ĐÃ XÁC MINH

- **Bằng chứng:** `src/app/router/route-guards.ts:104-112` (`authedBeforeLoad`) → `enforceWorkspaceRoute` → `throwAuthRedirect` (`:130-137`) chuyển tới `/access-denied`. `src/platform/auth/components/portal-route-gates.tsx:77-79` cũng dẫn tới `accessDeniedPath(...)`.
- **Sửa:** Trong `throwAuthRedirect` (nơi duy nhất mọi guard đi qua) và trong `PortalAuthGate`: nếu quyết định là `access-denied`, phiên đang đăng nhập và workspace của phiên chỉ là `STUDENT` → `redirect` về trang chủ học sinh (`/student`; trên host học sinh là `/`, xem `enforceCanonicalWorkspaceHost` cùng file), `replace: true`. Không áp dụng khi tài khoản bị khoá (`INACTIVE`/`BLOCKED`) — trường hợp đó vẫn tới `/access-denied`.
- **Tránh vòng lặp:** nếu chính route học sinh từ chối (thiếu quyền `elearning.dashboard.read`) thì tới `/access-denied`, không chuyển về `/student` lần nữa.
- **Test bắt buộc (bảng):** học sinh mở `/teacher/home`, `/admin`, `/admin/settings/roles`, `/onboarding`, một đường dẫn CRM, và một đường dẫn không tồn tại dưới `/teacher/...` → đều kết thúc ở trang chủ học sinh. Giáo viên mở `/admin` mà thiếu quyền → vẫn `/access-denied`. Chưa đăng nhập → `/login`.

### STU-03 · P1 · BE cho token học sinh đi qua cổng "lms" với mọi đường dẫn `/api/v1/lms/**` · ĐÃ XÁC MINH

- **Bằng chứng:** `J/platform/security/AuthorizationCapabilityPolicy.java` hàm `hasWorkspace`: `capability == TEACHER && workspaces.contains(STUDENT)` (thêm ở commit `f29cca4` vì API làm bài nằm dưới `/api/v1/lms`). `/api/v1/graphql` và `/api/v1/lcms/**` không có chốt cổng theo đường dẫn (`SecurityUtils.portalFromPath` trả `null`).
- **Đánh giá:** Hiện chưa thấy lỗ hổng: mọi endpoint REST của LMS/LCMS/chấm công đều có chú thích quyền (đã đếm: `LmsController` 17/17, `LmsAssignmentController` 7/7, `LmsOperationalCommandController` 10/12, `SchoolCommandController` 11/11, `LcmsQuizAuthoringController` 10/10, timekeeping 43/43), học sinh chỉ có 8 quyền, và thao tác trên bài làm kiểm chủ sở hữu (`LmsAttemptUseCase.mutable` → `policy.ensureAttemptAccess`). Nhưng luật "chỉ cổng học sinh" đang dựa hoàn toàn vào việc **không ai quên** chú thích ở endpoint mới.
- **Sửa:** (1) Thu hẹp ngoại lệ: chỉ cho `STUDENT` qua các tiền tố học sinh thật sự dùng (liệt kê từ FE: API bài làm, gói quiz, `students/me`). (2) Viết **một** test ma trận: lấy mọi mapping REST từ `RequestMappingHandlerMapping` và mọi trường gốc GraphQL, gọi bằng principal học sinh; ngoài danh sách cho phép thì phải 403. Endpoint mới quên chú thích sẽ làm test đỏ.

### STU-04 · P1 · Vai trò học sinh thiếu quyền cho các việc tự phục vụ · CẦN QUYẾT ĐỊNH

- **Bằng chứng:** 8 quyền ở STU-01. `SecurityConfig.java`: `/api/v1/users/me` cần `account.self.read`/`profile.self`; đổi mật khẩu cần `account.self.password.change`/`profile.self`; thông báo cần `lms.notification.read`/`profile.self`; đăng ký thiết bị nhận thông báo đẩy cần `profile.self`.
- **Hệ quả:** Học sinh không tự đổi được mật khẩu (kể cả khi muốn), không nhận được thông báo trong ứng dụng, không đăng ký được push.
- **Sửa:** Chủ dự án chọn: (a) giữ nguyên — học sinh không có các chức năng này, FE không được hiện nút/không gọi các API đó ở cổng học sinh; hoặc (b) thêm `account.self.read`, `account.self.password.change`, `lms.notification.read` cho `role_lms_student` bằng migration. **Không** thêm `profile.self` (quá rộng: mở cả phiên, thiết bị, email khôi phục).

---

## A. Hiệu năng và sức chịu tải

### PERF-01 · P0 · Mỗi request tốn ít nhất 4 câu SQL chỉ để xác thực · ĐÃ XÁC MINH

- **Là gì:** Token là chuỗi ngẫu nhiên, BE tra bảng `user_sessions` để biết ai đang gọi.
- **Bằng chứng:**
  - `J/platform/security/ErgAuthenticationFilter.java:123` gọi `resolveTenantId(token)` (SQL 1: `select public.erg_resolve_session_tenant(?)`).
  - `:128` gọi `fromBearerToken(token, tenant)`; bên trong `J/platform/security/ErgPrincipalService.java:67` **gọi lại** `resolveTenantId` (SQL 2, trùng SQL 1).
  - `ErgPrincipalService.java:72` → `AuthSessionRepository.findPrincipalByAccessTokenHashAndTenantId` (`J/users/persistence/auth/AuthSessionRepository.java:23-24`) với `@EntityGraph` nối 4 tập con cùng lúc: `user.roles`, `user.roles.permissions`, `user.permissionOverrides`, `user.accessScopes` (SQL 3). Số dòng trả về = tích các tập (ví dụ 2 vai trò × 60 quyền × 3 phạm vi = 360 dòng cho một người).
  - `ErgPrincipalService.java:192` → `userRoleAssignmentRepository.findActiveForUser` (SQL 4).
  - Mỗi transaction còn thêm `select set_config(...)` (`J/platform/security/TenantGucApplier.java`).
  - Không có cache principal: `grep -rn "cacheTokenHash\|PrincipalCache"` chỉ ra đúng một khai báo, không có nơi dùng.
  - Số đo trên Postgres dev (`pg_stat_statements`): `erg_resolve_session_tenant` 185 lần, trung bình 1,37 ms; câu nạp principal 78 lần → tỉ lệ ≈ 2,4 lần resolve cho một lần nạp, khớp với việc gọi trùng.
- **Vấn đề:** 2000 học sinh, mỗi người 1 request / 10 giây = 200 req/s → ≥ 800 câu SQL/s và 400 lượt mượn connection chỉ cho xác thực, trước khi làm việc thật. Pool production mẫu chỉ có 8 connection (`ops/docker/.env.production.example`: `DB__MAX_OPEN_CONNS=8`).
- **Sửa:** (1) Bỏ lần `resolveTenantId` thứ hai ở dòng 67 khi filter đã resolve. (2) Cache `ErgPrincipal` theo hash token trong Caffeine, TTL 30 giây, tối đa 10.000 mục; xoá mục khi logout / thu hồi phiên / đổi quyền qua kênh generation Redis sẵn có (`RedisCacheGenerationService`). (3) Tách entity graph: nạp session+user một câu, quyền một câu (hoặc dùng cache `authorizationRoles` đã có).
- **Nếu bỏ qua:** Đây là nút cổ chai đầu tiên. Giờ cao điểm pool hết connection, request chờ 5 giây rồi lỗi.
- **Lưu ý:** `AGENTS.md` cấm cache quyết định phân quyền "không có chính sách giới hạn rõ ràng". TTL 30 giây + xoá chủ động chính là chính sách đó; ghi vào `docs/architecture/module-cache-descriptors.md`.

### PERF-02 · P0 · Postgres production chạy cấu hình mặc định · ĐÃ XÁC MINH (trên compose) / CẦN XÁC MINH (trên máy chủ)

- **Bằng chứng:** `ops/docker/compose.yml:13-22` chỉ truyền `max_connections`, `shared_preload_libraries`, `pg_stat_statements.track`, `track_io_timing`. Không có `shared_buffers`, `work_mem`, `effective_cache_size`, `random_page_cost`. Postgres dev cùng image đo được: `shared_buffers=128MB`, `work_mem=4MB`, `random_page_cost=4`, `effective_io_concurrency=1`, `jit=on`.
- **Vấn đề:** Máy 16 GB mà Postgres chỉ dùng 128 MB bộ đệm; `random_page_cost=4` là giá của đĩa quay, khiến planner né index trên SSD.
- **Sửa:** Thêm các cờ trong `03-hieu-nang-2000ccu.md` mục 4 vào `command:` của service `postgres`.
- **Nếu bỏ qua:** Đọc đĩa nhiều gấp nhiều lần, p95 tăng theo số học sinh.

### PERF-03 · P1 · Băm mật khẩu Argon2 không giới hạn số luồng chạy cùng lúc · ĐÃ XÁC MINH

- **Bằng chứng:** `J/auth/internal/credential/PasswordService.java:11` dùng `Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()` (mỗi lần băm cấp 16 MB, 2 vòng). Không có semaphore quanh `matches`/`encode`. Tomcat cho 200 luồng (`application.yml:150`).
- **Vấn đề:** Đầu giờ 2000 học sinh đăng nhập. 150 lượt băm cùng lúc × 16 MB = 2,4 GB, vượt heap 2–3 GB → `OutOfMemoryError`, cả hệ thống rớt. Kẻ tấn công cũng làm được điều này bằng nhiều IP.
- **Sửa:** Bọc `matches`/`encode` trong `Semaphore(8)` có chờ tối đa 2 giây; quá hạn trả 429 `Retry-After: 2`. Một test: 50 luồng gọi `matches`, số luồng trong vùng găng không vượt 8.
- **Nếu bỏ qua:** Rớt hệ thống đúng lúc đông nhất.

### PERF-04 · P1 · Bài làm lưu nháp 1,5 giây một lần và gửi lại toàn bộ · ĐÃ XÁC MINH

- **Bằng chứng:** FE `src/features/lcms/quiz/player/player-shell-runtime/use-player-sync-effects.ts:52-73` — `setTimeout(..., 1500)`, payload gồm `answers` (tất cả câu) và `events: sessionSnapshot.clientEvents` (toàn bộ sự kiện từ đầu bài).
- **Vấn đề:** Học sinh gõ câu tự luận → cứ ngừng 1,5 giây là một lần PATCH. Payload lớn dần theo thời gian làm bài. BE ghi đè cả cột JSONB `answers`. 2000 học sinh có thể tạo vài trăm lượt ghi/giây lên một SSD SATA.
- **Sửa:** Debounce 5 giây; lưu ngay khi chuyển câu, khi `visibilitychange` sang `hidden`, và trước khi nộp. Chỉ gửi **các câu đã đổi** kể từ lần lưu thành công gần nhất: BE đã gộp theo từng câu (`J/lms/internal/.../LmsAttemptUseCase.java`, `saveDraft` dòng 154-158: `answers.put` từng `questionId`, `null` là xoá). Bỏ `events` khỏi payload nháp: `saveDraft` không đọc trường này. Câu trả lời vẫn nằm IndexedDB nên không mất khi reload.
- **Nếu bỏ qua:** WAL phình, checkpoint dày, độ trễ nộp bài tăng.

### PERF-05 · P1 · 58 chỗ xoá sạch cache của mọi trường khi một trường sửa dữ liệu · ĐÃ XÁC MINH

- **Bằng chứng:** `grep -rn "allEntries = true" src/main/java | wc -l` = 58, trong 10 file; nhiều nhất `J/lms/internal/core/LmsOperationalCommandService.java` (12 chỗ: dòng 90, 115, 141, 154, 181, 207, 220, 256, 280, 299, 311, 345), còn lại ở `StudentGroupCommands`, `SchoolCommandService`, `QuizAuthoringService`, `QuizDraftService`, `QuestionBankAuthoringService`, `CalendarCommandUseCase`, `CurriculumOperations`, `LearningContentService`.
- **Vấn đề:** Một giáo viên sửa một lớp → cache `lcmsSchoolOperations`, `lcmsSchoolDirectory` của **tất cả** tenant bị xoá → mọi người cùng truy vấn lại DB.
- **Sửa:** Dùng cơ chế xoá theo phạm vi đã có (`J/lms/LmsReadCacheInvalidator.java` làm mẫu). Làm trước 12 chỗ trong `LmsOperationalCommandService` và các chỗ trong `StudentGroupCommands`; phần authoring (ít người dùng) làm sau.
- **Nếu bỏ qua:** Giờ cao điểm có các đợt "bão cache lạnh" ngẫu nhiên.

### PERF-06 · P1 · 200 luồng Tomcat tranh 8 connection, virtual thread đang tắt · ĐÃ XÁC MINH

- **Bằng chứng:** `application.yml:21-23` `spring.threads.virtual.enabled` mặc định `false`; `:33` pool mặc định 25, file mẫu production đặt 8; `:150` Tomcat 200 luồng; `connection-timeout` 5000 ms.
- **Vấn đề:** Khi DB chậm, 192 luồng đứng chờ connection 5 giây rồi trả lỗi; hàng đợi nginx đầy theo.
- **Sửa:** Xem bảng cấu hình ở `03-hieu-nang-2000ccu.md` mục 5 (pool 16, virtual thread bật, Tomcat giữ 200, `connection-timeout` 2000 ms). Chỉ áp dụng sau khi có số đo trước/sau.

### PERF-07 · P1 · Tổng giới hạn RAM các container vượt 16 GB nếu chạy 2 replica · ĐÃ XÁC MINH (trên file mẫu)

- **Bằng chứng:** `compose.native.yml:6` backend `mem_limit 4g`; `.env.production.example`: `BACKEND_REPLICAS=2`, Redis cache 2560m, Redis state 1280m; `compose.monitor.yml` ≈ 1,7 GB; Postgres không có giới hạn.
- **Phép tính:** 2×4 + 2,56 + 1,28 + 1,7 = 13,5 GB, chưa tính Postgres, hệ điều hành, FE nginx.
- **Sửa:** Ngân sách ở `03-hieu-nang-2000ccu.md` mục 3 (1 replica backend 3 GB, Redis cache 1 GB, Redis state 512 MB, Postgres 5 GB).

### PERF-08 · P1 · `student_progress` thiếu index cho truy vấn theo bài giao · ĐÃ XÁC MINH

- **Bằng chứng:** Truy vấn `summarizeAssignment` lọc `tenantId` + `assignmentId` (`StudentProgressRepository.java`, khối `@Query` thứ nhất và thứ hai). Index hiện có: `uq_student_progress_attempt_scope (tenant_id, student_user_id, quiz_id, assignment_id)`, `idx_student_progress_class_quiz (class_id, quiz_id)`, `idx_student_progress_quiz_status (quiz_id, status)`, `idx_student_progress_student_user_id (student_user_id)`. Không index nào bắt đầu bằng `(tenant_id, assignment_id)`.
- **Vấn đề:** Màn hình tiến độ bài giao của giáo viên quét mọi dòng của tenant.
- **Sửa:** Migration mới `create index concurrently if not exists idx_student_progress_tenant_assignment on student_progress (tenant_id, assignment_id)`; kèm bản chạy online trong `ops/postgres/online/`. Chụp `EXPLAIN (ANALYZE, BUFFERS)` trước/sau trên dữ liệu `load/fixtures/seed-postgres-scale.sql`.

### PERF-09 · P2 · `lms_attempts` có 14 index, một số là tiền tố của index khác · ĐÃ XÁC MINH (danh sách) / CẦN XÁC MINH (mức dùng)

- **Ứng viên bỏ:** `idx_lms_attempts_tenant_assignment` (tiền tố của `..._read_assignment_status_updated`), `idx_lms_attempts_tenant_student` (tiền tố của `..._read_student_updated`), `idx_lms_attempts_tenant_quiz` (tiền tố của `..._tenant_version`).
- **Vấn đề:** Mỗi lần nộp bài cập nhật 14 index.
- **Sửa:** Trên production chạy `select indexrelname, idx_scan from pg_stat_user_indexes where relname='lms_attempts'` sau ít nhất 7 ngày; chỉ bỏ index có `idx_scan = 0`. Không bỏ theo suy đoán.

### PERF-10 · P0 · Chưa có bằng chứng chịu được 2000 CCU; bằng chứng cũ là rớt ở 500 VU · ĐÃ XÁC MINH

- **Bằng chứng:** `load/results/20260729T190558Z/comparison.md`: native, REST, 500 VU → 265 req/s, p95 2.515 ms, **FAIL**; JVM không có lượt đo nào đạt. `docs/2026-07-16-api-performance-release-readiness-reaudit.md` mục 1 nói rõ chưa có bộ kết quả được chấp nhận.
- **Sửa:** Quy trình đo ở `03-hieu-nang-2000ccu.md` mục 6–7. Không ai được nói "đạt 2000 CCU" trước khi có file kết quả k6 trên đúng máy i5-7500.

### PERF-11 · P3 · FE nginx không bật nén · CẦN XÁC MINH

- **Bằng chứng:** `deploy/nginx/default.conf.template` không có `gzip`. Nếu đứng sau Cloudflare/Vercel thì đã được nén ở biên.
- **Sửa:** `curl -sI -H "Accept-Encoding: br,gzip" https://lms.erg.edu.vn/assets/<file>.js | grep -i content-encoding`. Nếu trống, thêm `gzip on; gzip_types text/css application/javascript application/json image/svg+xml; gzip_min_length 1024;`.

---

## B. Vận hành và tính sẵn sàng

### OPS-01 · P0 · Giới hạn tốc độ tính theo IP sẽ chặn cả trường học dùng chung một IP · ĐÃ XÁC MINH

- **Bằng chứng:**
  - `ops/docker/nginx/native.conf:10-12`: mỗi IP 30 req/s chung, 5 req/s đăng nhập, 15 req/s GraphQL; `:38` burst 10, `:55` burst 30, `:74` burst 60. IP lấy từ `CF-Connecting-IP` (`:6-8`) = IP công cộng của trường.
  - `application.yml:322`: `source-per-minute` mặc định **30 lượt đăng nhập/phút cho một IP** (`J/auth/internal/login/AuthLoginRateLimiter.java`, chiều `source`).
- **Tình huống:** Phòng máy 40 học sinh bấm đăng nhập trong cùng một phút → học sinh thứ 31 nhận 429. 200 học sinh mở dashboard cùng lúc → vượt 15 req/s GraphQL → một phần thấy lỗi tải.
- **Sửa:** Xem `03-hieu-nang-2000ccu.md` mục 5: nâng ngưỡng theo IP (đăng nhập 30 req/s burst 100, GraphQL 150 req/s burst 300, chung 300 req/s), `ERG_AUTH_LOGIN_RATE_LIMIT_SOURCE_PER_MINUTE=600`; giữ nguyên giới hạn theo tài khoản (10/phút) và theo người dùng GraphQL (120/phút) vì hai giới hạn này mới là hàng rào chống dò mật khẩu. FE: hiển thị "Hệ thống đang đông, thử lại sau N giây" khi gặp 429 và tự thử lại theo `Retry-After`.
- **Nếu bỏ qua:** Lỗi xuất hiện đúng buổi kiểm tra tập trung, không tái hiện được khi thử một mình.

### OPS-02 · P0 · Bản sao lưu nằm cùng ổ đĩa với dữ liệu, không mã hoá, giữ 7 ngày · ĐÃ XÁC MINH

- **Bằng chứng:** `ops/backup/backup.sh:8` `BACKUP_DIR="$ROOT/ops/backup/data"`, `:10` `RETENTION_DAYS=7`; `deploy.sh` ghi dump vào `/opt/erg/backups`. Máy đích chỉ có một SSD SATA 256 GB.
- **Vấn đề:** Hỏng ổ, cháy nổ, trộm, mã hoá tống tiền → mất cả dữ liệu lẫn bản sao lưu. `pg_dumpall` còn chứa hash mật khẩu role.
- **Sửa:** Sau khi dump: mã hoá bằng `age` (khoá công khai để trên máy chủ, khoá bí mật giữ ngoài), đẩy lên bucket R2 riêng bằng `rclone`, giữ 7 bản ngày + 4 bản tuần + 6 bản tháng. Diễn tập khôi phục mỗi tháng theo `ops/backup/restore-drill.md`. Cảnh báo `BackupStale` đã có — thêm chỉ số `erg_backup_offsite_last_success_timestamp_seconds`.
- **Nếu bỏ qua:** Một sự cố phần cứng là mất toàn bộ điểm số của các trường.

### OPS-03 · P1 · nginx không đặt `client_max_body_size`, mặc định 1 MB · ĐÃ XÁC MINH (cấu hình) / CẦN XÁC MINH (kích thước ảnh thực tế)

- **Bằng chứng:** `ops/docker/nginx/native.conf` không có `client_max_body_size`. BE cho phép ảnh chấm công 2 MB, request 3 MB (`application.yml`, `spring.servlet.multipart`).
- **Tình huống:** Ảnh selfie chấm công 1,4 MB → nginx trả 413 trước khi tới BE.
- **Sửa:** `client_max_body_size 4m;` trong khối `server`. Kiểm tra FE có nén ảnh xuống dưới 1 MB không (`src/features/timekeeping/hooks/use-camera-capture.ts`).

### OPS-04 · P1 · `deploy.sh` build image ngay trên máy production · ĐÃ XÁC MINH

- **Bằng chứng:** `ops/docker/deploy.sh` bước "build": `docker build ... --target jvm-runtime`. `ops/docker/README.md` lại viết "Server tuyệt đối không compile".
- **Vấn đề:** Maven build chiếm 4 nhân trong vài phút; nếu deploy trong giờ học thì học sinh bị chậm.
- **Sửa (nhỏ nhất):** Chỉ deploy ngoài 06:30–21:30; thêm kiểm tra giờ ở đầu `deploy.sh`, cho phép vượt bằng `FORCE=1`. Về lâu dài build ở CI, máy chủ chỉ `docker pull` theo digest.

### OPS-05 · P1 · CI đang đỏ ở cả hai repo, nhánh làm việc chứa commit `wip` · CẦN XÁC MINH (ghi nhận từ phiên trước, phải chạy lại)

- **Ghi nhận:** FE: test `api-client`, `graphql-client`, `campaign-api`, `notification-api` lỗi sẵn. BE: test khoảng trống Flyway, `TimekeepingModuleTest`, `ClassSizeRatchet` (`AssignmentRepository` 588 dòng, vượt ngưỡng) lỗi sẵn; `feat/timekeeping` chứa `8ebb5ee wip: ...`.
- **Vấn đề:** Khi CI luôn đỏ thì không ai biết thay đổi mới có làm hỏng gì không.
- **Sửa:** Task đầu tiên của kế hoạch là đưa CI về xanh, trước mọi việc khác.

### OPS-06 · P2 · Một máy, một ổ đĩa, không có phương án khi máy chết · ĐÃ XÁC MINH (theo mô tả phần cứng)

- **Sửa:** `05-trien-khai-vps-nha.md` mục 8: UPS, bật lại sau mất điện trong BIOS, giám sát SMART, và runbook dựng lại trên AWS từ bản sao lưu ngoại vi trong ≤ 4 giờ (`06-trien-khai-aws.md`).

---

## C. Đồng nhất dữ liệu và gọi sai chỗ

### DATA-01 · P0 · "Điểm trung bình" có ba cách tính khác nhau · ĐÃ XÁC MINH

| Màn hình | Nguồn | Cách tính | Vị trí |
|---|---|---|---|
| Học sinh — trang chủ | `lms_attempts` | Lần nộp **mới nhất** của mỗi bài | `J/lms/persistence/AttemptRepository.java:467-468` (`LatestHandedInAttempt.OF_ATTEMPT`) |
| Giáo viên — lớp học | `lms_attempts` | Trung bình **mọi lượt làm** đã hoàn tất | `AttemptRepository.java:427-441` (`summarizeClassWorkspaceScores`) |
| Giáo viên — tiến độ bài giao, báo cáo | `student_progress` | `avg(progress.score)` | `StudentProgressRepository.java` (`summarizeAssignment`), `J/reporting/quiz/QuizReportService.java:98,124,135` |

- **Tình huống:** Học sinh làm một bài 3 lần: 40, 60, 90. Trang học sinh ghi 90. Trang lớp cộng cả ba lượt vào trung bình lớp (63). Trang tiến độ lấy theo `student_progress.score`, tuỳ lúc cập nhật.
- **Sửa:** Chốt một định nghĩa (đề xuất: **lần nộp mới nhất của mỗi bài, mỗi học sinh**, đúng yêu cầu chủ dự án đã nêu cho trang học sinh). Áp `LatestHandedInAttempt` cho `summarizeClassWorkspaceScores`; với `student_progress`, viết test khẳng định `score` luôn bằng điểm lần nộp mới nhất, nếu không thì chuyển báo cáo sang đọc `lms_attempts`. Chi tiết: `04-dong-nhat-du-lieu.md`.
- **Nếu bỏ qua:** Phụ huynh, học sinh, giáo viên nhìn ba con số khác nhau cho cùng một việc.

### DATA-02 · P0 · FE gọi các endpoint không có trên BE · ĐÃ XÁC MINH

- **Bằng chứng FE:** `src/features/lcms/admin-operations/api/access-management-api.ts:273` (`/api/lms/access-management/options`), `:315` (`.../scopes`), `:354` và `:361` (`.../users/{id}/access`), `:369` (`.../preview`), `:260` (`.../users`, chỉ khi GraphQL trả 404/501). `src/features/lms/infrastructure/lms-dashboard-api.ts:247` (POST `/api/lms/education-units`), `:265` (PATCH `/api/lms/education-units/{id}`).
- **Bằng chứng BE:** Không controller nào map `/api/lms/access-management` hay `/api/lms/education-units` (chỉ có một dòng nhận diện portal ở `J/platform/security/SecurityUtils.java:58`). `SecurityConfig.java` kết thúc bằng `.anyRequest().denyAll()` → 403. So tự động: 25/173 đường dẫn trong `src/lib/api/api-endpoints.ts` không có trong `contracts/backend/erg-openapi.json`.
- **Màn hình hỏng:** Phân quyền người dùng (`user-access-control-workspace.tsx`), tạo/sửa cơ sở giáo dục.
- **Sửa:** Chuyển sang endpoint `/api/v1/...` đã có trong contract (vai trò: `/api/v1/roles`, `/api/v1/users/{id}/role-assignments`, `/api/v1/users/{id}/effective-permissions`; cơ sở: `/api/v1/lms/education-units`). Nếu BE chưa có thao tác tương ứng, ẩn nút và hiện trạng thái "chưa hỗ trợ" thay vì gọi rồi lỗi. Sau đó xoá khối `legacy` trong `api-endpoints.ts`.

### DATA-03 · P1 · Hai bộ code "quản lý quyền" song song trên FE · ĐÃ XÁC MINH

- **Bằng chứng:** `src/features/access-management/` (mới, gọi `/api/v1/roles`) và `src/features/lcms/admin-operations/api/access-management-api.ts` (cũ, gọi endpoint ở DATA-02). `use-employee-management.ts:15` dùng bộ mới; `user-access-control-*.tsx` dùng bộ cũ.
- **Vấn đề:** Hai màn hình cùng sửa quyền một người nhưng đọc/ghi hai đường khác nhau.
- **Sửa:** Giữ `features/access-management`; chuyển các component `user-access-control-*` sang dùng nó; xoá file cũ khi không còn import. Làm chung với DATA-02.

### DATA-04 · P1 · Kiểm tra contract không chạy được trên Windows · ĐÃ XÁC MINH

- **Bằng chứng:** `node scripts/sync-api-contract.mjs --check` và `node scripts/sync-graphql-contract.mjs --check` đều báo `contract checksum mismatch`. `git ls-files --eol contracts/backend/` cho `i/lf w/crlf`: file trong git là LF, bản trên đĩa là CRLF, nên hash khác. Repo không có `.gitattributes`. CI của FE (`.github/workflows/ci.yml`) cũng **không chạy** `contract:check`.
- **Vấn đề:** Không ai biết snapshot contract trên FE còn khớp BE hay không. Đây là gốc của DATA-02.
- **Sửa:** Thêm `.gitattributes`: `* text=auto eol=lf` và `*.{png,jpg,ico,woff2,pfx,cer} binary`; chạy `git add --renormalize .`; thêm `bun run contract:check` vào CI.

### DATA-05 · P1 · Code thông báo trong bản production import kho dữ liệu giả · ĐÃ XÁC MINH (import) / CẦN XÁC MINH (điều kiện kích hoạt)

- **Bằng chứng:** `src/features/notifications/api/notification-api.ts:25`, `notification-feed-api.ts:32`, `notification-device-api.ts:23` import `notification-mock-store` / `notification-mock-devices`; `notification-mock-store.ts:25` import `notification-mock-fixtures`.
- **Rủi ro:** Nếu đường giả được dùng khi API lỗi hoặc khi thiếu `VITE_API_BASE`, người dùng thấy thông báo không có thật.
- **Sửa:** Đọc ba file, xác định điều kiện rẽ nhánh. Chỉ cho phép khi `runtimeFixturesEnabled()` (bật bằng biến môi trường dev); bản build production phải không chứa chuỗi fixture (thêm bước grep `dist/` vào CI như đã làm với auth bypass).

### DATA-06 · P2 · Danh sách bài của học sinh chỉ lấy 50 mục đầu · CẦN XÁC MINH

- **Bằng chứng:** BE đặt `FIRST_SLICE_LIMIT=50` cho dashboard học sinh (thêm ở commit `f29cca4`).
- **Tình huống:** Học sinh có 80 bài → tab "Đã nộp" thiếu 30 bài; điểm trung bình vẫn đúng vì lấy từ câu tổng hợp riêng.
- **Sửa:** Kiểm tra FE có nạp trang tiếp không. Nếu không: thêm nút "Xem thêm" dùng `nextCursor`, hoặc ghi rõ "50 bài gần nhất".

### DATA-07 · P2 · Danh sách trạng thái "đã nộp" được chép tay ở FE · ĐÃ XÁC MINH

- **Bằng chứng:** FE `src/features/elearning/student-dashboard/api/student-dashboard-api.ts:200` `HANDED_IN_STATES = submitted, completed, done, graded, needs_review, review_required`. BE `J/lms/LmsStatePolicy.java:15-16` có `submitted, graded, completed` và `needs_review, review_required` — không có `done`.
- **Vấn đề:** BE thêm trạng thái mới thì FE phân loại sai mà không báo lỗi.
- **Sửa:** BE trả thêm trường boolean `handedIn` trong card bài giao; FE dùng trường đó và xoá hằng số.

### DATA-08 · P2 · Độ trễ dữ liệu giữa các màn hình chưa được ghi thành quy ước · ĐÃ XÁC MINH

- **Bằng chứng:** BE cache 30 giây (`J/config/LmsCacheDescriptorContributor.java:32-45`); FE `staleTime` 15 s / 60 s / 5 phút / 10 phút tuỳ loại (`src/lib/query-policy.ts`), dữ liệu `offlineCore` còn được lưu 24 giờ.
- **Tình huống:** Học sinh nộp bài; giáo viên đang mở trang tiến độ thấy số cũ tối đa 30 s (BE) + 60 s (FE).
- **Sửa:** Bảng "độ trễ chấp nhận được theo màn hình" ở `04-dong-nhat-du-lieu.md` mục 3; màn hình nào vượt thì thêm nút làm mới hoặc `invalidateQueries` sau mutation liên quan.

---

## D. Bảo mật

### SEC-01 · P0 · CSP chỉ ở chế độ báo cáo, không có nơi nhận báo cáo · ĐÃ XÁC MINH

- **Bằng chứng:** `deploy/nginx/security-headers.conf:7-8` và `vercel.json:31` dùng `Content-Security-Policy-Report-Only`, không có `report-uri`/`report-to`. Token truy cập và refresh nằm trong `sessionStorage`; "ghi nhớ đăng nhập" lưu refresh token lâu dài (`src/platform/auth/api/auth-token-storage.ts:279-282`, `student-auth-storage.ts:126-130`).
- **Vấn đề:** Hàng rào duy nhất chống đánh cắp token khi có XSS đang không hoạt động, và cũng không thu được dữ liệu để bật.
- **Sửa:** Chạy `bun run build && bun run preview`, đi qua các trang chính với header CSP **cưỡng chế**, sửa vi phạm, rồi đổi tên header thành `Content-Security-Policy` ở cả hai file. Thêm `object-src 'none'`. Điểm cộng hiện có: không có `dangerouslySetInnerHTML`/`innerHTML`/`eval` nào trong `src` (đã grep).
- **Về lâu dài:** Chế độ BFF cookie `HttpOnly` đã có khung (`erg.auth.bff-enabled`, `VITE_AUTH_MODE=oidc-bff`); là việc riêng, không nằm trong đợt này.

### SEC-02 · P1 · Upload media công khai đọc hết thân request rồi mới kiểm chữ ký · ĐÃ XÁC MINH

- **Bằng chứng:** `J/controller/lcms/LcmsMediaController.java:47-58`: `readNBytes(max+1)` trước, `storeSignedMediaUpload(...)` (kiểm chữ ký, hạn dùng) sau. Route là `permitAll` (`SecurityConfig.java:184`).
- **Tình huống:** Không cần đăng nhập, gửi 100 request PUT mỗi cái gần ngưỡng tối đa → BE giữ ngần ấy MB trong heap rồi mới từ chối.
- **Giảm nhẹ hiện có:** nginx production mặc định chặn thân > 1 MB (OPS-03) và production dùng R2 cho media. Khi sửa OPS-03 phải sửa mục này trước hoặc cùng lúc.
- **Sửa:** Tách hàm kiểm chữ ký + hạn dùng theo URL, gọi **trước** khi đọc thân. Test: URL sai chữ ký trả 400 mà `request.getInputStream()` chưa bị đọc.

### SEC-03 · P1 · Chặn "xác thực bằng header" chỉ áp dụng cho profile `prod` · ĐÃ XÁC MINH

- **Bằng chứng:** `J/platform/security/TrustedHeaderAuthProductionGuard.java:23-29` chỉ ném lỗi khi profile là `prod`. `application.yml` có sẵn profile `staging`.
- **Tình huống:** Dựng staging công khai với `SPRING_PROFILES_ACTIVE=staging` và lỡ bật cờ → ai gửi `X-User-ID`, `X-Tenant-ID`, `X-Permissions: *` cũng thành quản trị (`ErgAuthenticationFilter.java:156-203`).
- **Sửa:** Đảo điều kiện: chỉ cho phép khi profile đang chạy chứa `test`; mọi profile khác mà bật cờ thì dừng khởi động. Một test cho profile `staging`.

### SEC-04 · P1 · 104 lỗ hổng trong phụ thuộc FE, CI không kiểm · ĐÃ XÁC MINH

- **Bằng chứng:** `bun audit` (10/11/2026): 2 critical, 56 high, 35 moderate, 11 low. Chạy trong trình duyệt người dùng: `seroval` (critical, qua `@tanstack/react-router`), `pdfjs-dist` (phụ thuộc trực tiếp). Còn lại là công cụ dev: `vite 8.0.9`, `vitest 4.1.6`, `undici`, `shell-quote` (critical, qua `@graphql-codegen/cli`), `zod`, `postcss`, `serialize-javascript`.
- **Sửa:** `bun audit fix`; nâng `@tanstack/react-router`, `pdfjs-dist`, `vite`, `vitest`, `@graphql-codegen/cli` lên bản vá; chạy đủ bộ kiểm tra. Thêm `bun audit --audit-level=high` vào CI (cho phép danh sách ngoại lệ có ghi lý do).

### SEC-05 · P2 · "Ghi nhớ đăng nhập" trên máy dùng chung ở trường · CẦN QUYẾT ĐỊNH

- **Bằng chứng:** `student-auth-storage.ts:126-130` lưu refresh token lâu dài khi `rememberMe`.
- **Tình huống:** Học sinh A tick "ghi nhớ" trên máy phòng tin học, không đăng xuất. Học sinh B mở trình duyệt → vào tài khoản A.
- **Sửa (đề xuất):** Ẩn ô "ghi nhớ" ở cổng học sinh trên web (giữ cho PWA đã cài và app desktop). Chủ dự án quyết định.

### SEC-06 · P2 · `/metrics` nằm trong danh sách `permitAll` · CẦN XÁC MINH

- **Bằng chứng:** `SecurityConfig.java:103`. nginx chặn `/actuator/` nhưng không nhắc `/metrics`.
- **Sửa:** `curl -i https://api.erg.edu.vn/metrics` phải ra 404/403. Nếu ra 200, thêm `location = /metrics { return 404; }` vào `native.conf` và bỏ khỏi `permitAll`.

### SEC-07 · P2 · GitHub Actions của BE chưa ghim theo SHA · ĐÃ XÁC MINH

- **Bằng chứng:** BE `.github/workflows/ci.yml`: `actions/checkout@v4`, `actions/setup-java@v4`, `actions/upload-artifact@v4`, `gitleaks/gitleaks-action@v2`. FE đã có luật ghim SHA (`CLAUDE.md`).
- **Sửa:** Ghim SHA đầy đủ, kèm chú thích phiên bản.

### SEC-08 · P2 · Bản sao lưu lộ mật khẩu Redis trên dòng lệnh · ĐÃ XÁC MINH

- **Bằng chứng:** `ops/backup/backup.sh`: `redis-cli -a "$REDIS_STATE_PASSWORD" BGSAVE` (hiện trong `ps`). Container đã có sẵn biến `REDISCLI_AUTH` (`compose.yml`).
- **Sửa:** Bỏ `-a "$REDIS_STATE_PASSWORD"`.

### SEC-09 · P3 · FE CI không quét secret · ĐÃ XÁC MINH

- **Sửa:** Thêm job gitleaks (ghim SHA) như BE.

Đã soát và **không thấy vấn đề** (ghi để agent không làm lại): không có SQL nối chuỗi với dữ liệu người dùng; lỗi không lộ stack trace (`server.error.include-*: never`); GraphQL có giới hạn độ sâu/độ phức tạp/alias, tắt introspection ở prod; actuator bị nginx chặn; Dockerfile chạy user không phải root; Redis có mật khẩu và mạng nội bộ; service worker không cache API xác thực/điểm; cache persist tách theo tài khoản và xoá khi đổi người; `AUTH_BYPASS` chỉ bật ở dev; 14 controller thử nghiệm đều gắn `@Profile("prototype")`.

---

## E. Lỗi chức năng

### BUG-01 · P0 · Header `Permissions-Policy` chặn camera và định vị của chấm công · ĐÃ XÁC MINH

- **Bằng chứng:** `deploy/nginx/security-headers.conf:5` và `vercel.json:23-24`: `camera=(), microphone=(), geolocation=()`. FE dùng `navigator.mediaDevices.getUserMedia` (`src/features/timekeeping/hooks/use-camera-capture.ts:33`) và `navigator.geolocation.watchPosition` (`src/features/timekeeping/hooks/use-geolocation.ts:30`).
- **Vấn đề:** `camera=()` nghĩa là cấm với mọi nguồn, kể cả chính trang. Camera rơi về ô chọn file; định vị thất bại hẳn.
- **Sửa:** `camera=(self), microphone=(), geolocation=(self)` ở cả hai file. Kiểm tra bằng bản build chạy qua nginx container, mở trang chấm công.

### BUG-02 · P0 · Nhánh `main` của BE khoá học sinh khỏi mọi API `/api/v1/lms` · ĐÃ XÁC MINH (tái hiện trên máy 11/11/2026)

- **Bằng chứng:** commit `0cf9d24` (10/11, đã ở `origin/main`) cho quyền của học sinh chỉ sinh workspace `STUDENT` (`WorkspaceCapabilityMapper.isLearnerLmsToken`). `SecurityUtils.portalFromPath` gán `/api/v1/lms` cho cổng `lms`, và `WorkspaceCapabilityMapper.fromLegacyPortal("lms")` đòi `TEACHER`. Ba chỗ dùng chung phép kiểm này: `ErgAuthenticationFilter.canAccessRequestedPortal`, `ErgPolicyService.decide`, `PermissionAuthorizationManager`. Test `LmsRuntimeControllerContractTest.lmsReadsOnlyReturnManagedEducationUnitsAndClasses` trả 403 `PORTAL_SESSION_MISMATCH`; CI của `main` đỏ vì test này từ `a1ebab1`.
- **Vấn đề:** FE cổng học sinh gọi bài tập, gói đề và nộp bài qua `/api/v1/lms/...` (`src/lib/api/api-endpoints.ts:108-116`). Deploy `main` như hiện tại thì học sinh đăng nhập được nhưng không tải được gì. Production chưa dính vì đang chạy `9d2e6f7` (trước commit đó).
- **Sửa:** `AuthorizationCapabilityPolicy.hasWorkspace` cho workspace `STUDENT` vào nhóm API `lms`; quyền trên từng endpoint vẫn quyết định học sinh gọi được gì; danh sách workspace hiển thị cho học sinh không đổi. Bản sửa này đã có sẵn trên `feat/timekeeping` (`f29cca4`) nhưng chưa vào `main`. PR https://github.com/eduriseglobalvn/erg-spring-boot/pull/16 đưa đúng các dòng đó vào `main`, kèm sinh lại `contracts/graphql/schema.graphqls.sha256` (cũ từ `6c5bede`, làm job "OpenAPI contract lock" đỏ từ 09/11).
- **Cập nhật 11/11/2026:** PR 16 đã gộp vào `main` (commit gộp `b764c52`), CI của PR xanh cả 8 kiểm tra. Chỉ deploy từ `b764c52` trở đi.
- **Lưu ý:** không deploy các commit `main` từ `0cf9d24` đến `a1ebab1`. `feat/timekeeping` đang sau `main` 52 commit và gộp thử báo xung đột ở 9 file (LCMS, publish, `QuizRuntimePackageService`, `AssignmentRepository`); khi gộp phải sinh lại checksum schema lần nữa vì nhánh đó thêm trường GraphQL.

---

## F. Chất lượng code và dọn dẹp

### CODE-01 · P3 · 14 controller và 4 service thử nghiệm không bao giờ chạy ở production · ĐÃ XÁC MINH

- **Bằng chứng:** `@org.springframework.context.annotation.Profile("prototype")` trên `EngagementController`, `TrendingBotController`, `AnalyticsOperationsController`, `CrawlerController`, `RssBlacklistController`, `SeoController`, `CourseController`, `ElearningController`, `PageMenuController`, `PostController`, `DocumentController`, `AiContentController` và `ModuleWorkflowService`, `CmsService`, `CatalogService`, `DocumentService`. `SecurityConfig.java` còn khoảng 60 dòng luật đường dẫn cho các route này.
- **Sửa:** Xoá hoặc chuyển sang module riêng không đóng gói vào bản production. Trước khi xoá: `grep` toàn bộ `src/test` và FE xem có ai gọi không.

### CODE-02 · P3 · Hai gói font không dùng · ĐÃ XÁC MINH

- **Bằng chứng:** `package.json` có `@fontsource/manrope`, `@fontsource/plus-jakarta-sans`; `grep` trong `src` và `index.html` không có import nào. `CLAUDE.md` quy định chỉ một họ Be Vietnam Pro.
- **Sửa:** `bun remove @fontsource/manrope @fontsource/plus-jakarta-sans`.

### CODE-03 · P3 · Khối `legacy` trong `api-endpoints.ts` · ĐÃ XÁC MINH

- **Sửa:** Xoá sau khi xong DATA-02; thêm vào `scripts/check-api-endpoint-literals.mjs` luật cấm đường dẫn không bắt đầu bằng `/api/v1/`.

### CODE-04 · P3 · File BE vượt ngưỡng kích thước · CẦN XÁC MINH

- **Ghi nhận:** `AssignmentRepository` 588 dòng, `AttemptRepository` 479 dòng; `ClassSizeRatchet` đang đỏ.
- **Sửa:** Tách theo việc (đọc cho học sinh / đọc cho giáo viên / ghi), không tách chỉ để ngắn. Làm trong task đưa CI về xanh.

---

## G. Kiểm tra máy chủ production (11/11/2026)

Cách làm: SSH bằng khoá có sẵn (`erg@ssh.erg.edu.vn` qua Cloudflare Tunnel), **chỉ đọc** — không khởi động lại, không sửa file, không ghi DB. Với `.env.production` chỉ đọc tên biến và giá trị các biến không bí mật; với bí mật chỉ so "giống/khác file mẫu" và độ dài, không in giá trị. Thêm một lượt `curl` GET từ ngoài Internet vào `api.erg.edu.vn`, `lms.erg.edu.vn`, `monitor.erg.edu.vn`.

### G.0 Hiện trạng (số đo thật)

| Mục | Giá trị |
|---|---|
| Phần cứng | i5-7500 4 nhân, RAM 15,4 GB (đang dùng 3,0 GB), swap 4 GB (`swappiness=10`), SSD 238 GB dùng 28 GB (13 %) |
| Hệ điều hành | Ubuntu 26.04.1 LTS, kernel 7.0, múi giờ **UTC**, đồng bộ giờ bật, chạy liên tục 5 ngày, tải ~0,2 |
| Bản BE đang chạy | `erg-spring:9d2e6f7-jvm` (commit 10/11/2026, có trong `origin/main`), **1 bản, JVM** (không phải native), giới hạn 4 GB, heap tối đa 75 % |
| Bản rollback | `erg-spring:5737d2d-jvm` |
| FE production | **Vercel** (`Server: Vercel`, vùng `hkg1`) — không chạy trên máy nhà |
| Container | 14 cái, không cái nào khởi động lại hay bị OOM; mọi cổng publish chỉ ở `127.0.0.1` |
| Dữ liệu | DB `erg` **22 MB**: 64 tài khoản, 416 học sinh trong danh sách lớp, 4 bài giao, 9 lượt làm bài, 28 phiên. 136 migration, 0 lỗi |
| Lưu lượng 25 giờ | 1.304 request từ 15 IP: 1.051 × 200, 35 × 409, 34 × 401, 18 × 400, **13 × 500**, **3 × 429** |
| Pool DB | Hikari tối đa 8, đang mở 2, chưa lần nào phải chờ |
| Sao lưu | Cron 20:00 UTC (03:00 giờ VN) chạy đều mỗi đêm, bản mới nhất 261 KB; có dump trước mỗi lần deploy. **Chỉ nằm trên chính ổ này.** |
| Giám sát | Prometheus 5 target đều `up`, 17 luật cảnh báo, đầu nhận Telegram, bot vận hành đang chạy |

Hệ quả cho kế hoạch: production đang ở giai đoạn dùng thử (vài chục người). Mọi số đo hiệu năng lấy từ production hiện tại **không** nói lên gì về 2000 CCU; vẫn phải đo bằng k6 theo `03`.

### G.1 Phát hiện cũ đã được xác nhận trên máy thật

| Mã | Kết quả trên production |
|---|---|
| PERF-02 | Đúng. `shared_buffers` 128 MB, `effective_cache_size` 4 GB, `random_page_cost` 4, `work_mem` 4 MB, `jit` on, `wal_compression` off. Thêm: `statement_timeout=0`, `idle_in_transaction_session_timeout=0`, `log_min_duration_statement=-1` (không ghi câu chậm). |
| PERF-06 | Đúng. Pool 8, virtual threads chưa bật (biến `SPRING_THREADS_VIRTUAL_ENABLED` không có trong `.env.production`). |
| PERF-07 | Một phần. Thực tế 1 bản backend 4 GB (không phải 2). Postgres và nginx **không có giới hạn bộ nhớ**; Redis cache giới hạn 2,5 GB. |
| PERF-01 | Có dấu hiệu. `HibernateQueryCountFilter` cảnh báo N+1 trong 25 giờ: `POST /auth/login` 15 lần, `POST /lms/attempts` 9 lần, `POST /lms/attempts/{id}/submit` 3 lần, `POST /lcms/quizzes/{id}/publish` 1 lần. |
| OPS-01 | Đúng. Đã có 3 lần 429 ở vùng `erg_graphql` (`POST /api/v1/graphql`) dù chỉ 15 IP và 1.304 request/ngày. |
| OPS-02 | Đúng. Máy không cài `age`, `rclone`, `restic`; không có bản sao lưu nào ra ngoài. |
| BUG-01 | Đúng. `lms.erg.edu.vn` trả `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| SEC-01 | Đúng. `lms.erg.edu.vn` trả `Content-Security-Policy-Report-Only`. |
| SEC-06 | Đúng nhưng nhẹ hơn dự đoán. `https://api.erg.edu.vn/metrics` trả 200 công khai, chỉ có 2 chỉ số (`erg_app_uptime_seconds`, `erg_jvm_threads_live`). Hạ xuống P3; vẫn nên chặn ở nginx. |
| STU-01 | Trên production: 50 tài khoản `lms.learner` gán qua `user_role_assignments` đều **không** bị cờ nào. Có 2 tài khoản `lms.learner` gán theo bảng cũ `user_roles` đang `recovery_email_verified=false`. Lỗi chưa nổ nhưng đường gây lỗi vẫn còn (xem thêm SRV-03). |

### G.2 Đã kiểm và đạt (không cần làm lại)

Chỉ có `sshd` và `cloudflared` nghe ngoài loopback · ufw mặc định chặn chiều vào · `fail2ban` chạy · tự cập nhật bảo mật bật, không cần khởi động lại · log Docker có xoay vòng (50 MB × 5) · mọi container `restart: unless-stopped` · `.env.production` quyền 600 · các khoá JWT, refresh, ký URL media, mã hoá outbox, HMAC kiểm toán, ký gói đề đều dài 64 ký tự, khác file mẫu và khác nhau · runtime dùng role `erg_app` (không superuser, không `BYPASSRLS`, không sở hữu bảng) · RLS bật 116/134 bảng (57 bảng `FORCE`) · mọi cờ seed khi khởi động đều `false` · từ ngoài: `/actuator/*`, `/v3/api-docs`, `/scalar` → 404; giả header `X-User-ID`/`X-Permissions` → 401; GraphQL introspection khi chưa đăng nhập → 401; `Origin` lạ không được trả `Access-Control-Allow-Origin`.

### SRV-01 · P0 · Mở gói đề bài trả HTTP 500 ở lần tải đầu · ĐÃ XÁC MINH

- **Bằng chứng (production):** 5 ngày gần nhất `GET /api/v1/lms/quizzes/{id}/package` có 17 × 200 và **13 × 500** (43 %), xảy ra với cả 3 đề đang dùng. Mẫu lặp lại: 500, một giây sau cùng đề đó 200. Log backend: `IllegalArgumentException: Cannot encode cache quizRuntimePackage` ← `InvalidDefinitionException: Incompatible types: declared root type Optional<QuizPackageResponse> vs QuizPackageResponse`.
- **Nguyên nhân (code, giống hệt ở HEAD):** `J/config/LmsCacheDescriptorContributor.java:30,37` khai báo kiểu giá trị của cache `quizRuntimePackage` là `Optional<QuizPackageResponse>`, nhưng giá trị được đưa vào cache là `QuizPackageResponse` (Spring gỡ `Optional` trước khi lưu). `J/platform/cache/ErgTieredCache.java:131-145` (`put`) ghi L1 trước rồi mới mã hoá cho Redis; mã hoá ném lỗi (`JacksonCacheValueCodec.java:22`) → request thất bại dù đã tải xong dữ liệu. Lần gọi lại trúng L1 nên thành công. Hết hạn L1 thì lặp lại.
- **Hậu quả:** Học sinh bấm vào bài thì lần đầu lỗi (FE tự thử lại nên thấy chậm hoặc nháy lỗi). `CacheLoadCoordinator` gộp các lượt tải trùng → cả lớp mở cùng lúc thì **mọi** request đang chờ cùng nhận lỗi. Redis L2 không bao giờ có gói đề → mỗi lần L1 hết hạn lại đọc DB. Ở 2000 CCU đây là nguồn 500 hàng loạt.
- **Sửa:** (1) Đổi khai báo thành `mapper.constructType(QuizPackageResponse.class)` — trước đó mở phương thức `@Cacheable` thật (`LmsResourceQueryUseCase.getQuizPackage`) để xác nhận kiểu trả về. (2) Trong `ErgTieredCache.put`: lỗi mã hoá L2 không được làm hỏng request — bắt lỗi, tăng metric `l2 put encode_error`, ghi log, vẫn trả giá trị. (3) Test: `CacheDescriptorContributorTest` mã hoá một giá trị thật cho **từng** descriptor; `ErgTieredCacheTest` thêm ca "codec ném lỗi → `get` vẫn trả giá trị đã tải". (4) Sau deploy: đếm lại 500 của đường dẫn này trong log nginx phải bằng 0, và Redis cache có key `quizRuntimePackage`.

### SRV-02 · P0 · SSH vào máy chủ đi được từ Internet bằng mật khẩu · ĐÃ XÁC MINH (phần Access: bằng chứng mạnh, cần chủ dự án xác nhận trên bảng điều khiển)

- **Bằng chứng:** `sshd -T`: `passwordauthentication yes`, `x11forwarding yes`. Tài khoản `erg` có `NOPASSWD: ALL` và thuộc nhóm `docker` → vào được `erg` là có quyền root. `ssh.erg.edu.vn` đi qua Cloudflare Tunnel nhưng **không thấy lớp Cloudflare Access**: máy rà không có token Access lưu sẵn (`~/.cloudflared` không tồn tại) mà `ssh -o BatchMode=yes` vẫn vào; `curl https://ssh.erg.edu.vn/` không bị chuyển sang trang đăng nhập Access. `fail2ban` vô dụng với đường này vì mọi kết nối tới `sshd` đều từ `127.0.0.1`. Ngoài ra mật khẩu tài khoản `erg` đã được dán vào khung chat ngày 11/11/2026.
- **Hậu quả:** Ai cài `cloudflared` cũng thử mật khẩu được, không giới hạn số lần. Đoán trúng là mất toàn bộ máy chủ, DB và mọi bí mật.
- **Sửa (việc tay, chủ dự án làm, giữ một phiên SSH đang mở trong lúc thử phiên mới):** (1) Đổi mật khẩu `erg` (`passwd`). (2) `/etc/ssh/sshd_config.d/10-erg.conf`: `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `X11Forwarding no`, `AllowUsers erg`; `sshd -t && systemctl reload ssh`. Đăng nhập bằng khoá đã hoạt động (1 khoá trong `authorized_keys`). (3) Cloudflare Zero Trust: tạo Access application cho `ssh.erg.edu.vn` (chỉ email của người quản trị + MFA). (4) Thêm một khoá dự phòng cất ngoài máy tính đang dùng, để mất máy tính không mất đường vào.

### SRV-03 · P0 · Production chưa cấu hình gửi email · ĐÃ XÁC MINH

- **Bằng chứng:** `.env.production`: `SPRING_MAIL_HOST=smtp.example.com`, `SPRING_MAIL_USERNAME` và `SECRET_SMTP__PASSWORD` còn là giá trị mẫu. Trong DB: 12 tài khoản `ACTIVE` có `recovery_email_verified=false` (7 tài khoản `lms.instructor` và 2 `lms.learner` theo bảng `user_roles`, 3 tài khoản không có vai trò).
- **Hậu quả:** Không email nào gửi đi được: xác thực email khôi phục, quên mật khẩu. Tài khoản bị cờ `recovery_email_verified=false` sẽ bị `ACCOUNT_LIFECYCLE_RESTRICTED` và không có cách tự gỡ. Liên quan trực tiếp câu hỏi mở số 0 (xác thực qua mail).
- **Sửa:** Chủ dự án chọn nhà cung cấp SMTP và cấp thông tin; đặt vào `.env.production` trên máy chủ; gửi thử một thư. Kiểm 12 tài khoản trên là người thật hay tài khoản thử. Trong lúc chưa có SMTP: không tạo tài khoản mới theo đường cần xác thực email.

### SRV-04 · P1 · Mật khẩu Postgres và Redis production trùng giá trị mẫu trong repo · ĐÃ XÁC MINH

- **Bằng chứng:** `POSTGRES_PASSWORD`, `POSTGRES_RUNTIME_PASSWORD`, `REDIS_STATE_PASSWORD`, `REDIS_CACHE_PASSWORD` trong `.env.production` **giống hệt** `.env.production.example` (file đã commit). Role `erg` (chủ bảng, dùng cho Flyway) là superuser + `BYPASSRLS`.
- **Hậu quả:** Cổng 5432/6379 không mở ra ngoài nên chưa khai thác được từ Internet. Nhưng ai đọc được repo và có một chỗ đứng trong mạng Docker hoặc trên máy (ví dụ qua SRV-02, hoặc một lỗ hổng ở container khác) là có toàn quyền dữ liệu.
- **Sửa (ngoài giờ, có cửa sổ bảo trì ~10 phút):** tạo 4 mật khẩu mới bằng `openssl rand -hex 32`; `ALTER ROLE erg / erg_app PASSWORD`; đổi `requirepass` hai Redis; sửa `.env.production` (kể cả các URL có chứa mật khẩu: `SPRING_DATASOURCE_*`, `SPRING_FLYWAY_PASSWORD`, `ERG_REDIS_*_URL`, `SPRING_DATA_REDIS_URL`, `SECRET_QUEUE__REDIS_PASSWORD`, và biến của các exporter); khởi động lại theo thứ tự DB → Redis → backend → exporter. Theo `docs/runbooks/credential-rotation-p0-2.md`. Sửa file mẫu để giá trị mẫu không thể dùng được (ví dụ để trống và script deploy từ chối khởi động khi trống).

### SRV-05 · P1 · Ảnh chấm công sẽ lưu trong container và mất khi deploy · ĐÃ XÁC MINH (chưa mất dữ liệu vì chưa có lượt chấm công nào)

- **Bằng chứng:** `TK_PHOTOS_R2__ENABLED=false`, `TK_PHOTOS_LOCAL_ALLOWED_IN_PROD=true`; `R2__ENDPOINT`, `SECRET_R2__ACCESS_KEY_ID`, `SECRET_R2__SECRET_KEY` để trống; container backend **không có volume nào**; log khởi động: `erg.timekeeping.photos.signing-secret is not set: using a random per-process secret` (`application.yml:361`, biến `SECRET_TK_PHOTO_URL_SIGNING_KEY`). Bảng `tk_punches` đang 0 dòng.
- **Hậu quả:** Khi bật chấm công: ảnh nằm trong lớp ghi của container → mất ở lần deploy kế tiếp; đường dẫn ảnh đã ký hỏng sau mỗi lần khởi động lại; ảnh không nằm trong bản sao lưu. Media của LCMS cũng phụ thuộc R2 đang trống — CẦN XÁC MINH tải ảnh câu hỏi lên hiện đi đâu.
- **Sửa:** Trước khi cho người dùng chấm công: cấu hình R2 (bucket riêng tư) và bật `TK_PHOTOS_R2__ENABLED=true`, đặt `SECRET_TK_PHOTO_URL_SIGNING_KEY`; hoặc nếu chủ ý lưu cục bộ thì gắn volume có tên và thêm vào `backup.sh`. Thêm kiểm tra khởi động: profile `prod` + lưu cục bộ + không có volume → từ chối chạy.

### SRV-06 · P1 · Redis state: `maxmemory` lớn hơn giới hạn bộ nhớ container · ĐÃ XÁC MINH

- **Bằng chứng:** `ops/docker/redis/state.conf`: `maxmemory 768mb`, `noeviction`; container `erg-redis-state-1` giới hạn 512 MB (`REDIS_STATE_CONTAINER_MEMORY=512m`).
- **Hậu quả:** Khi dữ liệu phiên/bài làm dở tăng, container bị kernel giết ở 512 MB trước khi Redis kịp từ chối ghi ở 768 MB → mất kết nối state giữa giờ làm bài thay vì một lỗi ghi có kiểm soát.
- **Sửa:** `maxmemory` ≤ 75 % giới hạn container (384 MB với giới hạn 512 MB), hoặc tăng giới hạn lên 1 GB theo ngân sách ở `03` mục 3. Làm chung với `G2-03`. Thêm cảnh báo `redis_memory_used_bytes / redis_memory_max_bytes > 0.8`.

### SRV-07 · P2 · Grafana lộ ra Internet; danh sách CORS thừa; thiếu HSTS · ĐÃ XÁC MINH

- **Bằng chứng:** `https://monitor.erg.edu.vn/` trả trang đăng nhập Grafana, `/api/health` trả 200 — không có Cloudflare Access. `HTTP__CORS__ALLOWED_ORIGINS` có 12 origin, gồm `https://monitor.erg.edu.vn` và 4 origin cổng `:3001`, cùng `ALLOW_CREDENTIALS=true`. Phản hồi của `api.erg.edu.vn/ready` và `lms.erg.edu.vn/` không thấy header `Strict-Transport-Security`.
- **Sửa:** Đặt `monitor.erg.edu.vn` sau Cloudflare Access (làm cùng SRV-02). Rút CORS còn đúng các origin FE đang chạy thật. Bật HSTS ở Cloudflare (hoặc `vercel.json` và nginx API), bắt đầu `max-age` ngắn rồi tăng.

### SRV-08 · P2 · Hệ điều hành chưa chỉnh cho tải lớn và chưa có công cụ theo dõi phần cứng · ĐÃ XÁC MINH

- **Bằng chứng:** `fs.file-max=65535` (trần file mở của **cả máy**), `net.ipv4.tcp_max_syn_backlog=1024`, `vm.overcommit_memory=0`; không có `smartctl`, `sensors`, `apcupsd`/`upsc`; 19 gói chờ cập nhật; Docker còn 11 GB build cache và 5 GB image không dùng.
- **Sửa:** `/etc/sysctl.d/90-erg.conf`: `fs.file-max=1048576`, `net.ipv4.tcp_max_syn_backlog=4096`, `vm.overcommit_memory=1` (Redis khuyến nghị cho `BGSAVE`). Cài `smartmontools`, `lm-sensors`, và phần mềm UPS khi có UPS. `docker builder prune` định kỳ (sau khi sửa OPS-04 thì không còn build trên máy). Múi giờ UTC giữ nguyên được, nhưng ghi rõ trong runbook: cron 20:00 UTC = 03:00 giờ Việt Nam, log theo UTC.

### SRV-09 · P2 · 35 lần 409 khi bắt đầu làm bài trong một ngày · CẦN XÁC MINH

- **Bằng chứng:** 25 giờ: `POST /api/v1/lms/attempts` trả 409 **35 lần** trên tổng 1.304 request. Cùng endpoint này bị cảnh báo N+1 9 lần.
- **Vấn đề:** Hoặc FE gọi "bắt đầu làm bài" lặp lại (bấm đúp, mở lại trang, hai tab) và dựa vào 409 để biết đã có lượt làm; hoặc luật "một lượt đang mở" từ chối sai. Chưa đọc thân phản hồi nên chưa kết luận.
- **Sửa:** Đọc mã lỗi của các 409 này trong log; đối chiếu `LmsAttemptUseCase.start` và nơi FE gọi. Nếu là điều khiển luồng có chủ ý thì đổi sang trả lượt đang mở (200) để không sinh lỗi giả; nếu không thì sửa nguyên nhân. Đưa vào danh sách soát của `04`.

### SRV-10 · P3 · Dọn cấu hình thừa trên máy chủ · ĐÃ XÁC MINH

- ufw đang cho vào `80`, `443`, `8080`, `3000` từ mọi nơi dù không dịch vụ nào nghe ở đó ngoài loopback; cổng `22` mở cho cả mạng LAN. Xoá 4 rule thừa; giới hạn 22 về máy quản trị trong LAN (hoặc xoá hẳn sau khi xác nhận tunnel nối tới `localhost:22`).
- `compose.watchtower.yml` nằm trong bộ file của project compose (`docker compose ls`), gắn `/var/run/docker.sock`, dò mỗi 30 giây. Hiện không có container watchtower nào chạy và image là tag cục bộ nên file này vô dụng; nếu lỡ bật thì là một container có quyền root trên máy. Xoá khỏi repo và khỏi lệnh compose.
- `FLYWAY_BASELINE_ON_MIGRATE=true` ở production: đặt `false` (DB đã có lịch sử 136 migration; để `true` có thể che một DB trỏ nhầm).
- `sudo` không cần mật khẩu cho mọi lệnh: thu hẹp về đúng lệnh `deploy.sh` cần, nếu có.

### SRV-11 · P2 · Cảnh báo còn thiếu so với checklist · ĐÃ XÁC MINH

- **Hiện có (17 luật):** backend chết, p95 cao, tỉ lệ lỗi, Hikari bão hoà, kết nối Postgres, target mất, Postgres/Redis chết, dead-letter thông báo, đăng nhập sai tăng vọt, heap cao, sao lưu cũ, bộ nhớ container, CPU, RAM, đĩa đầy, đĩa chờ.
- **Thiếu:** bộ nhớ Redis so với `maxmemory`; `cloudflared` mất kết nối; SMART và nhiệt độ; sao lưu **ngoài máy** cũ; tỉ lệ 500 theo từng endpoint (SRV-01 đã lọt qua vì tỉ lệ chung thấp); kiểm tra từ bên ngoài (`uptime.yml` có trong repo — chưa xác nhận đang chạy và báo về đâu).
- **Sửa:** thêm các luật trên vào `ops/docker/monitor/prometheus/alerts.yml`; mỗi luật thử kích hoạt một lần.

---

## H. Bot vận hành và đường báo tin Telegram (11/11/2026)

Chủ dự án báo: bot không báo khi deploy, khi máy chủ chết, khi hệ thống đứng. Đã đọc mã bot (`ops/bot/*.go`, BE), cấu hình Alertmanager, `deploy.sh`, workflow `uptime.yml`, và kiểm trên máy chủ (chỉ đọc): dịch vụ bot, tên biến trong `bot.env`, log bot 7 ngày, lịch sử cảnh báo Prometheus 7 ngày.

**Hiện có ba đường báo tin:**

| Đường | Chạy ở đâu | Báo cái gì | Tình trạng thật |
|---|---|---|---|
| Watchdog của bot (`ops/bot/watchdog.go`) | Trên máy chủ, dò Docker 30 giây/lần | Container không khoẻ ≥ 60 giây, khoẻ lại, tự khởi động lại; tự restart backend sau 3 phút; báo cáo ngày 08:00 | Chạy ổn (systemd `active`, 0 lần tự khởi động lại từ 05/11). Trong 7 ngày không có container nào hỏng ≥ 60 giây nên không có tin. |
| Alertmanager → Telegram | Trên máy chủ | 17 luật Prometheus (`01` SRV-11) | Cùng token và cùng chat với bot. **7 ngày qua không luật nào bắn** → chưa từng kiểm chứng tin có tới Telegram hay không. |
| Workflow `production-uptime` (`.github/workflows/uptime.yml`) | GitHub Actions, ngoài máy chủ | `api.erg.edu.vn/ready` không trả 200 | **Không hoạt động** — xem BOT-01. |

Bot khoẻ; lỗi không nằm ở "bot hỏng" mà ở chỗ **ba loại sự kiện chủ dự án cần đều nằm ngoài những gì ba đường này nhìn thấy**.

### BOT-01 · P0 · Máy chủ chết, mất điện, mất mạng: không ai báo · ĐÃ XÁC MINH

- **Bằng chứng:** Bot và Alertmanager chạy trên chính máy chủ — máy chết thì cả hai im. Đường duy nhất ở ngoài là `uptime.yml`, nhưng: (1) repo BE có **0 secret** (`gh api .../actions/secrets` → `total_count: 0`), nên bước "Tell Telegram" luôn thoát ở dòng `Telegram secrets not set`; (2) lịch khai báo `*/5 * * * *` nhưng GitHub thực chạy **4–8 giờ một lần** (22 lượt trong 5 ngày; ví dụ 09:21 → 17:08 ngày 10/11).
- **Hậu quả:** Máy nhà mất điện lúc học sinh đang làm bài: không có tin nào. Kể cả khi đặt secret, phát hiện vẫn trễ tới 8 giờ.
- **Sửa:** Dùng mẫu "công tắc người chết": bot gọi một địa chỉ heartbeat của dịch vụ giám sát bên ngoài mỗi phút; dịch vụ đó nhắn Telegram khi quá 3 phút không thấy heartbeat, và nhắn lại khi có trở lại. Đặt trong bot (không phải cron) để bot chết cũng bị phát hiện. Biến mới `BOT_HEARTBEAT_URL` trong `bot.env`. Dịch vụ: chủ dự án chọn (ví dụ healthchecks.io có sẵn kênh Telegram — CẦN XÁC MINH gói miễn phí hiện hành). Song song: đặt 2 secret `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` cho repo để `uptime.yml` thành lớp dự phòng thứ ba (chậm nhưng độc lập).

### BOT-02 · P1 · Deploy không có tin nào · ĐÃ XÁC MINH

- **Bằng chứng:** `ops/docker/deploy.sh` không có lệnh gửi Telegram nào (chỉ `log()` ra màn hình). Watchdog không nhận ra deploy: container backend được tạo lại, số lần restart về 0, thời gian `health: starting` thường dưới 60 giây nên không tới ngưỡng báo. Từ 05/11 đến 09/11 có ít nhất 5 lần đổi bản backend, không lần nào có tin. Nếu khởi động chậm quá 60 giây, tin lại ghi "🔴 backend lỗi: health: starting" — sai nghĩa.
- **Hậu quả:** Không biết ai deploy, bản nào, lúc nào, thành công hay thất bại. Deploy thất bại giữa chừng (build lỗi, diễn tập migration lỗi) hoàn toàn im lặng.
- **Sửa:** (1) `deploy.sh`: dùng lại hàm `notify()` của `ops/backup/backup.sh` (đọc `TELEGRAM_*` từ `.env.production`); gửi 3 loại tin: bắt đầu (SHA, bản đang chạy), thành công (SHA mới, thời gian, số migration mới, bản rollback), thất bại qua `trap ERR` (bước và dòng lỗi, bản đang chạy vẫn là bản nào). (2) Watchdog: nhớ image của từng container; image đổi → tin "🚀 backend đang chạy bản X (trước: Y)" — bắt được cả deploy tay bằng `docker compose`. (3) Trong 3 phút đầu sau khi container được tạo, `health: starting` hiển thị là "đang khởi động", không phải "lỗi". (4) Lệnh `/rollback` của bot báo vào chat chung khi xong.

### BOT-03 · P1 · Hệ thống "đứng" mà container vẫn khoẻ: không báo · ĐÃ XÁC MINH (đọc code)

- **Các kiểu đứng không được báo:**
  - Cả máy treo → như BOT-01.
  - `cloudflared` hoặc Cloudflare hỏng, máy vẫn sống: mọi container vẫn `healthy`, watchdog không kiểm tunnel → người dùng không vào được, bot im.
  - Backend treo nhưng `/ready` vẫn trả 200 (ví dụ hết pool DB, kẹt khoá): health check của Docker (`compose.native.yml:45-50`) vẫn xanh. Luật `BackendHighP95Latency` và `BackendHighErrorRate` tính trên request **đã xong**; request treo không xong thì không có mẫu → không bắn. Ngoài giờ không có lưu lượng thì càng không bắn.
  - `docker compose down` hoặc container bị xoá: biến khỏi `docker ps -a` → watchdog không còn thấy để mà báo.
- **Sửa:** Thêm vào watchdog ba phép thử mỗi 30 giây, 3 lần hỏng liên tiếp thì báo, khoẻ lại thì báo: (a) `http://127.0.0.1:8080/ready` qua nginx, hạn 5 giây; (b) `https://api.erg.edu.vn/ready` từ chính máy chủ, hạn 10 giây — thử cả tunnel lẫn Cloudflare; (c) một request đi tới DB (một endpoint đọc nhẹ không cần đăng nhập, hoặc `/ready` nếu đã gồm kiểm DB — xác minh trước). Tin phải phân biệt được "backend không trả lời" với "tunnel hỏng, máy vẫn sống". Thêm kiểm "container bắt buộc phải có" theo danh sách cố định (`backend`, `nginx`, `postgres`, `redis-state`, `redis-cache`): thiếu → báo.

Đính chính (11/11/2026, khi viết mã G4-14): `/ready` **có** kiểm Postgres và Redis (`PlatformHealthController.java:55`), nên không cần phép thử thứ ba đi tới DB. Điểm cần biết: Redis hỏng thì `/ready` vẫn trả 200 (`status: degraded`, `checks.redis=false`), container vẫn healthy; probe của bot vì vậy đọc phần `checks` chứ không chỉ mã HTTP.

### BOT-04 · P2 · Tin bị mất khi Telegram tạm lỗi · ĐÃ XÁC MINH

- **Bằng chứng:** `ops/bot/bot.go:110-117` (`notify`) gửi một lần, lỗi thì chỉ ghi log. `telegram.go:103-115` (`Send`) không thử lại. Log bot 7 ngày: 47 lần `getUpdates` lỗi (37 `request failed`, 10 `Bad Gateway`) → đường tới Telegram có chập chờn.
- **Hậu quả:** Sự cố mạng thường là lúc cần tin nhất; tin "container lỗi" rơi đúng lúc đó là mất hẳn (cờ `notified` đã bật nên không gửi lại).
- **Sửa:** Hàng chờ trong bộ nhớ cho `notify` (tối đa 100 tin, thử lại giãn dần tới 30 phút, tin cũ hơn 2 giờ thì bỏ và ghi log). Test đơn vị với Telegram giả trả lỗi 2 lần rồi thành công.

### BOT-05 · P2 · Sau khi máy khởi động lại chỉ có một dòng chung chung; đường Alertmanager chưa từng được thử · ĐÃ XÁC MINH

- **Bằng chứng:** `bot.go:91` gửi "Bot vận hành đã khởi động" mỗi lần bot chạy — không nói máy vừa khởi động lại hay chỉ bot khởi động lại, không nói đã ngừng bao lâu. Prometheus: `count_over_time(ALERTS{alertstate="firing"}[7d])` rỗng → chưa có cảnh báo thật nào đi qua Alertmanager tới Telegram.
- **Sửa:** (1) Mỗi vòng watchdog ghi mốc thời gian vào `/opt/erg/bot/last-alive`. Khi bot khởi động: đọc `/proc/uptime`; nếu máy mới lên dưới 10 phút → tin "🔌 Máy chủ vừa khởi động lại lúc HH:MM, ngừng khoảng N phút (lần cuối còn sống HH:MM)"; ngược lại → "Bot khởi động lại (máy chủ vẫn chạy)". (2) Ngoài giờ học, bắn thử một cảnh báo giả qua API Alertmanager để xác nhận tin tới Telegram; ghi kết quả. Lặp lại mỗi quý.

**Đã kiểm và đạt ở bot:** dịch vụ `enabled` + `Restart=always`; chỉ 1 ID Telegram được phép ra lệnh; lệnh thay đổi hệ thống cần mã TOTP (đã đặt); `bot.env` có 4 biến, chat nhận tin đã đặt và trùng với chat của Alertmanager; log gửi đi đã che token/mật khẩu/email; mọi lệnh được ghi `audit.log`.

Sổ này chưa phủ hết repo. Các vùng chưa soát được liệt kê ở `README.md` mục "Chưa làm"; task `G5-01` trong kế hoạch dành để soát tiếp.
