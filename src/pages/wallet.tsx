import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnhancedWalletOverview } from '@/components/wallet/enhanced-wallet-overview';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { NetworkSelector } from '@/components/wallet/network-selector';
import { TradeFinanceModal } from '@/components/trade-finance/trade-finance-modal';
import { TradeFinanceDashboard } from '@/components/trade-finance/trade-finance-dashboard';
import { EscrowDashboard } from '@/components/escrow/escrow-dashboard';
import { TransactionChecker } from '@/components/wallet/transaction-checker';
import DocumentManager from '@/components/document-management/document-manager';
import WalletChat from '@/components/communication/wallet-chat';
import ProfileSettings from '@/components/profile/profile-settings';
import { SubWalletManager } from '@/components/wallet/sub-wallet-manager';
import { InvoiceManager } from '@/components/invoices/invoice-manager';
import { useWallet } from '@/hooks/use-wallet';
import { Settings, Lock, Download, Upload, Network, FileText, Search, MessageCircle, User, TrendingUp, Shield, CreditCard, Copy, Eye, EyeOff, Gift, Receipt } from 'lucide-react';
import { logoPath } from "@/assets";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Wallet() {
  const [, setLocation] = useLocation();
  const { isUnlocked, lockWallet, settings, exportPrivateKey, exportMnemonic, walletExists, isLoading, wallet } = useWallet();
  const [selectedNetworkId, setSelectedNetworkId] = useState(settings.selectedNetworkId);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'privateKey' | 'mnemonic'>('privateKey');
  const [exportedData, setExportedData] = useState('');
  const [showExportData, setShowExportData] = useState(false);
  const { toast } = useToast();

  // Redirect if wallet doesn't exist or after loading is complete and still not unlocked
  useEffect(() => {
    if (!isLoading) {
      if (!walletExists()) {
        setLocation('/');
      } else if (!isUnlocked) {
        setLocation('/unlock-wallet');
      }
    }
  }, [isUnlocked, walletExists, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/50 to-cyan-200/50 rounded-full blur-xl animate-pulse"></div>
            <div className="relative p-6 bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-xl">
              <img 
                src={logoPath} 
                alt="BlockFinaX Logo" 
                className="w-16 h-12 object-contain mx-auto mb-4"
              />
              <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Loading BlockFinaX...
              </div>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!walletExists() || !isUnlocked) {
    return null; // Will redirect
  }

  const handleExportPrivateKey = () => {
    try {
      const privateKey = exportPrivateKey();
      setExportedData(privateKey);
      setExportType('privateKey');
      setExportModalOpen(true);
      setShowExportData(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export private key. Make sure your wallet is unlocked.",
      });
    }
  };

  const handleExportMnemonic = () => {
    try {
      const mnemonic = exportMnemonic();
      if (mnemonic) {
        setExportedData(mnemonic);
        setExportType('mnemonic');
        setExportModalOpen(true);
        setShowExportData(false);
      } else {
        toast({
          variant: "destructive",
          title: "No Seed Phrase",
          description: "This wallet was imported using a private key and doesn't have a seed phrase.",
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export seed phrase. Make sure your wallet is unlocked.",
      });
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportedData);
    toast({
      title: "Copied!",
      description: `${exportType === 'privateKey' ? 'Private key' : 'Seed phrase'} copied to clipboard.`,
    });
  };

  const handleLockWallet = () => {
    lockWallet();
    setLocation('/unlock-wallet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-cyan-100/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl shadow-lg border-b border-emerald-100/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl shadow-lg">
                <img 
                  src={logoPath} 
                  alt="BlockFinaX Logo" 
                  className="w-6 sm:w-8 h-6 sm:h-8 object-contain"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                BlockFinaX
              </h1>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 hidden sm:inline-flex">
                TESTNET
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/referrals')}
                className="hidden sm:flex bg-white/50 border-emerald-200/50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800"
              >
                <Gift className="h-4 w-4 mr-2" />
                Referrals
              </Button>
              
              <div className="hidden sm:block">
                <NetworkSelector
                  selectedNetworkId={selectedNetworkId}
                  onNetworkChange={setSelectedNetworkId}
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation('/referrals')}
                className="sm:hidden h-8 w-8 bg-white/50 border-emerald-200/50 hover:bg-emerald-50"
              >
                <Gift className="h-3 w-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 bg-white/50 border-emerald-200/50 hover:bg-emerald-50">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-emerald-200/50">
                  <DropdownMenuItem onClick={handleExportMnemonic} className="hover:bg-emerald-50 text-slate-700 hover:text-emerald-800">
                    <Download className="h-4 w-4 mr-2" />
                    Export Seed Phrase
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleExportPrivateKey} className="hover:bg-emerald-50 text-slate-700 hover:text-emerald-800">
                    <Upload className="h-4 w-4 mr-2" />
                    Export Private Key
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setActiveTab('profile')} className="hover:bg-emerald-50 text-slate-700 hover:text-emerald-800">
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem disabled className="text-slate-500">
                    <Network className="h-4 w-4 mr-2" />
                    Network Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-emerald-200/50" />
                  
                  <DropdownMenuItem onClick={handleLockWallet} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-14 sm:h-12 p-1 bg-white/50 backdrop-blur-sm border border-emerald-200/50 rounded-xl shadow-lg">
            <TabsTrigger value="overview" className="flex flex-col items-center justify-center space-y-1 text-xs p-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <CreditCard className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col items-center justify-center space-y-1 text-xs p-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex flex-col items-center justify-center space-y-1 text-xs p-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <Receipt className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex flex-col items-center justify-center space-y-1 text-xs p-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Trade Finance</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex flex-col items-center justify-center space-y-1 text-xs p-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex flex-col items-center justify-center space-y-1 text-xs p-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
              <Shield className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Contracts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 sm:mt-8">
            {/* Mobile Network Selector */}
            <div className="sm:hidden mb-6">
              <div className="bg-white/60 backdrop-blur-sm border border-emerald-200/50 rounded-xl p-4 shadow-lg">
                <NetworkSelector
                  selectedNetworkId={selectedNetworkId}
                  onNetworkChange={setSelectedNetworkId}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-cyan-100/50 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-6 shadow-xl">
                  <EnhancedWalletOverview 
                    selectedNetworkId={selectedNetworkId}
                    className="mb-4 sm:mb-6"
                    onTabChange={setActiveTab}
                  />
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/50 to-blue-100/50 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-cyan-200/50 rounded-2xl p-6 shadow-xl">
                  <TransactionHistory networkId={selectedNetworkId} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6 shadow-xl">
                <WalletChat />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-red-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 shadow-xl">
                <InvoiceManager walletAddress={wallet?.address || ''} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="defi" className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-teal-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-6 shadow-xl">
                <TradeFinanceDashboard selectedNetworkId={selectedNetworkId} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-xl">
                <DocumentManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="escrow" className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-gray-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-xl">
                <SubWalletManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-cyan-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-6 shadow-xl">
                <ProfileSettings />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-emerald-200/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-slate-800">
              <Download className="h-5 w-5 text-emerald-600" />
              <span>Export {exportType === 'privateKey' ? 'Private Key' : 'Seed Phrase'}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {exportType === 'privateKey' 
                ? 'Your private key gives full access to your wallet. Keep it secure and never share it.'
                : 'Your seed phrase can restore your entire wallet. Store it safely and never share it.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Security Warning */}
            <div className="p-4 bg-red-50/80 border border-red-200/50 rounded-lg backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800 mb-1">Security Warning</p>
                  <p className="text-red-700">
                    Anyone with access to this {exportType === 'privateKey' ? 'private key' : 'seed phrase'} can steal your funds. 
                    Only copy it to a secure location.
                  </p>
                </div>
              </div>
            </div>

            {/* Export Data */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">
                {exportType === 'privateKey' ? 'Private Key' : 'Seed Phrase'}
              </div>
              <div className="relative">
                <textarea
                  id="export-data"
                  className="w-full p-3 bg-slate-50/80 border border-slate-200/50 rounded-lg font-mono text-sm text-slate-800 min-h-[100px] resize-none focus:border-emerald-300 focus:ring-emerald-200"
                  value={showExportData ? exportedData : '•'.repeat(exportedData.length)}
                  readOnly
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 hover:bg-slate-100 text-slate-600"
                  onClick={() => setShowExportData(!showExportData)}
                >
                  {showExportData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setExportModalOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleCopyToClipboard} className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
              <Copy className="h-4 w-4" />
              <span>Copy to Clipboard</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
