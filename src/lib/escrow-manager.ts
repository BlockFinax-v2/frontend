import { ethers } from 'ethers';
import { walletManager } from './wallet';
import { fallbackProvider } from './fallback-provider';
import { getNetworkById } from './networks';
import { tokenManager, getTokenBySymbol } from './tokens';

// Simplified escrow smart contract ABI
const ESCROW_ABI = [
  "function createEscrow(address _exporter, address _arbitrator, uint256 _deadline, string memory _description) external payable returns (uint256)",
  "function depositFunds(uint256 _escrowId) external payable",
  "function depositTokens(uint256 _escrowId, address _token, uint256 _amount) external",
  "function releaseFunds(uint256 _escrowId, uint256 _milestoneIndex) external",
  "function completeMilestone(uint256 _escrowId, uint256 _milestoneIndex) external",
  "function getEscrowDetails(uint256 _escrowId) external view returns (tuple(address importer, address exporter, address arbitrator, uint256 totalAmount, uint256 releasedAmount, uint256 deadline, string description, bool isActive))",
  "function getMilestone(uint256 _escrowId, uint256 _milestoneIndex) external view returns (tuple(string title, uint256 amount, bool completed, bool released))",
  "function raiseDispute(uint256 _escrowId, string memory _reason) external",
  "function getEscrowBalance(uint256 _escrowId) external view returns (uint256)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed importer, address indexed exporter, uint256 amount)",
  "event FundsDeposited(uint256 indexed escrowId, uint256 amount)",
  "event MilestoneCompleted(uint256 indexed escrowId, uint256 milestoneIndex)",
  "event FundsReleased(uint256 indexed escrowId, uint256 milestoneIndex, uint256 amount)"
];

// Mock contract addresses for each network (in production, these would be deployed contracts)
const ESCROW_CONTRACT_ADDRESSES = {
  1: "0x1234567890123456789012345678901234567890", // Ethereum Sepolia
  2: "0x2345678901234567890123456789012345678901", // Polygon Amoy
  3: "0x3456789012345678901234567890123456789012", // BSC Testnet
  4: "0x4567890123456789012345678901234567890123", // Base Sepolia
};

export interface EscrowMilestone {
  title: string;
  description: string;
  amount: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'released';
  released: boolean;
}

export interface EscrowContract {
  id: number;
  contractAddress: string;
  importer: string;
  exporter: string;
  arbitrator: string;
  totalAmount: string;
  releasedAmount: string;
  currency: string;
  deadline: Date;
  status: 'created' | 'funded' | 'in_progress' | 'completed' | 'disputed' | 'refunded';
  description: string;
  milestones: EscrowMilestone[];
  networkId: number;
  subWalletAddress: string;
  subWalletPrivateKey: string; // Encrypted in production
}

export interface CreateEscrowParams {
  exporterAddress: string;
  arbitratorAddress: string;
  totalAmount: string;
  currency: string;
  deadline: Date;
  description: string;
  milestones: {
    title: string;
    description: string;
    amount: string;
    dueDate: Date;
  }[];
  networkId: number;
}

class EscrowManager {
  private getContractAddress(networkId: number): string {
    return ESCROW_CONTRACT_ADDRESSES[networkId as keyof typeof ESCROW_CONTRACT_ADDRESSES] || 
           ESCROW_CONTRACT_ADDRESSES[4]; // Default to Base Sepolia
  }

  private async getContract(networkId: number): Promise<ethers.Contract | null> {
    try {
      const network = getNetworkById(networkId);
      if (!network) return null;

      const provider = await fallbackProvider.getWorkingProvider(network.chainId);
      if (!provider) return null;

      const signer = await walletManager.getSigner(networkId);
      if (!signer) return null;

      const contractAddress = this.getContractAddress(networkId);
      return new ethers.Contract(contractAddress, ESCROW_ABI, signer);
    } catch (error) {
      console.error('Failed to get escrow contract:', error);
      return null;
    }
  }

