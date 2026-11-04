# Kế hoạch triển khai cải tiến ERG System (frontend)

> Ngày lập: 03/11/2026 · Nhánh đánh giá: `codex/mui-system-refactor` (commit `7f75826`)
> Phạm vi: toàn bộ `F:/ERG/erg-system` gồm 1.338 file tracked, 1.100 file TS/TSX, khoảng 47.500 dòng code (không tính file generated).
> Phương pháp:
> - Quét UI bằng Playwright (Chromium 1.60) trên `https://lms.erg.edu.local:3001` với tài khoản admin và giáo viên.
> - Chạy `typecheck`, `lint`, `test`, `build`.
> - 7 lượt review code độc lập: bảo mật, kiến trúc, logic chồng chéo, hiệu năng, cấu trúc/CI, các feature, portable Tauri.
> - Các phát hiện quan trọng đều đã được đối chiếu lại với code thật (có file:dòng).

---

## 0. Cách đọc tài liệu này

- **Mức độ:** 🔴 P0 = sửa ngay (bảo mật, mất dữ liệu, lỗi chặn người dùng). 🟠 P1 = trong 2–4 tuần. 🟡 P2 = cải tiến dài hạn.
- Mỗi hạng mục có ba phần: **Vấn đề → Vị trí → Cách làm → Tiêu chí nghiệm thu (DoD)**.
- Thứ tự thực hiện khuyến nghị nằm ở **Mục 11 (Lộ trình)**. Không nên làm theo thứ tự các mục.
- Quy tắc chung cho mọi PR:
  - `bun run typecheck && bun run lint && bun run test && bun run build` phải xanh.
  - Mỗi PR chỉ giải quyết một chủ đề.
  - Không trộn refactor với đổi hành vi.

---

## 1. Hiện trạng đo được

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| `typecheck` | ✅ 0 lỗi | Nhưng **không bật `strict`**, nên con số này đánh giá cao hơn thực tế |
| `lint` | ❌ 22 error, 7 warning | Có 11 lỗi `react-hooks/rules-of-hooks` (nguy cơ crash) |
| `test` (vitest) | ❌ 4/1.061 fail (3/286 file) | 1 test fail vì code trả **mock** thay cho lỗi API |
| `build` | ✅ 3,07 giây | Entry `index` 345 KB (106 KB gzip). Precache **98 file, 8,1 MB** |
| CI trên PR | ⚠️ Không chạy unit test, lint chỉ chạy khi release | `.github/workflows/*` |
| UI stack thực tế | MUI v9 (309 file) + một ít shadcn/Tailwind/lucide | CLAUDE.md đang ghi ngược lại |
| Tỉ lệ test | 286 file test / ~822 file nguồn | 65 test là "policy test" grep chuỗi trong source |
| File > 600 dòng | 43 file | Lớn nhất: `question-editor-dialog.tsx` 1.506 dòng |

**Kết luận tổng quan:**
- Nền móng tốt: lazy route, chiến lược precache, outbox offline mã hoá, contract test, ma trận phân quyền route.
- Có 5 nhóm vấn đề nghiêm trọng:
  0. **Lỗi runtime chặn người dùng:**
     - 2 trang làm treo tab do vòng redirect giữa guard và trang access-denied.
     - Vòng render vô hạn sau khi đăng nhập.
     - Học sinh không nộp được bài khi còn câu trống, hoặc khi hết giờ.
  1. **Bảo mật phiên đăng nhập và chuỗi cung ứng release.**
  2. **Dữ liệu giả lẫn vào production**, cụ thể là bank câu hỏi và thông báo.
  3. **Logic portal/workspace bị nhân bản 5 lần và đã lệch nhau.** Đây là nguyên nhân trực tiếp của lỗi "giáo viên không vào được portal học viên" và lỗi redirect trên localhost.
  4. **Tài liệu dự án sai so với code thật.**

---

## 2. 🔴 P0: Bảo mật và lỗi chặn (tuần 1)

### P0-1. Cờ bypass xác thực đang hard-code
- **Vị trí:** `src/platform/auth/config/auth-bypass.ts:10` có `export const AUTH_BYPASS_ENABLED = false;`. Cờ này được dùng trong `route-guards.ts:39`, `auth-route-context.ts:83` và `student-auth-storage.ts:59`.
- **Rủi ro:** commit `8af5b98` từng bật cờ này cho bản preview. Chỉ cần sửa 1 dòng là production mở toàn bộ portal mà không cần đăng nhập.
- **Cách làm:**
  1. Đổi thành `export const AUTH_BYPASS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === "true";`
  2. Thêm test `auth-bypass.policy.test.ts`: build ở mode `production` thì cờ phải là `false`.
  3. Trong CI, thêm bước grep bundle `dist/` để chắc chắn không còn chuỗi token bypass, ví dụ `DEFAULT_BYPASS_STUDENT_SESSION`.
- **DoD:** `bun run build` rồi grep `dist/assets/*.js` không thấy dữ liệu bypass. Test xanh.

### P0-2. Refresh token đọc được bằng JavaScript
- **Vị trí:**
  - `src/platform/auth/api/auth-token-storage.ts:268` ghi toàn bộ session (kèm `refreshToken`, dòng 9 và 141) vào `sessionStorage`.
  - `src/lib/api-client.ts:502` gửi refresh token trong body.
  - `cross-tab-session.ts:63-66` đưa nguyên session cho tab khác.
- **Rủi ro:** chỉ cần một lỗ XSS, hoặc một dependency bị chèn mã độc, là kẻ tấn công lấy được refresh token và chiếm tài khoản vô thời hạn. Hiện cũng không có CSP để chặn (xem P0-4).
- **Cách làm:**
  1. Ưu tiên hoàn tất BFF HttpOnly (ticket ERG-092 đã có sẵn đường code `isBffAuthEnabled()`). Backend set cookie `HttpOnly; Secure; SameSite=Lax` cho refresh token, và FE chỉ giữ access token trong bộ nhớ.
  2. Nếu chưa làm BFF kịp: tối thiểu không lưu `refreshToken` vào storage, mà gọi `/auth/refresh` bằng cookie HttpOnly.
  3. Cross-tab: chỉ phát tín hiệu "đã đăng nhập/đã đăng xuất", không gửi token.
  4. Xoá các key session legacy trong `localStorage` một lần khi khởi động (`auth-token-storage.ts:272-275`).
- **DoD:** mở DevTools → Application thì không thấy `refreshToken` ở bất kỳ storage nào. Test `auth-api.test.ts` được cập nhật.

### P0-3. Secret ký bản cập nhật desktop lộ cho mọi bước CI
- **Vị trí:** `.github/workflows/desktop-release.yml:35-37` đặt `TAURI_SIGNING_PRIVATE_KEY` và mật khẩu ở `env` cấp job. Dòng 45 dùng `bun-version: latest`, và `bun install` chạy không có `--ignore-scripts`. Action được pin theo tag, không pin theo SHA.
- **Rủi ro:** một dependency bị chiếm quyền có thể đọc private key qua postinstall, rồi ký bản cập nhật độc hại. Mọi máy desktop sẽ tin bản đó.
- **Cách làm:**
  1. Chuyển 2 secret ký vào `env` của **riêng bước** `desktop:release:build`.
  2. Dùng `bun install --frozen-lockfile --ignore-scripts`, giống `vercel.json:3`.
  3. Pin `bun-version: 1.3.11`, khớp các workflow khác.
  4. Pin `actions/*` theo commit SHA.
  5. Nếu có nghi ngờ key đã lộ thì xoay vòng (rotate) cặp khoá updater.
- **DoD:** chỉ bước ký mới có secret trong `env`. Workflow chạy dry-run thành công.

### P0-4. Thiếu CSP/HSTS, và nginx mất header bảo mật
- **Vị trí:**
  - `index.html`, `vercel.json` và `deploy/nginx/default.conf.template` đều không có `Content-Security-Policy` hay HSTS.
  - Trong nginx, `add_header` ở các block `location = /index.html` (dòng 37–39), `/assets/` (64–66) và regex static (70–72) làm **mất các header khai báo ở cấp server** (dòng 76–79), vì nginx không kế thừa `add_header` khi location tự khai báo.
- **Cách làm:**
  1. Tạo `deploy/nginx/security-headers.conf` chứa `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` và CSP. Sau đó `include` file này trong **mọi** location có `add_header`.
  2. CSP khởi điểm: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.erg.edu.vn; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Bật `Content-Security-Policy-Report-Only` 1 tuần trước khi enforce.
  3. Thêm các header tương tự vào `vercel.json` → `headers`.
- **DoD:** `curl -I https://.../teacher/home` thấy đủ header. Báo cáo CSP không có vi phạm thật.

### P0-5. API bank câu hỏi trả dữ liệu giả khi lỗi
- **Vị trí:**
  - `src/features/lcms/quiz/question-bank/api/question-bank-api.ts:257-258` có `catch { return mockQuestionBankData(); }`, nuốt mọi lỗi 401/403/500.
  - Mapper `:464-505` trộn đáp án, lựa chọn và settings **từ mock** vào câu hỏi thật (`answer: question.answer ?? template.answer`).
  - `desktop-exercise-bank-view.tsx:77` fallback sang mock khi kết quả rỗng.
- **Rủi ro:**
  - Giáo viên tạo bài tập từ dữ liệu giả.
  - Lưu câu hỏi từ editor sẽ **ghi đáp án giả lên server**.
  - Test `admin-runtime-boundary.test.ts` đang fail đúng vì lỗi này.
- **Cách làm:**
  1. Bỏ `catch` để lỗi lan tới UI, và hiển thị `ErgErrorState` có nút thử lại.
  2. Mapper chỉ map DTO thật. Thiếu trường nào thì để mặc định trung tính (`[]`, `null`), không bao giờ lấy từ template mock.
  3. Bỏ fallback mock trong `desktop-exercise-bank-view.tsx:77` và thay bằng empty state.
- **DoD:** `admin-runtime-boundary.test.ts` xanh. Khi tắt backend, UI hiển thị lỗi chứ không hiển thị dữ liệu.

### P0-6. Mock lọt vào bundle production
- **Vị trí:** `vite.config.ts:106-119` chỉ alias 3 module mock. Các module sau vẫn bị đóng gói vào production: `mock-question-bank`, `mock-student-dashboard`, `mock-exercise-library`, `mock-weekly-class-log-data`, `portal-header-notification-data.ts`, và `lib/sample-quiz.ts` (được dùng không có gate trong `elearning-quiz-to-editor.ts:12-36`).
- **Cách làm:**
  1. Chuyển toàn bộ `mock-*` và `sample-quiz` vào `src/test/fixtures/`.
  2. Thêm ESLint `no-restricted-imports`: cấm import `**/mock-*` và `**/fixtures/**` từ code không phải test.
  3. Các nơi thật sự cần dữ liệu mặc định (`createMock*` trong `use-quiz-editor-state.ts:13-19`) thì đổi tên thành `createDefault*` và chỉ chứa giá trị trung tính.
  4. Bước CI: grep `dist/` tìm một số chuỗi đặc trưng của mock.
- **DoD:** lint chặn được import mock. Grep `dist/` sạch.

### P0-7. Mất trang sau mỗi lần deploy (lỗi chunk)
- **Vị trí:**
  - Không có chỗ nào xử lý `vite:preloadError` (grep = 0).
  - Nút "Thử lại" ở `src/routes/route-feedback.tsx:55` chỉ gọi `router.invalidate()`, trong khi `React.lazy` đã nhớ promise lỗi.
  - Hook cập nhật service worker chỉ được gắn ở shell mobile (`lms-mobile-shell.tsx:42`, `student-dashboard-mobile-shell.tsx:45`).
