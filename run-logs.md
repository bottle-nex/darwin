# Run logs

How a solving run's history is captured, cached, archived, and read back.

A run's events live in three places over their lifetime, because they are needed for three
different reasons:

| Where            | Why it is there                    | For how long            |
| ---------------- | ---------------------------------- | ----------------------- |
| Redis sorted set | the browser tails it live          | until guards flushes it |
| Object storage   | someone opens the run next week    | retained                |
| Postgres         | pointer + counts, never event rows | with the `AgentSession` |

Postgres never holds an event. `AgentSession` holds `logsKey`, `logsLineCount`,
`logsDroppedLines` and `logsSizeBytes` — a pointer and a tally, nothing more.

---

## Where events come from

The agent reports its own actions. After each read, write, search, or command it calls the
`report_progress` MCP tool, and that call is the only source of run content.

Nothing observes the agent. The harness parsers no longer read tool calls out of stdout — they
watch only for the result event carrying cost and turn count. This is a deliberate trade: one
contract that works identically across Claude, Codex, and OpenCode, in exchange for a log that
is only as complete as the agent's compliance. See [What is lossy](#what-is-lossy).

---

## How an event travels

One event — the agent editing `src/auth.ts` — from the tool call to the archive.

```
  SERVICE                          t          THE EVENT AT THIS POINT
  ───────                          ─          ───────────────────────

  ┌──────────────────────────┐
  │  agent                   │     0ms        the agent edits a file,
  │  sandbox · untrusted     │                then calls the tool
  └─────────────┬────────────┘
                │                             report_progress({
                │                               kind:   "file_write",
                │                               path:   "/home/user/repo/src/auth.ts",
                │                               mode:   "edit",
                ▼                               output: "<40kB it shouldn't send>" })
  ┌──────────────────────────┐
  │  sandbox-mcp             │     0ms        to_run_log_event()      ── TRIM #1
  │  report_progress         │                drops `output` — file_write
  │  seq := 847              │                doesn't carry it
  └─────────────┬────────────┘                seq ASSIGNED HERE so a retry can
                │                             carry the same identity
                │  POST /run-logs             { run_id, seq: 847,
                │  Bearer <worker token>        event: { kind: "file_write",
                ▼                                        path: "…/src/auth.ts",
                                                         mode: "edit" } }
  ══════════════════════════════ trust boundary ════════════════════════════════
                ▼
  ┌──────────────────────────┐
  │  vm worker · http        │    ~1ms        bearer() → RunLogRegistry.resolve()
  │  :4100                   │                404 unless THIS worker runs THAT run
  └─────────────┬────────────┘
                ▼
  ┌──────────────────────────┐
  │  vm worker · writer      │    ~1ms        reported_event_schema  ── TRIM #2
  │  holds nothing at all    │                + redact(secrets)
  └─────────────┬────────────┘                awaits the write — no early ack
                ▼
  ┌──────────────────────────┐
  │  redis                   │    ~2ms        ZADD run:logs:{run} 847 <json>
  │  sorted set, score = seq │                score 847 → a resend is a no-op
  └─────────────┬────────────┘
                │
                ├──── 200 { stored: 847 } ─────► sandbox drops it. ONLY now.
                │
                └──── 503 / no response ───────► sandbox re-sends seq 847
                                                 3 attempts, 200ms → 400ms
                │
     ┌──────────┴──────────┐
     │ PUBLISH             │ SMEMBERS
     │ project:{p}         │ every 15s
     ▼                     ▼
  ┌──────────────┐   ┌──────────────────────────┐
  │ api server   │   │  guards · flusher        │   ≤15s
  │ socket relay │   │                          │
  └──────┬───────┘   └─────────────┬────────────┘
         │                         │   ZRANGEBYSCORE (flushed +inf
         │ RUN_LOG_APPENDED        │   gzipSync(…)
         │ { events, cursor:847 }  │   ZREMRANGEBYSCORE ── 847 LEAVES redis here
         ▼                         ▼
  ┌──────────────┐   ┌──────────────────────────┐
  │ browser      │   │  object storage          │
  │ live tail    │   │  …/{run}/000000801.gz    │   segment while live
  └──────────────┘   └─────────────┬────────────┘   …/{run}.ndjson.gz once ended
                                   │
                                   │ someone opens the run next week
                                   ▼
                     ┌──────────────────────────┐
                     │  api server · read_page  │   archive ++ cache, joined on seq
                     └──────────────────────────┘
```

