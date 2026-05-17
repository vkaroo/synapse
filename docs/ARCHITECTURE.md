# Architecture

## System Overview

Synapse is a distributed cognitive system with two primary components:

1. **Cloudflare Edge** — Worker + D1 + KV (brain & soul storage)
2. **Local VPS** — Hermes agent (execution & reporting)

## Data Flow

### Report Flow (Local → Cloud)

```
Agent executes task
    ↓
Success/Failure detected
    ↓
hermes-brain.sh report <type> <learned> [data]
    ↓
POST /brain/event → D1 (brain_events)
    ↓
learnPattern() → D1 (brain_patterns)
```

### Sync Flow (Cloud → Local)

```
hermes-brain.sh sync
    ↓
GET /soul/os → soul-os.json (9 sections)
GET /soul/memory → soul-memory.json (11 fields)
GET /brain/sync → brain-sync.json (events + patterns + lessons)
    ↓
Merge brain insights into local memory
    ↓
Generate soul.md from full_text
```

### Learning Pipeline

```
brain_events (raw events)
    ↓ /brain/think
brain_patterns (extracted patterns)
    ↓ confidence > 0.8
memory.lessons (auto-appended)
    ↓ sync
soul-memory.json (local cache)
    ↓ generate
soul.md (human-readable)
```

## Database Design

### Separation of Concerns

- **soul** — Legacy identity table (backward compatible)
- **soul_os** — 9-section structured soul (primary)
- **memory** — 11-field data bank (separated from soul)
- **brain_events** — Raw event log
- **brain_patterns** — Learned patterns with confidence

### Versioning

Every table has a `version` integer and `updated_at` timestamp for conflict resolution during sync.

## Security

- API endpoints require Bearer token authentication
- Public endpoints for sync (read-only)
- No secrets stored in code (use .env or Wrangler secrets)
