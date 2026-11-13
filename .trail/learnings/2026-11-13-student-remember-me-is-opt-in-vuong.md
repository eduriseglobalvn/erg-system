---
title: Student remember me is opt-in and off on shared computers
author: Vuong
date: 2026-11-13
branch: perf/student-session
id: l-ba267d3c
scope: repo
status: active
src: agent
touches:
  - src/platform/auth/api/student-auth-storage.ts
  - src/platform/auth/hooks/use-idle-sign-out.ts
  - src/platform/auth/hooks/use-auth-session.ts
  - src/platform/auth/components/portal-login-page.tsx
---

## Decided
Owner decision 2026-11-13: on a shared computer (school computer room) "Ghi nhớ đăng nhập" is off; elsewhere it is opt-in and starts unticked for students (useAuthSession("elearning")), staff keep their old ticked default. A remembered student gets a 30-day sliding session on the backend (capped at 90 days from login) and is exempt from the 156-minute idle sign-out (isIdleSignOutExempt); an unticked student keeps the 12h session and the idle sign-out.

A shared computer is a per-browser localStorage flag "erg-shared-device". A teacher or admin turns it on once by opening the student login page with ?shared-device=on and off with ?shared-device=off (applySharedDeviceParam, called by PortalLoginPage for the elearning portal). Turning it on also deletes a remembered student's refresh token. On a shared computer the checkbox is replaced by a note, and loginStudentWithApi sends rememberMe=false and stores no refresh token in localStorage whatever the form says.

## Tried and ruled out
Recognising the computer room by IP: students on their own phones on the school Wi-Fi share that IP.

## Watch out
The flag is per browser profile, so a computer room with several browsers needs the URL opened in each one. Clearing site data removes it.
