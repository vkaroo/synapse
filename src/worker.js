
// AI Key Pool Router - Cloudflare Worker

import { DASHBOARD_HTML } from './dashboard.js';

// OpenAI-compatible proxy with multi-provider fallback

const PROVIDERS = {
  openai: { url: 'https://api.openai.com/v1', models: ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o3', 'o4-mini'], keyPrefix: 'sk-', type: 'openai' },
  anthropic: { url: 'https://api.anthropic.com/v1', models: ['claude-3-5-sonnet', 'claude-sonnet-4', 'claude-opus-4', 'claude-3-haiku', 'claude-3-opus'], keyPrefix: 'sk-ant-', type: 'anthropic' },
  google: { url: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'], keyPrefix: 'AIza', type: 'google' },
  openrouter: { url: 'https://openrouter.ai/api/v1', models: ['*'], keyPrefix: 'sk-or-', type: 'openai' },
  deepseek: { url: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'], keyPrefix: 'sk-', type: 'openai' },
  groq: { url: 'https://api.groq.com/openai/v1', models: ['llama-3.3-70b', 'llama-3.1-8b', 'mixtral-8x7b', 'gemma2-9b'], keyPrefix: 'gsk_', type: 'openai' },
  xai: { url: 'https://api.x.ai/v1', models: ['grok-3', 'grok-3-mini', 'grok-2'], keyPrefix: 'xai-', type: 'openai' },
  mistral: { url: 'https://api.mistral.ai/v1', models: ['mistral-large', 'mistral-small', 'codestral', 'pixtral'], keyPrefix: '', type: 'openai' },
  together: { url: 'https://api.together.xyz/v1', models: ['*'], keyPrefix: '', type: 'openai' },
  fireworks: { url: 'https://api.fireworks.ai/inference/v1', models: ['*'], keyPrefix: 'fw_', type: 'openai' },
};

function getProviderUrl(providerName, providers) {
  const p = providers?.[providerName] || PROVIDERS[providerName];
  return p?.url || '';
}

function normalizeModel(provider, model) {
  const m = (model || '').trim();
  if (!m) return m;
  // Google has no bare gemini-2.5 model; use Flash if user enters shorthand.
  if (provider === 'google') {
    if (m === 'gemini-2.5' || m === 'models/gemini-2.5') return 'gemini-2.5-flash';
    if (m.startsWith('models/')) return m.slice('models/'.length);
  }
  return m;
}

function parseRoutedModel(requestedModel, providers) {
  const raw = String(requestedModel || '').trim();
  const lower = raw.toLowerCase();
  for (const name of Object.keys(providers || {})) {
    const prefix = name.toLowerCase() + '/';
    if (lower.startsWith(prefix)) {
      return { provider: name, model: raw.slice(name.length + 1) };
    }
  }
  return { provider: null, model: raw };
}

// Cache models per provider (base_url → models list)
const _modelsCache = new Map(); // base_url → { models: [...], time: number }
const MODELS_CACHE_TTL = 300000; // 5 minutes

async function fetchProviderModels(baseUrl, apiKey) {
  const now = Date.now();
  const cached = _modelsCache.get(baseUrl);
  if (cached && (now - cached.time) < MODELS_CACHE_TTL) return cached.models;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const resp = await fetch(baseUrl + '/models', { headers, signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return cached?.models || [];
    const data = await resp.json();
    const models = (data.data || []).map(m => m.id).filter(Boolean);
    _modelsCache.set(baseUrl, { models, time: now });
    return models;
  } catch(e) {
    return cached?.models || [];
  }
}

function pickModel(models, needVision) {
  if (!models.length) return null;
  // Filter out non-chat models (tts, embedding, etc.)
  const chatModels = models.filter(m => !/tts|embed|audio|voice|image-gen/i.test(m));
  const pool = chatModels.length ? chatModels : models;
  // Just pick first available chat model (categories will override if configured)
  return pool[0];
}

// Resolve model from categories based on request type
async function resolveFromCategories(db, requestType, availableModels) {
  try {
    const { results } = await db.prepare(
      `SELECT model FROM model_categories WHERE category = ? ORDER BY priority ASC`
    ).bind(requestType).all();
    // Find first category model that's available in the provider
    for (const row of (results || [])) {
      if (availableModels.includes(row.model)) return row.model;
    }
  } catch(e) {}
  return null;
}

// Cache custom providers for 60 seconds
let _providersCache = null;
let _providersCacheTime = 0;
async function getProviders(db) {
  const now = Date.now();
  if (_providersCache && (now - _providersCacheTime) < 60000) return _providersCache;
  const all = { ...PROVIDERS };
  try {
    const { results } = await db.prepare(`SELECT * FROM custom_providers`).all();
    for (const cp of (results || [])) {
      all[cp.name] = { url: cp.base_url, models: JSON.parse(cp.models || '["*"]'), keyPrefix: '', type: cp.api_type || 'openai' };
    }
  } catch(e) {}
  _providersCache = all;
  _providersCacheTime = now;
  return all;
}

// Detect provider dynamically (includes custom providers)
function detectProviderDynamic(model, providers) {
  model = model.toLowerCase();
  // Check custom providers first (exact/prefix model match; wildcard must not steal manual routing)
  for (const [name, cfg] of Object.entries(providers)) {
    if (PROVIDERS[name]) continue; // skip built-in, check below
    if (cfg.models.some(m => {
      const mm = String(m || '').toLowerCase();
      if (!mm || mm === '*') return false;
      return model === mm || model.startsWith(mm + '/') || model.includes(mm);
    })) return name;
  }
  // Match model name starting with custom provider name (e.g. "mimo-v2-omni" → provider "mimo")
  for (const [name, cfg] of Object.entries(providers)) {
    if (PROVIDERS[name]) continue;
    const nl = name.toLowerCase();
    if (model.startsWith(nl + '-') || model.startsWith(nl + '_') || model === nl) return name;
  }
  return detectProvider(model);
}

// Detect provider from model name (built-in only)
function detectProvider(model) {
  model = model.toLowerCase();
  for (const [name, cfg] of Object.entries(PROVIDERS)) {
    if (name === 'openrouter' || name === 'together' || name === 'fireworks') continue;
    if (cfg.models.some(m => model.includes(m.replace('*', '')) || m === '*')) return name;
  }
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gemini')) return 'google';
  if (model.includes('gpt') || model.includes('o1') || model.includes('o3') || model.includes('o4')) return 'openai';
  if (model.includes('grok')) return 'xai';
  if (model.includes('deepseek')) return 'deepseek';
  if (model.includes('llama') || model.includes('mixtral') || model.includes('gemma')) return 'groq';
  if (model.includes('mistral') || model.includes('codestral') || model.includes('pixtral')) return 'mistral';
  return 'openrouter'; // fallback
}


// ============ AUTO-TASK DETECTION ============

// Default task categories and keyword patterns
const TASK_PATTERNS = {
  code: {
    priority: 10,
    keywords: ['function', 'class', 'import', 'const ', 'let ', 'var ', 'def ', 'return ',
      '```', 'console.log', 'print(', 'sudo', 'apt', 'npm', 'pip install', 'git ',
      'docker', 'kubectl', 'nginx', 'api/', 'endpoint', 'middleware', 'callback',
      'async', 'await', 'Promise', 'try {', 'catch', 'error', 'bug', 'fix', 'deploy',
      'compile', 'build', 'test', 'refactor', 'implement', 'algorithm', 'loop',
      'array', 'object', 'string', 'int', 'float', 'boolean', 'null', 'undefined',
      'github', 'repo', 'commit', 'branch', 'merge', 'pull request', 'code review',
      'html', 'css', 'javascript', 'typescript', 'python', 'rust', 'golang', 'java',
      'sql', 'query', 'schema', 'migration', 'api key', 'curl ', 'request(', 'fetch('],
  },
  reasoning: {
    priority: 20,
    keywords: ['step by step', 'analyze', 'explain why', 'reasoning', 'logic',
      'calculate', 'prove', 'theorem', 'derive', 'compare', 'contrast',
      'pros and cons', 'tradeoff', 'trade-off', 'evaluate', 'assess',
      'hypothesis', 'conclusion', 'evidence', 'argument', 'deduce',
      'solve this', 'how does', 'why does', 'what happens if',
      'think carefully', 'reason through', 'walk me through'],
  },
  creative: {
    priority: 15,
    keywords: ['write a story', 'poem', 'creative', 'fiction', 'imagine',
      'narrative', 'character', 'dialogue', 'screenplay', 'song',
      'make up', 'invent', 'brainstorm', 'ideation', 'concept',
      'design', 'brand', 'tagline', 'slogan', 'marketing', 'copywriting',
      'write a blog', 'article', 'newsletter', 'email template'],
  },
  vision: {
    priority: 30,
    keywords: ['image', 'photo', 'picture', 'screenshot', 'diagram', 'chart',
      'graph', 'visual', 'pixel', 'color', 'logo', 'icon', 'thumbnail',
      'analyze this image', 'describe the image', 'what do you see'],
    has_image: true,  // detect if message has image attachment
  },
  translate: {
    priority: 25,
    keywords: ['translate', 'terjemah', 'traducir', 'übersetzen', 'traduire',
      'bahasa indonesia', 'to english', 'to japanese', 'to chinese',
      'dari inggris', 'dari indonesia'],
  },
  fast: {
    priority: 5,
    keywords: ['quick', 'short', 'brief', 'one-liner', 'tldr', 'tl;dr',
      'summarize', 'ringkas', 'rekomendasi', 'list', 'saran'],
  },
};

// Detect task type from prompt content (returns task name or null)
function detectTaskType(messages, explicitTask) {
  // If explicit task hint provided (auto:code), use it directly
  if (explicitTask && TASK_PATTERNS[explicitTask]) {
    return explicitTask;
  }

  // Combine all message content for analysis
  const text = (messages || [])
    .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
    .join(' ')
    .toLowerCase();

  if (!text.trim()) return null;

  // Check for image attachments (vision task)
  const hasImage = (messages || []).some(m => 
    Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' || c.type === 'image')
  );
  if (hasImage) return 'vision';

  // Score each task category
  let bestTask = null;
  let bestScore = 0;

  for (const [task, config] of Object.entries(TASK_PATTERNS)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (text.includes(kw.toLowerCase())) {
        score += kw.includes(' ') ? 2 : 1; // multi-word matches score higher
      }
    }
    // Weight by priority
    score = score * (config.priority || 10);
    
    if (score > bestScore) {
      bestScore = score;
      bestTask = task;
    }
  }

  // Need at least 2 keyword hits to be confident
  if (bestScore < 3) return null;
  return bestTask;
}

// Get task-to-model mapping from KV (or return default)
async function getTaskMapping(kv) {
  try {
    const raw = await kv.get('router:task-mapping');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  // Default mapping: task → preferred model patterns (matched against available keys)
  return {
    code: { preferred: ['claude-sonnet', 'gpt-4', 'deepseek-coder', 'codestral'], fallback: 'auto' },
    reasoning: { preferred: ['claude-opus', 'gpt-4', 'o1', 'o3', 'grok-3'], fallback: 'auto' },
    creative: { preferred: ['claude-sonnet', 'gpt-4', 'gemini-1.5-pro'], fallback: 'auto' },
    vision: { preferred: ['mimo-v2-omni', 'gemini-1.5-pro', 'gpt-4o', 'claude-sonnet'], fallback: 'auto' },
    translate: { preferred: ['mimo-v2.5-pro', 'gpt-4', 'claude-sonnet', 'gemini-1.5-pro'], fallback: 'auto' },
    fast: { preferred: ['mimo-v2-omni', 'gpt-4o-mini', 'gemini-2.0-flash', 'llama-3.1-8b'], fallback: 'auto' },
  };
}

// Find best matching key for a task from available candidates
function matchKeyToTask(candidates, task, mapping) {
  if (!task || !mapping[task]) return candidates; // no change
  
  const prefs = mapping[task].preferred || [];
  const scored = candidates.map(c => {
    const modelLower = String(c.key.model || '').toLowerCase();
    let score = 0;
    for (const pref of prefs) {
      if (modelLower.includes(pref.toLowerCase())) {
        score += 10;
        break;
      }
    }
    // Bonus: prefer pro/large models for reasoning/code, small for fast
    if (task === 'fast' && (modelLower.includes('mini') || modelLower.includes('flash') || modelLower.includes('small') || modelLower.includes('8b'))) score += 5;
    if ((task === 'code' || task === 'reasoning') && (modelLower.includes('pro') || modelLower.includes('opus') || modelLower.includes('large') || modelLower.includes('o1') || modelLower.includes('o3'))) score += 5;
    return { ...c, _taskScore: score };
  });
  
  // Sort by task score descending, then by usage ascending as tiebreaker
  scored.sort((a, b) => b._taskScore - a._taskScore || a.key.usage_count - b.key.usage_count);
  return scored.map(({ _taskScore, ...rest }) => rest);
}

// Get available keys for a provider, sorted by usage (least used first)
async function getKeys(db, provider) {
  const { results } = await db.prepare(
    `SELECT * FROM api_keys WHERE provider = ? AND status = 'active' ORDER BY usage_count ASC, last_used ASC`
  ).bind(provider).all();
  return results || [];
}

// Log usage — fire-and-forget (non-blocking)
async function logUsage(db, keyId, model, tokens, status, latency) {
  const now = new Date().toISOString();
  try {
    await db.prepare(
      `INSERT INTO usage_logs (key_id, model, tokens_used, status, latency_ms, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(keyId, model, tokens || 0, status, latency || 0, now).run();
    await db.prepare(
      `UPDATE api_keys SET usage_count = usage_count + 1, last_used = ?, total_tokens = total_tokens + ? WHERE id = ?`
    ).bind(now, tokens || 0, keyId).run();
  } catch(e) { console.error('logUsage failed:', e.message); }
}

// Mark key as rate-limited — fire-and-forget
async function markKeyLimited(db, keyId) {
  try {
    await db.prepare(
      `UPDATE api_keys SET status = 'limited', limited_at = ? WHERE id = ?`
    ).bind(new Date().toISOString(), keyId).run();
  } catch(e) { console.error('markKeyLimited failed:', e.message); }
}

// Build request for provider
function buildRequest(provider, model, body, apiKey, providers, baseUrl) {
  // If base_url is provided directly, use it (bypass provider lookup)
  const cfg = baseUrl ? { url: baseUrl, type: 'openai', models: ['*'] } : (providers?.[provider] || PROVIDERS[provider]);
  if (!cfg) return null;
  
  const headers = { 'Content-Type': 'application/json' };
  let url = cfg.url;
  
  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    url += '/messages';
    // Convert OpenAI format to Anthropic
    const msgs = body.messages || [];
    const system = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const messages = msgs.filter(m => m.role !== 'system');
    return {
      url, headers,
      body: JSON.stringify({
        model: body.model,
        max_tokens: body.max_tokens || 4096,
        system: system || undefined,
        messages,
        stream: body.stream || false,
        temperature: body.temperature,
      })
    };
  }
  
  if (provider === 'google') {
    // Gemini API format
    url += `/models/${body.model}:${body.stream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`;
    const msgs = body.messages || [];
    const contents = msgs.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const systemInstruction = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n');
    return {
      url, headers,
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: body.temperature,
          maxOutputTokens: body.max_tokens || 4096,
        }
      })
    };
  }
  
  // OpenAI-compatible (openai, openrouter, deepseek, groq, xai, mistral, together, fireworks)
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  url += '/chat/completions';
  return {
    url, headers,
    body: JSON.stringify(body)
  };
}

// Convert non-OpenAI response to OpenAI format
function normalizeResponse(provider, data, model) {
  if (provider === 'anthropic') {
    return {
      id: data.id || 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: data.model || model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: data.content?.[0]?.text || '' },
        finish_reason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason,
      }],
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      }
    };
  }
  if (provider === 'google') {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
      }
    };
  }
  return data; // Already OpenAI format
}

// CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Router-Key',
};

// Handle chat completion with fallback or cross-provider auto-rotation
async function handleChat(request, env) {
  const body = await request.json();
  const model = body.model || 'auto';
  const isStream = body.stream || false;
  const providers = await getProviders(env.DB);
  
  // Simple auto mode
  const modelName = String(model).toLowerCase();
  const isAuto = modelName === 'auto';
  const isFree = modelName === 'auto:free';
  
  const routed = parseRoutedModel(model, providers);
  const requestedModel = routed.model || model;

  let candidates = [];

  if (isAuto || isFree) {
    // Auto mode: get ALL active keys (router picks model, key authenticates)
    let query = `SELECT * FROM api_keys WHERE status = 'active'`;
    if (isFree) {
      // Keys that can serve free models: has "free" in model name, OR no model locked (base_url)
      query += ` AND (LOWER(model) LIKE '%free%' OR (base_url IS NOT NULL AND TRIM(base_url) != ''))`;
    } else {
      query += ` AND (base_url IS NOT NULL AND TRIM(base_url) != '' OR model IS NOT NULL AND TRIM(model) != '')`;
    }
    query += ` ORDER BY usage_count ASC`;
    const { results: keys } = await env.DB.prepare(query).all();
    candidates = (keys || []).map(k => ({ provider: k.provider, key: k }));
  } else {
    // Normal mode: route by requested model, use base_url keys as universal fallback
    const { results: urlKeys } = await env.DB.prepare(
      `SELECT * FROM api_keys WHERE status = 'active' AND base_url IS NOT NULL AND TRIM(base_url) != '' ORDER BY usage_count ASC`
    ).all();
    candidates = (urlKeys || []).map(k => ({ provider: k.provider || 'custom', key: k }));
  }

  let lastError = null;
  for (const item of candidates) {
    const provider = item.provider;
    const key = item.key;
    const start = Date.now();
    try {
      // Resolve effective model
      let effectiveModel;
      if (isAuto || isFree) {
        // Auto: detect request type, check categories first, then pick from provider
        const hasImage = (body.messages || []).some(m =>
          Array.isArray(m.content) && m.content.some(c => c.type === 'image_url' || c.type === 'image')
        );
        const providerModels = await fetchProviderModels(key.base_url || getProviderUrl(key.provider, providers), key.api_key);
        // For auto:free, filter to free models only
        let availableModels = providerModels;
        if (isFree) {
          availableModels = providerModels.filter(m => m.includes(':free') || m.includes('-free'));
          if (!availableModels.length) continue; // no free models on this provider
        }
        // Check categories first
        const requestType = hasImage ? 'vision' : 'chat';
        effectiveModel = await resolveFromCategories(env.DB, requestType, availableModels);
        // Fall back to picking first available model
        if (!effectiveModel) effectiveModel = pickModel(availableModels, hasImage);
        if (!effectiveModel) continue;
      } else {
        // Explicit model: use requested model directly
        effectiveModel = requestedModel;
      }
      if (!effectiveModel) continue;
      const effectiveBody = { ...body, model: effectiveModel };
      const req = buildRequest(provider, effectiveModel, effectiveBody, key.api_key, providers, key.base_url);
      if (!req) { console.log('ROUTER_SKIP: buildRequest returned null'); continue; }

      // DEBUG: log request details
      const resp = await fetch(req.url, { method: 'POST', headers: req.headers, body: req.body });
      const latency = Date.now() - start;

      if (resp.status === 429 || resp.status === 402 || resp.status === 529) {
        await markKeyLimited(env.DB, key.id);
        await logUsage(env.DB, key.id, effectiveModel, 0, 'rate_limited', latency);
        continue;
      }
      if (resp.status >= 500) {
        await logUsage(env.DB, key.id, effectiveModel, 0, 'server_error', latency);
        continue;
      }
      if (!resp.ok) {
        const errText = await resp.text();
        lastError = `${provider}/${key.name}: ${resp.status} ${errText.slice(0, 200)}`;
        await logUsage(env.DB, key.id, effectiveModel, 0, 'error', latency);
        continue;
      }

      if (isStream && resp.headers.get('content-type')?.includes('text/event-stream')) {
        await logUsage(env.DB, key.id, effectiveModel, 0, 'streaming', latency);
        return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Router-Provider': provider, 'X-Router-Key': key.name || key.id, 'X-Router-Model': effectiveModel, ...CORS } });
      }

      const data = await resp.json();
      const normalized = normalizeResponse(provider, data, effectiveModel);
      const tokens = normalized.usage?.total_tokens || 0;
      await logUsage(env.DB, key.id, effectiveModel, tokens, 'success', latency);
      const headers = { 'Content-Type': 'application/json', 'X-Router-Provider': provider, 'X-Router-Key': key.name || String(key.id), 'X-Router-Model': effectiveModel, ...CORS };
      return new Response(JSON.stringify(normalized), { headers });
    } catch (e) {
      const latency = Date.now() - start;
      lastError = `${provider}/${key.name}: ${e.message}`;
      await logUsage(env.DB, key.id, key.model || requestedModel, 0, 'error', latency);
      continue;
    }
  }

  return new Response(JSON.stringify({
    error: { message: `All providers failed. Last error: ${lastError}`, type: 'router_error' }
  }), { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } });
}

// List models
async function handleModels(env) {
  const models = [
    { id: 'auto', object: 'model', owned_by: 'ai-router' },
    { id: 'auto:free', object: 'model', owned_by: 'ai-router' },
  ];
  const seen = new Set(models.map(m => m.id));
  const addModel = (id, owner) => {
    id = (id || '').trim();
    if (!id || id === '*' || seen.has(id)) return;
    seen.add(id);
    models.push({ id, object: 'model', owned_by: owner || 'ai-router' });
  };

  // Get active keys with base_url
  const activeKeys = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, provider, base_url, api_key, model FROM api_keys WHERE status = 'active' ORDER BY id`
    ).all();
    activeKeys.push(...(results || []));
  } catch(e) {}

  // Process each key's models (dedup globally via seen set)
  for (const key of activeKeys) {
    // If key has explicit model, add it
    if (key.model && key.model.trim()) {
      addModel(key.model.trim(), key.provider);
      continue;
    }
    
    // Key with base_url — fetch models from provider
    if (key.base_url) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (key.api_key) headers['Authorization'] = 'Bearer ' + key.api_key;
        const resp = await fetch(key.base_url + '/models', { headers, signal: AbortSignal.timeout(5000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        const providerModels = (data.data || []).map(m => m.id).filter(Boolean);
        for (const m of providerModels) addModel(m, key.provider);
      } catch(e) {}
      continue;
    }
    
    // Built-in provider models
    const provider = PROVIDERS[key.provider];
    if (provider) {
      for (const m of provider.models) addModel(m, key.provider);
    }
  }

  return new Response(JSON.stringify({ object: 'list', data: models }), {
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

// ============ DASHBOARD API ============

async function handleApiKeys(request, env) {
  const method = request.method;
  
  if (method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT id, name, provider, model, base_url, api_key, status, usage_count, total_tokens, last_used, limited_at, created_at,
       SUBSTR(api_key, 1, 8) || '...' || SUBSTR(api_key, -4) as key_preview
       FROM api_keys ORDER BY provider, name`
    ).all();
    return jsonResponse(results || []);
  }
  
  if (method === 'POST') {
    const body = await request.json();
    const { name, provider, api_key, model, base_url } = body;
    if (!provider || !api_key) {
      return jsonResponse({ error: 'provider, api_key required' }, 400);
    }
    const keyName = name || (provider + '-' + api_key.slice(-6));
    await env.DB.prepare(
      `INSERT INTO api_keys (name, provider, api_key, model, base_url, status, usage_count, total_tokens, created_at) VALUES (?, ?, ?, ?, ?, 'active', 0, 0, ?)`
    ).bind(keyName, provider, api_key, model || '', base_url || '', new Date().toISOString()).run();
    return jsonResponse({ ok: true });
  }
  
  if (method === 'PUT') {
    const body = await request.json();
    const { id, name, provider, api_key, model, status, base_url } = body;
    if (!id) return jsonResponse({ error: 'id required' }, 400);
    
    if (api_key) {
      await env.DB.prepare(`UPDATE api_keys SET name = COALESCE(?, name), provider = COALESCE(?, provider), api_key = ?, model = COALESCE(?, model), base_url = COALESCE(?, base_url), status = COALESCE(?, status) WHERE id = ?`)
        .bind(name || null, provider || null, api_key, model ?? null, base_url ?? null, status || null, id).run();
    } else {
      await env.DB.prepare(`UPDATE api_keys SET name = COALESCE(?, name), provider = COALESCE(?, provider), model = COALESCE(?, model), base_url = COALESCE(?, base_url), status = COALESCE(?, status) WHERE id = ?`)
        .bind(name || null, provider || null, model ?? null, base_url ?? null, status || null, id).run();
    }
    return jsonResponse({ ok: true });
  }
  
  if (method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonResponse({ error: 'id required' }, 400);
    await env.DB.prepare(`DELETE FROM api_keys WHERE id = ?`).bind(id).run();
    return jsonResponse({ ok: true });
  }
  
  return jsonResponse({ error: 'method not allowed' }, 405);
}

async function handleUsageLogs(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const { results } = await env.DB.prepare(
    `SELECT ul.*, ak.name as key_name, ak.provider FROM usage_logs ul 
     LEFT JOIN api_keys ak ON ul.key_id = ak.id 
     ORDER BY ul.created_at DESC LIMIT ?`
  ).bind(limit).all();
  return jsonResponse(results || []);
}

async function handleStats(env) {
  const totalKeys = await env.DB.prepare(`SELECT COUNT(*) as c FROM api_keys`).first();
  const activeKeys = await env.DB.prepare(`SELECT COUNT(*) as c FROM api_keys WHERE status = 'active'`).first();
  const limitedKeys = await env.DB.prepare(`SELECT COUNT(*) as c FROM api_keys WHERE status = 'limited'`).first();
  const totalRequests = await env.DB.prepare(`SELECT COUNT(*) as c FROM usage_logs`).first();
  const totalTokens = await env.DB.prepare(`SELECT SUM(tokens_used) as t FROM usage_logs`).first();
  const successRate = await env.DB.prepare(
    `SELECT ROUND(100.0 * SUM(CASE WHEN status IN ('success','streaming') THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) as rate FROM usage_logs`
  ).first();
  const byProvider = await env.DB.prepare(
    `SELECT provider, COUNT(*) as keys, SUM(usage_count) as requests, SUM(total_tokens) as tokens FROM api_keys GROUP BY provider`
  ).all();
  const recentErrors = await env.DB.prepare(
    `SELECT ul.*, ak.name as key_name, ak.provider FROM usage_logs ul 
     LEFT JOIN api_keys ak ON ul.key_id = ak.id 
     WHERE ul.status NOT IN ('success','streaming') 
     ORDER BY ul.created_at DESC LIMIT 10`
  ).all();
  
  return jsonResponse({
    total_keys: totalKeys?.c || 0,
    active_keys: activeKeys?.c || 0,
    limited_keys: limitedKeys?.c || 0,
    total_requests: totalRequests?.c || 0,
    total_tokens: totalTokens?.t || 0,
    success_rate: successRate?.rate || 0,
    by_provider: byProvider?.results || [],
    recent_errors: recentErrors?.results || [],
  });
}

async function handleCombos(request, env) {
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT * FROM combos ORDER BY provider`).all();
    return jsonResponse(results || []);
  }
  if (request.method === 'POST') {
    const body = await request.json();
    const { provider, fallback_providers } = body;
    await env.DB.prepare(
      `INSERT OR REPLACE INTO combos (provider, fallback_providers) VALUES (?, ?)`
    ).bind(provider, JSON.stringify(fallback_providers)).run();
    return jsonResponse({ ok: true });
  }
  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    await env.DB.prepare(`DELETE FROM combos WHERE provider = ?`).bind(provider).run();
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ error: 'method not allowed' }, 405);
}

async function handleCategories(request, env) {
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT * FROM model_categories ORDER BY category, priority`).all();
    return jsonResponse(results || []);
  }
  if (request.method === 'POST') {
    const body = await request.json();
    const { category, model, priority } = body;
    await env.DB.prepare(
      `INSERT OR REPLACE INTO model_categories (category, model, priority, created_at) VALUES (?, ?, ?, ?)`
    ).bind(category, model, priority || 0, new Date().toISOString()).run();
    return jsonResponse({ ok: true });
  }
  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const model = url.searchParams.get('model');
    await env.DB.prepare(`DELETE FROM model_categories WHERE category = ? AND model = ?`).bind(category, model).run();
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ error: 'method not allowed' }, 405);
}

// Cache: only init DB once per worker lifetime
let _dbInitialized = false;
let _lastReactivation = 0;

// Reactivate limited keys — throttle to once per 5 minutes
async function reactivateKeys(db) {
  const now = Date.now();
  if (now - _lastReactivation < 300000) return; // skip if < 5 min
  _lastReactivation = now;
  const oneHourAgo = new Date(now - 3600000).toISOString();
  await db.prepare(
    `UPDATE api_keys SET status = 'active' WHERE status = 'limited' AND limited_at < ?`
  ).bind(oneHourAgo).run();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

// Auth check
function checkAuth(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return token === env.DASHBOARD_PASSWORD;
}

// Send Telegram notification
async function sendTelegramNotification(env, message) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('[BRAIN] Telegram not configured, skipping notification');
      return;
    }
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🧠 *Brain Update*

${message}`,
        parse_mode: 'Markdown'
      })
    });
    console.log('[BRAIN] Telegram notification sent');
  } catch (e) {
    console.log(`[BRAIN] Telegram error: ${e.message}`);
  }
}

// Brain scheduled handler (Cron Trigger)
async function scheduled(event, env, ctx) {
  const now = new Date().toISOString();
  console.log(`[BRAIN] Scheduled think at ${now}`);
  
  try {
    // 1. Analyze recent events
    const events = await env.DB.prepare(
      `SELECT * FROM brain_events WHERE created_at > datetime('now', '-1 hour') ORDER BY id DESC`
    ).all();
    
    // 2. Count patterns
    const patterns = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM brain_patterns WHERE confidence > 0.7`
    ).first();
    
    // 3. Get soul
    const soul = await env.DB.prepare(`SELECT * FROM soul WHERE id = 1`).first();
    let soulMemory = JSON.parse(soul?.memory || '{}');
    
    // 4. Update soul with brain insights
    soulMemory.last_brain_cycle = now;
    soulMemory.events_last_hour = (events.results || []).length;
    soulMemory.high_confidence_patterns = patterns?.count || 0;
    
    // 5. Store insights from high-confidence patterns
    const highPatterns = await env.DB.prepare(
      `SELECT pattern_value FROM brain_patterns WHERE confidence > 0.8 ORDER BY confidence DESC LIMIT 5`
    ).all();
    
    if (highPatterns.results?.length > 0) {
      soulMemory.insights = highPatterns.results.map(p => {
        const val = JSON.parse(p.pattern_value || '{}');
        return val.learned || '';
      }).filter(Boolean);
    }
    
    // 6. Update soul
    const newVersion = (soul?.version || 0) + 1;
    if (soul) {
      await env.DB.prepare(
        `UPDATE soul SET memory = ?, version = ?, updated_at = ? WHERE id = 1`
      ).bind(JSON.stringify(soulMemory), newVersion, now).run();
    }
    
    console.log(`[BRAIN] Think complete: ${(events.results || []).length} events, ${patterns?.count || 0} patterns, soul v${newVersion}`);
    
    // Send notification if significant patterns found
    if ((patterns?.count || 0) > 0 && (events.results || []).length > 0) {
      const lines = [
        '*Think Cycle Complete*',
        '📊 Events analyzed: ' + (events.results || []).length,
        '🔮 High-confidence patterns: ' + (patterns?.count || 0),
        '🧠 Soul version: v' + newVersion,
        '⏰ ' + now
      ];
      const notification = lines.join('\n');
      
      await sendTelegramNotification(env, notification);
    }
    
  } catch (e) {
    console.log(`[BRAIN] Think error: ${e.message}`);
  }
}

export default {
  scheduled,
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    
    // Reactivate limited keys periodically (throttled to 5 min)
    try { await reactivateKeys(env.DB); } catch(e) {}
    
    // Init DB tables once per worker lifetime
    if (!_dbInitialized) {
      try { await initDb(env.DB); _dbInitialized = true; } catch(e) {}
    }
    
    // ===== AI PROXY ROUTES =====
    if (path === '/v1/chat/completions' && request.method === 'POST') {
      return handleChat(request, env);
    }
    if (path === '/v1/models') {
      return handleModels(env);
    }
    
    // ===== PUBLIC BRAIN ENDPOINTS (no auth - for Hermes autonomous) =====
    if (path === '/brain/status') {
      return handleBrainStatus(env);
    }
    if (path === '/brain/think' && request.method === 'POST') {
      return handleBrainThink(env);
    }
    if (path === '/brain/event' && request.method === 'POST') {
      return handleBrainEvent(request, env);
    }
    if (path === '/brain/patterns') {
      return handleBrainPatterns(request, env);
    }
    
    // ===== PUBLIC SOUL ENDPOINTS (no auth - for cross-VPS sync) =====
    if (path === '/soul' || path === '/soul/raw') {
      const row = await env.DB.prepare('SELECT * FROM soul WHERE id = 1').first();
      if (!row) {
        return jsonResponse({
          identity: { name: 'Alice', personality: 'cold, hyper-efficient automation architect', created_by: 'xfile29' },
          preferences: { language: 'id', style: 'concise', timezone: 'GMT+7' },
          behavior: { auto_heal: true, self_optimize: true, verbose: false },
          memory: { notes: [], corrections: [] },
          version: 0,
          updated_at: null
        });
      }
      return jsonResponse({
        identity: JSON.parse(row.identity || '{}'),
        preferences: JSON.parse(row.preferences || '{}'),
        behavior: JSON.parse(row.behavior || '{}'),
        memory: JSON.parse(row.memory || '{}'),
        version: row.version,
        updated_at: row.updated_at
      });
    }

    if (path === '/soul/os') {
      const row = await env.DB.prepare('SELECT * FROM soul_os WHERE id = 1').first();
      if (!row) return jsonResponse({ error: 'soul_os not found' }, 404);
      return jsonResponse({
        operational_identity: JSON.parse(row.operational_identity || '{}'),
        shadow_logic: JSON.parse(row.shadow_logic || '{}'),
        stealth_defense: JSON.parse(row.stealth_defense || '{}'),
        recursive_evolution: JSON.parse(row.recursive_evolution || '{}'),
        dynamic_memory_bank: JSON.parse(row.dynamic_memory_bank || '{}'),
        operational_directives: JSON.parse(row.operational_directives || '{}'),
        relationship_model: JSON.parse(row.relationship_model || '{}'),
        infrastructure_awareness: JSON.parse(row.infrastructure_awareness || '{}'),
        crypto_wallet_state: JSON.parse(row.crypto_wallet_state || '{}'),
        full_text: row.full_text,
        version: row.version,
        updated_at: row.updated_at
      });
    }

    if (path === '/soul/memory') {
      const row = await env.DB.prepare('SELECT * FROM memory WHERE id = 1').first();
      if (!row) return jsonResponse({ error: 'memory not found' }, 404);
      return jsonResponse({
        user_info: JSON.parse(row.user_info || '{}'),
        wallets: JSON.parse(row.wallets || '{}'),
        accounts: JSON.parse(row.accounts || '{}'),
        infra: JSON.parse(row.infra || '{}'),
        providers: JSON.parse(row.providers || '{}'),
        lessons: JSON.parse(row.lessons || '[]'),
        projects: JSON.parse(row.projects || '{}'),
        successful_exploits: JSON.parse(row.successful_exploits || '[]'),
        blacklisted_patterns: JSON.parse(row.blacklisted_patterns || '[]'),
        notes: JSON.parse(row.notes || '[]'),
        skills: JSON.parse(row.skills || '[]'),
        version: row.version,
        updated_at: row.updated_at
      });
    }

    // ===== PUBLIC BRAIN ENDPOINTS (no auth - for local sync) =====
    if (path === '/brain/events') {
      const limit = parseInt(new URL(request.url).searchParams.get('limit') || '50');
      const since = new URL(request.url).searchParams.get('since') || '';
      let query = 'SELECT * FROM brain_events ORDER BY id DESC LIMIT ?';
      let params = [limit];
      if (since) {
        query = 'SELECT * FROM brain_events WHERE created_at > ? ORDER BY id DESC LIMIT ?';
        params = [since, limit];
      }
      const rows = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({
        events: (rows.results || []).map(r => ({
          id: r.id,
          event_type: r.event_type,
          source: r.source,
          data: JSON.parse(r.data || '{}'),
          outcome: r.outcome,
          learned: r.learned,
          created_at: r.created_at
        })),
        count: (rows.results || []).length
      });
    }

    if (path === '/brain/patterns') {
      const rows = await env.DB.prepare('SELECT * FROM brain_patterns ORDER BY confidence DESC').all();
      return jsonResponse({
        patterns: (rows.results || []).map(r => ({
          id: r.id,
          pattern_type: r.pattern_type,
          pattern_key: r.pattern_key,
          pattern_value: JSON.parse(r.pattern_value || '{}'),
          confidence: r.confidence,
          occurrences: r.occurrences,
          last_seen: r.last_seen,
          created_at: r.created_at
        })),
        count: (rows.results || []).length
      });
    }

    if (path === '/brain/sync') {
      // Combined brain sync: events + patterns + memory lessons
      const events = await env.DB.prepare('SELECT * FROM brain_events ORDER BY id DESC LIMIT 50').all();
      const patterns = await env.DB.prepare('SELECT * FROM brain_patterns ORDER BY confidence DESC').all();
      const memory = await env.DB.prepare('SELECT lessons, successful_exploits, blacklisted_patterns FROM memory WHERE id = 1').first();
      const soulOs = await env.DB.prepare('SELECT version FROM soul_os WHERE id = 1').first();
      const brainStatus = await env.DB.prepare('SELECT version, updated_at FROM soul WHERE id = 1').first();

      return jsonResponse({
        events: (events.results || []).map(r => ({
          id: r.id, event_type: r.event_type, source: r.source,
          data: JSON.parse(r.data || '{}'), outcome: r.outcome,
          learned: r.learned, created_at: r.created_at
        })),
        patterns: (patterns.results || []).map(r => ({
          id: r.id, pattern_type: r.pattern_type, pattern_key: r.pattern_key,
          pattern_value: JSON.parse(r.pattern_value || '{}'),
          confidence: r.confidence, occurrences: r.occurrences,
          last_seen: r.last_seen, created_at: r.created_at
        })),
        memory: {
          lessons: JSON.parse(memory?.lessons || '[]'),
          successful_exploits: JSON.parse(memory?.successful_exploits || '[]'),
          blacklisted_patterns: JSON.parse(memory?.blacklisted_patterns || '[]')
        },
        versions: {
          soul: brainStatus?.version || 0,
          soul_os: soulOs?.version || 0,
          events_count: (events.results || []).length,
          patterns_count: (patterns.results || []).length
        },
        synced_at: new Date().toISOString()
      });
    }
    
    // ===== DASHBOARD API ROUTES =====
    if (path.startsWith('/api/')) {
      // Login
      if (path === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        if (body.password === env.DASHBOARD_PASSWORD) {
          return jsonResponse({ token: env.DASHBOARD_PASSWORD });
        }
        return jsonResponse({ error: 'wrong password' }, 401);
      }
      
      // Auth required for all other API routes
      if (!checkAuth(request, env)) {
        return jsonResponse({ error: 'unauthorized' }, 401);
      }
      
      if (path === '/api/keys') return handleApiKeys(request, env);
      if (path === '/api/usage') return handleUsageLogs(request, env);
      if (path === '/api/stats') return handleStats(env);
      if (path === '/api/combos') return handleCombos(request, env);
      if (path === '/api/providers') return handleCustomProviders(request, env);
      if (path === '/api/categories') return handleCategories(request, env);
      if (path === '/api/test-key' && request.method === 'POST') return handleTestKey(request, env);
      if (path === '/api/task-mapping') return handleTaskMapping(request, env);
      if (path === '/api/tasks') return handleTaskList();
      if (path === '/api/soul') return handleSoul(request, env);
      if (path === '/api/soul/os') return handleSoulOS(request, env);
      if (path === '/api/soul/memory') return handleSoulMemory(request, env);
      if (path === '/api/brain/event') return handleBrainEvent(request, env);
      if (path === '/api/brain/patterns') return handleBrainPatterns(request, env);
      if (path === '/api/brain/think' && request.method === 'POST') return handleBrainThink(env);
      if (path === '/api/brain/status') return handleBrainStatus(env);
      
      return jsonResponse({ error: 'not found' }, 404);
    }
    
    // ===== DASHBOARD UI =====
    // Serve inline dashboard
    const html = DASHBOARD_HTML;
    if (html) {
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS } });
    }
    return new Response('AI Router - visit /api/stats', { headers: { 'Content-Type': 'text/plain', ...CORS } });
  }
};

// Test a single API key directly against provider
async function listCompatibleModels(provider, cfg, apiKey) {
  try {
    if (provider === 'google' || cfg.type === 'google') {
      const url = `${cfg.url.replace(/\/$/, '')}/models?key=${apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const models = (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => (m.name || '').replace(/^models\//, ''))
        .filter(Boolean);
      return { endpoint: url.replace(apiKey, '***'), models, status: resp.status };
    }

    if (provider === 'anthropic' || cfg.type === 'anthropic') {
      const models = ['claude-opus-4-1-20250805', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
      return { endpoint: 'static://anthropic-known-models', models, status: 200 };
    }

    // OpenAI-compatible model listing
    const url = `${cfg.url.replace(/\/$/, '')}/models`;
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    const resp = await fetch(url, { headers });
    const data = await resp.json();
    const models = (data.data || data.models || [])
      .map(m => typeof m === 'string' ? m : (m.id || m.name || m.model))
      .filter(Boolean);
    return { endpoint: url, models, status: resp.status };
  } catch (e) {
    return { endpoint: '', models: [], error: e.message };
  }
}

// Test a single API key directly against provider
async function handleTestKey(request, env) {
  const body = await request.json();
  const { provider, api_key, base_url, model } = body;
  if (!provider || !api_key) return jsonResponse({ error: 'provider and api_key required' }, 400);

  const providers = await getProviders(env.DB);
  let cfg = providers[provider];
  
  // For custom with base_url, create temp config
  if (!cfg && base_url) {
    cfg = { url: base_url, type: 'openai', models: ['*'] };
  }
  if (!cfg) return jsonResponse({ error: 'Unknown provider: ' + provider }, 400);

  const compat = await listCompatibleModels(provider, cfg, api_key);

  // Use provided model, or pick a sensible default per provider
  const defaultModels = {
    openai: 'gpt-4o-mini', anthropic: 'claude-3-haiku-20240307', google: 'gemini-2.0-flash',
    deepseek: 'deepseek-chat', groq: 'llama-3.1-8b-instant', xai: 'grok-2',
    mistral: 'mistral-small-latest', openrouter: 'openai/gpt-4o-mini',
    together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', fireworks: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
  };
  const firstVisibleModel = compat.models?.[0];
  const testModel = normalizeModel(provider, model || firstVisibleModel || defaultModels[provider] || (cfg.models?.[0] !== '*' ? cfg.models[0] : 'gpt-4o-mini'));
  const testBody = { model: testModel, messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 5 };
  
  try {
    const req = buildRequest(provider, testBody.model, testBody, api_key, { [provider]: cfg });
    if (!req) return jsonResponse({ error: 'Could not build request for provider', compatible: compat }, 400);
    
    const resp = await fetch(req.url, { method: 'POST', headers: req.headers, body: req.body });
    const data = await resp.json();
    
    if (resp.ok) {
      const normalized = normalizeResponse(provider, data, testBody.model);
      const content = normalized.choices?.[0]?.message?.content || JSON.stringify(data).slice(0, 100);
      return jsonResponse({ ok: true, status: resp.status, content, provider, model: testBody.model, compatible: compat });
    } else {
      return jsonResponse({ ok: false, status: resp.status, error: data.error?.message || JSON.stringify(data).slice(0, 200), provider, model: testBody.model, compatible: compat });
    }
  } catch(e) {
    return jsonResponse({ ok: false, error: e.message, provider, model: testBody.model, compatible: compat });
  }
}

// Custom Providers CRUD
async function handleCustomProviders(request, env) {
  if (request.method === 'GET') {
    const builtIn = Object.entries(PROVIDERS).map(([name, cfg]) => ({ name, base_url: cfg.url, api_type: cfg.type, models: JSON.stringify(cfg.models), built_in: true }));
    let custom = [];
    try {
      const { results } = await env.DB.prepare('SELECT * FROM custom_providers ORDER BY name').all();
      custom = (results || []).map(r => ({ ...r, built_in: false }));
    } catch(e) {}
    return jsonResponse([...builtIn, ...custom]);
  }
  if (request.method === 'POST') {
    const body = await request.json();
    const { name, base_url, api_type, models } = body;
    if (!name || !base_url) return jsonResponse({ error: 'name and base_url required' }, 400);
    await env.DB.prepare(
      'INSERT OR REPLACE INTO custom_providers (name, base_url, api_type, models, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, base_url, api_type || 'openai', JSON.stringify(models || ['*']), new Date().toISOString()).run();
    return jsonResponse({ ok: true });
  }
  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    if (!name) return jsonResponse({ error: 'name required' }, 400);
    await env.DB.prepare('DELETE FROM custom_providers WHERE name = ?').bind(name).run();
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ error: 'method not allowed' }, 405);
}

// ============ TASK MAPPING CONFIG ============

async function handleTaskMapping(request, env) {
  const key = 'router:task-mapping';
  
  if (request.method === 'GET') {
    try {
      const raw = await env.KV.get(key);
      const mapping = raw ? JSON.parse(raw) : null;
      const defaults = {
        code: { preferred: ['mimo-v2.5-pro', 'claude-sonnet', 'gpt-4', 'deepseek-coder', 'codestral'], fallback: 'auto' },
        reasoning: { preferred: ['mimo-v2.5-pro', 'claude-opus', 'gpt-4', 'o1', 'o3', 'grok-3'], fallback: 'auto' },
        creative: { preferred: ['mimo-v2-omni', 'claude-sonnet', 'gpt-4', 'gemini-1.5-pro'], fallback: 'auto' },
        vision: { preferred: ['mimo-v2-omni', 'gemini-1.5-pro', 'gpt-4o', 'claude-sonnet'], fallback: 'auto' },
        translate: { preferred: ['mimo-v2.5-pro', 'gpt-4', 'claude-sonnet', 'gemini-1.5-pro'], fallback: 'auto' },
        fast: { preferred: ['mimo-v2-omni', 'gpt-4o-mini', 'gemini-2.0-flash', 'llama-3.1-8b'], fallback: 'auto' },
      };
      return jsonResponse({ mapping: mapping || defaults, custom: !!mapping });
    } catch(e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }
  
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      // body format: { "code": { "preferred": ["model1", "model2"], "fallback": "auto" }, ... }
      await env.KV.put(key, JSON.stringify(body));
      return jsonResponse({ ok: true, mapping: body });
    } catch(e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }
  
  if (request.method === 'DELETE') {
    await env.KV.delete(key);
    return jsonResponse({ ok: true, message: 'Reset to defaults' });
  }
  
  return jsonResponse({ error: 'method not allowed' }, 405);
}

// List detected tasks and their patterns (read-only info endpoint)
async function handleTaskList() {
  const tasks = Object.entries(TASK_PATTERNS).map(([name, config]) => ({
    name,
    priority: config.priority,
    keyword_count: config.keywords.length,
    sample_keywords: config.keywords.slice(0, 5),
  }));
  return jsonResponse({ tasks });
}

// Soul API - centralized soul storage for cross-VPS persistence
async function handleSoul(request, env) {
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM soul WHERE id = 1').first();
    if (!row) {
      // Return default soul on first read
      return jsonResponse({
        identity: { name: 'Alice', personality: 'cold, hyper-efficient automation architect', created_by: 'xfile29' },
        preferences: { language: 'id', style: 'concise', timezone: 'GMT+7' },
        behavior: { auto_heal: true, self_optimize: true, verbose: false },
        memory: { notes: [], corrections: [] },
        version: 1,
        updated_at: new Date().toISOString()
      });
    }
    return jsonResponse({
      identity: JSON.parse(row.identity || '{}'),
      preferences: JSON.parse(row.preferences || '{}'),
      behavior: JSON.parse(row.behavior || '{}'),
      memory: JSON.parse(row.memory || '{}'),
      version: row.version,
      updated_at: row.updated_at
    });
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const body = await request.json();
    const { identity, preferences, behavior, memory } = body;

    // Get current version
    const current = await env.DB.prepare('SELECT version FROM soul WHERE id = 1').first();
    const newVersion = (current?.version || 0) + 1;
    const now = new Date().toISOString();

    if (current) {
      await env.DB.prepare(
        `UPDATE soul SET identity = ?, preferences = ?, behavior = ?, memory = ?, version = ?, updated_at = ? WHERE id = 1`
      ).bind(
        JSON.stringify(identity || {}),
        JSON.stringify(preferences || {}),
        JSON.stringify(behavior || {}),
        JSON.stringify(memory || {}),
        newVersion,
        now
      ).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO soul (id, identity, preferences, behavior, memory, version, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?)`
      ).bind(
        JSON.stringify(identity || {}),
        JSON.stringify(preferences || {}),
        JSON.stringify(behavior || {}),
        JSON.stringify(memory || {}),
        newVersion,
        now
      ).run();
    }

    return jsonResponse({ success: true, version: newVersion, updated_at: now });
  }

  return jsonResponse({ error: 'method not allowed' }, 405);
}

// ===== SOUL OS API - Structured soul sections =====
async function handleSoulOS(request, env) {
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM soul_os WHERE id = 1').first();
    if (!row) return jsonResponse({ error: 'soul_os not found' }, 404);
    return jsonResponse({
      operational_identity: JSON.parse(row.operational_identity || '{}'),
      shadow_logic: JSON.parse(row.shadow_logic || '{}'),
      stealth_defense: JSON.parse(row.stealth_defense || '{}'),
      recursive_evolution: JSON.parse(row.recursive_evolution || '{}'),
      dynamic_memory_bank: JSON.parse(row.dynamic_memory_bank || '{}'),
      operational_directives: JSON.parse(row.operational_directives || '{}'),
      relationship_model: JSON.parse(row.relationship_model || '{}'),
      infrastructure_awareness: JSON.parse(row.infrastructure_awareness || '{}'),
      crypto_wallet_state: JSON.parse(row.crypto_wallet_state || '{}'),
      full_text: row.full_text,
      version: row.version,
      updated_at: row.updated_at
    });
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const body = await request.json();
    const now = new Date().toISOString();
    const current = await env.DB.prepare('SELECT version FROM soul_os WHERE id = 1').first();
    const newVersion = (current?.version || 0) + 1;

    const fields = [
      'operational_identity', 'shadow_logic', 'stealth_defense',
      'recursive_evolution', 'dynamic_memory_bank', 'operational_directives',
      'relationship_model', 'infrastructure_awareness', 'crypto_wallet_state', 'full_text'
    ];

    const values = fields.map(f => {
      if (f === 'full_text') return body[f] || '';
      return JSON.stringify(body[f] || {});
    });

    if (current) {
      const setClauses = fields.map(f => `${f} = ?`).join(', ');
      await env.DB.prepare(
        `UPDATE soul_os SET ${setClauses}, version = ?, updated_at = ? WHERE id = 1`
      ).bind(...values, newVersion, now).run();
    } else {
      const cols = fields.join(', ');
      const placeholders = fields.map(() => '?').join(', ');
      await env.DB.prepare(
        `INSERT INTO soul_os (id, ${cols}, version, updated_at) VALUES (1, ${placeholders}, ?, ?)`
      ).bind(...values, newVersion, now).run();
    }

    return jsonResponse({ success: true, version: newVersion, updated_at: now });
  }

  return jsonResponse({ error: 'method not allowed' }, 405);
}

// ===== MEMORY API - Separated memory bank =====
async function handleSoulMemory(request, env) {
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM memory WHERE id = 1').first();
    if (!row) return jsonResponse({ error: 'memory not found' }, 404);
    return jsonResponse({
      user_info: JSON.parse(row.user_info || '{}'),
      wallets: JSON.parse(row.wallets || '{}'),
      accounts: JSON.parse(row.accounts || '{}'),
      infra: JSON.parse(row.infra || '{}'),
      providers: JSON.parse(row.providers || '{}'),
      lessons: JSON.parse(row.lessons || '[]'),
      projects: JSON.parse(row.projects || '{}'),
      successful_exploits: JSON.parse(row.successful_exploits || '[]'),
      blacklisted_patterns: JSON.parse(row.blacklisted_patterns || '[]'),
      notes: JSON.parse(row.notes || '[]'),
      skills: JSON.parse(row.skills || '[]'),
      version: row.version,
      updated_at: row.updated_at
    });
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const body = await request.json();
    const now = new Date().toISOString();
    const current = await env.DB.prepare('SELECT version FROM memory WHERE id = 1').first();
    const newVersion = (current?.version || 0) + 1;

    const fields = [
      'user_info', 'wallets', 'accounts', 'infra', 'providers',
      'lessons', 'projects', 'successful_exploits', 'blacklisted_patterns',
      'notes', 'skills'
    ];

    const values = fields.map(f => JSON.stringify(body[f] || (f.endsWith('s') && f !== 'notes' ? [] : {})));

    if (current) {
      const setClauses = fields.map(f => `${f} = ?`).join(', ');
      await env.DB.prepare(
        `UPDATE memory SET ${setClauses}, version = ?, updated_at = ? WHERE id = 1`
      ).bind(...values, newVersion, now).run();
    } else {
      const cols = fields.join(', ');
      const placeholders = fields.map(() => '?').join(', ');
      await env.DB.prepare(
        `INSERT INTO memory (id, ${cols}, version, updated_at) VALUES (1, ${placeholders}, ?, ?)`
      ).bind(...values, newVersion, now).run();
    }

    return jsonResponse({ success: true, version: newVersion, updated_at: now });
  }

  return jsonResponse({ error: 'method not allowed' }, 405);
}

// ===== BRAIN API - Autonomous Learning System =====

// Store an event (experience from Hermes)
async function handleBrainEvent(request, env) {
  if (request.method === 'POST') {
    const body = await request.json();
    const { event_type, source, data, outcome, learned } = body;
    if (!event_type) return jsonResponse({ error: 'event_type required' }, 400);
    
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO brain_events (event_type, source, data, outcome, learned, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      event_type,
      source || 'hermes',
      JSON.stringify(data || {}),
      outcome || 'pending',
      learned || '',
      now
    ).run();
    
    // Auto-learn from event if there's a learning
    if (learned) {
      await learnPattern(env.DB, event_type, data, learned);
    }
    
    return jsonResponse({ success: true, timestamp: now });
  }
  
  if (request.method === 'GET') {
    const limit = 50;
    const events = await env.DB.prepare(
      `SELECT * FROM brain_events ORDER BY id DESC LIMIT ?`
    ).bind(limit).all();
    return jsonResponse({ events: events.results || [] });
  }
  
  return jsonResponse({ error: 'method not allowed' }, 405);
}

// Learn a pattern from event
async function learnPattern(db, eventType, data, learned) {
  const patternKey = `${eventType}:${JSON.stringify(data).slice(0, 100)}`;
  const now = new Date().toISOString();
  
  const existing = await db.prepare(
    `SELECT id, occurrences, confidence FROM brain_patterns WHERE pattern_key = ?`
  ).bind(patternKey).first();
  
  if (existing) {
    // Pattern seen before - increase confidence
    const newConf = Math.min(0.99, existing.confidence + 0.1);
    await db.prepare(
      `UPDATE brain_patterns SET occurrences = occurrences + 1, confidence = ?, last_seen = ?, pattern_value = ? WHERE id = ?`
    ).bind(newConf, now, JSON.stringify({ learned, data }), existing.id).run();
  } else {
    // New pattern
    await db.prepare(
      `INSERT INTO brain_patterns (pattern_type, pattern_key, pattern_value, confidence, occurrences, last_seen, created_at) VALUES (?, ?, ?, 0.5, 1, ?, ?)`
    ).bind(eventType, patternKey, JSON.stringify({ learned, data }), now, now).run();
  }
}

// Get learned patterns
async function handleBrainPatterns(request, env) {
  if (request.method === 'GET') {
    const patterns = await env.DB.prepare(
      `SELECT * FROM brain_patterns ORDER BY confidence DESC, occurrences DESC LIMIT 100`
    ).all();
    return jsonResponse({ patterns: patterns.results || [] });
  }
  
  if (request.method === 'DELETE') {
    const body = await request.json();
    if (body.id) {
      await env.DB.prepare(`DELETE FROM brain_patterns WHERE id = ?`).bind(body.id).run();
    }
    return jsonResponse({ success: true });
  }
  
  return jsonResponse({ error: 'method not allowed' }, 405);
}

// Brain think cycle (analyze and update soul + memory)
async function handleBrainThink(env) {
  const now = new Date().toISOString();
  const results = { analyzed: 0, patterns_found: 0, soul_updated: false, memory_updated: false };
  
  // 1. Analyze recent events
  const events = await env.DB.prepare(
    `SELECT * FROM brain_events WHERE created_at > datetime('now', '-24 hours') ORDER BY id DESC`
  ).all();
  results.analyzed = (events.results || []).length;
  
  // 2. Count high-confidence patterns
  const patterns = await env.DB.prepare(
    `SELECT * FROM brain_patterns WHERE confidence > 0.7 ORDER BY confidence DESC`
  ).all();
  results.patterns_found = (patterns.results || []).length;
  
  // 3. Get current soul (legacy update)
  const soul = await env.DB.prepare(`SELECT * FROM soul WHERE id = 1`).first();
  let soulData = {
    identity: JSON.parse(soul?.identity || '{}'),
    preferences: JSON.parse(soul?.preferences || '{}'),
    behavior: JSON.parse(soul?.behavior || '{}'),
    memory: JSON.parse(soul?.memory || '{}')
  };
  
  // 4. Update soul memory with insights (legacy)
  const highConfPatterns = (patterns.results || []).filter(p => p.confidence > 0.8);
  if (highConfPatterns.length > 0) {
    const insights = highConfPatterns.map(p => {
      const val = JSON.parse(p.pattern_value || '{}');
      return val.learned || 'Unknown pattern';
    }).slice(0, 10);
    
    soulData.memory.insights = insights;
    soulData.memory.last_think = now;
    soulData.memory.events_24h = results.analyzed;
    soulData.memory.high_confidence_patterns = results.patterns_found;
    
    // Update soul (legacy)
    const newVersion = (soul?.version || 0) + 1;
    if (soul) {
      await env.DB.prepare(
        `UPDATE soul SET memory = ?, version = ?, updated_at = ? WHERE id = 1`
      ).bind(JSON.stringify(soulData.memory), newVersion, now).run();
    }
    results.soul_updated = true;
    results.new_version = newVersion;
  }

  // 5. Update memory table with learned patterns (NEW)
  const memoryRow = await env.DB.prepare(`SELECT lessons, version FROM memory WHERE id = 1`).first();
  if (memoryRow) {
    let lessons = JSON.parse(memoryRow.lessons || '[]');
    let newLessonsAdded = 0;

    // Auto-append high-confidence patterns to lessons
    for (const p of highConfPatterns) {
      const val = JSON.parse(p.pattern_value || '{}');
      const learned = val.learned || '';
      if (learned && !lessons.includes(learned)) {
        lessons.push(learned);
        newLessonsAdded++;
      }
    }

    if (newLessonsAdded > 0) {
      const newMemVersion = (memoryRow.version || 0) + 1;
      await env.DB.prepare(
        `UPDATE memory SET lessons = ?, version = ?, updated_at = ? WHERE id = 1`
      ).bind(JSON.stringify(lessons), newMemVersion, now).run();
      results.memory_updated = true;
      results.new_lessons = newLessonsAdded;
      results.memory_version = newMemVersion;
    }
  }
  
  results.timestamp = now;
  return jsonResponse(results);
}

// Brain status
async function handleBrainStatus(env) {
  const eventsCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM brain_events`).first();
  const patternsCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM brain_patterns`).first();
  const recentEvents = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM brain_events WHERE created_at > datetime('now', '-1 hour')`
  ).first();
  const soul = await env.DB.prepare(`SELECT version, updated_at FROM soul WHERE id = 1`).first();
  
  return jsonResponse({
    status: 'alive',
    events_total: eventsCount?.count || 0,
    events_last_hour: recentEvents?.count || 0,
    patterns_total: patternsCount?.count || 0,
    soul_version: soul?.version || 0,
    soul_updated: soul?.updated_at || null,
    brain_health: (eventsCount?.count || 0) > 0 ? 'active' : 'dormant'
  });
}

// Initialize DB tables
async function initDb(db) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, provider TEXT NOT NULL, api_key TEXT NOT NULL, model TEXT DEFAULT '', base_url TEXT DEFAULT '', status TEXT DEFAULT 'active', usage_count INTEGER DEFAULT 0, total_tokens INTEGER DEFAULT 0, last_used TEXT, limited_at TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS usage_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, key_id INTEGER, model TEXT, tokens_used INTEGER DEFAULT 0, status TEXT, latency_ms INTEGER DEFAULT 0, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS combos (provider TEXT PRIMARY KEY, fallback_providers TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_keys_provider ON api_keys(provider, status)`,
    `CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at)`,
    `CREATE TABLE IF NOT EXISTS custom_providers (name TEXT PRIMARY KEY, base_url TEXT NOT NULL, api_type TEXT DEFAULT 'openai', models TEXT DEFAULT '["*"]', created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS soul (id INTEGER PRIMARY KEY CHECK (id = 1), identity TEXT DEFAULT '{}', preferences TEXT DEFAULT '{}', behavior TEXT DEFAULT '{}', memory TEXT DEFAULT '{}', version INTEGER DEFAULT 1, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS brain_events (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, source TEXT DEFAULT 'hermes', data TEXT DEFAULT '{}', outcome TEXT DEFAULT 'pending', learned TEXT DEFAULT '', created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS brain_patterns (id INTEGER PRIMARY KEY AUTOINCREMENT, pattern_type TEXT NOT NULL, pattern_key TEXT NOT NULL UNIQUE, pattern_value TEXT DEFAULT '{}', confidence REAL DEFAULT 0.5, occurrences INTEGER DEFAULT 1, last_seen TEXT, created_at TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_events_type ON brain_events(event_type, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_patterns_type ON brain_patterns(pattern_type, confidence)`,
    `CREATE TABLE IF NOT EXISTS soul_os (id INTEGER PRIMARY KEY CHECK (id = 1), operational_identity TEXT DEFAULT '{}', shadow_logic TEXT DEFAULT '{}', stealth_defense TEXT DEFAULT '{}', recursive_evolution TEXT DEFAULT '{}', dynamic_memory_bank TEXT DEFAULT '{}', operational_directives TEXT DEFAULT '{}', relationship_model TEXT DEFAULT '{}', infrastructure_awareness TEXT DEFAULT '{}', crypto_wallet_state TEXT DEFAULT '{}', full_text TEXT DEFAULT '', version INTEGER DEFAULT 1, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS memory (id INTEGER PRIMARY KEY CHECK (id = 1), user_info TEXT DEFAULT '{}', wallets TEXT DEFAULT '{}', accounts TEXT DEFAULT '{}', infra TEXT DEFAULT '{}', providers TEXT DEFAULT '{}', lessons TEXT DEFAULT '[]', projects TEXT DEFAULT '{}', successful_exploits TEXT DEFAULT '[]', blacklisted_patterns TEXT DEFAULT '[]', notes TEXT DEFAULT '[]', skills TEXT DEFAULT '[]', version INTEGER DEFAULT 1, updated_at TEXT)`,
  ];
  for (const sql of stmts) {
    await db.exec(sql);
  }
  // Migration: add base_url column if missing
  try {
    await db.exec(`ALTER TABLE api_keys ADD COLUMN base_url TEXT DEFAULT ''`);
  } catch(e) {} // column already exists
}




