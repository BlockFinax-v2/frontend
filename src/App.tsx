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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  InfoIcon, 
  Wallet as WalletIcon, 
  Plus, 
  Download, 
  Globe, 
  Sparkles,
  ArrowRight,
  Lock,
  Network,
  Coins,
  Activity
} from "lucide-react";


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
import { Separator } from "@/components/ui/separator";

/**
 * Animated Blockchain Network Background
 */
function BlockchainBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-slate-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
}

/**
 * Enhanced Loading Component with Blockchain Aesthetic
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950">
      <BlockchainBackground />
      
      <Card className="w-full max-w-sm mx-auto shadow-2xl border border-emerald-500/20 bg-slate-900/90 backdrop-blur-xl relative overflow-hidden">
        {/* Animated border */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 animate-pulse" />
        <div className="absolute inset-[1px] bg-slate-900 rounded-lg" />
        
        <CardContent className="relative p-10 z-10">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              {/* Rotating ring */}
              <div className="absolute inset-0 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-cyan-500/30 border-b-cyan-500 rounded-full animate-spin animate-reverse delay-150" />
              
              <div className="relative w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-xl border border-emerald-500/30">
                <img src={logoPath} alt="BlockFinaX Logo" className="w-12 h-12 object-contain brightness-125" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  BlockFinaX
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                  <Network className="w-3 h-3 mr-1" />
                  v2.0
                </Badge>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-slate-400 font-medium">Connecting to blockchain...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Enhanced Welcome Screen with Blockchain Design
 */
