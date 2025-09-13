import { ethers } from 'ethers';
import { usdcManager } from './usdc-manager';

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  color: string;
}

export interface NetworkTokens {
  [networkId: number]: TokenConfig[];
}

// ERC20 ABI for basic token operations
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Token configurations by network
export const NETWORK_TOKENS: NetworkTokens = {
  // Base Sepolia
  1: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      decimals: 6,
      icon: '💵',
      color: '#2775CA'
    }
  ]
};

export const getTokensForNetwork = (networkId: number): TokenConfig[] => {
  return NETWORK_TOKENS[networkId] || [];
};

export const getTokenBySymbol = (networkId: number, symbol: string): TokenConfig | undefined => {
  const tokens = getTokensForNetwork(networkId);
  return tokens.find(token => token.symbol === symbol);
};

export class TokenManager {
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    provider: ethers.JsonRpcProvider,
    decimals: number = 18
  ): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      // Force dynamic detection for main wallet when standard detection fails
      throw error; // Re-throw to trigger fallback in getAllTokenBalances
    }
  }

  async getAllTokenBalances(
    networkId: number,
    walletAddress: string,
    provider: ethers.JsonRpcProvider
  ): Promise<Array<{ token: TokenConfig; balance: string; usdValue: number }>> {
    const tokens = getTokensForNetwork(networkId);
    const balances = [];

    // Ensure USDC is always included for network ID 1 (Base Sepolia)
    if (networkId === 1) {
      const usdcToken = tokens.find(t => t.symbol === 'USDC');
      if (!usdcToken) {
        tokens.push({
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          decimals: 6,
          icon: '💵',
          color: '#2775CA'
        });
      }
    }

    for (const token of tokens) {
      let balance = '0';
      let usdValue = 0;
      
      if (token.symbol === 'USDC') {
        // Always use unified USDC manager for consistent detection
        console.log(`🔄 Getting USDC balance for ${walletAddress}`);
        balance = await usdcManager.getUSDCBalance(walletAddress);
        usdValue = parseFloat(balance) * 1.0; // $1 per USDC
        console.log(`✅ USDC balance: ${balance} for ${walletAddress}`);
      } else {
        // For other tokens, use standard detection
        try {
          balance = await this.getTokenBalance(
            token.address,
            walletAddress,
            provider,
            token.decimals
          );
          usdValue = parseFloat(balance) * 1; // Mock price for other tokens
        } catch (error) {
          console.error(`Failed to get balance for ${token.symbol}:`, error);
          balance = '0';
          usdValue = 0;
        }
      }
      
      // Always include tokens in the result for consistent UI
      balances.push({
        token,
        balance,
        usdValue
      });
    }

    return balances;
  }

  // Dynamic USDC detection using transaction history analysis
  async detectUSDCBalance(
    walletAddress: string,
    provider: ethers.JsonRpcProvider,
    networkId: number
  ): Promise<string> {
    try {
      // Use known working USDC contract addresses for this network
      let usdcContracts: string[] = [];
      
      if (networkId === 1) { // Base Sepolia
        usdcContracts = [
          '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
        ];
      }
      
      // Try each known USDC contract
      for (const usdcAddress of usdcContracts) {
        try {
          console.log(`🔗 Checking USDC contract: ${usdcAddress}`);
          const usdcContract = new ethers.Contract(usdcAddress, [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
            'function symbol() view returns (string)'
          ], provider);
          
          const balance = await usdcContract.balanceOf(walletAddress);
          if (balance > 0) {
            const decimals = await usdcContract.decimals();
            const symbol = await usdcContract.symbol();
            const formatted = ethers.formatUnits(balance, decimals);
            console.log(`✅ Found ${symbol} balance: ${formatted} at ${usdcAddress}`);
            return formatted;
          }
        } catch (error) {
          console.log(`❌ Contract ${usdcAddress} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // If no direct contracts work, analyze transaction history
      console.log(`🔍 Analyzing transaction history for USDC transfers to ${walletAddress}`);
      
      try {
        const latestBlock = await provider.getBlockNumber();
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        
        const logs = await provider.getLogs({
          fromBlock: Math.max(0, latestBlock - 1000),
          toBlock: latestBlock,
          topics: [
            transferTopic,
            null,
            ethers.zeroPadValue(walletAddress, 32)
          ]
        });
        
        if (logs.length > 0) {
          console.log(`📨 Found ${logs.length} token transfer(s) to ${walletAddress}`);
          const tokenContractSet = new Set(logs.map((log: any) => log.address));
          const tokenContracts = Array.from(tokenContractSet);
          
          for (const tokenAddress of tokenContracts) {
            try {
              const tokenContract = new ethers.Contract(tokenAddress as string, [
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function symbol() view returns (string)',
                'function name() view returns (string)'
              ], provider);
              
              const balance = await tokenContract.balanceOf(walletAddress);
              if (balance > 0) {
                const decimals = await tokenContract.decimals();
                const symbol = await tokenContract.symbol();
                const name = await tokenContract.name();
                
                const symbolLower = symbol.toLowerCase();
                const nameLower = name.toLowerCase();
                
                if (symbolLower.includes('usdc') || nameLower.includes('usdc') || 
                    symbolLower.includes('usd') || nameLower.includes('usd coin')) {
                  const formatted = ethers.formatUnits(balance, decimals);
                  console.log(`✅ Found ${symbol} (${name}) balance: ${formatted} at ${tokenAddress}`);
                  return formatted;
                }
              }
            } catch (error) {
              // Silent fail for invalid contracts
            }
          }
        }
      } catch (error) {
        console.log('Transaction history analysis failed:', error);
      }
      
      return '0';
    } catch (error) {
      console.error('Dynamic USDC detection failed:', error);
      return '0';
    }
  }

  async transferToken(
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
    signer: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const amountInWei = ethers.parseUnits(amount, decimals);
    return await contract.transfer(to, amountInWei);
  }
}

export const tokenManager = new TokenManager();