- **Rủi ro:** sau mỗi lần release, người dùng còn giữ shell cũ sẽ kẹt ở màn "Không thể tải trang" vĩnh viễn.
- **Cách làm:**
  1. Trong `src/main.tsx`: `window.addEventListener("vite:preloadError", () => { if (!sessionStorage.getItem("erg-chunk-reload")) { sessionStorage.setItem("erg-chunk-reload","1"); location.reload(); } });`, và xoá cờ sau khi tải thành công.
  2. `RouteErrorBoundary`: nếu lỗi là `ChunkLoadError` hoặc `Failed to fetch dynamically imported module` thì `location.reload()`.
  3. Gắn `useServiceWorkerUpdate` một lần trong `GlobalPwaBanner`, để mọi portal đều có thông báo "Có phiên bản mới".
  4. Bọc một `ErrorBoundary` bên ngoài `RouterProvider` trong `App.tsx:61-68`.
- **DoD:** deploy bản A, mở app, deploy bản B rồi điều hướng thì app tự tải lại, không kẹt.

### P0-8. Dữ liệu offline chưa đồng bộ bị xoá khi lỗi
- **Vị trí:** `src/platform/offline/offline-outbox-store.ts` (khoảng dòng 44–62): mọi lỗi khi `load` (giải mã, migrate v1, mất key) đều rơi vào `catch { await this.clear(scopeKey) }`.
- **Rủi ro:** ở mạng LAN dùng http (`crypto.subtle` không khả dụng), hoặc khi trình duyệt dọn bớt dữ liệu, mọi thao tác giáo viên đang chờ đồng bộ **bị xoá âm thầm**.
- **Cách làm:** chuyển bản ghi lỗi sang store `quarantine`, báo lỗi qua toast/telemetry, và chỉ xoá khi người dùng xác nhận.
- **DoD:** có test giả lập lỗi giải mã, xác nhận dữ liệu vẫn còn trong quarantine.

### P0-9. Hiển thị mật khẩu tạm (OTP) dưới tên nhân viên khác
- **Vị trí:** `src/features/employee-management/components/employee-detail-drawer.tsx:60, 132`. State `temporaryCredential` không được reset khi đổi `userId`. Drawer vẫn mounted (`employee-list-workspace.tsx:842`).
- **Cách làm:** đặt `key={userId}` cho drawer, hoặc reset state trong `onClose` và khi `userId` đổi, giống cách `create-employee-wizard.tsx:196` đang làm.
- **DoD:** có test: reset mật khẩu cho A → đóng → mở B → không thấy OTP.

### P0-10. Lỗi `rules-of-hooks` ở 11 chỗ (có thể crash khi render)
| File | Dòng | Hook |
|---|---|---|
| `src/platform/auth/components/portal-route-gates.tsx` | 26, 27, 85, 86 | `useAuthSession`, `useLocation` gọi sau `return` sớm |
| `src/components/portal/portal-workspace-switcher.tsx` | 67 | `useNavigate` có điều kiện |
| `src/features/lcms/school-management/components/setup/school-students-step.tsx` | 49, 59, 72, 77 | `useMemo` |
| `src/features/lcms/school-management/components/setup/school-curriculum-step.tsx` | 85 | `useMemo` |
| `src/features/elearning/student-dashboard/components/student-dashboard-workspace-runtime.tsx` | 630 | `useMemo` |
- **Cách làm:** đưa mọi hook lên đầu component, trước mọi `return` sớm.
- **DoD:** `bun run lint` không còn lỗi `rules-of-hooks`.

### P0-11. Hai trang làm treo cứng tab trình duyệt
- **Tái hiện (Playwright):** mở `/admin/profile` hoặc `/teacher/exams/portable` thì main thread JS khoá hoàn toàn: `page.evaluate` không trả về, trang không phản hồi. `/student/profile` và `/student/exams/portable` thì bình thường.
- **Nguyên nhân gốc (đã xác nhận):** guard route và trang access-denied **đá qua đá lại vô hạn**.
  - Bằng chứng: hook `history.replaceState` ghi được hơn 40 lượt `/access-denied?portal=ADMIN&redirect=/admin/profile` ↔ `/admin/profile`. CDP pause cho thấy React render lại liên tục. Mỗi bước là một lần load router bất đồng bộ, nên React không báo "Maximum update depth" mà tab bị treo.
  1. `src/platform/auth/permissions/route-permission-matrix.ts` (khoảng 154–189):
     - **Không có dòng cho `/admin/profile`.** `/admin` cũng bị loại khỏi `nestedRoutePrefixes`, nên `routePermissionForPath("/admin/profile","ADMIN")` trả `null`.
     - Còn `/teacher/exams/portable` đòi quyền `lms.quiz.read`, mà tài khoản giáo viên không có (đã kiểm bằng session thật).
     - Cả 2 trường hợp đều khiến guard `enforceWorkspaceRoute` (`route-guards.ts:45-55`) chuyển sang `/access-denied`.
  2. `src/platform/auth/components/access-denied-page.tsx:57-76` chỉ kiểm tra người dùng **có vào được workspace** hay không, không kiểm tra **quyền của route**. Người dùng có workspace nên trang này `navigate` quay lại `redirect`, guard lại chặn, cứ thế lặp mãi.
- **Cách sửa:**
  ```ts
  // route-permission-matrix.ts: thêm dòng hồ sơ cho admin (và rà mọi route thiếu dòng)
  { path: "/admin/profile", workspace: "ADMIN", resource: "account.self", action: "read", permission: "account.self.read" },

  // access-denied-page.tsx, trong effect, trước navigate(): chỉ quay lại khi route thật sự được phép
  const entry = requestedWorkspace ? routePermissionForPath(redirect, requestedWorkspace) : null;
  if (!entry || (entry.permission && !auth.hasPermission(entry.permission))) return;
  ```
  - Về nghiệp vụ: quyết định giáo viên có được mở thi portable không. Nếu có, backend cấp `lms.quiz.read` (hoặc đổi quyền của route thành `exam.portable.launch`). Nếu không, ẩn mục menu.
  - Thêm test: mọi path trong `portal-route-registry` đều phải có dòng trong ma trận quyền. Thêm test cho access-denied: không redirect quay lại khi thiếu quyền.
- **DoD:** cả 2 trang mở được trong < 2 giây. Có test Playwright smoke cho 2 trang này.

### P0-12. "Maximum update depth exceeded" ngay sau khi đăng nhập
- **Tái hiện:** `pageerror` xuất hiện ngay khi vào `/admin` và `/teacher/home`. Trang chủ giáo viên vẫn là skeleton sau 2,5 giây.
- **Nguyên nhân gốc (đã xác nhận):** lỗi **không nằm ở trang chủ** mà ở **trang đăng nhập khi redirect sau login**. Mở thẳng `/admin` sau khi đã đăng nhập thì không có lỗi.
  - Vị trí: `src/platform/auth/components/portal-login-page.tsx:75-83` trả về `<Navigate replace to={redirect} />`.
  - Cơ chế: `Navigate` của TanStack gọi `navigate()` mỗi khi object props đổi, và mỗi lần render lại tạo object mới. Route `/admin` được lazy-load (`pending`) nên trang login vẫn còn mounted. Mỗi `navigate('/admin')` trùng URL lại gọi `router.load()`, rồi `Transitioner.startTransition` setState, rồi login render lại, rồi `Navigate` chạy lại. Kết quả là 53 lần lỗi "Maximum update depth".
  - Bằng chứng: logpoint CDP trong `commitLocation` ghi được lượt 1 `/login → /admin`, các lượt sau `/admin → /admin sameUrl=true state=pending`.
- **Cách sửa:**
  ```tsx
  // portal-login-page.tsx: tính đích một lần, navigate theo dependency là chuỗi
  const target = /* redirect | accessDeniedPath(...) | null */;
  useEffect(() => { if (target) void navigate({ href: target, replace: true }); }, [target, navigate]);
  if (target) return null;
  ```
  - Rà các chỗ trả `<Navigate>` có điều kiện trong `src/routes/app-routes.tsx` (`PortalIndexPage`, các redirect legacy) vì có cùng pattern. Về lâu dài, chuyển các redirect này vào `beforeLoad` (mục 5.3, bước 5).
- **DoD:** console sạch ở `/admin` và `/teacher/home`. Trang chủ hiển thị nội dung trong < 1,5 giây (dev).

### P0-13. Học sinh không nộp được bài thi khi chưa làm hết, và hết giờ thì không tự nộp
- **Vị trí:**
  - `src/components/quiz/player-shell-runtime.tsx:1326`: nút "NỘP BÀI" chỉ hiện khi `allQuestionsAnswered`.
  - `:556`: `requestSubmit` thoát luôn khi chưa trả lời hết.
  - `:560-562`: hết giờ chỉ báo lỗi, không nộp.
  - `mobile-player-shell.tsx:89`: trên mobile cũng vậy.
- **Rủi ro:** học sinh để trống một câu thì **không thể nộp bài**. Hết giờ thì bài có thể không được ghi nhận.
- **Cách làm:** xem mục 7.4 (bước 1–2). Phối hợp backend để tự chốt bài khi hết hạn.
- **DoD:** có test cho 3 trường hợp: nộp khi còn câu trống, hết giờ tự nộp, mất mạng lúc hết giờ (nộp được khi có mạng lại).

### P0-14. Dữ liệu giả hiển thị như dữ liệu thật trên UI
- **Vị trí:**
  - Dashboard admin: `admin-dashboard.tsx:105-122`.
  - 7 báo cáo và 3 trang tích hợp: `admin-erg-workspaces.tsx`, số đếm `3 + index` ở dòng 398.
  - Mục "Hôm nay" của giáo viên: `lms-teacher-shell-presentation.tsx:98`.
  - Thông báo ở header: `ErgPortalHeader.tsx:56`.
  - Badge CRM 24.
  - Sổ đầu bài tuần 23: `mock-weekly-class-log-data.ts`.
  - Tiến độ 62% cho mọi học sinh.
- **Rủi ro:** quản lý ra quyết định dựa trên số liệu giả.
- **Cách làm:** mỗi màn hoặc nối API thật, hoặc hiện EmptyState trung thực ("Chưa có dữ liệu"), hoặc **ẩn khỏi menu** đến khi có API. Không bao giờ hiển thị số hard-code.
- **DoD:** grep không còn mảng dữ liệu mẫu trong `features/**` ngoài `test/fixtures`. Bảng kiểm từng màn ở mục 7.6.

---

## 3. 🔴/🟠 Sức khoẻ build và CI (tuần 1)

1. **Workflow `ci.yml` cho mọi PR** (🔴): `bun install --frozen-lockfile --ignore-scripts` → `typecheck` → `lint` → `test` → `build` → `check:budget`. Pin bun 1.3.11. Cache `~/.bun`.
2. **Sửa 22 lỗi lint** (🔴), bắt đầu bằng P0-10. Phần còn lại gồm 6 `no-unused-vars`, 4 `no-extra-boolean-cast`, 1 `no-empty` (`student-dashboard-mobile-shell.tsx:101`) và 2 directive `eslint-disable` không còn dùng (`portal-sidebar-logo.tsx:32`, `portal-sidebar-workspace-header.tsx:136`).
3. **Sửa 4 test fail** (🔴):
   - `admin-runtime-boundary.test.ts` (2 test): sửa bằng P0-5.
   - `profile-page-split.policy.test.ts`: `profile-page.tsx` dài 373 dòng, vượt giới hạn 220. Tách file hoặc xoá policy test (xem mục 9).
   - `portal-smoke-contract.test.ts`: thiếu `assertGuestRedirect` trong spec smoke. Bổ sung kịch bản cho portal teacher (hiện chưa có project smoke cho teacher).
4. **Bật TypeScript strict theo từng bước** (🟠):
   - Bước 1: `strictNullChecks` cùng một file baseline lỗi. Không cho thêm lỗi mới.
   - Bước 2: `noImplicitAny`.
   - Bước 3: `strict`.
   - Typecheck cả file test.
