/**
 * Sub-Wallet Management System
 * 
 * Manages contract-specific escrow accounts where each contract
 * gets dedicated sub-wallets for all parties involved.
 */

import { ethers } from 'ethers';
import { walletManager } from './wallet';
import { secureStorage } from './storage';
import { usdcManager } from './usdc-manager';
import CryptoJS from 'crypto-js';

export interface SubWalletData {
  address: string;
  name: string; // Human-readable name based on contract
  encryptedPrivateKey: string;
  contractId: string;
  purpose: string;
  mainWalletAddress: string;
  createdAt: string;
  contractSigned?: boolean;
  signedAt?: string;
  contractRole?: 'party' | 'arbitrator';
}

export interface ContractInvitation {
  id: string;
  inviterAddress: string;
  inviteeAddress: string;
  contractType: 'trade_finance' | 'escrow' | 'export_import';
  contractDetails: {
    title: string;
    description: string;
    amount: string;
    currency: string;
    deadline: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
}

class SubWalletManager {
  private subWallets: Map<string, SubWalletData> = new Map();
  private invitations: Map<string, ContractInvitation> = new Map();
  private balanceCache: Map<string, { balance: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds cache

  constructor() {
    this.loadSubWalletsFromStorage();
    this.loadInvitationsFromStorage();
  }

  createSubWallet(contractId: string, purpose: string, contractTitle?: string): SubWalletData {
    // Ensure wallet is properly restored before accessing
    walletManager.restoreWalletFromMemory();
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected. Please unlock your wallet first.');
    }

    // Generate new wallet
    const newWallet = ethers.Wallet.createRandom();
    
    // Encrypt private key using secure storage for consistency with existing sub-wallets
    const encryptedPrivateKey = secureStorage.encrypt(newWallet.privateKey);
    
    // Create human-readable name
    const name = contractTitle ? 
      `${contractTitle} - ${purpose}` : 
      `Contract ${contractId.slice(0, 8)} - ${purpose}`;
    
    const subWalletData: SubWalletData = {
      address: newWallet.address,
      name,
      encryptedPrivateKey,
      contractId,
      purpose,
      mainWalletAddress,
      createdAt: new Date().toISOString()
    };

    this.subWallets.set(newWallet.address, subWalletData);
    this.saveSubWalletsToStorage();
    
    // Sync to database
    this.syncSubWalletToDatabase(subWalletData);
    
    console.log(`✓ Created sub-wallet: ${newWallet.address} for ${contractId}`);
    return subWalletData;
  }

  /**
   * Sync sub-wallet to database
   */
  private async syncSubWalletToDatabase(subWalletData: SubWalletData): Promise<void> {
    try {
      const response = await fetch('/api/sub-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: subWalletData.address,
          name: subWalletData.name,
          contractId: subWalletData.contractId,
          purpose: subWalletData.purpose,
          mainWalletAddress: subWalletData.mainWalletAddress,
          encryptedPrivateKey: subWalletData.encryptedPrivateKey,
          contractSigned: subWalletData.contractSigned || false
        })
      });

