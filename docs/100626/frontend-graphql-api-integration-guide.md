# Tài liệu tích hợp FE cho GraphQL LMS/LCMS/Elearning

Cập nhật: 2026-06-10 ICT

Phạm vi: các GraphQL read API đã có trong `erg-spring` để FE LMS/LCMS/Elearning tích hợp màn hình nặng.

Source contract chính:

- Schema: `src/main/resources/graphql/schema.graphqls`
- GraphQL infra: `src/main/java/com/erg/ergspringboot/platform/graphql`
- Resolver/controller:
  - `src/main/java/com/erg/ergspringboot/controller/platform/graphql/GraphQlShellController.java`
  - `src/main/java/com/erg/ergspringboot/controller/lms/graphql`
  - `src/main/java/com/erg/ergspringboot/controller/lcms/graphql`
  - `src/main/java/com/erg/ergspringboot/controller/elearning/graphql`
- Public response DTO:
  - `src/main/java/com/erg/ergspringboot/common/response/hoclieu/HocLieuLibraryResponses.java`
  - `src/main/java/com/erg/ergspringboot/common/response/lms`
  - `src/main/java/com/erg/ergspringboot/common/response/lcms`
  - `src/main/java/com/erg/ergspringboot/common/response/elearning`

## 1. Nguyên tắc tích hợp

GraphQL v1 hiện chỉ dùng cho **read-projection-heavy workspace**. FE không dùng GraphQL cho command/write.

Giữ REST cho:

- login/auth;
- `GET /api/v1/sessions/current`;
- current scope;
- danh sách trường/trung tâm/lớp nhẹ;
- create/update/delete/submit/import/upload/export;
- quiz runtime attempt package/sync/submit;
- notification mark read hoặc các command có audit/idempotency.

FE flow khuyến nghị:

1. Login bằng REST.
2. Gọi `GET /api/v1/sessions/current` để lấy user, tenant, permissions, portals, manageable schools/classes/current scope.
3. Với màn hình nặng, gọi `POST /api/v1/graphql`.
4. Với thao tác ghi dữ liệu, quay lại REST command.

## 2. Endpoint chung

```http
POST /api/v1/graphql
Content-Type: application/json
Authorization: Bearer <accessToken>
X-Portal: lms | lcms | elearning | crm
X-Tenant-ID: <tenantId>
X-Request-ID: <uuid-or-trace-id>
```

Header bắt buộc/thường dùng:

| Header | Bắt buộc | Ghi chú |
|---|---:|---|
| `Authorization` | Có | Dùng Bearer token thật. Header auth test-only không dùng ở production. |
| `Content-Type` | Có | Phải là `application/json`. |
| `X-Portal` | Nên gửi | `lms`, `lcms`, `elearning`, `crm`. Nếu gửi, portal phải nằm trong principal. |
| `X-Tenant-ID` | Nên gửi | Nếu gửi, phải khớp tenant trong token/principal. Sai tenant sẽ bị chặn. |
| `X-Request-ID` | Nên gửi | FE tạo để trace log/error. |
| `X-Current-EducationUnit-ID` | Tuỳ màn hình | Context phụ. Current/scope authoritative vẫn nên lấy từ REST current. |
| `X-Current-Class-ID` | Tuỳ màn hình | Context phụ. |

Body chuẩn:

```json
{
  "operationName": "LmsClassWorkspace",
  "query": "query LmsClassWorkspace($input: ClassWorkspaceInput!) { lms { classWorkspace(input: $input) { tenantId } } }",
  "variables": {
    "input": {
      "tenantId": "erg",
      "classId": "cls_6a1"
    }
  }
}
```

Quy tắc guard:

- Chỉ nhận `POST`.
- Bắt buộc JSON body.
- Bắt buộc có `query`.
- Bắt buộc có `operationName`.
- Production mặc định tắt introspection.
- Query quá dài, quá sâu, quá nhiều alias sẽ bị reject.
- Variables không được có key nhạy cảm như `password`, `token`, `secret`, `credential`, `authorization`.
- Rate limit hiện tại theo tenant/user/operationName.

