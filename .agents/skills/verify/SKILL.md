---
name: verify
description: How to run and drive trydarwin locally to verify changes (server, sockets, DB)
---

# Verifying trydarwin changes

## Infra

- Postgres + Redis run via `docker-compose up -d`. **Container names are `nanbe-postgres` / `nanbe-redis` and the database is `nanbe`** (names reused from an older project — this IS trydarwin's data). Redis is on host port **6370**, Postgres on 5433.
- Query the DB directly: `docker exec nanbe-postgres psql -U user -d nanbe -tA -c "..."` (expect harmless collation-version warnings).
- One `.env` at the repo root; server reads `SERVER_*` keys.

## Server

- `bun run dev --filter=@trydarwin/server` → Express + ws on `:8080` (`SERVER_PORT`). Health: `curl localhost:8080/api/v1/health`.
- The user often already has it running (`lsof -i :8080`); it's `bun --watch`, so file edits hot-reload — no restart needed.

## Driving the WebSocket surface

- Connect to `ws://localhost:8080?projectId=<id>&token=<jwt>`.
- Mint session JWTs with `jsonwebtoken` (HS256, `JWT_SECRET` from root `.env`), payload `{ id, name, email }` matching a real `"User"` row. Run the script with cwd `apps/server` so `jsonwebtoken` resolves.
- Access rules: connection is rejected (close 4001) unless the user is a ProjectMember, the project owner, or an org member with access; bad JWT closes 4000. Inbound messages: `{ type: "CHAT_CREATE", payload: { issueId, message } }`; expect `CHAT_CREATED` broadcast / `CHAT_ERROR` to sender.
- Useful fixtures (dev DB): project `cmqcsff8w0001v0vhk7jomvhi` with issues; user `cmpzs4vr90000fsvhqo8t0eit` (owner), `cmq43yigf0001w1vh0niony6t` (member), `cmreye7vz0000xxvhq4y3g9o8` (no access).
- Clean up any rows you insert (`Chat`, `Issue`) after probing — this is the user's live dev DB.

## Web

- `bun run dev --filter=web` → Next.js on :3000. Login is email-OTP (Resend) — not drivable headlessly; prefer the socket/HTTP surface for server changes.
