# ERG System - ERG EduRise Global Frontend

> **Tech Stack:** React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 + shadcn/ui + TanStack (Router, Query, Table, Form, Store)
> **Design Inspiration:** CenterUp - SaaS ERP cho trung tâm giáo dục

---

## 🎯 Core Rules

### UI Stack (ĐÃ CHỌN, KHÔNG THAY ĐỔI)
- ✅ **shadcn/ui** + **Radix Primitives** — UI component library (MIT, fork-friendly)
- ✅ **Tailwind CSS v4** — CSS-first styling
- ✅ **lucide-react** — Icons (duy nhất, không mix với icon lib khác)
- ✅ **TanStack Router** — Routing (type-safe, KHÔNG dùng react-router-dom)
- ✅ **TanStack Query v5** — Data fetching
- ✅ **TanStack Table v8** — Bảng dữ liệu
- ✅ **TanStack React Form v1** — Forms
- ✅ **@dnd-kit** — Drag & drop
- ✅ **FullCalendar 6** — Lịch
- ✅ **sonner** — Toast notifications
- ✅ **vite-plugin-pwa** — PWA

### 🚫 ĐÃ LOẠI BỎ (KHÔNG ĐƯỢC DÙNG LẠI)
- ❌ **MUI** (Material UI) — Hoàn toàn loại bỏ, không import @mui/*
- ❌ **dashboard-kit.tsx** — Đã xóa, dùng shadcn/ui thay thế
- ❌ **lms-kit.tsx** — Đã xóa
- ❌ **Next-Themes** — Không dùng, theme bằng CSS variables
- ❌ **react-router-dom** — Không dùng, dùng TanStack Router

### Design System: CenterUp EXACT (extracted via Playwright pixel-measurement)
- **Primary:** #696CFF (PURPLE) — KHÔNG phải blue
- **Typography:** Manrope Variable (body/sans), JetBrains Mono (mono) — KHÔNG dùng Public Sans
- **Sidebar:** Dark theme (#1C252E), 280px width, 5 nhóm menu
- **Bảng:** Header bg neutral-50, cell padding 12px 16px, border neutral-200
- **Button:** border-radius sm (6px), shadow-sm, hover: translate-y-[-1px]
- **Badge:** Pill shape, 4 status colors (success/warning/danger/info)
- **Card:** shadow-card (0 1px 3px), border neutral-200, p-6, radius-md (8px)

---

## 📁 Architecture Rules

1. **Feature-first** — Business logic trong `features/<feature>/`
2. **Pages mỏng** — Pages chỉ là wrapper, compose từ feature components
3. **Shell components** — KHÔNG viết shell > 200 dòng, tách thành sub-components
4. **Route type-safe** — Dùng TanStack Router tree, KHÔNG if/else chain
5. **Shared UI** — `src/components/ui/` cho shadcn/ui components
6. **Portal UI** — `src/components/portal/` cho sidebar-layout, header, sidebar

---

## 📱 PWA & Desktop Priority

1. **Offline-first** — TanStack Query persist + IndexedDB
2. **3G tối ưu** — Code-split, skeleton screens, stale-while-revalidate
3. **Responsive** — Mobile-first, bottom nav cho mobile
4. **Desktop** — Tauri v2 (5MB, Rust backend) cho portable quiz