5. **ESLint** (🟠): bật lại `no-explicit-any` ở mức warn, và bật lại 5 rule react-hooks đang tắt (`eslint.config.js:27-40`).
6. **Gom 7 script kiểm tra chưa dùng** vào `bun run verify`, rồi chạy trong CI: `check-circular-dependencies`, `check-data-boundary`, `check-frontend-folder-boundary`, `check-workspace-route-ownership`, `check-api-endpoint-literals`, `check-mui-barrel-imports`, `check-legacy-identifiers`. Script nào không giữ thì xoá.
7. **Dọn cấu hình chết:**
   - Xoá rule `manualChunks` FullCalendar và budget `"fullcalendar": 900000` (package không còn được cài).
   - Sửa regex `modulePreload` ở `vite.config.ts:162`.
   - Sửa `skills-lock.json` đang trỏ tới thư mục đã xoá.
   - Sửa tên package `react-erg-elerning-fe` (sai chính tả).
8. **Thay `xlsx@0.18.5`** (🔴, có CVE-2023-30533 và CVE-2024-22363), vì nó parse file Excel người dùng upload:
   - Các nơi dùng: `class-import-dialog.tsx:97`, `student-import-dialog.tsx:52`, `use-attendance-sheet-controller.ts:189`.
   - Đổi sang `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` hoặc `exceljs`.

---

## 4. 🟠 Lỗi chức năng và logic đã xác minh

### 4.1 Giáo viên không vào được portal học viên (bạn đã báo)
- **Tái hiện bằng Playwright:**
  - Tài khoản giáo viên mở `/student` → `/access-denied?portal=STUDENT` (403 "Không thể vào Student Workspace").
  - Tài khoản admin thì vào được.
- **Nguyên nhân (3 lớp):**
  1. Backend cấp session `workspaces: ["TEACHER"]`, `portals: ["lms"]`, roles `lms_subject_teacher`, `pdt_operator`.
  2. `src/platform/auth/permissions/workspace-capability-projection.ts:111-118` chỉ cấp STUDENT cho role học sinh hoặc portal `elearning`/`student`.
  3. Route `/student` còn đòi quyền `elearning.assignment.read_self` (`route-permission-matrix.ts:157-164`). Giáo viên không có quyền này, và về nghiệp vụ cũng không nên có. "read_self" nghĩa là bài tập của chính mình.
- **Cách làm (khuyến nghị: chế độ "Xem như học viên"):**
  1. Backend: thêm quyền `elearning.student.preview` cho các role giáo viên và quản trị. Trả về `workspaces` có STUDENT kèm cờ `studentMode: "preview"`.
  2. FE: thêm `isStaffPreviewEligible(claims)` trong `platform/auth/permissions`, dùng bộ role chuẩn ở mục 5.2. `projectVerifiedWorkspaces` cấp STUDENT khi role là staff và có quyền preview.
  3. Ma trận route: `/student` chấp nhận `elearning.assignment.read_self` **hoặc** `elearning.student.preview`.
  4. UI: thanh banner "Bạn đang xem với tư cách giáo viên. Bài làm không được tính điểm". Ở chế độ preview, chặn nộp bài thật (chỉ chạy runtime ở chế độ thử).
  5. Thêm nút "Xem portal học viên" trong workspace switcher cho giáo viên và admin.
- **DoD:** tài khoản giáo viên mở `/student` và thấy banner preview. Nộp bài ở chế độ preview không tạo attempt thật. Có test cho `projectVerifiedWorkspaces` và ma trận route.

### 4.2 `/teacher/*` lặp redirect rồi văng ra login trên `localhost`
- **Tái hiện:** `https://localhost:3001/teacher/home` đi qua chuỗi `/teacher/home` ×4 rồi tới `/login?redirect=...`. Trên `lms.erg.edu.local:3001` thì chạy bình thường.
- **Nguyên nhân:**
  - Route `lmsRoutes` (`app-routes.tsx:441-458`) dùng `PortalRoute` → `resolveActivePortal()` (`portal-host-resolution.ts:14`). Hàm này trả `null` trên localhost.
  - Trong khi đó `isCanonicalLmsWorkspaceHost` ở `workspace-route.ts:35` coi localhost là host chuẩn.
  - Ngoài ra có một hàm **trùng tên** `isCanonicalLmsWorkspaceHost` ở `portal-host-resolution.ts:43`, chỉ khớp `lms.erg.edu.vn`.
- **Cách làm:** sửa tận gốc bằng mục 5.2 (một hàm `resolveRuntimeWorkspace` duy nhất). Sửa tạm: `resolveActivePortal` trả `"lms"` cho các host local (dùng lại danh sách host trong `workspace-route.ts`).
- **DoD:** `localhost:3001/teacher/home` mở được. Có unit test cho 5 loại host (localhost, 127.0.0.1, `lms.erg.edu.local`, `lms.erg.edu.vn`, `crm.*`).

### 4.3 Hydrate cache của portal học viên lỗi
- **Hiện tượng (console):** `A query that was dehydrated as pending ended up rejecting ... ["student-dashboard","erg","usr_super_admin"]: CancelledError`, lặp nhiều lần mỗi lần mở `/student`.
- **Nguyên nhân:** persister lưu cả query đang `pending`, và khi khôi phục thì query bị huỷ.
- **Cách làm:** trong `src/lib/query-persistence.ts`, dùng `dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === "success" && isPersistableQuery(q) }`.
- **DoD:** console sạch khi mở `/student`.

### 4.4 Các lỗi logic khác (đều đã đọc code xác minh)
| # | Vấn đề | Vị trí | Cách sửa |
|---|---|---|---|
| 1 | Đổi quiz trong editor có thể **ghi nội dung quiz A đè lên quiz B** (ref `draftReadyForRecoveryRef` không bao giờ reset; autosave 500 ms) | `quiz-editor-workspace.tsx:150, 216, 285-321` | Reset ref và tạm dừng autosave khi `effectiveQuizId` đổi, cho tới khi hydrate xong. Viết test tái hiện trước |
| 2 | Publish bấm 2 lần tạo 2 quiz; trạng thái publish không rollback khi lỗi; code tạo quiz bị lặp | `quiz-editor-workspace.tsx:596-624, 663-746` | Thêm cờ `isPublishing`, chỉ set published sau khi thành công, tách hàm `createQuizIfNeeded()` |
| 3 | Chọn trường bị nhảy về trường cũ sau khi tạo hoặc lưu trữ; `version ?? 0` gửi version giả | `use-school-management.ts:42-46, 81, 102, 109` | Chọn trường hoàn toàn qua URL search param. Không gửi version khi không có |
| 4 | Ghi danh: `classId` cũ còn giữ khi đổi trường; lỗi lưu không có thông báo | `school-enrollments-screen.tsx:22, 37-42` | Reset khi đổi trường, `try/catch` và toast |
| 5 | Phân bổ môn–lớp chỉ lưu ở localStorage, không theo tenant/tài khoản | `school-curriculum-step.tsx:28-56` | Lưu lên server; tạm thời reset state khi `storageKey` đổi |
| 6 | Thông báo giả ở header của mọi portal; badge CRM luôn là 24 | `ErgPortalHeader.tsx:56`, `portal-sidebar-bottom.tsx:86`, `crm-portal-shell.tsx:342` | Nối với `fetchNotificationFeed` / `fetchUnreadNotificationCount` (đã có trong `lms-notification-center.tsx`) |
| 7 | CRM shell luôn bật `canAccessGlobalErg = true` và dùng ID trường/lớp mock | `crm-portal-shell.tsx:24, 382, 387-388` | Lấy từ session như `dashboard-shell.tsx:96` |
| 8 | Lịch tháng: ô đầu và cuối tháng trống dù có lịch | `use-erg-calendar-workspace.ts:96-103` so với `:140` | Dùng ô đầu và cuối của ma trận 6 tuần làm `from`/`to` |
| 9 | Bộ lọc ngày audit dùng UTC, lệch 7 giờ với GMT+7; mỗi lần gõ phím lại gọi API | `audit-filter-bar.tsx:52, 60` | `dayjs(date).startOf("day").toISOString()`, `useDebouncedValue` |
| 10 | Drawer nhân viên: refetch ghi đè form đang sửa; `mutateAsync` không có catch | `employee-detail-drawer.tsx:78-92, 99-128` | Chỉ đồng bộ form khi `!editing`, bọc try/catch |
| 11 | 77 chỗ gọi `mutateAsync` kiểu "bắn rồi quên", gây unhandled rejection | Ví dụ `employee-list-workspace.tsx:616`, `lms-notification-center.tsx:98` | Dùng `mutate()`, thêm `MutationCache({ onError })` toàn cục hiển thị toast trong `src/lib/query-client.ts` |
| 12 | Lịch dạy có thể tạo buổi vượt ngày kết thúc (`repeatWeeks = floor(diff/7)+1`, không gửi `applyTo`) | `schedule-draft.ts:73-77` | Gửi `applyTo`, hoặc chặn khoảng ngày ngay ở client |
| 13 | Redirect sau đăng nhập dùng bộ lọc yếu, `/\evil.com` lọt qua được | `portal-login-controller.ts:130`, `portal-login-page.tsx:45`, `teacher-onboarding-page.tsx:114`, `learning-resource-login-page.tsx:207` | Dùng `sanitizeLocalRedirect` (`auth-redirects.ts:86`) ở cả 4 chỗ |
| 14 | SSO `returnTo` chấp nhận localhost ở production | `sso-return-to.ts:47` | Chỉ cho phép khi `import.meta.env.DEV` |
| 15 | Module legacy `cross-domain-session.ts` đọc cookie cha không HttpOnly rồi chép token vào localStorage | `cross-domain-session.ts:159-174`, `main.tsx:39` | Xoá module và lời gọi |
| 16 | CRM lead (tên, số điện thoại) lưu IndexedDB **không mã hoá** trong 24 giờ | `query-persistence.ts:26` | Loại khỏi persist, hoặc mã hoá như outbox |
| 17 | Link tải gói portable chấp nhận mọi host HTTPS; `revokeObjectURL` gọi quá sớm (Safari huỷ tải) | `portable-package-download.ts` | Dùng lại allowlist ở `desktop-release-manifest.ts:144`; revoke trong `setTimeout` |
| 18 | Client tin backend đã gỡ đáp án ra khỏi gói | `quiz-runtime-package-normalizer.ts:126`, `quiz-runtime-question-normalizers.ts:73` | Ở chế độ server-authoritative, xoá `correct*` ngay phía client |
| 19 | Lỗi `promise.then is not a function` trong persist-client làm **cache offline bị xoá** (thấy ở màn Kho luyện tập) | `src/lib/query-persistence.ts` và persister IndexedDB | Persister phải trả về Promise thật (`async`). Có test khôi phục cache |
| 20 | Lỗi GraphQL "class scope is not allowed for the authenticated principal" bị nuốt, Nhóm học sinh hiện danh sách trống không giải thích | `student-groups-page.tsx`, class-management API | Hiện Alert lỗi quyền. Kiểm tra lại scope giáo viên ở backend |
| 21 | Màn Thông báo prefetch roster của 11 lớp (tốn băng thông 3G, sinh 15 lỗi `CancelledError`) | `lms-notification-center.tsx` | Bỏ prefetch, chỉ tải khi cần |
| 22 | Hai nguồn roster mâu thuẫn: lớp 9A1 hiện 0/0 ở "Lớp học" nhưng 46/46 ở "Giao bài" | `classroom-tracking-workspace.tsx` so với assign-homework | Một nguồn roster ở `domain/school` |
| 23 | `/admin/quiz-bank`, `/admin/questions`, `/admin/quiz-editor`, `/admin/resources` trả 404 | `app-routes.tsx:460` (`LEGACY_ADMIN_CONTENT_SEGMENTS` không có tiền tố `/admin`) | Redirect sang `/admin/content/*` |
| 24 | Chuẩn đầu ra (admin, teacher, student), Thi portable và Tải ứng dụng hiển thị **ngoài shell**, không có đường quay lại | `app-routes.tsx:591, 629-711` (gắn trực tiếp vào `rootRoute`) | Đưa vào layout của từng workspace |
| 25 | `<div>` nằm trong `<td>` (lỗi hydration/DOM) ở dashboard admin | `admin-dashboard.tsx` | Bỏ Card bọc bên trong ô bảng |
| 26 | "Invalid Date", ngày kiểu Mỹ (11/03 thay vì 03/11), ô ngày Sổ đầu bài trống do sai định dạng | `desktop-exercise-bank-view.tsx`, attendance, `weekly-class-log-header.tsx` | Một formatter ở `domain/calendar` (`vi-VN`, `dd/MM/yyyy`); input `type=date` nhận ISO |
| 27 | Mất dấu tiếng Việt trong UI ("Chon bai va giao nhanh", "phut", "Chua co bai dang giao") | `mobile-exercise-bank-view.tsx:36,79`, `assign-homework-mobile-view.tsx:378`, assign-homework | Khôi phục dấu; đưa chuỗi vào `messages.ts` |

