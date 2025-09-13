/**
 * Contracts Page
 * 
 * Main page for contract management with comprehensive drafting,
 * signature verification, and deliverable tracking capabilities.
 */

import { WalletProvider } from '@/contexts/wallet-context';
import { ContractDraftManager } from '@/components/contracts/contract-draft-manager';

export default function Contracts() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ContractDraftManager />
        </div>
      </div>
    </WalletProvider>
  );
}