// Shared guard: is an LLM provider usably configured?
// Provider-agnostic (OpenAI, Groq, Gemini-compat, OpenRouter, Ollama, ...).
// Returns false when the key is missing/placeholder so AI endpoints degrade
// gracefully (503) instead of throwing a 500.
export function isOpenAIConfigured(): boolean {
  const k = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  return !!(k && k !== 'sk-placeholder-key' && k !== 'placeholder-key' && k.length >= 20);
}
