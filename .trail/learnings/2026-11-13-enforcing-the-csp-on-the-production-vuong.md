---
title: Enforcing the CSP on the production build
author: Vuong
date: 2026-11-13
branch: fix/enforce-csp
id: l-374176f5
scope: repo
status: active
src: agent
touches:
  - deploy/nginx/security-headers.conf
  - vercel.json
  - src/features/lcms/imports/google-sheets-csv-adapter.ts
---

## Decided
The CSP is enforced, with one string shared by deploy/nginx/security-headers.conf and vercel.json (src/test/csp-headers.policy.test.ts holds them equal). style-src keeps 'unsafe-inline' because Emotion/MUI inject <style> tags at runtime; script-src stays 'self' only, so nothing in index.html or public/*.html may use inline handlers (onload/onclick) and nothing may load JSONP. The Google Sheets gviz table is read with fetch (fetchGoogleSheetTable), not a script tag.

## Tried and ruled out
Walking the production build on *.erg.edu.local hosts: the production bundle only routes admin/teacher/student on lms.erg.edu.vn, so other hosts loop between the page and /access-denied. playwright.csp.config.ts maps the real production host names to the local nginx and stubs every other host. Playwright's default headless shell ignores --unsafely-treat-insecure-origin-as-secure, so the service worker never registers over plain http; the config uses channel "chrome".

## Watch out
sw.js is served with the same CSP, and workbox fetches Google Fonts from inside the worker, so connect-src must list fonts.googleapis.com and fonts.gstatic.com even though the page itself only needs style-src/font-src for them. Violations inside the worker never reach the page console; the spec probes them with a fetch from the service worker. New third-party hosts (embeds, uploads, media) need the policy changed in both files.
