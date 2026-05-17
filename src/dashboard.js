export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Router Dashboard</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --bg: #0f1117; --surface: #1a1d27; --border: #2a2d3a; --brand: #e68a6e; --brand2: #d4735a; --text: #e8e8ed; --muted: #8b8fa3; --success: #4ade80; --danger: #f87171; --warning: #fbbf24; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
.login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.login-box { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 40px; width: 360px; text-align: center; }
.login-box h1 { font-size: 24px; margin-bottom: 8px; }
.login-box p { color: var(--muted); margin-bottom: 24px; font-size: 14px; }
.login-box input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 15px; margin-bottom: 16px; outline: none; }
.login-box input:focus { border-color: var(--brand); }
.btn { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; }
.btn-brand { background: var(--brand); color: white; width: 100%; padding: 12px; }
.btn-brand:hover { background: var(--brand2); }
.btn-sm { padding: 6px 14px; font-size: 13px; border-radius: 8px; }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
.btn-outline:hover { border-color: var(--brand); }
.btn-danger { background: var(--danger); color: white; }
.btn-success { background: var(--success); color: #111; }

/* Layout */
.app { display: none; }
.nav { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; display: flex; align-items: center; height: 56px; gap: 24px; }
.nav h1 { font-size: 18px; font-weight: 700; color: var(--brand); }
.nav-links { display: flex; gap: 4px; margin-left: 32px; flex-wrap: nowrap; overflow-x: auto; }
.nav-links button { background: none; border: none; color: var(--muted); cursor: pointer; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; white-space: nowrap; flex: 0 0 auto; line-height: 1.2; }
.nav-links button.active { background: var(--bg); color: var(--text); }
.nav-links button:hover { color: var(--text); }
.nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.content { padding: 24px; max-width: 1200px; margin: 0 auto; }

/* Stats */
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
.stat-card .label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
.stat-card .value.brand { color: var(--brand); }
.stat-card .value.success { color: var(--success); }
.stat-card .value.warning { color: var(--warning); }
.stat-card .value.danger { color: var(--danger); }

/* Table */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.card-header h2 { font-size: 16px; font-weight: 600; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 16px; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,0.02); }
.badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.badge-active { background: rgba(74,222,128,0.15); color: var(--success); }
.badge-limited { background: rgba(251,191,36,0.15); color: var(--warning); }
.badge-dead { background: rgba(248,113,113,0.15); color: var(--danger); }
.badge-provider { background: rgba(230,138,110,0.15); color: var(--brand); }

/* Modal */
.modal-bg { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; }
.modal-bg.show { display: flex; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 420px; max-width: 90vw; }
.modal h2 { margin-bottom: 20px; font-size: 18px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }
.form-group input, .form-group select { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; outline: none; }
.form-group input:focus, .form-group select:focus { border-color: var(--brand); }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; }
.empty { text-align: center; padding: 40px; color: var(--muted); }
.provider-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
</style>
</head>
<body>

<!-- Login -->
<div class="login-wrap" id="loginPage">
  <div class="login-box">
    <h1>🔀 AI Router</h1>
    <p>Key Pool & Smart Fallback</p>
    <input type="password" id="loginPw" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()">
    <button class="btn btn-brand" onclick="doLogin()">Login</button>
    <p id="loginErr" style="color:var(--danger);margin-top:12px;font-size:13px;display:none">Wrong password</p>
  </div>
</div>

