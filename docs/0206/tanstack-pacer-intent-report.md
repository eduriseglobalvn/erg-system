# Báo cáo quét source và áp dụng TanStack Pacer + TanStack Intent

Ngày thực hiện: 2026-06-03  
Nhánh: `codex/tanstack-shadcn-0206-plan`

## Mục tiêu

Quét toàn bộ source hiện tại, xác định các điểm đang xử lý tương tác/tìm kiếm/timing bằng state update trực tiếp hoặc timer thủ công, sau đó áp dụng:

- TanStack Pacer cho debounce, delayed intent, state batching và các UI timing phù hợp.
- TanStack Intent theo đúng nghĩa hiện tại của hệ TanStack: cài mapping `@tanstack/intent` vào repo và bật Router preload theo `intent` cho navigation.

## Kết quả quét

Source đã có một lớp Pacer trước đó:

- `src/hooks/use-debounced-value.ts` dùng `Debouncer`.
- `src/hooks/use-paced-state-batch.ts` dùng `Batcher`.
- Nhiều màn lớn đã dùng debounce/virtual/state batch: LMS attendance, score, class list, class students, LCMS user access, LCMS authoring, CRM SEO, question bank, learning resource library.

Các điểm còn cần bổ sung:

- Router chưa bật `defaultPreload: "intent"`.
- Link compatibility adapter chưa preload theo intent.
- Social reaction picker còn dùng `setTimeout` thủ công để đóng picker theo hover intent.
- Public disclosure search còn filter trực tiếp theo từng ký tự.
- Quiz editor search còn filter trực tiếp theo từng ký tự.
- LMS score classification dropdown còn filter trực tiếp theo từng ký tự.
- Dashboard scope sync còn debounce bằng timer ref thủ công.
- LCMS education-unit fetch còn debounce bằng `setTimeout`.
- Student sheet auto-load còn debounce URL bằng `setTimeout`.
- Student dashboard còn dùng timer cho auto-close popup và delayed scroll sau navigation nội bộ.
- Quiz player còn dùng `queueMicrotask` cho reset state khi load attempt.

## Thay đổi đã áp dụng

### TanStack Intent

- Chạy `bunx @tanstack/intent@latest install --map`.
- `AGENTS.md` đã được thêm block `intent-skills` với 13 mapping từ TanStack, gồm Router core, navigation, data-loading, auth guards, search params, type safety, SSR và devtools event client.
- Đã load skill `@tanstack/router-core#router-core/navigation` để áp dụng đúng guidance navigation/preloading.
- Bật Router preload theo intent trong `src/routes/app-routes.tsx`:
  - `defaultPreload: "intent"`
  - `defaultPreloadDelay: 75`
  - `defaultPreloadStaleTime: 0`
- Cập nhật `src/routes/router-compat.tsx` để các `<Link>` qua compatibility layer mặc định dùng:
  - `preload="intent"`
  - `preloadDelay={75}`

Ghi chú: `@tanstack/intent` là CLI/Agent Skills, không phải runtime React package để import vào component. Phần runtime của “intent” trong app là TanStack Router preload theo intent.

### TanStack Pacer

- Thêm `src/hooks/use-paced-callback.ts`:
  - `useDebouncedCallback`
  - `useThrottledCallback`
- Chuyển social reaction hover-close từ `setTimeout` thủ công sang `useDebouncedCallback`.
- Chuyển dashboard scope sync debounce sang `useDebouncedCallback`.
- Chuyển public disclosure search sang `useDebouncedValue`.
- Chuyển quiz editor search sang `useDebouncedValue`.
- Chuyển score classification dropdown search sang `useDebouncedValue`.
- Chuyển LCMS education-unit fetch debounce sang `useDebouncedValue`.
- Chuyển student sheet auto-load debounce sang `useDebouncedCallback`.
- Chuyển student dashboard:
  - Auto close announcement popup sang `useDebouncedCallback`.
  - Delayed scroll tới announcement sang `useDebouncedCallback`.
  - Delayed scroll tới discussion post sang `useDebouncedCallback`.
- Chuyển quiz player reset state từ `queueMicrotask` sang `usePacedStateBatch`.

## Các timer còn lại có chủ đích

Sau pass này vẫn còn một số timer không nên đổi sang Pacer vì chúng không phải UI debounce/intent:

- `setInterval` trong quiz player để đếm ngược thời gian làm bài.
- `requestAnimationFrame` và `setTimeout` trong weekly class log mention insertion để phục hồi focus/caret/resize textarea sau khi chèn mention.
- Network timeout trong Google Identity, teacher resource dashboard và Google Sheet JSONP loader để reject request quá lâu.
- `prefetchQuery` trong learning resource catalog là prefetch dữ liệu chủ động của TanStack Query; Router intent preload đã được bật riêng cho navigation.

## Kiểm chứng đã chạy

```powershell
bun run typecheck
bun run test
bun run build
```

Kết quả:

- TypeScript compile thành công với `tsc -b`.
- Test suite thành công: 32 test files passed, 84 tests passed.
- Production build thành công. Vite chỉ cảnh báo chunk size lớn và plugin timing của `local-mui-icon-shim`, không có lỗi build.

## Ghi chú vận hành

- Khi làm việc tiếp với Router, nên dùng `bunx @tanstack/intent@latest load <use>` theo mapping trong `AGENTS.md` trước khi sửa các phần route/navigation/search.
- Với các interaction timing mới, ưu tiên dùng `useDebouncedValue`, `useDebouncedCallback`, `useThrottledCallback` hoặc `usePacedStateBatch` thay vì tự tạo `setTimeout`/`requestAnimationFrame`, trừ trường hợp đó là timeout nghiệp vụ thật sự.
