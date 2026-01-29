/**
 * Environment Configuration
 * Type-safe access to environment variables
 */

// Server-side environment variables (not exposed to client)
export const serverEnv = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Integration tokens
  AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT || '',
  ASANA_ACCESS_TOKEN: process.env.ASANA_ACCESS_TOKEN || '',
  CONFLUENCE_API_TOKEN: process.env.CONFLUENCE_API_TOKEN || '',

  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Client-side environment variables (exposed via NEXT_PUBLIC_)
export const clientEnv = {
  // API
  API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',

  // App
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Feature flags
  ENABLE_AI_FEATURES: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true',
  ENABLE_INTEGRATIONS: process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS === 'true',
} as const;

// Helper to check if running on server
export const isServer = typeof window === 'undefined';

// Helper to check environment
export const isDevelopment = serverEnv.NODE_ENV === 'development';
export const isProduction = serverEnv.NODE_ENV === 'production';
export const isTest = serverEnv.NODE_ENV === 'test';

// Validation helper (call on server startup)
export function validateEnv(): void {
  const requiredServerVars = ['DATABASE_URL', 'JWT_SECRET'];

  for (const varName of requiredServerVars) {
    if (!process.env[varName]) {
      console.warn(`Warning: ${varName} environment variable is not set`);
    }
  }
}

export type ServerEnv = typeof serverEnv;
export type ClientEnv = typeof clientEnv;
