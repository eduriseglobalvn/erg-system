# Báo cáo triển khai - 0206 TanStack + shadcn

Nhánh thực hiện: `codex/tanstack-shadcn-0206-plan`

## Tóm tắt

Đã triển khai luồng nâng cấp chính theo `docs/0206/implementation_plan.md` và đồng thời điều tra lỗi `bun dev` sau khi đổi tên repo rồi clone lại.

Các hạng mục đã hoàn thành:

- Bổ sung hệ sinh thái TanStack và các primitive shadcn/ui còn thiếu.
- Chuyển `DashboardKit` thành adapter mỏng dựa trên shadcn, giữ nguyên API cho các nơi đang dùng.
- Chuẩn hóa avatar fallback bằng shadcn `Avatar` và gradient ERG xanh/đỏ.
- Thêm wrapper TanStack Pacer debounce và TanStack Virtual.
- Thêm `DataTable` dùng TanStack Table, hỗ trợ sorting, filtering, pagination, column visibility, row selection, resizing và virtualization tùy chọn.
- Tích hợp TanStack Table headless vào màn điểm danh và bảng điểm LMS, vẫn giữ UI dạng spreadsheet để không phá workflow nhập liệu.
- Thêm lớp tích hợp TanStack Form và migrate các form auth/onboarding/profile/content/admin từng dùng submit native.
- Chuyển app shell từ React Router provider/history sang TanStack Router provider/history.
- Thêm persisted store dựa trên TanStack Store và query key factory.
- Chuyển lưu session giáo viên/học sinh và teacher account sang persisted JSON adapter dựa trên TanStack Store.
- Gom các persistence còn lại ở feature level như i18n locale, student announcement snooze, LMS weekly class log và LMS attendance save qua persisted store adapter.
- Thêm hook batching state dựa trên TanStack Pacer và thay các `requestAnimationFrame` từng được dùng như pseudo-debounce.
- Khóa Vite dev server vào port `3001` để 4 domain local không âm thầm rơi sang fallback port.

## Nguyên nhân lỗi dev server sau rename/reclone

Lỗi tái hiện được khi chạy `bun dev`:

```text
Error: Port 3001 is already in use
```

Nguyên nhân gốc:

- Có Vite dev process cũ vẫn đang lắng nghe trên `3001` và `3002`.
- Trước khi bật `strictPort`, một lần `bun dev` mới có thể tự chạy sang fallback port.
- Các portal local được kỳ vọng chạy đúng ở `:3001`:
  - `lms.erg.edu.vn:3001`
  - `lcms.erg.edu.vn:3001`
  - `crm.erg.edu.vn:3001`
  - `elearning.erg.edu.vn:3001`
- Khi server rơi sang fallback port hoặc còn process cũ, cả 4 domain có thể trỏ vào stale server hoặc server không thuộc bản repo vừa clone.

Cách xử lý:

- Thêm `server.strictPort: true` trong `vite.config.ts`.
- Dọn các listener Vite cũ trên vùng port `3001-3003`.
- Khởi động lại một dev server sạch tại `https://localhost:3001/`.

## Chi tiết theo phase

### Phase 1 - Foundation

- Thêm các package TanStack:
  - `@tanstack/react-router`
  - `@tanstack/router-devtools`
  - `@tanstack/react-table`
  - `@tanstack/react-form`
  - `@tanstack/react-virtual`
  - `@tanstack/pacer`
  - `@tanstack/store`
- Thêm `sonner` và các dependency hỗ trợ shadcn như `cmdk`, `next-themes`.
- Thêm các shadcn primitive: card, table, tabs, alert, command, popover, scroll-area, select, switch, textarea, progress, toggle, navigation-menu, sonner.
- Cập nhật `src/styles/globals.css` với token ERG blue/red dạng OKLCH và map lại `primary`/`destructive`.

### Phase 2 - DashboardKit migration

- Refactor `src/components/ui/dashboard-kit.tsx` thành compatibility adapter trên shadcn primitives.
- Giữ API consumer hiện tại cho `Button`, `Badge`, `Input`, `Textarea`, `Switch`, `ProgressBar`, `EmptyState`.
- Thêm test cho DashboardKit và Progress.

### Phase 3 - Avatar upgrade

- Cập nhật dashboard account card, nav user, CRM shell và student discussion avatars sang shadcn Avatar.
- Giữ mock teacher account hiển thị ở đáy sidebar bên trái của dashboard.
- Thêm test cho avatar/nav.

### Phase 4 - Pacer + Virtual

- Thêm `src/hooks/use-debounced-value.ts` dùng TanStack Pacer.
- Thêm `src/hooks/use-virtual-list.ts` dùng TanStack Virtual.
- Thêm `src/hooks/use-paced-state-batch.ts` dùng TanStack Pacer `Batcher` cho deferred state batch.
- Áp dụng debounced search cho các hotspot LMS/LCMS/CRM.
- Virtualize các vùng nặng: attendance sheet, score sheet, class student list và legacy teacher rows.
- Thay các pseudo-rAF state deferral trong profile tab sync, class-student filtering/assign dialog, LCMS user access reset/loading flags, teaching schedule refresh, education-unit editor draft refresh, student announcement popup/read-state, learning-resource route selection, student import scope sync, question-bank hydration, LCMS authoring reset, quiz reset và auth hydration.
- `requestAnimationFrame` còn lại chỉ nằm ở weekly class log mention insertion, vì luồng này cần focus textarea, khôi phục caret và resize sau khi chèn text.

### Phase 5 - TanStack Table

- Thêm `src/components/ui/data-table.tsx` với:
  - Sorting state của TanStack.
  - Global filtering.
  - Pagination.
  - Column visibility toggles.
  - Row selection.
  - Column resizing.
  - TanStack Virtual rendering tùy chọn.
