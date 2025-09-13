import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactions } from '@/hooks/use-transactions';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { getNetworkById } from '@/lib/networks';
import { TradeFinanceModal } from './trade-finance-modal';
import { getTokenBySymbol } from '@/lib/tokens';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart, 
  BarChart3, 
  DollarSign,
  Users,
  Clock,
  Shield,
  Globe,
  FileText,
  Banknote,
  AlertCircle,
  CheckCircle,
  Calendar,
  Settings
} from 'lucide-react';

interface TradeFinanceDashboardProps {
  selectedNetworkId: number;
  className?: string;
}

// Trade finance pool data - compatible with modal format
const financePools = [
  {
    id: 1,
    poolName: "Global Electronics Trade Pool",
    totalLiquidity: "2,500,000",
    currency: "USDC",
    interestRate: "8.5%",
    minFinancing: "10,000",
    maxFinancing: "500,000",
    providers: 12,
    averageApprovalTime: "24 hours",
    region: "Asia-Pacific",
    status: "active",
    collateralRatio: "120%",
    utilization: 65
  },
  {
    id: 2,
    poolName: "Textile Import Finance Pool",
    totalLiquidity: "1,800,000",
    currency: "USDC",
    interestRate: "7.2%",
    minFinancing: "5,000",
    maxFinancing: "250,000",
    providers: 8,
    averageApprovalTime: "18 hours",
    region: "Europe-Africa",
    status: "active",
    collateralRatio: "110%",
    utilization: 78
  },
  {
    id: 3,
    poolName: "Agricultural Trade Finance",
    totalLiquidity: "3,200,000",
    currency: "USDT",
    interestRate: "6.8%",
    minFinancing: "15,000",
    maxFinancing: "750,000",
    providers: 15,
    averageApprovalTime: "12 hours",
    region: "Americas",
    status: "active",
    collateralRatio: "130%",
    utilization: 45
  }
];

// Mock applications for demonstration
const applications = [
  {
    id: 1,
    invoiceNumber: "INV-2024-001",
    supplier: "TechCorp Manufacturing",
    buyer: "Global Electronics Ltd",
    invoiceAmount: 125000,
    requestedAmount: 100000,
    currency: "USDC",
    status: "approved",
    interestRate: 8.5,
    escrowContract: "ESC-2024-001",
    submittedDate: new Date('2024-02-10'),
    approvalDate: new Date('2024-02-11'),
    expectedPayment: new Date('2024-03-10'),
    collateralValue: 150000,
    region: "Asia-Pacific"
  },
  {
    id: 2,
    invoiceNumber: "INV-2024-002", 
    supplier: "Textile Exports Inc",
    buyer: "European Fashion House",
    invoiceAmount: 85000,
    requestedAmount: 68000,
    currency: "USDC",
    status: "under_review",
    interestRate: 7.2,
    escrowContract: "ESC-2024-002",
    submittedDate: new Date('2024-02-15'),
    expectedPayment: new Date('2024-03-15'),
    collateralValue: 95000,
    region: "Europe-Africa"
  }
];

