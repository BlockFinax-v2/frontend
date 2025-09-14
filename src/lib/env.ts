// Environment variables with defaults
export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  VITE_NETWORK: import.meta.env.VITE_NETWORK || 'testnet',
  VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID || '1',
} as const;

// Type-safe environment check
export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
export const isTestnet = ENV.VITE_NETWORK === 'testnet';

// Validation for required environment variables
const requiredEnvVars = ['VITE_API_URL'] as const;

for (const envVar of requiredEnvVars) {
  if (!ENV[envVar]) {
    console.warn(`Missing environment variable: ${envVar}`);
  }
}

export default ENV;
