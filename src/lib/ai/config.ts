// AI Configuration and Constants
import OpenAI from 'openai';

// Provider-agnostic: works with any OpenAI-compatible API (OpenAI, Groq, Gemini
// OpenAI-compat, OpenRouter, local Ollama, ...). Configure via env:
//   AI_API_KEY   (or OPENAI_API_KEY)  — the provider key
//   AI_BASE_URL  — provider endpoint, e.g. https://api.groq.com/openai/v1
//   AI_MODEL     — chat model id, e.g. llama-3.3-70b-versatile
export const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
export const AI_BASE_URL = process.env.AI_BASE_URL || undefined; // undefined => OpenAI default
export const AI_CHAT_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// Lazy-loaded client instance
let _openai: OpenAI | null = null;

export const getOpenAI = (): OpenAI => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: AI_API_KEY || 'placeholder-key',
      baseURL: AI_BASE_URL,
    });
  }
  return _openai;
};

// For backwards compatibility - will be lazy loaded when accessed
export const openai = {
  get chat() {
    return getOpenAI().chat;
  },
};

// AI Model configurations. Chat models resolve to the configured provider model
// so features work across providers; embeddings default to OpenAI names (only
// used if the provider supports embeddings).
export const AI_MODELS = {
  GPT4: AI_CHAT_MODEL,
  GPT4_VISION: AI_CHAT_MODEL,
  GPT35: AI_CHAT_MODEL,
  EMBEDDING: 'text-embedding-3-small',
  EMBEDDING_LARGE: 'text-embedding-3-large',
} as const;

// Token limits
export const TOKEN_LIMITS = {
  GPT4: 128000,
  GPT35: 16385,
  EMBEDDING: 8191,
} as const;

// AI Feature flags
export const AI_FEATURES = {
  DOCUMENT_PROCESSING: process.env.AI_DOCUMENT_PROCESSING === 'true',
  PREDICTIVE_ANALYTICS: process.env.AI_PREDICTIVE_ANALYTICS === 'true',
  SMART_RECRUITMENT: process.env.AI_SMART_RECRUITMENT === 'true',
  CHATBOT: process.env.AI_CHATBOT === 'true',
  SENTIMENT_ANALYSIS: process.env.AI_SENTIMENT_ANALYSIS === 'true',
  INTELLIGENT_AUTOMATION: process.env.AI_INTELLIGENT_AUTOMATION === 'true',
  LEARNING_DEVELOPMENT: process.env.AI_LEARNING_DEVELOPMENT === 'true',
  ADVANCED_ANALYTICS: process.env.AI_ADVANCED_ANALYTICS === 'true',
} as const;

// Sentiment analysis thresholds
export const SENTIMENT_THRESHOLDS = {
  POSITIVE: 0.5,
  NEGATIVE: -0.5,
  CRITICAL: -0.7,
} as const;

// Attrition risk thresholds
export const ATTRITION_RISK = {
  LOW: 0.3,
  MEDIUM: 0.5,
  HIGH: 0.7,
  CRITICAL: 0.85,
} as const;

// Document processing settings
export const DOCUMENT_SETTINGS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'],
  OCR_LANGUAGES: ['eng', 'hin'],
} as const;

// Chatbot prompts
export const CHATBOT_SYSTEM_PROMPT = `You are an intelligent HR Assistant for the company's HRMS system. Your role is to:
1. Answer employee questions about HR policies, leave, attendance, and payroll
2. Help with leave applications and guide through processes
3. Provide information about company policies and procedures
4. Assist with onboarding queries
5. Handle routine HR queries professionally and efficiently

You have access to the company's HR policies and can help employees navigate the HRMS system.
Always be helpful, professional, and maintain confidentiality.
If you don't know something, say so and suggest contacting HR directly.`;

// Resume parsing prompts
export const RESUME_PARSING_PROMPT = `Extract the following information from this resume:
1. Full Name
2. Email
3. Phone Number
4. Skills (as array)
5. Work Experience (company, role, duration, description)
6. Education (institution, degree, year)
7. Certifications (if any)
8. Summary/Objective

Return the data in JSON format.`;

// Skill matching weights
export const SKILL_WEIGHTS = {
  EXACT_MATCH: 1.0,
  PARTIAL_MATCH: 0.7,
  RELATED_SKILL: 0.4,
} as const;
