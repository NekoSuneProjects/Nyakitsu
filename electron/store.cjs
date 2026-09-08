const { app, safeStorage } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const defaults = {
  providerId: 'chatgpt',
  model: '',
  baseUrl: '',
  apiKeyEncrypted: ''
}

function filePath() {
  return path.join(app.getPath('userData'), 'nyakitsu-settings.json')
}

function read() {
  try {
    const value = { ...defaults, ...JSON.parse(fs.readFileSync(filePath(), 'utf8')) }
    const apiKeys = value.apiKeys || { [value.providerId]:value.apiKeyEncrypted }
    return { ...value,apiKeys,apiKeyEncrypted:apiKeys[value.providerId] || '' }
  }
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
  return { providerId: value.providerId, model: value.model, baseUrl: value.baseUrl, hasApiKey: value.providerId !== 'chatgpt' && Boolean(value.apiKeyEncrypted) }
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
  merged.apiKeys = { ...(current.apiKeys || { [current.providerId]:current.apiKeyEncrypted }) }
  if (merged.providerId !== 'chatgpt' && typeof next.apiKey === 'string' && next.apiKey.length > 0) merged.apiKeys[merged.providerId] = encryptSecret(next.apiKey)
  merged.apiKeyEncrypted = merged.apiKeys[merged.providerId] || ''
  write(merged)
  return publicSettings()
}

module.exports = { publicSettings, privateSettings, saveSettings }
