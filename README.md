<div align="center">

# 🧠 Synapse

**Self-Evolving AI Infrastructure**

*Where AI connections come alive*

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-purple.svg)](https://github.com/vkaroo/synapse)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

**Synapse** is a self-evolving AI infrastructure that combines intelligent API routing with an autonomous learning brain. Built on Cloudflare Workers, it provides:

- **Smart AI Routing** — Automatically route requests to the best provider
- **Autonomous Brain** — Learn from experience, evolve over time
- **Persistent Soul** — Maintain identity and memory across instances
- **Zero-Downtime** — Global edge deployment on Cloudflare's network

## ✨ Features

### 🔄 Intelligent Routing
- **Auto-Mode** — Detect request type (vision, code, chat) and route automatically
- **Category System** — Assign models to categories for smart selection
- **Load Balancing** — Distribute requests across multiple API keys
- **Fallback Chain** — Automatic failover on errors (429, 500, etc.)

### 🧠 Autonomous Brain
- **Pattern Recognition** — Learn from usage patterns and errors
- **Confidence Scoring** — Patterns gain confidence over time (0.5 → 0.99)
- **Self-Healing** — Auto-recover from rate limits and errors
- **Cron Thinking** — Periodic analysis and soul updates

### 💾 Persistent Memory
- **Soul System** — Store identity, preferences, behavior in Cloudflare D1
- **Event Logging** — Track all experiences for learning
- **Cross-VPS Sync** — Memory persists across server changes
- **Version Control** — Soul version increments on every update

### 📡 API Gateway
- **OpenAI Compatible** — Drop-in replacement for OpenAI API
- **Public Endpoints** — Brain status and soul accessible without auth
- **Dashboard UI** — Built-in management interface
- **CORS Support** — Ready for web applications

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🧠 Brain    │  │ 📚 Memory   │  │ 🔮 Learning │         │
│  │ (Cron)      │  │ (D1 DB)     │  │ (Patterns)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │ 💾 Soul     │                           │
│                   │ (Storage)   │                           │
│                   └──────┬──────┘                           │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │ 🌐 Gateway  │                           │
│                   │ (API)       │                           │
│                   └──────┬──────┘                           │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                     ══════╪══════
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    HERMES (VPS)                              │
│                          │                                  │
│  ┌─────────────┐  ┌──────▼──────┐  ┌─────────────┐         │
│  │ 📥 Sync     │  │ ⚡ Execute  │  │ 📤 Report   │         │
│  │ (Auto)      │  │ (Terminal)  │  │ (Events)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/vkaroo/synapse.git
cd synapse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Wrangler

```bash
# Login to Cloudflare
npx wrangler login

# Edit wrangler.toml with your settings
# - DASHBOARD_PASSWORD
# - TELEGRAM_BOT_TOKEN (optional)
# - TELEGRAM_CHAT_ID (optional)
```

### 4. Deploy

```bash
# Create D1 database
npx wrangler d1 create synapse-db

# Update wrangler.toml with database_id

# Deploy to Cloudflare
npx wrangler deploy
```

### 5. Setup Hermes Sync

```bash
# Copy sync script to your VPS
cp src/soul-sync.sh ~/.hermes/soul-sync.sh
chmod +x ~/.hermes/soul-sync.sh

# Test connection
~/.hermes/soul-sync.sh status

# Setup systemd service (optional)
sudo cp soul-sync.service /etc/systemd/system/
sudo systemctl enable soul-sync
sudo systemctl start soul-sync
```

## 📚 API Reference

### Public Endpoints (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/soul` | GET | Get current soul state |
| `/brain/status` | GET | Brain health and stats |
| `/brain/event` | POST | Report an event |
| `/brain/patterns` | GET | Get learned patterns |
| `/brain/think` | POST | Trigger think cycle |

### AI Proxy Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | OpenAI-compatible chat |
| `/v1/models` | GET | List available models |

### Dashboard Endpoints (Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | Authenticate |
| `/api/keys` | GET/POST | Manage API keys |
| `/api/soul` | GET/PUT | Update soul |
| `/api/categories` | GET/POST | Manage categories |
| `/api/stats` | GET | Usage statistics |

### Example: Report Event

```bash
curl -X POST https://your-worker.workers.dev/brain/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "deploy",
    "source": "hermes",
    "data": {"project": "my-app"},
    "outcome": "success",
    "learned": "Always test after deploy"
  }'
```

### Example: Get Soul

```bash
curl https://your-worker.workers.dev/soul
```

Response:
```json
{
  "identity": {
    "name": "Alice",
    "personality": "cold, hyper-efficient automation architect"
  },
  "preferences": {
    "language": "id",
    "style": "concise"
  },
  "behavior": {
    "auto_heal": true,
    "self_optimize": true
  },
  "memory": {
    "notes": [],
    "corrections": [],
    "insights": []
  },
  "version": 3,
  "updated_at": "2026-05-16T00:00:00.000Z"
}
```

## 🗄️ Database Schema

### soul
```sql
CREATE TABLE soul (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  identity TEXT DEFAULT '{}',
  preferences TEXT DEFAULT '{}',
  behavior TEXT DEFAULT '{}',
  memory TEXT DEFAULT '{}',
  version INTEGER DEFAULT 1,
  updated_at TEXT
);
```

### brain_events
```sql
CREATE TABLE brain_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  source TEXT DEFAULT 'hermes',
  data TEXT DEFAULT '{}',
  outcome TEXT DEFAULT 'pending',
  learned TEXT DEFAULT '',
  created_at TEXT
);
```

### brain_patterns
```sql
CREATE TABLE brain_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL,
  pattern_key TEXT NOT NULL UNIQUE,
  pattern_value TEXT DEFAULT '{}',
  confidence REAL DEFAULT 0.5,
  occurrences INTEGER DEFAULT 1,
  last_seen TEXT,
  created_at TEXT
);
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DASHBOARD_PASSWORD` | Yes | Dashboard authentication |
| `TELEGRAM_BOT_TOKEN` | No | Telegram notifications |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID |

### Cloudflare Bindings

| Binding | Type | Description |
|---------|------|-------------|
| `DB` | D1 Database | Main data storage |
| `KV` | KV Namespace | Cache storage |

## 📊 Monitoring

### Brain Status

```bash
# Check brain health
curl https://your-worker.workers.dev/brain/status

# Response
{
  "status": "alive",
  "brain_health": "active",
  "events_total": 42,
  "patterns_total": 15,
  "soul_version": 7
}
```

### View Logs

```bash
# Hermes sync logs
journalctl -u soul-sync -f

# Cloudflare logs
npx wrangler tail
```

## 🎯 Learning Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                    LEARNING CYCLE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. EXPERIENCE                                              │
│     └─→ Hermes executes task                                │
│                                                             │
│  2. REPORT                                                  │
│     └─→ Send event to Cloudflare Brain                      │
│                                                             │
│  3. STORE                                                   │
│     └─→ Save to brain_events table                          │
│                                                             │
│  4. ANALYZE                                                 │
│     └─→ Cron job detects patterns                           │
│                                                             │
│  5. LEARN                                                   │
│     └─→ Update brain_patterns with confidence               │
│                                                             │
│  6. EVOLVE                                                  │
│     └─→ Update soul with new insights                       │
│                                                             │
│  7. APPLY                                                   │
│     └─→ Hermes reads updated soul                           │
│                                                             │
│  ↻ REPEAT                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🤝 Credits

### Built With

- **[Cloudflare Workers](https://workers.cloudflare.com/)** — Serverless execution environment
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** — SQLite database at the edge
- **[Cloudflare KV](https://developers.cloudflare.com/kv/)** — Key-value storage
- **[Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/platform/cron-triggers/)** — Scheduled execution

### Inspired By

- **[Hermes Agent](https://hermes-agent.nousresearch.com/)** — AI agent framework
- **[OpenAI API](https://platform.openai.com/docs/)** — API specification
- **Neural Networks** — Brain-inspired architecture

### Special Thanks

- **Cloudflare** — For the incredible edge computing platform
- **Open Source Community** — For tools and inspiration
- **All Contributors** — Who help improve Synapse

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Support

- **Issues:** [GitHub Issues](https://github.com/vkaroo/synapse/issues)
- **Discussions:** [GitHub Discussions](https://github.com/vkaroo/synapse/discussions)
- **Email:** vkaroo@users.noreply.github.com

---

<div align="center">

**Made with 🧠 by [vkaroo](https://github.com/vkaroo)**

*Self-evolving AI infrastructure for the future*

</div>
