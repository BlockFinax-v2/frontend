import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { NETWORKS } from '@/lib/networks';
import { fallbackProvider } from '@/lib/fallback-provider';
import { RefreshCw, TrendingUp, Wallet, AlertCircle } from 'lucide-react';

interface NetworkBalance {
  networkId: number;
  networkName: string;
  symbol: string;
  balance: string;
  usdValue: number;
  color: string;
  isConnected: boolean;
}

export function BalanceDisplay() {
  const [balances, setBalances] = useState<NetworkBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const { address, isUnlocked } = useWallet();
  const { toast } = useToast();

  const mockPrices = {
    'ETH': 2400,
    'MATIC': 0.8,
    'BNB': 320
  };

  const loadBalances = async () => {
    if (!isUnlocked || !address) return;

    setIsLoading(true);
    console.log('Loading balances for address:', address);
    
    const networkBalances: NetworkBalance[] = [];

    for (const network of NETWORKS) {
      try {
        console.log(`Checking ${network.name}...`);
        const balanceEth = await fallbackProvider.getBalance(address, network.chainId);
        
        const balance = balanceEth || '0';
        const usdValue = parseFloat(balance) * (mockPrices[network.symbol as keyof typeof mockPrices] || 0);

        networkBalances.push({
          networkId: network.id,
          networkName: network.name,
          symbol: network.symbol,
          balance,
          usdValue,
          color: network.color,
          isConnected: balanceEth !== null
        });

        console.log(`${network.name}: ${balance} ${network.symbol}`);
      } catch (error) {
        console.error(`Error loading ${network.name}:`, error);
        networkBalances.push({
          networkId: network.id,
          networkName: network.name,
          symbol: network.symbol,
          balance: '0',
          usdValue: 0,
          color: network.color,
          isConnected: false
        });
      }
    }

    setBalances(networkBalances);
    setIsLoading(false);
    setHasAttemptedLoad(true);

    const connectedNetworks = networkBalances.filter(b => b.isConnected).length;
    const hasBalances = networkBalances.some(b => parseFloat(b.balance) > 0);
    
    if (hasBalances) {
      toast({
        title: 'Balances Loaded',
        description: `Found balances on ${connectedNetworks} networks`,
      });
    }
  };

  useEffect(() => {
    if (isUnlocked && address && !hasAttemptedLoad) {
      loadBalances();
    }
  }, [isUnlocked, address]);

  const totalUsdValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const connectedCount = balances.filter(b => b.isConnected).length;

  if (!isUnlocked) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Unlock wallet to view balances</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Portfolio Balance</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBalances}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold">
                ${totalUsdValue.toFixed(2)} USD
              </p>
              <p className="text-sm text-muted-foreground">
                Base Sepolia Network
              </p>
            </div>

            {hasAttemptedLoad && connectedCount === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Unable to connect to any network. Check your internet connection or try refreshing.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Network Balances */}
      <div className="grid gap-4">
        {balances.map((balance) => (
          <Card key={balance.networkId} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: balance.color }}
                  />
                  <div>
                    <p className="font-medium">{balance.networkName}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={balance.isConnected ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {balance.isConnected ? "Connected" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-mono font-medium">
                    {parseFloat(balance.balance).toFixed(6)} {balance.symbol}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${balance.usdValue.toFixed(2)} USD
                  </p>
                </div>
              </div>
              
              {parseFloat(balance.balance) > 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    ✓ Balance detected on blockchain
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {hasAttemptedLoad && balances.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No network data available</p>
            <Button className="mt-4" onClick={loadBalances}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}