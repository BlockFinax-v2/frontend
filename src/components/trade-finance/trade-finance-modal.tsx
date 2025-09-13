import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  FileText, 
  Upload, 
  DollarSign, 
  Calendar, 
  Shield, 
  Users, 
  Globe, 
  CheckCircle,
  Clock,
  AlertCircle,
  Banknote
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { getNetworkById } from '@/lib/networks';
import { useToast } from '@/hooks/use-toast';

interface TradeFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNetworkId: number;
  initialSelectedPool?: typeof mockFinancePools[0] | null;
}

// Mock data for trade finance pools and applications
const mockFinancePools = [
  {
    id: 1,
    poolName: "Global Electronics Trade Pool",
    totalLiquidity: "2,500,000",
    currency: "USDC",
    interestRate: "8.5%",
    minFinancing: "10,000",
    maxFinancing: "500,000",
    region: "Asia-Pacific",
    status: "active",
    providers: 12,
    averageApprovalTime: "24 hours",
    collateralRatio: "120%"
  },
  {
    id: 2,
    poolName: "Textile Import Finance",
    totalLiquidity: "1,800,000",
    currency: "USDC",
    interestRate: "7.2%",
    minFinancing: "5,000",
    maxFinancing: "250,000",
    region: "Europe-Africa",
    status: "active",
    providers: 8,
    averageApprovalTime: "18 hours",
    collateralRatio: "110%"
  }
];

const mockApplications = [
  {
    id: 1,
    invoiceNumber: "INV-2024-001",
    supplier: "TechCorp Ltd",
    buyer: "GlobalTech Inc",
    invoiceAmount: "85,000",
    currency: "USDC",
    requestedAmount: "75,000",
    escrowContractId: "ESC-001",
    status: "under_review",
    submittedDate: new Date('2024-02-15'),
    expectedPayment: new Date('2024-03-15'),
    interestRate: "8.5%",
    collateralValue: "90,000"
  }
];

const createFinanceApplicationSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  buyerName: z.string().min(1, 'Buyer name is required'),
  invoiceAmount: z.string().min(1, 'Invoice amount is required'),
  requestedAmount: z.string().min(1, 'Requested financing amount is required'),
  escrowContractId: z.string().min(1, 'Escrow contract ID is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  tradeDescription: z.string().min(10, 'Trade description must be at least 10 characters'),
  currency: z.string().min(1, 'Currency is required'),
  expectedPaymentDate: z.string().min(1, 'Expected payment date is required')
});

type CreateFinanceApplicationForm = z.infer<typeof createFinanceApplicationSchema>;

