import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/hooks/use-transactions';
import { coinbaseIntegration } from '@/lib/coinbase';
import { getNetworkById } from '@/lib/networks';
import { TrendingUp, TrendingDown, Activity, PieChart, BarChart3 } from 'lucide-react';

interface DeFiDashboardProps {
  selectedNetworkId: number;
  className?: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

export function DeFiDashboard({ selectedNetworkId, className = '' }: DeFiDashboardProps) {
  const { allBalances, totalValue, formatCurrency } = useTransactions(selectedNetworkId);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [networkStatus, setNetworkStatus] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
    loadNetworkStatus();
  }, []);

  const loadMarketData = async () => {
    try {
      const symbols = ['ETH', 'BTC', 'MATIC', 'BNB'];
      const data: MarketData[] = [];

      for (const symbol of symbols) {
        const price = await coinbaseIntegration.getAssetPrice(symbol);
        if (price) {
          data.push({
            symbol,
            price,
            change24h: (Math.random() - 0.5) * 10, // Random change for demo
            volume: Math.random() * 1000000000
          });
        }
      }

      setMarketData(data);
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const loadNetworkStatus = async () => {
    try {
      const status: { [key: string]: any } = {};
      const networks = [1, 2, 3, 4]; // Network IDs

      for (const networkId of networks) {
        const network = getNetworkById(networkId);
        if (network) {
          status[networkId] = await coinbaseIntegration.getNetworkStatus(network.chainId.toString());
        }
      }

      setNetworkStatus(status);
    } catch (error) {
      console.error('Failed to load network status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPortfolioAllocation = () => {
    if (totalValue === 0) return [];

    return allBalances.map(balance => {
      const network = getNetworkById(balance.networkId);
      const percentage = (balance.usdValue / totalValue) * 100;
      
      return {
        name: network?.name || 'Unknown',
        symbol: balance.symbol,
        value: balance.usdValue,
        percentage,
        color: network?.color || '#6B7280'
      };
    }).sort((a, b) => b.percentage - a.percentage);
  };

  const getTotalYield = () => {
    // Mock yield calculation - in real app, calculate from DeFi protocols
    return totalValue * 0.045; // 4.5% APY
  };

  const portfolioAllocation = getPortfolioAllocation();
  const totalYield = getTotalYield();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Market Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.map((asset) => (
              <div key={asset.symbol} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{asset.symbol}</span>
                  <div className={`flex items-center space-x-1 text-sm ${
                    asset.change24h >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {asset.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(asset.change24h).toFixed(2)}%</span>
                  </div>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(asset.price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vol: {formatCurrency(asset.volume / 1000000)}M
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Portfolio Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioAllocation.map((allocation, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: allocation.color }}
                      />
                      <span className="font-medium">{allocation.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{allocation.percentage.toFixed(1)}%</div>
                      <div className="text-muted-foreground">
                        {formatCurrency(allocation.value)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={allocation.percentage} 
                    className="h-2"
                    style={{ 
                      background: `linear-gradient(to right, ${allocation.color}20 0%, ${allocation.color}20 100%)`
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* DeFi Yield */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>DeFi Opportunities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Estimated Annual Yield</span>
                  <Badge variant="outline" className="text-success border-success/20">
                    4.5% APY
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(totalYield)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on current DeFi protocols
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Top Protocols</h4>
                {[
                  { name: 'Aave', apy: 5.2, tvl: '12.5B' },
                  { name: 'Compound', apy: 4.8, tvl: '8.2B' },
                  { name: 'Uniswap V3', apy: 6.1, tvl: '4.1B' }
                ].map((protocol, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{protocol.name}</div>
                      <div className="text-sm text-muted-foreground">
                        TVL: ${protocol.tvl}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-success">
                        {protocol.apy}% APY
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(networkStatus).map(([networkId, status]) => {
              const network = getNetworkById(parseInt(networkId));
              if (!network) return null;

              return (
                <div key={networkId} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.isActive ? '#10B981' : '#EF4444' }}
                    />
                    <span className="font-medium">{network.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {status.isActive ? 'Active' : 'Inactive'}
                  </div>
                  {status.latestBlock && (
                    <div className="text-sm text-muted-foreground">
                      Block: #{status.latestBlock.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}