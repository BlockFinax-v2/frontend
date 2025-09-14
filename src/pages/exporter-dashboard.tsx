/**
 * Exporter Dashboard
 * 
 * Dashboard for exporters to manage international sales, contracts, and shipments.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { 
  Truck, 
  Package, 
  DollarSign, 
  FileText, 
  TrendingUp,
  MapPin,
  Clock,
  AlertCircle,
  ArrowLeft,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function ExporterDashboard() {
  const { wallet } = useWallet();

  // Fetch exporter-specific data
  const { data: exportContracts } = useQuery({
    queryKey: ['/api/escrow/contracts', wallet?.address, 'exporter']
  });

  const { data: shipments } = useQuery({
    queryKey: ['/api/exports/shipments', wallet?.address]
  });

  const { data: financeStats } = useQuery({
    queryKey: ['/api/finance/exporter-stats', wallet?.address]
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/role-selection">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Role Selection
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Exporter Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage your international exports and trade contracts
                </p>
              </div>
            </div>
            <Button size="lg" className="hidden md:flex">
              <Plus className="mr-2 h-5 w-5" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Contracts
              </CardTitle>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {Array.isArray(exportContracts) ? exportContracts.filter((c: any) => c.status === 'active').length : 0}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">+2</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                In Transit
              </CardTitle>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {Array.isArray(shipments) ? shipments.filter((s: any) => s.status === 'in_transit').length : 0}
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-600 dark:text-orange-400 font-medium">3</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">arriving this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Revenue (30d)
              </CardTitle>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                ${(financeStats as any)?.monthlyRevenue || '0'}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">+12.5%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">
                Successful deliveries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contracts">Export Contracts</TabsTrigger>
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="finance">Trade Finance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Export Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Your Export Contracts</CardTitle>
                <CardDescription>
                  Manage and monitor your international trade contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(exportContracts) && exportContracts.length > 0 ? (
                    exportContracts.map((contract: any) => (
                      <div key={contract.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{contract.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              To: {contract.importerName}
                            </p>
                          </div>
                          <Badge variant={
                            contract.status === 'active' ? 'default' :
                            contract.status === 'completed' ? 'outline' :
                            'secondary'
                          }>
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Value:</span>
                            <div className="font-medium">${contract.value}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>
                            <div className="font-medium">{contract.deliveryDate}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment:</span>
                            <div className="font-medium">{contract.paymentTerms}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No contracts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by creating your first export contract
                      </p>
                      <Button>Create Contract</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Tracking</CardTitle>
                <CardDescription>
                  Monitor your goods in transit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(shipments) && shipments.length > 0 ? (
                    shipments.map((shipment: any) => (
                      <div key={shipment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              {shipment.trackingNumber}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {shipment.origin} → {shipment.destination}
                            </p>
                          </div>
                          <Badge variant={
                            shipment.status === 'delivered' ? 'outline' :
                            shipment.status === 'in_transit' ? 'default' :
                            'secondary'
                          }>
                            {shipment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          Current location: {shipment.currentLocation}
                          <Clock className="h-4 w-4 ml-4 mr-1" />
                          ETA: {shipment.estimatedArrival}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No shipments in transit</h3>
                      <p className="text-muted-foreground">
                        Your shipments will appear here once they're dispatched
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Finance Tab */}
          <TabsContent value="finance">
            <Card>
              <CardHeader>
                <CardTitle>Trade Finance Options</CardTitle>
                <CardDescription>
                  Access financing for your export operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Pre-shipment Financing</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get funding before shipping your goods
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span className="font-medium">8.5% APR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Amount:</span>
                          <span className="font-medium">$500,000</span>
                        </div>
                      </div>
                      <Button className="w-full mt-3" variant="outline">
                        Apply Now
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Invoice Factoring</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Convert your invoices to immediate cash
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Advance:</span>
                          <span className="font-medium">Up to 85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing:</span>
                          <span className="font-medium">24 hours</span>
                        </div>
                      </div>
                      <Button className="w-full mt-3" variant="outline">
                        Get Quote
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                          Credit Assessment Available
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Complete your business profile to unlock better financing rates and higher limits.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Complete Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Export Documentation</CardTitle>
                <CardDescription>
                  Manage certificates, invoices, and compliance documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Document management coming soon</h3>
                  <p className="text-muted-foreground">
                    Upload and manage your export documentation securely
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}