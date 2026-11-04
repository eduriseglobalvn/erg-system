# ERG System - ERG EduRise Global Frontend

> **Tech Stack:** React 19 + Vite 8 + TypeScript 6 + MUI Material v9 (Emotion) + TanStack (Router, Query, Table, Form, Store)
> **Design Direction:** ERG operational education SaaS

---

## 🎯 Core Rules

### UI Stack (ĐÃ CHỌN, KHÔNG THAY ĐỔI)
- ✅ **MUI Material v9 + Emotion** — Hệ UI chính (~320 file). Quyết định 2026-11: GIỮ MUI, KHÔNG migrate sang Tailwind/shadcn (chi phí viết lại toàn bộ UI, không có lợi ích người dùng thấy được).
  - Ưu tiên wrapper `src/components/erg-mui/` (`ErgButton`, `ErgDialog`, `ErgTable`, `ErgTextField`, `ErgSkeleton`, ...) trước khi dùng MUI trực tiếp.
  - **Path import bắt buộc:** `import Button from "@mui/material/Button"`, KHÔNG `from "@mui/material"` (barrel) — `scripts/check-mui-barrel-imports.mjs` chặn trong `npm run verify`.
  - Styling bằng `sx` + theme tokens (`src/themes/erg-enterprise-tokens.ts`, `erg-enterprise-theme.tsx`). KHÔNG hardcode màu mới; dùng token.
  - ⚠️ Theme đặt mặc định `MuiButton variant="text"`. ESLint BẮT BUỘC mọi `<Button>` ghi rõ `variant` (`contained` | `outlined` | `text`); mỗi trang đúng 1 nút `contained`. `ErgButton` có mặc định `contained` riêng.
  - Skeleton mặc định `animation="wave"` (theme).
- ✅ **@mui/icons-material** — Icon chính, path import (`import AddIcon from "@mui/icons-material/Add"`). `lucide-react` chỉ còn ở code cũ, không thêm mới.
- ✅ **@mui/x-date-pickers** — Date/time picker.
- ⚠️ **shadcn/ui + Tailwind v4** (`src/components/ui/`, ~44 file) — LEGACY, chỉ giữ tương thích. KHÔNG thêm component/màn hình mới bằng shadcn; khi sửa màn hình đang dùng thì chuyển dần sang `erg-mui`. KHÔNG trộn `className` Tailwind với `sx` trong component mới.
- ✅ **TanStack Router** — Routing (type-safe, KHÔNG dùng react-router-dom)
- ✅ **TanStack Query v5** — Data fetching
- ✅ **TanStack Table v8** — Bảng dữ liệu
- ✅ **TanStack React Form v1** — Forms
- ✅ **@dnd-kit** — Drag & drop
- ✅ **FullCalendar 6** — Lịch
- ✅ **sonner** — Toast notifications
- ✅ **vite-plugin-pwa** — PWA

### 🚫 ĐÃ LOẠI BỎ (KHÔNG ĐƯỢC DÙNG LẠI)
- ❌ **dashboard-kit.tsx** — Đã xóa, dùng `erg-mui` thay thế
- ❌ **lms-kit.tsx** — Đã xóa
- ❌ **Next-Themes** — Không dùng, theme bằng CSS variables
- ❌ **react-router-dom** — Không dùng, dùng TanStack Router

### Design System: ERG operational UI tokens
- **Primary:** `#0F6CBD` (xanh, token `primary` trong `erg-enterprise-tokens.ts`). Quyết định 11/2026 theo `KE_HOACH_TRIEN_KHAI.md` mục 7.1. `#696CFF` (tím) chỉ còn ở code cũ, đang thay dần bằng token — KHÔNG thêm mới.
- **Typography:** MỘT họ duy nhất **Be Vietnam Pro** (weight 400/500/600/700, subset latin + vietnamese), JetBrains Mono (mono). KHÔNG thêm họ font khác vào theme.
- **Sidebar (admin/giáo viên):** thẻ sáng bo góc, viền 1px, không bóng; mục đang chọn là nút `primary` đặc chữ trắng; nhóm xổ xuống có mục con thụt vào; huy hiệu số nền nhạt; 280px. Học viên: menu phẳng + bottom nav trên mobile (hằng số màu trong `portal-sidebar-styles.ts`).
- **Bảng:** Header bg neutral-50, cell padding 12px 16px, border neutral-200
- **Button:** border-radius sm (6px). Mỗi trang đúng 1 nút `contained`; phụ `outlined`/`text`; nguy hiểm `color="error"`.
- **Badge:** Pill shape, 4 status colors (success/warning/danger/info)
- **Card:** chỉ viền 1px (neutral-200), không shadow; shadow chỉ cho menu/popover/dialog. p-6, radius-md (8px).
- **Màu/cỡ chữ/độ đậm:** dùng token, không hex hay `fontSize`/`fontWeight` số viết tay trong code mới. Tiêu đề trang 24/600, body 14/400. Chi tiết: `KE_HOACH_TRIEN_KHAI.md` mục 7.1.

---

## 📁 Architecture Rules

