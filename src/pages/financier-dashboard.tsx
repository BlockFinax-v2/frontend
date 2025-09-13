/**
 * Financier Dashboard
 * 
 * Dashboard for financiers to manage funding pools and investment opportunities.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { 
  Banknote, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Target,
  Clock,
  AlertCircle
} from "lucide-react";

export default function FinancierDashboard() {
  const { wallet } = useWallet();

  // Fetch financier-specific data
  const { data: fundingPools } = useQuery({
    queryKey: ['/api/finance/pools', wallet?.address]
  });

  const { data: investments } = useQuery({
    queryKey: ['/api/finance/investments', wallet?.address]
  });

  const { data: opportunities } = useQuery({
    queryKey: ['/api/finance/opportunities', wallet?.address]
  });

  const { data: performance } = useQuery({
    queryKey: ['/api/finance/performance', wallet?.address]
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Banknote className="mr-3 h-8 w-8 text-primary" />
            Financier Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your trade finance investments and funding pools
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deployed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${performance?.totalDeployed || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {fundingPools?.length || 0} pools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance?.monthlyReturn || '0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {investments?.filter((i: any) => i.status === 'active')?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                $2.1M total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.8%</div>
              <p className="text-xs text-muted-foreground">
                Below industry average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pools" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pools">Funding Pools</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="investments">My Investments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Funding Pools Tab */}
          <TabsContent value="pools">
            <Card>
              <CardHeader>
                <CardTitle>Your Funding Pools</CardTitle>
                <CardDescription>
                  Manage and monitor your trade finance pools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fundingPools?.length ? (
                    fundingPools.map((pool: any) => (
                      <div key={pool.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{pool.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {pool.description}
                            </p>
                          </div>
                          <Badge variant={
                            pool.status === 'active' ? 'default' :
                            pool.status === 'full' ? 'secondary' :
                            'outline'
                          }>
                            {pool.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Pool Size:</span>
                            <div className="font-medium">${pool.totalSize}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Deployed:</span>
                            <div className="font-medium">${pool.deployed}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target APR:</span>
                            <div className="font-medium">{pool.targetApr}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Term:</span>
                            <div className="font-medium">{pool.term} days</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="w-full bg-muted rounded-full h-2 mr-4">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(pool.deployed / pool.totalSize) * 100}%` }}
                            />
                          </div>
                          <Button size="sm" variant="outline">
                            Manage Pool
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No funding pools yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first funding pool to start earning returns
                      </p>
                      <Button>Create Pool</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Investment Opportunities</CardTitle>
                <CardDescription>
                  Browse verified trade finance opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities?.length ? (
                    opportunities.map((opportunity: any) => (
                      <div key={opportunity.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{opportunity.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {opportunity.sector} • {opportunity.geography}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {opportunity.expectedReturn}% APR
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Expected return
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <div className="font-medium">${opportunity.amount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Term:</span>
                            <div className="font-medium">{opportunity.term} days</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Risk Level:</span>
                            <div className="font-medium">
                              <Badge variant={
                                opportunity.riskLevel === 'low' ? 'default' :
                                opportunity.riskLevel === 'medium' ? 'secondary' :
                                'destructive'
                              }>
                                {opportunity.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            Closes: {opportunity.closingDate}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm">
                              Invest Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No opportunities available</h3>
                      <p className="text-muted-foreground">
                        New investment opportunities will appear here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Investments Tab */}
          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle>Active Investments</CardTitle>
                <CardDescription>
                  Monitor your current trade finance investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investments?.length ? (
                    investments.map((investment: any) => (
                      <div key={investment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{investment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Invested {investment.investmentDate}
                            </p>
                          </div>
                          <Badge variant={
                            investment.status === 'active' ? 'default' :
                            investment.status === 'completed' ? 'outline' :
                            'secondary'
                          }>
                            {investment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Invested:</span>
                            <div className="font-medium">${investment.amount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Returns:</span>
                            <div className="font-medium text-green-600">
                              +${investment.returns}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">APR:</span>
                            <div className="font-medium">{investment.apr}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Maturity:</span>
                            <div className="font-medium">{investment.maturityDate}</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Progress: {investment.progress}% complete
                          </div>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No active investments</h3>
                      <p className="text-muted-foreground mb-4">
                        Start investing in trade finance opportunities
                      </p>
                      <Button>Explore Opportunities</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track your investment performance and portfolio insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Portfolio Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Capital:</span>
                          <span className="font-medium">${performance?.totalCapital || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Deployed Capital:</span>
                          <span className="font-medium">${performance?.deployedCapital || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Available:</span>
                          <span className="font-medium">${performance?.availableCapital || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Returns:</span>
                          <span className="font-medium text-green-600">
                            +${performance?.totalReturns || '0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Risk Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Low Risk:</span>
                          <span>45%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Medium Risk:</span>
                          <span>35%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>High Risk:</span>
                          <span>20%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Monthly Performance</h4>
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Performance charts coming soon</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                            Portfolio Recommendation
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Consider diversifying into emerging markets to optimize your risk-return profile.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}