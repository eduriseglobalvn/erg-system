---
title: Backend bỏ qua migration mới nếu thư mục chạy có bản mã nguồn cũ
author: Vuong
date: 2026-11-16
branch: feat/role-consolidation
cost: { minutes: 1, tokens: 0 }
id: l-510bbcbb
scope: repo
status: active
src: agent
---

## Decided
Trước khi chạy jar backend ở một thư mục có mã nguồn (worktree test, server), đồng bộ thư mục migration ở đó với bản đã build, hoặc chạy jar ở thư mục không có `src/`.

## Tried and ruled out
Nghi jar thiếu file, nghi cấu hình `FLYWAY_LOCATIONS`, nghi Hibernate kiểm schema trước Flyway: đều sai. Jar có đủ V163 và location đúng.

## Watch out
Flyway báo "Schema is up to date. No migration necessary" rồi Hibernate mới hỏng với "missing column". Không có cảnh báo nào nói migration đọc từ ổ đĩa thay vì từ jar.

In the code:
- Repo backend `F:\ERG\erg-spring`, `config/persistence/FlywayConfig.java`: `SOURCE_MIGRATION_LOCATION = Path.of("src/main/resources/db/migration/postgres")` (tương đối theo thư mục chạy) được ưu tiên hơn `classpath:db/migration/postgres`.
- Gặp ngày 17/11/2026 khi chạy jar mới từ worktree test `F:\ERG\wt\be-test` lúc worktree đó chưa có `V163__single_subject_store.sql`. Liên quan stack test trong `KE_HOACH_TEST_STAGING.md`.
