import { ethers } from 'ethers';
import { NETWORKS } from './networks';

// Multiple RPC endpoints for each network as fallbacks
const RPC_FALLBACKS = {
  11155111: [ // Ethereum Sepolia
    'https://rpc2.sepolia.org',
    'https://sepolia.drpc.org',
    'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    'https://sepolia.gateway.tenderly.co'
  ],
  80002: [ // Polygon Amoy
    'https://rpc-amoy.polygon.technology',
    'https://polygon-amoy.drpc.org',
    'https://rpc.ankr.com/polygon_amoy'
  ],
  97: [ // BSC Testnet
    'https://data-seed-prebsc-1-s1.binance.org:8545',
    'https://bsc-testnet.blockpi.network/v1/rpc/public',
    'https://bsc-testnet.drpc.org'
  ],
  84532: [ // Base Sepolia
    'https://sepolia.base.org',
    'https://base-sepolia.blockpi.network/v1/rpc/public'
  ]
};

export class FallbackProvider {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private workingRpcs: Map<number, string> = new Map();

  async getWorkingProvider(chainId: number): Promise<ethers.JsonRpcProvider | null> {
    // Return cached provider if available
    if (this.providers.has(chainId)) {
      return this.providers.get(chainId)!;
    }

    const rpcUrls = RPC_FALLBACKS[chainId as keyof typeof RPC_FALLBACKS] || [];
    
    for (const rpcUrl of rpcUrls) {
      try {
        console.log(`Testing RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Quick test with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        await Promise.race([
          provider.getBlockNumber(),
          timeoutPromise
        ]);
        
        console.log(`✓ Working RPC found: ${rpcUrl}`);
        this.providers.set(chainId, provider);
        this.workingRpcs.set(chainId, rpcUrl);
        return provider;
        
      } catch (error) {
        console.log(`✗ Failed RPC: ${rpcUrl}`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
    
    console.error(`No working RPC found for chain ${chainId}`);
    return null;
  }

  async getBalance(address: string, chainId: number): Promise<string | null> {
    const provider = await this.getWorkingProvider(chainId);
    if (!provider) return null;

    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Failed to get balance for chain ${chainId}:`, error);
      // Remove failed provider from cache
      this.providers.delete(chainId);
      this.workingRpcs.delete(chainId);
      return null;
    }
  }

  async getTransaction(txHash: string): Promise<{chainId: number, receipt: any, transaction: any} | null> {
    for (const [chainId] of Object.entries(RPC_FALLBACKS)) {
      const provider = await this.getWorkingProvider(parseInt(chainId));
      if (!provider) continue;

      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          const transaction = await provider.getTransaction(txHash);
          return { chainId: parseInt(chainId), receipt, transaction };
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  getWorkingRpcUrl(chainId: number): string | null {
    return this.workingRpcs.get(chainId) || null;
  }

  // Clear cache to force re-testing
  clearCache() {
    this.providers.clear();
    this.workingRpcs.clear();
  }
}

export const fallbackProvider = new FallbackProvider();