      if (!response.ok) {
        console.error('Failed to sync sub-wallet to database:', response.statusText);
      } else {
        console.log(`✓ Synced sub-wallet ${subWalletData.address} to database`);
      }
    } catch (error) {
      console.error('Error syncing sub-wallet to database:', error);
    }
  }

  /**
   * Sync existing sub-wallets to database
   */
  private async syncExistingSubWalletsToDatabase(): Promise<void> {
    console.log(`🔄 Syncing ${this.subWallets.size} sub-wallets to database...`);
    for (const subWalletData of Array.from(this.subWallets.values())) {
      await this.syncSubWalletToDatabase(subWalletData);
    }
  }

  /**
   * Sync sub-wallets from database to local storage
   */
  syncFromDatabase(databaseSubWallets: any[]): void {
    console.log(`🔄 Syncing ${databaseSubWallets.length} sub-wallets from database...`);
    
    // Clear existing sub-wallets
    this.subWallets.clear();
    
    // Add database sub-wallets to memory
    for (const dbSubWallet of databaseSubWallets) {
      const subWalletData: SubWalletData = {
        address: dbSubWallet.address,
        name: dbSubWallet.name,
        encryptedPrivateKey: dbSubWallet.encryptedPrivateKey,
        contractId: dbSubWallet.contractId,
        purpose: dbSubWallet.purpose,
        mainWalletAddress: dbSubWallet.mainWalletAddress,
        createdAt: dbSubWallet.createdAt || new Date().toISOString(),
        contractSigned: dbSubWallet.contractSigned || false
      };
      
      this.subWallets.set(dbSubWallet.address, subWalletData);
    }
    
    // Save to local storage
    this.saveSubWalletsToStorage();
    
    console.log(`✓ Synchronized ${this.subWallets.size} sub-wallets from database`);
  }

  /**
   * Send invitation to another party to create their sub-wallet for the contract
   */
  async sendContractInvitation(
    inviteeAddress: string,
    contractType: 'trade_finance' | 'escrow' | 'export_import',
    contractDetails: {
      title: string;
      description: string;
      amount: string;
      currency: string;
      deadline: string;
    }
  ): Promise<ContractInvitation> {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    const invitation: ContractInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inviterAddress: mainWalletAddress,
      inviteeAddress,
      contractType,
      contractDetails,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString()
    };

    this.invitations.set(invitation.id, invitation);
    this.saveInvitationsToStorage();
    
    console.log(`✓ Created contract invitation: ${invitation.id}`);
    return invitation;
  }

  /**
   * Accept a contract invitation and create sub-wallet
   */
  acceptInvitation(invitationId: string, contractId: string): SubWalletData {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation has already been processed');
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.respondedAt = new Date().toISOString();
    this.saveInvitationsToStorage();

    // Create sub-wallet for the contract
    const accessData: SubWalletData = this.createSubWallet(
      contractId, 
      'Contract Participant',
      invitation.contractDetails.title
    );

    console.log(`✓ Accepted invitation and created sub-wallet: ${accessData.address}`);
    return accessData;
  }

  /**
   * Get sub-wallets for the current main wallet
   */
  getSubWallets(): SubWalletData[] {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) return [];
    
    return Array.from(this.subWallets.values())
      .filter(sw => sw.mainWalletAddress === mainWalletAddress);
  }

  /**
   * Get sub-wallets for a specific contract
   */
  getSubWalletsForContract(contractId: string): SubWalletData[] {
    return Array.from(this.subWallets.values())
      .filter(sw => sw.contractId === contractId);
  }

  /**
   * Get pending invitations for current wallet
   */
  getPendingInvitations(): ContractInvitation[] {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) return [];
    
    return Array.from(this.invitations.values())
      .filter(inv => inv.inviteeAddress === mainWalletAddress && inv.status === 'pending');
  }

  /**
   * Get signer for a sub-wallet
   */
  getSubWalletSigner(subWalletAddress: string): ethers.Wallet | null {
    const subWalletData = this.subWallets.get(subWalletAddress);
    if (!subWalletData) return null;

    try {
      const privateKey = secureStorage.decrypt(subWalletData.encryptedPrivateKey);
      return new ethers.Wallet(privateKey);
    } catch (error) {
      console.error('Failed to decrypt sub-wallet private key:', error);
      return null;
    }
  }

  /**
   * Get balance for a sub-wallet with caching
   */
  async getSubWalletBalance(subWalletAddress: string, networkId: number = 84532): Promise<{ eth: string; usdc: string; ethUsd: number; usdcUsd: number }> {
    const cacheKey = `${subWalletAddress}_${networkId}`;
    const cached = this.balanceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`💰 Using cached balance for ${subWalletAddress}`);
      return cached.balance;
    }

    try {
      console.log(`🔍 Getting balance for ${subWalletAddress} on network ${networkId}`);
      
      // Create provider based on network
      let provider: ethers.JsonRpcProvider;
      let networkName: string;
      
      if (networkId === 84532) {
        provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
        networkName = 'Base Sepolia';
      } else if (networkId === 11155111) {
        provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
        networkName = 'Ethereum Sepolia';
      } else {
        provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
        networkName = 'Base Sepolia (default)';
      }
      
      console.log(`📡 Using ${networkName} provider for balance check`);

      // Get ETH balance
      const ethBalance = await provider.getBalance(subWalletAddress);
      const ethFormatted = ethers.formatEther(ethBalance);
      console.log(`💎 ETH balance: ${ethFormatted}`);

      // Use unified USDC manager for consistent detection
      console.log(`🔄 Using unified USDC detection for ${subWalletAddress}`);
      const usdcFormatted = await usdcManager.getUSDCBalance(subWalletAddress);
      const foundUSDC = parseFloat(usdcFormatted) > 0;
      
      if (foundUSDC) {
        console.log(`✅ Found USDC balance: ${usdcFormatted} for sub-wallet ${subWalletAddress}`);
      } else {
        console.log(`💨 No USDC balance found for sub-wallet ${subWalletAddress}`);
      }

      // Calculate USD values
      const ethPrice = 2400;
      const usdcPrice = 1.00;

      const ethUsd = parseFloat(ethFormatted) * ethPrice;
      const usdcUsd = parseFloat(usdcFormatted) * usdcPrice;

      const result = {
        eth: parseFloat(ethFormatted).toFixed(6),
        usdc: parseFloat(usdcFormatted).toFixed(2),
        ethUsd,
        usdcUsd
      };
      
      // Cache the result
      this.balanceCache.set(cacheKey, {
        balance: result,
        timestamp: Date.now()
      });
      
      console.log(`✅ Balance result:`, result);
      return result;
    } catch (error) {
      console.error('Failed to get sub-wallet balance:', error);
      return { eth: '0.00', usdc: '0.00', ethUsd: 0, usdcUsd: 0 };
    }
  }

  /**
   * Save sub-wallets to local storage
   */
  private saveSubWalletsToStorage(): void {
    const data = Array.from(this.subWallets.entries());
    localStorage.setItem('subWallets', JSON.stringify(data));
  }

  /**
   * Load sub-wallets from local storage
   */
  loadSubWalletsFromStorage(): void {
    try {
      const data = localStorage.getItem('subWallets');
      if (data) {
        const parsed = JSON.parse(data);
        this.subWallets = new Map(parsed);
        console.log(`✓ Loaded ${this.subWallets.size} sub-wallets from storage`);
        
        // Sync to database if we have sub-wallets
        if (this.subWallets.size > 0) {
          this.syncExistingSubWalletsToDatabase();
        }
      }
    } catch (error) {
      console.error('Failed to load sub-wallets from storage:', error);
    }
  }

  /**
   * Save invitations to local storage
   */
  private saveInvitationsToStorage(): void {
    const data = Array.from(this.invitations.entries());
    localStorage.setItem('contractInvitations', JSON.stringify(data));
  }

  /**
   * Load invitations from local storage
   */
  loadInvitationsFromStorage(): void {
    try {
      const data = localStorage.getItem('contractInvitations');
      if (data) {
        const parsed = JSON.parse(data);
        this.invitations = new Map(parsed);
        console.log(`✓ Loaded ${this.invitations.size} invitations from storage`);
      }
    } catch (error) {
      console.error('Failed to load invitations from storage:', error);
    }
  }

  /**
   * Initialize the sub-wallet manager
   */
  initialize(): void {
    console.log('🔄 Starting refresh process...');
    
    // Create sample invitation for testing if none exist
    if (this.invitations.size === 0) {
      const mainWalletAddress = walletManager.getAddress();
      if (mainWalletAddress) {
        const sampleInvitation: ContractInvitation = {
          id: 'sample_inv_001',
          inviterAddress: '0x1234567890123456789012345678901234567890',
          inviteeAddress: mainWalletAddress,
          contractType: 'trade_finance',
          contractDetails: {
            title: 'International Trade Agreement',
            description: 'Export of electronic components to European markets',
            amount: '50000',
            currency: 'USDC',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        
        this.invitations.set(sampleInvitation.id, sampleInvitation);
        this.saveInvitationsToStorage();
      }
    }
  }

  /**
   * Fund a sub-wallet with ETH or USDC
   */
  async fundSubWallet(subWalletAddress: string, amount: string, networkId: number, currency: string): Promise<string> {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    const signer = await walletManager.getSigner(networkId);
    if (!signer) {
      throw new Error(`Wallet signer not available for network ${networkId}`);
    }

    try {
      if (currency === 'ETH') {
        const tx = await signer.sendTransaction({
          to: subWalletAddress,
          value: ethers.parseEther(amount),
          gasLimit: 21000
        });
        await tx.wait();
        return tx.hash;
      } else if (currency === 'USDC') {
        // Direct USDC transfer using the signer
        const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
        const usdcAbi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ];
        
        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
        const decimals = await usdcContract.decimals();
        const transferAmount = ethers.parseUnits(amount, decimals);
        
        const tx = await usdcContract.transfer(subWalletAddress, transferAmount);
        await tx.wait();
        return tx.hash;
      } else {
        throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      console.error('Fund sub-wallet failed:', error);
      throw error;
    }
  }

  /**
   * Transfer funds from sub-wallet back to main wallet
   */
  async transferFromSubWallet(subWalletAddress: string, amount: string, currency: string, networkId: number): Promise<string> {
    console.log('Looking for sub-wallet:', subWalletAddress);
    console.log('Available sub-wallets:', Array.from(this.subWallets.keys()));
    
    // Try exact match first
    let subWallet = this.subWallets.get(subWalletAddress);
    
    // If not found, try case-insensitive search
    if (!subWallet) {
      const lowerAddress = subWalletAddress.toLowerCase();
      for (const [address, wallet] of Array.from(this.subWallets.entries())) {
        if (address.toLowerCase() === lowerAddress) {
          subWallet = wallet;
          break;
        }
      }
    }
    
    // If still not found, try loading from storage and then from database
    if (!subWallet) {
      console.log('Sub-wallet not found in memory, attempting to load from storage...');
      this.loadSubWalletsFromStorage();
      subWallet = this.subWallets.get(subWalletAddress);
      
      // If still not found, try to fetch from database
      if (!subWallet) {
        console.log('Sub-wallet not found in storage, attempting to fetch from database...');
        try {
          const mainWalletAddress = walletManager.getAddress();
          if (mainWalletAddress) {
            const response = await fetch(`/api/sub-wallets?walletAddress=${mainWalletAddress}`);
            if (response.ok) {
              const databaseSubWallets = await response.json();
              this.syncFromDatabase(databaseSubWallets);
              subWallet = this.subWallets.get(subWalletAddress);
            }
          }
        } catch (error) {
          console.error('Failed to fetch sub-wallets from database:', error);
        }
      }
    }
    
    if (!subWallet) {
      console.error(`Sub-wallet ${subWalletAddress} not found. Available: ${Array.from(this.subWallets.keys()).join(', ')}`);
      throw new Error(`Sub-wallet not found: ${subWalletAddress}`);
    }

    // Decrypt private key and create signer
    let decryptedPrivateKey: string;
    try {
      // First, ensure the wallet is properly restored
      walletManager.restoreWalletFromMemory();
      
      // Check if wallet is properly unlocked
      if (!secureStorage.isUnlocked()) {
        throw new Error('Wallet is locked. Please unlock your wallet with your password before transferring funds.');
      }
      
      // Get the main wallet private key - try multiple sources
      let mainWalletPrivateKey = secureStorage.getSessionPrivateKey();
      
      if (!mainWalletPrivateKey) {
        console.log('Session private key not found, attempting to get from stored wallet...');
        const storedWallet = secureStorage.loadWallet();
        if (storedWallet) {
          try {
            mainWalletPrivateKey = secureStorage.decrypt(storedWallet.encryptedPrivateKey);
            if (mainWalletPrivateKey) {
              secureStorage.setSessionPrivateKey(mainWalletPrivateKey);
              console.log('✓ Retrieved and cached main wallet private key');
            }
          } catch (decryptError) {
            console.error('Failed to decrypt stored wallet:', decryptError);
            throw new Error('Invalid wallet password. Please unlock your wallet with the correct password.');
          }
        }
      }
      
      if (!mainWalletPrivateKey) {
        // Try to get from wallet manager directly
        const wallet = walletManager.getWallet();
        if (wallet && wallet.privateKey) {
          mainWalletPrivateKey = wallet.privateKey;
          secureStorage.setSessionPrivateKey(mainWalletPrivateKey);
          console.log('✓ Retrieved private key from wallet manager');
        }
      }
      
      if (!mainWalletPrivateKey) {
        throw new Error('Wallet access required. Please unlock your wallet with your password to access sub-wallet funds.');
      }
      
      // Try different decryption methods
      console.log('🔓 Attempting decryption with secure storage method...');
      
      // First try: Use secure storage decryption (password-based)
      try {
        decryptedPrivateKey = secureStorage.decrypt(subWallet.encryptedPrivateKey);
        if (decryptedPrivateKey && decryptedPrivateKey.length > 0) {
          console.log('✓ Decrypted using secure storage method');
        }
      } catch (error) {
        console.log('Secure storage decryption failed, trying custom method...');
        
        // Second try: Use the SHA256-derived key method
        try {
          const encryptionKey = CryptoJS.SHA256(subWallet.mainWalletAddress + mainWalletPrivateKey).toString();
          const bytes = CryptoJS.AES.decrypt(subWallet.encryptedPrivateKey, encryptionKey);
          decryptedPrivateKey = bytes.toString(CryptoJS.enc.Utf8);
          
          if (decryptedPrivateKey && decryptedPrivateKey.length > 0) {
            console.log('✓ Decrypted using custom SHA256 method');
          }
        } catch (customError) {
          console.error('Both decryption methods failed');
          throw new Error('Unable to decrypt sub-wallet private key');
        }
      }
      
      if (!decryptedPrivateKey || decryptedPrivateKey.length === 0) {
        console.error('Decryption resulted in empty private key');
        throw new Error('Failed to decrypt sub-wallet private key');
      }
      
      console.log('✓ Sub-wallet private key decrypted successfully');
    } catch (error) {
      console.error('Failed to decrypt sub-wallet private key:', error);
      throw new Error('Unable to decrypt sub-wallet. Please unlock your main wallet and try again.');
    }
    
    // Get provider for the specified network
    let provider = walletManager.getProvider(networkId);
    
    // If provider not available, try to get a signer which includes provider initialization
    if (!provider) {
      console.log(`Provider not found for network ${networkId}, attempting to get signer...`);
      const signer = await walletManager.getSigner(networkId);
      if (signer && signer.provider) {
        provider = signer.provider as ethers.JsonRpcProvider;
      }
    }
    
    if (!provider) {
      throw new Error(`Provider not available for network ${networkId}`);
    }
    
    const subWalletSigner = new ethers.Wallet(decryptedPrivateKey, provider);

    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    try {
      if (currency === 'ETH') {
        const balance = await provider.getBalance(subWalletAddress);
        const feeData = await provider.getFeeData();
        const gasLimit = 21000;
        const gasCost = BigInt(gasLimit) * (feeData.gasPrice || BigInt(0));
        
        const transferAmount = ethers.parseEther(amount);
        if (balance < transferAmount + gasCost) {
          throw new Error('Insufficient balance for transfer including gas fees');
        }

        const tx = await subWalletSigner.sendTransaction({
          to: mainWalletAddress,
          value: transferAmount,
          gasLimit: gasLimit
        });
        await tx.wait();
        return tx.hash;
      } else if (currency === 'USDC') {
        // Get USDC contract and connect with sub-wallet signer
        const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
        const usdcAbi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ];
        
        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, subWalletSigner);
        const decimals = await usdcContract.decimals();
        const transferAmount = ethers.parseUnits(amount, decimals);
        
        const tx = await usdcContract.transfer(mainWalletAddress, transferAmount);
        await tx.wait();
        return tx.hash;
      } else {
        throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      console.error('Transfer from sub-wallet failed:', error);
      throw error;
    }
  }

  /**
   * Sign a contract with the main wallet
   */
  async signContract(subWalletAddress: string): Promise<{ isFullySigned: boolean; fundsLocked: boolean }> {
    const mainWalletAddress = walletManager.getAddress();
    if (!mainWalletAddress) {
      throw new Error('Main wallet not connected');
    }

    const signer = await walletManager.getSigner(84532); // Use Base Sepolia network
    if (!signer) {
      throw new Error('Wallet signer not available');
    }

    try {
      // Create signature message
      const message = `Sign contract for sub-wallet ${subWalletAddress} at ${new Date().toISOString()}`;
      const signature = await signer.signMessage(message);
      
      // Store signature locally
      const signatureData = {
        subWalletAddress,
        signerAddress: mainWalletAddress,
        signature,
        message,
        timestamp: new Date().toISOString()
      };

      // Save to local storage for persistence
      const existingSignatures = JSON.parse(localStorage.getItem('contractSignatures') || '[]');
      existingSignatures.push(signatureData);
      localStorage.setItem('contractSignatures', JSON.stringify(existingSignatures));

      console.log(`✓ Contract signed by ${mainWalletAddress} for sub-wallet ${subWalletAddress}`);
      
      // For now, assume contract is fully signed after one signature
      // In a real implementation, this would check all required signatures
      return {
        isFullySigned: true,
        fundsLocked: true
      };
    } catch (error) {
      console.error('Contract signing failed:', error);
      throw error;
    }
  }

  /**
   * Deactivate a sub-wallet
   */
  deactivateSubWallet(subWalletAddress: string): void {
    const subWallet = this.subWallets.get(subWalletAddress);
    if (subWallet) {
      this.subWallets.delete(subWalletAddress);
      this.saveSubWalletsToStorage();
      console.log(`✓ Deactivated sub-wallet: ${subWalletAddress}`);
    }
  }
}

export const subWalletManager = new SubWalletManager();