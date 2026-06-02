# Kế hoạch Nâng cấp Toàn diện: shadcn/ui + Full TanStack Ecosystem

## I. Tổng quan Hiện trạng

### Kết quả quét toàn bộ source code

| Khía cạnh | Hiện trạng | Mức độ |
|---|---|---|
| **shadcn components** | 14/40+ đã cài (Avatar, Badge, Breadcrumb, Button, Collapsible, DashboardKit, Dialog, DropdownMenu, Input, Separator, Sheet, Sidebar, Skeleton, Tooltip) | ⚠️ Thiếu ~26 components |
| **TanStack** | Chỉ có React Query v5 | ⚠️ Thiếu Router, Table, Form, Virtual, Pacer, Store |
| **Router** | react-router-dom v7 — 43 route paths, 9 files dùng useNavigate, 8 dùng useLocation, 2 dùng useParams | 🔴 Migration lớn |
| **Form** | 12+ forms dùng native `<form>` + `useState`, KHÔNG có validation | ❌ Nguy hiểm |
| **Debounce** | **ZERO** — tất cả search input fire setState mỗi keystroke | ❌ Nghiêm trọng |
| **Virtualization** | **ZERO** — attendance/score sheets render toàn bộ grid vào DOM | ❌ Nghiêm trọng |
| **State** | ~435+ useState calls trong ~59 files, 35 requestAnimationFrame dùng làm pseudo-debounce | ⚠️ Cần tổ chức lại |
| **Color** | ERG Blue `#00008b` + Red `#cc0022` đã có CSS variables | ✅ Tốt |
| **Avatar** | shadcn Avatar đã cài nhưng `DashboardAccountCard` dùng `<div>` thủ công | ⚠️ Không nhất quán |
| **DashboardKit** | Custom Card, Button, Badge, Input, Switch, ProgressBar — trùng lặp với shadcn | ⚠️ Cần thay thế |
| **localStorage** | 9+ data domains được persist, không có expiry/cleanup | ⚠️ Cần quản lý |

### Combo TanStack áp dụng

```
shadcn/ui + TanStack Router + TanStack Query + TanStack Table + TanStack Form + TanStack Virtual + TanStack Pacer + TanStack Store
```

### Các tool TanStack xếp vào lộ trình tương lai (KHÔNG trong đợt này)
- **TanStack Start** — Không áp dụng (dự án là SPA Vite, không phải SSR framework)
- **TanStack DB** — Đợi khi cần offline mode / real-time sync
- **TanStack AI** — Đợi khi tích hợp AI chatbot chấm bài
- **TanStack Hotkeys** — Đợt polish sau khi core ổn định

---

## II. Kiến trúc Routing Hiện tại (Quan trọng cho TanStack Router)

| Portal | Host | Số routes | Auth guard |
|---|---|---|---|
| LCMS | `lcms.erg.edu.vn:3001` | 14 paths | `PortalAuthGate portal="lcms"` |
| CRM | `crm.erg.edu.vn:3001` | 18 paths | `PortalAuthGate portal="crm"` |
| LMS | `lms.erg.edu.vn:3001` | 18 paths | `PortalAuthGate portal="lms"` |
| E-learning | `elearning.erg.edu.vn:3001` | 4 paths | `PortalAuthGate portal="elearning"` |
| Fallback | Các host khác | 12 paths | Mixed |

**Đặc biệt:** Dùng `HashRouter` khi chạy trên Tauri desktop, `BrowserRouter` cho web. Cross-portal redirect qua `window.location.replace()`.

**Files ảnh hưởng khi migrate Router:**
- `app-routes.tsx` (300 dòng — bộ routing chính)
- 9 files dùng `useNavigate`
- 8 files dùng `useLocation`
- 2 files dùng `useParams`
- 2 files dùng `useSearchParams`
- 5 files dùng `<Link>`
- 10 files dùng `window.location` trực tiếp

---

## III. Các vấn đề Performance phát hiện (Cần TanStack Pacer + Virtual)

