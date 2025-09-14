// Application constants
export const APP_CONFIG = {
  name: 'BlockFinaX',
  description: 'Secure blockchain-powered platform for cross-border trade finance, escrow services, and international business transactions',
  version: '1.0.0',
  author: 'BlockFinaX Team',
} as const;

// Network configurations
export const NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    profile: '/auth/profile',
  },
  wallet: {
    create: '/wallet/create',
    import: '/wallet/import',
    export: '/wallet/export',
    balance: '/wallet/balance',
  },
  escrow: {
    list: '/escrow',
    create: '/escrow',
    update: '/escrow/:id',
    delete: '/escrow/:id',
  },
  referrals: {
    list: '/referrals',
    create: '/referrals',
    stats: '/referrals/stats',
  },
} as const;

// UI Constants
export const UI_CONFIG = {
  themes: ['light', 'dark'] as const,
  defaultTheme: 'light',
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  colors: {
    primary: '#3B82F6', // blue-500
    secondary: '#10B981', // emerald-500
    danger: '#EF4444', // red-500
    warning: '#F59E0B', // amber-500
    success: '#10B981', // emerald-500
  },
} as const;

// Validation constants
export const VALIDATION = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireNumbers: true,
    requireSpecialChars: true,
    requireUpperCase: true,
  },
  wallet: {
    nameMaxLength: 50,
    mnemonicWordCount: [12, 15, 18, 21, 24],
  },
  escrow: {
    titleMaxLength: 100,
    descriptionMaxLength: 1000,
    minAmount: 0.001,
  },
} as const;

// Feature flags
export const FEATURES = {
  enableReferralSystem: true,
  enableArbitration: true,
  enableMultiCurrency: true,
  enableTestnetMode: true,
  enableAdvancedTrading: false,
} as const;

export default {
  APP_CONFIG,
  NETWORKS,
  API_ENDPOINTS,
  UI_CONFIG,
  VALIDATION,
  FEATURES,
} as const;
