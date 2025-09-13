import { ethers } from 'ethers';
import { walletManager } from './wallet';
import { NETWORKS } from './networks';

// Escrow contract ABI (simplified for key functions)
const ESCROW_ABI = [
  "function createEscrow(address _exporter, address _arbitrator, uint256 _arbitratorFee, uint256 _deadline, string memory _description, string memory _termsHash, string[] memory _milestonesTitles, string[] memory _milestonesDescriptions, uint256[] memory _milestonesAmounts, uint256[] memory _milestonesDueDates) external payable returns (uint256)",
  "function addSubWallet(uint256 _escrowId, address _walletAddress, string memory _role, string[] memory _permissions) external",
  "function completeMilestone(uint256 _escrowId, uint256 _milestoneIndex) external",
  "function releaseMilestonePayment(uint256 _escrowId, uint256 _milestoneIndex) external",
  "function raiseDispute(uint256 _escrowId, string memory _reason) external",
  "function resolveDispute(uint256 _escrowId, uint256[] memory _milestoneIndexes, bool[] memory _releaseToExporter) external",
  "function getEscrowDetails(uint256 _escrowId) external view returns (tuple(address importer, address exporter, address arbitrator, uint256 totalAmount, uint256 arbitratorFee, uint256 deadline, uint8 status, uint8 disputeStatus, string description, string termsHash))",
  "function getMilestones(uint256 _escrowId) external view returns (tuple(string title, string description, uint256 amount, uint256 dueDate, uint8 status, bool released)[])",
  "function getSubWallets(uint256 _escrowId) external view returns (address[])",
  "function hasPermission(uint256 _escrowId, address _wallet, string memory _permission) external view returns (bool)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed importer, address indexed exporter, uint256 amount)",
  "event MilestoneCompleted(uint256 indexed escrowId, uint256 milestoneIndex)",
  "event MilestoneReleased(uint256 indexed escrowId, uint256 milestoneIndex, uint256 amount)",
  "event DisputeRaised(uint256 indexed escrowId, address indexed initiator, string reason)"
];

// Contract addresses for different networks (testnet addresses)
const ESCROW_CONTRACT_ADDRESSES: Record<number, string> = {
  11155111: '0x742d35Cc6635C0532925a3b8D1a8Be2CBDB2B1c1', // Ethereum Sepolia
  80001: '0x742d35Cc6635C0532925a3b8D1a8Be2CBDB2B1c1',    // Polygon Mumbai
  97: '0x742d35Cc6635C0532925a3b8D1a8Be2CBDB2B1c1',       // BSC Testnet
  421613: '0x742d35Cc6635C0532925a3b8D1a8Be2CBDB2B1c1'     // Arbitrum Goerli
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
  arbitratorFee: string;
  deadline: Date;
  status: 'created' | 'funded' | 'in_progress' | 'completed' | 'disputed' | 'refunded';
  disputeStatus: 'none' | 'raised' | 'in_arbitration' | 'resolved';
  description: string;
  termsHash: string;
  milestones: EscrowMilestone[];
  subWallets: SubWallet[];
  networkId: number;
}

export interface SubWallet {
  address: string;
  role: 'importer' | 'exporter' | 'arbitrator' | 'observer';
  permissions: string[];
  isActive: boolean;
}

export interface CreateEscrowParams {
  exporterAddress: string;
  arbitratorAddress: string;
  arbitratorFee: string;
  deadline: Date;
  description: string;
  termsAndConditions: string;
  milestones: {
    title: string;
    description: string;
    amount: string;
    dueDate: Date;
  }[];
  networkId: number;
}

export class EscrowManager {
  private getContract(networkId: number): ethers.Contract | null {
    const contractAddress = ESCROW_CONTRACT_ADDRESSES[networkId];
    if (!contractAddress) return null;

    const provider = walletManager.getProvider(networkId);
    if (!provider) return null;

    if (walletManager.isUnlocked()) {
      const wallet = walletManager.getWallet();
      if (wallet) {
        const signer = wallet.connect(provider);
        return new ethers.Contract(contractAddress, ESCROW_ABI, signer);
      }
    }
    return new ethers.Contract(contractAddress, ESCROW_ABI, provider);
  }