export function TradeFinanceModal({ isOpen, onClose, selectedNetworkId, initialSelectedPool = null }: TradeFinanceModalProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialSelectedPool ? 'apply' : 'pools');
  const [selectedPool, setSelectedPool] = useState<typeof mockFinancePools[0] | null>(initialSelectedPool);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  
  // Update selectedPool when initialSelectedPool changes
  useEffect(() => {
    setSelectedPool(initialSelectedPool);
    setActiveTab(initialSelectedPool ? 'apply' : 'pools');
  }, [initialSelectedPool]);
  
  const network = getNetworkById(selectedNetworkId);

  const form = useForm<CreateFinanceApplicationForm>({
    resolver: zodResolver(createFinanceApplicationSchema),
    defaultValues: {
      invoiceNumber: '',
      supplierName: '',
      buyerName: '',
      invoiceAmount: '',
      requestedAmount: '',
      escrowContractId: '',
      paymentTerms: '30 days',
      tradeDescription: '',
      currency: 'USDC',
      expectedPaymentDate: ''
    }
  });

  const onSubmit = async (data: CreateFinanceApplicationForm) => {
    setIsSubmitting(true);
    try {
      // In production, this would submit to trade finance smart contracts
      console.log('Submitting finance application:', data);
      
      toast({
        title: "Application Submitted",
        description: `Your trade finance application for ${data.requestedAmount} ${data.currency} has been submitted for review.`,
      });
      
      setActiveTab('applications');
      form.reset();
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedDocuments(prev => [...prev, ...fileNames]);
      toast({
        title: "Documents Uploaded",
        description: `${fileNames.length} document(s) uploaded successfully.`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'under_review': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'funded': return 'bg-green-600';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${parseFloat(amount).toLocaleString()} ${currency}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <span>Trade Finance - Invoice Financing</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pools">Finance Pools</TabsTrigger>
            <TabsTrigger value="apply">Apply for Financing</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
          </TabsList>

          {/* Finance Pools Tab */}
          <TabsContent value="pools" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">
                {selectedPool ? `Selected Pool: ${selectedPool.poolName}` : 'Available Trade Finance Pools'}
              </h3>
              <p className="text-muted-foreground">
                Access liquidity for your cross-border trade using escrow deliverables as collateral
              </p>
              {selectedPool && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPool(null)}
                  className="mt-2"
                >
                  Browse All Pools
                </Button>
              )}
            </div>

            <div className="grid gap-6">
              {(selectedPool ? [selectedPool] : mockFinancePools).map((pool) => (
                <Card key={pool.id} className="border-2 hover:border-blue-200 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <span>{pool.poolName}</span>
                      </CardTitle>
                      <Badge variant="outline" className={`${getStatusColor(pool.status)} text-white`}>
                        {pool.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Total Liquidity</Label>
                        <div className="font-semibold text-lg text-green-600">
                          {formatCurrency(pool.totalLiquidity, pool.currency)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Interest Rate</Label>
                        <div className="font-semibold text-lg text-blue-600">{pool.interestRate}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Financing Range</Label>
                        <div className="font-semibold text-sm">
                          {formatCurrency(pool.minFinancing, pool.currency)} - {formatCurrency(pool.maxFinancing, pool.currency)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Approval Time</Label>
                        <div className="font-semibold text-sm">{pool.averageApprovalTime}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{pool.providers} Liquidity Providers</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Collateral: {pool.collateralRatio}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedPool(pool);
                          setActiveTab('apply');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {selectedPool ? 'Continue Application' : 'Apply for Financing'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Apply for Financing Tab */}
          <TabsContent value="apply" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Apply for Invoice Financing</h3>
              <p className="text-muted-foreground">
                Use your escrow deliverables as collateral to get immediate financing for your invoices
              </p>
              {selectedPool && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">Selected Pool: {selectedPool.poolName}</h4>
                  <div className="flex items-center justify-center space-x-6 mt-2 text-sm text-blue-600 dark:text-blue-400">
                    <span>Rate: {selectedPool.interestRate}</span>
                    <span>Region: {selectedPool.region}</span>
                    <span>Approval: {selectedPool.averageApprovalTime}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setSelectedPool(null);
                      setActiveTab('pools');
                    }}
                  >
                    Change Pool
                  </Button>
                </div>
              )}
            </div>

            {!selectedPool ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Finance Pool</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a trade finance pool to continue with your application
                  </p>
                  <Button 
                    onClick={() => setActiveTab('pools')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Finance Pools
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Trade Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span>Trade Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input placeholder="INV-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="escrowContractId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escrow Contract ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ESC-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buyerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buyer Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Buyer company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Financial Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span>Financial Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="100000" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requestedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requested Financing Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="80000" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USDC">USDC</SelectItem>
                              <SelectItem value="USDT">USDT</SelectItem>
                              <SelectItem value="ETH">ETH</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedPaymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Payment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment terms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15 days">15 days</SelectItem>
                              <SelectItem value="30 days">30 days</SelectItem>
                              <SelectItem value="45 days">45 days</SelectItem>
                              <SelectItem value="60 days">60 days</SelectItem>
                              <SelectItem value="90 days">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Trade Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trade Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="tradeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Description of Trade</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the goods/services, delivery terms, quality specifications..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Document Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5 text-purple-500" />
                      <span>Required Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Upload Documents</Label>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleDocumentUpload}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Required Documents:</Label>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Commercial Invoice</li>
                        <li>• Purchase Order</li>
                        <li>• Escrow Contract Agreement</li>
                        <li>• Bill of Lading / Shipping Documents</li>
                        <li>• Certificate of Origin (if applicable)</li>
                        <li>• Insurance Certificate</li>
                      </ul>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Uploaded Documents:</Label>
                        <div className="space-y-1 mt-2">
                          {uploadedDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
                </form>
              </Form>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">My Finance Applications</h3>
              <p className="text-muted-foreground">Track your trade finance applications and funding status</p>
            </div>

            <div className="space-y-4">
              {mockApplications.map((app) => (
                <Card key={app.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Banknote className="h-5 w-5 text-green-500" />
                        <span>Invoice {app.invoiceNumber}</span>
                      </CardTitle>
                      <Badge variant="outline" className={`${getStatusColor(app.status)} text-white`}>
                        {app.status.replace('_', ' ')}
                      </Badge>
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
                          {formatCurrency(app.invoiceAmount, app.currency)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Requested Amount</Label>
                        <div className="font-semibold text-blue-600">
                          {formatCurrency(app.requestedAmount, app.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Escrow Contract</Label>
                        <div className="font-semibold">{app.escrowContractId}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Interest Rate</Label>
                        <div className="font-semibold text-orange-600">{app.interestRate}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Collateral Value</Label>
                        <div className="font-semibold text-purple-600">
                          {formatCurrency(app.collateralValue, app.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Expected: {app.expectedPayment.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">Submitted: {app.submittedDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}