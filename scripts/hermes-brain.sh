#!/bin/bash
# Hermes Brain v2 - Local → Cloudflare learning pipeline
# Report events, sync brain data, apply learnings

BRAIN_URL="https://ai-router.jembatanhitam666.workers.dev"
SOUL_DIR="/root/.hermes"
BRAIN_CACHE="$SOUL_DIR/brain-sync.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Report an event to Cloudflare brain
# Usage: hermes-brain.sh report <type> <learned> [data_json] [outcome]
report() {
    local event_type="${1:?Usage: report <type> <learned> [data] [outcome]}"
    local learned="${2:-}"
    local data
    if [ -n "$3" ]; then
        data="$3"
    else
        data='{}'
    fi
    local outcome="${4:-success}"
    
    # Build JSON with printf
    local payload
    payload=$(printf '{"event_type":"%s","source":"hermes","data":%s,"outcome":"%s","learned":"%s"}' \
        "$event_type" "$data" "$outcome" "$learned")
    
    local response
    response=$(curl -s -X POST "${BRAIN_URL}/brain/event" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓${NC} Event reported: [${event_type}] ${learned}"
        return 0
    else
        echo -e "${RED}✗${NC} Failed: ${response}"
        return 1
    fi
}

# Quick report helpers
error()   { report "error"   "$1" "${2:-}" "failure"; }
success() { report "success" "$1" "${2:-}" "success"; }
bypass()  { report "bypass"  "$1" "${2:-}" "success"; }
learn()   { report "lesson"  "$1" "${2:-}" "success"; }

# Sync brain data from Cloudflare to local
sync_brain() {
    echo -e "${YELLOW}🧠 Syncing brain data...${NC}"
    
    curl -s "${BRAIN_URL}/brain/sync" -o "$BRAIN_CACHE" 2>/dev/null
    
    if [ ! -f "$BRAIN_CACHE" ]; then
        echo -e "${RED}✗ Failed to sync brain${NC}"
        return 1
    fi
    
    python3 -c "
import json
with open('$BRAIN_CACHE') as f:
    d = json.load(f)
print(f\"  Events: {len(d.get('events',[]))}\")
print(f\"  Patterns: {len(d.get('patterns',[]))}\")
print(f\"  Lessons: {len(d.get('memory',{}).get('lessons',[]))}\")
" 2>/dev/null
    echo -e "${GREEN}✓${NC} Brain synced"
}

# Full sync: soul + os + memory + brain
full_sync() {
    echo -e "${YELLOW}⟠ Full sync from Cloudflare...${NC}"
    echo ""
    
    # 1. Soul sync
    /root/.hermes/soul-sync.sh sync
    echo ""
    
    # 2. Brain sync
    sync_brain
    echo ""
    
    # 3. Apply brain to local memory
    echo -n "  Applying brain to local memory... "
    python3 -c "
import json

with open('$BRAIN_CACHE') as f:
    brain = json.load(f)

with open('$SOUL_DIR/soul-memory.json') as f:
    memory = json.load(f)

patterns = brain.get('patterns', [])
high_conf = [p for p in patterns if p.get('confidence', 0) > 0.7]
insights = []
for p in high_conf:
    val = p.get('pattern_value', {})
    if isinstance(val, str):
        val = json.loads(val)
    learned = val.get('learned', '')
    if learned:
        insights.append({
            'pattern': p.get('pattern_key', ''),
            'learned': learned,
            'confidence': p.get('confidence', 0),
            'occurrences': p.get('occurrences', 1)
        })

memory['brain_insights'] = insights
memory['brain_events_count'] = len(brain.get('events', []))
memory['brain_patterns_count'] = len(patterns)
memory['brain_synced_at'] = brain.get('synced_at', '')

brain_lessons = brain.get('memory', {}).get('lessons', [])
existing_lessons = set(memory.get('lessons', []))
for l in brain_lessons:
    if l not in existing_lessons:
        memory.setdefault('lessons', []).append(l)

with open('$SOUL_DIR/soul-memory.json', 'w') as f:
    json.dump(memory, f, indent=2)

print(f'OK ({len(insights)} insights, {len(memory.get(\"lessons\",[]))} lessons)')
" 2>/dev/null
    echo -e "${GREEN}✓ Full sync complete${NC}"
}

# Trigger think cycle
think() {
    echo -e "${YELLOW}🧠 Thinking...${NC}"
    curl -s -X POST "${BRAIN_URL}/brain/think" 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"  Analyzed: {d.get('analyzed', 0)} events\")
print(f\"  Patterns: {d.get('patterns_found', 0)}\")
print(f\"  Soul Updated: {d.get('soul_updated', False)}\")
print(f\"  Memory Updated: {d.get('memory_updated', False)}\")
if d.get('new_lessons'):
    print(f\"  New Lessons: {d.get('new_lessons', 0)}\")
" 2>/dev/null
}

# Show learned patterns
patterns() {
    echo -e "${CYAN}🔮 Learned Patterns${NC}"
    curl -s "${BRAIN_URL}/brain/patterns" 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
patterns = d.get('patterns', [])
print(f'  Total: {len(patterns)}')
for p in patterns[:10]:
    val = p.get('pattern_value', {})
    if isinstance(val, str):
        val = json.loads(val)
    learned = val.get('learned', 'Unknown')
    conf = p.get('confidence', 0)
    occ = p.get('occurrences', 1)
    print(f'  ● [{p.get(\"pattern_type\")}] {learned[:60]}')
    print(f'    Confidence: {conf:.0%} | Occurrences: {occ}')
" 2>/dev/null
}

# Show lessons
lessons() {
    echo -e "${CYAN}📚 Lessons${NC}"
    curl -s "${BRAIN_URL}/soul/memory" 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
lessons = d.get('lessons', [])
print(f'  Total: {len(lessons)}')
for i, l in enumerate(lessons, 1):
    print(f'  {i}. {l}')
" 2>/dev/null
}

# Status
status() {
    echo -e "${CYAN}🧠 Brain Status${NC}"
    curl -s "${BRAIN_URL}/brain/status" 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"  Status: {d.get('status', 'unknown')}\")
print(f\"  Health: {d.get('brain_health', 'unknown')}\")
print(f\"  Events: {d.get('events_total', 0)}\")
print(f\"  Patterns: {d.get('patterns_total', 0)}\")
print(f\"  Soul: v{d.get('soul_version', 0)}\")
" 2>/dev/null
}

case "${1:-help}" in
    report)   report "$2" "$3" "$4" "$5" ;;
    error)    error "$2" "$3" ;;
    success)  success "$2" "$3" ;;
    bypass)   bypass "$2" "$3" ;;
    learn)    learn "$2" "$3" ;;
    sync)     full_sync ;;
    brain)    sync_brain ;;
    think)    think ;;
    patterns) patterns ;;
    lessons)  lessons ;;
    status)   status ;;
    *)
        echo -e "${CYAN}🧠 Hermes Brain v2${NC}"
        echo ""
        echo "REPORT (Local → Cloudflare):"
        echo "  error <learned> [data]    — Report error"
        echo "  success <learned> [data]  — Report success"
        echo "  bypass <method> [data]    — Report bypass"
        echo "  learn <lesson> [data]     — Report lesson"
        echo ""
        echo "SYNC (Cloudflare → Local):"
        echo "  sync      — Full sync (soul + brain)"
        echo "  brain     — Sync brain only"
        echo "  think     — Trigger think cycle"
        echo ""
        echo "VIEW:"
        echo "  status / patterns / lessons"
        ;;
esac