---

## 5. 🟠 Kiến trúc: loại bỏ chồng chéo, đặt lại ranh giới

### 5.1 Vấn đề chính (đã xác minh)
- **Dispatch kiểu if/else, không dùng route tree:**
  - `app-routes.tsx` (832 dòng) là danh sách phẳng, nhiều mảng chuỗi cùng trỏ vào một component.
  - Việc điều hướng thật nằm trong shell, dưới dạng chuỗi if theo pathname: `admin-erg-portal-shell.tsx:101-215`, và ternary 25 nhánh trong `lms-teacher-shell-workspaces.tsx:61-177, 205-327`.
  - Hệ quả: không có param hay search có kiểu, không có loader, không code-split theo màn hình. Điều này **trái quy tắc "Route type-safe, KHÔNG if/else chain" trong CLAUDE.md**.
- **Kiểm tra quyền chạy 3 lần cho mỗi request:** `beforeLoad enforceWorkspaceRoute`, `PortalAuthGate`, và kiểm tra host được copy-paste vào 12 route (`app-routes.tsx:536-710`). Redirect host lại là `useEffect` + `window.location.replace` (`:124-138`).
- **5 hàm xác định portal/workspace/host, và chúng cho kết quả khác nhau:**
  - `resolveActivePortal` (`portal-host-resolution.ts:14`)
  - `resolveCurrentPortal` (`auth-token-storage.ts:177`)
  - `resolveWorkspaceLocation` (`workspace-domain.ts:84`)
  - `canonicalWorkspaceForPath` (`workspace-route.ts:21`)
  - `getBackOfficePortal` (`api-client.ts:599`)

  Danh sách host local bị copy 5 lần. Đây là nguyên nhân của lỗi 4.2.
- **7 bản copy danh sách role admin, và đã lệch nhau:** `erg_admin` có trong `auth-api.ts:353-366` nhưng không có trong `auth-storage.ts:233`. Các bản khác: `portal-login-controller.ts:184`, `app-routes.tsx:246-249`, `workspace-capability-projection.ts:23-33`, `user-access-control-utils.ts:92`. Email root admin bị hard-code ở `workspace-capability-projection.ts:20`.
- **3 bộ tính trang đích sau đăng nhập:** `access-denied.ts:92`, `desktop/entry.ts:38`, `portal-login-controller.ts:174-200`, cộng thêm ưu tiên đọc từ localStorage ở `app-routes.tsx:250-271`.
- **20 file đọc session trực tiếp** (`readStoredAuthSession`/`getCurrentAccount`) thay vì đi qua `useAuthSession`.
- **Domain quiz nằm rải ở 4 nơi:** `lib/` (`types.ts`, `quiz.ts`, `assessment-engine.ts`, `attempt-store.ts` (chết)), `features/lcms/quiz/quiz-runtime`, `components/quiz`, `features/elearning/portable-exam`.
- **Vòng phụ thuộc lms ↔ lcms:** 21 import theo một chiều và 22 import theo chiều ngược lại.
- **Phụ thuộc ngược chiều:**
  - `platform/auth` → `app/portal-route-registry` (`route-permission-matrix.ts:1`).
  - `lib` → `features`.
  - `layouts` → `features`.
  - `components` → `features` (27 chỗ).
- **5 kiểu tầng gọi API:** `createApiClient().request`, typed OpenAPI `.operation()`, `apiRequest` thô, GraphQL, `fetch` trần. Có **50 chỗ** viết lại `error instanceof Error ? error.message`.
- **Query key không theo một chuẩn** (4 hình dạng, 25 factory). Hàm `isPersistableQuery` phân tích key theo vị trí, nên đổi hình dạng key là mất persist mà không có cảnh báo.
- **3 component bảng** (`shared/DataTable`, `ui/data-table`, `erg-mui/erg-table`). **3 bản user menu/thông báo.** **2 workspace lịch LMS.** **27 file tự format ngày `vi-VN`.**
- **Code chết:**
  - 5 file trong `src/pages` (account, crm, dashboard, login-logs, student).
  - `app/pages/lms/lms-page.tsx`, `app/pages/elearning/elearning-page.tsx`.
  - Gần như toàn bộ `layouts/dashboard` (`DashboardShell` và cây con).
  - `lib/attempt-store.ts`, `lib/auth.ts`.
  - 4 tên export cho cùng một admin shell.
  - `SchoolManagementWorkspace`, `shouldUseLocalQuizRuntimeFallback` (luôn trả `false`).

### 5.2 Cấu trúc thư mục đích
```
src/
  app/            main.tsx, App.tsx, providers/, router/{root.tsx, guards.ts, legacy-redirects.ts},
                  routes/{public,admin,teacher,student,crm}/*.route.tsx
  platform/
    auth/         nguồn session DUY NHẤT (useAuthSession, getAuthScope), policy role/permission
                  (isAdminLike, isStaffPreviewEligible, projectVerifiedWorkspaces)
    workspace/    resolveRuntimeWorkspace() DUY NHẤT + một danh sách host
    http/         api-client, graphql-client, errors (mapApiError), query-client, query-keys, persistence
    offline/  desktop/  i18n/
  domain/         quiz/ (types, scoring, engine), school/ (School, Class, Student),
                  notification/, calendar/ (date range, formatter vi-VN)
  features/       admin-*/ teacher-*/ student-*/ crm-*/ + slice dùng chung (question-bank, quiz-runtime,
                  teaching-calendar, notifications). Feature KHÔNG import feature khác (chỉ qua domain/)
  shared/ui/      erg-mui/ (1 bảng, form wrapper), portal-shell/ (1 header, 1 user menu, 1 chuông thông báo)
  test/fixtures/  mọi mock-*, sample-quiz, runtime-stubs
```

### 5.3 Lộ trình refactor (app luôn chạy được sau mỗi bước)
1. **Xoá code chết** (không đổi hành vi): danh sách ở 5.1. Thêm `no-restricted-imports` cho mock.
2. **Gom policy:**
   - Một `isAdminLike(claims)`, một `resolveRuntimeWorkspace()`, một danh sách host. Các hàm cũ chỉ còn là adapter gọi hàm mới.
   - **Viết characterization test trước khi sửa.** `access-denied.test.ts` và `portal-login-controller.test.ts` phải giữ nguyên kết quả.
3. **Truy cập session:**
   - 20 caller chuyển qua `getAuthScope()`.
   - Query key chuẩn hoá theo `scopedQueryKey`.
   - Persist dùng `meta: { persist: true }` thay cho việc parse key.
4. **Tách domain:** chuyển quiz ra khỏi `lib` vào `domain/quiz`, cùng với school, notification, calendar và formatter. Cắt vòng lms ↔ lcms. Question-bank thành feature riêng.
5. **Chuyển router sang route tree, mỗi lần một workspace** (teacher → admin → student → crm):
   - Mỗi shell có `<Outlet/>`, mỗi nhánh if trở thành một route con có `staticData.permission`.
   - Chỉ một `beforeLoad` gốc kiểm tra quyền và host.
   - `PortalAuthGate` chỉ còn là fallback UI.
   - Cây route đích:
   ```
   __root
   ├─ _public: /login, /access-denied, /onboarding
   ├─ _authed (beforeLoad: session + canonical host, 1 lần)
   │  ├─ admin   (ADMIN)   layout=AdminShell:   index, schools/$schoolId/*, employees, settings/{roles,permissions},
   │  │                                         content/{structure,resources,questions,quiz-bank,quiz-editor/$quizId},
   │  │                                         report/*, integration/*, learning-outcomes, profile
   │  ├─ teacher (TEACHER) layout=TeacherShell: home, homework/{assign,progress,exercise-bank,...}, calendar, score, ...
   │  ├─ student (STUDENT | staff preview) layout=StudentShell: index, exams/portable, learning-outcomes, profile
   │  └─ crm     (CRM)     layout=CrmShell:     seo/*
   └─ $ → chỉ bảng legacy redirect
   ```
6. **Dọn dẹp:**
   - Một bảng `ErgTable`. Header nối với `features/notifications`.
   - Form chuyển sang TanStack Form (hiện chỉ có 6 file dùng; các form như `school-form-dialog.tsx`, `create-teacher-account-dialog.tsx`, `user-access-control-workspace.tsx` vẫn tự viết bằng `useState`).
   - Một tầng API: OpenAPI typed `.operation()` cộng `mapApiError`.
   - Tách các file > 600 dòng (xem phụ lục A).

**DoD cho mục 5:**
- Script `check-circular-dependencies` báo 0 vòng.
- Không còn import `features → features`, `lib → features`, `platform → app`.
- `app-routes.tsx` không còn tồn tại.
- Mỗi màn hình là một route lazy riêng.

---

## 6. 🟠 Hiệu năng, runtime và PWA (mục tiêu chạy tốt trên 3G)

| # | Vấn đề | Vị trí | Cách làm | Mục tiêu |
|---|---|---|---|---|
| 1 | Precache 8,1 MB / 98 file | `vite.config.ts:38` (`**/*.woff2`), `scripts/pwa-precache-policy.mjs` | Bỏ woff2 khỏi precache và dùng runtime `CacheFirst`; chỉ import subset `latin` + `vietnamese` | Precache < 2 MB |
| 2 | 11 import font tải ngay từ đầu (2 họ × 5 weight + Manrope) | `src/themes/erg-enterprise-theme.tsx:3-13` | **1 họ font, 3 weight** (400/600/700), subset vi + latin | Font < 150 KB |
| 3 | Quiz player render lại toàn bộ mỗi giây (component 1.357 dòng) | `player-shell-runtime.tsx:584` | Tách `<Countdown>` tự giữ interval; `memo` các panel | Không render lại khung player mỗi tick |
| 4 | Component khổng lồ nhiều state | `quiz-editor-workspace.tsx` (937 dòng, 11 state, 9 effect), `question-editor-dialog.tsx` (1.506), `create-employee-wizard.tsx` (1.347) | Tách theo step hoặc section; form state đưa vào TanStack Form | Mỗi file < 300 dòng |
| 5 | Chunk nặng | `xlsx` 425 KB, `pdfjs` 411 KB, `admin-operations-workspace` 304 KB, `tanstack` 263 KB, `quiz-editor-workspace` 165 KB | `xlsx`/`pdfjs` chỉ `import()` khi bấm nhập/xem; chia `admin-operations-workspace` theo màn hình | Mỗi chunk route < 150 KB gzip |
| 6 | `gcTime` 10 phút < `maxAge` persist 24 giờ, nên query khôi phục bị GC ngay | `src/lib/query-client.ts`, `query-persistence.ts` | `gcTime` của query persist bằng `maxAge`, giới hạn kích thước persist | |
| 7 | Không có `QueryCache`/`MutationCache` `onError` toàn cục | `src/lib/query-client.ts` | Thêm toast lỗi và log telemetry | |
| 8 | Polling vẫn chạy khi màn hình ẩn | `use-employee-management.ts:48` | `refetchInterval` dựa trên visibility | |
| 9 | Cấu hình `QUERY_POLICIES.persist` không được dùng ở đâu | `query-policy.ts` | Dùng làm nguồn duy nhất, xem 5.3 bước 3 | |
| 10 | `vitest maxWorkers: 2` vì chi phí transform MUI | `vite.config.ts:206` | Giữ, nhưng tách lane test nhanh và chậm | Test < 3 phút |
| 11 | TS 6 cần `ignoreDeprecations` cho `baseUrl` | `tsconfig*.json` | Bỏ `baseUrl`, dùng `paths` thuần trước khi lên TS 7 | |