  async createEscrow(params: CreateEscrowParams): Promise<{ escrowId: number; txHash: string; subWallet: { address: string; privateKey: string } }> {
    try {
      console.log('Creating escrow with params:', params);
      
      // Generate dedicated sub-wallet for this escrow
      const subWallet = ethers.Wallet.createRandom();
      
      const contract = await this.getContract(params.networkId);
      if (!contract) {
        throw new Error('Failed to connect to escrow contract');
      }

      let value = ethers.parseEther("0");
      let tokenAddress = null;

      // Handle different currency types
      if (params.currency === 'ETH') {
        value = ethers.parseEther(params.totalAmount);
      } else {
        // For tokens like USDC/USDT, we need to approve and transfer
        const token = getTokenBySymbol(params.networkId, params.currency);
        if (token) {
          tokenAddress = token.address;
          // In production, would need token approval first
        }
      }

      // Create escrow contract on blockchain
      const tx = await contract.createEscrow(
        params.exporterAddress,
        params.arbitratorAddress,
        Math.floor(params.deadline.getTime() / 1000), // Convert to Unix timestamp
        params.description,
        { value } // Send ETH if it's an ETH escrow
      );

      const receipt = await tx.wait();
      
      // Extract escrow ID from event logs
      const escrowCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      let escrowId = 1; // Default ID
      if (escrowCreatedEvent) {
        const parsed = contract.interface.parseLog(escrowCreatedEvent);
        escrowId = Number(parsed?.args.escrowId || 1);
      }

      // Store escrow details (in production, this would go to a database)
      const escrowData: EscrowContract = {
        id: escrowId,
        contractAddress: await contract.getAddress(),
        importer: await walletManager.getAddress() || '',
        exporter: params.exporterAddress,
        arbitrator: params.arbitratorAddress,
        totalAmount: params.totalAmount,
        releasedAmount: '0',
        currency: params.currency,
        deadline: params.deadline,
        status: 'created',
        description: params.description,
        milestones: params.milestones.map(m => ({
          ...m,
          status: 'pending' as const,
          released: false
        })),
        networkId: params.networkId,
        subWalletAddress: subWallet.address,
        subWalletPrivateKey: subWallet.privateKey // In production, encrypt this
      };

      console.log('Escrow created successfully:', {
        escrowId,
        txHash: tx.hash,
        subWallet: subWallet.address
      });

      return {
        escrowId,
        txHash: tx.hash,
        subWallet: {
          address: subWallet.address,
          privateKey: subWallet.privateKey
        }
      };
    } catch (error) {
      console.error('Failed to create escrow:', error);
      throw error;
    }
  }

  async depositFunds(escrowId: number, amount: string, currency: string, networkId: number): Promise<string> {
    try {
      const contract = await this.getContract(networkId);
      if (!contract) {
        throw new Error('Failed to connect to escrow contract');
      }

      let tx;
      
      if (currency === 'ETH') {
        // Deposit ETH directly
        tx = await contract.depositFunds(escrowId, {
          value: ethers.parseEther(amount)
        });
      } else {
        // Deposit tokens (USDC/USDT)
        const token = getTokenBySymbol(networkId, currency);
        if (!token) {
          throw new Error(`Token ${currency} not supported on this network`);
        }

        // First approve the escrow contract to spend tokens
        const signer = await walletManager.getSigner(networkId);
        if (!signer) throw new Error('No signer available');

        const tokenContract = new ethers.Contract(token.address, [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function transfer(address to, uint256 amount) returns (bool)"
        ], signer);

        const amountInWei = ethers.parseUnits(amount, token.decimals);
        
        // Approve escrow contract
        const approveTx = await tokenContract.approve(await contract.getAddress(), amountInWei);
        await approveTx.wait();

        // Deposit tokens
        tx = await contract.depositTokens(escrowId, token.address, amountInWei);
      }

      await tx.wait();
      console.log('Funds deposited successfully:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Failed to deposit funds:', error);
      throw error;
    }
  }

