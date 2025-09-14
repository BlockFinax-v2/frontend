/// <reference types="vite/client" />

// Global type definitions
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'exporter' | 'importer' | 'arbitrator' | 'financier';
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: Record<string, string>; // Currency -> Balance
  network: string;
  isLocked: boolean;
  createdAt: string;
}

export interface EscrowTransaction {
  id: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
  buyerId: string;
  sellerId: string;
  arbitratorId?: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface ReferralData {
  id: string;
  referrerId: string;
  refereeId: string;
  points: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  confirmPassword: string;
  name: string;
  role: User['role'];
}

export interface CreateWalletForm {
  name: string;
  password: string;
  confirmPassword: string;
}

export interface ImportWalletForm {
  name: string;
  mnemonic: string;
  password: string;
  confirmPassword: string;
}

export interface CreateEscrowForm {
  title: string;
  description: string;
  amount: string;
  currency: string;
  buyerEmail: string;
  arbitratorEmail?: string;
  expiresAt?: string;
}

// Network and blockchain types
export interface NetworkConfig {
  chainId: string;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoUri?: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// Trade finance types
export interface TradeContract {
  id: string;
  contractNumber: string;
  exporterId: string;
  importerId: string;
  financierId?: string;
  amount: string;
  currency: string;
  goods: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'disputed';
  terms: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  senderId: string;
  recipientId: string;
  amount: string;
  currency: string;
  description: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface ArbitrationCase {
  id: string;
  contractId: string;
  arbitratorId: string;
  complainantId: string;
  respondentId: string;
  description: string;
  evidence: string[];
  status: 'open' | 'under_review' | 'resolved' | 'appealed';
  decision?: string;
  award?: string;
  createdAt: string;
  resolvedAt?: string;
}
