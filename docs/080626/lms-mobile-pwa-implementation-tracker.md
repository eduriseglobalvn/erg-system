# LMS Mobile PWA Implementation Tracker

Ngày bắt đầu: 08/06/2026

## Mục Tiêu Gốc

Hoàn thành kế hoạch trong `docs/080626/lms-mobile-pwa-responsive-plan.md` bằng 4 agent song song, nhưng hạn chế tối đa tác động đến UI web desktop hiện tại. Desktop LMS hiện có phải tiếp tục hoạt động như trước; mobile/PWA được bổ sung qua layer riêng, condition nhỏ, hoặc component mới.

## Nguyên Tắc Tích Hợp

- Không revert thay đổi có sẵn trong worktree.
- Không dùng `git reset --hard`, `git checkout --`, hoặc command phá hủy.
- Ưu tiên file mới trong `src/features/lms/mobile`.
- Nếu phải sửa file desktop hiện tại, chỉ sửa để thêm mobile branch/entry point nhỏ.
- Desktop breakpoint `xl` phải giữ behavior hiện tại.
- Bảng desktop `ScoreSheetPanel` và `AttendanceSheetPanel` không bị rewrite.
- API/cache PWA không được cache chung toàn bộ `/api`.
- Auth/token/role/audit/logs không được cache bằng service worker.

## Phân Công 4 Agent

### Agent 1 - PWA Foundation

Owner:

- `package.json`
- lockfile liên quan nếu thêm `vite-plugin-pwa`
- `vite.config.ts`
- `index.html`
- `public/offline.html`
- `public/manifest.webmanifest`
- PWA icons/placeholders nếu cần

Kỳ vọng:

- Manifest installable.
- Service worker qua Vite PWA plugin.
- Runtime caching phân loại an toàn.
- Offline fallback.
- Không đụng UI desktop.

### Agent 2 - LMS Mobile Shell

Owner:

- `src/features/lms/mobile/components/*`
- `src/features/lms/mobile/hooks/*`
- Patch nhỏ trong `src/features/lms/components/lms-teacher-shell.tsx` nếu cần.

Kỳ vọng:

- `LmsMobileShell`.
- `LmsBottomDock`.
- `LmsMobileTopBar`.
- `LmsScopeSheet`.
- `More` sheet.
- Safe-area, `100dvh`, touch target 44px.
- Desktop shell giữ nguyên.

### Agent 3 - Score & Attendance Mobile

Owner:

- `src/features/lms/components/score/*`
- `src/features/lms/components/attendance/*`
- Patch nhỏ trong `score-sheet-panel.tsx`.
- Patch nhỏ trong `attendance-sheet-panel.tsx`.

Kỳ vọng:

- Score mobile có view riêng, không chỉ horizontal table.
- Attendance mobile có mode `Hôm nay`.
- Touch-friendly edit/status.
- Hover/right-click có alternative touch.
- Desktop tables giữ nguyên.

### Agent 4 - Calendar, Homework, Resources Mobile

Owner:

- `src/features/lms/components/teaching-schedule/*`
- Mobile-specific homework/assign/resource components nếu tạo mới.
- Patch nhỏ trong assign/resources/calendar files nếu cần.

Kỳ vọng:

- Calendar mobile day/agenda hoặc mobile toolbar.
- Event detail touch alternative.
- Assign/homework mobile direction.
- Resource mobile drill-down/list/card.
- Desktop calendar/explorer không bị phá.

## Cổng Kiểm Chứng Sau Tích Hợp

### Static

- `bun run typecheck` hoặc command tương đương hiện có.
- `bun run build` nếu typecheck/build dependency ổn.
- Nếu build không chạy được do lỗi có sẵn, ghi rõ lỗi đầu tiên và phân loại có liên quan hay không.

### PWA

- `manifest.webmanifest` load được.
- Manifest có `name`, `short_name`, `start_url`, `display`, `scope`, icons không khai báo sai.
- Service worker generated trong build.
- Offline fallback tồn tại.
- Runtime caching không cache endpoint nhạy.

### Mobile UI

Viewport cần kiểm tra:

- 375x667
- 390x844
- 430x932
- 768x1024
- 1440x900

Routes cần kiểm tra:

- `/homework`
- `/homework/assign`
- `/score`
- `/attendance`
- `/calendar`
- `/resources`

Pass criteria:

- Không có text overlap rõ.
- Bottom dock không che content.
- Touch target chính khoảng 44px.
- Desktop vẫn dùng layout hiện tại ở `xl`.
- Mobile có layout/view riêng cho score và attendance.

## Trạng Thái

- Agent 1: completed.
- Agent 2: completed.
- Agent 3: completed.
- Agent 4: completed.
- Local integration: completed.

## Bằng Chứng Hoàn Tất

- `bun run typecheck` pass.
- `bun run build` pass.
- Build sinh `dist/sw.js`, `dist/workbox-*.js`, `dist/offline.html`, `dist/manifest.webmanifest`.
- Preview HTTPS trên `https://127.0.0.1:4173` trả `200` cho `/`, `/manifest.webmanifest`, `/offline.html`, `/sw.js`, `/homework`, `/score`, `/attendance`, `/calendar`, `/resources`.
- Icon thật đúng kích thước:
  - `public/android-chrome-192x192.png` = 192x192
  - `public/android-chrome-512x512.png` = 512x512
  - `public/apple-touch-icon.png` = 180x180
- `git diff --check` trên file LMS mobile/PWA trọng tâm không còn lỗi logic; chỉ còn warning CRLF của Windows/Git.

## QA Bổ Sung Ngày 08/06/2026

- Browser QA phát hiện service worker cũ đang dùng `offline.html` làm navigation fallback, khiến route SPA như `/homework`, `/score`, `/attendance`, `/calendar`, `/resources` có thể bị trả về trang offline khi SW active.
- Đã sửa `vite.config.ts`: `navigateFallback` chuyển từ `/offline.html` sang `/index.html`.
- `offline.html` vẫn được precache làm trang/tài sản offline riêng, nhưng route navigation của SPA không còn bị thay bằng offline page.
- QA đúng host LMS cần dùng `https://lms.erg.edu.vn:3001`; dùng `localhost` hoặc preview port khác sẽ vào nhánh public host và render 404 theo logic `src/routes/app-routes.tsx`.
- Browser QA mobile 375x812 trước login phát hiện trust chip/login target bị tràn/nhỏ; đã sửa trong:
  - `src/platform/auth/components/portal-mobile-login-shell.tsx`
  - `src/platform/auth/components/portal-mobile-login-form.tsx`
- QA lại màn login LMS mobile 375x812: không còn overwide element, không còn touch target dưới 36px trong viewport, không có console error liên quan.
- Giới hạn QA: chưa kiểm được dashboard sau login bằng browser vì không có tài khoản/mật khẩu LMS hợp lệ và browser policy không cho inject session bằng `javascript:` URL.
