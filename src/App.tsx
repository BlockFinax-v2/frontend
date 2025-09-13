/**
 * Main Application Component
 * 
 * React application root with routing, state management, and wallet integration.
 * Handles wallet authentication flow, referral processing, and global providers.
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState } from "react";
import { coinbaseIntegration } from "@/lib/coinbase";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@/assets/logo.png";

// Pages
import Wallet from "@/pages/wallet";
import CreateWallet from "@/pages/create-wallet";
import ImportWallet from "@/pages/import-wallet";
import UnlockWallet from "@/pages/unlock-wallet";
import Referrals from "@/pages/referrals";
import AdminDashboard from "@/pages/admin-dashboard";
import EscrowDashboard from "@/pages/escrow-dashboard";
import AdminNav from "@/components/admin-nav";
import NotFound from "@/pages/not-found";
import RoleSelection from "@/pages/role-selection";
import ExporterDashboard from "@/pages/exporter-dashboard";
import ImporterDashboard from "@/pages/importer-dashboard";
import ArbitratorDashboard from "@/pages/arbitrator-dashboard";
import FinancierDashboard from "@/pages/financier-dashboard";
import Contracts from "@/pages/contracts";
import Invoices from "@/pages/invoices";

/**
 * Wallet Authentication and Routing Component
 * Manages wallet state and redirects users based on authentication status
 */
function WalletCheck() {
  const { walletExists, isUnlocked, isLoading, wallet } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasProcessedReferral, setHasProcessedReferral] = useState(false);

  /**
   * Process referral codes from URL parameters
   * Awards points to referrer when new user signs up
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode && wallet?.address && !hasProcessedReferral) {
      setHasProcessedReferral(true);
      
      // Process the referral
      fetch(`/api/referrals/use/${referralCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referredWalletAddress: wallet.address
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Referral code used successfully") {
          toast({
            title: "Welcome!",
            description: `You've been referred to BlockFinaX! The referrer earned ${data.pointsAwarded} points.`,
          });
          
          // Clean up URL to remove referral parameter
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      })
      .catch(error => {
        console.error('Failed to process referral:', error);
        // Don't show error to user as referral might have already been used
      });
    }
  }, [wallet?.address, hasProcessedReferral, toast]);

  useEffect(() => {
    if (!isLoading) {
      if (!walletExists()) {
        // Stay on home page for wallet creation/import
        return;
      } else if (!isUnlocked) {
        setLocation('/unlock-wallet');
      } else {
        // After wallet is unlocked, go to wallet page by default
        setLocation('/wallet');
      }
    }
  }, [isLoading, walletExists, isUnlocked, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 flex items-center justify-center mx-auto mb-4">
            <img src={logoPath} alt="BlockFinaX Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="text-lg font-semibold mb-2">BlockFinaX</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // If no wallet exists, show create/import options
  if (!walletExists()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img src={logoPath} alt="BlockFinaX Logo" className="w-16 h-16 object-contain" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Welcome to BlockFinaX</h1>
          <p className="text-muted-foreground mb-8">
            Secure blockchain-powered platform for cross-border trade finance, escrow services, and international business transactions
          </p>
          
          <div className="space-y-4">
            <a
              href="/unlock-wallet"
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Unlock Wallet
            </a>
            
            <a
              href="/create-wallet"
              className="block w-full border border-border hover:bg-muted text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Create New Wallet
            </a>
            
            <a
              href="/import-wallet"
              className="block w-full border border-border hover:bg-muted text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Import Existing Wallet
            </a>
          </div>
          
          <div className="mt-8 p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <i className="fas fa-info-circle text-warning text-sm mt-0.5"></i>
              <div className="text-sm text-left">
                <p className="font-medium text-warning mb-1">Testnet Environment</p>
                <p className="text-muted-foreground">
                  Demo platform for trade finance workflows. Use testnet tokens only for business process validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while navigation happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 flex items-center justify-center mx-auto mb-4">
          <img src={logoPath} alt="BlockFinaX Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="text-lg font-semibold mb-2">BlockFinaX</div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={WalletCheck} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/role-selection" component={RoleSelection} />
      <Route path="/exporter-dashboard" component={ExporterDashboard} />
      <Route path="/importer-dashboard" component={ImporterDashboard} />
      <Route path="/arbitrator-dashboard" component={ArbitratorDashboard} />
      <Route path="/financier-dashboard" component={FinancierDashboard} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/admin-nav" component={AdminNav} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/escrow-admin" component={EscrowDashboard} />
      <Route path="/create-wallet" component={CreateWallet} />
      <Route path="/import-wallet" component={ImportWallet} />
      <Route path="/unlock-wallet" component={UnlockWallet} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize Coinbase integration for enhanced market data
    coinbaseIntegration.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