Giới hạn mặc định:

| Nhóm | Giá trị hiện tại |
|---|---:|
| Max query length | `20000` |
| Max depth | `8` |
| Max complexity | `500` |
| Max aliases | `20` |
| Execution timeout | `5s` |
| GraphQL rate limit | `120 rpm`, burst `30` |
| Page size default | `20` |
| Page size hard max | `50` |

## 3. Response và error chung

GraphQL response chuẩn:

```json
{
  "data": {
    "lms": {
      "classWorkspace": {}
    }
  },
  "errors": []
}
```

FE nên xử lý:

- Có thể có `data` một phần và `errors`.
- Nếu field bị thiếu quyền, BE có thể trả GraphQL error hoặc nullable field là `null` tuỳ contract.
- Với field nullable do permission, FE không nên xem là crash.

HTTP lỗi thường gặp:

| HTTP | Nguyên nhân |
---:|---|
| `400` | Body không phải JSON, thiếu query/operationName, query quá sâu/dài, variables chứa sensitive key. |
| `401` | Không có principal/token hợp lệ. |
| `403` | Sai tenant, sai portal, thiếu permission, ngoài scope trường/lớp/user. |
| `405` | Không dùng POST. |
| `429` | Vượt rate limit. Có header `Retry-After`. |

Page response shape dùng chung:

```graphql
{
  items
  page
  size
  totalItems
  totalPages
  hasNext
  hasPrevious
}
```

FE dùng `page` zero-based. Nếu gửi `size > 50`, BE clamp về `50`.

## 4. API shell/status

Dùng để smoke test namespace.

Permission: cần principal hợp lệ qua GraphQL context. Không nên dùng làm health check public.

Request:

```json
{
  "operationName": "GraphQlShellStatus",
  "query": "query GraphQlShellStatus { lms { namespace status } lcms { namespace status } crm { namespace status } elearning { namespace status } }",
  "variables": {}
}
```

Response:

```json
{
  "data": {
    "lms": { "namespace": "lms", "status": "ready" },
    "lcms": { "namespace": "lcms", "status": "ready" },
    "crm": { "namespace": "crm", "status": "ready" },
    "elearning": { "namespace": "elearning", "status": "ready" }
  }
}
```

## 5. LMS API

### 5.1 `lms.learningResourceLibrary(input)`

Màn hình FE:

- LMS Resources / Learning resource library.
- Taxonomy tree + resource cards + progress + recent opened.

Permission:

- `lms.resource.read`, hoặc
- `hoclieu.resource.read`, hoặc
- `hoclieu.manage`, hoặc
- `*`.

Scope:

- `tenantId` phải khớp principal.
- `educationUnitId` phải nằm trong managed education units nếu principal không wildcard.

Input:

```graphql
input LearningResourceLibraryInput {
  tenantId: String
  educationUnitId: String
  academicYear: String
  subjectId: String
  gradeId: String
  categoryId: String
  sectionId: String
  topicId: String
  status: String
  visibility: String
  page: Int
  size: Int
}
```

Ghi chú:

- `status` và `visibility` được normalize lowercase.
- `academicYear` nếu không gửi sẽ fallback từ principal attributes: `currentAcademicYear`, `academicYear`, `schoolYear`.
- `progress` chỉ có dữ liệu nếu có đủ `educationUnitId`, `userId`, `academicYear`.
- `recentOpened` giới hạn 10 item.
- `progress` giới hạn 50 item.

Query:

```graphql
query LmsLearningResourceLibrary($input: LearningResourceLibraryInput) {
  lms {
    learningResourceLibrary(input: $input) {
      tenantId
      educationUnitId
      taxonomyTree {
        id
        kind
        label
        slug
        parentId
        subjectId
        categoryId
        sortOrder
        status
        description
        childCount
        resourceCount
      }
      resources {
        items {
          id
          subjectId
          gradeId
          categoryId
          sectionId
          topicId
          title
          slug
          subtitle
          thumbnailUrl
          visibility
          status
          publishedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      progress {
        resourceId
        progressRate
        updatedAt
      }
      recentOpened {
        resourceId
        title
        openedAt
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "LmsLearningResourceLibrary",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg",
      "educationUnitId": "sch_binh_an",
      "academicYear": "2025-2026",
      "subjectId": "math",
      "gradeId": "grade_6",
      "status": "active",
      "visibility": "published",
      "page": 0,
      "size": 20
    }
  }
}
```

