# Kế Hoạch Clone UI CenterUp Cho LCMS & CRM

> **Ngày:** 2026-06-11  
> **Mục tiêu:** Copy toàn bộ UI CenterUp (staging.centerup.vn/center-app/) vào LCMS và CRM của ERG System  
> **Triết lý:** CenterUp là 1 app gộp - chúng ta tách ra 2 portal riêng nhưng UI phải Y HỆT  
> **Phạm vi:** Toàn bộ giao diện, trừ màn hình Tạo Quiz (quiz-editor) và Quản lý học liệu (learning-resources)  
> **⚠️ TUYỆT ĐỐI KHÔNG ĐỤNG:** quiz-editor, learning-resources (giữ nguyên 100%, không sửa 1 dòng)  
> **Senior Engineer:** 50 năm kinh nghiệm, cực kỳ khó tính, pixel-perfect

---

## 📋 Mục Lục

1. [Phân Tích CenterUp](#1-phân-tích-centerup)
2. [CenterUp Feature Map → Portal Mapping](#2-centerup-feature-map--portal-mapping)
3. [UI Component Inventory](#3-ui-component-inventory)
4. [Kế Hoạch Từng Bước](#4-kế-hoạch-từng-bước)
5. [LCMS Screen-by-Screen](#5-lcms-screen-by-screen)
6. [CRM Screen-by-Screen](#6-crm-screen-by-screen)
7. [Design Token Reference (EXACT)](#7-design-token-reference-exact)
8. [Component Implementation Spec](#8-component-implementation-spec)
9. [Routing & Navigation](#9-routing--navigation)
10. [Timeline](#10-timeline)

---

## ⚠️ QUY TẮC SỐ 1: KHÔNG BAO GIỜ ĐỤNG VÀO 2 MÀN HÌNH NÀY

### 🚫 Màn hình 1: Tạo Quiz (quiz-editor)
```
Đường dẫn: /quiz-editor
Thư mục:  src/features/lcms/quiz/quiz-editor/
File:     quiz-editor.tsx + các sub-components
Lý do:    UI phức tạp, nhiều tương tác drag-drop, preview realtime
Trạng thái: GIỮ NGUYÊN 100%
```

### 🚫 Màn hình 2: Quản lý học liệu (learning-resources)
```
Đường dẫn: /resources
Thư mục:  src/features/lms/learning-resources/
File:     learning-resource-library-page.tsx + tree + taxonomy
Lý do:    UI cây thư mục, search, filter riêng
Trạng thái: GIỮ NGUYÊN 100%
```

### ✅ Những gì KHÔNG nằm trong vùng cấm:
- LCMS Dashboard (tổng quan)
- Danh sách khóa học, lớp học, buổi học, bài tập
- Học viên, Nhân sự, Tài chính, Thiết lập, Tích hợp
- CRM Dashboard, Khách hàng, Chat Zalo, Trường, Opportunity
- **Tất cả các trang dạng DataTable list — ĐƯỢC SỬA**

> **Nếu có bất kỳ nghi ngờ nào:** không sửa file. Hỏi lại trước.

---

## 1. Phân Tích CenterUp

CenterUp có UI **duy nhất cho tất cả**. Khi click vào các menu, nó show các trang khác nhau. Cấu trúc của họ:

```
CENTERUP (1 app duy nhất)
├── Trang chủ           → Dashboard (widgets: tasks, absence, calendar)
├── Báo cáo             → 7 sub-pages (Tổng quan, Tuyển sinh, Học viên, etc)
├── Lịch toàn trung tâm → Calendar
├── CRM & Hiệu suất     → 
│   ├── Khách hàng      → 3 sub-pages (DS Khách hàng, Chat Zalo, Nhật ký cuộc gọi)
│   └── Công việc       → Tasks list
├── Giảng dạy           →
│   ├── Học viên        → 6 sub-pages (TK, Ghi danh khóa/lớp/buổi, BT, Đơn nghỉ)
│   ├── Khóa học        → Courses list
│   ├── Lớp học         → Classes list
│   ├── Buổi học        → Sessions list
│   ├── Bài tập         → Assignments list
│   └── Bài tập & tài liệu → 2 sub-pages (Ngân hàng BT, Ngân hàng CH)
├── Quản lý             →
│   ├── Nhân sự         → 4 sub-pages (TK NV, Quét khuôn mặt, Timesheet, Đơn nghỉ)
│   ├── Tài chính       → 7 sub-pages (HĐ, Mua hàng, Thu/Chi khác, Hoàn phí, GD, GD Coin)
│   └── Khác            → 2 sub-pages (Hàng hóa, Đối tác)
├── Hệ thống            →
│   ├── Thiết lập       → 9 sub-pages (Gói, Phân quyền, KM, CV, KH, Phòng, SK, Điểm, Thu chi)
│   └── Tích hợp        → 3 sub-pages (Tổng đài, Zalo, API key)
└── Footer/Sidebar bottom: Center info, Mua Coin, Nâng cấp, Trợ giúp
```

### Feature → Portal Mapping

| CenterUp Feature | LCMS (quản trị nội dung) | CRM (bán hàng) | Cả hai |
|-----------------|--------------------------|-----------------|--------|
| Trang chủ (Dashboard) | ❌ | ❌ | ✅ Dashboard chung |
| Báo cáo Tổng quan | ✅ | ✅ | ✅ |
| Báo cáo Tuyển sinh | ❌ | ✅ | ❌ |
| Báo cáo Học viên | ✅ | ❌ | ❌ |
| Lịch toàn trung tâm | ✅ | ✅ | ✅ |
| Khách hàng, Chat Zalo, Nhật ký cuộc gọi | ❌ | ✅ | ❌ |
| Công việc | ✅ | ✅ | ✅ |
| Học viên (6 trang) | ✅ | ❌ | ❌ |
| Khóa học | ✅ | ❌ | ❌ |
| Lớp học | ✅ | ❌ | ❌ |
| Buổi học | ✅ | ❌ | ❌ |
| Bài tập | ✅ | ❌ | ❌ |
| Ngân hàng bài tập/câu hỏi | ✅ (giữ) | ❌ | ❌ |
| Nhân sự (4 trang) | ✅ | ❌ | ❌ |
| Tài chính (7 trang) | ❌ | ❌ | ✅ (dùng chung) |
| Hàng hóa, Đối tác | ❌ | ❌ | ✅ (dùng chung) |
| Thiết lập (9 trang) | ✅ | ✅ | ✅ |
| Tích hợp (3 trang) | ✅ | ✅ | ✅ |

---

## 2. UI Component Inventory (Cần Build)

### Từ CenterUp staging, tôi đã extract được các component sau:

```
┌─────────────────────────────────────────────────────────────┐
│                   SIDEBAR COMPONENTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  SidebarContainer    280px, dark #1C252E                   │
│  ├── SidebarLogo     Logo + tên center + plan badge        │
│  ├── SidebarGroup    "Giảng dạy", "Quản lý" (12px/700)     │
│  ├── SidebarItem     h-44px, icon 20px, text 15px          │
│  │   ├── .active     bg rgba(105,108,255,0.08) + white     │
│  │   └── .hover      bg rgba(255,255,255,0.04)             │
│  ├── SidebarSub       sub-item, indent, collapsible         │
│  ├── SidebarArrow     rotate animation 200ms                │
│  ├── SidebarDivider   rgba(145,158,171,0.12)                │
│  ├── SidebarBottom    Center info section                   │
│  │   ├── Avatar + name                                      │
│  │   ├── Mua Coin / Nâng cấp buttons                       │
│  │   └── Trung tâm trợ giúp link                            │
│  └── SidebarScroll    custom scrollbar 6px                  │
│                                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   HEADER COMPONENTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  HeaderContainer    64px, white, border-bottom              │
│  ├── SearchBar      Input + ⌘K badge                       │
│  ├── LanguageSwitch IconButton                              │
│  ├── SearchBtn      IconButton                              │
│  ├── NotificationBell Badge 23, error color                 │
│  ├── SettingsBtn    IconButton                              │
│  └── UserAvatar     Avatar, 32px, #696CFF                   │
│                                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DATA DISPLAY COMPONENTS                   │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  DataTable          Full-width, dashed borders              │
│  ├── TableHeader    14px/600 #637381, bg white              │
│  ├── TableCell      14px/400 #1C252E, padding 6px 16px     │
│  ├── TableRow       Hover bg rgba(105,108,255,0.02)        │
│  └── TablePagination "Dòng/trang 10" combobox              │
│                                                            │
│  DashboardCard      Border 1px, radius 8px, p-20-24        │
│  ├── CardHeader     h6 18px/600 + "Xem tất cả" link        │
│  ├── CardSeparator  border-b rgba(145,158,171,0.12)        │
│  ├── CardContent    Scroll if needed                        │
│  └── CardFooter     Thu gọn checkbox                        │
│                                                            │
│  StatusBadge        Badge trạng thái                        │
│  ├── success        bg rgba(34,197,94,0.12) #118D57        │
│  ├── warning        bg rgba(255,171,0,0.16) #B76E00        │
│  ├── danger         bg rgba(255,86,48,0.12) #B71D18        │
│  ├── info           bg rgba(0,184,217,0.12) #007A8C        │
│  └── neutral        bg #F4F6F8 #637381                      │
│                                                            │
│  TabBar             Inline-flex, border-bottom              │
│  ├── Tab            px-24, 14px/500, #637381                │
│  └── Tab.active     2px solid #696CFF indicator + #696CFF   │
│                                                            │
│  TabBadge           Counter badge trên tab                  │
│  └── active         bg rgba(105,108,255,0.12)               │
│                                                            │
│  Breadcrumb         Chevron separator                       │
│  └── .active        #1C252E / 600                           │
│                                                            │
│  ProgressBar        h-10px, radius 40px                     │
│  └── Fill           #696CFF, animated width                 │
│                                                            │
│  EmptyState         Centered icon + text                    │
│                                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FORM / INPUT COMPONENTS                   │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  TextField          h-40px, radius 8px, border input       │
│  ├── focus          border #696CFF + shadow ring            │
│  └── placeholder    #919EAB                                 │
│                                                            │
│  Select             h-40px, custom chevron SVG              │
│  ├── focus          border #696CFF + shadow ring            │
│  └── dropdown       Paper border 1px                        │
│                                                            │
│  Checkbox           18x18, radius 4px                       │
│  └── checked        #696CFF + white check SVG               │
│                                                            │
│  Button             h-36px, padding 6px 16px                │
│  ├── primary        #696CFF, shadow-sm                      │
│  ├── outline        border rgba(145,158,171,0.24)           │
│  ├── ghost          transparent                              │
│  ├── small          h-30px, padding 4px 10px, 13px          │
│  └── large          h-44px, padding 8px 22px, 15px          │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Kế Hoạch Từng Bước

```
██╗  ██╗███████╗    ██████╗  ██╗      █████╗ ███╗   ██╗
██║  ██║██╔════╝    ██╔══██╗██║     ██╔══██╗████╗  ██║
███████║█████╗      ██████╔╝██║     ███████║██╔██╗ ██║
██╔══██║██╔══╝      ██╔═══╝ ██║     ██╔══██║██║╚██╗██║
██║  ██║███████╗    ██║     ███████╗██║  ██║██║ ╚████║
╚═╝  ╚═╝╚══════╝    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

### Phase 1: Component Library (Tuần 1-2)

**Mục tiêu:** Xây dựng thư viện component CenterUp-exact, reusable cho cả LCMS và CRM.

```mermaid
gantt
    title Phase 1: Component Library
    dateFormat  YYYY-MM-DD
    section Core
    Theme tokens + MUI override      :a1, 3d
    Sidebar component                :a2, 2d
    Header component                 :a3, 2d
    StatusBadge component            :a4, 1d
    DataTable + Pagination           :a5, 2d
    DashboardCard                    :a6, 1d
    TabBar + TabBadge                :a7, 1d
    Breadcrumb                       :a8, 0.5d
    ProgressBar                      :a9, 0.5d
    EmptyState                       :a10, 0.5d
```

#### Bước 1.1: Tạo CenterUp MUI Theme (đã làm 80%)
File: `src/themes/centerup-theme.tsx`  
✅ Đã có: palette, typography, shape, spacing  
✅ Đã có: styleOverrides cho Button, Table, Paper/Card, Tabs, Input, Select, Chip/Badge, Progress, Avatar, Dialog, Drawer  
❌ Cần thêm: styleOverrides cho TablePagination, TableSortLabel, Breadcrumbs chi tiết  
❌ Cần verify: MuiListItemText primary color = `#919EAB`

#### Bước 1.2: Xây dựng reusable Sidebar (KHÔNG phải file thừa trước đây)

Tạo sidebar CHUNG dùng được cho cả LCMS và CRM, với **props-based menu items**:

```tsx
// src/components/portal/centerup/Sidebar.tsx
interface SidebarProps {
  menuGroups: MenuGroup[];
  currentPath: string;
  onNavigate: (path: string) => void;
  // Bottom section
  centerName?: string;
  centerPlan?: string;
  userName?: string;
  userAvatar?: string;
}
```

Component này nhận menu items từ bên ngoài → LCMS và CRM truyền menu khác nhau, nhưng UI y hệt.

#### Bước 1.3: Xây Header chung

```tsx
// src/components/portal/centerup/Header.tsx
interface HeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  onSearch?: (query: string) => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  userName?: string;
}
```

#### Bước 1.4: Xây StatusBadge

```tsx
// src/components/ui/status-badge.tsx — CenterUp exact style
type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
// Dùng MUI Chip với các màu đã override style
<Chip label="Hoàn thành" color="success" size="small" />
```

#### Bước 1.5: Xây PageLayout chung

```tsx
// src/components/portal/centerup/PageLayout.tsx
// Kết hợp: Sidebar + Header + Content
<PageLayout menuGroups={lcmsMenuGroups}>
  <Outlet />
</PageLayout>
```

---

### Phase 2: LCMS Portal (Tuần 3-5)

#### Bước 2.1: Rebuild LCMS Shell

Tạo file `src/features/lcms/components/lcms-centerup-shell.tsx`:

```tsx
export default function LcmsCenterupShell() {
  return (
    <PageLayout
      menuGroups={LCMS_MENU_GROUPS}  // CenterUp-exact sidebar
      portalName="LCMS"
    >
      <LcmsContentRouter />  // Routing nội bộ
    </PageLayout>
  );
}
```

Menu LCMS (từ CenterUp, map đúng chức năng):

```
LCMS MENU (dựa trên CenterUp UI)
├── 📊 Tổng quan           → Dashboard
├── 📈 Báo cáo
│   ├── Tổng quan          → Report dashboard
│   ├── Học viên           → Student report
│   ├── Công việc           → Task report
│   └── Dòng tiền / Lãi lỗ → Finance report
├── 📚 Giảng dạy
│   ├── Học viên
│   │   ├── Tài khoản học viên
│   │   ├── Ghi danh trong khóa
│   │   ├── Ghi danh trong lớp
│   │   ├── Ghi danh trong buổi học
│   │   ├── Bài tập của học viên
│   │   └── Đơn xin nghỉ
│   ├── Khóa học
│   ├── Lớp học
│   ├── Buổi học
│   ├── Bài tập
│   └── NGÂN HÀNG BÀI TẬP & CÂU HỎI (giữ nguyên)
├── ⚙️ Quản lý
│   ├── Nhân sự
│   │   ├── Tài khoản nhân viên
│   │   ├── Lịch sử quét khuôn mặt
│   │   ├── Giáo viên tham gia buổi học
│   │   └── Đơn xin nghỉ
│   └── Tài chính
│       ├── Hóa đơn / Mua hàng / Thu chi / Hoàn phí / Giao dịch
├── 🔧 Hệ thống
│   ├── Thiết lập (Gói, Phân quyền, Khuyến mãi, CV, KH, Phòng, SK, Điểm, Thu chi)
│   └── Tích hợp (Tổng đài, Zalo, API key)
```

⚠️ **KHÔNG ĐỤNG VÀO:** Quiz Editor, Learning Resources Library

#### Bước 2.2: Từng Trang Cụ Thể

Mỗi trang trong LCMS đều theo pattern:

```
┌─────────────────────────────────────────────┐
│  PageLayout                                  │
│  ├── Sidebar (LCMS menu)                     │
│  ├── Header (search + notifications + user)  │
│  └── Content                                 │
│       ├── Breadcrumb                         │
│       ├── PageHeader (title + actions)        │
│       ├── FilterBar (optional)               │
│       ├── DataTable (TanStack Table v8)      │
│       └── Pagination                         │
└─────────────────────────────────────────────┘
```

**Các trang cần làm (theo thứ tự ưu tiên):**

| # | Trang | Loại | Độ phức tạp |
|---|-------|------|-------------|
| 1 | Dashboard LCMS | Widget cards + thống kê | Medium |
| 2 | Khóa học | DataTable list | Low |
| 3 | Lớp học | DataTable list | Low |
| 4 | Buổi học | DataTable list | Low |
| 5 | Bài tập | DataTable list + tabs | Medium |
| 6 | Báo cáo Tổng quan | Dashboard cards | Medium |
| 7 | Học viên (6 trang) | DataTable list | Medium |
| 8 | Nhân sự (4 trang) | DataTable list | Medium |
| 9 | Tài chính (7 trang) | DataTable list | Medium |
| 10 | Thiết lập (9 trang) | Forms + settings | Low-Medium |
| 11 | Tích hợp (3 trang) | Settings | Low |

#### DataTable Pattern (dùng cho hầu hết trang)

```tsx
// Mỗi trang list đều theo pattern này:
export function CourseListPage() {
  const { data, isLoading } = useQuery(...);
  
  const columns = useMemo(() => [
    { header: 'Tên khóa học', accessorKey: 'name' },
    { header: 'Mã', accessorKey: 'code' },
    { header: 'Trạng thái', cell: ({ row }) => <StatusBadge variant={...} /> },
    { header: 'Ngày tạo', accessorKey: 'createdAt' },
  ], []);

  return (
    <PageContent>
      <PageHeader title="Danh sách khóa học" />
      <MuiDataTable columns={columns} data={data} />
    </PageContent>
  );
}
```

**Cách dùng MUI Table với CenterUp style:**
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableCell sx={{ color: '#637381', fontWeight: 600, fontSize: 14, padding: '6px 16px', borderBottom: '1px dashed rgba(145,158,171,0.2)' }}>
        Tên khóa học
      </TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow hover>
      <TableCell sx={{ color: '#1C252E', fontSize: 14, padding: '6px 16px', borderBottom: '1px dashed rgba(145,158,171,0.2)' }}>
        IELTS 7.0
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Phase 3: CRM Portal (Tuần 5-6)

#### Bước 3.1: Rebuild CRM Shell

```tsx
// src/features/crm/components/crm-centerup-shell.tsx
export default function CrmCenterupShell() {
  return (
    <PageLayout
      menuGroups={CRM_MENU_GROUPS}
      portalName="CRM"
    >
      <CrmContentRouter />
    </PageLayout>
  );
}
```

Menu CRM (từ CenterUp, chỉ lấy phần CRM):

```
CRM MENU (dựa trên CenterUp)
├── 📊 Tổng quan CRM       → Dashboard CRM
├── 📈 Báo cáo
│   ├── Tổng quan          → Báo cáo doanh thu
│   ├── Tuyển sinh         → Pipeline bán hàng
│   └── Dòng tiền          → Cash flow
├── 👥 CRM & Hiệu suất
│   ├── Khách hàng
│   │   ├── Danh sách khách hàng
│   │   ├── Chat Zalo
│   │   └── Nhật ký cuộc gọi
│   └── Công việc          → Tasks
├── 🏫 Trường & Cơ hội
│   ├── Trường đã tư vấn
│   ├── Opportunity
│   └── P&L chốt trường
├── 📅 Lịch follow-up
├── 🤝 Bàn giao triển khai
├── ⚙️ Quản lý
│   └── Tài chính (Hóa đơn, Thu chi, Giao dịch)
└── 🔧 Hệ thống
    ├── Thiết lập
    └── Tích hợp
```

⚠️ **KHÔNG CÓ:** Học viên, Khóa học, Lớp học, Buổi học, Bài tập, Giảng dạy, Nhân sự (trừ tài chính)

#### Bước 3.2: CRM Pages

| # | Trang | Loại | Độ phức tạp |
|---|-------|------|-------------|
| 1 | Dashboard CRM | Widget cards + KPIs | Medium |
| 2 | Khách hàng | DataTable + search | Low |
| 3 | Chat Zalo | Chat UI | High (custom) |
| 4 | Nhật ký cuộc gọi | DataTable | Low |
| 5 | Trường đã tư vấn | DataTable + status | Medium |
| 6 | Opportunity | Kanban/DataTable | Medium |
| 7 | P&L | Calculator + table | High |
| 8 | Lịch follow-up | Calendar + tasks | Medium |
| 9 | Bàn giao | Checklist + status | Low |
| 10 | Tài chính | DataTable | Medium |
| 11 | Công việc | DataTable | Low |
| 12 | Thiết lập | Forms | Low |

---

### Phase 4: Shared Components (Tuần 6-7)

#### Bước 4.1: Shared Business Components

Các component dùng chung cho cả LCMS và CRM:

```tsx
// src/components/shared/DataTable.tsx
// MUI Table + TablePagination + TanStack Table v8
// Props: columns (TanStack), data, totalCount, page, pageSize, onPageChange

// src/components/shared/StatusBadge.tsx  
// MUI Chip với CenterUp colors
// Props: variant, label, size

// src/components/shared/SearchInput.tsx
// MUI TextField với CenterUp style

// src/components/shared/PageHeader.tsx
// Breadcrumb + Title + Action buttons

// src/components/shared/FilterBar.tsx
// Row of Select + Search + Date picker filters

// src/components/shared/DashboardWidget.tsx
// MUI Card với header + content + CenterUp style

// src/components/shared/TabPanel.tsx
// MUI Tabs với CenterUp style + badge counts

// src/components/shared/ConfirmDialog.tsx
// MUI Dialog với CenterUp style

// src/components/shared/EmptyState.tsx
// Icon + title + description

// src/components/shared/ProgressWithLabel.tsx
// MUI LinearProgress + label
```

#### Bước 4.2: MUI DataTable Wrapper

```tsx
// Dùng TanStack Table v8 để quản lý sorting/filtering
// Dùng MUI Table để render UI (CenterUp styled)

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableSortLabel } from '@mui/material';
import { flexRender, type Table as TanTable } from '@tanstack/react-table';

interface MuiDataTableProps<T> {
  table: TanTable<T>;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function MuiDataTable<T>({ table, totalCount, page, pageSize, onPageChange, onPageSizeChange }: MuiDataTableProps<T>) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(header => (
                <TableCell key={header.id} sortDirection={header.column.getIsSorted()}>
                  <TableSortLabel
                    active={!!header.column.getIsSorted()}
                    direction={header.column.getIsSorted() || 'asc'}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id} hover>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          rowsPerPage={pageSize}
          onPageChange={(_, p) => onPageChange(p)}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          labelRowsPerPage="Dòng/trang"
        />
      )}
    </TableContainer>
  );
}
```

---

## 4. Screen-by-Screen Spec: LCMS

### Màn hình Dashboard LCMS

CenterUp reference: Trang chủ có 3 widget columns:
1. **Công việc** (bên trái): Table tasks với tabs "Đến hạn" / "Quá hạn"
2. **Đơn xin nghỉ học viên** (giữa): Table đơn nghỉ
3. **Đơn xin nghỉ nhân viên** (giữa dưới): Table đơn nghỉ nhân viên
4. **Lịch dạy** (phải): Calendar mini

Implementation:
```tsx
<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 3 }}>
  {/* Cột 1: Công việc */}
  <DashboardCard title="Công việc" actions={<Tabs value={...}><Tab label="Đến hạn" /><Tab label="Quá hạn" /></Tabs>}>
    <DataTable columns={taskColumns} ... />
  </DashboardCard>

  {/* Cột 2: Đơn xin nghỉ */}
  <DashboardCard title="Đơn xin nghỉ học viên chờ duyệt" action={<Link>Xem tất cả</Link>}>
    <DataTable columns={absenceColumns} ... />
  </DashboardCard>

  {/* Cột 3: Lịch */}
  <DashboardCard title="Lịch dạy">
    <MiniCalendar />
  </DashboardCard>
</Box>
```

### Màn hình Danh sách Khóa học

```tsx
<PageContent>
  <Breadcrumb items={['Trang chủ', 'Giảng dạy', 'Khóa học']} />
  <PageHeader title="Khóa học" actions={<Button variant="contained">+ Tạo khóa học</Button>} />
  <FilterBar filters={[...]} />
  <MuiDataTable 
    columns={[
      { header: 'Tên khóa học', accessorKey: 'name' },
      { header: 'Mã', accessorKey: 'code' },
      { header: 'Trạng thái', cell: ({ row }) => <StatusBadge variant={row.status} /> },
      { header: 'Học viên', accessorKey: 'studentCount' },
      { header: 'Ngày tạo', accessorKey: 'createdAt' },
      { header: '', cell: ({ row }) => <MoreButton /> },
    ]} 
    data={courses}
  />
</PageContent>
```

Pattern tương tự cho: Lớp học, Buổi học, Bài tập, Học viên, Nhân sự, Tài chính...

---

## 5. Screen-by-Screen Spec: CRM

### Màn hình Dashboard CRM

```tsx
<PageContent>
  <Breadcrumb items={['CRM ERG', 'Tổng quan']} />
  <PageHeader title="Tổng quan CRM" />
  <Grid container spacing={3}>
    <Grid size={8}>
      <DashboardCard title="Pipeline">
        <PipelineChart />
      </DashboardCard>
    </Grid>
    <Grid size={4}>
      <DashboardCard title="Công việc cần xử lý">
        <DataTable ... />
      </DashboardCard>
    </Grid>
  </Grid>
</PageContent>
```

### Màn hình Danh sách Khách hàng

CenterUp reference: Table với columns: Học viên, Thông tin liên hệ, Lớp học, Thời gian nghỉ, Lý do, Phản hồi, Xem

CRM adaptation: columns phù hợp với CRM

---

## 6. Design Token Reference (EXACT pixel values)

Tất cả đã được extract từ CenterUp staging qua Playwright, xem file:
- `D:\ERG\erg-system\src\themes\centerup-theme.tsx` — MUI theme override
- `D:\ERG\centerup\UI-REFACTOR-MIGRATION-PLAN.md` — document chi tiết

### Color tokens — CenterUp EXACT

```ts
const CENTERUP = {
  primary:      '#696CFF',
  primaryHover: '#585BE0',
  primaryRing:  'rgba(105, 108, 255, 0.24)',
  sidebar:      '#1C252E',
  sidebarText:  '#919EAB',
  sidebarActive:'rgba(105, 108, 255, 0.08)',
  sidebarHover: 'rgba(255, 255, 255, 0.04)',
  text:         '#1C252E',
  textMuted:    '#637381',
  border:       'rgba(145, 158, 171, 0.2)',
  divider:      'rgba(145, 158, 171, 0.12)',
  destructive:  '#FF5630',
  success:      '#22C55E',
  warning:      '#FFAB00',
  info:         '#00B8D9',
  cardBorder:   'rgba(145, 158, 171, 0.12)',
  badgeSuccess: { bg: 'rgba(34, 197, 94, 0.12)', text: '#118D57' },
  badgeWarning: { bg: 'rgba(255, 171, 0, 0.16)', text: '#B76E00' },
  badgeDanger:  { bg: 'rgba(255, 86, 48, 0.12)', text: '#B71D18' },
  badgeInfo:    { bg: 'rgba(0, 184, 217, 0.12)', text: '#007A8C' },
  badgeNeutral: { bg: '#F4F6F8', text: '#637381' },
} as const;
```

### Typography scale

```ts
const FONTS = {
  family: '"Manrope Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  body1:  { size: 15, weight: 400, lineHeight: 1.5 },
  body2:  { size: 14, weight: 400, lineHeight: 1.4 },
  h5:     { size: 20, weight: 700, lineHeight: 1.4 },
  h6:     { size: 18, weight: 600, lineHeight: 1.45 },
  caption:{ size: 12, weight: 400, lineHeight: 1.5 },
  tab:    { size: 14, weight: 500 },
  button: { size: 14, weight: 600 },
  th:     { size: 14, weight: 600 },
  sidebarItem: { size: 15, weight: 400 },
  sidebarGroup:{ size: 12, weight: 700, uppercase: true },
} as const;
```

### Spacing scale (từ CenterUp)

```ts
const SPACING = {
  sidebarWidth: 280,
  headerHeight: 64,
  itemHeight: 44,
  tableCell: { x: 16, y: 6 },
  cardPadding: { x: 24, y: 20 },
  contentPadding: 24,
  buttonPadding: { x: 16, y: 6 },
  inputHeight: 40,
  inputPadding: { x: 12, y: 8 },
} as const;
```

---

## 7. Component Implementation Spec (code-level)

### Sidebar Component

```tsx
// src/components/portal/centerup/Sidebar.tsx
'use client';

import { useState } from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, Typography, Divider, Avatar, Button } from '@mui/material';
import { KeyboardArrowDown as ArrowIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from '@/routes/router-compat';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
  /** Nếu true, skip khi render */
  hideInPortal?: boolean;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface SidebarProps {
  menuGroups: MenuGroup[];
  /** Portal info */
  portalName?: string;
  centerName?: string;
  userName?: string;
  userAvatar?: string;
}

export default function Sidebar({ menuGroups, portalName = 'CenterUp', centerName, userName }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        '& .MuiDrawer-paper': { width: 280, bgcolor: '#1C252E', color: '#919EAB', border: 'none' }
      }}
    >
      {/* Logo + Plan */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography sx={{ color: '#FFF', fontWeight: 700, fontSize: 15 }}>{portalName}</Typography>
        <Typography sx={{ color: '#696CFF', fontSize: 11, fontWeight: 600 }}>ADVANCED</Typography>
      </Box>

      {/* Menu items (recursive) */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {menuGroups.map((group, gi) => (
          <Box key={gi}>
            {group.label && (
              <Typography sx={{ px: 1.5, py: 2, pb: 1, fontSize: 12, fontWeight: 700, color: '#919EAB', textTransform: 'uppercase' }}>
                {group.label}
              </Typography>
            )}
            <List disablePadding>
              {group.items.map((item, ii) => (
                <SidebarMenuItem key={ii} item={item} currentPath={currentPath} onNavigate={(p) => navigate(p)} />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom section */}
      <Divider sx={{ borderColor: 'rgba(145, 158, 171, 0.12)' }} />
      <Box sx={{ px: 2, py: 1.5 }}>
        {/* Center info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#696CFF' }}>C</Avatar>
          <Box>
            <Typography sx={{ color: '#FFF', fontSize: 13, fontWeight: 600 }}>{centerName || portalName}</Typography>
            <Typography sx={{ color: '#919EAB', fontSize: 12 }}>{userName || 'User'}</Typography>
          </Box>
        </Box>
        {/* Help link */}
        <ListItemButton sx={{ borderRadius: 1, minHeight: 36 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>?</ListItemIcon>
          <ListItemText primary="Trung tâm trợ giúp" primaryTypographyProps={{ sx: { fontSize: 13 } }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

function SidebarMenuItem({ item, depth = 0, currentPath, onNavigate }: { item: MenuItem; depth?: number; currentPath: string; onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children?.length;
  const isActive = item.path === currentPath;

  if (hasChildren) {
    return (
      <>
        <ListItemButton onClick={() => setOpen(!open)} selected={isActive} sx={{ pl: depth > 0 ? depth * 16 + 12 : '12px', minHeight: 44 }}>
          {item.icon && depth === 0 && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText primary={item.label} />
          <ArrowIcon sx={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: '0.2s', width: 16, height: 16 }} />
        </ListItemButton>
        <Collapse in={open} timeout={200}>
          <List disablePadding>
            {item.children!.map((child, i) => (
              <SidebarMenuItem key={i} item={child} depth={depth + 1} currentPath={currentPath} onNavigate={onNavigate} />
            ))}
          </List>
        </Collapse>
      </>
    );
  }

  return (
    <ListItemButton onClick={() => item.path && onNavigate(item.path)} selected={isActive} sx={{ pl: depth > 0 ? depth * 16 + 12 : '12px', minHeight: 44 }}>
      {item.icon && depth === 0 && <ListItemIcon>{item.icon}</ListItemIcon>}
      <ListItemText primary={item.label} />
    </ListItemButton>
  );
}
```

### PageHeader Component

```tsx
export function PageHeader({ title, actions, subtitle }: { title: string; actions?: ReactNode; subtitle?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle && <Typography variant="caption">{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
    </Box>
  );
}
```

### StatusBadge Component

```tsx
export function StatusBadge({ variant, label }: { variant: StatusVariant; label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        borderRadius: 1,
        fontSize: 13,
        fontWeight: 500,
        height: 'auto',
        px: 0.5,
        py: 0.5,
        bgcolor: CENTERUP[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`]?.bg || '#F4F6F8',
        color: CENTERUP[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`]?.text || '#637381',
      }}
    />
  );
}
```

---

## 8. Cấu Trúc File Target

```
src/
├── components/
│   ├── portal/
│   │   └── centerup/
│   │       ├── Sidebar.tsx        # Reusable sidebar
│   │       ├── PageLayout.tsx     # Sidebar + Header + Content container
│   │       ├── Header.tsx         # CenterUp header
│   │       └── PageContent.tsx    # Content wrapper with breadcrumb
│   ├── shared/
│   │   ├── DataTable.tsx          # MUI + TanStack Table wrapper
│   │   ├── StatusBadge.tsx        # CenterUp status chip
│   │   ├── PageHeader.tsx         # Title + actions
│   │   ├── FilterBar.tsx          # Filter row component
│   │   ├── DashboardCard.tsx      # Card widget
│   │   ├── SearchInput.tsx        # Search field
│   │   ├── EmptyState.tsx         # Empty state component
│   │   └── ConfirmDialog.tsx      # Confirm dialog
│   └── ui/                        # shadcn/ui (giữ cho elearning)
│       └── ...
├── features/
│   ├── lcms/
│   │   ├── lcms-centerup-shell.tsx   # LCMS CenterUp shell
│   │   ├── lcms-menu.ts              # LCMS menu config
│   │   ├── pages/                    # LCMS pages (CenterUp style)
│   │   │   ├── lcms-dashboard.tsx
│   │   │   ├── course-list.tsx
│   │   │   ├── class-list.tsx
│   │   │   ├── session-list.tsx
│   │   │   ├── assignment-list.tsx
│   │   │   ├── student/ (6 pages)
│   │   │   ├── hr/ (4 pages)
│   │   │   ├── finance/ (7 pages)
│   │   │   ├── settings/ (9 pages)
│   │   │   └── integration/ (3 pages)
│   │   └── ... (giữ nguyên api, hooks, types, infrastructure)
│   ├── crm/
│   │   ├── crm-centerup-shell.tsx    # CRM CenterUp shell
│   │   ├── crm-menu.ts               # CRM menu config
│   │   └── pages/
│   │       ├── crm-dashboard.tsx
│   │       ├── customer-list.tsx
│   │       ├── zalo-chat.tsx
│   │       ├── call-history.tsx
│   │       ├── schools.tsx
│   │       ├── opportunities.tsx
│   │       └── ...
│   └── ... (giữ nguyên)
├── themes/
│   ├── centerup-theme.tsx         # MUI theme (đã có)
│   └── MuiCenterupProvider.tsx     # MUI provider (đã có)
└── styles/
    ├── globals.css                # (giữ nguyên)
    └── theme.css                  # (giữ nguyên)
```

---

## 9. Non-Negotiable Rules

```
╔══════════════════════════════════════════════════════════════╗
║                   LUẬT BẤT DI BẤT DỊCH                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. MÀU SẮC:                                                ║
║     - Primary: #696CFF (PURPLE) — KHÔNG phải blue           ║
║     - Sidebar: #1C252E (dark)                               ║
║     - Sidebar text: #919EAB                                  ║
║     - Border: rgba(145, 158, 171, 0.2) dashed                ║
║     - Divider: rgba(145, 158, 171, 0.12) solid               ║
║                                                              ║
║  2. TYPOGRAPHY:                                              ║
║     - Font: "Manrope Variable"                               ║
║     - Table header: 14px/600                                 ║
║     - Table cell: 14px/400                                   ║
║     - Sidebar item: 15px/400                                 ║
║     - Sidebar group: 12px/700 uppercase                      ║
║                                                              ║
║  3. KÍCH THƯỚC:                                              ║
║     - Sidebar: 280px                                          ║
║     - Sidebar item height: 44px                               ║
║     - Table cell padding: 6px 16px                            ║
║     - Input height: 40px                                      ║
║     - Button height: 36px (small: 30px, large: 44px)          ║
║     - Card padding: 20px 24px                                 ║
║     - Border radius: 8px                                      ║
║                                                              ║
║  4. COMPONENT:                                               ║
║     - Dùng MUI components với styleOverrides                  ║
║     - KHÔNG dùng shadcn/ui cho LCMS/CRM                      ║
║     - KHÔNG dùng CSS thuần nếu đã có MUI component            ║
║     - KHÔNG đụng quiz-editor, learning-resources              ║
║                                                              ║
║  5. VERIFY:                                                  ║
║     - Dùng Playwright đo computed style từ CenterUp staging  ║
║     - So sánh pixel-to-pixel với ảnh đã chụp                 ║
║     - Mỗi component xong phải snapshot test                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 10. Timeline

```
WEEK 1-2  ─── COMPONENT LIBRARY
  │  Day 1-2:   Theme + MUI overrides verify (sidebar text fix)
  │  Day 3-4:   Sidebar + Header + PageLayout components
  │  Day 5-6:   Shared components (DataTable, StatusBadge, PageHeader, FilterBar, DashboardCard)
  │  Day 7:     Verify với Playwright — so sánh pixel với CenterUp
  │
WEEK 3-4  ─── LCMS PAGES (PHASE 1)
  │  Day 8-10:  Khoá học + Lớp học + Buổi học + Bài tập pages
  │  Day 11-13: Học viên (6 pages)
  │  Day 14:    Verify
  │
WEEK 5  ─── LCMS PAGES (PHASE 2)
  │  Day 15-16: Nhân sự (4 pages)
  │  Day 17-19: Tài chính (7 pages)
  │  Day 20:    Thiết lập + Tích hợp
  │
WEEK 6  ─── CRM PAGES
  │  Day 21-23: Dashboard + Khách hàng + Chat Zalo + Nhật ký cuộc gọi
  │  Day 24-26: Trường + Opportunity + P&L + Follow-up + Bàn giao
  │  Day 27:    Tài chính + Thiết lập (CRM)
  │
WEEK 7  ─── FINAL VERIFY
  │  Day 28-30: Playwright verify pixel-perfect với CenterUp staging
  │  Day 31-32: Fix all pixel mismatches
  │  Day 33:    LCMS và CRM chạy song song, verify chức năng
  │  Day 34-35: Performance check (3G), bundle size audit
```

---

## 📎 Tài liệu tham khảo

| File | Mô tả |
|------|-------|
| `D:\ERG\erg-system\src\themes\centerup-theme.tsx` | MUI theme exact CenterUp |
| `D:\ERG\erg-system\src\themes\MuiCenterupProvider.tsx` | MUI portal provider |
| `D:\ERG\centerup\UI-REFACTOR-MIGRATION-PLAN.md` | Migration plan tổng thể |
| `D:\ERG\centerup\centerup-verify-*.png` | 52 ảnh chụp CenterUp staging |
| `D:\ERG\erg-system\.agents\skills\centerup-ui-design\SKILL.md` | Design skill file |

---

## ⚠️ Rủi Ro & Mitigation

| Rủi ro | Mitigation |
|--------|------------|
| MUI v9 breaking changes | Lock version, test kỹ styleOverrides |
| LCMS routing phức tạp | Từ từ migrate, giữ shell cũ song song |
| Mất chức năng khi đổi UI | Test coverage, strangler pattern |
| Quiz editor bị ảnh hưởng | KHÔNG ĐỤNG — cách ly hoàn toàn |
| Learning resources bị ảnh hưởng | Giữ nguyên file, chỉ wrap layout |
