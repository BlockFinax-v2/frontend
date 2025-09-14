/**
 * Importer Dashboard
 * 
 * Dashboard for importers to manage sourcing, contracts, and incoming shipments.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { 
  Building2, 
  Package, 
  DollarSign, 
  FileText, 
  Search,
  Shield,
  Clock,
  Star,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function ImporterDashboard() {
  const { wallet } = useWallet();

  // Fetch importer-specific data
  const { data: importContracts } = useQuery({
    queryKey: ['/api/escrow/contracts', wallet?.address, 'importer']
  });

  const { data: suppliers } = useQuery({
    queryKey: ['/api/imports/suppliers', wallet?.address]
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/imports/orders', wallet?.address]
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
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
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Importer Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Source products globally with secure payment guarantees
                </p>
              </div>
            </div>
            <Button size="lg" className="hidden md:flex">
              <Search className="mr-2 h-5 w-5" />
              Find Suppliers
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(orders) ? orders.filter((o: any) => o.status === 'active').length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +5 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Suppliers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(suppliers) ? suppliers.filter((s: any) => s.verified).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                98% KYC completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spend (30d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Array.isArray(orders) ? orders.reduce((sum: number, o: any) => sum + (o.value || 0), 0) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                +8.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-time Delivery</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                Above industry average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="suppliers">Find Suppliers</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="quality">Quality Control</TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <CardTitle>Verified Suppliers</CardTitle>
                <CardDescription>
                  Browse and connect with verified global suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(suppliers) && suppliers.length > 0 ? (
                    suppliers.map((supplier: any, index: number) => (
                      <div key={supplier.id || `supplier-${index}`} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold flex items-center">
                              {supplier.name}
                              {supplier.verified && (
                                <Shield className="h-4 w-4 ml-2 text-green-600" />
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {supplier.location} • {supplier.specialty}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{supplier.rating}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Experience:</span>
                            <div className="font-medium">{supplier.experience} years</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <div className="font-medium">{supplier.capacity}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lead Time:</span>
                            <div className="font-medium">{supplier.leadTime} days</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm">Contact Supplier</Button>
                          <Button size="sm" variant="outline">View Profile</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Find your ideal suppliers</h3>
                      <p className="text-muted-foreground mb-4">
                        Search our network of verified global suppliers
                      </p>
                      <Button>Browse Suppliers</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>
                  Track your import orders and shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(orders) && orders.length > 0 ? (
                    orders.map((order: any, index: number) => (
                      <div key={order.id || `order-${index}`} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Order #{order.number}</h4>
                            <p className="text-sm text-muted-foreground">
                              From: {order.supplierName}
                            </p>
                          </div>
                          <Badge variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'shipped' ? 'default' :
                            order.status === 'processing' ? 'secondary' :
                            'outline'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Value:</span>
                            <div className="font-medium">${order.value}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expected:</span>
                            <div className="font-medium">{order.expectedDate}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment:</span>
                            <div className="font-medium">{order.paymentStatus}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start sourcing products from verified suppliers
                      </p>
                      <Button>Place First Order</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Import Contracts</CardTitle>
                <CardDescription>
                  Manage your purchase agreements and terms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(importContracts) && importContracts.length > 0 ? (
                    importContracts.map((contract: any, index: number) => (
                      <div key={contract.id || `contract-${index}`} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{contract.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Supplier: {contract.supplierName}
                            </p>
                          </div>
                          <Badge variant={
                            contract.status === 'active' ? 'default' :
                            contract.status === 'completed' ? 'default' :
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
                            <span className="text-muted-foreground">Quantity:</span>
                            <div className="font-medium">{contract.quantity}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>
                            <div className="font-medium">{contract.deliveryTerms}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No contracts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Your import contracts will appear here
                      </p>
                      <Button>Create Contract</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Control Tab */}
          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle>Quality Assurance</CardTitle>
                <CardDescription>
                  Monitor product quality and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Quality monitoring coming soon</h3>
                  <p className="text-muted-foreground">
                    Track quality reports and compliance certificates
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