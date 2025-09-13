/**
 * BlockFinaX Escrow Platform Admin Dashboard
 * 
 * Comprehensive monitoring dashboard for self-custody escrow platform.
 * Read-only analytics and observability without custodial control.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  Download,
  Filter,
  Search,
  Globe,
  Wallet,
  BarChart3,
  PieChart,
  Calendar,
  Hash
} from "lucide-react";

interface EscrowStats {
  totalUsers: number;
  usersByRole: {
    exporters: number;
    importers: number;
    financiers: number;
  };
  totalEscrows: number;
  totalValueLocked: string;
  activeEscrows: number;
  completedEscrows: number;
  networkStatus: string;
  activeWallets: number;
}

interface UserActivity {
  walletAddress: string;
  role: string;
  lastActivity: string;
  kycStatus: string;
  escrowsCreated: number;
  escrowsParticipated: number;
  referralSource?: string;
}

interface EscrowData {
  id: string;
  contractAddress: string;
  escrowId: string;
  exporter: string;
  importer: string;
  financier?: string;
  amount: string;
  tokenSymbol: string;
  status: string;
  createdDate: string;
  expiryDate?: string;
  networkId: number;
}

interface TransactionFeed {
  txHash: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  timestamp: string;
  eventData: any;
  networkId: number;
}

interface TokenStats {
  symbol: string;
  totalValue: string;
  escrowCount: number;
  percentage: number;
}

interface SmartContract {
  contractAddress: string;
  deployer: string;
  abiVersion: string;
  deploymentTx: string;
  activeInstances: number;
  isActive: boolean;
  auditLink?: string;
  createdAt: string;
}

interface ReferralActivity {
  id: string;
  referrerAddress: string;
  referredAddress: string;
  referralCode: string;
  referralSource: string;
  accountCreatedAt: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardAmount?: string;
  rewardToken?: string;
  firstEscrowCreated?: boolean;
  totalEscrowValue?: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrers: number;
  conversionRate: number;
  topReferralSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  recentSignups: number;
  totalRewardsDistributed: string;
}

interface FinancePool {
  id: string;
  name: string;
  type: 'trade_finance' | 'working_capital' | 'supply_chain' | 'invoice_factoring';
  totalFunding: string;
  availableLiquidity: string;
  utilizationRate: number;
  usersServed: number;
  activeLoans: number;
  averageAPR: number;
  maturityPeriod: string;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  lastActivity: string;
}

interface FinanceLoan {
  id: string;
  poolId: string;
  borrowerAddress: string;
  amount: string;
  currency: string;
  apr: number;
  term: string;
  purpose: string;
  collateralType: string;
  status: 'pending' | 'approved' | 'funded' | 'repaying' | 'completed' | 'defaulted';
  fundedAt?: string;
  dueDate?: string;
  repaidAmount?: string;
}

interface FinanceStats {
  totalPools: number;
  totalFundingDeployed: string;
  totalUsersServed: number;
  averageUtilization: number;
  totalActiveLoans: number;
  totalRepaid: string;
  defaultRate: number;
  averageAPR: number;
}

export default function EscrowDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch escrow platform statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/escrow/stats'],
    queryFn: () => fetch('/api/escrow/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch user activity data
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/escrow/users'],
    queryFn: () => fetch('/api/escrow/users').then(res => res.json()),
  });

  // Fetch escrow analytics
  const { data: escrows, isLoading: escrowsLoading } = useQuery({
    queryKey: ['/api/escrow/escrows', statusFilter],
    queryFn: () => fetch(`/api/escrow/escrows?status=${statusFilter}`).then(res => res.json()),
  });

  // Fetch transaction feed
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/escrow/transactions'],
    queryFn: () => fetch('/api/escrow/transactions').then(res => res.json()),
    refetchInterval: 10000,
  });

  // Fetch token monitoring data
  const { data: tokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/escrow/tokens'],
    queryFn: () => fetch('/api/escrow/tokens').then(res => res.json()),
  });

  // Fetch smart contract registry
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/escrow/contracts'],
    queryFn: () => fetch('/api/escrow/contracts').then(res => res.json()),
  });

  // Fetch referral activity data
  const { data: referralStats, isLoading: referralStatsLoading } = useQuery({
    queryKey: ['/api/escrow/referrals/stats'],
    queryFn: () => fetch('/api/escrow/referrals/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch referral activity list
  const { data: referralActivity, isLoading: referralActivityLoading } = useQuery({
    queryKey: ['/api/escrow/referrals/activity'],
    queryFn: () => fetch('/api/escrow/referrals/activity').then(res => res.json()),
    refetchInterval: 15000,
  });

  // Fetch finance pools data
  const { data: financeStats, isLoading: financeStatsLoading } = useQuery({
    queryKey: ['/api/finance/stats'],
    queryFn: () => fetch('/api/finance/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch finance pools list
  const { data: financePools, isLoading: financePoolsLoading } = useQuery({
    queryKey: ['/api/finance/pools'],
    queryFn: () => fetch('/api/finance/pools').then(res => res.json()),
    refetchInterval: 20000,
  });

  // Fetch active loans
  const { data: financeLoans, isLoading: financeLoansLoading } = useQuery({
    queryKey: ['/api/finance/loans'],
    queryFn: () => fetch('/api/finance/loans').then(res => res.json()),
    refetchInterval: 25000,
  });

  const filteredUsers = Array.isArray(users) ? users.filter((user: UserActivity) => {
    const matchesSearch = user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) : [];

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'funded': return 'bg-green-100 text-green-800';
      case 'completed': case 'released': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEtherscanUrl = (txHash: string, networkId: number) => {
    const baseUrl = networkId === 11155111 ? 'https://sepolia.etherscan.io' : 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  const getRiskRatingColor = (rating: string) => {
    switch (rating) {
      case 'AAA': case 'AA': return 'bg-green-100 text-green-800';
      case 'A': case 'BBB': return 'bg-blue-100 text-blue-800';
      case 'BB': case 'B': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getPoolTypeLabel = (type: string) => {
    switch (type) {
      case 'trade_finance': return 'Trade Finance';
      case 'working_capital': return 'Working Capital';
      case 'supply_chain': return 'Supply Chain';
      case 'invoice_factoring': return 'Invoice Factoring';
      default: type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BlockFinaX Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Self-Custody Escrow Platform Monitoring & Analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default">
            <Globe className="h-3 w-3 mr-1" />
            {stats?.networkStatus || 'Sepolia Testnet'}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="escrows">Escrows</TabsTrigger>
          <TabsTrigger value="transactions">Feed</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="finance">Finance Pools</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Exporters: {stats?.usersByRole?.exporters || 0}</div>
                  <div>Importers: {stats?.usersByRole?.importers || 0}</div>
                  <div>Financiers: {stats?.usersByRole?.financiers || 0}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEscrows || 0}</div>
                <div className="text-xs text-muted-foreground">
                  <div>Active: {stats?.activeEscrows || 0}</div>
                  <div>Completed: {stats?.completedEscrows || 0}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalValueLocked || "0")}</div>
                <p className="text-xs text-muted-foreground">
                  Across all active escrows
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeWallets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Connected to platform
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Escrow Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {escrows && Object.entries(
                    Array.isArray(escrows) ? 
                    escrows.reduce((acc: any, escrow: EscrowData) => {
                      acc[escrow.status] = (acc[escrow.status] || 0) + 1;
                      return acc;
                    }, {}) : {}
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </div>
                      <span className="font-semibold">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Tokens by Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(tokens) && tokens.slice(0, 5).map((token: TokenStats) => (
                    <div key={token.symbol} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{token.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(token.totalValue)}</div>
                        <div className="text-xs text-muted-foreground">{token.escrowCount} escrows</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Activity Monitor */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="exporter">Exporters</SelectItem>
                <SelectItem value="importer">Importers</SelectItem>
                <SelectItem value="financier">Financiers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registered Users ({filteredUsers.length})</CardTitle>
              <CardDescription>User activity and participation overview</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Escrows</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserActivity) => (
                    <TableRow key={user.walletAddress}>
                      <TableCell className="font-mono">
                        {formatAddress(user.walletAddress)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          user.kycStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Created: {user.escrowsCreated}
                          <br />
                          Participated: {user.escrowsParticipated}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUser(user.walletAddress)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escrow Analytics */}
        <TabsContent value="escrows" className="space-y-6">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Escrows
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Escrow Analytics</CardTitle>
              <CardDescription>Detailed escrow tracking and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escrow ID</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(escrows) && escrows.map((escrow: EscrowData) => (
                    <TableRow key={escrow.id}>
                      <TableCell className="font-mono text-sm">
                        {escrow.escrowId}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>E: {formatAddress(escrow.exporter)}</div>
                          <div>I: {formatAddress(escrow.importer)}</div>
                          {escrow.financier && (
                            <div>F: {formatAddress(escrow.financier)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(escrow.amount).toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{escrow.tokenSymbol}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(escrow.status)}>
                          {escrow.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(escrow.createdDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedEscrow(escrow.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://sepolia.etherscan.io/address/${escrow.contractAddress}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Feed */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Real-time Transaction Feed</span>
              </CardTitle>
              <CardDescription>Live blockchain events and contract interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(transactions) && transactions.map((tx: TransactionFeed) => (
                  <div key={tx.txHash} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{tx.eventName}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Block #{tx.blockNumber}
                        </span>
                      </div>
                      <div className="font-mono text-sm">
                        Contract: {formatAddress(tx.contractAddress)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(getEtherscanUrl(tx.txHash, tx.networkId), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Monitoring */}
        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Distribution & Usage</CardTitle>
              <CardDescription>Monitor token usage across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Escrow Count</TableHead>
                    <TableHead>Platform %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(tokens) && tokens.map((token: TokenStats) => (
                    <TableRow key={token.symbol}>
                      <TableCell className="font-semibold">{token.symbol}</TableCell>
                      <TableCell>{formatCurrency(token.totalValue)}</TableCell>
                      <TableCell>{token.escrowCount}</TableCell>
                      <TableCell>{token.percentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Finance Pools */}
        <TabsContent value="finance" className="space-y-6">
          {/* Finance Overview Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Financiers</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financeStats?.totalPools || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Financiers providing capital
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financeStats?.totalFundingDeployed || "0")}</div>
                <p className="text-xs text-muted-foreground">
                  Deployed across all pools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users Served</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financeStats?.totalUsersServed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Borrowers and lenders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financeStats?.averageUtilization || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Pool utilization rate
                </p>
              </CardContent>
            </Card>
          </div>



          {/* Finance Pools Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Financier Pools</CardTitle>
              <CardDescription>Monitor financier activity and pool performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Financier</TableHead>
                    <TableHead>Total Funding</TableHead>
                    <TableHead>Users Served</TableHead>
                    <TableHead>Active Loans</TableHead>
                    <TableHead>APR</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(financePools) && financePools.map((pool: FinancePool) => (
                    <TableRow key={pool.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pool.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {getPoolTypeLabel(pool.type)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{formatCurrency(pool.totalFunding)}</div>
                      </TableCell>
                      <TableCell>{pool.usersServed}</TableCell>
                      <TableCell>{pool.activeLoans}</TableCell>
                      <TableCell>{pool.averageAPR}%</TableCell>
                      <TableCell>
                        <Badge className={
                          pool.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {pool.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Active Loans Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Trade Finance Loans</CardTitle>
              <CardDescription>Monitor active borrowing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Financier Pool</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(financeLoans) && financeLoans.map((loan: FinanceLoan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono">
                        {formatAddress(loan.borrowerAddress)}
                      </TableCell>
                      <TableCell>
                        {financePools?.find((p: FinancePool) => p.id === loan.poolId)?.name || 'Unknown Pool'}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {parseFloat(loan.amount).toLocaleString()} {loan.currency}
                        </div>
                      </TableCell>
                      <TableCell>{loan.term}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Contract Registry */}
        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Contract Registry</CardTitle>
              <CardDescription>Deployed escrow contracts and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract Address</TableHead>
                    <TableHead>Deployer</TableHead>
                    <TableHead>ABI Version</TableHead>
                    <TableHead>Active Instances</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(contracts) && contracts.map((contract: SmartContract) => (
                    <TableRow key={contract.contractAddress}>
                      <TableCell className="font-mono">
                        {formatAddress(contract.contractAddress)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAddress(contract.deployer)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.abiVersion}</Badge>
                      </TableCell>
                      <TableCell>{contract.activeInstances}</TableCell>
                      <TableCell>
                        <Badge className={contract.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {contract.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://sepolia.etherscan.io/address/${contract.contractAddress}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {contract.auditLink && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(contract.auditLink, '_blank')}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Monitoring */}
        <TabsContent value="referrals" className="space-y-6">
          {/* Referral Statistics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All-time referral sign-ups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.activeReferrers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Users actively referring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Referrals to active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Sign-ups</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats?.recentSignups || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Sources Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Referral Sources</CardTitle>
                <CardDescription>Where new users are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(referralStats?.topReferralSources) && 
                    referralStats.topReferralSources.map((source: any) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {source.source}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{source.count}</div>
                        <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Rewards</CardTitle>
                <CardDescription>Total rewards distributed to referrers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(referralStats?.totalRewardsDistributed || "0")}
                    </div>
                    <p className="text-sm text-muted-foreground">Total rewards paid</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pending rewards</span>
                      <span className="font-semibold">$2,450.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average per referrer</span>
                      <span className="font-semibold">$125.50</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Real-time Referral Activity</span>
              </CardTitle>
              <CardDescription>Live tracking of new account creation and referral events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(referralActivity) && referralActivity.map((activity: ReferralActivity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">New Account</Badge>
                        <Badge className={
                          activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                          activity.status === 'rewarded' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {activity.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          via {activity.referralSource}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-mono text-sm">
                          <span className="text-muted-foreground">Referrer:</span> {formatAddress(activity.referrerAddress)}
                        </div>
                        <div className="font-mono text-sm">
                          <span className="text-muted-foreground">New User:</span> {formatAddress(activity.referredAddress)}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Code:</span> {activity.referralCode}
                        </div>
                        {activity.firstEscrowCreated && activity.totalEscrowValue && (
                          <div className="text-sm text-green-600 font-medium">
                            ✓ First escrow created: {activity.totalEscrowValue}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.accountCreatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {activity.rewardAmount ? (
                        <div className="font-semibold text-green-600">
                          +{activity.rewardAmount} {activity.rewardToken}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No reward
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {(!referralActivity || referralActivity.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent referral activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Referral Tracking Table */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Tracking Details</CardTitle>
              <CardDescription>Comprehensive view of all referral relationships and account creation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>New User</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Account Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(referralActivity) && referralActivity.map((activity: ReferralActivity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono text-sm">
                        {activity.referralCode}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAddress(activity.referrerAddress)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAddress(activity.referredAddress)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {activity.referralSource}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(activity.accountCreatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                          activity.status === 'rewarded' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.rewardAmount ? (
                          <span className="font-semibold text-green-600">
                            {activity.rewardAmount} {activity.rewardToken}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC & Verification */}
        <TabsContent value="kyc" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">KYC Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Approved</span>
                    <Badge className="bg-green-100 text-green-800">
                      {filteredUsers.filter(u => u.kycStatus === 'approved').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {filteredUsers.filter(u => u.kycStatus === 'pending').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed</span>
                    <Badge className="bg-red-100 text-red-800">
                      {filteredUsers.filter(u => u.kycStatus === 'failed').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {filteredUsers.length > 0 ? 
                    Math.round((filteredUsers.filter(u => u.kycStatus === 'approved').length / filteredUsers.length) * 100) : 0
                  }%
                </div>
                <p className="text-sm text-muted-foreground">Users with approved KYC</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {filteredUsers.filter(u => u.kycStatus === 'pending').length}
                </div>
                <p className="text-sm text-muted-foreground">Pending review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>KYC Status by User</CardTitle>
              <CardDescription>View-only KYC verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserActivity) => (
                    <TableRow key={user.walletAddress}>
                      <TableCell className="font-mono">
                        {formatAddress(user.walletAddress)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          user.kycStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}