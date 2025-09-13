import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactions } from '@/hooks/use-transactions';
import { useWallet } from '@/hooks/use-wallet';
import { getNetworkById } from '@/lib/networks';
import { SendModal } from './send-modal';
import { ReceiveModal } from './receive-modal';
import { RefreshCw, Send, QrCode, ArrowUpDown, Plus, ExternalLink, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletOverviewProps {
  selectedNetworkId: number;
  className?: string;
}

export function WalletOverview({ selectedNetworkId, className = '' }: WalletOverviewProps) {
  const { address } = useWallet();
  const { 
    allBalances, 
    totalValue, 
    isLoadingBalance, 
    formatCurrency, 
    formatCrypto, 
    refreshAll 
  } = useTransactions(selectedNetworkId);
  
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [buyConfirmOpen, setBuyConfirmOpen] = useState(false);

  const getNetworkIcon = (networkId: number) => {
    const network = getNetworkById(networkId);
    return network?.icon || 'fas fa-coins';
  };

  const getNetworkColor = (networkId: number) => {
    const network = getNetworkById(networkId);
    return network?.color || '#6B7280';
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoadingBalance) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wallet Balance Card */}
      <Card className="balance-card">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Wallet Balance</h2>
              <p className="text-sm text-muted-foreground">
                Base Sepolia Network
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshAll}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold mb-1">
              {formatCurrency(totalValue)}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-success border-success/20 bg-success/5">
                +4.67% (24h)
              </Badge>
            </div>
          </div>
          
          {/* Network Balances */}
          <div className="space-y-3">
            {allBalances.map((balance) => {
              const network = getNetworkById(balance.networkId);
              if (!network) return null;
              
              return (
                <div key={balance.networkId} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${network.color}20` }}
                    >
                      <i className={`${network.icon} text-sm`} style={{ color: network.color }}></i>
                    </div>
                    <div>
                      <div className="font-medium">{network.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCrypto(balance.balance, balance.symbol)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(balance.usdValue)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(balance.usdValue / parseFloat(balance.balance || '1'))} / {balance.symbol}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="flex flex-col items-center p-6 h-auto space-y-3 hover:bg-primary/5"
          onClick={() => setSendModalOpen(true)}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium">Send</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center p-6 h-auto space-y-3 hover:bg-success/5"
          onClick={() => setReceiveModalOpen(true)}
        >
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
            <QrCode className="h-5 w-5 text-success" />
          </div>
          <span className="font-medium">Receive</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center p-6 h-auto space-y-3 hover:bg-warning/5"
          disabled
        >
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
            <ArrowUpDown className="h-5 w-5 text-warning" />
          </div>
          <span className="font-medium">Swap</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex flex-col items-center p-6 h-auto space-y-3 hover:bg-purple-500/5"
          onClick={() => setBuyConfirmOpen(true)}
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
            <Plus className="h-5 w-5 text-purple-500" />
          </div>
          <span className="font-medium">Buy</span>
        </Button>
      </div>

      {/* Account Info */}
      {address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 wallet-gradient rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {address.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Main Account</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {formatAddress(address)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.clipboard.writeText(address)}
                className="shrink-0"
              >
                <i className="fas fa-copy text-sm"></i>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <SendModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        defaultNetworkId={selectedNetworkId}
      />
      
      <ReceiveModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
      />

      {/* Buy Confirmation Dialog */}
      <Dialog open={buyConfirmOpen} onOpenChange={setBuyConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center space-x-2">
              <ExternalLink className="h-5 w-5 text-purple-500" />
              <span>Purchase Digital Currency</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              You're about to leave our platform to buy digital currency for deposit. 
              You'll be redirected to our trusted partner sendexit.com to complete your purchase securely.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-700 dark:text-purple-300">
                <p className="font-medium mb-1">Safe & Secure</p>
                <p>Your transaction will be processed through our verified payment partner with industry-standard security.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setBuyConfirmOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setBuyConfirmOpen(false);
                window.open('https://www.sendexit.com/', '_blank');
              }}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Proceed to Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