1. **Feature-first** — Business logic trong `features/<feature>/`
2. **Pages mỏng** — Pages chỉ là wrapper, compose từ feature components
3. **Shell components** — KHÔNG viết shell > 200 dòng, tách thành sub-components
4. **Route type-safe** — Dùng TanStack Router tree, KHÔNG if/else chain
5. **Shared UI** — `src/components/erg-mui/` cho component dùng chung (`src/components/ui/` = shadcn legacy)
6. **Portal UI** — `src/components/portal/` cho sidebar-layout, header, sidebar
7. **Loading** — Một luồng duy nhất: thanh 3px trên cùng (`RoutePendingSkeleton` trong `src/routes/route-feedback.tsx`, nối tiếp thanh boot trong `index.html`) cho chuyển trang/chunk; `ContentPendingSkeleton` cho nội dung trong shell; spinner chỉ trong nút (`ErgButton loading`). KHÔNG thêm loader toàn màn hình hay `LinearProgress`/`CircularProgress` làm fallback trang.

---

## 📱 PWA & Desktop Priority

1. **Offline-first** — TanStack Query persist + IndexedDB
2. **3G tối ưu** — Code-split, skeleton screens, stale-while-revalidate
3. **Responsive** — Mobile-first, bottom nav cho mobile. Thiết bị học sinh thấp nhất: iPhone 7 (iOS 15.8 / Safari 15) — tránh API/CSS chỉ có từ Safari 16+.
4. **Desktop** — Tauri v2 (5MB, Rust backend) cho portable quiz

---

## ✅ Kiểm tra trước khi commit (bắt buộc)

| Lệnh | Ghi chú |
|---|---|
| `bun run typecheck` | = `tsc -b` (~2,5 phút), gồm cả `tsconfig.test.json`. **`tsc --noEmit` ở thư mục gốc KHÔNG kiểm tra gì** (solution-style tsconfig). Kiểm nhanh: `bunx tsc -p tsconfig.app.json --noEmit`. |
| `bunx eslint .` | 0 lỗi. Cảnh báo `no-restricted-imports` cho mock ở code production là nợ đã biết, không thêm mới. |
| `bun run verify` | Vòng phụ thuộc, ranh giới data/folder, legacy identifier, MUI barrel import, endpoint literal, quyền sở hữu route workspace, baseline token thiết kế (hex/fontSize/fontWeight cứng không được tăng; `node scripts/check-design-token-baseline.mjs --update` để hạ baseline). |
| `bun run test` | ~5 phút. KHÔNG chạy song song với `tsc -b` (vitest bị kẹt pool timeout). `src/test/mui-icon-imports.test.ts` đôi khi chập chờn khi máy tải nặng — chạy riêng để xác nhận. |

CI: `.github/workflows/ci.yml`. Mọi GitHub Action phải ghim theo SHA.

## 🔐 Auth và route

- `AUTH_BYPASS_ENABLED` chỉ bật khi `import.meta.env.DEV`. Không dùng bypass ở build production.
- Session đọc qua `useAuthSession` / `getAuthScope`, không đọc trực tiếp localStorage trong code mới.
- Quyền xem route: `ROUTE_PERMISSION_MATRIX` + `evaluatePermission`. Route mới PHẢI có dòng trong ma trận.
- "Admin-like" theo claim: dùng `hasAdminLikeClaims` (`src/platform/auth/permissions/admin-like.ts`), không copy lại danh sách role. Đây chỉ để chọn workspace landing, không thay cho kiểm tra quyền.
- `redirect` sau đăng nhập đi qua `sanitizeRedirect` (chặn `//`, `\`, URL tuyệt đối). SSO return-to chỉ cho phép localhost ở dev.
- Lỗi mutation không tự xử lý sẽ hiện toast toàn cục (`MutationCache.onError`). Muốn im lặng: `meta: { silent: true }` hoặc tự có `onError`.

## 📅 Ngày giờ và định dạng

- Dùng `@/lib/format-date`: `formatDateVi`, `formatDateTimeVi` (trả `""` khi không hợp lệ, không bao giờ "Invalid Date"), `todayInput` (ngày local `yyyy-MM-dd`), `viDateToInput`, `inputDateToVi`.
- CẤM `new Date().toISOString().split("T")[0]` để lấy "hôm nay" (là ngày UTC, lệch 1 ngày từ 0h–7h giờ VN). CẤM `toLocale*String()` không truyền locale.
- Ngày hiển thị `dd/MM/yyyy`, 24 giờ.

## 🌐 API

- Không viết literal đường dẫn API trong code; thêm vào `src/lib/api/api-endpoints.ts` (`scripts/check-api-endpoint-literals.mjs` chặn).
- Backend: `F:\ERG\erg-spring` (Java 25, Maven). Dev frontend `https://localhost:3001`, API `localhost:1606`.
- Không import `mock-*`/fixture từ code production (chỉ test và `src/test/`).

## 🧹 Quy ước làm việc

- Không để code chết: xoá file không còn import (đã dọn 7 file ở 11/2026). Không thêm re-export "cho êm" để tắt cảnh báo.
- File nguồn dùng LF (kiểm bằng `git ls-files --eol`). Cảnh báo "LF will be replaced by CRLF" của git do `core.autocrlf=true`, bỏ qua được. Khi dùng Git Bash, tránh `sed` với dấu `` — viết script Node.
- Kế hoạch tổng thể: `KE_HOACH_TRIEN_KHAI.md`. Mục 7.1 của kế hoạch đề xuất primary `#0F6CBD` + Be Vietnam Pro + card không shadow; chủ dự án đã chốt theo kế hoạch 7.1 (11/2026): primary `#0F6CBD`, Be Vietnam Pro, card chỉ viền. Phần chưa áp dụng hết trong code (nút mặc định `text`, bỏ shadow card, lint cấm hex) là việc đang làm.
