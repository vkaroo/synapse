# Changelog

All notable changes to Synapse will be documented in this file.

## [1.0.0] - 2026-05-17

### Added
- **Soul OS System** — 9-section structured soul with operational directives
- **Memory Bank** — 11-field separated memory (user, wallets, accounts, etc.)
- **Brain System** — Event-driven learning with pattern extraction
- **Bidirectional Sync** — Local ↔ Cloudflare data flow
- **Auto-learning** — High-confidence patterns auto-append to lessons
- **hermes-brain.sh** — Local event reporter (error/success/bypass/learn)
- **soul-sync.sh v2** — Full sync with auto-generated soul.md
- **Dashboard UI** — Web interface for soul, memory, and brain visualization
- **Public API** — /soul, /soul/os, /soul/memory, /brain/sync endpoints
- **Cron Triggers** — 30-minute brain analysis cycles

### Database Tables
- `soul` — Legacy identity (backward compatible)
- `soul_os` — 9-section structured soul
- `memory` — 11-field separated memory
- `brain_events` — Raw event log
- `brain_patterns` — Learned patterns with confidence scoring
- `api_keys` — API key management
- `usage_logs` — Request logging
- `combos` — Provider fallback chains
- `custom_providers` — Custom API endpoints

### API Endpoints
- `GET /soul` — Legacy soul
- `GET /soul/os` — Soul OS (9 sections)
- `GET /soul/memory` — Memory bank (11 fields)
- `GET /brain/events` — Recent events
- `GET /brain/patterns` — Learned patterns
- `GET /brain/sync` — Combined brain sync
- `GET /brain/status` — Brain health
- `POST /brain/event` — Report event
- `POST /brain/think` — Trigger analysis
- `PUT /api/soul/os` — Update soul OS
- `PUT /api/soul/memory` — Update memory

### Scripts
- `hermes-brain.sh` — Local → Cloud event reporting
- `soul-sync.sh` — Soul synchronization with auto-generated soul.md

---

## [0.1.0] - 2026-05-13

### Added
- Initial AI Router dashboard
- Basic API key management
- Usage logging
- Provider fallback system