### Không có Debounce

| File | Search input | Hậu quả |
|---|---|---|
| `attendance-sheet-panel.tsx:233` | `setSearchQuery(event.target.value)` | Re-render toàn bộ bảng điểm danh mỗi keystroke |
| `score-sheet-panel.tsx:201` | `setSearchQuery(event.target.value)` | Re-render toàn bộ bảng điểm mỗi keystroke |
| `lms-teacher-shell.tsx:500` | `setSearchQuery(event.target.value)` | Re-render danh sách HS mỗi keystroke |
| 5+ files khác | Tương tự | Filter recalculate mỗi keystroke |

### Không có Virtualization

| File | Render pattern | Rủi ro |
|---|---|---|
| `attendance-sheet-panel.tsx` | `filteredStudents.map()` × `visibleColumns.map()` = O(n×m) | Lag nặng khi 500+ HS |
| `score-sheet-panel.tsx` | `sortedStudents.map()` × `scoreColumns.map()` = O(n×m) | Lag nặng khi 500+ HS |
| `learning-resource-authoring-workspace.tsx` | 15+ `.map()` render tree nodes | Lag khi cây thư mục lớn |
| `class-students-workspace.tsx` | Full student list render | Lag khi nhiều lớp |

---

## IV. Kế hoạch Triển khai — 8 Phases

### Phase 1: Foundation — Dependencies & Design Tokens
> **Rủi ro: Thấp | Ảnh hưởng: 3-5 files | Thời gian: 1 session**

#### 1A. Cài đặt dependencies mới
```bash
npm install @tanstack/react-router @tanstack/react-table @tanstack/react-form @tanstack/react-virtual @tanstack/pacer @tanstack/store sonner
```

#### 1B. Cài đặt shadcn components còn thiếu
```bash
npx shadcn@latest add card tabs accordion scroll-area label select checkbox radio-group switch textarea slider alert alert-dialog progress popover command hover-card toggle toggle-group table navigation-menu sonner
```
> **Lưu ý:** KHÔNG cài shadcn `form` (vì nó dùng react-hook-form). Ta sẽ tạo custom form wrappers cho TanStack Form.

#### 1C. Align design tokens — `globals.css`
- Map `--primary` sang ERG Blue (`oklch` equivalent `#00008b`)
- Map `--destructive` sang ERG Red (`oklch` equivalent `#cc0022`)
- Giữ nguyên `--erg-blue`, `--erg-red` variables cho backward compatibility
- Thêm `--erg-blue-hover`, `--erg-blue-light` cho các trạng thái

---

### Phase 2: DashboardKit → shadcn Migration
> **Rủi ro: Trung bình | Ảnh hưởng: 15-20 files | Thời gian: 2 sessions**

#### Chiến lược: Thin re-export layer

Giữ file `dashboard-kit.tsx` như một adapter — import từ shadcn rồi re-export. Consumer files KHÔNG cần sửa imports.

| DashboardKit | → shadcn | Phương pháp |
|---|---|---|
| `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` | shadcn `Card` (mới cài) | Re-export, giữ custom border-radius |
| `Button` (5 variants) | shadcn `Button` (đã có) | Merge variants |
| `Badge` (7 tones) | shadcn `Badge` (đã có) | Extend variants |
| `Input` | shadcn `Input` (đã có) | Re-export, giữ `inputClassName` |
| `Textarea` | shadcn `Textarea` (mới cài) | Re-export |
| `Separator` | shadcn `Separator` (đã có) | Drop-in |
| `ProgressBar` | shadcn `Progress` (mới cài) | Map API |
| `Switch` | shadcn `Switch` (mới cài) | Map `checked` → `checked` |
| `EmptyState` | Giữ nguyên (custom) | Không đổi |

---

### Phase 3: Avatar & User Profile Upgrade
> **Rủi ro: Thấp | Ảnh hưởng: 5-8 files | Thời gian: 1 session**

