/**
 * Referrals Page Component
 * 
 * Comprehensive referral system management interface providing:
 * - Referral code generation and sharing
 * - Points tracking and rewards display
 * - Referral history and analytics
 * - Point transaction history
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { Copy, Users, Gift, Trophy, Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Referrals() {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [newCodeDescription, setNewCodeDescription] = useState("");

  // Fetch user points
  const { data: userPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ['/api/points', wallet?.address],
    queryFn: () => fetch(`/api/points/${wallet?.address}`).then(res => res.json()),
    enabled: !!wallet?.address,
  });

  // Fetch referral codes
  const { data: referralCodes, isLoading: codesLoading } = useQuery({
    queryKey: ['/api/referrals/codes', wallet?.address],
    queryFn: () => fetch(`/api/referrals/codes/${wallet?.address}`).then(res => res.json()),
    enabled: !!wallet?.address,
  });

  // Fetch referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['/api/referrals', wallet?.address],
    queryFn: () => fetch(`/api/referrals/${wallet?.address}`).then(res => res.json()),
    enabled: !!wallet?.address,
  });

  // Fetch point transactions
  const { data: pointTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/points/transactions', wallet?.address],
    queryFn: () => fetch(`/api/points/transactions/${wallet?.address}`).then(res => res.json()),
    enabled: !!wallet?.address,
  });

  // Create referral code mutation
  const createCodeMutation = useMutation({
    mutationFn: async () => {
      const code = `BFX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const response = await fetch('/api/referrals/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerWalletAddress: wallet?.address,
          code,
          description: newCodeDescription || 'Invite your partners',
          maxUses: 100,
          currentUses: 0,
          isActive: true
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/codes', wallet?.address] });
      setNewCodeDescription("");
      toast({
        title: "Referral Code Created",
        description: "Your new referral code has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create referral code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
  };

  const generateReferralLink = (code: string) => {
    return `https://app.blockfinax.com/?ref=${code}`;
  };

  if (!wallet) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the referral system.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Back Button */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/wallet')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wallet
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Referral System
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
            Invite partners and earn 50 points for each successful referral
          </p>
        </div>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pointsLoading ? "..." : (userPoints as any)?.totalPoints || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pointsLoading ? "..." : (userPoints as any)?.referralPoints || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              From invitations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralsLoading ? "..." : (referrals as any)?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              People invited
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="codes" className="text-xs sm:text-sm">My Codes</TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs sm:text-sm">Referrals</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">Points</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Referral Code</CardTitle>
              <CardDescription>
                Generate a unique code to share with partners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Input
                  placeholder="Optional description (e.g., 'For business partners')"
                  value={newCodeDescription}
                  onChange={(e) => setNewCodeDescription(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => createCodeMutation.mutate()}
                  disabled={createCodeMutation.isPending}
                  className="shrink-0"
                >
                  {createCodeMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Code
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {codesLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div>Loading referral codes...</div>
                </CardContent>
              </Card>
            ) : (referralCodes as any)?.length > 0 ? (
              (referralCodes as any).map((code: any) => (
                <Card key={code.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <code className="text-base sm:text-lg font-mono font-bold bg-muted px-2 py-1 rounded break-all">
                            {code.code}
                          </code>
                          <Badge variant={code.isActive ? "default" : "secondary"} className="w-fit">
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {code.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Used {code.currentUses} / {code.maxUses} times
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          className="w-full sm:w-auto"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateReferralLink(code.code))}
                          className="w-full sm:w-auto"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-muted-foreground">
                    No referral codes yet. Create your first one above!
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                People who have used your referral codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div>Loading referrals...</div>
              ) : (referrals as any)?.length > 0 ? (
                <div className="space-y-4">
                  {(referrals as any).map((referral: any) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {referral.referredWalletAddress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Used code: {referral.referralCode}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={referral.status === 'completed' ? "default" : "secondary"}>
                          {referral.status}
                        </Badge>
                        <div className="text-sm font-medium">
                          +{referral.pointsEarned || 50} points
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No referrals yet. Share your codes with partners to start earning!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Point Transaction History</CardTitle>
              <CardDescription>
                All your point earnings and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div>Loading transactions...</div>
              ) : (pointTransactions as any)?.length > 0 ? (
                <div className="space-y-4">
                  {(pointTransactions as any).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Type: {transaction.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        +{transaction.points}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No transactions yet. Start referring partners to earn points!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}