  async completeMilestone(escrowId: number, milestoneIndex: number, networkId: number): Promise<string> {
    try {
      const contract = await this.getContract(networkId);
      if (!contract) {
        throw new Error('Failed to connect to escrow contract');
      }

      const tx = await contract.completeMilestone(escrowId, milestoneIndex);
      await tx.wait();
      
      console.log('Milestone completed:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Failed to complete milestone:', error);
      throw error;
    }
  }

  async releaseMilestonePayment(escrowId: number, milestoneIndex: number, networkId: number): Promise<string> {
    try {
      const contract = await this.getContract(networkId);
      if (!contract) {
        throw new Error('Failed to connect to escrow contract');
      }

      const tx = await contract.releaseFunds(escrowId, milestoneIndex);
      await tx.wait();
      
      console.log('Milestone payment released:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Failed to release milestone payment:', error);
      throw error;
    }
  }

  async getEscrowBalance(escrowId: number, networkId: number): Promise<string> {
    try {
      const contract = await this.getContract(networkId);
      if (!contract) return '0';

      const balance = await contract.getEscrowBalance(escrowId);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get escrow balance:', error);
      return '0';
    }
  }

  async getEscrowDetails(escrowId: number, networkId: number): Promise<any> {
    try {
      const contract = await this.getContract(networkId);
      if (!contract) return null;

      const details = await contract.getEscrowDetails(escrowId);
      return {
        importer: details.importer,
        exporter: details.exporter,
        arbitrator: details.arbitrator,
        totalAmount: ethers.formatEther(details.totalAmount),
        releasedAmount: ethers.formatEther(details.releasedAmount),
        deadline: new Date(Number(details.deadline) * 1000),
        description: details.description,
        isActive: details.isActive
      };
    } catch (error) {
      console.error('Failed to get escrow details:', error);
      return null;
    }
  }

  async raiseDispute(escrowId: number, reason: string, networkId: number): Promise<string> {
    try {
      const contract = await this.getContract(networkId);
      if (!contract) {
        throw new Error('Failed to connect to escrow contract');
      }

      const tx = await contract.raiseDispute(escrowId, reason);
      await tx.wait();
      
      console.log('Dispute raised:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('Failed to raise dispute:', error);
      throw error;
    }
  }

  // Transfer funds from main wallet to escrow sub-wallet
  async fundSubWallet(subWalletAddress: string, amount: string, currency: string, networkId: number): Promise<string> {
    try {
      // Validate Ethereum address format
      if (!ethers.isAddress(subWalletAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      console.log('Funding sub-wallet:', {
        address: subWalletAddress,
        amount,
        currency,
        networkId
      });

      if (currency === 'ETH') {
        const result = await walletManager.sendTransaction(subWalletAddress, amount, networkId);
        return result.hash;
      } else {
        // For tokens, use token transfer
        const token = getTokenBySymbol(networkId, currency);
        if (!token) {
          throw new Error(`Token ${currency} not supported`);
        }

        const signer = await walletManager.getSigner(networkId);
        if (!signer) throw new Error('No signer available');

        const result = await tokenManager.transferToken(
          token.address,
          subWalletAddress,
          amount,
          token.decimals,
          signer
        );
        
        return result.hash;
      }
    } catch (error) {
      console.error('Failed to fund sub-wallet:', error);
      throw error;
    }
  }

  // Get sub-wallet balance
  async getSubWalletBalance(subWalletAddress: string, currency: string, networkId: number): Promise<string> {
    try {
      const network = getNetworkById(networkId);
      if (!network) return '0';

      if (currency === 'ETH') {
        const balance = await fallbackProvider.getBalance(subWalletAddress, network.chainId);
        return balance || '0';
      } else {
        const token = getTokenBySymbol(networkId, currency);
        if (!token) return '0';

        const provider = await fallbackProvider.getWorkingProvider(network.chainId);
        if (!provider) return '0';

        return await tokenManager.getTokenBalance(
          token.address,
          subWalletAddress,
          provider,
          token.decimals
        );
      }
    } catch (error) {
      console.error('Failed to get sub-wallet balance:', error);
      return '0';
    }
  }
}

export const escrowManager = new EscrowManager();