# ERG MUI System Refactor Design

> Status: completed — canonical implementation evidence is tracked in `D:/ERG/TASK/ERG_Task_Management_.xlsx` and the paired plan when present.

**Ngày:** 2026-07-15
**Trạng thái:** Đã chốt hướng thị giác B — trắng, tinh tế, hiện đại; chờ xác nhận đặc tả trước khi lập kế hoạch triển khai.

## 1. Mục tiêu

Chuyển toàn bộ frontend ERG từ mô hình hybrid Tailwind/shadcn/Radix/lucide sang ERG MUI mà không làm thay đổi luồng nghiệp vụ, cấu trúc thông tin, mật độ dữ liệu hay hành vi tương tác hiện tại. Sau refactor, các portal LMS, LCMS, Elearning, auth và admin phải dùng chung một ngôn ngữ giao diện sáng, rõ, ít nhiễu và nhất quán.

Kết quả cuối cùng:

- UI nghiệp vụ dùng MUI Material, MUI System/`sx`, ERG wrappers và MUI Icons path imports.
- Không còn Tailwind utility class trong TSX, `@import "tailwindcss"`, plugin Tailwind hoặc dependency chỉ phục vụ Tailwind.
- Không còn shadcn/Radix/lucide trong các code path đã migrate; dependency chỉ được xóa khi repository không còn usage.
- Giữ TanStack Router, TanStack Query persistence, route code splitting, skeleton loading và kiến trúc feature-first.
- Matching Question giữ nguyên hình học, connector, drag/drop effect, active color, source placeholder và layout practice/editor.

## 2. Phạm vi

### Trong phạm vi

- Theme, typography, palette, spacing, radius, elevation và motion toàn hệ thống.
- Portal shell, sidebar, header, navigation, account/scope controls.
- LMS: lịch, giao lịch, nhận lịch giáo viên, bài tập, điểm, điểm danh, lớp, tài nguyên, báo cáo và các workspace giáo viên.
- LCMS: school/admin operations, import, users, quiz/question bank/editor, resources, legal, settings.
- Elearning: dashboard học viên, lesson/test flow, discussion, notification và mobile navigation.
- Auth/profile/shared UI và toàn bộ `src/components/ui` còn được sử dụng.
- Calendar/FullCalendar integration, PDF/document surfaces và specialized editor styles.
- Visual regression, interaction regression, accessibility và performance verification.

### Ngoài phạm vi

- Thay đổi API contract, business rules hoặc permission rules không cần thiết cho migration UI.
- Viết lại TanStack Router/Query hoặc thay thư viện calendar, DnD, PDF.
- Đổi nội dung nghiệp vụ, route URL hoặc điều hướng đã được người dùng chấp thuận.
- Tái thiết kế mạnh kiểu direction C.

## 3. Các hướng triển khai đã cân nhắc

### A. Big-bang theo toàn repository

Thay mọi utility và primitive trong một lần rồi sửa lỗi build. Nhanh về thao tác cơ học nhưng visual diff rất lớn, khó khoanh vùng regression và có nguy cơ lặp lại lỗi mất toàn bộ UI khi Tailwind bị gỡ trước khi replacement hoàn tất.

### B. Foundation-first, feature waves có quality gate — chọn

Xây theme/wrapper trước, sau đó migrate theo từng wave nhưng vẫn trong cùng một chương trình và cùng nhánh. Mỗi wave có baseline screenshot, targeted test, typecheck và visual comparison trước khi chuyển wave tiếp theo. Đây là cách cân bằng tốt nhất giữa yêu cầu “làm toàn bộ” và yêu cầu “UI không vỡ”.

### C. Compatibility adapter kéo dài

Giữ Tailwind và Radix lâu dài phía sau adapter MUI để giảm visual diff tức thời. An toàn trong ngắn hạn nhưng không đạt mục tiêu xóa toàn bộ legacy stack, làm bundle và hệ thống style tiếp tục bị trùng lặp.

## 4. Hướng thiết kế thị giác

Áp dụng direction B:

- Nền ứng dụng sáng trung tính; surface trắng; border nhẹ thay cho shadow nặng.
- Primary blue lấy từ `src/themes/erg-enterprise-tokens.ts` và MUI theme, không tạo palette riêng rải rác.
- Manrope Variable cho body/navigation/table; JetBrains Mono cho code, ID và dữ liệu cần scan dạng mono.
- Radius cơ sở 8px theo ERG MUI tokens; chỉ giữ radius khác ở specialized UI khi visual parity yêu cầu.
- Header cao 64px; sidebar 280px, trừ shell đã khóa kích thước riêng và được migrate bằng adapter tương thích trước khi hội tụ.
- Table dùng nhịp enterprise dày, cell 14px, sticky header/toolbar nếu pattern hiện có yêu cầu.
- Motion chỉ áp dụng cho menu, drawer, collapse, hover/focus và zoom/scroll feedback; duration ngắn, easing ổn định, hỗ trợ `prefers-reduced-motion`.
- Không gradient trang trí, orb/blob, card lồng card hoặc hero marketing trong workspace.

