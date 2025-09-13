import { ethers } from 'ethers';
import { secureStorage, type StoredWallet } from './storage';
import { NETWORKS, type NetworkConfig, getNetworkById, getNetworkByChainId } from './networks';
import { fallbackProvider } from './fallback-provider';

export interface WalletBalance {
  networkId: number;
  balance: string;
  usdValue: number;
  symbol: string;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasUsed?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: Date;
  networkId: number;
  type: 'sent' | 'received';
  usdValue?: number;
}

class WalletManager {
  private wallet: ethers.Wallet | null = null;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private storedPrivateKey: string | null = null;
  private signers: Map<number, ethers.Wallet> = new Map(); // Connected signers per network

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Don't pre-initialize providers to avoid connection errors
    // They will be created on-demand using the fallback system
    console.log('Provider initialization deferred to fallback system');
  }

  getProvider(networkId: number): ethers.JsonRpcProvider | null {
    return this.providers.get(networkId) || null;
  }

  getWallet(): ethers.Wallet | null {
    return this.wallet;
  }

  // Get connected signer for specific network or basic wallet signer
  async getSigner(networkId?: number): Promise<ethers.Wallet | null> {
    if (!this.wallet) {
      // Try to restore wallet first
      if (this.storedPrivateKey || secureStorage.getSessionPrivateKey()) {
        this.restoreWalletFromMemory();
      }
      if (!this.wallet) {
        console.error('❌ No wallet available for signer creation');
        return null;
      }
    }

    // If no network specified, return basic wallet instance
    if (!networkId) {
      return this.wallet;
    }

    // Check if we already have a connected signer for this network
    if (this.signers.has(networkId)) {
      const signer = this.signers.get(networkId)!;
      console.log('✓ Using cached signer for network', networkId, ':', signer.address);
      return signer;
    }

    // Create new connected signer
    // First try by ID, then by chainId for backward compatibility
    let network = getNetworkById(networkId);
    if (!network) {
      network = getNetworkByChainId(networkId);
    }
    if (!network) {
      console.error('❌ Network not supported:', networkId);
      return null;
    }

    const provider = await fallbackProvider.getWorkingProvider(network.chainId);
    if (!provider) {
      console.error('❌ No working provider for network:', networkId);
      return null;
    }

    const connectedSigner = this.wallet.connect(provider);
    this.signers.set(networkId, connectedSigner);
    console.log('✓ Created connected signer for network', networkId, ':', connectedSigner.address);
    return connectedSigner;
  }

  // Generate new wallet with mnemonic
  generateWallet(): { mnemonic: string; privateKey: string; address: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      mnemonic: wallet.mnemonic?.phrase || '',
      privateKey: wallet.privateKey,
      address: wallet.address
    };
  }

  // Import wallet from mnemonic
  importFromMnemonic(mnemonic: string): { privateKey: string; address: string } {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      return {
        privateKey: wallet.privateKey,
        address: wallet.address
      };
    } catch (error) {
      throw new Error('Invalid mnemonic phrase');
    }
  }

  // Import wallet from private key
  importFromPrivateKey(privateKey: string): { address: string } {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return {
        address: wallet.address
      };
    } catch (error) {
      throw new Error('Invalid private key');
    }
  }

  // Create and save wallet
  async createWallet(password: string, name: string = 'Main Account'): Promise<StoredWallet> {
    const { mnemonic, privateKey, address } = this.generateWallet();
    
    secureStorage.setPassword(password);
    
    const wallet: StoredWallet = {
      address,
      name,
      encryptedPrivateKey: secureStorage.encrypt(privateKey),
      encryptedMnemonic: secureStorage.encrypt(mnemonic),
      isImported: false,
      createdAt: new Date().toISOString()
    };

    secureStorage.saveWallet(wallet);
    this.wallet = new ethers.Wallet(privateKey);
    
    return wallet;
  }

  // Import and save wallet
  async importWallet(
    password: string, 
    input: string, 
    type: 'mnemonic' | 'private_key',
    name: string = 'Imported Account'
  ): Promise<StoredWallet> {
    let privateKey: string;
    let address: string;
    let mnemonic: string | undefined;

    if (type === 'mnemonic') {
      const imported = this.importFromMnemonic(input);
      privateKey = imported.privateKey;
      address = imported.address;
      mnemonic = input;
    } else {
      const imported = this.importFromPrivateKey(input);
      privateKey = input;
      address = imported.address;
    }

    secureStorage.setPassword(password);
    
    const wallet: StoredWallet = {
      address,
      name,
      encryptedPrivateKey: secureStorage.encrypt(privateKey),
      encryptedMnemonic: mnemonic ? secureStorage.encrypt(mnemonic) : undefined,
      isImported: true,
      createdAt: new Date().toISOString()
    };

    secureStorage.saveWallet(wallet);
    this.wallet = new ethers.Wallet(privateKey);
    
    return wallet;
  }

  // Unlock existing wallet
  async unlockWallet(password: string): Promise<StoredWallet | null> {
    try {
      console.log('Attempting to unlock wallet...');
      secureStorage.setPassword(password);
      const storedWallet = secureStorage.loadWallet();
      
      if (!storedWallet) {
        console.error('No wallet found in storage');
        throw new Error('No wallet found');
      }

      console.log('Wallet found, decrypting private key...');
      const privateKey = secureStorage.decrypt(storedWallet.encryptedPrivateKey);
      
      // Store private key securely in memory and session for transaction signing
      this.storedPrivateKey = privateKey;
      this.wallet = new ethers.Wallet(privateKey);
      secureStorage.setSessionPrivateKey(privateKey);
      
      console.log('✓ Wallet unlocked and signer stored in memory + session:', { address: this.wallet.address });
      return storedWallet;
    } catch (error) {
      console.error('Wallet unlock failed:', error);
      secureStorage.clearPassword();
      this.storedPrivateKey = null;
      throw error;
    }
  }

  // Lock wallet
  lockWallet(): void {
    this.wallet = null;
    this.storedPrivateKey = null;
    this.signers.clear(); // Clear all connected signers
    secureStorage.clearPassword();
  }

  // Check if wallet is unlocked
  isUnlocked(): boolean {
    // If wallet instance is null but we have private key in memory, restore it
    if (!this.wallet && (this.storedPrivateKey || secureStorage.isUnlocked())) {
      this.restoreWalletFromMemory();
    }
    return this.wallet !== null;
  }

  // Restore wallet instance using stored private key or session storage
  restoreWalletFromMemory(): void {
    try {
      console.log('Attempting to restore wallet signer...');
      
      // First try memory cache
      if (this.storedPrivateKey) {
        this.wallet = new ethers.Wallet(this.storedPrivateKey);
        console.log('✓ Wallet signer restored from memory cache');
        return;
      }
      
      // Then try session storage for private key
      const sessionPrivateKey = secureStorage.getSessionPrivateKey();
      if (sessionPrivateKey) {
        this.storedPrivateKey = sessionPrivateKey;
        this.wallet = new ethers.Wallet(sessionPrivateKey);
        console.log('✓ Wallet signer restored from session storage');
        return;
      }
      
      // Finally try to decrypt from storage
      try {
        const storedWallet = secureStorage.loadWallet();
        if (storedWallet) {
          const privateKey = secureStorage.decrypt(storedWallet.encryptedPrivateKey);
          this.storedPrivateKey = privateKey;
          this.wallet = new ethers.Wallet(privateKey);
          secureStorage.setSessionPrivateKey(privateKey);
          console.log('✓ Wallet signer restored from encrypted storage');
          return;
        }
      } catch (error) {
        console.log('Failed to restore from encrypted storage:', error);
      }
      
      console.log('❌ Could not restore wallet signer - no valid key found');
    } catch (error) {
      console.error('Failed to restore wallet signer:', error);
    }
  }

  // Get current wallet address
  getAddress(): string | null {
    // If wallet instance is null but we have private key in memory, restore it
    if (!this.wallet && (this.storedPrivateKey || secureStorage.isUnlocked())) {
      this.restoreWalletFromMemory();
    }
    return this.wallet?.address || null;
  }

  // Restore wallet from private key (for session restoration)
  restoreWallet(privateKey: string): void {
    this.wallet = new ethers.Wallet(privateKey);
  }

  // Get wallet balance for specific network
  async getBalance(networkId: number): Promise<WalletBalance | null> {
    if (!this.wallet) throw new Error('Wallet not unlocked');
    
    const network = getNetworkById(networkId);
    if (!network) return null;

    try {
      console.log(`Getting balance for ${network.name} (Chain ID: ${network.chainId})`);
      const balanceEth = await fallbackProvider.getBalance(this.wallet.address, network.chainId);
      
      if (balanceEth === null) {
        console.log(`No working provider found for ${network.name}`);
        return null;
      }
      
      // Real USD conversion would use price API
      const mockPrices: { [key: string]: number } = {
        'ETH': 2400,
        'MATIC': 0.8,
        'BNB': 320
      };
      
      const usdValue = parseFloat(balanceEth) * (mockPrices[network.symbol] || 0);

      console.log(`Balance for ${network.name}: ${balanceEth} ${network.symbol}`);
      
      return {
        networkId,
        balance: balanceEth,
        usdValue,
        symbol: network.symbol
      };
    } catch (error) {
      console.error(`Failed to get balance for network ${networkId}:`, error);
      return null;
    }
  }

  // Get all network balances
  async getAllBalances(): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];
    
    for (const network of NETWORKS) {
      const balance = await this.getBalance(network.id);
      if (balance) {
        balances.push(balance);
      }
    }
    
    return balances;
  }

  // Send transaction
  async sendTransaction(
    to: string,
    amount: string,
    networkId: number
  ): Promise<{ hash: string; transaction: ethers.TransactionResponse }> {
    // Get connected signer for the specific network
    const signer = await this.getSigner(networkId);
    
    if (!signer) {
      throw new Error('Wallet not unlocked - signer not available');
    }
    
    console.log('✓ Signer available for transaction:', signer.address);
    
    try {
      const value = ethers.parseEther(amount);
      const transaction = await signer.sendTransaction({
        to,
        value
      });

      return {
        hash: transaction.hash,
        transaction
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Send ERC-20 token transaction
  async sendTokenTransaction(
    to: string,
    amount: string,
    networkId: number,
    tokenAddress: string,
    tokenDecimals: number
  ): Promise<{ hash: string; transaction: ethers.TransactionResponse }> {
    const signer = await this.getSigner(networkId);
    
    if (!signer) {
      throw new Error('Wallet not unlocked - signer not available');
    }

    console.log('✓ Sending token transaction:', { to, amount, tokenAddress, tokenDecimals });

    try {
      // ERC-20 ABI for transfer function
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      
      // Convert amount to token units
      const tokenAmount = ethers.parseUnits(amount, tokenDecimals);
      
      // Send token transfer transaction
      const transaction = await tokenContract.transfer(to, tokenAmount);

      return {
        hash: transaction.hash,
        transaction
      };
    } catch (error) {
      console.error('Token transaction failed:', error);
      throw error;
    }
  }

  // Estimate gas fee
  async estimateGasFee(to: string, amount: string, networkId: number, tokenAddress?: string, tokenDecimals?: number): Promise<string> {
    // Get connected signer for the specific network
    const signer = await this.getSigner(networkId);
    
    if (!signer) {
      throw new Error('Wallet not unlocked');
    }
    
    const provider = signer.provider as ethers.JsonRpcProvider;
    if (!provider) throw new Error('No provider available for gas estimation');

    try {
      let gasEstimate: bigint;

      if (tokenAddress && tokenDecimals) {
        // Token transfer gas estimation
        const erc20Abi = [
          "function transfer(address to, uint256 amount) returns (bool)"
        ];
        
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
        const tokenAmount = ethers.parseUnits(amount, tokenDecimals);
        
        gasEstimate = await tokenContract.transfer.estimateGas(to, tokenAmount);
      } else {
        // Native ETH transfer gas estimation
        const value = ethers.parseEther(amount);
        gasEstimate = await provider.estimateGas({
          from: signer.address,
          to,
          value
        });
      }

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      
      const gasFee = gasEstimate * gasPrice;
      return ethers.formatEther(gasFee);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return '0.001'; // Fallback estimate
    }
  }

  // Get transaction history
  async getTransactionHistory(networkId: number, limit: number = 10): Promise<TransactionData[]> {
    if (!this.wallet) throw new Error('Wallet not unlocked');
    
    const provider = this.getProvider(networkId);
    if (!provider) return [];

    try {
      // In a real app, you'd use a service like Etherscan API or Alchemy
      // For demo purposes, we'll return mock data
      const mockTransactions: TransactionData[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          from: '0x742d35Cc6634C0532925a3b8D4c5A743E5d5c43E',
          to: this.wallet.address,
          value: '0.5',
          status: 'confirmed',
          blockNumber: 18500000,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          networkId,
          type: 'received',
          usdValue: 500
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          from: this.wallet.address,
          to: '0x742d35Cc6634C0532925a3b8D4c5A743E5d5c43E',
          value: '0.1',
          status: 'pending',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          networkId,
          type: 'sent',
          usdValue: 100
        }
      ];

      return mockTransactions.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }

  // Export private key
  exportPrivateKey(): string {
    if (!this.wallet) throw new Error('Wallet not unlocked');
    return this.wallet.privateKey;
  }

  // Export mnemonic
  exportMnemonic(): string | null {
    const storedWallet = secureStorage.loadWallet();
    if (!storedWallet?.encryptedMnemonic) return null;
    
    try {
      return secureStorage.decrypt(storedWallet.encryptedMnemonic);
    } catch (error) {
      console.error('Failed to decrypt mnemonic:', error);
      return null;
    }
  }
}

export const walletManager = new WalletManager();
