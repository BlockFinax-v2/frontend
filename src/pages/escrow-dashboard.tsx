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
import { 
  Shield, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp,
  FileText,
  Clock,
  ExternalLink,
  Eye,
  Download,
  Search,
  Globe,
  Wallet,
  BarChart3
} from "lucide-react";

export default function EscrowDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // Suppressing unused variable warnings for future features
  console.log(selectedEscrow, selectedUser);
  
  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/escrow/stats'],
    queryFn: () => fetch('/api/escrow/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch user activity data
  const { data: users } = useQuery({
    queryKey: ['/api/escrow/users'],
    queryFn: () => fetch('/api/escrow/users').then(res => res.json()),
  });

  // Fetch escrow analytics
  const { data: escrows } = useQuery({
    queryKey: ['/api/escrow/escrows', statusFilter],
    queryFn: () => fetch(`/api/escrow/escrows?status=${statusFilter}`).then(res => res.json()),
  });

  // Fetch transaction feed
  const { data: transactions } = useQuery({
    queryKey: ['/api/escrow/transactions'],
    queryFn: () => fetch('/api/escrow/transactions').then(res => res.json()),
    refetchInterval: 10000,
  });

  // Fetch token monitoring data
  const { data: tokens } = useQuery({
    queryKey: ['/api/escrow/tokens'],
    queryFn: () => fetch('/api/escrow/tokens').then(res => res.json()),
  });

  // Fetch smart contract registry
  const { data: contracts } = useQuery({
    queryKey: ['/api/escrow/contracts'],
    queryFn: () => fetch('/api/escrow/contracts').then(res => res.json()),
  });

  // Fetch referral activity data
  const { data: referralStats } = useQuery({
    queryKey: ['/api/escrow/referrals/stats'],
    queryFn: () => fetch('/api/escrow/referrals/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch referral activity list
  const { data: referralActivity } = useQuery({
    queryKey: ['/api/escrow/referrals/activity'],
    queryFn: () => fetch('/api/escrow/referrals/activity').then(res => res.json()),
    refetchInterval: 15000,
  });

  // Fetch finance pools data
  const { data: financeStats } = useQuery({
    queryKey: ['/api/finance/stats'],
    queryFn: () => fetch('/api/finance/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch finance pools list
  const { data: financePools } = useQuery({
    queryKey: ['/api/finance/pools'],
    queryFn: () => fetch('/api/finance/pools').then(res => res.json()),
    refetchInterval: 20000,
  });

  // Fetch active loans
  const { data: financeLoans } = useQuery({
    queryKey: ['/api/finance/loans'],
    queryFn: () => fetch('/api/finance/loans').then(res => res.json()),
    refetchInterval: 25000,
  });

  const filteredUsers = Array.isArray(users) ? users.filter((user: any) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      BlockFinaX Admin Dashboard
                    </h1>
                    <p className="text-slate-400 text-lg">
                      Self-Custody Escrow Platform Monitoring & Analytics
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Globe className="h-3 w-3 mr-1" />
                    {stats?.networkStatus || 'Sepolia Testnet'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-9 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Overview</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Users</TabsTrigger>
          <TabsTrigger value="escrows" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Escrows</TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Feed</TabsTrigger>
          <TabsTrigger value="tokens" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Tokens</TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Contracts</TabsTrigger>
          <TabsTrigger value="finance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Finance</TabsTrigger>
          <TabsTrigger value="referrals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">Referrals</TabsTrigger>
          <TabsTrigger value="kyc" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-300">KYC</TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-2">{stats?.totalUsers || 0}</div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Exporters:</span>
                      <span className="text-emerald-400">{stats?.usersByRole?.exporters || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Importers:</span>
                      <span className="text-cyan-400">{stats?.usersByRole?.importers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Financiers:</span>
                      <span className="text-blue-400">{stats?.usersByRole?.financiers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Total Escrows</CardTitle>
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Shield className="h-4 w-4 text-cyan-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-2">{stats?.totalEscrows || 0}</div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="text-green-400">{stats?.activeEscrows || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="text-blue-400">{stats?.completedEscrows || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Total Value Locked</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-2">{formatCurrency(stats?.totalValueLocked || "0")}</div>
                  <p className="text-xs text-slate-400">
                    Across all active escrows
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Active Wallets</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Wallet className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-2">{stats?.activeWallets || 0}</div>
                  <p className="text-xs text-slate-400">
                    Connected to platform
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl blur-xl"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                    <span>Escrow Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {escrows && Object.entries(
                      Array.isArray(escrows) ? 
                      escrows.reduce((acc: any, escrow: any) => {
                        acc[escrow.status] = (acc[escrow.status] || 0) + 1;
                        return acc;
                      }, {}) : {}
                    ).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getStatusColor(status)} border-0`}>
                            {status}
                          </Badge>
                          <div className="w-24 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(count as number / (stats?.totalEscrows || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-200 text-lg">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-xl"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-200 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    <span>Top Tokens by Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(tokens) && tokens.slice(0, 5).map((token: any, index: number) => (
                      <div key={token.symbol} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{token.symbol}</div>
                            <div className="text-xs text-slate-400">{token.escrowCount} escrows</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-200">{formatCurrency(token.totalValue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* User Activity Monitor */}
        <TabsContent value="users" className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-xl blur-xl"></div>
            <div className="relative bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search by wallet address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-400 focus:border-emerald-500/50 h-12 rounded-lg"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 text-slate-200 h-12 rounded-lg">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Roles</SelectItem>
                    <SelectItem value="exporter" className="text-slate-200 hover:bg-slate-700">Exporters</SelectItem>
                    <SelectItem value="importer" className="text-slate-200 hover:bg-slate-700">Importers</SelectItem>
                    <SelectItem value="financier" className="text-slate-200 hover:bg-slate-700">Financiers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-xl"></div>
            <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center space-x-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <span>Registered Users ({filteredUsers.length})</span>
                </CardTitle>
                <CardDescription className="text-slate-400">User activity and participation overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Wallet Address</TableHead>
                        <TableHead className="text-slate-300">Role</TableHead>
                        <TableHead className="text-slate-300">Last Activity</TableHead>
                        <TableHead className="text-slate-300">KYC Status</TableHead>
                        <TableHead className="text-slate-300">Escrows</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: any) => (
                        <TableRow key={user.walletAddress} className="border-slate-700/50 hover:bg-slate-800/30 transition-colors duration-200">
                          <TableCell className="font-mono text-slate-300">
                            {formatAddress(user.walletAddress)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-800/50">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(user.lastActivity).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              user.kycStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              user.kycStatus === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }>
                              {user.kycStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="text-emerald-400">{user.escrowsCreated}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Participated:</span>
                                <span className="text-cyan-400">{user.escrowsParticipated}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                              onClick={() => setSelectedUser(user.walletAddress)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Escrow Analytics */}
        <TabsContent value="escrows" className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl blur-xl"></div>
            <div className="relative bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 text-slate-200 h-12 rounded-lg">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Status</SelectItem>
                    <SelectItem value="active" className="text-slate-200 hover:bg-slate-700">Active</SelectItem>
                    <SelectItem value="completed" className="text-slate-200 hover:bg-slate-700">Completed</SelectItem>
                    <SelectItem value="expired" className="text-slate-200 hover:bg-slate-700">Expired</SelectItem>
                    <SelectItem value="disputed" className="text-slate-200 hover:bg-slate-700">Disputed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-300 h-12 px-6 rounded-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Export Escrows
                </Button>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-emerald-500/10 rounded-xl blur-xl"></div>
            <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <span>Escrow Analytics</span>
                </CardTitle>
                <CardDescription className="text-slate-400">Detailed escrow tracking and monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Escrow ID</TableHead>
                        <TableHead className="text-slate-300">Participants</TableHead>
                        <TableHead className="text-slate-300">Value</TableHead>
                        <TableHead className="text-slate-300">Token</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Created</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(escrows) && escrows.map((escrow: any) => (
                        <TableRow key={escrow.id} className="border-slate-700/50 hover:bg-slate-800/30 transition-colors duration-200">
                          <TableCell className="font-mono text-sm text-slate-300">
                            {escrow.escrowId}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm text-slate-400">
                              <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span>E: {formatAddress(escrow.exporter)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                                <span>I: {formatAddress(escrow.importer)}</span>
                              </div>
                              {escrow.financier && (
                                <div className="flex items-center space-x-2">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  <span>F: {formatAddress(escrow.financier)}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-200">
                            {parseFloat(escrow.amount).toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-800/50">
                              {escrow.tokenSymbol}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(escrow.status)} border-0`}>
                              {escrow.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(escrow.createdDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                                onClick={() => setSelectedEscrow(escrow.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
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
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transaction Feed */}
        <TabsContent value="transactions" className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl blur-xl"></div>
            <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-orange-400" />
                  <span>Real-time Transaction Feed</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-2"></div>
                </CardTitle>
                <CardDescription className="text-slate-400">Live blockchain events and contract interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(transactions) && transactions.map((tx: any) => (
                    <div key={tx.txHash} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                      <div className="relative flex items-center justify-between p-6 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:border-orange-500/30 transition-all duration-300">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/10">
                              {tx.eventName}
                            </Badge>
                            <span className="text-sm text-slate-400 font-mono">
                              Block #{tx.blockNumber}
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-emerald-400">Live</span>
                            </div>
                          </div>
                          <div className="font-mono text-sm text-slate-300">
                            Contract: {formatAddress(tx.contractAddress)}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(tx.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 border border-slate-600/50 hover:border-orange-500/50"
                            onClick={() => window.open(getEtherscanUrl(tx.txHash, tx.networkId), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Token Monitoring */}
        <TabsContent value="tokens" className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl blur-xl"></div>
            <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-yellow-400" />
                  <span>Token Distribution & Usage</span>
                </CardTitle>
                <CardDescription className="text-slate-400">Monitor token usage across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Token</TableHead>
                        <TableHead className="text-slate-300">Total Value</TableHead>
                        <TableHead className="text-slate-300">Escrow Count</TableHead>
                        <TableHead className="text-slate-300">Platform %</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(tokens) && tokens.map((token: any, index: number) => (
                        <TableRow key={token.symbol} className="border-slate-700/50 hover:bg-slate-800/30 transition-colors duration-200">
                          <TableCell className="font-semibold text-slate-200 flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {token.symbol.charAt(0)}
                            </div>
                            <span>{token.symbol}</span>
                          </TableCell>
                          <TableCell className="text-slate-200 font-semibold">
                            {formatCurrency(token.totalValue)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="flex items-center space-x-2">
                              <span>{token.escrowCount}</span>
                              <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full transition-all duration-1000"
                                  style={{ width: `${(token.escrowCount / (tokens[0]?.escrowCount || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <span className="text-yellow-400 font-semibold">{token.percentage.toFixed(1)}%</span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border-0">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  {Array.isArray(financePools) && financePools.map((pool: any) => (
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
                  {Array.isArray(financeLoans) && financeLoans.map((loan: any) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono">
                        {formatAddress(loan.borrowerAddress)}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(financePools) ? financePools.find((p: any) => p.id === loan.poolId)?.name : 'Unknown Pool'}
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
                  {Array.isArray(contracts) && contracts.map((contract: any) => (
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
                {Array.isArray(referralActivity) && referralActivity.map((activity: any) => (
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
                  {Array.isArray(referralActivity) && referralActivity.map((activity: any) => (
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
        <TabsContent value="kyc" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-green-500/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200 flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    <span>KYC Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-slate-300">Approved</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border-0">
                        {filteredUsers.filter(u => u.kycStatus === 'approved').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-slate-300">Pending</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border-0">
                        {filteredUsers.filter(u => u.kycStatus === 'pending').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-slate-300">Failed</span>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border-0">
                        {filteredUsers.filter(u => u.kycStatus === 'failed').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <span>Verification Rate</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">
                    {filteredUsers.length > 0 ? 
                      Math.round((filteredUsers.filter(u => u.kycStatus === 'approved').length / filteredUsers.length) * 100) : 0
                    }%
                  </div>
                  <p className="text-sm text-slate-400">Users with approved KYC</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${filteredUsers.length > 0 ? (filteredUsers.filter(u => u.kycStatus === 'approved').length / filteredUsers.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200 flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span>Recent Reviews</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-2">
                    {filteredUsers.filter(u => u.kycStatus === 'pending').length}
                  </div>
                  <p className="text-sm text-slate-400">Pending review</p>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-yellow-400">Awaiting verification</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-xl blur-xl"></div>
            <Card className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200">KYC Status by User</CardTitle>
                <CardDescription className="text-slate-400">View-only KYC verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Wallet Address</TableHead>
                        <TableHead className="text-slate-300">Role</TableHead>
                        <TableHead className="text-slate-300">KYC Status</TableHead>
                        <TableHead className="text-slate-300">Submitted</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: any) => (
                        <TableRow key={user.walletAddress} className="border-slate-700/50 hover:bg-slate-800/30 transition-colors duration-200">
                          <TableCell className="font-mono text-slate-300">
                            {formatAddress(user.walletAddress)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-800/50">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              user.kycStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              user.kycStatus === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }>
                              {user.kycStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(user.lastActivity).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="hover:bg-slate-700/50 text-slate-400 hover:text-slate-200">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}