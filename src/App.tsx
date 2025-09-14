/**
 * Main Application Component
 * 
 * React application root with routing, state management, and wallet integration.
 * Handles wallet authentication flow, referral processing, and global providers.
 */

import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState } from "react";
import { coinbaseIntegration } from "@/lib/coinbase";
import { useToast } from "@/hooks/use-toast";
import { logoPath } from "@/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Wallet as WalletIcon, Plus, Download } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-sm mx-auto shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 p-2 bg-primary/10 rounded-full flex items-center justify-center">
                <img src={logoPath} alt="BlockFinaX Logo" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="text-xl font-semibold mb-3">BlockFinaX</h2>
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no wallet exists, show create/import options
  if (!walletExists()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 p-2 bg-primary/10 rounded-full flex items-center justify-center">
                <img src={logoPath} alt="BlockFinaX Logo" className="w-16 h-16 object-contain" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to BlockFinaX
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Secure blockchain-powered platform for cross-border trade finance, escrow services, and international business transactions
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <Button asChild size="lg" className="w-full h-12 text-base font-medium">
                <Link href="/unlock-wallet">
                  <WalletIcon className="mr-2 h-5 w-5" />
                  Unlock Wallet
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-medium">
                <Link href="/create-wallet">
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Wallet
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-medium">
                <Link href="/import-wallet">
                  <Download className="mr-2 h-5 w-5" />
                  Import Existing Wallet
                </Link>
              </Button>
            </div>
            
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Testnet Environment</span>
                <br />
                <span className="text-sm">
                  Demo platform for trade finance workflows. Use testnet tokens only for business process validation.
                </span>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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