export function TradeFinanceDashboard({ selectedNetworkId, className = '' }: TradeFinanceDashboardProps) {
  const { allBalances, totalValue, formatCurrency } = useTransactions(selectedNetworkId);
  const [activePool, setActivePool] = useState(financePools[0]);
  const [tradeFinanceModalOpen, setTradeFinanceModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<typeof applications[0] | null>(null);
  const [selectedPoolForApplication, setSelectedPoolForApplication] = useState<typeof financePools[0] | null>(null);
  const [applicationDetailsModalOpen, setApplicationDetailsModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isSettling, setIsSettling] = useState(false);
  
  const { wallet } = useWallet();
  const { toast } = useToast();
  const network = getNetworkById(selectedNetworkId);

  // Calculate aggregate statistics
  const totalLiquidity = financePools.reduce((sum, pool) => sum + parseFloat(pool.totalLiquidity.replace(/,/g, '')), 0);
  const averageInterestRate = financePools.reduce((sum, pool) => sum + parseFloat(pool.interestRate.replace('%', '')), 0) / financePools.length;
  const totalProviders = financePools.reduce((sum, pool) => sum + pool.providers, 0);
  const activeApplications = applications.filter(app => app.status !== 'rejected').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'approved': return 'bg-blue-500';
      case 'under_review': return 'bg-yellow-500';
      case 'funded': return 'bg-green-600';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    return `$${amount} ${currency}`;
  };

  // Handle loan settlement initiation
  const handleInitiateSettlement = async (payment: any) => {
    if (!wallet?.address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to initiate settlement",
        variant: "destructive"
      });
      return;
    }

    setSelectedPayment(payment);
    setSettlementModalOpen(true);
  };

  // Execute the settlement transaction
  const executeSettlement = async () => {
    if (!selectedPayment || !wallet?.address) return;

    setIsSettling(true);
    
    try {
      // Use Base Sepolia token addresses for settlement
      const networkTokens = {
        'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Sepolia USDC
        'USDT': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'  // Base Sepolia USDT
      };

      const tokenAddress = networkTokens[selectedPayment.currency as keyof typeof networkTokens];
      if (!tokenAddress) {
        throw new Error(`Token ${selectedPayment.currency} not supported on network ${network?.name || selectedNetworkId}`);
      }

      const token = {
        address: tokenAddress,
        symbol: selectedPayment.currency,
        decimals: 6
      };

      // Get pool liquidity provider address (in real implementation, this would come from the contract)
      const liquidityProviderAddress = "0x1234567890123456789012345678901234567890";
      
      // Calculate the settlement amount including any fees
      const settlementAmount = selectedPayment.amount.toString();

      toast({
        title: "Settlement Initiated",
        description: `Preparing to settle ${formatAmount(settlementAmount, selectedPayment.currency)} to liquidity providers`,
      });

      // In a real implementation, this would call the wallet's send function
      // const result = await wallet.sendTransaction({
      //   to: liquidityProviderAddress,
      //   value: settlementAmount,
      //   token: token.address
      // });

      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Settlement Completed",
        description: `Successfully settled ${formatAmount(settlementAmount, selectedPayment.currency)} for ${selectedPayment.invoice}`,
      });

      setSettlementModalOpen(false);
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Settlement failed:', error);
      toast({
        title: "Settlement Failed",
        description: error instanceof Error ? error.message : "Transaction failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Liquidity</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(totalLiquidity / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Interest Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {averageInterestRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Liquidity Providers</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {totalProviders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Applications</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">
                  {activeApplications}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pools" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12">
          <TabsTrigger value="pools" className="text-xs sm:text-sm">Finance Pools</TabsTrigger>
          <TabsTrigger value="applications" className="text-xs sm:text-sm">My Applications</TabsTrigger>
          <TabsTrigger value="manage" className="text-xs sm:text-sm">Manage Finance</TabsTrigger>
        </TabsList>

        {/* Finance Pools Tab */}
        <TabsContent value="pools" className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Available Trade Finance Pools</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Choose from our curated pools for cross-border trade financing
            </p>
          </div>

          <div className="grid gap-6">
            {financePools.map((pool) => (
              <Card key={pool.id} className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <span>{pool.poolName}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`${getStatusColor(pool.status)} text-white`}>
                        {pool.status}
                      </Badge>
                      <Badge variant="outline">
                        {pool.region}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Total Liquidity</Label>
                      <div className="font-semibold text-lg text-green-600">
                        {formatAmount(pool.totalLiquidity, pool.currency)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Interest Rate</Label>
                      <div className="font-semibold text-lg text-blue-600">{pool.interestRate}% APR</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Financing Range</Label>
                      <div className="font-semibold text-sm">
                        ${pool.minFinancing} - ${pool.maxFinancing}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Approval Time</Label>
                      <div className="font-semibold text-sm">{pool.averageApprovalTime}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Utilization</Label>
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{pool.utilization}%</div>
                        <Progress value={pool.utilization} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{pool.providers} Providers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Collateral: {pool.collateralRatio}%</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedPoolForApplication(pool);
                        setTradeFinanceModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg sm:text-xl font-semibold">My Finance Applications</h3>
            <Button onClick={() => {
              setSelectedPoolForApplication(null);
              setTradeFinanceModalOpen(true);
            }} variant="outline" className="w-full sm:w-auto">
              New Application
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-2">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      <span>Invoice {app.invoiceNumber}</span>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`${getStatusColor(app.status)} text-white text-xs`}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {app.region}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Supplier</Label>
                      <div className="font-semibold">{app.supplier}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Buyer</Label>
                      <div className="font-semibold">{app.buyer}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Invoice Amount</Label>
                      <div className="font-semibold text-green-600">
                        {formatAmount(app.invoiceAmount.toString(), app.currency)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Financed Amount</Label>
                      <div className="font-semibold text-blue-600">
                        {formatAmount(app.requestedAmount.toString(), app.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Escrow Contract</Label>
                      <div className="font-semibold">{app.escrowContract}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Interest Rate</Label>
                      <div className="font-semibold text-orange-600">{app.interestRate}% APR</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Collateral Value</Label>
                      <div className="font-semibold text-purple-600">
                        {formatAmount(app.collateralValue.toString(), app.currency)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Expected Payment</Label>
                      <div className="font-semibold">{app.expectedPayment.toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Submitted: {app.submittedDate.toLocaleDateString()}</span>
                      </div>
                      {app.status === 'approved' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Approved: {app.approvalDate?.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(app);
                        setApplicationDetailsModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Manage Finance Tab */}
        <TabsContent value="manage" className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Manage Finance Activities</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor and manage your trade finance portfolio and payment schedules
            </p>
          </div>

          {/* Portfolio Overview */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <span>Portfolio Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">$325,000</div>
                  <div className="text-xs sm:text-sm text-green-600/70">Total Financed</div>
                  <div className="text-xs text-muted-foreground mt-1">Active Positions</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">$68,000</div>
                  <div className="text-xs sm:text-sm text-blue-600/70">Outstanding</div>
                  <div className="text-xs text-muted-foreground mt-1">Due Soon</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">7.8%</div>
                  <div className="text-xs sm:text-sm text-purple-600/70">Avg Interest</div>
                  <div className="text-xs text-muted-foreground mt-1">Weighted Rate</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">12</div>
                  <div className="text-xs sm:text-sm text-orange-600/70">Active Deals</div>
                  <div className="text-xs text-muted-foreground mt-1">In Portfolio</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <span>Upcoming Payment Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
              {[
                {
                  date: new Date('2024-03-10'),
                  invoice: 'INV-2024-001',
                  amount: 68000,
                  currency: 'USDC',
                  status: 'due_soon',
                  daysUntil: 5
                },
                {
                  date: new Date('2024-03-15'),
                  invoice: 'INV-2024-002',
                  amount: 85000,
                  currency: 'USDC',
                  status: 'upcoming',
                  daysUntil: 10
                },
                {
                  date: new Date('2024-03-22'),
                  invoice: 'INV-2024-003',
                  amount: 42000,
                  currency: 'USDT',
                  status: 'upcoming',
                  daysUntil: 17
                }
              ].map((payment, index) => (
                <div key={index} className={`p-3 sm:p-4 rounded-lg border-2 ${
                  payment.status === 'due_soon' 
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        payment.status === 'due_soon' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <div className="font-semibold text-sm sm:text-base">{payment.invoice}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Due: {payment.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:text-right space-y-2 w-full sm:w-auto">
                      <div className="font-bold text-base sm:text-lg">
                        ${payment.amount.toLocaleString()} {payment.currency}
                      </div>
                      <div className={`text-xs sm:text-sm ${
                        payment.status === 'due_soon' ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {payment.daysUntil} days remaining
                      </div>
                      <Button 
                        size="sm" 
                        className={`${
                          payment.status === 'due_soon' 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white w-full sm:w-auto text-xs sm:text-sm`}
                        onClick={() => handleInitiateSettlement(payment)}
                      >
                        Settle Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Finance Settings & Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Auto-Payment Settings */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  <span>Auto-Payment Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-sm sm:text-base">Automatic Repayment</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Auto-pay from escrow when conditions are met
                    </div>
                  </div>
                  <div className="w-10 h-5 sm:w-12 sm:h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-sm sm:text-base">Payment Reminders</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Email notifications 3 days before due date
                    </div>
                  </div>
                  <div className="w-10 h-5 sm:w-12 sm:h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-sm sm:text-base">Early Payment Discount</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Apply for 0.5% discount on early payments
                    </div>
                  </div>
                  <div className="w-10 h-5 sm:w-12 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center px-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finance Tools */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span>Finance Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
                <Button 
                  className="w-full justify-start text-xs sm:text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Payment Projections",
                      description: "Based on current portfolio: $68,000 due in 5 days, $127,000 due in next 30 days"
                    });
                  }}
                >
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Calculate Payment Projections
                </Button>
                
                <Button 
                  className="w-full justify-start text-xs sm:text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const statement = {
                      totalFinanced: "$325,000",
                      outstanding: "$195,000", 
                      avgRate: "7.8%",
                      nextPayment: "$68,000 USDC on March 10"
                    };
                    toast({
                      title: "Finance Statement Generated",
                      description: "Statement exported with portfolio summary and payment schedule"
                    });
                  }}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Export Finance Statement
                </Button>
                
                <Button 
                  className="w-full justify-start text-xs sm:text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Credit Line Request",
                      description: "Request submitted for review. Current limit: $500K, requesting: $750K"
                    });
                  }}
                >
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Request Credit Line Increase
                </Button>
                
                <Button 
                  className="w-full justify-start text-xs sm:text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Currency Conversion",
                      description: "USDC: $1.001, USDT: $0.999, ETH: $2,458.33"
                    });
                  }}
                >
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Multi-Currency Conversion
                </Button>

                <Button 
                  className="w-full justify-start text-xs sm:text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Risk Assessment Complete",
                      description: "Portfolio Risk: Low (120% collateralization, A+ rating)"
                    });
                  }}
                >
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Risk Assessment Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <span>Recent Finance Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {[
                  {
                    action: 'Payment Processed',
                    description: 'Repayment for INV-2024-001 completed',
                    amount: '$68,000 USDC',
                    date: '2 hours ago',
                    type: 'payment',
                    status: 'completed'
                  },
                  {
                    action: 'Interest Accrued',
                    description: 'Monthly interest calculation for active positions',
                    amount: '$1,240 USDC',
                    date: '1 day ago',
                    type: 'interest',
                    status: 'completed'
                  },
                  {
                    action: 'Credit Limit Used',
                    description: 'New financing approved for textile trade',
                    amount: '$85,000 USDC',
                    date: '3 days ago',
                    type: 'financing',
                    status: 'approved'
                  },
                  {
                    action: 'Collateral Updated',
                    description: 'ESC-2024-002 collateral value increased',
                    amount: '$95,000 USDC',
                    date: '5 days ago',
                    type: 'collateral',
                    status: 'updated'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'payment' ? 'bg-green-500' :
                        activity.type === 'interest' ? 'bg-blue-500' :
                        activity.type === 'financing' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`} />
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{activity.amount}</div>
                      <div className="text-xs text-muted-foreground">{activity.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Trade Finance Modal */}
      <TradeFinanceModal
        isOpen={tradeFinanceModalOpen}
        onClose={() => {
          setTradeFinanceModalOpen(false);
          setSelectedPoolForApplication(null);
        }}
        selectedNetworkId={selectedNetworkId}
        initialSelectedPool={selectedPoolForApplication}
      />

      {/* Application Details Modal */}
      {selectedApplication && (
        <Dialog open={applicationDetailsModalOpen} onOpenChange={setApplicationDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <span>Application Details - {selectedApplication.invoiceNumber}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${
                selectedApplication.status === 'approved' 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                  : selectedApplication.status === 'under_review'
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={`${getStatusColor(selectedApplication.status)} text-white text-sm px-3 py-1`}>
                      {selectedApplication.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="text-sm">
                      <span className="font-medium">Application Status</span>
                      {selectedApplication.status === 'approved' && (
                        <span className="block text-green-600 dark:text-green-400">
                          ✓ Financing approved and funds disbursed
                        </span>
                      )}
                      {selectedApplication.status === 'under_review' && (
                        <span className="block text-yellow-600 dark:text-yellow-400">
                          ⏳ Application under review by liquidity providers
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Submitted: {selectedApplication.submittedDate.toLocaleDateString()}</div>
                    {selectedApplication.approvalDate && (
                      <div>Approved: {selectedApplication.approvalDate.toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span>Financial Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        ${selectedApplication.invoiceAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600/70">Invoice Amount</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${selectedApplication.requestedAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600/70">Financed Amount</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        ${selectedApplication.collateralValue.toLocaleString()}
                      </div>
                      <div className="text-sm text-purple-600/70">Collateral Value</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedApplication.interestRate}
                      </div>
                      <div className="text-sm text-orange-600/70">Interest Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trade Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <span>Trade Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                      <div className="text-lg font-semibold">{selectedApplication.supplier}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Buyer</Label>
                      <div className="text-lg font-semibold">{selectedApplication.buyer}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
                      <div className="text-lg font-semibold">{selectedApplication.invoiceNumber}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Escrow Contract</Label>
                      <div className="text-lg font-semibold">{selectedApplication.escrowContract}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Trade Region</Label>
                      <div className="text-lg font-semibold">{selectedApplication.region}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Expected Payment</Label>
                      <div className="text-lg font-semibold">{selectedApplication.expectedPayment.toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <span>Payment Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <div className="font-medium">Application Submitted</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedApplication.submittedDate.toLocaleDateString()} - Initial application review
                        </div>
                      </div>
                    </div>
                    
                    {selectedApplication.status === 'approved' && (
                      <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium">Financing Approved</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedApplication.approvalDate?.toLocaleDateString()} - Funds disbursed to your account
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex items-center space-x-4 p-3 rounded-lg ${
                      selectedApplication.status === 'approved' 
                        ? 'bg-purple-50 dark:bg-purple-950/20' 
                        : 'bg-gray-50 dark:bg-gray-950/20'
                    }`}>
                      <Clock className={`h-5 w-5 ${
                        selectedApplication.status === 'approved' ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">Payment Due</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedApplication.expectedPayment.toLocaleDateString()} - Repayment to liquidity providers
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>Risk Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {Math.round((selectedApplication.collateralValue / selectedApplication.requestedAmount) * 100)}%
                      </div>
                      <div className="text-sm text-green-600/70">Collateralization</div>
                      <div className="text-xs text-muted-foreground mt-1">Excellent Security</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">A+</div>
                      <div className="text-sm text-blue-600/70">Credit Rating</div>
                      <div className="text-xs text-muted-foreground mt-1">Prime Borrower</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">Low</div>
                      <div className="text-sm text-purple-600/70">Risk Level</div>
                      <div className="text-xs text-muted-foreground mt-1">Secured Transaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setApplicationDetailsModalOpen(false)}>
                  Close
                </Button>
                {selectedApplication.status === 'approved' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    Download Agreement
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Settlement Confirmation Modal */}
      {selectedPayment && (
        <Dialog open={settlementModalOpen} onOpenChange={setSettlementModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-500" />
                <span>Confirm Settlement</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Settlement Amount
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice:</span>
                  <span className="text-sm font-medium">{selectedPayment.invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Due Date:</span>
                  <span className="text-sm font-medium">{selectedPayment.date.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Currency:</span>
                  <span className="text-sm font-medium">{selectedPayment.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Network:</span>
                  <span className="text-sm font-medium">{network?.name || 'Unknown'}</span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <div className="font-medium">Settlement Notice</div>
                    <div>This payment will be sent directly to liquidity providers and cannot be reversed.</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSettlementModalOpen(false)}
                  disabled={isSettling}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={executeSettlement}
                  disabled={isSettling}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSettling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Settlement
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}