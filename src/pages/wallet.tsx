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
import logoPath from "@/assets/logo.png";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logoPath} 
            alt="BlockFinaX Logo" 
            className="w-24 h-16 object-contain mx-auto mb-4"
          />
          <div className="text-lg font-semibold mb-2">Loading BlockFinaX...</div>
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <img 
                src={logoPath} 
                alt="BlockFinaX Logo" 
                className="w-6 sm:w-8 h-6 sm:h-8 object-contain shrink-0"
              />
              <h1 className="text-lg sm:text-xl font-semibold truncate">BlockFinaX</h1>
              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs hidden sm:inline-flex">
                TESTNET
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/referrals')}
                className="hidden sm:flex"
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
                className="sm:hidden h-8 w-8"
              >
                <Gift className="h-3 w-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleExportMnemonic}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Seed Phrase
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleExportPrivateKey}>
                    <Upload className="h-4 w-4 mr-2" />
                    Export Private Key
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem disabled>
                    <Network className="h-4 w-4 mr-2" />
                    Network Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLockWallet} className="text-destructive">
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-14 sm:h-12 p-1">
            <TabsTrigger value="overview" className="flex flex-col items-center justify-center space-y-1 text-xs p-1">
              <CreditCard className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col items-center justify-center space-y-1 text-xs p-1">
              <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex flex-col items-center justify-center space-y-1 text-xs p-1">
              <Receipt className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex flex-col items-center justify-center space-y-1 text-xs p-1">
              <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Trade Finance</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex flex-col items-center justify-center space-y-1 text-xs p-1">
              <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex flex-col items-center justify-center space-y-1 text-xs p-1">
              <Shield className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-medium">Contracts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 sm:mt-6">
            {/* Mobile Network Selector */}
            <div className="sm:hidden mb-4">
              <NetworkSelector
                selectedNetworkId={selectedNetworkId}
                onNetworkChange={setSelectedNetworkId}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:gap-8">
              <EnhancedWalletOverview 
                selectedNetworkId={selectedNetworkId}
                className="mb-4 sm:mb-6"
                onTabChange={setActiveTab}
              />
              <TransactionHistory networkId={selectedNetworkId} />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-4 sm:mt-6">
            <WalletChat />
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 sm:mt-6">
            <InvoiceManager walletAddress={wallet?.address || ''} />
          </TabsContent>

          <TabsContent value="defi" className="mt-4 sm:mt-6">
            <TradeFinanceDashboard selectedNetworkId={selectedNetworkId} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4 sm:mt-6">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="escrow" className="mt-4 sm:mt-6">
            <SubWalletManager />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </main>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export {exportType === 'privateKey' ? 'Private Key' : 'Seed Phrase'}</span>
            </DialogTitle>
            <DialogDescription>
              {exportType === 'privateKey' 
                ? 'Your private key gives full access to your wallet. Keep it secure and never share it.'
                : 'Your seed phrase can restore your entire wallet. Store it safely and never share it.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Security Warning */}
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive mb-1">Security Warning</p>
                  <p className="text-muted-foreground">
                    Anyone with access to this {exportType === 'privateKey' ? 'private key' : 'seed phrase'} can steal your funds. 
                    Only copy it to a secure location.
                  </p>
                </div>
              </div>
            </div>

            {/* Export Data */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {exportType === 'privateKey' ? 'Private Key' : 'Seed Phrase'}
              </div>
              <div className="relative">
                <textarea
                  id="export-data"
                  className="w-full p-3 bg-muted rounded-lg font-mono text-sm min-h-[100px] resize-none"
                  value={showExportData ? exportedData : '•'.repeat(exportedData.length)}
                  readOnly
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowExportData(!showExportData)}
                >
                  {showExportData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyToClipboard} className="flex items-center space-x-2">
              <Copy className="h-4 w-4" />
              <span>Copy to Clipboard</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
