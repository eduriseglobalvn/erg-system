# Thiết kế quản trị hợp đồng API ERG

> Status: completed — canonical implementation evidence is tracked in `D:/ERG/TASK/ERG_Task_Management_.xlsx` and the paired plan when present.

**Mục tiêu:** Biến mọi thay đổi hợp đồng REST và GraphQL trong `erg-spring` thành thay đổi tường minh, tái lập được và dễ sử dụng trong `erg-system`, đồng thời chặn các thay đổi phá vỡ tương thích tại CI trước khi chúng đi vào runtime.

## Phạm vi

- `D:/ERG/erg-spring` là nguồn sự thật duy nhất cho OpenAPI của REST và schema của GraphQL.
- `D:/ERG/erg-system` sử dụng các kiểu dữ liệu được sinh tự động từ hợp đồng, nhưng vẫn giữ API adapter và domain model cục bộ theo từng feature.
- Lát cắt triển khai đầu tiên thiết lập việc xuất hợp đồng có tính quyết định, phát hiện breaking change, sinh mã phía frontend và chuyển đổi một luồng dọc hoàn chỉnh.
- Công việc này không thay đổi hành vi endpoint hiện tại, ngữ nghĩa xác thực hay giao diện matching question đã khóa.

## Hiện trạng và rủi ro

- Springdoc đã cung cấp `/v3/api-docs`, nhưng file `src/main/resources/api-export/erg-openapi.json` từng được commit hiện đang bị xóa trong working tree của backend.
- Snapshot backend gần nhất có 424 REST path, 515 operation và 113 component schema.
- Controller có 329 mapping annotation nhưng không có `@Operation` tường minh. Vì vậy Springdoc tự suy ra operation ID từ tên method Java và thêm hậu tố như `_1`; một refactor Java không làm đổi HTTP contract vẫn có thể khiến tên operation được sinh thay đổi hàng loạt.
- Có 91 object schema trong snapshot gần nhất không khai báo danh sách `required`. TypeScript được sinh từ đó sẽ coi nhiều field hợp đồng là optional và bỏ sót các thay đổi quan trọng từ backend.
- Có 39 schema dạng `ApiResponse...`. Một số payload vẫn dùng `Object` hoặc `Map<String, Object>`, làm giảm giá trị của việc sinh kiểu dữ liệu.
- REST đang tồn tại đồng thời các bề mặt `/api/v1/...` và `/api/...` không có version. Frontend có 151 lần tham chiếu endpoint production trong 24 file.
- `apiRequest<T>` phía frontend chỉ ép kết quả parse JSON thành `T`; nó không chứng minh response thực tế khớp với hợp đồng backend.
- Việc chọn auth/portal phía frontend một phần được suy ra từ chuỗi endpoint. Vì vậy việc chuyển endpoint có thể vô tình làm thay đổi cả routing lẫn cơ chế xác thực.
- GraphQL có server schema được commit, nhưng kiểu result và variable của operation phía frontend đang được viết thủ công.
- Fallback offline/mock ở một số luồng bắt lỗi quá rộng và có thể che giấu lỗi hợp đồng hoặc lỗi phân quyền từ backend.

## Phương án được chọn

Áp dụng quy trình contract-first nghiêm ngặt:

1. Tài liệu OpenAPI được sinh có tính quyết định bởi Springdoc và GraphQL schema đã commit là nguồn hợp đồng của backend.
2. CI từ chối breaking change của REST hoặc GraphQL, trừ khi API được tăng version hoặc có giai đoạn tương thích được khai báo rõ ràng.
3. Frontend sinh kiểu REST dựa trên path/method thay vì sinh function dựa trên operation ID chưa ổn định.
4. DTO được sinh tự động chỉ tồn tại tới biên API của feature. Component và business logic sử dụng domain model ổn định thông qua mapper tường minh.
5. Runtime validation được bổ sung trước cho các operation rủi ro cao; kiểu dữ liệu sinh ở compile-time là hàng rào cơ sở áp dụng cho toàn bộ API.