Event 847 is in exactly one place at any moment. Before the guards tick it is in Redis and the
browser already has it; after the tick it is in object storage and gone from Redis. That is why
`read_page` joins two sources on the first page — a live run always straddles the boundary.

### The acknowledgement contract

Nothing is acknowledged before the cache holds it. The vm worker buffers nothing, so a 200 means
Redis has the event, not that some process intends to store it later.

| Response                      | Means                                  | Sandbox does                          |
| ----------------------------- | -------------------------------------- | ------------------------------------- |
| `200 { result: "stored" }`    | in Redis                               | drops it                              |
| `200 { result: "duplicate" }` | a retry that already landed            | drops it                              |
| `200 { result: "refused" }`   | over the 2MB cap, or seq too far ahead | drops it                              |
| `200 { result: "ignored" }`   | the report named nothing               | drops it                              |
| `4xx`                         | the report itself is malformed         | gives up — a resend fails identically |
| `503` / no response           | this side failed                       | re-sends **the same seq**             |

Retries happen inline in the tool call, not in a background queue. The MCP server has no reliable
shutdown hook, so a queue would lose whatever was unflushed when the agent process exits — and
that tail is exactly where failures cluster. Inline costs the agent a few hundred milliseconds on
the rare failure and nothing on the happy path.

After three attempts the tool gives up and returns `"not recorded"`. Logging is not the work; a
run whose logging is degraded should still solve its issue.

Note the `path`: it stays absolute the whole way down. The old stdout parser stripped the
`/home/user/repo/` prefix with a `repo_relative()` helper; the tool path does not, so the UI
renders the full sandbox path. Fixing it is one line in `to_run_log_event`.

---

## Shared contract

`packages/types/logs/run-log.contract.ts` is imported by every app in the pipeline. It owns the
event shape, the Redis key names, the object keys, and every cap.

```
RunLogEventKind    phase · thought · file_read · file_write · search
                   command · command_failed · notice · failure

RunLogEventBody    discriminated union on `kind`
RunLogEvent        RunLogEventBody & { seq, ts, phase }
RunLogPage         { runId, state, events, cursor: number | null,
                     droppedEvents, truncated }

keys   run_log_cache_key(run)        run:logs:{id}
       run_log_meta_key(run)         run:logs:{id}:meta
       RUN_LOG_CACHE_INDEX_KEY       run:logs:index
       run_log_segment_key(p,r,seq)  run-logs/{p}/{r}/000000001.ndjson.gz
       run_log_object_key(p,r)       run-logs/{p}/{r}.ndjson.gz
       project_channel_name(p)       project:{id}

caps   PATH 512 · COMMAND 512 · NOTICE 1000 · FAILURE_OUTPUT 2048
       MAX_BYTES 2MB · HOT_EVENT_LIMIT 5000 · ARCHIVE_CAP 20000
```

`seq` is a per-run counter assigned **inside the sandbox**. It is the cursor, the sorted-set
score, the dedupe key, the segment filename, and the unit of acknowledgement — one number doing
all five jobs. It lives in the sandbox because that is where a retry originates: an event that
goes out twice has to carry the same identity both times, or it lands twice.

---

## Write path

From the agent's tool call to the Redis cache.

