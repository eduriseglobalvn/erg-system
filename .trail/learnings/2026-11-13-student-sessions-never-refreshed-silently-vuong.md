---
title: Student sessions never refreshed silently
author: Vuong
date: 2026-11-13
branch: perf/student-session
id: l-0ad5c8fd
scope: repo
status: active
src: agent
touches:
  - src/platform/auth/api/auth-token-storage.ts
  - src/lib/api-client/refresh.ts
  - src/platform/auth/api/student-auth-storage.ts
---

## Found
A student's session lives in its own slots (erg-learning.student-session in sessionStorage, the remembered refresh-token copy in localStorage), but the API client's refresh only looked in the teacher slots. So once the 15-minute access token expired every student request failed locally with "Authentication session is missing or expired" and the student gate sent them back to the login page: one password (one Argon2 hash) per 15 minutes of use instead of one per session. readRawStoredAuthSession("elearning") and updateStoredAuthSessionTokens now read and write the student slot.

## Decided
- Refresh runs under the Web Lock "erg-auth-refresh" and re-reads the token inside it, preferring the remembered localStorage copy when it belongs to the same student. The backend treats reuse of a rotated refresh token as theft and revokes every session of the account, so two tabs (or a tab plus the PWA) refreshing with the same or a stale token logged the student out everywhere.
- Teacher/admin sessions had the same race: readRawStoredAuthSession took the in-memory tab snapshot first, which can hold a refresh token another tab already rotated. It now takes the refresh token from the remembered localStorage copy (erg-learning.session) when it belongs to the same accountId.
- A refresh that fails offline, on timeout, 429 or 5xx keeps the session; only a 4xx answer from the server ends it. A slow server during the morning login storm used to turn into logouts and therefore more logins.
- Student login sends deviceId/deviceName/deviceFingerprint like the back-office login, so the backend's "new device from an unknown IP replaces all sessions" rule can recognise the device.

## Watch out
Each refresh replaces the session's single access token hash, so two live tabs invalidate each other's access token and take turns refreshing (cheap, no Argon2). Tokens must still not travel between tabs; only the remembered refresh token is shared through localStorage.
