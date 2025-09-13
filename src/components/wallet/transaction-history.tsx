import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/use-transactions';
import { getNetworkById } from '@/lib/networks';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionHistoryProps {
  networkId: number;
  className?: string;
}

export function TransactionHistory({ networkId, className = '' }: TransactionHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const { 
    transactions, 
    isLoadingTransactions, 
    formatCrypto, 
    formatCurrency,
    refreshAll 
  } = useTransactions(networkId);

  const network = getNetworkById(networkId);
  
  const displayTransactions = showAll ? transactions : transactions.slice(0, 5);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') {
      return 'fas fa-clock text-warning';
    }
    if (status === 'failed') {
      return 'fas fa-times text-destructive';
    }
    return type === 'received' ? 'fas fa-arrow-down text-success' : 'fas fa-arrow-up text-destructive';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'confirmed': 'default',
      'pending': 'secondary',
      'failed': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const openInExplorer = (hash: string) => {
    if (!network?.blockExplorerUrl) return;
    window.open(`${network.blockExplorerUrl}/tx/${hash}`, '_blank');
  };

  if (isLoadingTransactions) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              className="px-3"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {transactions.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-receipt text-muted-foreground text-xl"></i>
            </div>
            <h3 className="font-medium text-lg mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Your transaction history will appear here once you send or receive funds.
            </p>
            <p className="text-xs text-muted-foreground">
              Current balance sources may be from testnet faucets which don't always create transaction records.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((tx, index) => (
              <div 
                key={tx.hash || index}
                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                    <i className={`${getTransactionIcon(tx.type, tx.status)} text-sm`}></i>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {tx.type === 'received' ? 'Received' : 'Sent'} {network?.symbol}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>
                        {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                      </span>
                      <span>•</span>
                      <span>{network?.name}</span>
                      {network?.blockExplorerUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openInExplorer(tx.hash)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    tx.type === 'received' ? 'text-success' : 'text-foreground'
                  }`}>
                    {tx.type === 'received' ? '+' : '-'}
                    {formatCrypto(tx.value, network?.symbol || '')}
                  </div>
                  {tx.usdValue && (
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(tx.usdValue)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