Cách này tránh tạo một endpoint registry toàn cục viết tay và tránh gắn application code trực tiếp với DTO của transport được sinh tự động.

## Chính sách thay đổi hợp đồng

| Thay đổi phía backend | Kết quả CI | Cách phát hành bắt buộc |
| --- | --- | --- |
| Thêm response field optional | Cho phép | Sinh lại contract; feature không cần đổi nếu chưa sử dụng field |
| Thêm request field optional | Cho phép | Sinh lại contract; sử dụng khi cần |
| Xóa hoặc đổi tên response field | Thất bại | Thêm field thay thế, giữ field cũ trong giai đoạn tương thích, chuyển FE, sau đó mới xóa ở API version tiếp theo |
| Đổi type hoặc nullability của response theo hướng không tương thích | Thất bại | Thêm field mới hoặc schema có version rồi chuyển mapper |
| Thêm request field bắt buộc | Thất bại | Ban đầu phải để optional/có default hoặc tạo operation có version mới |
| Xóa/đổi HTTP method hoặc endpoint path | Thất bại | Thêm endpoint mới, giữ alias cũ ở trạng thái deprecated, chuyển FE rồi mới xóa ở version tiếp theo |
| Thêm enum member | Cảnh báo đối với mapping exhaustive phía FE | Sinh lại contract và bắt buộc domain mapping có nhánh `unknown`/mặc định |
| Xóa enum member | Thất bại nếu đang được tham chiếu | Duy trì tương thích hoặc chuyển qua version mới |
| Đổi yêu cầu auth/security | Thất bại | Bắt buộc security review và phát hành phối hợp |

Không được chuyển endpoint theo kiểu thay thế tức thời. Trình tự an toàn là **thêm endpoint mới → đánh dấu endpoint cũ deprecated → chuyển consumer → theo dõi → xóa ở version tiếp theo**.

## Thiết kế backend (`erg-spring`)

### Snapshot OpenAPI có tính quyết định

- Xuất tài liệu OpenAPI JSON đã chuẩn hóa vào thư mục hợp đồng ở cấp repository thay vì đóng gói artifact runtime được sinh vào `src/main/resources`.
- Sắp xếp object key và loại bỏ server URL phụ thuộc môi trường trước khi so sánh để cùng một hợp đồng luôn tạo ra cùng một file.
- Cung cấp một command duy nhất để chạy/test ứng dụng Spring, lấy `/v3/api-docs`, chuẩn hóa và ghi snapshot.
- Cung cấp command kiểm tra để sinh lại trong bộ nhớ và báo lỗi nếu snapshot đã commit không còn đồng bộ.

### Cổng chặn breaking change

- So sánh contract mới được sinh với contract tại merge base.
- Thất bại khi path/method bị xóa, parameter/request thay đổi không tương thích, response/schema thay đổi không tương thích hoặc security requirement bị đổi.
- Việc thêm field optional vẫn được xem là tương thích.
- Kết quả kiểm tra phải chỉ rõ path, method, schema và field để developer biết chính xác frontend adapter nào bị ảnh hưởng.

### Chất lượng schema

- Request sử dụng record cụ thể cùng Bean Validation để Springdoc sinh đúng requiredness.
- Response khai báo rõ nullability và các field bắt buộc; không trả persistence entity trực tiếp.
- Thay `Object`/`Map<String, Object>` bằng DTO có tên khi cấu trúc dữ liệu ổn định. Metadata thực sự tự do vẫn được giữ dưới dạng free-form object nhưng phải được mô tả rõ.
- Giữ response envelope dùng chung ổn định và mô tả đầy đủ `statusCode`, `message`, `data`, `errors`, `timestamp`, `path` và `request_id` trong OpenAPI.
- Không bắt buộc thêm `@Operation(operationId=...)` cho toàn bộ controller trong lát cắt đầu tiên. FE sử dụng kiểu dựa trên path/method. Chỉ thêm ID tường minh, ổn định cho các endpoint đang được sử dụng khi cần sinh operation artifact có tên.

### Versioning REST

