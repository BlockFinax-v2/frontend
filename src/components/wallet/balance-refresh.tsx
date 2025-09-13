import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { walletManager } from '@/lib/wallet';
import { NETWORKS } from '@/lib/networks';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { ethers } from 'ethers';

interface BalanceResult {
  networkId: number;
  networkName: string;
  balance: string;
  symbol: string;
  success: boolean;
  error?: string;
}

export function BalanceRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balanceResults, setBalanceResults] = useState<BalanceResult[]>([]);
  const { toast } = useToast();
  const { address, isUnlocked } = useWallet();

  const refreshBalances = async () => {
    if (!isUnlocked || !address) {
      toast({
        title: 'Error',
        description: 'Please unlock your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsRefreshing(true);
    setBalanceResults([]);
    
    const results: BalanceResult[] = [];

    for (const network of NETWORKS) {
      try {
        console.log(`Checking balance for ${network.name}...`);
        
        // Create fresh provider for each network
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        
        // Test connection first
        await provider._detectNetwork();
        
        // Get balance
        const balance = await provider.getBalance(address);
        const balanceEth = ethers.formatEther(balance);
        
        results.push({
          networkId: network.id,
          networkName: network.name,
          balance: balanceEth,
          symbol: network.symbol,
          success: true
        });
        
        console.log(`${network.name}: ${balanceEth} ${network.symbol}`);
        
      } catch (error) {
        console.error(`Failed to get balance for ${network.name}:`, error);
        results.push({
          networkId: network.id,
          networkName: network.name,
          balance: '0',
          symbol: network.symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setBalanceResults(results);
    setIsRefreshing(false);

    const successCount = results.filter(r => r.success).length;
    const hasBalances = results.some(r => r.success && parseFloat(r.balance) > 0);

    if (hasBalances) {
      toast({
        title: 'Balances Found!',
        description: `Successfully retrieved balances from ${successCount}/${NETWORKS.length} networks`,
      });
    } else if (successCount > 0) {
      toast({
        title: 'Networks Connected',
        description: `Connected to ${successCount}/${NETWORKS.length} networks, but no balances found`,
      });
    } else {
      toast({
        title: 'Connection Issues',
        description: 'Could not connect to any networks. Try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Manual Balance Refresh</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If your balance isn't showing but you confirmed the transaction on the blockchain, 
              use this tool to force refresh your balances across all networks.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Wallet Address:</p>
              <p className="text-sm font-mono text-muted-foreground break-all">{address}</p>
            </div>
            <Button 
              onClick={refreshBalances}
              disabled={isRefreshing || !isUnlocked}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Balances
                </>
              )}
            </Button>
          </div>

          {balanceResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Balance Results:</h3>
              
              {balanceResults.map((result) => (
                <div 
                  key={result.networkId} 
                  className={`p-3 border rounded-lg ${
                    result.success 
                      ? parseFloat(result.balance) > 0 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.networkName}</span>
                    </div>
                    
                    {result.success ? (
                      <div className="text-right">
                        <p className="font-mono font-medium">
                          {parseFloat(result.balance).toFixed(6)} {result.symbol}
                        </p>
                        {parseFloat(result.balance) > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Balance found!
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Connection failed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.error?.slice(0, 40)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {balanceResults.some(r => r.success && parseFloat(r.balance) > 0) && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success!</strong> Your balances have been found. The wallet interface should now display your correct balances.
                    If they still don't appear in the main wallet view, try refreshing the page.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}