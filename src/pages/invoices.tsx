/**
 * Invoices Page
 * 
 * Main interface for invoice management, creation, and payment tracking.
 * Integrates with wallet authentication and provides complete invoice lifecycle management.
 */

import { useWallet } from "@/hooks/use-wallet";
import { InvoiceManager } from "@/components/invoices/invoice-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, Clock, TrendingUp, ArrowLeft, Receipt, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Link } from "wouter";

export default function Invoices() {
  const { wallet } = useWallet();

  // Get invoice statistics
  const { data: sentStats = { total: 0, paid: 0, overdue: 0, totalAmount: 0 } } = useQuery({
    queryKey: ['/api/invoices/sender', wallet?.address, 'stats'],
    select: (data: any[]) => {
      const total = data.length;
      const paid = data.filter((inv: any) => inv.status === 'paid').length;
      const overdue = data.filter((inv: any) => inv.status === 'overdue').length;
      const totalAmount = data.reduce((sum: number, inv: any) => 
        sum + parseFloat(inv.totalAmount || '0'), 0
      );
      return { total, paid, overdue, totalAmount };
    },
    enabled: !!wallet?.address,
  });

  const { data: receivedStats = { total: 0, unpaid: 0, totalOwed: 0 } } = useQuery({
    queryKey: ['/api/invoices/recipient', wallet?.address, 'stats'],
    select: (data: any[]) => {
      const total = data.length;
      const unpaid = data.filter((inv: any) => inv.status !== 'paid').length;
      const totalOwed = data
        .filter((inv: any) => inv.status !== 'paid')
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || '0'), 0);
      return { total, unpaid, totalOwed };
    },
    enabled: !!wallet?.address,
  });

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4 shadow-xl border-0">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto p-2 bg-primary/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  Wallet Required
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Please unlock your wallet to access invoices.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/unlock-wallet">Unlock Wallet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Back Button */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/wallet">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wallet
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
            <Receipt className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
            Smart Invoices
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Create, send, and manage invoices with automated crypto payments
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Sent
              </CardTitle>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {sentStats.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {sentStats.paid} paid, {sentStats.overdue} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentStats.totalAmount.toFixed(2)} USDC</div>
              <p className="text-xs text-muted-foreground">
                Total invoiced amount
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receivedStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {receivedStats.unpaid} pending payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Owed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receivedStats.totalOwed.toFixed(2)} USDC</div>
              <p className="text-xs text-muted-foreground">
                Outstanding payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Invoice Manager */}
        <InvoiceManager walletAddress={wallet.address} />

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Smart Payment Features
              </CardTitle>
              <CardDescription>
                Advanced payment capabilities with blockchain integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">NEW</Badge>
                <div>
                  <p className="font-medium">Automated USDC Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Accept payments in USDC stablecoin with automatic confirmation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">PRO</Badge>
                <div>
                  <p className="font-medium">Multi-Network Support</p>
                  <p className="text-sm text-muted-foreground">
                    Process payments across Base, Ethereum, and other networks
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">AI</Badge>
                <div>
                  <p className="font-medium">Smart Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Automated payment reminders with customizable schedules
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Invoice Templates
              </CardTitle>
              <CardDescription>
                Save time with reusable invoice templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">SOON</Badge>
                <div>
                  <p className="font-medium">Custom Templates</p>
                  <p className="text-sm text-muted-foreground">
                    Create reusable invoice templates for common services
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">SOON</Badge>
                <div>
                  <p className="font-medium">Recurring Invoices</p>
                  <p className="text-sm text-muted-foreground">
                    Set up automatic recurring invoices for subscriptions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">SOON</Badge>
                <div>
                  <p className="font-medium">Bulk Operations</p>
                  <p className="text-sm text-muted-foreground">
                    Send multiple invoices or reminders with one click
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}