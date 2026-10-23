# Quy trình hợp đồng API REST

## Nguồn sự thật

`erg-spring/contracts/openapi/erg-openapi.json` là snapshot OpenAPI đã chuẩn hóa và commit. Frontend copy snapshot vào `contracts/backend/`, ghi checksum trong `erg-openapi.lock.json`, rồi sinh `src/lib/api/generated/erg-openapi.ts`. Không sửa file generated thủ công.

## Khi BE thay đổi

- Thêm field tương thích: cập nhật DTO/controller, xuất snapshot mới, chạy `bun run contract:rest:sync` rồi commit cả contract, lock và generated type.
- Đổi tên, xóa field, đổi kiểu hoặc đổi endpoint: coi là breaking change; thêm mapper/compatibility trước, migrate FE, theo dõi deprecation, sau đó mới xóa.
- Chạy `bun run contract:rest:check` để phát hiện snapshot/lock/generated bị lệch.

## Kiểm tra trước merge

```powershell
bun run contract:rest:sync
bun run contract:rest:check
bun run verify:api-contract
```

Route mới phải được khai báo trong `API_ENDPOINTS` và dùng `ContractPath`; không rải chuỗi endpoint trong component. Domain client phải khai báo portal và `auth` rõ ràng.

## Registry endpoint duy nhất

Mọi REST path BE nằm tại `src/lib/api/api-endpoints.ts` trong object `API_ENDPOINTS`. Endpoint động phải encode từng segment trong registry; caller không tự nối ID. Chạy `bun run endpoint:check` để phát hiện endpoint literal nằm ngoài registry.

Khi endpoint đổi, sửa entry trong `API_ENDPOINTS`, sync OpenAPI và chạy `bun run verify:api-contract`. Không tạo route file riêng theo feature và không thêm nhánh legacy ngoài registry.

## Chính sách cache

- `realtime`: notification, progress, security feed; cache ngắn và không persist.
- `transactional`: employee, assignment, calendar; cache trung bình và invalidate đúng entity.
- `reference`: role, permission, school/curriculum catalog; cache dài hơn.
- `offlineCore`: homework, scores và dữ liệu học tập cốt lõi; persist IndexedDB theo portal/tenant/account.
- `sensitive`: auth/security; không persist và không retry lỗi 4xx.

Logout, đổi account hoặc đổi tenant phải xóa memory cache và persisted scope cũ. Mutation chỉ invalidate query key nhỏ nhất có liên quan; ưu tiên `setQueryData` khi response chứa entity hoàn chỉnh.
