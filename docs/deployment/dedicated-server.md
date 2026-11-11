# Dedicated server deployment

The production image is a static Vite build served by Nginx. Browser requests remain same-origin and `/api/*` is reverse-proxied to the backend target supplied at container start.

## First deployment

```powershell
Copy-Item .env.docker.example .env.docker
# Edit BACKEND_UPSTREAM, FE_PORT and image name in .env.docker
docker compose --env-file .env.docker build --pull
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
```

The image build runs `bun install --frozen-lockfile` and `bun run build`. The runtime container is read-only, drops Linux capabilities, uses `no-new-privileges`, and exposes `/healthz` for health checks. Only the named `erg-fe-release-store` volume is writable. At container start, the release promoter copies hashed assets first, atomically switches `index.html`, and switches `sw.js` last. It intentionally retains older hashed chunks for open browser/PWA sessions.

Do not replace that named volume during an ordinary release or rollback. Its
retention and the cache rules in `docs/deployment/web-pwa-release-runbook.md`
are part of the update contract, not disposable build cache.

## Emergency BE endpoint change

Change only `BACKEND_UPSTREAM` in `.env.docker`, then recreate the FE container:

```powershell
docker compose --env-file .env.docker up -d --no-build --force-recreate erg-fe
curl http://127.0.0.1/healthz
```

No FE rebuild is required. Existing browser sessions continue calling the same `/api` origin; Nginx changes the upstream target at startup. Keep the old upstream value available for rollback and run a smoke request before switching traffic permanently.

## Rollback

Restore the previous `BACKEND_UPSTREAM` value and run the same `up -d --no-build --force-recreate` command. Pin `FE_IMAGE` to a previously validated image tag for a frontend rollback. Keep `erg-fe-release-store`: the previous image re-promotes its HTML and service worker while reusing retained hashed assets.

## Direct-origin mode

Set `VITE_API_BASE` only when the browser must call a separately exposed API origin. This value is build-time and requires an image rebuild. The recommended dedicated-server mode leaves it empty and changes `BACKEND_UPSTREAM` at runtime instead.