### 5.2 `lms.classWorkspace(input)`

Màn hình FE:

- Class management.
- Class roster.
- Assignment summary.
- Score/risk widgets.

Permission:

- Base workspace: `lms.class.read`, hoặc `lms.manage`, hoặc `*`.
- `scoreSummary`: chỉ include khi có `lms.grade.read`, `lms.manage`, hoặc `*`.
- `riskSummary`: chỉ include khi có `lms.progress.read`, `lms.grade.read`, `lms.manage`, hoặc `*`.

Scope:

- `classId` bắt buộc.
- Principal phải có managed class hoặc managed education unit tương ứng.
- `schoolId` nếu gửi phải nằm trong scope.

Input:

```graphql
input ClassWorkspaceInput {
  tenantId: String
  classId: String!
  schoolId: String
  studentStatus: String
  page: Int
  size: Int
  assignmentStatus: String
  assignmentPage: Int
  assignmentSize: Int
}
```

Query:

```graphql
query LmsClassWorkspace($input: ClassWorkspaceInput!) {
  lms {
    classWorkspace(input: $input) {
      tenantId
      classInfo {
        id
        schoolId
        name
        grade
        academicYear
        status
        homeroomTeacherId
        studentCount
        assignmentCount
        updatedAt
      }
      scoreSummary {
        completedAttemptCount
        attemptedStudentCount
        averagePercent
        bestPercent
      }
      riskSummary {
        missingOverdueStudentCount
        lowScoreStudentCount
        inactiveStudentCount
      }
      students {
        items {
          id
          schoolId
          academicClassId
          studentCode
          fullName
          username
          authUserId
          email
          status
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      assignments {
        items {
          id
          academicClassId
          quizId
          subjectId
          dueAt
          status
          assignedBy
          recipientMode
          createdAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "LmsClassWorkspace",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg",
      "classId": "cls_ba_2025_6a1",
      "schoolId": "sch_binh_an",
      "studentStatus": "active",
      "page": 0,
      "size": 20,
      "assignmentStatus": "active",
      "assignmentPage": 0,
      "assignmentSize": 20
    }
  }
}
```

FE lưu ý:

- `scoreSummary` và `riskSummary` là nullable. Nếu `null`, ẩn widget hoặc show no-permission state nhẹ.
- `students.page` và `assignments.page` là 2 pagination độc lập.

### 5.3 `lms.teacherHomeworkWorkspace(input)`

Màn hình FE:

- Homework list.
- Teacher homework workspace.
- Pending review list.
- Overdue students list.
- Class option picker trong workspace.

Permission:

- `lms.assignment.read`, hoặc `*`.

Scope:

- Teacher id lấy từ principal, FE không truyền `teacherId`.
- BE chỉ đọc assignment theo teacher hiện tại.

Input:

```graphql
input TeacherHomeworkWorkspaceInput {
  tenantId: String
  status: String
  page: Int
  size: Int
}
```

Query:

```graphql
query LmsTeacherHomeworkWorkspace($input: TeacherHomeworkWorkspaceInput) {
  lms {
    teacherHomeworkWorkspace(input: $input) {
      tenantId
      teacherId
      summary {
        activeAssignmentCount
        overdueAssignmentCount
        pendingReviewAssignmentCount
      }
      classOptions {
        id
        schoolId
        name
        grade
        academicYear
        status
      }
      assignments {
        items {
          id
          academicClassId
          quizId
          subjectId
          dueAt
          status
          assignedBy
          recipientMode
          createdAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      pendingReviews {
        items {
          attemptId
          assignmentId
          academicClassId
          quizId
          subjectId
          studentId
          studentCode
          fullName
          status
          score
          maxScore
          percent
          submittedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      overdueStudents {
        items {
          assignmentId
          academicClassId
          quizId
          subjectId
          dueAt
          studentId
          studentCode
          fullName
          status
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "LmsTeacherHomeworkWorkspace",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg",
      "status": "active",
      "page": 0,
      "size": 20
    }
  }
}
```