  async createEscrow(params: CreateEscrowParams): Promise<{ escrowId: number; txHash: string }> {
    if (!walletManager.isUnlocked()) {
      throw new Error('Wallet not unlocked');
    }

    const contract = this.getContract(params.networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    // Calculate total amount needed
    const totalMilestoneAmount = params.milestones.reduce((sum, milestone) => {
      return sum + parseFloat(milestone.amount);
    }, 0);

    const totalAmount = totalMilestoneAmount + parseFloat(params.arbitratorFee);

    // Prepare milestone data
    const milestonesTitles = params.milestones.map(m => m.title);
    const milestonesDescriptions = params.milestones.map(m => m.description);
    const milestonesAmounts = params.milestones.map(m => ethers.parseEther(m.amount));
    const milestonesDueDates = params.milestones.map(m => Math.floor(m.dueDate.getTime() / 1000));

    // Store terms in IPFS (simplified - in production use actual IPFS)
    const termsHash = `terms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const tx = await contract.createEscrow(
        params.exporterAddress,
        params.arbitratorAddress,
        ethers.parseEther(params.arbitratorFee),
        Math.floor(params.deadline.getTime() / 1000),
        params.description,
        termsHash,
        milestonesTitles,
        milestonesDescriptions,
        milestonesAmounts,
        milestonesDueDates,
        {
          value: ethers.parseEther(totalAmount.toString())
        }
      );

      const receipt = await tx.wait();
      
      // Parse the EscrowCreated event to get the escrow ID
      const escrowCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      let escrowId = 0;
      if (escrowCreatedEvent) {
        const parsed = contract.interface.parseLog(escrowCreatedEvent);
        escrowId = parseInt(parsed?.args.escrowId.toString() || '0');
      }

      return {
        escrowId,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  async addSubWallet(
    escrowId: number, 
    walletAddress: string, 
    role: string, 
    permissions: string[], 
    networkId: number
  ): Promise<string> {
    if (!walletManager.isUnlocked()) {
      throw new Error('Wallet not unlocked');
    }

    const contract = this.getContract(networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    try {
      const tx = await contract.addSubWallet(escrowId, walletAddress, role, permissions);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error adding sub-wallet:', error);
      throw error;
    }
  }

  async completeMilestone(escrowId: number, milestoneIndex: number, networkId: number): Promise<string> {
    if (!walletManager.isUnlocked()) {
      throw new Error('Wallet not unlocked');
    }

    const contract = this.getContract(networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    try {
      const tx = await contract.completeMilestone(escrowId, milestoneIndex);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  async releaseMilestonePayment(escrowId: number, milestoneIndex: number, networkId: number): Promise<string> {
    if (!walletManager.isUnlocked()) {
      throw new Error('Wallet not unlocked');
    }

    const contract = this.getContract(networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    try {
      const tx = await contract.releaseMilestonePayment(escrowId, milestoneIndex);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error releasing milestone payment:', error);
      throw error;
    }
  }

  async raiseDispute(escrowId: number, reason: string, networkId: number): Promise<string> {
    if (!walletManager.isUnlocked()) {
      throw new Error('Wallet not unlocked');
    }

    const contract = this.getContract(networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    try {
      const tx = await contract.raiseDispute(escrowId, reason);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error raising dispute:', error);
      throw error;
    }
  }

  async getEscrowDetails(escrowId: number, networkId: number): Promise<any> {
    const contract = this.getContract(networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    try {
      const details = await contract.getEscrowDetails(escrowId);
      const milestones = await contract.getMilestones(escrowId);
      const subWallets = await contract.getSubWallets(escrowId);

      return {
        importer: details.importer,
        exporter: details.exporter,
        arbitrator: details.arbitrator,
        totalAmount: ethers.formatEther(details.totalAmount),
        arbitratorFee: ethers.formatEther(details.arbitratorFee),
        deadline: new Date(Number(details.deadline) * 1000),
        status: details.status,
        disputeStatus: details.disputeStatus,
        description: details.description,
        termsHash: details.termsHash,
        milestones: milestones.map((m: any) => ({
          title: m.title,
          description: m.description,
          amount: ethers.formatEther(m.amount),
          dueDate: new Date(Number(m.dueDate) * 1000),
          status: m.status,
          released: m.released
        })),
        subWallets
      };
    } catch (error) {
      console.error('Error getting escrow details:', error);
      throw error;
    }
  }

  async estimateGasForEscrowCreation(params: CreateEscrowParams): Promise<string> {
    const contract = this.getContract(params.networkId);
    if (!contract) {
      throw new Error('Escrow contract not available for this network');
    }

    try {
      const totalMilestoneAmount = params.milestones.reduce((sum, milestone) => {
        return sum + parseFloat(milestone.amount);
      }, 0);

      const totalAmount = totalMilestoneAmount + parseFloat(params.arbitratorFee);

      const milestonesTitles = params.milestones.map(m => m.title);
      const milestonesDescriptions = params.milestones.map(m => m.description);
      const milestonesAmounts = params.milestones.map(m => ethers.parseEther(m.amount));
      const milestonesDueDates = params.milestones.map(m => Math.floor(m.dueDate.getTime() / 1000));

      const termsHash = `terms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const gasEstimate = await contract.createEscrow.estimateGas(
        params.exporterAddress,
        params.arbitratorAddress,
        ethers.parseEther(params.arbitratorFee),
        Math.floor(params.deadline.getTime() / 1000),
        params.description,
        termsHash,
        milestonesTitles,
        milestonesDescriptions,
        milestonesAmounts,
        milestonesDueDates,
        {
          value: ethers.parseEther(totalAmount.toString())
        }
      );

      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }
}

export const escrowManager = new EscrowManager();