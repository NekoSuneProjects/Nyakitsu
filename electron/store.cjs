const { app, safeStorage } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const defaults = {
  providerId: 'ollama',
  model: 'qwen3:8b',
  baseUrl: 'http://127.0.0.1:11434',
  apiKeyEncrypted: ''
}

function filePath() {
  return path.join(app.getPath('userData'), 'nyakitsu-settings.json')
}

function read() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(filePath(), 'utf8')) } }
  catch { return { ...defaults } }
}

function write(data) {
  fs.mkdirSync(path.dirname(filePath()), { recursive: true })
  fs.writeFileSync(filePath(), JSON.stringify(data, null, 2), { mode: 0o600 })
}

function encryptSecret(value) {
  if (!value) return ''
  if (safeStorage.isEncryptionAvailable()) return `safe:${safeStorage.encryptString(value).toString('base64')}`
  return `plain:${Buffer.from(value, 'utf8').toString('base64')}`
}

function decryptSecret(value) {
  if (!value) return ''
  try {
    if (value.startsWith('safe:') && safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(Buffer.from(value.slice(5), 'base64'))
    if (value.startsWith('plain:')) return Buffer.from(value.slice(6), 'base64').toString('utf8')
  } catch {}
  return ''
}

function publicSettings() {
  const value = read()
  return { providerId: value.providerId, model: value.model, baseUrl: value.baseUrl, hasApiKey: Boolean(value.apiKeyEncrypted) }
}

function privateSettings() {
  const value = read()
  return { ...value, apiKey: decryptSecret(value.apiKeyEncrypted) }
}

function saveSettings(next) {
  const current = read()
  const merged = {
    ...current,
    providerId: next.providerId ?? current.providerId,
    model: next.model ?? current.model,
    baseUrl: next.baseUrl ?? current.baseUrl
  }
  if (typeof next.apiKey === 'string' && next.apiKey.length > 0) merged.apiKeyEncrypted = encryptSecret(next.apiKey)
  write(merged)
  return publicSettings()
}

module.exports = { publicSettings, privateSettings, saveSettings }