“Giữ nguyên UI” trong migration được định nghĩa là:

1. Giữ nguyên vị trí và thứ tự các vùng nghiệp vụ chính.
2. Giữ kích thước control, breakpoint, scroll ownership và mật độ dữ liệu trong ngưỡng visual regression đã chấp thuận.
3. Giữ nguyên keyboard flow, focus behavior, drag/drop, zoom, selection, menu/drawer và trạng thái loading/error/empty.
4. Cho phép đồng bộ màu nền, border, typography, radius và motion theo direction B khi không làm đổi cấu trúc hoặc thao tác.

## 5. Kiến trúc UI đích

### Theme và provider

- `src/themes/erg-enterprise-tokens.ts` là nguồn token chính.
- Một MUI theme/provider dùng chung cho toàn ứng dụng, bao gồm component overrides cho Button, IconButton, Input, Select, Dialog, Drawer, Menu, Tabs, Table, Chip, Tooltip, Skeleton và Snackbar.
- `CssBaseline` và MUI `GlobalStyles` chịu trách nhiệm reset/global interoperability.
- CSS thường chỉ còn cho FullCalendar, PDF canvas, Matching connectors, DnD geometry và editor behavior khó biểu diễn an toàn bằng `sx`.

### ERG wrappers

`src/components/erg-mui` cung cấp adapter mỏng, có API ổn định cho các pattern lặp lại:

- `ErgPage`, `ErgPageHeader`, `ErgToolbar`, `ErgSurface`.
- `ErgButton`, `ErgIconButton`, `ErgSearchField`, `ErgSelect`.
- `ErgStatusChip`, `ErgEmptyState`, `ErgErrorState`, `ErgSkeleton`.
- `ErgDataTable` helpers cho dense table, không bọc lại TanStack Table business logic.
- `ErgDialog`, `ErgDrawer`, `ErgMenu` cho các pattern accessible thống nhất.

Wrappers không chứa business logic và không trở thành một framework mới phía trên MUI.

### Feature boundaries

- Pages trong `src/app/pages` chỉ compose feature components.
- Query/mutation, mapping DTO và business state tiếp tục nằm trong `src/features/<feature>`.
- Shell ở `src/components/portal` hoặc feature shell hiện có, được tách nhỏ nếu vượt 200 dòng.
- Route tiếp tục dùng TanStack Router type-safe và lazy/code-split theo route.

## 6. Chiến lược migration

### Wave 0 — Baseline và guardrails

- Ghi lại inventory Tailwind/Radix/lucide/className theo file và domain.
- Chụp baseline các route đại diện ở desktop/mobile và các interaction state quan trọng.
- Ghi nhận test failures có sẵn để không quy lỗi nhầm cho migration.
- Thêm kiểm tra repository ngăn code mới thêm Tailwind utility, Radix/shadcn hoặc lucide.

### Wave 1 — Foundation và shell

- Hoàn thiện theme, tokens, provider và ERG wrappers.
- Migrate root layout, portal shell, sidebar/header, scope/account controls và motion.
- Giữ kích thước shell ổn định để các feature wave không bị visual diff dây chuyền.

### Wave 2 — LMS và schedule

- Migrate teacher shell, central calendar, schedule assignment/receipt, attendance, score, homework, resources và reports.
- FullCalendar giữ CSS integration chuyên biệt nhưng lấy màu/spacing từ MUI theme tokens.
- Kiểm tra scroll/zoom/menu animation bằng browser và performance trace ở màn dữ liệu dày.

### Wave 3 — LCMS và authoring

- Migrate school/admin operations, import/users, question bank, quiz editor, resources, legal/settings.
- Matching Question được xử lý như vùng visual-locked: migration nội bộ chỉ được chấp nhận khi screenshot và interaction parity đạt yêu cầu.

### Wave 4 — Elearning, auth và shared legacy

- Migrate student mobile app, lesson/test/discussion, auth/profile và shared components.
- Bảo vệ tap target, offline state, responsive layout và mobile bottom navigation.

### Wave 5 — Removal

