/**
 * Arbitrator Dashboard
 * 
 * Dashboard for arbitrators to review disputes and make binding decisions.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { 
  Scale, 
  FileText, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";

export default function ArbitratorDashboard() {
  const { wallet } = useWallet();

  // Fetch arbitrator-specific data
  const { data: disputes } = useQuery({
    queryKey: ['/api/arbitration/disputes', wallet?.address]
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/arbitration/stats', wallet?.address]
  });

  const { data: earnings } = useQuery({
    queryKey: ['/api/arbitration/earnings', wallet?.address]
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Scale className="mr-3 h-8 w-8 text-primary" />
            Arbitrator Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Resolve trade disputes and maintain platform integrity
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes?.filter((d: any) => d.status === 'pending')?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting your review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cases Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalResolved || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                This month: {stats?.monthlyResolved || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings (30d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${earnings?.monthly || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                +15.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">96.8%</div>
              <p className="text-xs text-muted-foreground">
                Decisions upheld
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Cases</TabsTrigger>
            <TabsTrigger value="resolved">Resolved Cases</TabsTrigger>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* Pending Cases Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Cases Awaiting Review</CardTitle>
                <CardDescription>
                  Review evidence and make binding arbitration decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disputes?.filter((d: any) => d.status === 'pending')?.length ? (
                    disputes.filter((d: any) => d.status === 'pending').map((dispute: any) => (
                      <div key={dispute.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Case #{dispute.caseNumber}</h4>
                            <p className="text-sm text-muted-foreground">
                              {dispute.disputeType} • Filed {dispute.filedDate}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              ${dispute.amount} in escrow
                            </Badge>
                            <Badge variant={
                              dispute.priority === 'high' ? 'destructive' : 'outline'
                            }>
                              {dispute.priority} priority
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Claimant:</span>
                            <div className="font-medium">{dispute.claimant}</div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Respondent:</span>
                            <div className="font-medium">{dispute.respondent}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-sm text-muted-foreground">Dispute Summary:</span>
                          <p className="text-sm mt-1">{dispute.summary}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            Deadline: {dispute.deadline}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Review Evidence
                            </Button>
                            <Button size="sm">
                              Make Decision
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No pending cases</h3>
                      <p className="text-muted-foreground">
                        You'll be notified when new disputes require arbitration
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resolved Cases Tab */}
          <TabsContent value="resolved">
            <Card>
              <CardHeader>
                <CardTitle>Case History</CardTitle>
                <CardDescription>
                  Review your past arbitration decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disputes?.filter((d: any) => d.status === 'resolved')?.length ? (
                    disputes.filter((d: any) => d.status === 'resolved').map((dispute: any) => (
                      <div key={dispute.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Case #{dispute.caseNumber}</h4>
                            <p className="text-sm text-muted-foreground">
                              Resolved {dispute.resolvedDate}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              ${dispute.amount}
                            </Badge>
                            <Badge variant={
                              dispute.outcome === 'claimant' ? 'default' : 'secondary'
                            }>
                              Ruled for {dispute.outcome}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">Decision:</span>
                          <p className="mt-1">{dispute.decision}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm text-muted-foreground">
                            Fee earned: ${dispute.arbitrationFee}
                          </div>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No resolved cases yet</h3>
                      <p className="text-muted-foreground">
                        Your arbitration history will appear here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reputation Tab */}
          <TabsContent value="reputation">
            <Card>
              <CardHeader>
                <CardTitle>Arbitrator Reputation</CardTitle>
                <CardDescription>
                  Your performance metrics and community feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Cases Resolved:</span>
                          <span className="font-medium">{stats?.totalResolved || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average Resolution Time:</span>
                          <span className="font-medium">{stats?.avgResolutionTime || '0'} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Success Rate:</span>
                          <span className="font-medium">96.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Community Rating:</span>
                          <span className="font-medium">4.9/5.0</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Contract Disputes</Badge>
                        <Badge variant="outline">Quality Issues</Badge>
                        <Badge variant="outline">Delivery Delays</Badge>
                        <Badge variant="outline">Payment Disputes</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Recent Feedback</h4>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-1">"Fair and thorough review"</p>
                          <div className="flex items-center">
                            <span className="text-yellow-500">★★★★★</span>
                            <span className="ml-2 text-xs text-muted-foreground">2 days ago</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-1">"Quick resolution, well explained"</p>
                          <div className="flex items-center">
                            <span className="text-yellow-500">★★★★★</span>
                            <span className="ml-2 text-xs text-muted-foreground">1 week ago</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-1">"Professional handling of complex case"</p>
                          <div className="flex items-center">
                            <span className="text-yellow-500">★★★★☆</span>
                            <span className="ml-2 text-xs text-muted-foreground">2 weeks ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Arbitration Earnings</CardTitle>
                <CardDescription>
                  Track your arbitration fees and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Earning Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">This Month:</span>
                          <span className="font-medium">${earnings?.monthly || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Total Earned:</span>
                          <span className="font-medium">${earnings?.total || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average per Case:</span>
                          <span className="font-medium">${earnings?.averagePerCase || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pending Payments:</span>
                          <span className="font-medium">${earnings?.pending || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Payment Schedule</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Arbitration fees are automatically paid upon case resolution.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Standard Cases:</span>
                          <span>$50 - $200</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Complex Cases:</span>
                          <span>$200 - $500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>High-Value Cases:</span>
                          <span>0.5% of dispute amount</span>
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