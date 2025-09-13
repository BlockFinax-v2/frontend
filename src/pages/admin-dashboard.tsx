/**
 * Admin Dashboard Component
 * 
 * Comprehensive administrative interface for platform management.
 * Features user analytics, system monitoring, message oversight, and referral tracking.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  MessageSquare, 
  Gift, 
  Activity,
  TrendingUp,
  Shield,
  Database,
  Search,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Calendar,
  Copy
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  totalReferrals: number;
  activeUsers24h: number;
  totalPoints: number;
  averageMessagesPerUser: number;
  totalTransactionVolume: string;
  totalTransactions: number;
  platformRevenue: string;
  gasFeeRevenue: string;
  escrowFees: string;
  transactionsByType: Record<string, number>;
  avgTransactionValue: string;
}

interface UserInfo {
  walletAddress: string;
  messageCount: number;
  sentMessages: number;
  receivedMessages: number;
  joinedDate: string;
  lastActive: string;
  referralCount: number;
  totalPoints: number;
  transactionCount: number;
  totalTransactionVolume: string;
  status: 'active' | 'recent' | 'inactive' | 'dormant';
  isRegistered: boolean;
  daysSinceLastActivity: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Fetch admin statistics with reduced refresh rate
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: () => fetch('/api/admin/stats').then(res => res.json()),
    refetchInterval: 120000, // Refresh every 2 minutes to reduce database load
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Fetch user list with caching
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 300000, // Consider data fresh for 5 minutes
  });

  // Fetch system health with reduced refresh rate
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/admin/health'],
    queryFn: () => fetch('/api/admin/health').then(res => res.json()),
    refetchInterval: 60000, // Refresh every 1 minute instead of 10 seconds
    staleTime: 30000,
  });

  // Fetch recent activity with reduced refresh rate
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/activity'],
    queryFn: async () => {
      const res = await fetch('/api/admin/activity');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 180000, // Refresh every 3 minutes instead of 15 seconds
    staleTime: 120000,
  });

  const filteredUsers = Array.isArray(users) ? users.filter((user: UserInfo) =>
    user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const selectedUserData = selectedUser ? filteredUsers.find(u => u.walletAddress === selectedUser) : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'recent': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'dormant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, trend }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    trend?: number;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend && (
            <span className={`ml-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );

  if (statsLoading || usersLoading || healthLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor the blockchain communication platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}>
            {systemHealth?.status === 'healthy' ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {systemHealth?.status || 'Unknown'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="Registered wallets"
          icon={Users}
          trend={stats?.userGrowth}
        />
        <StatCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          description="Processed transactions"
          icon={TrendingUp}
          trend={stats?.transactionGrowth}
        />
        <StatCard
          title="Active Referrals"
          value={stats?.totalReferrals || 0}
          description="Successful referrals"
          icon={Gift}
          trend={stats?.referralGrowth}
        />
        <StatCard
          title="Active Users (24h)"
          value={stats?.activeUsers24h || 0}
          description="Users active today"
          icon={Activity}
          trend={stats?.activityTrend}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>



        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Search and manage platform users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by wallet address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredUsers.map((user: UserInfo) => (
                  <div key={user.walletAddress} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">
                            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                          </code>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 grid grid-cols-2 md:grid-cols-6 gap-2">
                          <span>Messages: {user.messageCount}</span>
                          <span>Sent: {user.sentMessages}</span>
                          <span>Received: {user.receivedMessages}</span>
                          <span>Transactions: {user.transactionCount}</span>
                          <span>Volume: {user.totalTransactionVolume} ETH</span>
                          <span>Referrals: {user.referralCount}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                          <span>Joined: {formatDate(user.joinedDate)}</span>
                          <span>Last Active: {formatDate(user.lastActive)}</span>
                          <span>{user.isRegistered ? 'Registered Wallet' : 'Message Participant'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user.walletAddress);
                            setIsUserModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // Copy wallet address to clipboard
                            navigator.clipboard.writeText(user.walletAddress);
                            toast({
                              title: "Address Copied",
                              description: `Wallet address copied to clipboard`,
                            });
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Address
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Daily active users and transaction metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Daily Active Users</span>
                    <span className="font-bold text-orange-600">{stats?.activeUsers24h || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Transactions</span>
                    <span className="font-bold text-blue-600">{stats?.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transaction Volume</span>
                    <span className="font-bold text-green-600">{stats?.totalTransactionVolume || '0.0000'} ETH</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Analytics</CardTitle>
                <CardDescription>Referral program performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Referrals</span>
                    <span className="font-bold">{stats?.totalReferrals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Conversion Rate</span>
                    <span className="font-bold">
                      {stats?.referralConversionRate ? `${stats.referralConversionRate}%` : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Points Awarded</span>
                    <span className="font-bold">
                      {stats?.totalReferralPoints?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Monitor Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Status</CardTitle>
                <CardDescription>Database performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Connection Status</span>
                    <Badge variant={systemHealth?.database?.connected ? 'default' : 'destructive'}>
                      {systemHealth?.database?.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Query Performance</span>
                    <span className="font-bold">
                      {systemHealth?.database?.avgQueryTime || 0}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Connections</span>
                    <span className="font-bold">
                      {systemHealth?.database?.activeConnections || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WebSocket Status</CardTitle>
                <CardDescription>Real-time communication metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Connections</span>
                    <span className="font-bold">
                      {systemHealth?.websocket?.activeConnections || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Messages/Hour</span>
                    <span className="font-bold">
                      {systemHealth?.websocket?.messagesPerHour || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Uptime</span>
                    <span className="font-bold">
                      {systemHealth?.websocket?.uptime || '0h'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Platform Activity</CardTitle>
              <CardDescription>Latest user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 border-b pb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {activity.userAddress && (
                          <span className="font-mono">
                            {activity.userAddress.slice(0, 6)}...{activity.userAddress.slice(-4)}
                          </span>
                        )}
                        {activity.userAddress && ' • '}
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-center text-gray-500">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Profile Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
          </DialogHeader>
          
          {selectedUserData && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-mono">
                      {selectedUserData.walletAddress}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(selectedUserData.status)}>
                        {selectedUserData.status}
                      </Badge>
                      <Badge variant={selectedUserData.isRegistered ? "default" : "secondary"}>
                        {selectedUserData.isRegistered ? "Registered Wallet" : "Message Participant"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUserData.walletAddress);
                      toast({
                        title: "Address Copied",
                        description: "Wallet address copied to clipboard",
                      });
                    }}
                  >
                    Copy Address
                  </Button>
                </div>
              </div>

              {/* Analytics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedUserData.messageCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedUserData.sentMessages} sent, {selectedUserData.receivedMessages} received
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Transaction Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedUserData.totalTransactionVolume}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedUserData.transactionCount} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedUserData.referralCount}</div>
                    <p className="text-xs text-muted-foreground">Users referred</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedUserData.totalPoints}</div>
                    <p className="text-xs text-muted-foreground">Total earned</p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Activity Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Activity</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUserData.joinedDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Activity</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUserData.lastActive)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Days Since Last Activity</label>
                    <p className="text-sm text-muted-foreground">{selectedUserData.daysSinceLastActivity} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Activity Level</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUserData.messageCount > 10 ? "High" : 
                       selectedUserData.messageCount > 3 ? "Medium" : "Low"} activity user
                    </p>
                  </div>
                </div>
              </div>

              {/* Web3 Analytics */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Web3 Analytics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium">Wallet Type</div>
                    <div className="text-lg font-semibold">
                      {selectedUserData.isRegistered ? "Full Member" : "Guest User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedUserData.isRegistered ? "Registered with platform" : "Participating via messages only"}
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium">Engagement Score</div>
                    <div className="text-lg font-semibold">
                      {Math.min(100, (selectedUserData.messageCount * 10) + (selectedUserData.referralCount * 20))}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on messages and referrals
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium">Platform Contribution</div>
                    <div className="text-lg font-semibold">
                      {selectedUserData.referralCount > 0 ? "High" : 
                       selectedUserData.messageCount > 5 ? "Medium" : "Low"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Community building impact
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}