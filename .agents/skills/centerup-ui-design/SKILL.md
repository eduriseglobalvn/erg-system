---
name: centerup-ui-design
description: CenterUp EXACT pixel-perfect UI design system. Primary #696CFF (PURPLE). Font Manrope. Dark sidebar #1C252E. Extracted from CenterUp staging via Playwright pixel-measurement.
---

# CenterUp Exact UI Design System — Pixel-Perfect Spec

> **⚠️ CẢNH BÁO:** CenterUp primary là **#696CFF (PURPLE)**, KHÔNG phải xanh dương.
> Font là **Manrope Variable**, KHÔNG phải Public Sans hay Inter.
> Tất cả CSS classes đều dùng prefix `.centerup-*` (xem `src/styles/globals.css`).
> KHÔNG dùng Tailwind utility classes mặc định cho các component chính.

---

## 🔴 EXACT PIXEL DATA (Extracted from CenterUp staging 2026-06-11)

### Màu sắc
```css
--primary:      #696CFF        /* Purple - chính xác */
--primary-hover:#585BE0
--primary-ring: rgba(105, 108, 255, 0.24)

--bg:           #FFFFFF
--text:         #1C252E         /* Xám đậm */
--text-muted:   #637381         /* Xám giữa */
--text-nav:     #919EAB         /* Xám nhạt (sidebar text) */

--sidebar-bg:   #1C252E         /* Dark sidebar */

--border:       rgba(145, 158, 171, 0.2)    /* Dashed border */
--divider:      rgba(145, 158, 171, 0.12)   /* Solid divider */

--destructive:  #FF5630         /* Đỏ cam */
--success:      #22C55E
--warning:      #FFAB00

--badge-success-bg:  rgba(34, 197, 94, 0.12)
--badge-warning-bg:  rgba(255, 171, 0, 0.16)
--badge-danger-bg:   rgba(255, 86, 48, 0.12)
--badge-info-bg:     rgba(0, 184, 217, 0.12)
```

### Typography
```css
--font:         "Manrope Variable", -apple-system, BlinkMacSystemFont, sans-serif

/* Scale */
body:           15px / 1.5 / 400    /* Regular body */
h5:             20px / 1.4 / 700    /* Card title */
h6:             18px / 1.45 / 600   /* Section title */
body2:          14px / 1.4 / 400    /* Table cells */
caption:        12px / 1.5 / 400    /* Small labels */
table-header:   14px / 600          /* Table th */
tab:            14px / 500          /* Tab label */
```

### Kích thước chính xác
```css
/* Sidebar */
--sidebar-width:              280px
--sidebar-item-height:        44px
--sidebar-item-padding:       4px 8px 4px 12px
--sidebar-item-radius:        8px
--sidebar-group-padding:      16px 8px 8px 12px
--sidebar-group-size:         12px / 700 / uppercase
--nav-font-size:              15px

/* Header */
--header-height:              64px
--header-padding:             0 24px

/* Table */
--table-cell-padding:         6px 16px
--table-cell-size:            14px
--table-border:               1px dashed rgba(145, 158, 171, 0.2)
--table-header-weight:        600

/* Card */
--card-padding:               20px 24px
--card-radius:                8px
--card-border:                1px solid rgba(145, 158, 171, 0.12)

/* Tabs */
--tab-padding:                8px 24px
--tab-size:                   14px
--tab-weight:                 500
--tab-active-weight:          600
--tab-indicator:              2px solid #696CFF

/* Input */
--input-height:               40px
--input-padding:              8px 12px
--input-radius:               8px
--input-border:               1px solid rgba(145, 158, 171, 0.2)

/* Button */
--button-height:              36px
--button-padding:             6px 16px
--button-radius:              8px
--button-size:                14px
--button-weight:              600

/* Badge */
--badge-padding:              4px 10px
--badge-radius:               6px
--badge-size:                 13px
--badge-weight:               500

/* Checkbox */
--checkbox-size:              18px
--checkbox-radius:            4px

/* Progress */
--progress-height:            10px
--progress-radius:            40px
```

---

## 📁 CÁCH DÙNG