FE lưu ý:

- Hiện `assignments`, `pendingReviews`, `overdueStudents` dùng cùng `page/size` input.
- Nếu FE cần phân trang độc lập từng panel, cần mở rộng contract sau.

### 5.4 `lms.assignmentProgressWorkspace(input)`

Màn hình FE:

- Homework progress.
- Assignment detail + attempt summary.
- Recipient progress.
- Missing/late students.

Permission:

- `lms.assignment.read`, hoặc
- `lms.progress.read`, hoặc
- `lms.manage`, hoặc
- `*`.

Scope:

- Assignment owner `assignedBy == principal.userId` được xem.
- Nếu không phải owner, principal phải wildcard hoặc có `managedClassIds` chứa `assignment.academicClassId`.

Input:

```graphql
input AssignmentProgressWorkspaceInput {
  tenantId: String
  assignmentId: String!
  attemptStatus: String
  page: Int
  size: Int
}
```

Query:

```graphql
query LmsAssignmentProgressWorkspace($input: AssignmentProgressWorkspaceInput!) {
  lms {
    assignmentProgressWorkspace(input: $input) {
      tenantId
      assignment {
        id
        academicClassId
        quizId
        subjectId
        dueAt
        status
        assignedBy
        recipientMode
        createdAt
        updatedAt
      }
      summary {
        submittedCount
        inProgressCount
        needsReviewCount
      }
      attempts {
        items {
          id
          assignmentId
          quizId
          studentId
          status
          score
          maxScore
          percent
          passed
          startedAt
          submittedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      recipients {
        items {
          studentId
          schoolId
          academicClassId
          studentCode
          fullName
          username
          authUserId
          email
          status
          missing
          late
          latestAttempt {
            id
            assignmentId
            quizId
            studentId
            status
            score
            maxScore
            percent
            passed
            startedAt
            submittedAt
            updatedAt
          }
          bestAttempt {
            id
            assignmentId
            quizId
            studentId
            status
            score
            maxScore
            percent
            passed
            startedAt
            submittedAt
            updatedAt
          }
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      missingLateStudents {
        items {
          studentId
          schoolId
          academicClassId
          studentCode
          fullName
          username
          authUserId
          email
          status
          dueAt
          missing
          late
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "LmsAssignmentProgressWorkspace",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg",
      "assignmentId": "asg_001",
      "attemptStatus": "submitted",
      "page": 0,
      "size": 20
    }
  }
}
```

FE lưu ý:

- `attempts` dùng `page/size` input, sort theo `updatedAt` giảm dần.
- `recipients` và `missingLateStudents` hiện fixed page đầu tiên size 50 trong service.
- `latestAttempt` và `bestAttempt` có thể `null`.
- API không trả raw answers, raw events, client state, package hash.

## 6. Elearning API

### 6.1 `elearning.studentDashboard(input)`

Màn hình FE:

- Student dashboard.
- Assignment cards.
- Score summary.
- Next actions.
- Announcements.

Permission:

- `elearning.assignment.read_self` theo policy service.

Scope:

- Chỉ self-scope.
- `tenantId` nếu gửi phải khớp principal.
- `studentUserId` nếu gửi phải bằng `principal.userId`.
- FE thường không cần truyền `studentUserId`; để BE lấy từ token.

Input:

```graphql
input StudentDashboardInput {
  tenantId: String
  studentUserId: String
}
```

Query:

