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

Route mới phải được khai báo trong route builder và dùng `ContractPath`; không rải chuỗi endpoint trong component. Domain client phải khai báo portal và `auth` rõ ràng.