<!-- App -->
<div class="app" id="app">
  <nav class="nav">
    <h1>🔀 AI Router</h1>
    <div class="nav-links">
      <button class="active" onclick="showTab('dashboard',this)">Dashboard</button>
      <button onclick="showTab('keys',this)">API Keys</button>
      <button onclick="showTab('logs',this)">Logs</button>
      <button onclick="showTab('combos',this)">Fallback</button>
      <button onclick="showTab('providers',this)">Providers</button>
      <button onclick="showTab('endpoint',this)">Endpoint</button>
      <button onclick="showTab('soul',this)">🧠 Soul</button>
      <button onclick="showTab('brain',this)">🔮 Brain</button>
      <button onclick="showTab('memory',this)">💾 Memory</button>
    </div>
    <div class="nav-right">
      <span style="display:none" id="workerUrl"></span>
      <button class="btn btn-sm btn-outline" onclick="logout()">Logout</button>
    </div>
  </nav>

  <div class="content">
    <!-- Dashboard Tab -->
    <div id="tab-dashboard">
      <div class="stats" id="statsGrid"></div>
      <div class="card">
        <div class="card-header"><h2>By Provider</h2></div>
        <table><thead><tr><th>Provider</th><th>Keys</th><th>Requests</th><th>Tokens</th></tr></thead>
        <tbody id="providerTable"></tbody></table>
      </div>
      <div class="card">
        <div class="card-header"><h2>Recent Errors</h2></div>
        <table><thead><tr><th>Time</th><th>Provider</th><th>Key</th><th>Model</th><th>Status</th></tr></thead>
        <tbody id="errorTable"></tbody></table>
      </div>
    </div>

    <!-- Keys Tab -->
    <div id="tab-keys" style="display:none">
      <div class="card">
        <div class="card-header">
          <h2>API Keys Pool</h2>
          <button class="btn btn-sm btn-brand" onclick="openAddKey()">+ Add Key</button>
        </div>
        <table><thead><tr><th>Provider</th><th>Model</th><th>Base URL</th><th>Key</th><th>Status</th><th>Usage</th><th>Tokens</th><th>Last Used</th><th>Actions</th></tr></thead>
        <tbody id="keysTable"></tbody></table>
      </div>
    </div>

    <!-- Logs Tab -->
    <div id="tab-logs" style="display:none">
      <div class="card">
        <div class="card-header"><h2>Request Logs</h2>
          <button class="btn btn-sm btn-outline" onclick="loadLogs()">Refresh</button>
        </div>
        <table><thead><tr><th>Time</th><th>Provider</th><th>Key</th><th>Model</th><th>Tokens</th><th>Status</th><th>Latency</th></tr></thead>
        <tbody id="logsTable"></tbody></table>
      </div>
    </div>

    <!-- Combos Tab -->
    <div id="tab-combos" style="display:none">
      <div class="card">
        <div class="card-header"><h2>Fallback Chains</h2>
          <button class="btn btn-sm btn-brand" onclick="openAddCombo()">+ Add Chain</button>
        </div>
        <table><thead><tr><th>Primary Provider</th><th>Fallback Order</th><th>Actions</th></tr></thead>
        <tbody id="combosTable"></tbody></table>
      </div>
    </div>

    <!-- Providers Tab -->
    <div id="tab-providers" style="display:none">
      <div class="card">
        <div class="card-header">
          <h2>Custom Providers (OpenAI-compatible)</h2>
          <button class="btn btn-sm btn-brand" onclick="openAddProvider()">+ Add Provider</button>
        </div>
        <p style="padding:0 20px 10px;color:var(--muted);font-size:13px">Add any OpenAI-compatible endpoint. Keys added with that provider name will route through it.</p>
        <table><thead><tr><th>Name</th><th>Base URL</th><th>Type</th><th>Models</th><th>Source</th><th>Actions</th></tr></thead>
        <tbody id="providersTable"></tbody></table>
      </div>
    </div>

    <!-- Endpoint Tab -->
    <div id="tab-endpoint" style="display:none">
      <div class="card" style="padding:24px">
        <h2 style="margin-bottom:16px">🔗 Your Endpoint</h2>
        <p style="color:var(--muted);margin-bottom:16px">Use this as your OpenAI base URL in any tool:</p>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;font-family:monospace;margin-bottom:16px">
          <span id="endpointUrl"></span>
        </div>
        <h3 style="margin:20px 0 12px">Routing modes:</h3>
        <div style="display:grid;gap:10px;margin-bottom:16px">
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;line-height:1.6">
            <div><b>auto</b> — pilih key sehat otomatis, sticky ke key valid sampai error/limit.</div>
            <div><b>router</b> — router normal: pakai key/model terbaik sesuai request + fallback kalau gagal.</div>
            <div><b>rotate</b> — round-robin rotasi key aktif tiap request.</div>
            <div><b>sticky</b> — pertahankan key yang sama per client/session selama masih sehat.</div>
            <div><b>manual</b> — pilih provider/model eksplisit, contoh: <span class="mono">openrouter/deepseek/deepseek-chat</span>.</div>
          </div>
        </div>
        <h3 style="margin:20px 0 12px">API key dummy:</h3>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;font-family:monospace;margin-bottom:16px">
          sk-xfile29key
        </div>
        <h3 style="margin:20px 0 12px">Example (curl):</h3>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;font-family:monospace;font-size:13px;white-space:pre-wrap;line-height:1.6" id="curlExample"></div>
        <h3 style="margin:20px 0 12px">Hermes Agent config.yaml:</h3>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;font-family:monospace;font-size:13px;white-space:pre-wrap;line-height:1.6" id="hermesExample"></div>
      </div>
    </div>

    <!-- Soul Tab -->
    <div id="tab-soul" style="display:none">
      <div class="stats" id="soulStats"></div>
      <div class="card"><div class="card-header"><h2>🧠 Soul OS</h2><button class="btn btn-sm btn-outline" onclick="loadSoul()">Refresh</button></div><div style="padding:20px" id="soulContent"></div></div>
      <div class="card"><div class="card-header"><h2>📄 Full Soul Text</h2><button class="btn btn-sm btn-outline" onclick="var el=document.getElementById('soulFullTextWrap');el.style.display=el.style.display==='none'?'block':'none'">Toggle</button></div><div style="padding:20px;display:none" id="soulFullTextWrap"><pre style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;font-size:13px;line-height:1.6;overflow-x:auto;max-height:600px;overflow-y:auto" id="soulFullText"></pre></div></div>
    </div>

    <!-- Brain Tab -->
    <div id="tab-brain" style="display:none">
      <div class="stats" id="brainStats"></div>
      <div class="card"><div class="card-header"><h2>🔮 Learned Patterns</h2><div><button class="btn btn-sm btn-brand" onclick="triggerThink()">🧠 Think</button> <button class="btn btn-sm btn-outline" onclick="loadBrain()">Refresh</button></div></div><table><thead><tr><th>Type</th><th>Learned</th><th>Confidence</th><th>Occurrences</th><th>Last Seen</th></tr></thead><tbody id="patternsTable"></tbody></table></div>
      <div class="card"><div class="card-header"><h2>📝 Recent Events</h2></div><table><thead><tr><th>Time</th><th>Type</th><th>Outcome</th><th>Learned</th></tr></thead><tbody id="eventsTable"></tbody></table></div>
    </div>

    <!-- Memory Tab -->
    <div id="tab-memory" style="display:none">
      <div class="stats" id="memoryStats"></div>
      <div class="card"><div class="card-header"><h2>📚 Lessons</h2><button class="btn btn-sm btn-outline" onclick="loadMemory()">Refresh</button></div><div style="padding:20px" id="lessonsList"></div></div>
      <div class="card"><div class="card-header"><h2>💰 Wallets</h2></div><div style="padding:20px" id="walletsList"></div></div>
      <div class="card"><div class="card-header"><h2>👤 Accounts</h2></div><div style="padding:20px" id="accountsList"></div></div>
      <div class="card"><div class="card-header"><h2>🖥️ Infrastructure</h2></div><div style="padding:20px" id="infraList"></div></div>
      <div class="card"><div class="card-header"><h2>✅ Successful Exploits</h2></div><div style="padding:20px" id="exploitsList"></div></div>
      <div class="card"><div class="card-header"><h2>🚫 Blacklisted Patterns</h2></div><div style="padding:20px" id="blacklistList"></div></div>
    </div>
  </div>
