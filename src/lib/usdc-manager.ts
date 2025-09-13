import { ethers } from 'ethers';

/**
 * USDC Management System
 * Ensures all users have consistent USDC balance detection and test token access
 */
class USDCManager {
  private readonly BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  private readonly BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
  
  /**
   * Get USDC balance for any wallet address
   */
  async getUSDCBalance(walletAddress: string): Promise<string> {
    try {
      const provider = new ethers.JsonRpcProvider(this.BASE_SEPOLIA_RPC);
      const usdcContract = new ethers.Contract(this.BASE_SEPOLIA_USDC, [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ], provider);
      
      const balance = await usdcContract.balanceOf(walletAddress);
      const decimals = await usdcContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('USDC balance check failed:', error);
      return '0';
    }
  }

  /**
   * Transfer USDC from one address to another (requires signer)
   */
  async transferUSDC(fromSigner: ethers.Wallet, toAddress: string, amount: string): Promise<string> {
    try {
      const provider = new ethers.JsonRpcProvider(this.BASE_SEPOLIA_RPC);
      const signerWithProvider = fromSigner.connect(provider);
      
      const usdcContract = new ethers.Contract(this.BASE_SEPOLIA_USDC, [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)'
      ], signerWithProvider);
      
      const decimals = await usdcContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      const tx = await usdcContract.transfer(toAddress, amountInWei);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('USDC transfer failed:', error);
      throw error;
    }
  }

  /**
   * Distribute test USDC to a wallet if it has low balance
   */
  async ensureTestUSDC(walletAddress: string): Promise<boolean> {
    try {
      const balance = await this.getUSDCBalance(walletAddress);
      const balanceNum = parseFloat(balance);
      
      // If wallet has less than 5 USDC, it needs test tokens
      if (balanceNum < 5) {
        console.log(`Wallet ${walletAddress} has ${balance} USDC, needs test tokens`);
        return true; // Indicates wallet needs test USDC
      }
      
      return false; // Wallet has sufficient USDC
    } catch (error) {
      console.error('Test USDC check failed:', error);
      return true; // Assume needs test tokens on error
    }
  }

  /**
   * Get formatted USDC balance with fallback
   */
  async getFormattedBalance(walletAddress: string): Promise<{ balance: string; needsTestTokens: boolean }> {
    const balance = await this.getUSDCBalance(walletAddress);
    const needsTestTokens = await this.ensureTestUSDC(walletAddress);
    
    return {
      balance: parseFloat(balance).toFixed(2),
      needsTestTokens
    };
  }
}

export const usdcManager = new USDCManager();