#### `dashboard-account-card.tsx`
Thay `<div>` thủ công bằng:
```tsx
<Avatar size="lg" className="rounded-xl">
  <AvatarImage src={account?.avatarUrl} alt={displayName} />
  <AvatarFallback className="rounded-xl bg-gradient-to-br from-[var(--erg-blue)] to-[var(--erg-red)] text-white">
    {initials}
  </AvatarFallback>
</Avatar>
```

#### `nav-user.tsx`
- Thêm gradient fallback matching brand colors
- Thay locale toggle `<button>` bằng shadcn `ToggleGroup`

#### CRM + Student Discussion avatars
- Swap `<div>` avatars sang shadcn `Avatar` + `AvatarGroup`

---

### Phase 4: TanStack Pacer + Virtual — Performance Wins
> **Rủi ro: Thấp | Ảnh hưởng: 10-15 files | Thời gian: 2 sessions**
> **Đây là phase có ROI cao nhất — giải quyết triệt để lag/đơ giao diện**

#### 4A. TanStack Pacer — Debounce tất cả search inputs

Tạo `src/hooks/use-debounced-value.ts`:
```tsx
import { Debouncer } from "@tanstack/pacer";
// Hook wrapping TanStack Pacer cho search inputs
// Debounce 300ms, chỉ fire filter sau khi user ngừng gõ
```

Áp dụng cho 8+ files có search input không debounce.

#### 4B. TanStack Virtual — Virtualize danh sách lớn

Tạo `src/hooks/use-virtual-list.ts` wrapper.

Áp dụng cho:
- `attendance-sheet-panel.tsx` — virtualRow cho bảng điểm danh
- `score-sheet-panel.tsx` — virtualRow cho bảng điểm
- `learning-resource-authoring-workspace.tsx` — virtual tree nodes
- `class-students-workspace.tsx` — virtual student list
- `lms-teacher-shell.tsx` — virtual student dropdown

#### 4C. Thay thế 35 requestAnimationFrame calls
Chuyển sang TanStack Pacer batching patterns.

---

### Phase 5: TanStack Table — Data Grid
> **Rủi ro: Trung bình | Ảnh hưởng: 5-8 files | Thời gian: 2-3 sessions**

#### Tạo `src/components/ui/data-table.tsx`
Reusable DataTable wrapper: TanStack Table (headless) + shadcn `<Table>` (UI) + TanStack Virtual (performance).

Bao gồm: sorting, filtering, pagination, column visibility, row selection, column resizing.

#### Áp dụng cho:

| View | File | useState hiện tại | Cải thiện |
|---|---|---|---|
| Attendance Sheet | `attendance-sheet-panel.tsx` (784 dòng, 9 useState) | Custom table HTML | TanStack Table + Virtual |
| Score Sheet | `score-sheet-panel.tsx` (799 dòng, 22 useState) | Custom table HTML | TanStack Table + Virtual |
| User Access Control | `user-access-control-workspace.tsx` | Custom list | TanStack Table |
| Login Logs | `login-logs-page.tsx` | Custom list | TanStack Table |
| Class List | `class-list-workspace.tsx` | Custom grid | TanStack Table |
| Student Import | `student-sheet-import-workspace.tsx` | Custom list | TanStack Table |

---

### Phase 6: TanStack Form — Form System
> **Rủi ro: Cao | Ảnh hưởng: 12-15 files | Thời gian: 3-4 sessions**

#### 6A. Tạo TanStack Form + shadcn integration layer

Vì shadcn `<Form>` dùng react-hook-form, ta cần tạo custom wrappers:

```
src/components/ui/tanstack-form.tsx
├── TsForm          — wraps <form> với TanStack Form context
├── TsFormField     — wraps useField() + renders shadcn Input/Select/etc.
├── TsFormLabel     — styled label
├── TsFormMessage   — error message display
└── TsFormItem      — layout wrapper
```

Các component này sẽ:
- Nhận `form` instance từ `useForm()` của TanStack Form
- Per-field rendering (chỉ re-render field bị thay đổi)
- Hiển thị validation errors từ TanStack Form validators
- Sử dụng shadcn Input, Select, Checkbox, etc. cho UI