```
SANDBOX ── untrusted, runs the target project's code
│
├ agent  (claude · codex · opencode)
│    │ calls report_progress after each action
│    ▼
├ packages/sandbox-mcp/src/index.ts
│    WorkerMcpServerService
│      .register_tools()              registers report_progress
│      .report_progress(args) ────────┐  never throws, never blocks the agent
│                                     │
└ packages/sandbox-mcp/src/run-log.tool.ts
     report_progress_schema           kind + path/mode/pattern/command/output/text
     to_run_log_event(args) ──────────┘        ◄── TRIM #1, inside the sandbox
       head(path,      512)                        drops fields the kind doesn't carry
       head(command,   512)                        returns null on an empty report
       tail(output,  2 048)                        keeps the END of a failure
     deliver_run_log(vm, token, {run_id, seq, event})
       3 attempts · 200ms → 400ms · same seq every time
       retries 5xx and network only — a 4xx body fails identically
                     │
                     ▼   POST ${MATCHA_VM_URL}/run-logs  { run_id, seq, event }
═════════════════════╪═══════════════ trust boundary ═════════════════════════
                     ▼
VM WORKER ── :4100, reachable by sandboxes only, never by a browser
│
├ apps/vm/src/http/server.run_logs.ts        ◄ start_run_log_server() from index.ts
│    handle_run_log(request)
│      bearer(request)                              401  no token
│      body_schema.safeParse()                      400  malformed
│      RunLogRegistry.resolve(run_id, token)        404  not this worker's run
│      await writer.write(Agent, seq, event)        400  unsupported kind
│                                                   503  write failed → retry
│                     │
├ apps/vm/src/services/service.run_log_registry.ts
│    RunLogRegistry
│      .register(run_id, writer, token)    ◄ services.e2b.ts, on run start
│      .resolve(run_id, token)               membership IS the authorization
│      .release(run_id)                    ◄ services.e2b.ts, on finish AND on throw
│                     │
├ apps/vm/src/services/service.run_log_writer.ts
│    RunLogWriter                                  holds NO state between calls
│      .open(run_id, owner, secrets, log)
│      .write(phase, seq, event)
│         reported_event_schema.safeParse()       ◄ 6 kinds only — an agent cannot
│                                                   claim a phase or a failure
│         .sanitize(body) → .clean() / .tail()    ◄── TRIM #2 + redact(secrets)
│         await RunLogCache.append(...)           ◄── the ack waits on this
│         render_event(body, phase) ──► terminal    (service.run_log_render.ts)
│                     │
└ apps/vm/src/services/service.run_log_cache.ts    (redis() ← service.redis.ts)
     RunLogCache.append(run_id, owner, event)
       HMGET   meta seq, bytes            seq <= highest        → "duplicate"
       │                                  seq > highest+10 000  → "refused"
       │                                  bytes >= 2MB          → "refused"
       ZADD    run:logs:{id}   score=seq  ◄── the cache
       HSET    run:logs:{id}:meta         projectId, issueId, seq, bytes
       HINCRBY received
       SADD    run:logs:index  run_id     ◄── how guards discovers the run
       EXPIRE  both, 6h
       PUBLISH project:{projectId}        RUN_LOG_APPENDED { events, cursor }
                                          → "stored"
```

### Why the payload is capped twice

`to_run_log_event` trims inside the sandbox so a whole file or a megabyte of build output never
reaches the network. `RunLogShipper.sanitize` trims again on arrival, because that sandbox is
running the target project's own code — nothing it reports about its own size is a bound this
side can rely on. The second pass also runs `redact(secrets)`.

### Why the writer holds nothing

The vm worker used to buffer for 750ms and flush in batches, which was right when the source was
a stdout firehose. Tool-call emission produces a few hundred events per run, so batching buys
nothing — and it made the ack a lie: the sandbox was told "stored" while the event sat in worker
memory, and a restart in that window lost events the sandbox had already forgotten.

The write is now synchronous and the response carries its outcome. `service.redis.ts` sets a
2s `commandTimeout` so a slow Redis fails the request rather than holding the agent open.

### Why the agent cannot report every kind

`reported_event_schema` accepts only `file_read`, `file_write`, `search`, `command`,
`command_failed` and `notice`. Phase transitions and run failures are what the worker observed,
so an agent cannot claim a phase it never reached or hide a failure that happened.

---

## Flush path

Guards moves finished slices out of Redis and into object storage. It runs there, not on the API
server or the vm worker, so the cost of compressing and uploading lands on the process with
nothing else to serve.

```
GUARDS ── apps/guards/src/index.ts    setInterval(RunLogFlusher.sweep, 15_000)
│
└ apps/guards/src/services/service.run_log_flusher.ts
     RunLogFlusher
       .sweep()                        re-entrancy guard · no-op if S3 unconfigured
         SMEMBERS run:logs:index
         └ .flush_run(run_id)          per run, errors isolated per run
             .read_meta(run_id)        HGETALL → projectId, flushed, segments,
             │                                   received, dropped, sizeBytes
             ZRANGEBYSCORE  (flushed  +inf  LIMIT 0 5000
             │
             ├ .write_segment(run_id, meta, payloads)
             │    gzipSync(payloads.join("\n"))
             │    StorageService.put_run_log_segment(run_log_segment_key(...))
             │    ZREMRANGEBYSCORE -inf lastSeq     ◄── deletes from the cache
             │    HSET flushed · HINCRBY segments, sizeBytes
             │
             ├ .is_finished(run_id)    prisma agentSession.status !== Running
             │
             └ .finalize(run_id, meta) only when finished AND zset drained
                  .combine_segments()
                     list_run_log_segments(prefix) → read each → Buffer.concat
                     put_run_log_segment(run_log_object_key(p, run))
                     remove_run_log_segments(keys)
                  prisma.agentSession.update
                     logsKey · logsLineCount · logsDroppedLines · logsSizeBytes
                  DEL cache + meta · SREM index
                  PUBLISH project:{id}   RUN_LOG_SEALED
```