**Ngân sách bundle mới** (cập nhật `bundle-budget.json`):
- Entry < 120 KB gzip.
- Mỗi route < 150 KB gzip.
- Precache < 2 MB.
- LCP trên 3G (Lighthouse "Slow 4G", CPU 4×) < 3,5 giây cho `/teacher/home` và `/student`.

---

## 7. UI/UX: đánh giá từng portal và kế hoạch nâng cấp

> **Nguồn:**
> - Playwright chụp 53 màn hình, mỗi màn có ảnh desktop 1440px (full-page) và mobile 390×844, ghi kèm lỗi console và API của từng trang. Phạm vi: admin 28 trang (tài khoản admin), teacher 18 trang (tài khoản giáo viên), student 7 trang (admin xem portal học viên).
> - Đánh giá theo rubric app-screens/critique của taste-skill, đối chiếu với code.
> - Mốc so sánh: CenterUp, Azota.
>
> **Chưa chụp được:**
> - 2 trang bị treo tab: `/admin/profile`, `/teacher/exams/portable` (xem P0-11).
> - Các trang `/admin/content`, `/admin/downloads/desktop`, `/teacher/downloads/desktop`, `/teacher/learning-outcomes`.
> - Các tab con và màn làm bài của portal học viên. Phần làm bài được đánh giá từ code.

### 7.0 Điểm hiện tại (thang 10)
| Tiêu chí | Admin | Teacher | Student |
|---|---|---|---|
| Nhất quán thị giác | 3 | 3 | 3 |
| Phân cấp / chữ | 4 | 4 | 5 |
| Mật độ / khoảng trắng | 5 | 5 | n/a |
| Điều hướng / IA | 5 | 4 | n/a |
| Bảng dữ liệu | 4 | 5 | n/a |
| Form | 3 | 3 | n/a |
| Trạng thái rỗng / tải / lỗi | 3 | 2 | n/a |
| Mobile | 2 | 4 | 5,5 |
| Accessibility | 4 | 3 | 4,5 |
| **Tổng** | **~4** | **4** | **4,5** |

Riêng portal Student còn được chấm thêm 3 tiêu chí: động lực / "làm gì tiếp" 4, trải nghiệm làm bài 4,5, trang đăng nhập 5.

**Chẩn đoán gốc:** UI hiện đang chồng **3 hệ thiết kế** lên nhau:
1. ERG Enterprise: token xanh `#0F6CBD` trong `src/themes/erg-enterprise-tokens.ts`.
2. Template Minimal/Materio cũ: tím `#696CFF`, xám `#637381` / `#1C252E` / `#919EAB`, dùng ở 256 chỗ trên 42 file.
3. Các workspace mới: eyebrow kèm header weight 800.

Màn làm bài còn dùng thêm một hệ thứ 4: navy `#000088` cùng sọc đỏ.

Các số đo thêm:
- `features/lms` có **981 mã hex hard-code** và **210 chỗ `fontSize` viết tay với 14 cỡ khác nhau**.
- Toàn `src` có 317 chỗ `fontWeight ≥ 800`.
- Theme đặt `MuiButton.defaultProps.variant = "contained"` (`erg-enterprise-theme.tsx:107`), nên các nút muốn là nút chữ (ví dụ "Xem tất cả") hiện ra thành **chữ màu trên nền xanh và không đọc được**.
- **Khoảng 40% màn admin chạy dữ liệu giả**, gồm:
  - dashboard (`admin-dashboard.tsx:105-122`, ngày 11/06 hard-code)
  - 7 trang báo cáo (`212.480.000 đ`, "+12.4%")
  - 3 trang tích hợp (số đếm `3 + index` ở `admin-erg-workspaces.tsx:398`)
  - mục "Hôm nay" của giáo viên (`lms-teacher-shell-presentation.tsx:98`)
  - tiến độ 62% giống nhau cho mọi học sinh
  - sổ đầu bài mở Tuần 23 (tháng 6)

  Người dùng sẽ ra quyết định dựa trên số giả. Đây là rủi ro lớn nhất về UI.

### 7.1 Nền tảng design system (làm TRƯỚC mọi màn hình), 1–1,5 tuần
> Mục tiêu: "enterprise MUI, gọn và yên tĩnh", giống CenterUp/Azota. Một màu chính, chữ không quá đậm, bảng sạch, mỗi trang chỉ một CTA.

| Hạng mục | Hiện tại | Quy chuẩn mới | Nơi sửa |
|---|---|---|---|
| Màu chính | Xanh `#0F6CBD` (theme), tím `#696CFF` (hard-code), `#2563EB` (student), navy `#000088` (quiz) | **Một primary duy nhất** (khuyến nghị `#0F6CBD`, hoặc tím nếu nhận diện ERG yêu cầu, xem mục 10). Có thang 50→900, `primary.light` dùng cho nền nhạt | `src/themes/erg-enterprise-tokens.ts`; xoá mọi hex trong `sx`/`className` |
| Neutral | 3 thang xám trộn lẫn | Một thang: text `#1F2937`, muted `#6B7280`, border `#E5E7EB`, nền trang `#F7F8FA`, surface `#FFFFFF` | tokens |
| Màu trạng thái | Chip filled đặc, chữ trắng | Tint: success `#DCFAE5`/`#04250E`, danger `#FFEDEA`/`#831C1E`, warning `#FFFBEB`/`#92400E`, info `#E6F0FA`/`#0B4A86` | `StatusBadge` |
| Font | 3 họ, 15 file weight (Plus Jakarta, Be Vietnam Pro, Manrope) | **1 họ** (khuyến nghị Be Vietnam Pro, dấu tiếng Việt chuẩn). Weight 400/500/600. Subset `latin` + `vietnamese` | `erg-enterprise-theme.tsx:3-13`, `src/config/fonts.ts` |
| Thang chữ | 14 cỡ, 9 → 24px | 12 / 13 / 14 / 16 / 20 / 24. Tiêu đề trang 24/600, tiêu đề card 16/600, body và ô bảng 14/400, header bảng 12/500 | theme `typography` |
| Weight | h1–h2 800, button 750, ô bảng 600, header bảng 800 | Tối đa 600. Body 400 | theme + grep thay 750/800/850 |
| Bo góc | 8/10/14/18 | Control 6, card 8, dialog 12, chip 999 | tokens `radius` |
| Đổ bóng | Card có shadow | Card chỉ dùng border 1px. Shadow chỉ cho menu, popover, dialog | theme `MuiCard`, `MuiPaper` |
| Button | Mặc định contained | Mặc định `text`. Mỗi trang **đúng 1** nút `contained`. Phụ là `outlined`. Nguy hiểm là `color="error"`. Chữ thường, không viết HOA. Cao 36 (desktop) và 44 (mobile) | `erg-enterprise-theme.tsx:107` |
| Bảng | Header viết HOA, nền xám, xuống dòng từng từ | Header sentence-case 12/500 màu muted, nền trong suốt, cao 40. Hàng 48, padding `12px 16px`. Ô `nowrap` + ellipsis + tooltip. Cột số căn phải `tabular-nums`. Chỉ hover nhẹ. Phân trang tiếng Việt ("1–50 / 639") | `MuiTableCell`, `erg-mui/erg-table.tsx`, `components/shared/DataTable` (`labelDisplayedRows`) |
| Form | `<select>` và `type="date"` gốc, lẫn với MUI; ngày kiểu Mỹ | Chỉ dùng `ErgTextField`/`ErgSelect`/`DatePicker` (locale `vi`, `dd/MM/yyyy`, 24h). Label luôn hiển thị. Lỗi hiện dưới ô | `components/erg-mui/erg-form.tsx`, `LocalizationProvider adapterLocale="vi"` |
| Icon | `@mui/icons-material` Rounded và lucide trộn nhau; icon nằm trong ô màu ở KPI | Một bộ icon (xem mục 10). Không đặt icon trong ô màu | |
| Ngôn ngữ | Lộ chữ kỹ thuật: "scope backend", "binding runtime", "tenant", "Role registry", "React + Vite", "Failed to fetch", "Tauri", "deny luôn thắng allow"; enum thô `ACTIVE`, `AUTHZ_CHANGED`, `LOGIN_SUCCESS`; role code `lms_subject_teacher`; UUID | Viết lại theo ngôn ngữ người vận hành trung tâm. Map mọi enum sang tiếng Việt. Không hiển thị UUID hay code (nếu cần thì để dạng mono xám nhỏ, có nút sao chép) | `platform/i18n/messages.ts` + từng màn |
| Lint chặn tái phạm | Không có | ESLint `no-restricted-syntax`: cấm hex và `fontSize`/`fontWeight` số trong `sx`. Cấm `<select>`/`<input type=date>` trong `features/**` | `eslint.config.js` |

**Bộ component dùng chung** (trong `src/components/erg-mui/`, xoá các bản trùng):
1. `ErgPageHeader`: tiêu đề 24/600, mô tả tuỳ chọn, 1 CTA bên phải, phần còn lại cho vào menu "⋯". **Không có eyebrow và không có breadcrumb trong trang** (breadcrumb đã có ở topbar). Thay thế ≥5 kiểu header hiện tại: `shared/PageHeader`, `SchoolPageShell`, `ErgSectionHeader`, header learning-outcomes, header dashboard.
2. `ErgTable`: bảng duy nhất, có toolbar (tìm kiếm, bộ lọc, đếm), phân trang server, sort, chọn hàng + thanh bulk action, empty, loading, error. Xoá `shared/DataTable` và `ui/data-table`.
3. `ErgFilterBar`: tối đa 3 ô lọc hiển thị, phần còn lại vào "Bộ lọc khác". Đồng bộ lên URL search params.
4. `StatusBadge`: dạng tint, cao 22px, 12/500. Thay 2 hệ badge hiện có.
5. `MetricCard` / `MetricStrip`: KPI gom vào một card chia bằng hairline. KPI bấm được và dẫn tới danh sách đã lọc. Khi chưa có dữ liệu thì hiện "—" (không hiện 0%).
6. `EmptyState`, `ErrorState` (có nút "Thử lại"), `SectionSkeleton` (đúng bố cục cuối). Skeleton quá 8 giây thì chuyển sang ErrorState. **Bỏ kiểu progress bar mảnh giữa màn trắng.**
7. `ConfirmDialog`: tóm tắt ảnh hưởng (ví dụ "ảnh hưởng 6 nhóm quyền / 12 người"), dùng cho khoá, xoá, thu hồi, đổi quyền.
8. Portal shell **một bản**:
   - Sidebar: logo, nhãn ngắn, active dạng pill xám trung tính.
   - Topbar: bộ chọn **trường/năm học toàn cục**, tìm kiếm, chuông thông báo nối `features/notifications`, avatar. Đây là bản user menu duy nhất, thay 3 bản hiện có.
   - Mobile: app bar 56px và **bottom nav** (theo CLAUDE.md).

**DoD 7.1:**
- Lint không còn hex, `fontSize` hay `fontWeight` viết tay trong `features/**`.
- Storybook hoặc trang `/admin/ui-kit` hiển thị đủ component.
- Ảnh chụp trước và sau của 3 màn mẫu: một bảng, một form, một dashboard.