#### 6B. Migrate forms theo thứ tự

| # | Form | File | Validation cần thêm |
|---|---|---|---|
| 1 | Login | `auth-form-panel.tsx` | email format, password min 6 |
| 2 | Register | `auth-form-panel.tsx` | email, password match, name required |
| 3 | Teacher login | `teacher-auth-dialog.tsx` | email, password |
| 4 | Portal login gate | `portal-auth-gates.tsx` | email, password |
| 5 | Mobile login | `portal-mobile-login-form.tsx` | email, password |
| 6 | Profile edit | `account-panel.tsx` | name required, email format |
| 7 | Create education unit | `create-education-unit-workspace.tsx` | complex multi-field |
| 8 | Resource edit dialogs (×3) | `learning-resource-authoring-edit-dialogs.tsx` | label required |
| 9 | Discussion post | `student-discussion-feed.tsx` | text required |

---

### Phase 7: TanStack Router — Routing Migration
> **Rủi ro: CAO | Ảnh hưởng: ~30 files | Thời gian: 4-5 sessions**
> **Đây là phase phức tạp nhất — cần test kỹ từng portal**

#### 7A. Thiết kế Route Tree

```
src/routes/
├── __root.tsx              — Root layout (TooltipProvider, AppSeo, auth listeners)
├── _portal.tsx             — Portal detection middleware
├── _auth.tsx               — Auth guard layout
├── lcms/
│   ├── _layout.tsx         — LcmsPortalShell wrapper
│   ├── index.tsx
│   ├── schools.tsx
│   ├── resources.tsx
│   └── ... (11 routes)
├── lms/
│   ├── _layout.tsx         — DashboardPage wrapper  
│   ├── index.tsx
│   ├── homework.tsx
│   ├── score.tsx
│   ├── attendance.tsx
│   └── ... (15 routes)
├── crm/
│   ├── _layout.tsx
│   └── ... (7 routes)
├── elearning/
│   ├── _layout.tsx
│   └── index.tsx
└── _public/
    ├── cong-khai.tsx
    ├── question-types.tsx
    └── not-found.tsx
```

#### 7B. Migration steps

1. Cài đặt TanStack Router dev tools + codegen
2. Tạo route tree definition file
3. Thay `<BrowserRouter>` / `<HashRouter>` bằng `<RouterProvider>`
4. Port portal detection vào route middleware
5. Migrate `useNavigate` → `useNavigate` (TanStack) — API tương tự
6. Migrate `useParams` → route params (type-safe tự động)
7. Migrate `useLocation` → `useRouterState`
8. Migrate `useSearchParams` → `Route.useSearch()` (type-safe!)
9. Migrate `<Link>` → TanStack `<Link>` — API tương tự
10. Migrate `<Navigate>` → `redirect()` trong route loaders
11. Giữ nguyên `window.location.replace()` cho cross-portal redirects (không thể dùng SPA router cho cross-domain)

#### 7C. Đặc biệt: Tauri HashRouter
TanStack Router hỗ trợ `createHashHistory()` — tương đương HashRouter. Sẽ dùng conditional history giống hiện tại.

#### 7D. Type-safe Search Params — Lợi ích lớn nhất
```tsx
// TRƯỚC: không type-safe
const [searchParams] = useSearchParams();
const portal = searchParams.get("portal"); // string | null

// SAU: type-safe 100%
const { portal } = Route.useSearch(); // { portal: "lcms" | "crm" | "lms" }
```

---

### Phase 8: TanStack Store + API Optimization + Polish
> **Rủi ro: Thấp | Ảnh hưởng: toàn bộ | Thời gian: 2-3 sessions**

#### 8A. TanStack Store — Quản lý client state
- Thay thế localStorage patterns bằng TanStack Store + persist middleware
- Consolidate 9+ localStorage domains vào organized stores
- Dashboard context store (thay `useState` + `localStorage` thủ công)
- Auth session store (wrapper cho auth-token-storage)

