---
title: "The page security policy must list wss for the game's live connection, not only https"
author: Vuong
date: 2026-11-24
branch: fix/csp-game-websocket
id: l-1dbd1c66
scope: repo
status: active
src: agent
touches:
  - deploy/nginx/security-headers.conf
  - vercel.json
  - src/test/csp-headers.policy.test.ts
---

## Decided
connect-src lists wss://*.erg.edu.vn next to https://*.erg.edu.vn. The classroom game is the first feature that opens a WebSocket (to the API host), and the policy only named https.

## Tried and ruled out
Relying on https://*.erg.edu.vn to cover wss. Chrome treats an https source as matching wss, so the game works there, but the lowest student device is an iPhone 7 on Safari 15 and older Safari did not apply that rule. Not tested on that phone; the explicit source costs nothing.

## Watch out
A deploy-production run can report success without deploying: during school hours the "Deploy" step is skipped, and GitHub may run the 21:35 schedule hours late (it ran at 08:52 the next morning). Check the "Deploy" step or the image running on the server.

In the code: deploy/nginx/security-headers.conf and vercel.json hold the same string; src/test/csp-headers.policy.test.ts keeps them equal.
