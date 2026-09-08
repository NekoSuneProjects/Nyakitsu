const providers = [
  { id:'chatgpt', name:'ChatGPT subscription', family:'codex', baseUrl:'', keyRequired:false, notes:'Sign in with ChatGPT through Codex. Uses your eligible account allowance.' },
  { id:'ollama', name:'Ollama (Local)', family:'ollama', baseUrl:'http://127.0.0.1:11434', keyRequired:false, local:true, freeTier:true, notes:'Run models privately on your own computer.' },
  { id:'ollama-cloud', name:'Ollama Cloud', family:'ollama', baseUrl:'https://ollama.com', keyRequired:true, freeTier:true, notes:'Remote Ollama-compatible endpoint. Base URL can be changed.' },
  { id:'openai', name:'OpenAI', family:'openai', baseUrl:'https://api.openai.com/v1', keyRequired:true },
  { id:'anthropic', name:'Anthropic Claude', family:'anthropic', baseUrl:'https://api.anthropic.com', keyRequired:true },
  { id:'gemini', name:'Google Gemini', family:'gemini', baseUrl:'https://generativelanguage.googleapis.com/v1beta', keyRequired:true, freeTier:true },
  { id:'xai', name:'xAI Grok', family:'openai', baseUrl:'https://api.x.ai/v1', keyRequired:true },
  { id:'deepseek', name:'DeepSeek', family:'openai', baseUrl:'https://api.deepseek.com', keyRequired:true },
  { id:'groq', name:'Groq', family:'openai', baseUrl:'https://api.groq.com/openai/v1', keyRequired:true, freeTier:true },
  { id:'openrouter', name:'OpenRouter', family:'openai', baseUrl:'https://openrouter.ai/api/v1', keyRequired:true, freeTier:true },
  { id:'mistral', name:'Mistral AI', family:'openai', baseUrl:'https://api.mistral.ai/v1', keyRequired:true },
  { id:'perplexity', name:'Perplexity', family:'openai', baseUrl:'https://api.perplexity.ai', keyRequired:true },
  { id:'together', name:'Together AI', family:'openai', baseUrl:'https://api.together.xyz/v1', keyRequired:true },
  { id:'fireworks', name:'Fireworks AI', family:'openai', baseUrl:'https://api.fireworks.ai/inference/v1', keyRequired:true },
  { id:'cerebras', name:'Cerebras', family:'openai', baseUrl:'https://api.cerebras.ai/v1', keyRequired:true, freeTier:true },
  { id:'sambanova', name:'SambaNova', family:'openai', baseUrl:'https://api.sambanova.ai/v1', keyRequired:true, freeTier:true },
  { id:'nvidia', name:'NVIDIA NIM', family:'openai', baseUrl:'https://integrate.api.nvidia.com/v1', keyRequired:true, freeTier:true },
  { id:'huggingface', name:'Hugging Face Inference', family:'openai', baseUrl:'https://router.huggingface.co/v1', keyRequired:true, freeTier:true },
  { id:'lmstudio', name:'LM Studio', family:'openai', baseUrl:'http://127.0.0.1:1234/v1', keyRequired:false, local:true, freeTier:true },
  { id:'localai', name:'LocalAI', family:'openai', baseUrl:'http://127.0.0.1:8080/v1', keyRequired:false, local:true, freeTier:true },
  { id:'vllm', name:'vLLM', family:'openai', baseUrl:'http://127.0.0.1:8000/v1', keyRequired:false, local:true, freeTier:true },
  { id:'koboldcpp', name:'KoboldCpp', family:'openai', baseUrl:'http://127.0.0.1:5001/v1', keyRequired:false, local:true, freeTier:true },
  { id:'custom-openai', name:'Custom OpenAI-compatible', family:'openai', baseUrl:'http://127.0.0.1:8000/v1', keyRequired:false, notes:'Works with any OpenAI-compatible Chat Completions endpoint.' }
]

function listProviders() { return providers.map((item) => ({ ...item })) }
function providerById(id) { return providers.find((item) => item.id === id) || providers.find((item) => item.id === 'ollama') }
module.exports = { listProviders, providerById }