- Không cho phép thêm endpoint `/api/...` không có version.
- Mọi REST endpoint mới dùng quy ước `/api/v1/{bounded-context}/{resource}`.
- Các endpoint curriculum/content không có version hiện tại phải có bản đồ chuyển đổi và thời hạn tương thích; không đổi tên hàng loạt trong lát cắt nền tảng.

## Thiết kế frontend (`erg-system`)

### Lớp hợp đồng được sinh tự động

Tạo lớp hợp đồng chỉ đọc dưới `src/lib/api/generated/`. Lớp này chứa kiểu path, operation, request, response, parameter và schema được sinh từ snapshot OpenAPI backend đã pin.

- File được sinh có header cấm chỉnh sửa thủ công.
- Command đồng bộ sinh lại chúng từ một đường dẫn OpenAPI đầu vào tường minh.
- Command kiểm tra sinh ra thư mục tạm và thất bại nếu kết quả khác với output đã commit.
- Version/checksum của hợp đồng backend được pin để build có thể tái lập mà không phụ thuộc vào backend development đang chạy.

### Typed transport và feature adapter

Transport được tách theo từng trách nhiệm:

```text
src/lib/api/
├── transport.ts
├── api-error.ts
├── response-envelope.ts
├── auth-middleware.ts
├── create-api-client.ts
└── generated/
```

Domain client khai báo portal và auth policy tường minh:

```ts
const lcmsApi = createApiClient({ portal: "lcms", auth: "required" });
const publicAuthApi = createApiClient({ auth: "public" });
```

Feature adapter vẫn nằm cục bộ theo feature:

```text
src/features/<feature>/api/
├── <feature>-routes.ts
├── <feature>-api.ts
├── <feature>-mapper.ts
├── <feature>-query.ts
└── <feature>-api.test.ts
```

- Route được lấy từ OpenAPI path đã typed hoặc builder cục bộ của feature; không tạo file `endpoints.ts` toàn cục trở thành nơi chứa hỗn tạp.
- Mọi path segment đi qua một encoder dùng chung.
- Query parameter sử dụng một serializer dùng chung.
- Adapter nhận `AbortSignal` và TanStack Query phải truyền signal của nó xuống.
- DTO được sinh không được đi vào React component hoặc store. Mapper chuyển DTO thành domain model của feature.

### Cô lập thay đổi field

Khi backend thêm field, output sinh tự động thay đổi nhưng mapper hiện tại vẫn compile. Feature chỉ cần thay đổi khi chủ động sử dụng field mới.

Khi backend xóa, đổi tên hoặc đổi type một field đang được dùng, quá trình sinh lại khiến mapper thất bại compile ngay tại vị trí truy cập field. Component không bị ảnh hưởng vì domain model của nó không thay đổi.

Alias tương thích tạm thời chỉ được xử lý tại một mapper:

```ts
const fullName = dto.fullName ?? dto.full_name;
```

Mỗi alias phải có issue/ngày loại bỏ; alias tương thích không được lan vào UI code.

### Response envelope và lỗi

- Parse đúng cấu trúc `ApiResponse<T>` thực tế của backend, bao gồm `errors` và `request_id`.
- Giữ lại error code/detail có cấu trúc từ backend trong `ApiClientError`.
- Không chuyển abort từ bên ngoài thành `NETWORK_ERROR`.
- Mock/offline fallback chỉ chạy trong mock mode tường minh hoặc với lỗi offline/network đã được phân loại. Fallback không được che giấu 4xx/5xx, lỗi schema hoặc lỗi phân quyền.

### Runtime validation

Runtime validation được bật trước cho auth session, mutation authorization/permission, quản trị nhân viên, publish quiz và import. Validation chấp nhận field bổ sung chưa biết nhưng từ chối field bắt buộc bị thiếu hoặc field có type không tương thích. Các endpoint khác tiếp tục dựa trên kiểu compile-time được sinh cho tới khi được chuyển đổi.

## Thiết kế GraphQL