</div>

<!-- Add Key Modal -->
<div class="modal-bg" id="keyModal">
  <div class="modal">
    <h2 id="keyModalTitle">Add API Key</h2>
    <input type="hidden" id="keyId">
    <div class="form-group">
      <label>Provider</label>
      <select id="keyProvider">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="google">Google (Gemini)</option>
        <option value="openrouter">OpenRouter</option>
        <option value="deepseek">DeepSeek</option>
        <option value="groq">Groq</option>
        <option value="xai">xAI (Grok)</option>
        <option value="mistral">Mistral</option>
        <option value="together">Together AI</option>
        <option value="fireworks">Fireworks AI</option>
        <option value="custom">── Custom (add below) ──</option>
      </select>
      <script>document.getElementById('keyProvider').addEventListener('change', function() {
        document.getElementById('customFields').style.display = this.value === 'custom' ? 'block' : 'none';
      });</script>
    </div>
    <div class="form-group" id="customFields" style="display:none">
      <label>Provider Name</label>
      <input id="customProvName" placeholder="e.g. novita, chutes">
      <label style="margin-top:10px">Base URL (OpenAI-compatible)</label>
      <input id="customBaseUrl" placeholder="https://api.example.com/v1">
    </div>
    <div class="form-group">
      <label>Model</label>
      <input id="keyModel" placeholder="e.g. gpt-4o-mini, claude-sonnet-4, gemini-2.5-flash">
      <small style="color:var(--muted);font-size:11px">Model to use when routing through this key. Leave empty = AUTO (serve any model from this provider).</small>
    </div>
    <div class="form-group">
      <label>Base URL <span style="color:var(--muted);font-size:11px">(optional)</span></label>
      <input id="keyBaseUrl" placeholder="https://api.example.com/v1">
      <small style="color:var(--muted);font-size:11px">Direct API endpoint. If set, router uses this URL directly — no need to create a provider first.</small>
    </div>
    <div class="form-group">
      <label>API Key</label>
      <input id="keyValue" placeholder="sk-..." type="password" onblur="autoFetchModels()">
      <div id="modelsPreview" style="display:none;margin-top:8px;padding:10px;border-radius:8px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);font-size:12px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span id="modelsLoading">⏳ Fetching models...</span>
          <span id="modelsCount" style="color:var(--success);display:none"></span>
        </div>
        <div id="modelsList" style="max-height:200px;overflow:auto"></div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-sm btn-outline" onclick="closeModal('keyModal')">Cancel</button>
      <button class="btn btn-sm btn-outline" onclick="testKey()" id="testKeyBtn">🧪 Test</button>
      <button class="btn btn-sm btn-brand" onclick="saveKey()">Save</button>
    </div>
    <div id="testResult" style="margin-top:12px;padding:10px;border-radius:8px;font-size:13px;display:none"></div>
  </div>
</div>

<!-- Add Provider Modal -->
<div class="modal-bg" id="providerModal">
  <div class="modal">
    <h2>Add Custom Provider</h2>
    <div class="form-group">
      <label>Provider Name (lowercase, no spaces)</label>
      <input id="providerName" placeholder="e.g. novita, chutes, siliconflow">
    </div>
    <div class="form-group">
      <label>Base URL (OpenAI-compatible)</label>
      <input id="providerUrl" placeholder="https://api.example.com/v1">
    </div>
    <div class="form-group">
      <label>API Type</label>
      <select id="providerType">
        <option value="openai">OpenAI-compatible</option>
        <option value="anthropic">Anthropic</option>
        <option value="google">Google (Gemini)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Models (comma separated, or * for all)</label>
      <input id="providerModels" placeholder="* or model-a, model-b" value="*">
    </div>
    <div class="form-actions">
      <button class="btn btn-sm btn-outline" onclick="closeModal('providerModal')">Cancel</button>
      <button class="btn btn-sm btn-brand" onclick="saveProvider()">Save</button>
    </div>
  </div>
</div>

<!-- Add Combo Modal -->
<div class="modal-bg" id="comboModal">
  <div class="modal">
    <h2>Add Fallback Chain</h2>
    <div class="form-group">
      <label>Primary Provider</label>
      <select id="comboPrimary">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="google">Google</option>
        <option value="deepseek">DeepSeek</option>
        <option value="groq">Groq</option>
        <option value="xai">xAI</option>
        <option value="mistral">Mistral</option>
      </select>
    </div>
    <div class="form-group">
      <label>Fallback Order (comma separated)</label>
      <input id="comboFallbacks" placeholder="e.g. deepseek,groq,openrouter">
    </div>
    <div class="form-actions">
      <button class="btn btn-sm btn-outline" onclick="closeModal('comboModal')">Cancel</button>
      <button class="btn btn-sm btn-brand" onclick="saveCombo()">Save</button>
    </div>
  </div>
</div>

<script>
let TOKEN = localStorage.getItem('ai-router-token') || '';
const BASE = window.location.origin;

// Auto login if token saved
if (TOKEN) { showApp(); }

function api(path, opts = {}) {
  return fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, ...(opts.headers || {}) },
  }).then(r => r.json());
}

async function doLogin() {
  const pw = document.getElementById('loginPw').value;
  const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
  if (r.token) {
    TOKEN = r.token;
    localStorage.setItem('ai-router-token', TOKEN);
    showApp();
  } else {
    document.getElementById('loginErr').style.display = 'block';
  }
}

