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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  InfoIcon, 
  Wallet as WalletIcon, 
  Plus, 
  Download, 
  Shield, 
  Globe, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap
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

/**
 * Enhanced Loading Component with Better Animation
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-sm mx-auto shadow-2xl border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <CardContent className="p-10">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
              <div className="relative w-20 h-20 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center shadow-lg">
                <img src={logoPath} alt="BlockFinaX Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BlockFinaX
                </h2>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Beta
                </Badge>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-muted-foreground font-medium">Initializing...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Enhanced Welcome Screen with Modern Design
 */
function WelcomeScreen() {
  const features = [
    { icon: Shield, text: "Bank-grade security" },
    { icon: Globe, text: "Global reach" },
    { icon: TrendingUp, text: "Real-time tracking" },
    { icon: Zap, text: "Instant settlements" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={logoPath} alt="BlockFinaX Logo" className="w-10 h-10 object-contain invert" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    BlockFinaX
                  </h1>
                  <Badge variant="outline" className="mt-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Next-Gen Trade Finance
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  Revolutionary Blockchain Platform for 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Cross-Border Trade</span>
                </h2>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Experience the future of international commerce with our secure, transparent, and efficient blockchain-powered ecosystem for trade finance, escrow services, and global business transactions.
                </p>
              </div>
            </div>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 dark:border-gray-700/50">
                  <feature.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Wallet Actions Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Get Started
                </CardTitle>
                <CardDescription className="text-base">
                  Choose how you'd like to access the platform
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Primary Action - Unlock Wallet */}
                <Button asChild size="lg" className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  <Link href="/unlock-wallet">
                    <WalletIcon className="mr-3 h-5 w-5" />
                    Unlock Existing Wallet
                    <ArrowRight className="ml-auto h-5 w-5" />
                  </Link>
                </Button>
                
                <div className="relative">
                  <Separator className="my-6" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-white dark:bg-gray-950 px-3">
                      or
                    </Badge>
                  </div>
                </div>
                
                {/* Secondary Actions */}
                <div className="space-y-3">
                  <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-medium hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:border-blue-800 transition-colors">
                    <Link href="/create-wallet">
                      <Plus className="mr-3 h-5 w-5" />
                      Create New Wallet
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="lg" className="w-full h-12 text-base font-medium hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/30 dark:hover:border-purple-800 transition-colors">
                    <Link href="/import-wallet">
                      <Download className="mr-3 h-5 w-5" />
                      Import Wallet
                    </Link>
                  </Button>
                </div>
                
                <Separator className="my-6" />
                
                {/* Testnet Notice */}
                <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/50">
                  <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                          Testnet
                        </Badge>
                        <span className="font-semibold text-sm">Demo Environment</span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        Explore trade finance workflows with testnet tokens. Perfect for validating business processes before going live.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
                
                {/* Trust Indicators */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Audited</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Compliant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            title: "🎉 Welcome to BlockFinaX!",
            description: `You've been successfully referred! The referrer earned ${data.pointsAwarded} points.`,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
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
    return <LoadingScreen />;
  }

  // If no wallet exists, show enhanced welcome screen
  if (!walletExists()) {
    return <WelcomeScreen />;
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