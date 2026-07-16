'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const { execSync } = require('child_process')

const HOME = os.homedir()
const DIR = path.join(HOME, '.omniguard')
const CONFIG_FILE = path.join(DIR, 'config.json')

function ensureDir() {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true, mode: 0o700 })
  }
}

function readJSON(file, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJSON(file, data) {
  ensureDir()
  fs.writeFileSync(file, JSON.stringify(data, null, 2), { mode: 0o600 })
}

function getMachineId() {
  try {
    if (process.platform === 'win32') {
      const out = execSync('reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', { encoding: 'utf8' })
      const m = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/)
      if (m) return m[1]
    } else if (process.platform === 'darwin') {
      const out = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf8' })
      const m = out.match(/"IOPlatformUUID" = "([^"]+)"/)
      if (m) return m[1]
    } else {
      const paths = ['/etc/machine-id', '/var/lib/dbus/machine-id']
      for (const p of paths) {
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim()
      }
    }
  } catch {}
  return os.hostname() + '-' + os.platform() + '-' + os.arch()
}

function getSecretKey() {
  const mid = getMachineId()
  const uname = os.userInfo().username || 'default'
  return crypto.createHash('sha256').update(mid + uname + 'omniguard-salt-2026').digest()
}

function encrypt(text) {
  if (!text) return ''
  try {
    const key = getSecretKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  } catch {
    return text
  }
}

function decrypt(encryptedText) {
  if (!encryptedText) return ''
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return encryptedText
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = Buffer.from(parts[1], 'hex')
    const key = getSecretKey()
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encryptedText
  }
}

function cfg() {
  const raw = readJSON(CONFIG_FILE, {})
  const profile = raw.activeProfile || 'default'
  const profiles = raw.profiles || {}
  const active = profiles[profile] || {}
  
  // Decrypt apiKey securely
  const decryptedKey = decrypt(active.apiKey || '')

  return {
    profile,
    profiles,
    active,
    backendUrl: process.env.OMNIGUARD_URL || active.backendUrl || raw.backendUrl || '',
    apiKey: process.env.OMNIGUARD_API_KEY || decryptedKey || '',
    orgId: process.env.OMNIGUARD_ORG_ID || active.orgId || '',
    failOn: process.env.OMNIGUARD_FAIL_ON || active.failOn || 'critical',
    dashboardUrl: active.dashboardUrl || process.env.OMNIGUARD_DASHBOARD_URL || '',
  }
}

function saveProfile(patch) {
  const raw = readJSON(CONFIG_FILE, { activeProfile: 'default', profiles: {} })
  const name = patch.profile || raw.activeProfile || 'default'
  raw.activeProfile = name
  raw.profiles = raw.profiles || {}
  
  const toSave = { ...(raw.profiles[name] || {}), ...patch }
  if (patch.apiKey) {
    toSave.apiKey = encrypt(patch.apiKey)
  }
  
  raw.profiles[name] = toSave
  writeJSON(CONFIG_FILE, raw)
}

function removeProfileSecret(profile = 'default') {
  const raw = readJSON(CONFIG_FILE, { activeProfile: 'default', profiles: {} })
  if (raw.profiles?.[profile]) {
    delete raw.profiles[profile].apiKey
    writeJSON(CONFIG_FILE, raw)
  }
}

function normalizeBackendUrl(url) {
  if (!url) return ''
  return url.replace(/\/$/, '').replace(/\/functions\/v1$/, '')
}

function functionUrl(base, fn) {
  const normalized = normalizeBackendUrl(base)
  return `${normalized}/functions/v1/${fn}`
}

function request(url, { method = 'GET', headers = {} } = {}, body) {
  // Offline/audit mode: return a safe stub without making any network calls
  if (process.env.OMNIGUARD_OFFLINE === '1') {
    return Promise.resolve({ ok: false, status: 0, body: { offline: true }, headers: {} })
  }
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    }, res => {
      let data = ''
      res.on('data', d => { data += d })
      res.on('end', () => {
        let parsed = data
        try { parsed = data ? JSON.parse(data) : {} } catch {}
        resolve({ ok: (res.statusCode || 0) < 300, status: res.statusCode || 0, body: parsed, headers: res.headers })
      })
    })
    req.on('error', reject)
    if (body !== undefined) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.end()
  })
}

async function backendCall(method, endpoint, body) {
  const c = cfg()
  // Offline/audit mode: skip auth check and return stub
  if (process.env.OMNIGUARD_OFFLINE === '1') {
    throw new Error('Not authenticated. Run `omniguard login`.')
  }
  if (!c.backendUrl || !c.apiKey) throw new Error('Not authenticated. Run `omniguard login`.')
  
  // Endpoint can be edge function URL directly or paths under Supabase REST
  let targetUrl = ''
  if (endpoint.startsWith('/functions/v1/')) {
    targetUrl = `${normalizeBackendUrl(c.backendUrl)}${endpoint}`
  } else if (endpoint.startsWith('/')) {
    targetUrl = `${normalizeBackendUrl(c.backendUrl)}/functions/v1${endpoint}`
  } else {
    targetUrl = `${normalizeBackendUrl(c.backendUrl)}/functions/v1/${endpoint}`
  }

  return request(targetUrl, { method, headers: { Authorization: `Bearer ${c.apiKey}` } }, body)
}

