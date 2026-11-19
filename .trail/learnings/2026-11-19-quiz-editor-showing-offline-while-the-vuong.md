---
title: Quiz editor showing offline while the network is fine means the image upload to R2 is being rejected
author: Vuong
date: 2026-11-19
branch: fix/quiz-image-upload-checksum
id: l-03e535be
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/quiz/quiz-editor/sync/upload-inline-images.ts
---

## Decided
If the quiz editor says "Mất kết nối" while the network is fine, the image upload to R2 is failing. The browser PUTs quiz images straight to R2 using a URL the backend presigns, and two things must both line up:
1. The R2 bucket `erg` needs a CORS rule for the frontend origins (PUT, GET).
2. The PUT must send every header the backend signed. The backend signs content-length;content-type;host;x-amz-checksum-sha256;x-amz-sdk-checksum-algorithm. The frontend now sends x-amz-checksum-sha256 (the SHA-256 as base64) and x-amz-sdk-checksum-algorithm: SHA256. CORS AllowedHeaders must list both of them plus content-type.
Any R2 error response carries no CORS headers, so the browser surfaces every rejection as a fetch TypeError. The upload code maps that to NETWORK_ERROR, and the sync engine marks the editor offline and retries forever. Images upload before the draft is saved, so all pending edits stay stuck.

## Tried and ruled out
- Adding CORS alone (2026-11-19): the preflight passed, but nginx still showed only POST /api/v1/lcms/media/presign every ~31s and never /commit, because the checksum headers were missing.
- Real connectivity loss, timeouts, and backend errors: presign returned 200 every time.

## Watch out
- If backend presign settings change (more signed headers, a different checksum), the frontend headers and the R2 CORS AllowedHeaders must change with them.
- To see which headers the backend signs, read X-Amz-SignedHeaders in a presigned URL.
- R2 CORS lives only in the Cloudflare dashboard, not in either repo.

In the code: src/features/lcms/quiz/quiz-editor/sync/upload-inline-images.ts (put, hexToBase64); erg-spring R2MediaStorageAdapter.presignUpload (checksumAlgorithm SHA256 + checksumSHA256).
