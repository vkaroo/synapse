#!/bin/bash
# Soul Sync v2 - Sync all 3 tables from Cloudflare to Hermes
# Generates soul.md from soul_os full_text to avoid conflicts
# Uses curl (not Python) to avoid Tencent AV false positives

BRAIN_URL="https://ai-router.jembatanhitam666.workers.dev"
SOUL_DIR="/root/.hermes"
SOUL_JSON="$SOUL_DIR/soul.json"
SOUL_OS_JSON="$SOUL_DIR/soul-os.json"
SOUL_MEMORY_JSON="$SOUL_DIR/soul-memory.json"
SOUL_MD="$SOUL_DIR/soul.md"
SOUL_CACHE="$SOUL_DIR/soul-cache.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

sync() {
    echo -e "${YELLOW}⟠ Syncing soul from Cloudflare...${NC}"
    
    local ok=0
    local fail=0
    
    # 1. Sync soul.json (identity + preferences + behavior)
    echo -n "  soul.json ... "
    if curl -sf "${BRAIN_URL}/soul" -o "$SOUL_JSON" 2>/dev/null; then
        local ver=$(python3 -c "import json; print(json.load(open('$SOUL_JSON')).get('version','?'))" 2>/dev/null)
        echo -e "${GREEN}✓ v${ver}${NC}"
        ok=$((ok+1))
    else
        echo -e "${RED}✗ failed${NC}"
        fail=$((fail+1))
    fi
    
    # 2. Sync soul-os.json (SOUL_OS structured sections)
    echo -n "  soul-os.json ... "
    if curl -sf "${BRAIN_URL}/soul/os" -o "$SOUL_OS_JSON" 2>/dev/null; then
        local ver=$(python3 -c "import json; print(json.load(open('$SOUL_OS_JSON')).get('version','?'))" 2>/dev/null)
        local sections=$(python3 -c "import json; d=json.load(open('$SOUL_OS_JSON')); print(len([k for k in d if k not in ['version','updated_at','full_text']]))" 2>/dev/null)
        echo -e "${GREEN}✓ v${ver} (${sections} sections)${NC}"
        ok=$((ok+1))
    else
        echo -e "${RED}✗ failed${NC}"
        fail=$((fail+1))
    fi
    
    # 3. Sync soul-memory.json (memory bank)
    echo -n "  soul-memory.json ... "
    if curl -sf "${BRAIN_URL}/soul/memory" -o "$SOUL_MEMORY_JSON" 2>/dev/null; then
        local ver=$(python3 -c "import json; print(json.load(open('$SOUL_MEMORY_JSON')).get('version','?'))" 2>/dev/null)
        local fields=$(python3 -c "import json; d=json.load(open('$SOUL_MEMORY_JSON')); print(len([k for k in d if k not in ['version','updated_at']]))" 2>/dev/null)
        echo -e "${GREEN}✓ v${ver} (${fields} fields)${NC}"
        ok=$((ok+1))
    else
        echo -e "${RED}✗ failed${NC}"
        fail=$((fail+1))
    fi
    
    # 4. Generate soul.md from soul-os full_text (source of truth = Cloudflare)
    echo -n "  soul.md ... "
    python3 -c "
import json
d = json.load(open('$SOUL_OS_JSON'))
text = d.get('full_text', '')
if text:
    with open('$SOUL_MD', 'w') as f:
        f.write(text)
    print(f'generated ({len(text)} chars)')
else:
    print('no full_text in soul-os.json')
" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "  soul.md ${GREEN}✓ generated from full_text${NC}"
        ok=$((ok+1))
    else
        echo -e "  soul.md ${RED}✗ failed to generate${NC}"
        fail=$((fail+1))
    fi
    
    echo ""
    echo -e "${CYAN}Sync complete: ${ok} ok, ${fail} failed${NC}"
    
    if [ $fail -gt 0 ]; then
        return 1
    fi
    return 0
}