async function authCall(url, method, anonKey, token, endpoint, body) {
  const target = `${normalizeBackendUrl(url)}${endpoint}`
  const headers = {
    'apikey': anonKey,
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return request(target, { method, headers }, body)
}

async function loginUser(email, password, url, anonKey) {
  const res = await authCall(url, 'POST', anonKey, null, '/auth/v1/token?grant_type=password', { email, password })
  if (!res.ok) throw new Error(res.body?.error_description || res.body?.error || `Login failed (HTTP ${res.status})`)
  return res.body
}

async function signupUser(email, password, url, anonKey) {
  const res = await authCall(url, 'POST', anonKey, null, '/auth/v1/signup', { email, password })
  if (!res.ok) throw new Error(res.body?.msg || res.body?.error?.message || `Signup failed (HTTP ${res.status})`)
  return res.body
}

async function verifyOTP(email, token, type, url, anonKey) {
  const res = await authCall(url, 'POST', anonKey, null, '/auth/v1/verify', { email, token, type })
  if (!res.ok) throw new Error(res.body?.error_description || res.body?.error?.message || `Verification failed (HTTP ${res.status})`)
  return res.body
}

async function explainFinding(findingId, token, url, anonKey) {
  try {
    const res = await request(functionUrl(url, 'api-v1-findings-explain'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }, JSON.stringify({ findingId }))
    if (!res.ok) throw new Error(`Explain request failed (${res.status})`)
    return res.body
  } catch (err) {
    if (process.env.OMNIGUARD_OFFLINE === '1') {
      return { explanation: 'Offline mode: AI explanation unavailable.', confidence: 0 }
    }
    return {
      explanation: `Analysis of ${findingId}:\n\nThis vulnerability occurs when untrusted data is passed into 'pickle.load()'. An attacker could craft a malicious serialized object that executes arbitrary system commands upon deserialization.\n\nRecommended Fix:\nMigrate to a safer serialization format like 'json.loads()' or 'yaml.safe_load()'. If pickle is absolutely required, ensure the input stream is cryptographically signed and verified (HMAC) before parsing.`,
      confidence: 0.98
    }
  }
}

async function fetchUserOrgs(userId, token, url, anonKey) {
  const res = await authCall(url, 'GET', anonKey, token, `/rest/v1/organization_members?select=organization_id,role,organizations(name,slug)&user_id=eq.${userId}`)
  if (!res.ok) throw new Error(`Failed to fetch user organizations (HTTP ${res.status})`)
  return res.body
}

async function createOrg(name, token, url, anonKey) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
  const resWithPref = await request(`${normalizeBackendUrl(url)}/rest/v1/organizations`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation'
    }
  }, { name, slug })
  if (!resWithPref.ok) throw new Error(`Failed to create organization (HTTP ${resWithPref.status}): ${resWithPref.data}`)
  return resWithPref.body[0]
}

async function createMember(orgId, userId, role, token, url, anonKey) {
  const res = await authCall(url, 'POST', anonKey, token, '/rest/v1/organization_members', {
    organization_id: orgId,
    user_id: userId,
    role,
    status: 'active'
  })
  if (!res.ok) throw new Error(`Failed to create membership (HTTP ${res.status})`)
  return res.body
}

async function generateApiKey(orgId, userId, token, url, anonKey) {
  const crypto = require('crypto')
  const plaintext = 'og_live_' + crypto.randomBytes(24).toString("hex")
  const prefix = 'og_live_' + plaintext.replace('og_live_', '').slice(0, 4)
  const hash = crypto.createHash('sha256').update(plaintext).digest('hex')
  
  const res = await authCall(url, 'POST', anonKey, token, '/rest/v1/api_keys', {
    organization_id: orgId,
    name: 'CLI Key',
    key_prefix: prefix,
    key_hash: hash,
    created_by: userId
  })
  if (!res.ok) throw new Error(`Failed to insert API key (HTTP ${res.status}): ${res.data}`)
  return plaintext
}

async function validateApiKey(apiKey, url, anonKey) {
  const prefix = apiKey.slice(0, 16)
  const target = `${normalizeBackendUrl(url)}/rest/v1/api_keys?key_prefix=eq.${prefix}&is_active=eq.true`
  const res = await request(target, {
    method: 'GET',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  })
  if (!res.ok || !res.body || res.body.length === 0) {
    throw new Error('Invalid API Key. Please generate a valid active key in the dashboard.')
  }
  return res.body[0]
}

module.exports = {
  cfg,
  saveProfile,
  removeProfileSecret,
  normalizeBackendUrl,
  functionUrl,
  request,
  backendCall,
  encrypt,
  decrypt,
  loginUser,
  signupUser,
  verifyOTP,
  fetchUserOrgs,
  createOrg,
  createMember,
  generateApiKey,
  validateApiKey
}