```graphql
query ElearningStudentDashboard($input: StudentDashboardInput) {
  elearning {
    studentDashboard(input: $input) {
      tenantId
      viewer {
        userId
        tenantId
        accountType
        accessLevel
      }
      profile {
        userId
        studentId
        studentCode
        fullName
        email
        schoolId
        academicClassId
        status
        updatedAt
      }
      summary {
        enrolledCourseCount
        activeAssignmentCount
        pendingActionCount
        generatedAt
        scoreSummary {
          completedAttemptCount
          attemptedAssignmentCount
          passedAttemptCount
          averagePercent
          bestPercent
        }
      }
      courses {
        id
        title
        status
        progressPercent
        updatedAt
      }
      assignments {
        id
        title
        status
        dueAt
      }
      nextActions {
        id
        kind
        label
        targetId
        dueAt
      }
      announcements {
        id
        title
        content
        pinned
        publishedAt
        updatedAt
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "ElearningStudentDashboard",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg"
    }
  }
}
```

FE lưu ý:

- Assignment slice cố định 8 item đầu.
- Next actions tối đa 5 item.
- Announcements tối đa 5 item.
- Quiz attempt package/sync/submit vẫn dùng REST, không dùng GraphQL.

## 7. LCMS API

### 7.1 `lcms.questionBankWorkspace(input)`

Màn hình FE:

- LCMS question bank.
- Question list.
- Subject/level/topic filters.
- Quiz picker/options.

Permission:

- `lms.quiz.read`, hoặc
- `hoclieu.manage`, hoặc
- `*`.

Input:

```graphql
input QuestionBankWorkspaceInput {
  tenantId: String
  search: String
  subjectId: String
  levelId: String
  topicId: String
  status: String
  page: Int
  size: Int
}
```

Query:

```graphql
query LcmsQuestionBankWorkspace($input: QuestionBankWorkspaceInput) {
  lcms {
    questionBankWorkspace(input: $input) {
      tenantId
      questions {
        items {
          id
          subjectId
          levelId
          topicId
          title
          type
          status
          usageCount
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      subjects {
        id
        label
      }
      levels {
        id
        label
      }
      topics {
        id
        label
      }
      quizzes {
        id
        title
        status
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "LcmsQuestionBankWorkspace",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg",
      "search": "fraction",
      "subjectId": "math",
      "levelId": "grade_6",
      "topicId": "topic_fraction",
      "status": "active",
      "page": 0,
      "size": 20
    }
  }
}
```

FE lưu ý:

- `usageCount` là aggregate count theo quiz usage.
- `levels` phụ thuộc `subjectId`.
- `topics` phụ thuộc `levelId`.
- `quizzes` filter theo subject/level/status.

### 7.2 `lcms.accessManagementWorkspace(input)`

Màn hình FE:

- Users/Permissions.
- Access management read workspace.
- Role/scope option bootstrap.

Permission:

- Base workspace: `lms.scope.read`, hoặc `*`.
- `effectivePermissions` chỉ include khi có `rbac.permission.read`, hoặc `users.manage`, hoặc `*`.
- Nếu permission bị deny (`deniedPermissions`) thì không include effective permissions.

Input:

```graphql
input AccessManagementWorkspaceInput {
  tenantId: String
  search: String
  roleId: String
  status: String
  page: Int
  size: Int
}
```

Query:

```graphql
query LcmsAccessManagementWorkspace($input: AccessManagementWorkspaceInput) {
  lcms {
    accessManagementWorkspace(input: $input) {
      tenantId
      effectivePermissionsIncluded
      users {
        items {
          userId
          fullName
          email
          status
          roleCount
          scopeCount
          effectivePermissions {
            permission
            source
          }
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      roleOptions {
        id
        name
      }
      scopeOptions {
        id
        label
        kind
      }
    }
  }
}
```

Payload mẫu:

```json
{
  "operationName": "LcmsAccessManagementWorkspace",
  "query": "<query above>",
  "variables": {
    "input": {
      "tenantId": "erg",
      "search": "teacher",
      "roleId": "role_teacher",
      "status": "active",
      "page": 0,
      "size": 20
    }
  }
}
```

FE lưu ý:

