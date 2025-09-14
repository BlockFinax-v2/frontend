/**
 * Contracts Page
 * 
 * Main page for contract management with comprehensive drafting,
 * signature verification, and deliverable tracking capabilities.
 */

import { WalletProvider } from '@/contexts/wallet-context';
import { ContractDraftManager } from '@/components/contracts/contract-draft-manager';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Contracts() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/wallet">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wallet
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
              Smart Contracts
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
              Create, manage, and execute blockchain-secured trade contracts
            </p>
          </div>

          <ContractDraftManager />
        </div>
      </div>
    </WalletProvider>
  );
}