### Segments, then one object

While a run is live, each flush writes an immutable segment and deletes what it wrote from the
cache. Segment filenames are the zero-padded first `seq`, so the object store's lexicographic
listing is already sequence order.

At finalize the segments are concatenated into a single `run-logs/{p}/{r}.ndjson.gz` and the
parts are deleted. Joining gzipped segments needs no re-compression — gzip is defined over
concatenated members, so the joined bytes stay a valid archive. The final object is a sibling of
the segment prefix, not a member of it, so listing the prefix never returns the archive itself.

---

## Read path

```
API SERVER ── the only side a browser touches
│
├ apps/server/src/real-time/run-log.handler.ts
│    RunLogSocketHandler
│      .target_run(message)              routes RUN_LOG_APPENDED / _SEALED
│      .belongs_to_project(run, proj)    subscribe-time authz
│         ▲ subscriber picks up the PUBLISH from vm worker / guards
│
├ apps/server/src/controllers/issues/controller.get_run_logs.ts
│    readable_run(run_id, user_id)       Access.project + project.read
│    RunLogsGetController
│      .process()      → RunLogService.read_page(run, session.logsKey, cursor, limit)
│      .state(running, found, logsKey)   → Live | Sealed | Absent
│
├ apps/server/src/services/service.run-logs.ts
│    RunLogService.read_page(run_id, sealed_key, cursor, limit)
│      .cached_run(run_id)     HMGET meta projectId, segments, dropped
│      .read_cache(...)        ZRANGEBYSCORE (cursor +inf LIMIT 0 limit
│      .read_archived(...)     only when cursor === null
│         live    → StorageService.read_run_log_archive(prefix)    N segments
│         sealed  → StorageService.read_run_log(logsKey)           1 object
│      .decode() → gunzipSync → .parse()
│      [...archived, ...recent] · cap 20 000 · cursor = last seq
│
└ apps/server/src/controllers/issues/controller.download_run_logs.ts
     StorageService.signed_run_log_url(session.logsKey)     presigned, 15m
                     │
                     ▼
WEB
│
├ apps/web/hooks/runLogs/useRunLogs.ts
│    useRunLogs(runId, isSocketConnected)     React Query + RUN_LOG_SUBSCRIBE
│    append_run_log_events(qc, runId, events, cursor)   ◄ lib/socket.handlers.ts
│    seal_run_log(qc, runId, droppedEvents)             ◄ lib/socket.handlers.ts
│
├ apps/web/hooks/runLogs/runLogCache.ts
│    mergeRunLogEvents()      dedupe by seq · sort · cap 20 000
│    appendToRunLogPage() · mergeRunLogPage() · sealRunLogPage()
│
└ apps/web/components/playground/Issue/logs/
     RunLogStream.tsx      virtualized list · describe(event) per kind
     runLog.registry.ts    EVENT_GLYPH · EVENT_COLOR · PHASE_COLOR · PHASE_LABEL
```

### Why the first page reads two sources

Guards deletes flushed events from the cache mid-run, so a live run is split: the newest events
are in Redis, earlier ones are already archived. `read_page` joins both when `cursor === null`.
Later pages only ever touch the cache, because the cursor has already passed everything the
archive holds.

---

## Redis keys

| Key                  | Type       | Contents                                                                                          |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `run:logs:{id}`      | sorted set | member = event JSON, score = `seq`                                                                |
| `run:logs:{id}:meta` | hash       | `projectId`, `issueId`, `seq`, `bytes`, `received`, `dropped`, `flushed`, `segments`, `sizeBytes` |
| `run:logs:index`     | set        | run ids with unflushed events                                                                     |
| `project:{id}`       | pub/sub    | `RUN_LOG_APPENDED`, `RUN_LOG_SEALED`                                                              |