- Kiểm tra `effectivePermissionsIncluded`.
- Nếu `false`, FE không nên hiển thị bảng quyền effective hoặc hiển thị no-permission state.
- Các thao tác save role/scope/access vẫn dùng REST command, không dùng GraphQL.

## 8. TypeScript client mẫu

```ts
type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
};

type GraphQlPortal = 'lms' | 'lcms' | 'elearning' | 'crm';

export async function graphQlRequest<TData, TVariables extends Record<string, unknown>>({
  endpoint = '/api/v1/graphql',
  token,
  portal,
  tenantId,
  requestId,
  operationName,
  query,
  variables,
}: {
  endpoint?: string;
  token: string;
  portal: GraphQlPortal;
  tenantId: string;
  requestId?: string;
  operationName: string;
  query: string;
  variables?: TVariables;
}): Promise<TData> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Portal': portal,
      'X-Tenant-ID': tenantId,
      'X-Request-ID': requestId ?? crypto.randomUUID(),
    },
    body: JSON.stringify({
      operationName,
      query,
      variables: variables ?? {},
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GraphQL HTTP ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as GraphQlResponse<TData>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }
  if (!payload.data) {
    throw new Error('GraphQL response missing data');
  }
  return payload.data;
}
```

Ví dụ gọi class workspace:

```ts
const data = await graphQlRequest<{
  lms: {
    classWorkspace: {
      tenantId: string;
      classInfo: { id: string; name?: string | null };
    };
  };
}, {
  input: {
    tenantId: string;
    classId: string;
    schoolId?: string;
    page?: number;
    size?: number;
  };
}>({
  token,
  portal: 'lms',
  tenantId: 'erg',
  operationName: 'LmsClassWorkspace',
  query: LmsClassWorkspaceDocument,
  variables: {
    input: {
      tenantId: 'erg',
      classId: 'cls_ba_2025_6a1',
      schoolId: 'sch_binh_an',
      page: 0,
      size: 20,
    },
  },
});
```

## 9. Mapping màn hình FE

| Màn hình | API nên gọi |
|---|---|
| Teacher shell/sidebar | REST `GET /api/v1/sessions/current`, REST class/scope nhẹ |
| LMS Resources | `lms.learningResourceLibrary` |
| Class management | `lms.classWorkspace` |
| Homework list | `lms.teacherHomeworkWorkspace` |
| Homework progress | `lms.assignmentProgressWorkspace` |
| Student dashboard | `elearning.studentDashboard` |
| LCMS question bank | `lcms.questionBankWorkspace` |
| LCMS users/permissions read workspace | `lcms.accessManagementWorkspace` |
| Create/update assignment | REST command |
| Save attendance/score/import/export/upload | REST command |
| Quiz attempt package/sync/submit | REST runtime |

## 10. FE checklist trước khi tích hợp

- Luôn gửi `operationName`.
- Luôn gửi `Content-Type: application/json`.
- Luôn gửi `Authorization: Bearer <token>`.
- Gửi đúng `X-Portal` theo app hiện tại.
- Gửi `X-Tenant-ID` lấy từ current session.
- Không đưa password/token/secret vào GraphQL variables.
- Không dùng introspection ở production.
- Tách query document theo màn hình, không tạo một query khổng lồ cho mọi thứ.
- Respect nullable fields do permission: `scoreSummary`, `riskSummary`, `latestAttempt`, `bestAttempt`.
- Page zero-based, default size 20, hard max 50.
- Xử lý `429` bằng retry/backoff theo `Retry-After`.
- Không gọi GraphQL polling quá dày; workspace read nên cache ở FE theo operationName + variables + tenant + user/scope.

## 11. Những phần chưa nên tích hợp bằng GraphQL

Không dùng GraphQL cho:

- login/register/logout/refresh token;
- current session/current scope;
- create/update/delete assignment;
- save attendance;
- save score adjustment;
- import students;
- upload/launch/download assets;
- export reports;
- quiz attempt runtime package/sync/submit;
- mark notification read;
- user/role/access writes.

Các phần này vẫn đi REST để giữ audit, idempotency, file handling, transaction boundary và security rõ hơn.