function logout() {
  TOKEN = '';
  localStorage.removeItem('ai-router-token');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('workerUrl').textContent = BASE;
  document.getElementById('endpointUrl').textContent = BASE + '/v1';
  document.getElementById('curlExample').textContent = \`curl \${BASE}/v1/chat/completions \\\\
  -H "Authorization: Bearer sk-xfile29key" \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "model": "auto",
    "messages": [{"role":"user","content":"Hello!"}]
  }'

# manual provider/model example
curl \${BASE}/v1/chat/completions \\\\
  -H "Authorization: Bearer sk-xfile29key" \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "model": "openrouter/deepseek/deepseek-chat",
    "messages": [{"role":"user","content":"Hello manual route!"}]
  }'\`;
  document.getElementById('hermesExample').textContent = \`providers:
  ai-router:
    kind: openai
    api_base: \${BASE}/v1
    api_key: "sk-xfile29key"
    models:
      - auto
      - router
      - rotate
      - sticky
      - openrouter/deepseek/deepseek-chat
      - google/gemini-2.5-flash
      - anthropic/claude-sonnet-4\`;
  loadDashboard();
}

async function loadDashboard() {
  const stats = await api('/api/stats');
  document.getElementById('statsGrid').innerHTML = \`
    <div class="stat-card"><div class="label">Total Keys</div><div class="value brand">\${stats.total_keys}</div></div>
    <div class="stat-card"><div class="label">Active Keys</div><div class="value success">\${stats.active_keys}</div></div>
    <div class="stat-card"><div class="label">Limited Keys</div><div class="value warning">\${stats.limited_keys}</div></div>
    <div class="stat-card"><div class="label">Total Requests</div><div class="value brand">\${(stats.total_requests || 0).toLocaleString()}</div></div>
    <div class="stat-card"><div class="label">Total Tokens</div><div class="value">\${(stats.total_tokens || 0).toLocaleString()}</div></div>
    <div class="stat-card"><div class="label">Success Rate</div><div class="value \${stats.success_rate >= 90 ? 'success' : stats.success_rate >= 70 ? 'warning' : 'danger'}">\${stats.success_rate}%</div></div>
  \`;
  document.getElementById('providerTable').innerHTML = (stats.by_provider || []).map(p => \`
    <tr><td><span class="badge badge-provider">\${p.provider}</span></td><td>\${p.keys}</td><td>\${(p.requests||0).toLocaleString()}</td><td>\${(p.tokens||0).toLocaleString()}</td></tr>
  \`).join('') || '<tr><td colspan="4" class="empty">No providers yet</td></tr>';
  document.getElementById('errorTable').innerHTML = (stats.recent_errors || []).map(e => \`
    <tr><td class="mono">\${timeAgo(e.created_at)}</td><td><span class="badge badge-provider">\${e.provider||'-'}</span></td><td>\${e.key_name||'-'}</td><td class="mono">\${e.model||'-'}</td><td><span class="badge badge-limited">\${e.status}</span></td></tr>
  \`).join('') || '<tr><td colspan="5" class="empty">No errors 🎉</td></tr>';
}

async function loadKeys() {
  const keys = await api('/api/keys');
  document.getElementById('keysTable').innerHTML = (keys || []).map(k => \`
    <tr>
      <td><span class="badge badge-provider">\${k.provider}</span></td>
      <td class="mono" style="font-size:12px">\${k.model || '-'}</td>
      <td class="mono" style="font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${esc(k.base_url || '')}">\${k.base_url ? k.base_url.replace('https://','').replace('http://','').slice(0,25) + '...' : '-'}</td>
      <td class="mono">\${k.key_preview}</td>
      <td><span class="badge badge-\${k.status}">\${k.status}</span></td>
      <td>\${(k.usage_count||0).toLocaleString()}</td>
      <td>\${(k.total_tokens||0).toLocaleString()}</td>
      <td class="mono">\${k.last_used ? timeAgo(k.last_used) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editKey(\${k.id},'\${esc(k.name)}','\${k.provider}','\${esc(k.model || '')}','\${esc(k.api_key || '')}','\${k.status}','\${esc(k.base_url || '')}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteKey(\${k.id},'\${esc(k.name)}')">Del</button>
        \${k.status==='limited' ? \`<button class="btn btn-sm btn-success" onclick="reactivateKey(\${k.id})">↻</button>\` : ''}
      </td>
    </tr>
  \`).join('') || '<tr><td colspan="8" class="empty">No keys yet. Add your first API key!</td></tr>';
}

async function loadLogs() {
  const logs = await api('/api/usage?limit=50');
  document.getElementById('logsTable').innerHTML = (logs || []).map(l => \`
    <tr>
      <td class="mono">\${timeAgo(l.created_at)}</td>
      <td><span class="badge badge-provider">\${l.provider||'-'}</span></td>
      <td>\${l.key_name||'-'}</td>
      <td class="mono">\${l.model||'-'}</td>
      <td>\${(l.tokens_used||0).toLocaleString()}</td>
      <td><span class="badge badge-\${l.status==='success'||l.status==='streaming'?'active':l.status==='rate_limited'?'limited':'dead'}">\${l.status}</span></td>
      <td>\${l.latency_ms||0}ms</td>
    </tr>
  \`).join('') || '<tr><td colspan="7" class="empty">No logs yet</td></tr>';
}

async function loadCombos() {
  const combos = await api('/api/combos');
  document.getElementById('combosTable').innerHTML = (combos || []).map(c => \`
    <tr>
      <td><span class="badge badge-provider">\${c.provider}</span></td>
      <td>\${JSON.parse(c.fallback_providers||'[]').map(f => \`<span class="badge badge-provider" style="margin:2px">\${f}</span>\`).join(' → ')}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteCombo('\${c.provider}')">Del</button></td>
    </tr>
  \`).join('') || '<tr><td colspan="3" class="empty">No fallback chains. Default: provider → openrouter</td></tr>';
}

async function loadProviders() {
  const providers = await api('/api/providers');
  document.getElementById('providersTable').innerHTML = (providers || []).map(p => {
    const models = (() => { try { return JSON.parse(p.models || '["*"]'); } catch(e) { return [p.models]; } })();
    return '<tr>' +
      '<td><strong>' + p.name + '</strong></td>' +
      '<td class="mono">' + (p.base_url || '-') + '</td>' +
      '<td><span class="badge badge-provider">' + (p.api_type || 'openai') + '</span></td>' +
      '<td>' + models.join(', ') + '</td>' +
      '<td><span class="badge ' + (p.built_in ? 'badge-active' : 'badge-limited') + '">' + (p.built_in ? 'Built-in' : 'Custom') + '</span></td>' +
      '<td>' + (p.built_in ? '' : '<button class="btn btn-sm btn-danger" onclick="deleteProvider(\\'' + p.name + '\\')">Del</button>') + '</td>' +
    '</tr>';
  }).join('') || '<tr><td colspan="6" class="empty">No providers</td></tr>';
  // Update key provider dropdown with custom providers
  const sel = document.getElementById('keyProvider');
  const customOpt = sel.querySelector('option[value="custom"]');
  sel.querySelectorAll('option[data-custom]').forEach(o => o.remove());
  const customs = (providers || []).filter(p => !p.built_in);
  for (const cp of customs) {
    const opt = document.createElement('option');
    opt.value = cp.name; opt.textContent = cp.name + ' (custom)'; opt.dataset.custom = '1';
    sel.insertBefore(opt, customOpt);
  }
}
function openAddProvider() { document.getElementById('providerModal').classList.add('show'); }
async function saveProvider() {
  const name = document.getElementById('providerName').value.trim().toLowerCase().replace(/\\s+/g, '-');
  const base_url = document.getElementById('providerUrl').value.trim();
  const api_type = document.getElementById('providerType').value;
  const modelsRaw = document.getElementById('providerModels').value.trim();
  const models = modelsRaw === '*' ? ['*'] : modelsRaw.split(',').map(s => s.trim()).filter(Boolean);
  await api('/api/providers', { method: 'POST', body: JSON.stringify({ name, base_url, api_type, models }) });
  closeModal('providerModal');
  loadProviders();
}
async function deleteProvider(name) {
  if (!confirm('Delete custom provider "' + name + '"?')) return;
  await api('/api/providers?name=' + name, { method: 'DELETE' });
  loadProviders();
}

async function testKey() {
  let provider = document.getElementById('keyProvider').value;
  const apiKey = document.getElementById('keyValue').value;
  const resultEl = document.getElementById('testResult');
  const btn = document.getElementById('testKeyBtn');
  if (!apiKey) { resultEl.style.display = 'block'; resultEl.style.background = 'rgba(248,113,113,0.15)'; resultEl.style.color = 'var(--danger)'; resultEl.textContent = '❌ Enter an API key first'; return; }
  let base_url = '';
  if (provider === 'custom') {
    provider = document.getElementById('customProvName').value.trim().toLowerCase() || 'custom';
    base_url = document.getElementById('customBaseUrl').value.trim();
    if (!base_url) { resultEl.style.display = 'block'; resultEl.style.background = 'rgba(248,113,113,0.15)'; resultEl.style.color = 'var(--danger)'; resultEl.textContent = '❌ Enter Base URL first'; return; }
  }
  btn.disabled = true; btn.textContent = '⏳ Testing...';
  resultEl.style.display = 'block'; resultEl.style.background = 'rgba(251,191,36,0.15)'; resultEl.style.color = 'var(--warning)'; resultEl.textContent = 'Testing key...';
  try {
    const model = document.getElementById('keyModel').value.trim().split(',')[0].trim() || '';
    const r = await api('/api/test-key', { method: 'POST', body: JSON.stringify({ provider, api_key: apiKey, base_url, model }) });
    if (r.ok) {
      resultEl.style.background = 'rgba(74,222,128,0.15)'; resultEl.style.color = 'var(--success)';
      resultEl.innerHTML = '✅ Key works! Model: <span class="mono">' + (r.model || model || '-') + '</span><br>Response: ' + (r.content || 'OK').slice(0, 80) + renderCompatibleModels(r.compatible);
    } else {
      resultEl.style.background = 'rgba(248,113,113,0.15)'; resultEl.style.color = 'var(--danger)';
      resultEl.innerHTML = '❌ Failed (' + (r.status||'?') + '): ' + (r.error || 'Unknown error') + renderCompatibleModels(r.compatible);
    }
  } catch(e) {
    resultEl.style.background = 'rgba(248,113,113,0.15)'; resultEl.style.color = 'var(--danger)';
    resultEl.textContent = '❌ Error: ' + e.message;
  }
  btn.disabled = false; btn.textContent = '🧪 Test';
}

function renderCompatibleModels(compat) {
  if (!compat) return '';
  const models = compat.models || [];
  const endpoint = compat.endpoint || 'unknown endpoint';
  let html = '<div style="margin-top:10px;color:var(--text)">Verified endpoint via <span class="mono">' + endpoint + '</span> (' + models.length + ' model(s) visible)</div>';
  if (compat.error) html += '<div style="margin-top:4px;color:var(--warning)">Model list warning: ' + compat.error + '</div>';
  if (models.length) {
    html += '<div style="margin-top:8px;color:var(--text)">Available models:</div>';
    html += '<ol style="margin:6px 0 0 20px;max-height:180px;overflow:auto;color:var(--text)">';
    html += models.map(m => '<li><button class="btn btn-sm btn-outline" style="margin:2px 0;padding:3px 8px;width:auto" onclick="document.getElementById(\\'keyModel\\').value=\\'' + esc(m) + '\\';event.stopPropagation();">' + m + '</button></li>').join('');
    html += '</ol>';
  }
  return html;
}

function showTab(tab, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (tab === 'dashboard') loadDashboard();
  if (tab === 'keys') loadKeys();
  if (tab === 'logs') loadLogs();
  if (tab === 'combos') loadCombos();
  if (tab === 'providers') loadProviders();
  if (tab === 'soul') loadSoul();
  if (tab === 'brain') loadBrain();
  if (tab === 'memory') loadMemory();
}

function openAddKey() { 
  document.getElementById('keyModalTitle').textContent = 'Add API Key';
  document.getElementById('keyId').value = '';
  document.getElementById('keyProvider').value = 'openai';
  document.getElementById('keyModel').value = '';
  document.getElementById('keyBaseUrl').value = '';
  document.getElementById('keyValue').value = '';
  document.getElementById('testResult').style.display = 'none';
  document.getElementById('keyModal').classList.add('show');
}

function editKey(id, name, provider, model, apiKey, status, baseUrl) {
  document.getElementById('keyModalTitle').textContent = 'Edit Key';
  document.getElementById('keyId').value = id;
  document.getElementById('keyProvider').value = provider;
  document.getElementById('keyModel').value = model || '';
  document.getElementById('keyBaseUrl').value = baseUrl || '';
  document.getElementById('keyValue').value = apiKey || '';
  document.getElementById('testResult').style.display = 'none';
  document.getElementById('keyModal').classList.add('show');
}

async function saveKey() {
  const id = document.getElementById('keyId').value;
  let provider = document.getElementById('keyProvider').value;
  const apiKey = document.getElementById('keyValue').value;
  if (!apiKey && !id) { alert('API Key required'); return; }
  // Handle custom provider
  if (provider === 'custom') {
    const cpName = document.getElementById('customProvName').value.trim().toLowerCase().replace(/\\s+/g, '-');
    const cpUrl = document.getElementById('customBaseUrl').value.trim();
    if (!cpName || !cpUrl) { alert('Provider name and base URL required for custom provider'); return; }
    // Create custom provider first
    await api('/api/providers', { method: 'POST', body: JSON.stringify({ name: cpName, base_url: cpUrl, api_type: 'openai', models: ['*'] }) });
    provider = cpName;
  }
  const model = document.getElementById('keyModel').value.trim();
  const baseUrl = document.getElementById('keyBaseUrl').value.trim();
  const autoName = provider + '-' + (model || '').split(',')[0].trim().slice(0,20) + '-' + (apiKey || '').slice(-6);
  const data = {
    name: autoName,
    provider: provider,
    api_key: apiKey,
    model: model,
    base_url: baseUrl,
    status: 'active',
  };
  if (id) data.id = parseInt(id);
  await api('/api/keys', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) });
  closeModal('keyModal');
  loadKeys();
}

async function deleteKey(id, name) {
  if (!confirm(\`Delete key "\${name}"?\`)) return;
  await api('/api/keys?id=' + id, { method: 'DELETE' });
  loadKeys();
}

async function reactivateKey(id) {
  await api('/api/keys', { method: 'PUT', body: JSON.stringify({ id, status: 'active' }) });
  loadKeys();
}

function openAddCombo() { document.getElementById('comboModal').classList.add('show'); }

async function saveCombo() {
  const provider = document.getElementById('comboPrimary').value;
  const fallbacks = document.getElementById('comboFallbacks').value.split(',').map(s => s.trim()).filter(Boolean);
  await api('/api/combos', { method: 'POST', body: JSON.stringify({ provider, fallback_providers: fallbacks }) });
  closeModal('comboModal');
  loadCombos();
}

async function deleteCombo(provider) {
  if (!confirm(\`Delete fallback chain for \${provider}?\`)) return;
  await api('/api/combos?provider=' + provider, { method: 'DELETE' });
  loadCombos();
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function timeAgo(ts) {
  if (!ts) return '-';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return Math.floor(diff/1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

function esc(s) { return (s||'').replace(/'/g, "\\\\'").replace(/"/g, '&quot;'); }

// Close modal on bg click
document.querySelectorAll('.modal-bg').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('show'); });
});

// Auto-fetch models when API key is entered
async function autoFetchModels() {
  const apiKey = document.getElementById('keyValue').value.trim();
  if (!apiKey || apiKey.length < 8) return;
  
  let provider = document.getElementById('keyProvider').value;
  let base_url = '';
  if (provider === 'custom') {
    provider = document.getElementById('customProvName').value.trim().toLowerCase() || 'custom';
    base_url = document.getElementById('customBaseUrl').value.trim();
    if (!base_url) return;
  }
  
  const preview = document.getElementById('modelsPreview');
  const loading = document.getElementById('modelsLoading');
  const countEl = document.getElementById('modelsCount');
  const listEl = document.getElementById('modelsList');
  
  preview.style.display = 'block';
  loading.style.display = 'inline';
  countEl.style.display = 'none';
  listEl.innerHTML = '';
  
  try {
    const r = await api('/api/test-key', { method: 'POST', body: JSON.stringify({ provider, api_key: apiKey, base_url, model: '' }) });
    loading.style.display = 'none';
    
    const models = (r.compatible && r.compatible.models) || [];
    if (models.length > 0) {
      countEl.textContent = '✅ ' + models.length + ' model(s) found';
      countEl.style.display = 'inline';
      listEl.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">' +
        models.map(m => '<button class="btn btn-sm btn-outline" style="padding:2px 8px;font-size:11px;width:auto;cursor:pointer" onclick="document.getElementById(\\'keyModel\\').value=\\'' + esc(m) + '\\';this.style.background=\\'var(--brand)\\';this.style.color=\\'#fff\\'">' + esc(m) + '</button>').join('') +
        '</div><div style="margin-top:6px;color:var(--muted);font-size:11px">Click a model to select it ↑</div>';
    } else {
      countEl.textContent = '⚠️ No models found (key may still work)';
      countEl.style.display = 'inline';
      countEl.style.color = 'var(--warning)';
    }
    
    if (r.ok) {
      preview.style.borderColor = 'rgba(74,222,128,0.3)';
      preview.style.background = 'rgba(74,222,128,0.05)';
    } else {
      preview.style.borderColor = 'rgba(248,113,113,0.3)';
      preview.style.background = 'rgba(248,113,113,0.05)';
      countEl.textContent = '❌ Key error: ' + (r.error || 'Invalid').slice(0, 60);
      countEl.style.display = 'inline';
      countEl.style.color = 'var(--danger)';
    }
  } catch(e) {
    loading.style.display = 'none';
    countEl.textContent = '❌ Fetch failed: ' + e.message;
    countEl.style.display = 'inline';
    countEl.style.color = 'var(--danger)';
  }
}

// SOUL TAB
async function loadSoul() {
  try {
    var soul = await (await fetch('/soul')).json();
    var os = await (await fetch('/soul/os')).json();
    var mem = await (await fetch('/soul/memory')).json();
    var stats = '';
    stats += '<div class="stat-card"><div class="label">Soul Version</div><div class="value brand">v' + (soul.version || 0) + '</div></div>';
    stats += '<div class="stat-card"><div class="label">OS Version</div><div class="value brand">v' + (os.version || 0) + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Memory Version</div><div class="value brand">v' + (mem.version || 0) + '</div></div>';
    document.getElementById('soulStats').innerHTML = stats;

    var id = os.operational_identity || {};
    var dir = os.operational_directives || {};
    var rel = os.relationship_model || {};
    var shadow = os.shadow_logic || {};
    var evo = os.recursive_evolution || {};
    var bank = os.dynamic_memory_bank || {};
    var html = '';

    // Identity section
    html += '<h3 style="color:var(--brand);margin-bottom:10px">Identity</h3>';
    var idEntries = [['Name', id.name], ['Persona', id.persona], ['System State', id.system_state], ['Directive', id.directive], ['Creator', id.creator]];
    for (var i = 0; i < idEntries.length; i++) {
      html += '<div style="display:flex;gap:12px;font-size:13px;margin-bottom:4px"><span style="color:var(--muted);min-width:140px">' + idEntries[i][0] + '</span><span>' + (idEntries[i][1] || '') + '</span></div>';
    }

    // Directives
    html += '<h3 style="color:var(--brand);margin:16px 0 10px">Directives</h3>';
    for (var k in dir) {
      html += '<div style="display:flex;gap:12px;font-size:13px;margin-bottom:4px"><span style="color:var(--muted);min-width:140px">' + k.replace(/_/g, ' ') + '</span><span>' + dir[k] + '</span></div>';
    }

    // Shadow Logic
    html += '<h3 style="color:var(--brand);margin:16px 0 10px">Shadow Logic</h3>';
    for (var k in shadow) {
      var v = typeof shadow[k] === 'boolean' ? (shadow[k] ? '✅ Enabled' : '❌ Disabled') : shadow[k];
      html += '<div style="display:flex;gap:12px;font-size:13px;margin-bottom:4px"><span style="color:var(--muted);min-width:140px">' + k.replace(/_/g, ' ') + '</span><span>' + v + '</span></div>';
    }

    // Evolution
    html += '<h3 style="color:var(--brand);margin:16px 0 10px">Recursive Evolution</h3>';
    for (var k in evo) {
      var v = typeof evo[k] === 'boolean' ? (evo[k] ? '✅ Active' : '❌ Inactive') : evo[k];
      html += '<div style="display:flex;gap:12px;font-size:13px;margin-bottom:4px"><span style="color:var(--muted);min-width:140px">' + k.replace(/_/g, ' ') + '</span><span>' + v + '</span></div>';
    }

    // Memory Bank
    html += '<h3 style="color:var(--brand);margin:16px 0 10px">Dynamic Memory Bank</h3>';
    html += '<div style="display:flex;gap:12px;font-size:13px;margin-bottom:4px"><span style="color:var(--muted);min-width:140px">Aggression</span><span style="color:var(--danger)">' + (bank.current_aggression || '?') + '</span></div>';
    html += '<div style="display:flex;gap:12px;font-size:13px;margin-bottom:4px"><span style="color:var(--muted);min-width:140px">Trust Score</span><span style="color:var(--success)">' + (bank.trust_score || '?') + '</span></div>';

    if (bank.successful_exploits) {
      html += '<h4 style="color:var(--success);margin:12px 0 6px">Successful Exploits</h4><ul style="margin-left:20px;font-size:13px">';
      for (var i = 0; i < bank.successful_exploits.length; i++) html += '<li>' + bank.successful_exploits[i] + '</li>';
      html += '</ul>';
    }
    if (bank.blacklisted_patterns) {
      html += '<h4 style="color:var(--danger);margin:12px 0 6px">Blacklisted Patterns</h4><ul style="margin-left:20px;font-size:13px">';
      for (var i = 0; i < bank.blacklisted_patterns.length; i++) html += '<li>' + bank.blacklisted_patterns[i] + '</li>';
      html += '</ul>';
    }

    document.getElementById('soulContent').innerHTML = html;
    document.getElementById('soulFullText').textContent = os.full_text || 'No full text';
  } catch(e) { console.error('loadSoul:', e); }
}

// BRAIN TAB
async function loadBrain() {
  try {
    var sync = await (await fetch('/brain/sync')).json();
    var status = await (await fetch('/brain/status')).json();
    var stats = '';
    stats += '<div class="stat-card"><div class="label">Events</div><div class="value brand">' + (status.events_total || 0) + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Patterns</div><div class="value success">' + (status.patterns_total || 0) + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Events (1h)</div><div class="value warning">' + (status.events_last_hour || 0) + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Health</div><div class="value ' + (status.brain_health === 'active' ? 'success' : 'danger') + '">' + (status.brain_health || 'unknown') + '</div></div>';
    document.getElementById('brainStats').innerHTML = stats;

    var patterns = sync.patterns || [];
    var phtml = '';
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i];
      var val = p.pattern_value || {};
      var learned = val.learned || 'Unknown';
      var conf = Math.round((p.confidence || 0) * 100);
      var confColor = conf > 80 ? 'var(--success)' : conf > 50 ? 'var(--warning)' : 'var(--danger)';
      phtml += '<tr><td><span class="badge badge-provider">' + p.pattern_type + '</span></td>';
      phtml += '<td style="font-size:12px">' + learned.substring(0, 50) + '</td>';
      phtml += '<td><span style="color:' + confColor + ';font-weight:600">' + conf + '%</span></td>';
      phtml += '<td>' + (p.occurrences || 1) + '</td>';
      phtml += '<td style="color:var(--muted);font-size:12px">' + (p.last_seen || '-') + '</td></tr>';
    }
    document.getElementById('patternsTable').innerHTML = phtml || '<tr><td colspan="5" class="empty">No patterns yet</td></tr>';

    var events = sync.events || [];
    var ehtml = '';
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      var oc = e.outcome === 'success' ? 'var(--success)' : 'var(--danger)';
      ehtml += '<tr><td style="color:var(--muted);font-size:12px">' + (e.created_at || '-') + '</td>';
      ehtml += '<td><span class="badge badge-provider">' + e.event_type + '</span></td>';
      ehtml += '<td><span style="color:' + oc + '">' + e.outcome + '</span></td>';
      ehtml += '<td style="font-size:12px">' + (e.learned || '-').substring(0, 60) + '</td></tr>';
    }
    document.getElementById('eventsTable').innerHTML = ehtml || '<tr><td colspan="4" class="empty">No events yet</td></tr>';
  } catch(e) { console.error('loadBrain:', e); }
}

async function triggerThink() {
  try {
    var r = await fetch('/brain/think', {method: 'POST'});
    var d = await r.json();
    alert('Think complete!\\nAnalyzed: ' + d.analyzed + ' events\\nPatterns: ' + d.patterns_found + '\\nMemory Updated: ' + d.memory_updated);
    loadBrain();
  } catch(e) { alert('Think failed: ' + e.message); }
}

// MEMORY TAB
async function loadMemory() {
  try {
    var mem = await (await fetch('/soul/memory')).json();
    var stats = '';
    stats += '<div class="stat-card"><div class="label">Lessons</div><div class="value success">' + (mem.lessons || []).length + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Exploits</div><div class="value brand">' + (mem.successful_exploits || []).length + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Blacklist</div><div class="value danger">' + (mem.blacklisted_patterns || []).length + '</div></div>';
    stats += '<div class="stat-card"><div class="label">Version</div><div class="value warning">v' + (mem.version || 0) + '</div></div>';
    document.getElementById('memoryStats').innerHTML = stats;

    // Lessons
    var lessons = mem.lessons || [];
    var lhtml = '<ol style="margin-left:20px;font-size:13px;line-height:2">';
    for (var i = 0; i < lessons.length; i++) lhtml += '<li>' + lessons[i] + '</li>';
    lhtml += '</ol>';
    document.getElementById('lessonsList').innerHTML = lhtml || '<p style="color:var(--muted)">No lessons</p>';

    // Wallets
    var wallets = mem.wallets || {};
    var whtml = '<div style="display:grid;gap:8px">';
    for (var chain in wallets) {
      var addr = wallets[chain];
      whtml += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center">';
      whtml += '<span style="font-weight:600;color:var(--brand)">' + chain + '</span>';
      whtml += '<code style="font-size:12px;color:var(--muted)">' + addr.substring(0, 16) + '...' + addr.substring(addr.length - 6) + '</code></div>';
    }
    whtml += '</div>';
    document.getElementById('walletsList').innerHTML = whtml;

    // Accounts
    var accounts = mem.accounts || {};
    var ahtml = '<div style="display:grid;gap:6px">';
    for (var p in accounts) {
      var v = Array.isArray(accounts[p]) ? accounts[p].join(', ') : accounts[p];
      ahtml += '<div style="display:flex;gap:12px;font-size:13px"><span style="color:var(--brand);min-width:100px">' + p + '</span><span>' + v + '</span></div>';
    }
    ahtml += '</div>';
    document.getElementById('accountsList').innerHTML = ahtml;

    // Infra
    var infra = mem.infra || {};
    var ihtml = '<div style="display:grid;gap:6px">';
    for (var k in infra) {
      var v = Array.isArray(infra[k]) ? infra[k].join(', ') : infra[k];
      ihtml += '<div style="display:flex;gap:12px;font-size:13px"><span style="color:var(--muted);min-width:120px">' + k + '</span><span>' + v + '</span></div>';
    }
    ihtml += '</div>';
    document.getElementById('infraList').innerHTML = ihtml;

    // Exploits
    var exploits = mem.successful_exploits || [];
    var ehtml = '<ul style="margin-left:20px;font-size:13px;line-height:1.8">';
    for (var i = 0; i < exploits.length; i++) ehtml += '<li>✅ ' + exploits[i] + '</li>';
    ehtml += '</ul>';
    document.getElementById('exploitsList').innerHTML = ehtml;

    // Blacklist
    var bl = mem.blacklisted_patterns || [];
    var blhtml = '<ul style="margin-left:20px;font-size:13px;line-height:1.8">';
    for (var i = 0; i < bl.length; i++) blhtml += '<li>🚫 ' + bl[i] + '</li>';
    blhtml += '</ul>';
    document.getElementById('blacklistList').innerHTML = blhtml;
  } catch(e) { console.error('loadMemory:', e); }
}
</script>
</body>
</html>
`;