- `erg-spring/src/main/resources/graphql/schema.graphqls` tiếp tục là nguồn sự thật của GraphQL.
- Query document phía frontend vẫn nằm cục bộ theo feature.
- Sinh kiểu result và variable theo từng operation từ schema đã commit và document phía frontend.
- CI validate mọi document với schema và thất bại khi field bị xóa/đổi tên, argument bị đổi hoặc nullability không còn tương thích.
- Có thể tiếp tục tắt introspection ở production vì quá trình sinh sử dụng schema file đã commit.

## Luồng CI

### Pull request backend

1. Sinh OpenAPI REST đã chuẩn hóa và validate GraphQL schema.
2. So sánh hai hợp đồng với merge base.
3. Thất bại nếu có breaking change không được khai báo/xử lý.
4. Xuất bản artifact hợp đồng đã chuẩn hóa và checksum cho consumer phía dưới.

### Pull request frontend

1. Kiểm tra snapshot/checksum hợp đồng đã pin.
2. Sinh lại kiểu REST và GraphQL; thất bại nếu quá trình này làm thay đổi working tree.
3. Typecheck feature mapper và query operation.
4. Chạy contract test, adapter test, transport test và test ứng dụng hiện có.
5. Từ chối `fetch` mới bên ngoài transport và endpoint literal mới bên ngoài các vị trí API/PWA policy được cho phép.

## Chiến lược kiểm thử

- Test tính quyết định của snapshot backend.
- Test fixture cho bộ kiểm tra breaking change backend: xóa path, thêm request field bắt buộc, xóa response field, đổi type/nullability, đổi security và trường hợp thêm optional field hợp lệ.
- Test schema của backend envelope để bảo đảm tất cả field luôn được mô tả nhất quán.
- Test độ mới của contract được sinh phía frontend.
- Test transport phía frontend cho envelope parsing, structured error, timeout, external abort, auth refresh và portal policy tường minh.
- Test feature adapter cho việc map DTO sang domain và alias tương thích.
- Validate GraphQL document và kiểm tra output sinh kiểu luôn đồng bộ.
- Một contract smoke test end-to-end với backend test instance cho lát cắt dọc đầu tiên.

## Lộ trình triển khai

1. **Nền tảng:** snapshot backend có tính quyết định, cổng kiểm tra tương thích, generator phía frontend, checksum pinning và script CI.
2. **Lát cắt dọc đầu tiên:** auth cùng employee/access management vì đây là vùng nhạy cảm về bảo mật và đã có API test tập trung.
3. **Quiz authoring/runtime:** thêm runtime validation cho publish, attempt và draft operation.
4. **Các domain còn lại:** chuyển theo từng feature; chỉ xóa DTO viết tay sau khi mapper tương ứng đã được bao phủ bởi test.
5. **Loại bỏ legacy:** chuyển endpoint không có version và xóa alias tương thích chỉ sau khi telemetry sử dụng cùng contract check xác nhận không còn consumer.

## Tiêu chí thành công

- Endpoint bị xóa hoặc field thay đổi không tương thích phải thất bại trước khi merge và cung cấp diff có thể hành động được.
- Thêm field optional chỉ yêu cầu sinh lại contract, trừ khi feature chủ động sử dụng field đó.
- Đổi tên một field đang được dùng phải làm thất bại đúng một feature mapper thay vì tạo `undefined` ở runtime trên nhiều component.
- Frontend build có thể tái lập mà không cần backend đang chạy.
- Portal/auth policy không còn phụ thuộc vào việc phân tích chuỗi endpoint đối với operation đã được chuyển đổi.
- Cancellation của TanStack Query đi được tới `fetch` đối với query đã được chuyển đổi.
- Artifact REST và GraphQL được sinh luôn đồng bộ với hợp đồng backend đã pin.

## Ngoài phạm vi

- Chuyển toàn bộ 424 REST path trong một lần phát hành.
- Viết lại toàn bộ frontend API module cùng lúc.
- Loại bỏ các metadata field thực sự cần cấu trúc tự do.
- Công khai OpenAPI production hoặc bật GraphQL introspection ở production.
- Thay đổi business behavior hoặc bố cục UI hiện tại.