- Khi mọi usage đã về 0: xóa `@import "tailwindcss"`, Tailwind Vite plugin, Tailwind config/glue, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`, Radix/shadcn và `lucide-react` nếu không còn consumer.
- Xóa dead legacy components và CSS selectors không còn được tham chiếu.
- Chạy lại dependency graph và bundle analysis.

## 7. Data flow và trạng thái

Migration không thay query keys, API contracts hay mutation semantics trừ khi phát hiện lỗi độc lập và được xử lý riêng.

- Loading dùng skeleton đúng vùng, không che toàn màn hình bằng spinner.
- Empty state phân biệt chưa có dữ liệu, filter không có kết quả, không có quyền và lỗi tải.
- Mutation giữ trạng thái idle/dirty/saving/saved/error hiện tại; MUI chỉ thay lớp hiển thị.
- Scope school/class/tenant/role tiếp tục tham gia query key và invalidation.
- Optimistic update chỉ giữ ở nơi đã có rollback rõ ràng.
- Table/list lớn tiếp tục dùng TanStack Table/Virtual và stable dimensions.

## 8. Error handling và accessibility

- Dialog/Drawer/Menu/Popover dùng MUI primitives với focus trap, escape handling và restoration đúng chuẩn.
- Icon-only controls có `aria-label` và Tooltip khi cần.
- Status không chỉ thể hiện bằng màu.
- Server validation được map về field; lỗi quan trọng không chỉ nằm trong toast.
- Destructive actions giữ confirmation/audit context hiện có.
- Focus ring và keyboard flow phải được snapshot/test ở navigation, table action và editor.

## 9. Visual và interaction regression

Mỗi wave chỉ hoàn tất khi đáp ứng đủ:

- Screenshot desktop và mobile của các route đại diện không có layout shift, text overlap, missing style hoặc scroll ownership sai.
- So sánh các state: default, hover, focus, expanded/collapsed, menu open, dialog/drawer open, loading, empty, error.
- Test riêng zoom in/out, smooth scroll và sidebar open/close vì đây là vùng người dùng đã báo giật/khựng.
- Matching: kiểm tra connector geometry, drag source/target, active drag color, placeholder, editor và practice.
- Calendar: kiểm tra event density, current day, conflict/status, popover và mobile agenda.

Visual diff không được che bằng tăng threshold toàn cục. Nếu có thay đổi có chủ ý theo direction B, baseline mới phải được duyệt theo từng surface.

## 10. Verification và tiêu chí hoàn tất

### Kiểm tra tự động

- `bun run lint`
- `bun run typecheck`
- `bun run test` và targeted tests theo feature
- `bun run build`
- Repository scans xác nhận không còn Tailwind utility, Tailwind import/plugin, shadcn/Radix/lucide usage.
- Bundle check: initial gzip mục tiêu dưới 100KB; nếu baseline hiện tại cao hơn, migration không được làm tăng thêm và phải ghi rõ delta.

### Kiểm tra browser

- Route smoke test cho LMS, LCMS, Elearning, auth/admin.
- Desktop và mobile viewport.
- Keyboard, focus, screen-reader naming cơ bản.
- Sidebar/menu motion, scroll/zoom, table virtualization, DnD, calendar và dialog/drawer.

### Definition of Done

1. Toàn bộ UI trong phạm vi dùng ERG MUI implementation.
2. Legacy style dependencies đã được xóa khi usage bằng 0.
3. Không thay đổi API/business flow ngoài phạm vi.
4. Không có regression mới trong typecheck, build, targeted tests và visual baseline.
5. Matching Question và các specialized interactions giữ visual/behavior parity.
6. Các baseline failure có sẵn được ghi tách biệt, không bị che hoặc báo sai là đã sửa.

## 11. Rủi ro và biện pháp

- **Mất style khi gỡ Tailwind sớm:** chỉ gỡ dependency ở Wave 5 sau zero-usage scan.
- **Visual diff dây chuyền từ theme:** migrate shell trước, dùng component overrides có kiểm soát và screenshot gate.
- **Bundle tăng do MUI imports:** bắt buộc path imports, route splitting và bundle measurement từng wave.
- **Table chậm:** không mount heavy MUI primitives trong từng cell; giữ virtualization và controlled shared overlays.
- **DnD/Matching sai geometry:** giữ specialized CSS/measurement logic, đổi implementation từng lớp và so sánh screenshot + interaction.
- **Migration kéo dài tạo hai hệ thống:** mỗi wave có phạm vi đóng, zero-new-legacy rule và dashboard tiến độ usage.
