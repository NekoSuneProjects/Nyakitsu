const { providerById } = require('./providers.cjs')

const trimSlash = (value) => value.replace(/\/+$/, '')

async function asJson(response) {
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { data = { error: text } }
  if (!response.ok) throw new Error(data?.error?.message || data?.message || data?.error || `HTTP ${response.status}`)
  return data
}

function headers(apiKey, extra = {}) {
  return { 'content-type': 'application/json', ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}), ...extra }
}

async function openAiChat(settings, messages, signal) {
  const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/chat/completions`, {
    signal, method:'POST', headers:headers(settings.apiKey), body:JSON.stringify({ model:settings.model, messages, temperature:0.3 })
  }))
  return data?.choices?.[0]?.message?.content ?? ''
}

async function anthropicChat(settings, messages, signal) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  const bodyMessages = messages.filter((m) => m.role !== 'system').map((m) => ({ role:m.role, content:m.content }))
  const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/v1/messages`, {
    signal, method:'POST', headers:headers('', { 'x-api-key':settings.apiKey, 'anthropic-version':'2023-06-01' }),
    body:JSON.stringify({ model:settings.model, max_tokens:2048, system, messages:bodyMessages })
  }))
  return (data?.content || []).filter((part) => part.type === 'text').map((part) => part.text).join('\n')
}

async function geminiChat(settings, messages, signal) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  const contents = messages.filter((m) => m.role !== 'system').map((m) => ({ role:m.role === 'assistant' ? 'model' : 'user', parts:[{ text:m.content }] }))
  const url = `${trimSlash(settings.baseUrl)}/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`
  const data = await asJson(await fetch(url, { signal, method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ system_instruction:{ parts:[{ text:system }] }, contents }) }))
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') ?? ''
}

async function ollamaChat(settings, messages, signal) {
  const opts = { signal, method:'POST', headers:headers(settings.apiKey), body:JSON.stringify({ model:settings.model, messages, stream:false }) }
  const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/api/chat`, opts))
  return data?.message?.content ?? ''
}

async function chat(settings, messages, signal) {
  const provider = providerById(settings.providerId)
  signal = signal ? AbortSignal.any([signal, AbortSignal.timeout(180000)]) : AbortSignal.timeout(180000)
  if (!settings.model) throw new Error('Choose a model in AI settings first.')
  if (provider.keyRequired && !settings.apiKey) throw new Error(`${provider.name} requires an API key.`)
  if (provider.family === 'anthropic') return anthropicChat(settings, messages, signal)
  if (provider.family === 'gemini') return geminiChat(settings, messages, signal)
  if (provider.family === 'ollama') return ollamaChat(settings, messages, signal)
  return openAiChat(settings, messages, signal)
}

async function discoverModels(settings) {
  const provider = providerById(settings.providerId)
  if (provider.family === 'anthropic') {
    const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/v1/models`, { headers:headers('', { 'x-api-key':settings.apiKey, 'anthropic-version':'2023-06-01' }) }))
    return (data?.data || []).map((m) => m.id).filter(Boolean)
  }
  if (provider.family === 'gemini') {
    const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/models?key=${encodeURIComponent(settings.apiKey || '')}`))
    return (data?.models || []).map((m) => String(m.name || '').replace(/^models\//,'')).filter(Boolean)
  }
  if (provider.family === 'ollama') {
    const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/api/tags`, { headers:headers(settings.apiKey) }))
    return (data?.models || []).map((m) => m.name || m.model).filter(Boolean)
  }
  const data = await asJson(await fetch(`${trimSlash(settings.baseUrl)}/models`, { headers:headers(settings.apiKey) }))
  return (data?.data || data?.models || []).map((m) => typeof m === 'string' ? m : (m.id || m.name)).filter(Boolean)
}

module.exports = { chat, discoverModels }