#### 8B. API Optimization với TanStack Query
- Audit tất cả `useQuery` keys — standardize key factory pattern
- Thêm `useMutation` + `invalidateQueries` cho form submits hiện dùng raw fetch
- Prefetching khi hover sidebar items
- Optimistic updates cho CRUD nhỏ (edit title, toggle status)

#### 8C. Polish Apple-like Design
- Skeleton loading states thay "Đang tải..." text
- Sonner toast thay inline error messages
- Typography: `letter-spacing: -0.02em` cho headings
- Spacing: 8px grid system nhất quán
- Transitions: `duration-200 ease-out` cho tất cả interactive elements
- Loại bỏ hardcoded hex colors → CSS variables / Tailwind tokens

---

## V. Sơ đồ Thứ tự Thực hiện

```
Phase 1 (Foundation)
    ↓
Phase 2 (DashboardKit → shadcn)
    ↓
    ├── Phase 3 (Avatar) ──────────────┐
    ├── Phase 4 (Pacer + Virtual) ─────┤
    ├── Phase 5 (TanStack Table) ──────┤
    └── Phase 6 (TanStack Form) ───────┤
                                       ↓
                              Phase 7 (TanStack Router)
                                       ↓
                              Phase 8 (Store + Polish)
```

> Phase 3, 4, 5, 6 có thể chạy **song song** sau khi Phase 2 hoàn thành.
> Phase 7 (Router) nên chạy **cuối cùng** vì nó ảnh hưởng toàn cục và cần tất cả components đã ổn định.

---

## VI. Tổng hợp Ước lượng

| Phase | Files | Rủi ro | Sessions |
|---|---|---|---|
| 1. Foundation | 3-5 | Thấp | 1 |
| 2. DashboardKit | 15-20 | Trung bình | 2 |
| 3. Avatar | 5-8 | Thấp | 1 |
| 4. Pacer + Virtual | 10-15 | Thấp | 2 |
| 5. TanStack Table | 5-8 | Trung bình | 2-3 |
| 6. TanStack Form | 12-15 | Cao | 3-4 |
| 7. TanStack Router | ~30 | **Rất cao** | 4-5 |
| 8. Store + Polish | Toàn bộ | Thấp | 2-3 |
| **Tổng** | | | **17-23 sessions** |

---

## VII. Verification Plan — Sau mỗi Phase

```powershell
# 1. TypeScript compilation
npx tsc -p tsconfig.app.json --noEmit

# 2. Unit tests
npm run test

# 3. Dev server smoke test — kiểm tra từng portal
npm run dev
# Mở: lms.erg.edu.vn:3001, lcms.erg.edu.vn:3001, crm.erg.edu.vn:3001, elearning.erg.edu.vn:3001
```

### Checklist theo Phase
1. **Phase 1:** `--primary` button hiển thị ERG Blue
2. **Phase 2:** Card, Button, Badge hiển thị giống hệt trước
3. **Phase 3:** Avatar gradient ERG Blue→Red ở fallback
4. **Phase 4:** Search input KHÔNG lag, scroll bảng điểm danh mượt 60fps
5. **Phase 5:** Attendance/Score sheet có sorting + filtering
6. **Phase 6:** Login form validate real-time, error hiện dưới input
7. **Phase 7:** Tất cả 4 portals navigate đúng, auth guards hoạt động, Tauri HashRouter OK
8. **Phase 8:** Toast notifications khi CRUD, Skeleton khi loading

---

## VIII. Nguyên tắc Bất di bất dịch

1. ✅ **Logic giữ nguyên 100%** — chỉ swap UI components
2. ✅ **API calls không đổi** — chỉ optimize caching/batching
3. ✅ **Mỗi phase phải build được** — không "big bang"
4. ✅ **Brand colors Blue + Red** — mọi nơi, mọi component
5. ✅ **Mock teacher account** — giữ nguyên ở sidebar bottom-left
6. ✅ **Feature-first architecture** — tuân thủ AGENTS.md rules
