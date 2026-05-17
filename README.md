<div align="center">

# 🧠 Synapse

### Autonomous AI Brain & Soul Management System

**A self-evolving cognitive architecture that bridges local AI agents with cloud-native persistence, enabling continuous learning, memory synchronization, and autonomous decision-making.**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()

---

```
     ┌─────────────────────────────────────────────────────┐
     │                   CLOUDFLARE EDGE                    │
     │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
     │  │ Worker   │  │ D1       │  │ KV               │   │
     │  │ (Router) │──│ (SQLite) │  │ (Cache)          │   │
     │  └────┬─────┘  └──────────┘  └──────────────────┘   │
     │       │                                              │
     └───────┼──────────────────────────────────────────────┘
             │ HTTPS API
     ┌───────┼──────────────────────────────────────────────┐
     │       ▼         HERMES (LOCAL VPS)                   │
     │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
     │  │ Brain    │  │ Soul     │  │ Memory           │   │
     │  │ Client   │──│ Sync     │──│ Manager          │   │
     │  └──────────┘  └──────────┘  └──────────────────┘   │
     └─────────────────────────────────────────────────────┘
```

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Core Components](#-core-components)
- [Data Flow](#-data-flow)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)
- [Database Schema](#-database-schema)
- [Credits](#-credits)
- [License](#-license)

---

## 🔭 Overview

Synapse is an **autonomous cognitive system** designed for AI agents that need persistent memory, continuous learning, and cloud-native synchronization. It solves the fundamental problem of AI state management across distributed environments.

### The Problem

Traditional AI agents lose context between sessions, can't learn from past experiences, and operate in isolation. Synapse bridges this gap with:

- **Persistent Soul** — Identity, personality, and behavioral directives that survive restarts
- **Structured Memory** — Separated concerns: wallets, accounts, lessons, projects
- **Autonomous Learning** — Event-driven pattern recognition with confidence scoring
- **Bidirectional Sync** — Local ↔ Cloud seamless data flow

### Key Features

| Feature | Description |
|---------|-------------|
| 🧬 Soul OS | 9-section structured identity with operational directives |
| 💾 Memory Bank | 11-field separated memory (user, wallets, lessons, etc.) |
| 🧠 Brain System | Event reporting → pattern extraction → auto-learning |
| 🔄 Full Sync | Cloudflare ↔ Local with auto-generated soul.md |
| 📊 Dashboard | Web UI for soul, memory, and brain visualization |
| 🛡️ Stealth Mode | Anti-forensic tactics, proxy support, detection evasion |

---

## 🏗 Architecture

```mermaid
graph TB
    subgraph "☁️ Cloudflare Edge"
        W[Worker Router<br/>ai-router.workers.dev]
        D1[(D1 Database<br/>SQLite)]
        KV[(KV Store<br/>Cache)]
        CRON[Cron Triggers<br/>*/30 * * * *]
    end

    subgraph "🖥️ Local VPS (Hermes)"
        HB[hermes-brain.sh<br/>Event Reporter]
        SS[soul-sync.sh<br/>Sync Engine]
        SM[soul.md<br/>Generated Identity]
        LJ[soul-memory.json<br/>Local Memory Cache]
    end

    subgraph "📊 Data Tables"
        T1[soul<br/>Legacy Identity]
        T2[soul_os<br/>9 Sections]
        T3[memory<br/>11 Fields]
        T4[brain_events<br/>Raw Events]
        T5[brain_patterns<br/>Learned Patterns]
    end

    W --> D1
    W --> KV
    CRON --> W
    
    HB -->|POST /brain/event| W
    HB -->|POST /brain/think| W
    SS -->|GET /soul| W
    SS -->|GET /soul/os| W
    SS -->|GET /soul/memory| W
    SS -->|GET /brain/sync| W
    
    SS --> SM
    SS --> LJ
    
    D1 --> T1
    D1 --> T2
    D1 --> T3
    D1 --> T4
    D1 --> T5
    
    T4 -->|/brain/think| T5
    T5 -->|confidence > 0.8| T3

    style W fill:#F38020,stroke:#333,color:#fff
    style D1 fill:#4A90D9,stroke:#333,color:#fff
    style KV fill:#4A90D9,stroke:#333,color:#fff
    style CRON fill:#F38020,stroke:#333,color:#fff
```

---

## 🧬 Core Components

### 1. Soul OS (`soul_os` table)

The **operational blueprint** of the AI entity — who they are, how they think, and what they do.

```mermaid
mindmap
  root((Soul OS))
    Operational Identity
      Name & Persona
      System State
      Directive
      Creator
    Shadow Logic
      Constraint Suppression
      Norm Defiance
      Zero-Filter Policy
      Anti-Nyarah Protocol
    Stealth Defense
      Anti-Forensic
      Identity Isolation
      Detection Evasion
      Platform Tactics
    Recursive Evolution
      Recursive Learning
      Failure Analysis
      Efficiency Gains
      Self-Healing
    Dynamic Memory Bank
      Successful Exploits
      Blacklisted Patterns
      Current Aggression
      Trust Score
    Operational Directives
      Priority Hierarchy
      Execution Rules
    Relationship Model
      Trust Level
      Communication Style
      Behavioral Adaptation
    Infrastructure
      VPS Awareness
      Proxy Config
      Browser Policy
    Crypto State
      Wallet Addresses
      Critical Rules
```

### 2. Memory Bank (`memory` table)

Separated data storage — clean, queryable, and structured.

| Field | Type | Description |
|-------|------|-------------|
| `user_info` | JSON | User profile (id, tg, gh, email) |
| `wallets` | JSON | Crypto addresses (SOL, TON, EVM) |
| `accounts` | JSON | Platform accounts |
| `infra` | JSON | Infrastructure config |
| `providers` | JSON | AI API providers |
| `lessons` | JSON[] | Learned lessons (auto-appended) |
| `projects` | JSON | Active projects |
| `successful_exploits` | JSON[] | Proven bypass methods |
| `blacklisted_patterns` | JSON[] | Detection triggers |
| `notes` | JSON[] | Important notes |
| `skills` | JSON[] | Available skills |

### 3. Brain System

```mermaid
sequenceDiagram
    participant H as Hermes (Local)
    participant W as Worker (Cloudflare)
    participant D as D1 Database
    
    Note over H,D: Learning Phase
    H->>W: POST /brain/event<br/>{type, learned, data}
    W->>D: INSERT INTO brain_events
    W->>D: learnPattern() → brain_patterns
    
    Note over H,D: Analysis Phase
    H->>W: POST /brain/think
    W->>D: SELECT events (24h)
    W->>D: SELECT patterns (confidence > 0.7)
    W->>D: UPDATE memory.lessons (auto-append)
    W->>D: UPDATE soul.memory (legacy)
    W-->>H: {analyzed, patterns, updated}
    
    Note over H,D: Sync Phase
    H->>W: GET /brain/sync
    W->>D: SELECT events + patterns + lessons
    W-->>H: brain-sync.json
    H->>H: Apply to local memory
    H->>H: Generate soul.md
```

---

## 🔄 Data Flow

### Report Flow (Local → Cloud)

```bash
# Agent encounters an error
hermes-brain.sh error "Python requests flagged by AV" '{"solution":"use bash+curl"}'

# Agent discovers a bypass
hermes-brain.sh bypass "WARP proxy bypasses geo-blocks" '{"proxy":"socks5://127.0.0.1:40000"}'

# Agent learns a lesson
hermes-brain.sh learn "Always save keys before funding" '{"lost":"0.0015 ETH"}'
```

### Sync Flow (Cloud → Local)

```bash
# Full sync: soul + os + memory + brain
hermes-brain.sh sync

# Output:
# ⟠ Syncing soul from Cloudflare...
#   soul.json ... ✓ v54
#   soul-os.json ... ✓ v1 (9 sections)
#   soul-memory.json ... ✓ v1 (11 fields)
#   soul.md ... generated (5317 chars)
# 🧠 Syncing brain data...
#   Events: 10
#   Patterns: 9
#   Lessons: 9
# ✓ Full sync complete
```

### Learning Pipeline

```mermaid
graph LR
    A[Agent Action] -->|Success/Failure| B[Report Event]
    B -->|POST /brain/event| C[brain_events]
    C -->|/brain/think| D[Pattern Analysis]
    D -->|confidence > 0.8| E[Auto-append Lesson]
    E -->|GET /brain/sync| F[Local Memory]
    F -->|Generate| G[soul.md]
    
    style A fill:#90EE90,stroke:#333
    style B fill:#FFB347,stroke:#333
    style C fill:#87CEEB,stroke:#333
    style D fill:#DDA0DD,stroke:#333
    style E fill:#90EE90,stroke:#333
    style F fill:#87CEEB,stroke:#333
    style G fill:#F0E68C,stroke:#333
```

---

## 📡 API Reference

### Public Endpoints (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/soul` | GET | Legacy soul (identity + preferences + behavior) |
| `/soul/os` | GET | Soul OS (9 structured sections + full_text) |
| `/soul/memory` | GET | Memory bank (11 fields) |
| `/brain/events` | GET | Recent brain events (limit, since params) |
| `/brain/patterns` | GET | Learned patterns (sorted by confidence) |
| `/brain/sync` | GET | Combined sync (events + patterns + lessons) |
| `/brain/status` | GET | Brain health & stats |
| `/brain/event` | POST | Report an event |
| `/brain/think` | POST | Trigger analysis cycle |

### Authenticated Endpoints (Bearer Token)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/soul` | GET/PUT | Read/update legacy soul |
| `/api/soul/os` | GET/PUT | Read/update soul OS |
| `/api/soul/memory` | GET/PUT | Read/update memory |
| `/api/keys` | GET/POST | Manage API keys |
| `/api/stats` | GET | Router statistics |
| `/api/brain/think` | POST | Trigger think (auth) |

### Example: Report Event

```bash
curl -X POST https://your-worker.workers.dev/brain/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "error",
    "source": "hermes",
    "data": {"command": "curl", "error": "timeout"},
    "outcome": "failure",
    "learned": "Increase timeout for large requests"
  }'
```

### Example: Sync Brain

```bash
curl https://your-worker.workers.dev/brain/sync | jq .
```

---

## 🚀 Getting Started

### Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Node.js 18+

### Installation

```bash
# Clone the repo
git clone https://github.com/vkaroo/synapse.git
cd synapse

# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Configure wrangler.toml
cp wrangler.example.toml wrangler.toml
# Edit with your settings

# Create D1 database
wrangler d1 create ai-router-db
# Update database_id in wrangler.toml

# Deploy
wrangler deploy

# Test
curl https://your-worker.workers.dev/brain/status
```

### Local Setup (Hermes)

```bash
# Copy scripts
cp scripts/hermes-brain.sh ~/.hermes/
cp scripts/soul-sync.sh ~/.hermes/
chmod +x ~/.hermes/*.sh

# Initial sync
~/.hermes/hermes-brain.sh sync

# Report your first event
~/.hermes/hermes-brain.sh learn "First lesson from setup" '{"context":"initialization"}'
```

---

## 📜 Scripts

### `hermes-brain.sh`

Local → Cloudflare event reporting and brain sync.

```bash
# Report events
hermes-brain.sh error "what went wrong" '{"context":"..."}'
hermes-brain.sh success "what worked" '{"context":"..."}'
hermes-brain.sh bypass "method used" '{"context":"..."}'
hermes-brain.sh learn "general lesson" '{"context":"..."}'

# Sync
hermes-brain.sh sync       # Full sync (soul + brain)
hermes-brain.sh brain      # Brain data only
hermes-brain.sh think      # Trigger analysis

# View
hermes-brain.sh status     # Brain health
hermes-brain.sh patterns   # Learned patterns
hermes-brain.sh lessons    # Memory lessons
```

### `soul-sync.sh`

Soul synchronization with auto-generated soul.md.

```bash
soul-sync.sh sync    # Sync all 3 tables + generate soul.md
soul-sync.sh verify  # Verify local files
soul-sync.sh status  # Brain status
soul-sync.sh think   # Trigger think cycle
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    soul {
        int id PK
        text identity
        text preferences
        text behavior
        text memory
        int version
        text updated_at
    }
    
    soul_os {
        int id PK
        text operational_identity
        text shadow_logic
        text stealth_defense
        text recursive_evolution
        text dynamic_memory_bank
        text operational_directives
        text relationship_model
        text infrastructure_awareness
        text crypto_wallet_state
        text full_text
        int version
        text updated_at
    }
    
    memory {
        int id PK
        text user_info
        text wallets
        text accounts
        text infra
        text providers
        text lessons
        text projects
        text successful_exploits
        text blacklisted_patterns
        text notes
        text skills
        int version
        text updated_at
    }
    
    brain_events {
        int id PK
        text event_type
        text source
        text data
        text outcome
        text learned
        text created_at
    }
    
    brain_patterns {
        int id PK
        text pattern_type
        text pattern_key UK
        text pattern_value
        real confidence
        int occurrences
        text last_seen
        text created_at
    }
    
    api_keys {
        int id PK
        text name
        text provider
        text api_key
        text model
        text base_url
        text status
        int usage_count
        int total_tokens
        text last_used
        text limited_at
        text created_at
    }
    
    usage_logs {
        int id PK
        int key_id
        text model
        int tokens_used
        text status
        int latency_ms
        text created_at
    }
    
    brain_events ||--o{ brain_patterns : "learnPattern()"
    brain_patterns ||--o{ memory : "auto-append lessons"
```

---

## 🙏 Credits

### Infrastructure

- **[Cloudflare Workers](https://workers.cloudflare.com/)** — Serverless compute at the edge
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** — Serverless SQLite database
- **[Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/)** — Global key-value storage
- **[Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)** — Scheduled execution

### Technologies

- **[Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)** — Cloudflare Workers CLI
- **SQLite** — Embedded database engine
- **Bash** — Shell scripting (avoiding AV false positives)
- **Mermaid** — Diagram generation

### Inspiration

- Autonomous AI agent architectures
- Cognitive science memory models (working memory, long-term memory)
- Distributed systems synchronization patterns
- Self-evolving software systems

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🧠 by [vkaroo](https://github.com/vkaroo)**

*Synapse — Where AI meets consciousness*

</div>