### Import CSS classes (dùng `.centerup-*` thay vì tailwind)
```tsx
// KHÔNG dùng Tailwind cho component chính
// DÙNG các class .centerup-* đã define trong globals.css

// Sidebar
<div className="centerup-sidebar">
  <div className="centerup-sidebar-group">Giảng dạy</div>
  <a className="centerup-sidebar-item active" href="/courses">
    <span className="centerup-sidebar-icon"><BookOpen /></span>
    <span>Khóa học</span>
  </a>
</div>

// Button
<button className="centerup-btn primary">Xem tất cả</button>
<button className="centerup-btn outline">Hủy</button>
<button className="centerup-btn ghost">Sửa</button>

// Table
<table className="centerup-table w-full">
  <thead><tr><th>Tên công việc</th><th>Trạng thái</th></tr></thead>
  <tbody><tr><td>...</td><td>...</td></tr></tbody>
</table>

// Badge
<span className="centerup-badge success">Hoàn thành</span>
<span className="centerup-badge warning">Chờ duyệt</span>
<span className="centerup-badge danger">Quá hạn</span>
<span className="centerup-badge info">Mới</span>

// Card
<div className="centerup-card">
  <div className="centerup-card-header">
    <h6>Công việc</h6>
    <button className="centerup-btn ghost small">Xem tất cả →</button>
  </div>
  <div className="centerup-card-separator" />
  {/* content */}
</div>

// Input
<input className="centerup-input" placeholder="Tìm kiếm..." />

// Tab bar
<div>
  <button className="centerup-tab active">Tất cả <span className="centerup-tab-badge">307</span></button>
  <button className="centerup-tab">Chưa bắt đầu <span className="centerup-tab-badge">11</span></button>
</div>

// Breadcrumb
<nav className="centerup-breadcrumb">
  <a href="/">Trang chủ</a>
  <ChevronRight className="sep" />
  <span className="active">Danh sách công việc</span>
</nav>

// Checkbox
<input type="checkbox" className="centerup-checkbox" />

// Progress
<div className="centerup-progress">
  <div className="centerup-progress-fill" style={{ width: '60%' }} />
</div>
```

---

## 🎯 LAYOUT TEMPLATE (CenterUp exact)

```tsx
<div className="flex min-h-screen">
  {/* Sidebar - 280px, dark bg */}
  <aside className="centerup-sidebar fixed left-0 top-0 h-screen z-30">
    {/* Logo */}
    {/* Menu groups */}
    {/* Bottom info */}
  </aside>

  {/* Main - margin-left: 280px */}
  <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
    {/* Header - 64px */}
    <header className="centerup-header sticky top-0 z-20">
      <div className="centerup-header-left">
        {/* Breadcrumb or title */}
      </div>
      <div className="centerup-header-right">
        {/* Notifications, settings, avatar */}
      </div>
    </header>

    {/* Content */}
    <main className="flex-1 p-6">
      {/* Page content here */}
    </main>
  </div>
</div>
```

---

## ✅ CHECKLIST (trước khi output)

- [ ] Dùng `.centerup-*` classes? KHÔNG dùng tailwind utility classes cho component chính
- [ ] Màu primary #696CFF? KHÔNG dùng blue (#0f6cbd)
- [ ] Font Manrope? KHÔNG dùng Inter hay Public Sans
- [ ] Sidebar #1C252E dark? KHÔNG dùng slate-900
- [ ] Border dashed rgba(145,158,171,0.2)? KHÔNG dùng solid border-gray-200
- [ ] Table cell padding 6px 16px? KHÔNG dùng p-4
- [ ] Card padding 20px 24px? KHÔNG dùng p-6
- [ ] Button height 36px radius 8px weight 600? KHÔNG dùng h-10
- [ ] Badge pill shape padding 4px 10px? KHÔNG dùng rounded-full px-3
- [ ] Input height 40px border-radius 8px? KHÔNG dùng h-10 rounded-md
- [ ] Tab padding 8px 24px font-size 14px? KHÔNG dùng px-4 py-2
- [ ] Header height 64px? KHÔNG dùng h-16
- [ ] Sidebar item height 44px? KHÔNG dùng h-11
- [ ] Checkbox 18x18 border-radius 4px? KHÔNG dùng w-4 h-4
- [ ] Progress height 10px border-radius 40px? KHÔNG dùng h-2
- [ ] KHÔNG dùng MUI? KHÔNG import @mui/* nào
- [ ] KHÔNG dùng dashboard-kit? Đã xóa
- [ ] KHÔNG dùng react-router-dom? Dùng TanStack Router