### 7.2 Portal Admin
| Màn | Vấn đề (từ ảnh và code) | Cách làm | File |
|---|---|---|---|
| Trang chủ `/admin` | "Maximum update depth exceeded"; `<div>` nằm trong `<td>`; toàn dữ liệu giả, ngày cứng 11/06/2026; "Xem tất cả" không đọc được; "Tạo mới" không rõ tạo gì; bảng vỡ trên mobile | Sửa vòng render (P0-12). Nối API thật, hoặc hiện EmptyState trung thực. `new Date()`. "Tạo mới" thành menu (Lớp / Khoá / Bài tập / Nhân sự). Mobile chuyển sang danh sách 2 dòng | `features/lcms/pages/admin-dashboard.tsx` |
| 7 báo cáo | Chung một template và một bộ số giả; không có biểu đồ; select kỳ, đơn vị, nhóm **không có handler**; "Xuất báo cáo" không làm gì | Mỗi báo cáo một query, 1–2 biểu đồ thật (một hue mỗi biểu đồ), date range có tác dụng, bảng chi tiết, xuất Excel thật. Chưa có API thì **ẩn khỏi menu** | `admin-erg-workspaces.tsx` (`LcmsReportWorkspace`, `buildRows`), `admin-menu.tsx:69-75` |
| Lịch trung tâm | Toolbar 3 tầng, 2 nút tạo, toast "Đang tải lịch…" đè nội dung, nhãn menu bị cắt | Toolbar 1 dòng + sheet lọc, 1 CTA, mobile mặc định dạng danh sách, đổi nhãn "Lịch trung tâm" | `admin-google-calendar-workspace.tsx`, `components/shared/erg-calendar-*` |
| Quản lý trường (6 màn) | Chỉ có progress bar khi tải; UUID thô `ID: 01a171e6-…`; breadcrumb lặp 2 lần; audit trả 500 nhưng skeleton chạy mãi; ngày `mm/dd/yyyy`; "Đặt lại" là nút primary; "Tạo đợt nhập" bị khoá không lý do | Skeleton đúng bố cục, ẩn UUID, `DatePicker` tiếng Việt, "Áp dụng" là primary, "Đặt lại" là text, ErrorState ngay trong khối, tooltip giải thích nút bị khoá | `school-page-shell.tsx`, `features/audit/components/audit-trail-workspace.tsx`, `features/lcms/imports/*` |
| Nội dung (quiz-bank, câu hỏi, quiz-editor, học liệu) | `/admin/quiz-bank`… trả **404** (trang 404 dùng font khác, nút đỏ, chữ "React + Vite"); route đúng là `/admin/content/*` | Thêm redirect `/admin/{quiz-bank,questions,quiz-editor,resources}` → `/admin/content/{…}` (`LEGACY_ADMIN_CONTENT_SEGMENTS`, `app-routes.tsx:460`). Trang 404 đặt trong shell, nội dung: "Không tìm thấy trang · Về Trang chủ" | `routes/app-routes.tsx`, `routes/route-feedback.tsx`, `messages.ts:653` |
| Tài khoản nhân sự | Header bảng xuống 4 dòng, ô vỡ từng chữ; hiện code role và UUID scope; `ACTIVE` tiếng Anh; hàng đầu tô như đang chọn; không lọc, không phân trang, không bulk; bảng tràn trên mobile | Cột: Nhân sự (avatar, tên, email) · Vai trò (1 chip + "+n") · Phạm vi (tên trường + "+2") · Trạng thái · Đăng nhập cuối · "⋯". Thêm `ErgFilterBar` (phòng ban, vai trò, trạng thái), phân trang server, bulk (khoá/mở, gán vai trò, xuất). Mobile dùng danh sách | `employee-list-workspace.tsx` |
| Nhật ký truy cập | 639 dòng, không tìm kiếm, khoảng ngày, xuất hay phân trang; mọi dòng có badge SUCCESS; enum thô lặp lại; IP `0:0:0:0:0:0:0:1` | Badge chỉ cho dòng thất bại. Sự kiện viết tiếng Việt một dòng. Lọc theo người, ngày, kết quả. Phân trang server. Parse UA thành "Chrome · Windows" | `features/employee-management/*access-log*` |
| Quyền hệ thống | Mô tả tiếng Anh, cột "ID DB" chiếm chỗ nhất, "Chưa bind" lặp mọi dòng | Tên quyền tiếng Việt + key mono xám nhỏ, nhóm theo module (accordion), bỏ cột ID DB | `permission-catalog-workspace.tsx` |
| Nhóm quyền | API `permission-groups` trả 500 nhưng UI vẫn hiện dữ liệu cũ, không báo lỗi; tên là code `lms.learner` | Tên tiếng Việt, banner lỗi, bấm vào dòng mở drawer ma trận quyền, `ConfirmDialog` khi đổi | `role-management-workspace.tsx` |
| Tích hợp (Tổng đài, Zalo, API key) | Cả 3 dùng cùng template giả (trạng thái "Chờ thanh toán", người phụ trách giả); "Lưu thay đổi" không có form; 14 ô thiếu label, 10 nút icon thiếu `aria-label` | Mỗi tích hợp là form thật: trạng thái kết nối, cấu hình (che secret), "Kiểm tra kết nối", nhật ký. API key: bảng (tên, prefix, ngày tạo, lần dùng cuối, thu hồi kèm confirm). Chưa có backend thì ẩn khỏi menu | `admin-erg-workspaces.tsx:367-413`, `features/lcms/integrations/*` |
| Chuẩn đầu ra | Hiển thị **ngoài shell** (không sidebar, không topbar); eyebrow tiếng Anh; 2 CTA trùng nhau | Đưa vào layout admin. Một CTA. Chưa có dữ liệu thì ẩn panel phải | `routes/app-routes.tsx:591`, learning-outcomes page |
| Shell admin | Nhãn bị cắt; mobile không có bottom nav; topbar mobile chỉ có breadcrumb | Theo shell chung ở 7.1 | `ErgPortalSidebar.tsx`, `portal-sidebar-styles.ts`, `ErgPortalLayout.tsx` |

### 7.3 Portal Giáo viên (ưu tiên số 1 vì dùng hằng ngày, kể cả trên điện thoại)
**Số click cho tác vụ hằng ngày (hiện tại → mục tiêu):**
| Tác vụ | Hiện tại | Mục tiêu | Cách làm |
|---|---|---|---|
| Xem lớp hôm nay | Trang chủ là dữ liệu giả; phải vào Lịch rồi cuộn từ 0h | **0 click** | Trang chủ "Hôm nay": thẻ tiết dạy thật, mỗi thẻ có nút **Điểm danh / Sổ đầu bài / Giao bài** |
| Điểm danh một tiết | Menu → môn → ngày → **54 click từng ô** (desktop không có "Tất cả có mặt") | **3 click** | Từ thẻ tiết: "Tất cả có mặt" → đánh dấu ngoại lệ → Lưu. Mobile 1 dòng mỗi học sinh, chạm để đổi trạng thái |
| Giao bài | ~9 bước, "Giao nhanh" vẫn qua wizard | **3 click** | Chọn bài → chọn lớp (gợi ý lớp gần nhất) → Giao, hạn mặc định +7 ngày |
| Theo dõi tiến độ | 3 bước, cột trái trống; **bị chặn trên mobile** | **1 click** | Từ thẻ "Bài cần theo dõi" mở thẳng bảng nộp bài, có trên mobile |
| Nhập điểm | Gõ từng ô, không bulk | Dán cả cột / Tab | Lưới kiểu Excel, dán từ Excel, lưu nháp |
| Sổ đầu bài | Mở **Tuần 23 (tháng 6)**, nút "Sau" bị khoá, ô ngày trống | 1 click, mở đúng tuần hiện tại | Lấy tuần hiện tại, ngày ISO |

| Màn | Vấn đề | Cách làm | File |
|---|---|---|---|
| Trang chủ / Dashboard | Treo skeleton (vòng render); "Hôm nay" hard-code; "Xem tất cả" không đọc được; 4 KPI đều 0 mà không có hướng dẫn; "Chưa chọn lớp" nhưng không có nút chọn | P0-12. Lịch thật. KPI bấm được, có CTA khi rỗng | `lms-teacher-shell-presentation.tsx:70-99`, `use-lms-teacher-shell-controller.ts` |
| Danh sách hoạt động | 7 dropdown chiếm 2 dòng, CTA đứng lẻ, không có empty state, cảnh báo `Select value undefined` | `ErgFilterBar` 3 ô, CTA đưa lên header | `homework-panel.tsx` |
| Giao bài | Không có tiêu đề; ô ngày tràn ra ngoài card; **mất dấu** "Chua co bai dang giao"; 62% giả; ngày "19:24 25-10" | Grid 2 cột, DatePicker, `dd/MM HH:mm`, khôi phục dấu | `assign-homework-desktop-view.tsx`, `assign-homework-parts.tsx`, `assign-homework-mobile-view.tsx:378` |
| Kho luyện tập | Tên bị cắt; "Cập nhật ngày **Invalid Date**"; badge lặp lại; select gốc; mobile **mất dấu** toàn bộ ("Chon bai va giao nhanh", "phut") | Tên xuống 2 dòng, menu "⋯", định dạng ngày có fallback, khôi phục dấu | `desktop-exercise-bank-view.tsx`, `mobile-exercise-bank-view.tsx:36,79` |
| Tiến độ học tập | Cột trái trống; KPI lặp 2 lần; "Xuất CSV" bị khoá không lý do | Tự chọn bài mới nhất, bỏ khối KPI trùng, tooltip | `homework-progress-page.tsx` |
| Lớp học | 9A1 hiện "0/0 học sinh" trong khi màn Giao bài hiện 46/46 (**2 nguồn roster**) | Một nguồn roster (domain/school), EmptyState | `classroom-tracking-workspace.tsx` |
| Nhóm học sinh | Lỗi GraphQL "class scope is not allowed" bị nuốt; ô tạo nhóm không có label | Alert lỗi quyền, tạo nhóm bằng dialog | `student-groups-page.tsx` |
| Thông báo | Treo ở "Đang tải…"; **prefetch roster của 11 lớp** (lãng phí trên 3G); tên khác nhau giữa desktop và mobile | Bỏ prefetch, có timeout và ErrorState, thống nhất tên | `lms-notification-center.tsx` |
| Tài khoản / Lịch sử đăng nhập | Lộ chữ dev; `ACTIVE`; user-agent thô; IP `0:0:0:0` | Viết lại nội dung, parse UA, mobile dạng danh sách | `lms-account-page.tsx`, `lms-login-logs-page.tsx` |
| Bảng điểm | Tiêu đề sai ("Lớp học"); nút tím; select gốc; không có bulk | "Bảng điểm · <Lớp>", thanh nhập hàng loạt | `score/desktop-score-sheet-panel.tsx` |
| Điểm danh & KCT | Ngày kiểu Mỹ 11/03; "Gv phụ trách" trống; cảnh báo dành cho Admin hiện với giáo viên; khung chương trình chiếm 40% | Locale vi, khung chương trình chuyển thành drawer, bulk "Tất cả có mặt" | `attendance/desktop-attendance-sheet-panel.tsx`, `attendance-curriculum-table.tsx` |
| Lịch làm việc | Toolbar 3 tầng; lưới bắt đầu từ 0h, giờ AM/PM; toast không tắt | Toolbar 1 dòng, `scrollTime 07:00`, 24h, mini-calendar dạng popover | `erg-calendar-toolbar.tsx`, `erg-calendar-board.tsx`, `lms-erg-calendar-workspace.tsx` |
| Sổ đầu bài | Sai tuần (mock); **308 ô không có label**; banner "Chưa có hợp đồng máy chủ" lộ ra người dùng | Tuần hiện tại, `aria-label` theo "Thứ / Tiết / Cột", bỏ banner, dùng API thật | `weekly-class-log/components/*`, `api/mock-weekly-class-log-data.ts` |
| Tài nguyên | Chữ tiếng Anh ("New folder", "Search"); toolbar kiểu file explorer (cắt/dán) | Việt hoá; giữ Thêm / Giao cho lớp / Tải xuống | `learning-resource-library-page.tsx` |
| Báo cáo | Tiêu đề "Lớp học"; KPI lặp; không có biểu đồ hay bộ lọc kỳ | "Báo cáo lớp", lọc lớp và kỳ, xu hướng nộp bài, danh sách học sinh cần hỗ trợ | `reports-panel.tsx` |

**Mobile giáo viên:**
- Bottom nav mới: **Hôm nay · Điểm danh · Giao bài · Lớp · Thêm**. Hiện tại là "Home" (tiếng Anh, `lms-teacher-shell-config.tsx:192`), thiếu Điểm danh, và không có mục active ở 3 màn.
- **Gỡ chặn** Tiến độ và Nhóm HS (`MobileUnsupportedScreen`).
- Touch target ≥ 44px.
- Không cho 2 thanh sticky chồng nhau. Hiện Giao bài mất khoảng 170px chiều cao cho 2 thanh này.
- Lấy form Giao bài mobile làm mẫu, vì đây là form tốt nhất hiện có.