- Áp dụng `DataTable` cho login logs và LMS class list.
- Áp dụng TanStack Table headless cho attendance và score sheets:
  - Attendance dùng TanStack global filtering cho student search và TanStack Virtual rows.
  - Score dùng TanStack column/global filtering cho student search, classification filter và TanStack sorting cho active/disabled state, classification order, Vietnamese name order.
  - Hai sheet vẫn giữ renderer spreadsheet-style riêng cho sticky grouped headers và dense editable cells.
- Thêm test cho DataTable: sorting, filtering, pagination và row selection.

### Phase 6 - TanStack Form

- Thêm `src/components/ui/tanstack-form.tsx`.
- Áp dụng TanStack Form / `TsForm` cho:
  - Desktop login/register trong `auth-form-panel.tsx`.
  - Mobile login/register trong `portal-mobile-login-form.tsx`.
  - Teacher login trong `teacher-auth-dialog.tsx`.
  - Teacher registration trong `teacher-auth-dialog.tsx`.
  - Portal onboarding trong `portal-auth-gates.tsx`.
  - Account profile/security panels.
  - LMS learning-resource access gate.
  - LCMS learning resource edit dialogs.
  - LCMS create education unit dialog.
  - LCMS education-unit editor.
  - LCMS authoring upload/create dialogs.
  - Student discussion post composer.
- Thêm validation message real-time bên dưới các field bắt buộc như email, password, name/title, onboarding profile, create-unit name và discussion post content.

### Phase 7 - TanStack Router

- Thay app router provider bằng TanStack `RouterProvider`.
- Thêm `src/routes/router-compat.tsx` để giảm blast radius cho các consumer navigation hiện có.
- Chuyển `src/routes/app-routes.tsx` thành TanStack Router route tree.
- Giữ cơ chế chuyển browser/hash history cho web và Tauri.
- Giữ portal host behavior và cross-domain redirects.

### Phase 8 - Store + Query + Polish

- Thêm `src/stores/persisted-store.ts` dựa trên TanStack Store.
- Áp dụng persisted store wrapper cho dashboard context storage.
- Mở rộng persisted store với JSON helpers cho auth/session domains và các legacy primitive value như raw locale string.
- Migrate teacher account storage, teacher portal sessions và student elearning sessions sang persisted store adapter, đồng thời giữ temporary `sessionStorage` behavior.
- Migrate i18n locale, student announcement snoozes, LMS weekly class logs, LMS attendance saves, generic quiz attempts và LCMS local quiz attempts sang persisted store adapter.
- Thêm `src/lib/query-keys.ts`.
- Chuẩn hóa query keys trên các bề mặt chính: dashboard, LMS, LCMS, question bank, login logs và student dashboard.
- Mount shadcn/Sonner `Toaster` ở root layout.
- Thêm Sonner notification cho LMS attendance save, score classification update và account lock actions.
- Thêm skeleton loading states cho `DataTable`, quiz player shell, account profile sync banner, LCMS access loading blocks, LCMS admin data-source metric và LMS PDF viewer preview.
- Các reference `localStorage` trực tiếp còn lại được giới hạn ở persisted-store adapter, tests, auth/cross-domain session bridge code và low-level attempt-store availability checks.

## Ghi chú phạm vi còn lại

- Attendance và score sheets vẫn giữ UI spreadsheet-style dày đặc nhưng dùng TanStack Table headlessly; nếu ép chuyển toàn bộ sang generic `DataTable`, cần một pass UX riêng cho sticky grouped headers và editable cells.
- Native `<form>` hiện chỉ còn trong chính wrapper `TsForm`.
- `requestAnimationFrame` còn lại chỉ nằm ở weekly class log mention insertion, được giữ vì cần điều phối DOM focus, caret selection và textarea resize sau khi chèn mention.
- Một số surface legacy theo phong cách Google Calendar hoặc illustration vẫn có fixed palette có chủ đích; token ERG core đã được centralize trong `globals.css`, còn shared UI mới/migrated dùng token và shadcn primitives.

## Kiểm chứng

Các lệnh đã chạy thành công sau thay đổi mới nhất:

```powershell
bun run typecheck
bun run build
bun run test
```

Kết quả test đầy đủ:

- 31 test files passed.
- 82 tests passed.

Kiểm chứng tập trung thêm cho Store/Auth:

```powershell
bun run test src/stores/persisted-store.test.ts src/features/lms/weekly-class-log/components/weekly-class-log-page.test.tsx
```

- 2 test files passed.
- 6 tests passed.

Kiểm tra dev server sau khi bật `strictPort` và khởi động một Vite server sạch:

```text
https://lms.erg.edu.vn:3001/         200
https://lcms.erg.edu.vn:3001/        200
https://crm.erg.edu.vn:3001/         200
https://elearning.erg.edu.vn:3001/   200
```

Smoke verification mới nhất dùng Node HTTPS client với `rejectUnauthorized: false`, vì `curl.exe` trên Windows có thể fail với local PFX dev certificate bằng lỗi Schannel `SEC_E_NO_CREDENTIALS` dù server vẫn đang listen và HTTPS response dùng được trong browser.

## Ghi chú vận hành

- `vite.config.ts` hiện có `server.strictPort: true`; nếu `3001` bị chiếm, `bun dev` sẽ fail rõ ràng thay vì âm thầm đổi port.
- `vite.config.ts` cũng đặt `testTimeout: 10_000` vì weekly class log integration test vượt default timeout khi chạy full suite.
- TanStack Router migration dùng compatibility layer để giảm blast radius trong khi app đã chạy dưới TanStack Router.
- Mock teacher account vẫn hiển thị ở bottom-left dashboard sidebar.