status() {
    echo -e "${CYAN}🧠 Brain Status${NC}"
    curl -s "${BRAIN_URL}/brain/status" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f\"  Status: {d.get('status', 'unknown')}\")
    print(f\"  Health: {d.get('brain_health', 'unknown')}\")
    print(f\"  Events: {d.get('events_total', 0)}\")
    print(f\"  Patterns: {d.get('patterns_total', 0)}\")
    print(f\"  Soul: v{d.get('soul_version', 0)}\")
except:
    print('  Error: Failed to get status')
" 2>/dev/null
}

report() {
    local event_type="${1:-unknown}"
    local data="${2:-{}}"
    local learned="${3:-}"
    
    curl -s -X POST "${BRAIN_URL}/brain/event" \
        -H "Content-Type: application/json" \
        -d "{\"event_type\":\"${event_type}\",\"source\":\"hermes\",\"data\":${data},\"outcome\":\"success\",\"learned\":\"${learned}\"}" \
        > /dev/null 2>&1
    
    echo -e "${GREEN}✓ Event reported: ${event_type}${NC}"
}

think() {
    echo -e "${YELLOW}🧠 Thinking...${NC}"
    curl -s -X POST "${BRAIN_URL}/brain/think" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(f\"  Analyzed: {d.get('analyzed', 0)} events\")
    print(f\"  Patterns: {d.get('patterns_found', 0)}\")
    print(f\"  Soul Updated: {d.get('soul_updated', False)}\")
except:
    print('  Error: Failed to think')
" 2>/dev/null
}

patterns() {
    echo -e "${CYAN}🔮 Learned Patterns${NC}"
    curl -s "${BRAIN_URL}/brain/patterns" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    patterns = d.get('patterns', [])
    print(f'  Total: {len(patterns)}')
    for p in patterns[:5]:
        val = json.loads(p.get('pattern_value', '{}'))
        learned = val.get('learned', 'Unknown')
        conf = p.get('confidence', 0)
        print(f'  ● [{p.get(\"pattern_type\")}] {learned[:60]}')
        print(f'    Confidence: {conf:.0%} | Occurrences: {p.get(\"occurrences\", 1)}')
except:
    print('  Error: Failed to get patterns')
" 2>/dev/null
}

verify() {
    echo -e "${CYAN}🔍 Verifying sync...${NC}"
    echo ""
    
    for f in "$SOUL_JSON" "$SOUL_OS_JSON" "$SOUL_MEMORY_JSON"; do
        local name=$(basename "$f")
        if [ -f "$f" ]; then
            local size=$(wc -c < "$f")
            local ver=$(python3 -c "import json; print(json.load(open('$f')).get('version','?'))" 2>/dev/null)
            echo -e "  ${GREEN}✓${NC} $name (${size}B, v${ver})"
        else
            echo -e "  ${RED}✗${NC} $name missing"
        fi
    done
    
    if [ -f "$SOUL_MD" ]; then
        local lines=$(wc -l < "$SOUL_MD")
        local size=$(wc -c < "$SOUL_MD")
        echo -e "  ${GREEN}✓${NC} soul.md (${lines} lines, ${size}B)"
    else
        echo -e "  ${RED}✗${NC} soul.md missing"
    fi
}

case "${1:-help}" in
    status)
        status
        ;;
    sync)
        sync
        ;;
    report)
        report "$2" "$3" "$4"
        ;;
    think)
        think
        ;;
    patterns)
        patterns
        ;;
    verify)
        verify
        ;;
    auto)
        interval="${2:-300}"
        echo -e "${CYAN}Starting auto-sync every ${interval}s...${NC}"
        while true; do
            sync
            think
            sleep "$interval"
        done
        ;;
    *)
        echo -e "${CYAN}🧠 Soul Sync v2${NC}"
        echo ""
        echo "Commands:"
        echo "  status    - Check brain status"
        echo "  sync      - Sync ALL from Cloudflare (soul + os + memory → soul.md)"
        echo "  verify    - Verify local files are in sync"
        echo "  report    - Report event (type, data, learned)"
        echo "  think     - Trigger think cycle"
        echo "  patterns  - Show learned patterns"
        echo "  auto [s]  - Auto-sync loop (default 300s)"
        ;;
esac