**Tính năng còn thiếu so với CenterUp/Azota (P2):**
- Hàng đợi "Cần chấm", nhận xét mẫu, công bố điểm theo lô.
- Mẫu bài giao, nhân bản bài sang lớp khác, hẹn giờ giao.
- Thông báo phụ huynh khi học sinh vắng hoặc chưa nộp (Zalo/SMS).
- Xuất PDF/A4: sổ điểm, điểm danh tháng, sổ đầu bài.
- Hồ sơ học sinh 360°.
- Import câu hỏi từ Word/Excel, trộn đề.

### 7.4 Portal Học viên và màn làm bài
| Màn | Vấn đề | Cách làm | File |
|---|---|---|---|
| Tổng quan | **CTA chính "Làm bài ưu tiên" bị disabled (xám) trong khi CTA phụ sáng**; hero dùng tên bài giả "Bài tập tuần" và chữ nội bộ; "0%" khi chưa có điểm; "Thảo luận lớp" là card rỗng; chữ "replies"; sidebar không có logo | Không có bài thì ẩn CTA chính, CTA phụ thành contained. Câu chữ theo trạng thái thật ("<Tên bài> · hạn <ngày>" / "Bạn đã xong hết bài"). Điểm hiện "—". EmptyState | `student-dashboard-content-views.tsx:33-36`, `student-dashboard-workspace.copy.tsx:21` |
| Mobile | Không có app bar; nhãn số liệu viết HOA khác với desktop | App bar 56px (lớp, chuông, avatar); một `MetricCard` chung | `student-dashboard-mobile-shell.tsx`, `student-dashboard-mobile-overview.tsx` |
| Thi portable / Tải ứng dụng / Chuẩn đầu ra | **Không có shell, không có đường quay lại**; tiêu đề tiếng Anh "Portable exam runtime"; hiện "Failed to fetch" chữ xám khó đọc; chữ dev "Tauri", "release manifest", "learner ID", "hostname" | Bọc trong student shell; "Mở bài thi từ tệp" kèm hướng dẫn 3 bước; "Tải ứng dụng ERG cho Windows/macOS"; Alert lỗi tiếng Việt có nút Thử lại | `features/elearning/portable-exam/*`, downloads, `features/elearning/competencies/*` |
| Hồ sơ | **2 nút "Lưu hồ sơ"**; học sinh thấy các trường dành cho admin (Bộ phận, Chức danh); 3 ô thiếu label; chữ "ERG ACCOUNT" | Một nút lưu (dính đáy trên mobile); ẩn trường theo vai trò; `<label htmlFor>` | `features/profile/*` |

**Màn làm bài**, so với Azota:
1. 🔴 **Chế độ kiểm tra không cho nộp sớm.** Nút "NỘP BÀI" chỉ hiện khi đã trả lời hết (`player-shell-runtime.tsx:1326`, `mobile-player-shell.tsx:89`). Nếu chưa trả lời hết thì `requestSubmit` thoát luôn (dòng 556).
   - Sửa: **luôn hiện nút Nộp**. Hộp xác nhận ghi "Còn X câu chưa làm, Y câu đánh dấu", kèm nút "Đến câu chưa làm".
2. 🔴 **Hết giờ không tự nộp.** Code chỉ hiện lỗi "Bài làm đã hết thời gian" (dòng 560-562).
   - Sửa: tự nộp khi `remaining = 0`. Phối hợp backend để tự chốt bài lúc hết hạn.
   - Nghiệm thu: để hết giờ, bài vẫn được ghi nhận.
3. **Đồng hồ:**
   - Mobile đang dùng chữ 11px màu slate-400 (`mobile-player-shell.tsx:171`). Đổi thành sticky header 16px màu đậm.
   - Cảnh báo ở mốc 5 phút và 1 phút, có `aria-live="polite"`.
4. **Chỉ báo tự lưu:** "Đang lưu… / Đã lưu 10:42 / Lưu trên máy, chờ mạng". Tách lỗi đồng bộ nháp khỏi lỗi nộp bài (hiện cùng dùng `setSubmitError`).
5. **Banner offline** trong player. Hiện `useOfflineShellStatus` chỉ dùng để phát lại hàng đợi.
6. **Đơn giản hoá khung desktop:**
   - Bỏ viền navy, sọc đỏ, blob xoay 45° và watermark tải từ CDN (lỗi khi offline), ở `player-shell-runtime.tsx:1219-1244`.
   - Bỏ nhãn "Tài nguyên" thừa (:1189) và div ẩn (:1245).
   - Nút viết thường. Ở chế độ luyện tập, "NỘP BÀI" từng câu đổi thành "Kiểm tra đáp án".
7. **Mobile:** nút Trước là outline, Sau là filled. Cờ đánh dấu ≥ 44px. Màn intro hiện thời lượng và số lượt làm.
8. **Màn kết quả kiểu Azota:** điểm, đúng/sai theo từng câu, "Làm lại" (luyện tập), "Về danh sách". Phím tắt ←/→. Lọc "chưa làm / đã đánh dấu".

### 7.5 Trang đăng nhập
- **Nền:** blob 3D kéo ảnh JPG từ CDN, nặng trên 3G, không có trong precache, và mang cảm giác "template". Code nền bị lặp ở `portal-login-presentation.tsx:17` và `auth-workspace.tsx:49`.
  - Sửa: nền phẳng màu brand nhạt hoặc gradient CSS, kèm một minh hoạ nhỏ của ERG.
- **Card:** glass trắng 55% làm ô nhập bị mờ.
  - Sửa: card trắng đặc, ô viền `#E5E7EB`.
- **Câu chữ sai đối tượng:** host LMS hiện "Dành cho giáo viên, điều phối viên…" với placeholder `teacher@erg.edu.vn`, nên học sinh tưởng mình vào nhầm. Câu chữ cho học sinh đã có sẵn ở `portal-login-copy.ts:66`.
  - Sửa: dùng câu "Email hoặc mã học sinh" chung cho mọi vai trò.
- **SSO chết:** `{false && allowGoogle}` ở `auth-form-panel.tsx:143` và `portal-mobile-login-form.tsx:216`.
  - Sửa: làm SSO Google/Microsoft thật, hoặc xoá.
- **Lỗi đăng nhập:** thêm `role="alert"`, cảnh báo Caps Lock, thông báo khi tài khoản bị khoá hoặc nhập sai nhiều lần.

### 7.6 Thứ tự làm UI và nghiệm thu
1. **Tuần UI-1:** nền tảng 7.1 (token, font, theme, `ErgPageHeader`, `ErgTable`, `StatusBadge`, các state, shell chung) cùng lint chặn tái phạm.
2. **Tuần UI-2:** gỡ toàn bộ dữ liệu giả. Màn nào chưa có API thì ẩn khỏi menu hoặc hiện EmptyState trung thực. Sửa các lỗi hiển thị P0: chữ không đọc được, Invalid Date, mất dấu, ngày kiểu Mỹ, 404 nội dung, trang ngoài shell.
3. **Tuần UI-3, UI-4:** Teacher (trang chủ "Hôm nay", điểm danh nhanh, giao nhanh, bottom nav, gỡ chặn mobile).
4. **Tuần UI-5:** Student (CTA, các trang ngoài shell, màn làm bài 1–5) và Login.
5. **Tuần UI-6, UI-7:** Admin (nhân sự, log, quyền, tích hợp, báo cáo có biểu đồ).
6. **Sau đó:** các tính năng P2 ngang tầm CenterUp/Azota.

**Checklist nghiệm thu cho mỗi màn** (chạy lại script Playwright, so ảnh trước và sau):
- [ ] Không có lỗi console hay page error. Mọi lỗi API đều hiện ErrorState.
- [ ] Một tiêu đề `ErgPageHeader`, đúng 1 CTA contained.
- [ ] Không có hex, `fontSize` hay `fontWeight` viết tay. Chỉ dùng component `erg-mui`.
- [ ] Không có dữ liệu giả. Không lộ code, UUID hay enum tiếng Anh. Ngày theo `dd/MM/yyyy`, 24h.
- [ ] Có đủ empty, loading (skeleton đúng bố cục), error.
- [ ] Mobile 390px: không tràn ngang, touch target ≥ 44px, có bottom nav, bảng chuyển thành danh sách.
- [ ] A11y: mọi input có label, nút icon có `aria-label`, tương phản ≥ 4.5:1, điều hướng được bằng bàn phím.
- [ ] Lighthouse mobile ("Slow 4G"): Performance ≥ 80, Accessibility ≥ 95.

---

## 8. Ứng dụng thi portable offline (Tauri v2)

### 8.1 Hiện trạng
**Đã có:**
- Giáo viên xuất `.ergquiz` (JSON đã ký Ed25519 phía backend) qua `portable-package-export-dialog.tsx:99-112`.
- Script `scripts/build-portable-exam.mjs` build **một bộ cài riêng cho mỗi đề** (`vn.erg.portable.<packageId>`) từ `vite.portable.config.ts` + `tauri.portable.template.json`.
- App boot qua `src/portable-main.tsx` → `PortableArtifactApp`, kiểm chữ ký bằng WebCrypto, chạy `PlayerShellRuntime`, chấm điểm local, lưu attempt vào IndexedDB đã mã hoá.

**Chưa có hoặc bị hỏng:**
1. **Không có đường gửi kết quả về.** CSP `connect-src 'self'`, `capabilities: []` (`tauri.portable.template.json:25-26`), và không có chức năng xuất file kết quả. Bài làm kẹt lại trong máy.
2. **Đáp án nằm ngay cạnh file EXE dưới dạng file thường** (`tauri.portable.template.json:33` `"resources": ["../dist-portable/portable-exam.ergquiz"]`) khi ở chế độ client-first.
3. Gói ở chế độ server-authoritative bị hỏng trong app portable (`portableOffline=false` → gọi `ensureServerAttempt` và bị CSP chặn).
4. **Không có đồng hồ đếm giờ khi offline:** `deadlineAt` cần `serverStarted` (`player-shell-runtime.tsx:280`).
5. **Không có danh tính học sinh** (`attemptScope.accountId` là undefined).
6. Chữ ký chỉ phủ `packagePayload`. `expiresAt`, `revokedAt`, `gradingMode`, `quizId`, `packageId`, `tenantId` nằm ngoài chữ ký (`portable-exam-package-verifier.ts:55-76, 152-188`).
7. Phía Rust không làm gì (`src-tauri/src/lib.rs` chỉ đăng ký updater/process). Script `check-tauri-architecture.mjs:46` còn cấm `#[tauri::command]`.
8. Chưa từng build (thư mục `src-tauri/target` trống). Chưa có code signing Windows/macOS. Feed của updater không khớp đường dẫn (`desktop-release.mjs:64` so với template). `rolloutPercent` bị bỏ qua (`:138-155`).
9. Quy trình giáo viên phải "copy lệnh CLI" để build. Giáo viên không tự làm được.

### 8.2 Kiến trúc đề xuất: **một app "ERG Exam Player" duy nhất**
- **Không build lại cho mỗi đề.** Cài một lần, mở file `.ergquiz` bằng file association cộng `tauri-plugin-single-instance`. Giáo viên chỉ cần phát file đề (USB, LAN, LMS).
- **Shell thi riêng, gọn nhẹ:** chỉ gồm player, không kéo theo GraphQL hay TanStack mutation của SPA chính. Tách `player-shell-runtime.tsx` thành lõi thuần (domain/quiz) cộng một adapter online và một adapter offline.
- **Chuyển sang Rust** (`src-tauri/src/exam/`, chỉ cho profile player):
  - `verify.rs`: kiểm chữ ký envelope (ed25519-dalek), hạn dùng, revocation.
  - `journal.rs`: nhật ký bài làm append-only, chuỗi hash, đặt trong `app_data_dir`.
  - `device_key.rs`: khoá Ed25519 của thiết bị lưu trong OS keystore (crate `keyring`: DPAPI/Keychain), dùng để ký kết quả.
  - `clock.rs`: lưu mốc thời gian cao nhất đã thấy cộng `Instant` monotonic, phát hiện quay ngược đồng hồ.
  - Kiosk: fullscreen, `alwaysOnTop`, `contentProtected: true`, `decorations: false`, chặn đóng cửa sổ trước khi nộp (`on_window_event`), xoá biến môi trường debug WebView2.

