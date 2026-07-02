// Shared guard: is OpenAI usably configured?
// Returns false when the key is missing, a placeholder, or malformed, so
// AI endpoints can degrade gracefully instead of throwing a 500.
export function isOpenAIConfigured(): boolean {
  const k = process.env.OPENAI_API_KEY;
  return !!(k && k !== 'sk-placeholder-key' && k.startsWith('sk-'));
}
