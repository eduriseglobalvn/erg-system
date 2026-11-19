---
title: "Every change reaches main through a pull request, never a direct push, even to trigger a deploy"
author: Vuong
date: 2026-11-18
branch: feat/role-consolidation
cost: { minutes: 1, tokens: 1172 }
id: l-ae855ad7
scope: repo
status: active
src: agent
touches:
  - ".github/workflows/ci.yml"
---

## Decided
Changes go onto main in both repos (this frontend and the Spring backend) only through a PR that the owner reviews and merges. This holds even when the owner says "deploy": push a feature branch, open a PR, share the link and wait.

## Tried and ruled out
On 2026-11-18 two fixes were pushed straight to main so that CI and the deploy workflow would pick them up. The owner rejected that. Both commits were reverted through PRs, and the changes were reopened as stacked PRs.

## Watch out
- deploy.yml runs after CI on main. Outside 06:30–21:30 VN time it deploys immediately. Inside that window it is postponed, and the 21:35 run deploys whatever is on main at that time. Anything pushed to main therefore reaches production that night, reviewed or not.
- Do not force-deploy while CI is red.

In the code:
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- Open PRs with `gh pr create --base main`.