### 8.3 Mô hình đe doạ và biện pháp
| Mối đe doạ | Hiện tại | Biện pháp |
|---|---|---|
| Lộ đáp án | Đáp án là JSON thường trong gói và trong thư mục cài | Mặc định **server-authoritative**: đáp án mã hoá AES-GCM, chấm trên server khi đồng bộ. Chấm offline tức thì chỉ dùng cho bài luyện tập |
| Sửa gói đề | Chỉ ký payload | Ký toàn bộ envelope (manifest + hash payload); kiểm tra ở Rust và cả lúc build |
| Làm lại hoặc phát lại bài | Xoá dữ liệu WebView là reset được | Server cấp **vé dự thi** cho từng học sinh (nonce + id, có chữ ký), mỗi vé chỉ dùng một lần |
| Chỉnh lùi đồng hồ | So với `Date.now()` | Dùng mốc monotonic trong journal; server tự tính thời gian làm bài từ journal |
| Chép bài giữa các học sinh | Bản ghi không ký | Ký bằng khoá thiết bị; kèm id học sinh, vé, hash đề, chuỗi journal |
| DevTools | `devtools:false` nhưng vẫn mở được qua biến môi trường WebView2 | Xoá biến môi trường lúc khởi động, chặn F12/Ctrl+Shift+I; server vẫn là nơi quyết định |
| Chụp màn hình hoặc chuyển cửa sổ | Không có biện pháp | `contentProtected`, kiosk, ghi sự kiện mất focus vào journal, watermark mã học sinh |

### 8.4 Lộ trình
**Giai đoạn 1: MVP (3–4 tuần), "kết quả ra được khỏi máy"**
1. Tạo `src-tauri/tauri.player.conf.json`: `fileAssociations` cho `.ergquiz`, plugin single-instance, `bundle.windows.webviewInstallMode: "offlineInstaller"` (bộ cài chạy được khi không có mạng), không đóng gói sẵn đề. Nới `check-tauri-architecture.mjs` riêng cho profile player.
2. **Bỏ `resources`** trong `tauri.portable.template.json:33`.
3. Bước nhập danh tính: mã lớp cộng mã học sinh, lấy từ roster nằm trong gói, truyền vào `attemptScope`.
4. Timer offline: `player-shell-runtime.tsx:280` dùng `session.startedAt` khi `portableOffline`.
5. Nút "Xuất kết quả" ghi file `.ergresult` (attempt, sự kiện, `contentHash` đề). Thêm endpoint nhập kết quả và màn upload cho giáo viên trong `features/portable-package-export`.
6. Test: `assessment-engine.ts` (chấm điểm từng loại câu hỏi, điểm thành phần, câu trống) và luồng submit portable.
- **Nghiệm thu:** giáo viên xuất đề, học sinh nhấp đúp file trên máy Windows/mac không có mạng, làm bài có giờ, xuất kết quả; giáo viên upload và thấy điểm. Bộ cài chạy không cần Internet.

**Giai đoạn 2: Hardened (3–4 tuần)**
1. Viết các command Rust ở mục 8.2 (verify, journal, device_key, clock, kiosk).
2. Backend ký toàn bộ envelope, mã hoá đáp án, chấm khi nhập kết quả. Server-authoritative thành mặc định.
3. CI: job ký Authenticode (Azure Trusted Signing) và notarize Apple. Secret đặt ở cấp step. `--ignore-scripts`. Pin bun.
- **Nghiệm thu:** gói đã bị sửa, kết quả chép từ máy khác, và vé dùng lần hai đều bị từ chối. Đồng hồ quay lùi bị gắn cờ. Không tìm thấy đáp án trong thư mục cài hay trong gói. Bộ cài đã ký và notarize.

**Giai đoạn 3: Quy mô (4 tuần)**
1. Tự động đồng bộ khi có mạng (uploader Rust, idempotent theo `(vé, khoá thiết bị)`).
2. Sửa đường dẫn feed updater. Thực thi `rolloutPercent`. Thêm channel `player`.
3. Danh sách thu hồi đề. Phát đề qua LAN từ máy giáo viên. Ngân sách kích thước bộ cài.
- **Nghiệm thu:** pilot 500 học sinh không cần upload tay. Rollout 5% → 100% quan sát được.

**Cần kiểm chứng sớm (spike 2 ngày):**
- WebCrypto Ed25519 có chạy trên WebView2 cũ và WKWebView < macOS 14 không. Nếu không, bắt buộc kiểm chữ ký bằng Rust ngay từ MVP.
- Kích thước bộ cài thực tế.
- `bun x tauri build` có chạy thành công không.

---

## 9. 🟡 Chiến lược test

- **Giữ:** vitest unit, Playwright smoke, budget, contract/api-endpoint check.
- **Bổ sung ngay:**
  1. `assessment-engine.ts`: test dạng bảng cho mọi loại câu hỏi (hiện chưa có test nào).
  2. `attempt-store`/`quiz-runtime-submit-model.ts`.
  3. `projectVerifiedWorkspaces` và ma trận route, bao gồm trường hợp giáo viên preview portal học viên.
  4. `resolveRuntimeWorkspace` với 5 loại host.
  5. Editor quiz: đổi quiz không làm mất dữ liệu.
  6. Smoke E2E cho **teacher** (hiện chưa có project).
- **Giảm:** 65 "policy test" chỉ grep chuỗi trong source (ví dụ bắt buộc phải chứa `from "@mui/material/Skeleton"`). Chuyển thành rule ESLint hoặc xoá, vì chúng chặn refactor mà không bảo vệ hành vi.
- **E2E theo luồng nghiệp vụ** (Playwright, chạy trên CI theo lịch hằng đêm):
  - Admin tạo trường → lớp → nhập học sinh.
  - Admin tạo câu hỏi → quiz → publish.
  - Giáo viên giao bài → học sinh làm → giáo viên xem tiến độ.
  - Giáo viên điểm danh.
  - Xuất đề portable → nhập kết quả.

---

## 10. Quyết định cần chủ dự án chốt (trước khi bắt đầu)

1. **UI kit chính thức.** Code (309 file) và `AGENTS.md` đang theo MUI-first, còn `CLAUDE.md` ghi MUI đã bị loại bỏ.
   - **Khuyến nghị: giữ MUI v9** (enterprise, đồng bộ với code hiện có).
   - Viết lại mục UI Stack trong CLAUDE.md, rồi gỡ dần radix/cva/shadcn/lucide.
   - Font: chọn 1 họ (khuyến nghị **Be Vietnam Pro**, vì dấu tiếng Việt đẹp; hiện đang tải cả Plus Jakarta lẫn Be Vietnam Pro lẫn Manrope).
   - Màu chính: CLAUDE.md ghi `#696CFF`. Cần chốt lại theo nhận diện thương hiệu ERG.
2. **Giáo viên/admin vào portal học viên:** chế độ "xem như học viên" (khuyến nghị) hay cấp hẳn quyền học viên. Việc này cần phối hợp backend.
3. **Thời điểm cutover BFF HttpOnly** (P0-2), cần backend.
4. **Thi portable:** một app Player (khuyến nghị) hay mỗi đề một bộ cài; mặc định server-authoritative; ngân sách code signing (chứng chỉ Windows, tài khoản Apple Developer).
5. **Bộ icon:** CLAUDE.md quy định `lucide-react`, nhưng code dùng `@mui/icons-material` ở 202 file. Khuyến nghị giữ `@mui/icons-material` (Rounded) để đồng bộ với MUI và cập nhật CLAUDE.md, hoặc chuyển hết sang lucide. Chọn 1 trong 2.
6. **Các màn chưa có backend** (7 báo cáo, 3 tích hợp, dashboard tài chính): ẩn khỏi menu đến khi có API (khuyến nghị), hay giữ lại với nhãn "Sắp ra mắt".
7. **Thư mục `docs/`:** `.gitignore` có `docs/**` nhưng 62 file vẫn được track bằng force. Chọn một chính sách.

---

## 11. Lộ trình đề xuất

| Tuần | Nội dung | Kết quả |
|---|---|---|
| 1 | P0-1 → P0-14 (ưu tiên P0-11, P0-12, P0-13 vì người dùng bị chặn), workflow CI, sửa lint và test, thay xlsx | CI xanh trên mọi PR; không còn lỗ hổng P0; không treo trang |
| 2 | Mục 4 (lỗi logic 4.1–4.4); spike Tauri (Ed25519 WebView, build thử); UI-1 (nền tảng design system 7.1) | Giáo viên xem được portal học viên; editor an toàn; theme mới |
| 3–4 | Kiến trúc bước 1–3 (xoá code chết, gom policy, session/query key); UI-2 (gỡ dữ liệu giả, lỗi hiển thị P0) | Một nguồn cho role/workspace/host; precache < 2 MB |
| 5–7 | UI-3 đến UI-7: Teacher → Student/Login → Admin (mục 7.3–7.5) | Mỗi portal đạt checklist 7.6 |
| 5–8 | Portable giai đoạn 1 (MVP) | Thi offline, xuất và nhập kết quả |
| 7–10 | Router migration (teacher → admin → student → crm); tách domain; strict TS | Xoá `app-routes.tsx`; 0 vòng phụ thuộc |
| 9–12 | Portable giai đoạn 2 (hardened); E2E nghiệp vụ | Bộ cài đã ký; anti-cheat |
| 13+ | Portable giai đoạn 3; tối ưu dài hạn | Pilot 500 học sinh |

**Định nghĩa "xong" cho mọi hạng mục:**
- Có test.
- CI xanh.
- Không làm tăng ngân sách bundle.
- Không thêm phụ thuộc ngược chiều.
- Ảnh chụp trước và sau (đối với UI).
- Cập nhật CLAUDE.md/AGENTS.md nếu thay đổi quy ước.

---

## Phụ lục A. File cần tách (> 600 dòng, trừ file generated)
`question-editor-dialog.tsx` 1.506 · `player-shell-runtime.tsx` 1.357 · `create-employee-wizard.tsx` 1.347 · `messages.ts` 1.313 (dữ liệu, chấp nhận) · `curriculum-teaching-plan-dialog.tsx` 1.211 · `learning-resource-mock-data.ts` 1.177 (chuyển sang fixtures) · `curriculum-roadmap-view.tsx` 1.177 · `learner-question-authoring-preview.tsx` 1.151 · `employee-detail-drawer.tsx` 1.148 · `use-quiz-editor-state.ts` 1.032 · `admin-dashboard.tsx` 967 · `matching-question.tsx` 963 · `quiz-editor-workspace.tsx` 937 · `employee-list-workspace.tsx` 931 · `student-sheet-import-workspace.tsx` 923 · `quiz-properties-dialog.tsx` 918 · `learning-resource-library-page.tsx` 887 · `teacher-onboarding-workspace.tsx` 866 · `school-management-api.ts` 843 · `app-routes.tsx` 832 · `desktop-exercise-bank-view.tsx` 821 · cùng 24 file khác từ 600 đến 810 dòng.

Shell vượt quy tắc 200 dòng: `lms-teacher-shell-presentation.tsx` 525 · `crm-portal-shell.tsx` 411 · `dashboard-shell.tsx` 408 · `dashboard-page-shell.tsx` 355 · `mobile-player-shell.tsx` 322 · `admin-erg-portal-shell.tsx` 261.

## Phụ lục B. Cách chạy lại các kiểm tra
```bash
bun run typecheck && bun run lint && bun run test && bun run build
bunx playwright install chromium
bun run e2e:lms
```
Host dev chuẩn là `https://lms.erg.edu.local:3001`, cần dòng `127.0.0.1 lms.erg.edu.local` trong file hosts. Trên `localhost`, các route `/teacher/*` đang lỗi (mục 4.2).