Both per-run keys carry a 6h TTL as a backstop, so a run whose worker dies cannot leak them.

A sorted set rather than a stream: `seq` as the score makes dedupe free (re-adding a seq is
idempotent), the cursor a plain number, and trimming after a flush one `ZREMRANGEBYSCORE`.

---

## Object storage

```
run-logs/{projectId}/{runId}/000000001.ndjson.gz   segments, while the run is live
run-logs/{projectId}/{runId}/000004821.ndjson.gz
run-logs/{projectId}/{runId}.ndjson.gz             one object, once it ends
```

Bodies are gzipped NDJSON, one `RunLogEvent` per line, written with
`Content-Type: application/x-ndjson` and `Content-Encoding: gzip`.

---

## Configuration

| Variable                                           | Used by            | Notes                                                                                     |
| -------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `SERVER_VM_HTTP_PORT`                              | vm                 | listener for sandbox reports, default `4100`                                              |
| `SERVER_VM_PUBLIC_URL`                             | vm                 | injected into the sandbox as `MATCHA_VM_URL`; **must be reachable from inside a sandbox** |
| `SERVER_REDIS_URL`                                 | vm, guards, server | the shared cache                                                                          |
| `SERVER_MINIO_URL` / `_ACCESS_KEY` / `_SECRET_KEY` | guards, server     | object storage                                                                            |
| `SERVER_RUN_LOGS_BUCKET`                           | guards, server     | bucket for the keys above                                                                 |

Per-run env injected into the harness process, inherited by the MCP server it spawns:
`MATCHA_RUN_ID`, `MATCHA_VM_URL`.

If `SERVER_VM_PUBLIC_URL` is unset the MCP tool returns "progress reporting is not configured"
and the run produces no log — with no error anywhere else. That is the first thing to check when
a run comes back empty.

---

## What is lossy

| Failure                               | Cost                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| Agent does not call `report_progress` | that action is absent, permanently                           |
| vm worker restarts mid-run            | nothing in flight — it buffers nothing, and never acks early |
| Sandbox cannot reach the vm worker    | 3 inline retries on the same seq, then that event is lost    |
| Redis slow (>2s) or down              | request fails → sandbox retries → gives up after 3           |
| API server crashes                    | nothing — it holds no run-log state                          |
| Redis crashes                         | ≤1s, AOF `everysec` on a persistent volume                   |
| Guards is down                        | nothing lost; cache grows until the 6h TTL or the 2MB cap    |

The pipeline below the tool call is lossless. The input to it is best-effort, because nothing
observes the agent. If gaps show up in practice, a Claude Code `PostToolUse` hook can post to the
same `/run-logs` endpoint without changing anything downstream — the vm worker does not care
whether a report came from a tool call or a hook.

---

## File map

| Path                                                                 | Role                                        |
| -------------------------------------------------------------------- | ------------------------------------------- |
| `packages/types/logs/run-log.contract.ts`                            | event shape, keys, caps                     |
| `packages/sandbox-mcp/src/run-log.tool.ts`                           | tool schema, trim at source, retry delivery |
| `packages/sandbox-mcp/src/index.ts`                                  | `report_progress` registration, seq counter |
| `apps/vm/src/http/server.run_logs.ts`                                | the `/run-logs` listener                    |
| `apps/vm/src/services/service.run_log_registry.ts`                   | run id + token → writer                     |
| `apps/vm/src/services/service.run_log_writer.ts`                     | validate, re-cap, redact, synchronous write |
| `apps/vm/src/services/service.run_log_cache.ts`                      | ZADD + PUBLISH                              |
| `apps/vm/src/services/service.run_log_render.ts`                     | terminal rendering                          |
| `apps/guards/src/services/service.run_log_flusher.ts`                | the 15s sweep                               |
| `apps/guards/src/services/service.storage.ts`                        | segment put / list / read / remove          |
| `apps/server/src/services/service.run-logs.ts`                       | merged read                                 |
| `apps/server/src/controllers/issues/controller.get_run_logs.ts`      | paged read endpoint                         |
| `apps/server/src/controllers/issues/controller.download_run_logs.ts` | presigned download                          |
| `apps/web/hooks/runLogs/`                                            | React Query cache + socket merge            |
| `apps/web/components/playground/Issue/logs/`                         | the virtualized stream UI                   |
