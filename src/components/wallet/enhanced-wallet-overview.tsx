import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTransactions } from '@/hooks/use-transactions';
import { useWallet } from '@/hooks/use-wallet';
import { getNetworkById } from '@/lib/networks';
import { SendModal } from './send-modal';
import { DepositModal } from './deposit-modal';

import { TradeFinanceModal } from '../trade-finance/trade-finance-modal';
import { RefreshCw, Send, Download, Shield, Plus, TrendingUp, TrendingDown, ExternalLink, Wallet, CreditCard, Bitcoin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EnhancedWalletOverviewProps {
  selectedNetworkId: number;
  className?: string;
  onTabChange?: (tab: string) => void;
}

export function EnhancedWalletOverview({ selectedNetworkId, className = '', onTabChange }: EnhancedWalletOverviewProps) {
  const { address } = useWallet();
  const { 
    allBalances, 
    tokenBalances,
    totalValue, 
    isLoadingBalance, 
    formatCurrency, 
    formatCrypto, 
    refreshAll 
  } = useTransactions(selectedNetworkId);
  
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [tradeFinanceModalOpen, setTradeFinanceModalOpen] = useState(false);
  const [walletType, setWalletType] = useState<'crypto' | 'fiat'>('crypto');

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getPortfolioChange = () => {
    // Mock portfolio change - in real app, calculate from historical data
    const change = 4.67;
    const isPositive = change > 0;
    const currentValue = walletType === 'crypto' ? totalValue : getFiatBalance();
    return {
      percentage: Math.abs(change),
      isPositive,
      value: (currentValue * change) / 100
    };
  };

  const getFiatBalance = () => {
    // Fiat balance is zero as requested
    return 0;
  };

  const getCurrentBalance = () => {
    return walletType === 'crypto' ? totalValue : getFiatBalance();
  };

  const getFiatHoldings = () => {
    // Fiat holdings with zero balances as requested
    return [
      {
        name: "Checking Account",
        balance: 0,
        accountNumber: "****1234",
        type: "USD",
        institution: "First National Bank"
      },
      {
        name: "Savings Account", 
        balance: 0,
        accountNumber: "****5678",
        type: "USD",
        institution: "First National Bank"
      }
    ];
  };

  if (isLoadingBalance) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="overflow-hidden">
          <div className="wallet-gradient p-6 text-black">
            <div className="flex justify-between items-start mb-6">
              <div>
                <Skeleton className="h-6 w-32 mb-2 bg-white/20" />
                <Skeleton className="h-4 w-48 bg-white/20" />
              </div>
              <Skeleton className="h-8 w-8 rounded bg-white/20" />
            </div>
            <Skeleton className="h-12 w-48 mb-4 bg-white/20" />
            <Skeleton className="h-6 w-32 bg-white/20" />
          </div>
        </Card>
      </div>
    );
  }

  const portfolioChange = getPortfolioChange();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Portfolio Card */}
      <Card className="overflow-hidden">
        <div className="wallet-gradient p-4 sm:p-6 text-black">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6">
            <div className="mb-3 sm:mb-0 flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-xl font-semibold">Portfolio Balance</h2>
                <Select value={walletType} onValueChange={(value: 'crypto' | 'fiat') => setWalletType(value)}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto" className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <Bitcoin className="h-4 w-4" />
                        <span>Crypto Wallet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fiat" className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Fiat Wallet</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-black/80 text-sm">
                {walletType === 'crypto' ? 'Base Sepolia Network' : 'Traditional Banking'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshAll}
              className="self-start sm:self-auto shrink-0 text-black hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4 sm:mb-6">
            <div className="text-3xl sm:text-4xl font-bold mb-2">
              {formatCurrency(getCurrentBalance())}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
              <div className={`flex items-center space-x-1 text-sm ${
                portfolioChange.isPositive ? 'text-green-300' : 'text-red-300'
              }`}>
                {portfolioChange.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {portfolioChange.isPositive ? '+' : '-'}
                  {portfolioChange.percentage}% (24h)
                </span>
              </div>
              <span className="text-black/60 text-sm">
                {portfolioChange.isPositive ? '+' : '-'}
                {formatCurrency(Math.abs(portfolioChange.value))}
              </span>
            </div>
          </div>

          {/* Account Info */}
          {address && (
            <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="wallet-gradient text-black font-medium text-sm">
                  {walletType === 'crypto' ? address.slice(2, 4).toUpperCase() : 'FB'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {walletType === 'crypto' ? 'Crypto Account' : 'Fiat Account'}
                </div>
                <div className="text-sm text-black/80 font-mono">
                  {walletType === 'crypto' ? formatAddress(address) : '****1234 • ****5678'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.clipboard.writeText(walletType === 'crypto' ? address : 'Account: ****1234, ****5678')}
                className="shrink-0 text-black hover:bg-white/20"
              >
                <i className="fas fa-copy text-sm"></i>
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <CardContent className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center p-3 sm:p-4 h-auto space-y-1 sm:space-y-2 hover:bg-primary/5 border-primary/20"
              onClick={() => setSendModalOpen(true)}
            >
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Send className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              </div>
              <span className="font-medium text-xs sm:text-sm">Send</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center p-3 sm:p-4 h-auto space-y-1 sm:space-y-2 hover:bg-success/5 border-success/20"
              onClick={() => setDepositModalOpen(true)}
            >
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-success/10 rounded-full flex items-center justify-center">
                <Download className="h-4 sm:h-5 w-4 sm:w-5 text-success" />
              </div>
              <span className="font-medium text-xs sm:text-sm">Deposit</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{walletType === 'crypto' ? 'Token Holdings' : 'Account Holdings'}</span>
            <Badge variant="outline" className="text-xs">
              {walletType === 'crypto' 
                ? `${(allBalances.length > 0 ? 1 : 0) + tokenBalances.length} Tokens`
                : `${getFiatHoldings().length} Accounts`
              }
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {walletType === 'crypto' ? (
              <>
                {/* ETH Token */}
                {allBalances.length > 0 && (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-blue-500/20 shrink-0">
                        <span className="text-base sm:text-lg font-bold text-blue-500">Ξ</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base truncate">Ethereum</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {formatCrypto(allBalances[0].balance, 'ETH')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm sm:text-lg">{formatCurrency(allBalances[0].usdValue)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        $2,400 / ETH
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Token Balances */}
                {tokenBalances.map(({ token, balance, usdValue }: any) => (
                  <div key={token.symbol} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${token.color}20` }}>
                        <span className="text-base sm:text-lg">{token.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base truncate">{token.name}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {formatCrypto(balance, token.symbol, token.decimals === 6 ? 2 : 4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm sm:text-lg">{formatCurrency(usdValue)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        $1.00 / {token.symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Fiat Account Holdings */}
                {getFiatHoldings().map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center bg-green-500/20 shrink-0">
                        <span className="text-base sm:text-lg font-bold text-green-500">$</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base truncate">{account.name}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {account.accountNumber} • {account.institution}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm sm:text-lg">{formatCurrency(account.balance)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {account.type}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SendModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        defaultNetworkId={selectedNetworkId}
      />
      
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />

      <TradeFinanceModal
        isOpen={tradeFinanceModalOpen}
        onClose={() => setTradeFinanceModalOpen(false)}
        selectedNetworkId={selectedNetworkId}
      />
    </div>
  );
}