function WelcomeScreen() {
  const { walletExists } = useWallet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switchAccount, setSwitchAccount] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  // Assume isRegistered is determined from user state or localStorage
  // For now, we'll use a simple check - replace with actual logic
  const isRegistered = false; // TODO: Implement proper registration check

  // Close create/import dialogs when wallet is created
  useEffect(() => {
    if (walletExists() && (showCreateWallet || showImportWallet)) {
      setShowCreateWallet(false);
      setShowImportWallet(false);
    }
  }, [walletExists, showCreateWallet, showImportWallet]);

  // Handler for Get Started button
  const handleGetStarted = () => {
    setDialogOpen(true);
    setSwitchAccount(false);
  };

  // Handler for switching account
  const handleSwitchAccount = () => {
    setSwitchAccount(true);
    setDialogOpen(true);
  };

  // Handler for create wallet
  const handleCreateWallet = () => {
    setDialogOpen(false);
    setShowCreateWallet(true);
  };

  // Handler for import wallet
  const handleImportWallet = () => {
    setDialogOpen(false);
    setShowImportWallet(true);
  };
  const features = [
    { icon: Lock, text: "Multi-sig security", color: "from-emerald-400 to-emerald-600" },
    { icon: Globe, text: "Cross-chain support", color: "from-cyan-400 to-cyan-600" },
    { icon: Activity, text: "Real-time settlement", color: "from-slate-400 to-slate-600" },
    { icon: Coins, text: "DeFi integration", color: "from-emerald-400 to-cyan-600" }
  ];

  const stats = [
    { value: "$2.4B+", label: "Volume Processed" },
    { value: "15K+", label: "Active Traders" },
    { value: "99.9%", label: "Uptime" },
    { value: "45+", label: "Countries" }
  ];

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950 overflow-hidden">
      <BlockchainBackground />
      
      {/* Header */}
      <div className="relative z-10 border-b border-emerald-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <img src={logoPath} alt="BlockFinaX" className="w-5 h-5 object-contain invert" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                BlockFinaX
              </span>
            </div>
            
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hidden sm:flex">
              <Network className="w-3 h-3 mr-1" />
              Testnet Live
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Next-Generation Trade Finance</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent">
                Blockchain-Powered
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Global Trade
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
              Revolutionary DeFi platform enabling secure, transparent, and efficient cross-border trade finance through blockchain technology and smart contracts.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left side - Features */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">
                  Built for the Future of Finance
                </h3>
                
                <div className="grid gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="group p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg`}>
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{feature.text}</div>
                          <div className="text-sm text-slate-400">
                            {index === 0 && "Advanced multi-signature wallet protection"}
                            {index === 1 && "Ethereum, Polygon, BSC compatibility"}
                            {index === 2 && "Instant blockchain confirmations"}
                            {index === 3 && "Seamless DeFi protocol integration"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right side - Get Started */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className="w-full max-w-md h-16 text-xl font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={handleGetStarted}
              >
                <Sparkles className="mr-3 h-6 w-6" />
                Get Started
                <ArrowRight className="ml-auto h-6 w-6" />
              </Button>
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-md bg-slate-900 border-emerald-500/20">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold text-white">
                    Access Your Wallet
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Conditional Content */}
                  {switchAccount ? (
                    // Show both options for switching account
                    <>
                      <Button size="lg" className="w-full h-14 text-base font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-xl hover:shadow-2xl transition-all duration-300" onClick={() => { setDialogOpen(false); setShowUnlockDialog(true); }}>
                        <WalletIcon className="mr-3 h-5 w-5" />
                        Unlock Wallet
                        <ArrowRight className="ml-auto h-5 w-5" />
                      </Button>
                      
                      <div className="relative">
                        <Separator className="bg-slate-700" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-slate-700">
                            or
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button variant="outline" size="lg" className="w-full h-12 text-base font-medium border-slate-600 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-white transition-all duration-300" onClick={handleCreateWallet}>
                          <Plus className="mr-3 h-5 w-5" />
                          Create New Wallet
                        </Button>
                        
                        <Button variant="outline" size="lg" className="w-full h-12 text-base font-medium border-slate-600 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-white transition-all duration-300" onClick={handleImportWallet}>
                          <Download className="mr-3 h-5 w-5" />
                          Import Existing Wallet
                        </Button>
                      </div>
                    </>
                  ) : isRegistered ? (
                    // Only show Unlock Wallet for registered users
                    <Button size="lg" className="w-full h-14 text-base font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-xl hover:shadow-2xl transition-all duration-300" onClick={() => { setDialogOpen(false); setShowUnlockDialog(true); }}>
                      <WalletIcon className="mr-3 h-5 w-5" />
                      Unlock Wallet
                      <ArrowRight className="ml-auto h-5 w-5" />
                    </Button>
                  ) : (
                    // Only show Create/Import Wallet for new users
                    <div className="space-y-3">
                      <Button variant="outline" size="lg" className="w-full h-12 text-base font-medium border-slate-600 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-white transition-all duration-300" onClick={handleCreateWallet}>
                        <Plus className="mr-3 h-5 w-5" />
                        Create New Wallet
                      </Button>
                      
                      <Button variant="outline" size="lg" className="w-full h-12 text-base font-medium border-slate-600 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-white transition-all duration-300" onClick={handleImportWallet}>
                        <Download className="mr-3 h-5 w-5" />
                        Import Existing Wallet
                      </Button>
                    </div>
                  )}
                  
                  <Separator className="bg-slate-700" />
                  
                  {/* Testnet Notice */}
                  <Alert className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border-amber-500/30 backdrop-blur-sm">
                    <InfoIcon className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-200">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-300 bg-amber-500/10">
                            <Network className="w-3 h-3 mr-1" />
                            Testnet
                          </Badge>
                          <span className="font-semibold text-sm">Demo Environment</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          Experience blockchain trade finance with testnet tokens. Zero risk, full functionality.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  {/* Switch Account Button for registered users */}
                  {isRegistered && !switchAccount && (
                    <Button
                      variant="ghost"
                      className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                      onClick={handleSwitchAccount}
                    >
                      Switch Account
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Wallet Dialog */}
            <Dialog open={showCreateWallet} onOpenChange={setShowCreateWallet}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <CreateWallet />
              </DialogContent>
            </Dialog>

            {/* Import Wallet Dialog */}
            <Dialog open={showImportWallet} onOpenChange={setShowImportWallet}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <ImportWallet />
              </DialogContent>
            </Dialog>

            {/* Unlock Wallet Dialog */}
            <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <UnlockWallet />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
function WalletCheck() {
  const { walletExists, isUnlocked, isLoading, wallet } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasProcessedReferral, setHasProcessedReferral] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  // Replace with actual registration check logic
  const isRegistered = wallet && wallet.address && wallet.displayName; // Example: has profile

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
            title: "🎉 Welcome to BlockFinaX!",
            description: `You've been successfully referred! The referrer earned ${data.pointsAwarded} points.`,
            className: "bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200",
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
        setShowUnlockDialog(true);
        // Prevent navigation until wallet is unlocked
        return;
      } else if (!isRegistered) {
        setShowRegistrationDialog(true);
        // Prevent navigation to dashboard until registered
        return;
      } else {
        // After wallet is unlocked and registered, go to wallet page by default
        setLocation('/wallet');
      }
    }
  }, [isLoading, walletExists, isUnlocked, isRegistered, setLocation]);

  // Close unlock dialog when wallet becomes unlocked
  useEffect(() => {
    if (isUnlocked && showUnlockDialog) {
      setShowUnlockDialog(false);
    }
  }, [isUnlocked, showUnlockDialog]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If no wallet exists, show enhanced welcome screen
  if (!walletExists()) {
    return <WelcomeScreen />;
  }

  // Show unlock dialog if wallet exists but not unlocked
  if (showUnlockDialog) {
    return (
      <Dialog open={showUnlockDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <UnlockWallet />
        </DialogContent>
      </Dialog>
    );
  }

  // Show registration dialog if not registered
  if (showRegistrationDialog) {
    return (
      <Dialog open={showRegistrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-400">You must complete registration before accessing the dashboard.</p>
            {/* Registration form or link to registration page goes here */}
            <Button onClick={() => setShowRegistrationDialog(false)}>
              Register Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state while navigation happens
  return <LoadingScreen />;
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