import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Wallet, Users, Clock, DollarSign, FileText, Plus, Eye, Send, ArrowUpDown } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { getNetworkById } from '@/lib/networks';
import { escrowManager } from '@/lib/escrow-manager';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

interface EscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNetworkId: number;
}

// Mock escrow data - in production, fetch from blockchain/database
const mockEscrows = [
  {
    id: 1,
    title: "Import/Export Contract #001",
    description: "Textile import contract with payment milestones",
    totalAmount: "5.0",
    currency: "ETH",
    status: "active",
    exporter: "0x742d35Cc6865C3Ed10C4dFA8B6547eE0b22c48B8",
    importer: "0x8ba1f109551bD432803012645Hac136c9c64E58f",
    arbitrator: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    subWalletAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    milestones: [
      { title: "Goods Shipped", amount: "2.0", status: "completed" },
      { title: "Goods Received", amount: "2.0", status: "pending" },
      { title: "Quality Verified", amount: "1.0", status: "pending" }
    ],
    createdAt: new Date('2024-01-15'),
    deadline: new Date('2024-03-15')
  },
  {
    id: 2,
    title: "Service Agreement #002",
    description: "Software development escrow with milestone-based payments",
    totalAmount: "10.0",
    currency: "USDC",
    status: "pending",
    exporter: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
    importer: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    arbitrator: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    subWalletAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    milestones: [
      { title: "Design Phase", amount: "3.0", status: "pending" },
      { title: "Development", amount: "5.0", status: "pending" },
      { title: "Testing & Deployment", amount: "2.0", status: "pending" }
    ],
    createdAt: new Date('2024-01-20'),
    deadline: new Date('2024-04-20')
  }
];

const createEscrowSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  exporterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  arbitratorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  totalAmount: z.string().min(1, 'Amount is required'),
  currency: z.string().min(1, 'Currency is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  milestones: z.array(z.object({
    title: z.string().min(1, 'Milestone title is required'),
    amount: z.string().min(1, 'Milestone amount is required'),
    description: z.string().optional()
  })).min(1, 'At least one milestone is required')
});

type CreateEscrowForm = z.infer<typeof createEscrowSchema>;

export function EscrowModal({ isOpen, onClose, selectedNetworkId }: EscrowModalProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedEscrow, setSelectedEscrow] = useState<typeof mockEscrows[0] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [fundingAmount, setFundingAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [subWalletBalance, setSubWalletBalance] = useState<string>('0.0');
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  const network = getNetworkById(selectedNetworkId);
  
  const form = useForm<CreateEscrowForm>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      title: '',
      description: '',
      exporterAddress: '',
      arbitratorAddress: '',
      totalAmount: '',
      currency: 'ETH',
      deadline: '',
      milestones: [
        { title: '', amount: '', description: '' }
      ]
    }
  });

  const addMilestone = () => {
    const currentMilestones = form.getValues('milestones');
    form.setValue('milestones', [...currentMilestones, { title: '', amount: '', description: '' }]);
  };

  const removeMilestone = (index: number) => {
    const currentMilestones = form.getValues('milestones');
    if (currentMilestones.length > 1) {
      form.setValue('milestones', currentMilestones.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data: CreateEscrowForm) => {
    setIsCreating(true);
    try {
      // Create escrow contract on blockchain
      const result = await escrowManager.createEscrow({
        exporterAddress: data.exporterAddress,
        arbitratorAddress: data.arbitratorAddress,
        totalAmount: data.totalAmount,
        currency: data.currency,
        deadline: new Date(data.deadline),
        description: data.description,
        milestones: data.milestones.map(m => ({
          title: m.title,
          description: m.description || '',
          amount: m.amount,
          dueDate: new Date(data.deadline)
        })),
        networkId: selectedNetworkId
      });
      
      toast({
        title: "Escrow Contract Created",
        description: `Contract ID: ${result.escrowId}\nSub-wallet: ${result.subWallet.address.slice(0, 10)}...`,
      });
      
      setActiveTab('list');
      form.reset();
    } catch (error) {
      console.error('Failed to create escrow:', error);
      toast({
        title: "Failed to Create Escrow",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'disputed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleFundSubWallet = async (escrow: typeof mockEscrows[0]) => {
    setIsProcessing(true);
    try {
      const txHash = await escrowManager.fundSubWallet(
        escrow.subWalletAddress,
        fundingAmount,
        escrow.currency,
        selectedNetworkId
      );
      
      toast({
        title: "Funds Transferred",
        description: `${fundingAmount} ${escrow.currency} sent to sub-wallet\nTx: ${txHash.slice(0, 10)}...`,
      });
      
      setFundingAmount('');
      
      // Refresh sub-wallet balance after successful transfer
      await fetchSubWalletBalance(escrow.subWalletAddress, escrow.currency);
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteMilestone = async (escrowId: number, milestoneIndex: number) => {
    setIsProcessing(true);
    try {
      const txHash = await escrowManager.completeMilestone(
        escrowId,
        milestoneIndex,
        selectedNetworkId
      );
      
      toast({
        title: "Milestone Completed",
        description: `Milestone marked as completed\nTx: ${txHash.slice(0, 10)}...`,
      });
    } catch (error) {
      toast({
        title: "Failed to Complete Milestone",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseFunds = async (escrowId: number, milestoneIndex: number) => {
    setIsProcessing(true);
    try {
      const txHash = await escrowManager.releaseMilestonePayment(
        escrowId,
        milestoneIndex,
        selectedNetworkId
      );
      
      toast({
        title: "Funds Released",
        description: `Milestone payment released to exporter\nTx: ${txHash.slice(0, 10)}...`,
      });
    } catch (error) {
      toast({
        title: "Failed to Release Funds",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSubWalletBalance = async (address: string, currency: string) => {
    setLoadingBalance(true);
    try {
      const balance = await escrowManager.getSubWalletBalance(address, currency, selectedNetworkId);
      setSubWalletBalance(balance);
    } catch (error) {
      console.error('Failed to fetch sub-wallet balance:', error);
      setSubWalletBalance('0.0');
    } finally {
      setLoadingBalance(false);
    }
  };

  // Fetch sub-wallet balance when escrow is selected
  useEffect(() => {
    if (selectedEscrow && activeTab === 'details') {
      fetchSubWalletBalance(selectedEscrow.subWalletAddress, selectedEscrow.currency);
    }
  }, [selectedEscrow, activeTab, selectedNetworkId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span>Escrow Management</span>
            <Badge variant="outline">{network?.name}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="list">My Escrows</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4">
              {mockEscrows.map((escrow) => (
                <Card key={escrow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{escrow.title}</CardTitle>
                      <Badge className={getStatusColor(escrow.status)}>
                        {escrow.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Total Amount</Label>
                        <div className="font-semibold">{escrow.totalAmount} {escrow.currency}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Sub-Wallet</Label>
                        <div className="font-mono text-xs">{formatAddress(escrow.subWalletAddress)}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Milestones</Label>
                        <div>{escrow.milestones.length} steps</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Deadline</Label>
                        <div>{escrow.deadline.toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-muted-foreground">{escrow.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEscrow(escrow);
                          setActiveTab('details');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Import Contract #001" {...field} />
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
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the contract terms and conditions..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="exporterAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exporter Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="arbitratorAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arbitrator Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="0.0" type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Milestones</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  {form.watch('milestones').map((milestone, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`milestones.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Milestone Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Goods Shipped" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`milestones.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input placeholder="0.0" type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex items-end">
                            {form.watch('milestones').length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMilestone(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Milestone requirements and conditions..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Escrow Contract'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedEscrow ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedEscrow.title}
                      <Badge className={getStatusColor(selectedEscrow.status)}>
                        {selectedEscrow.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">{selectedEscrow.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <div>
                          <Label className="text-muted-foreground">Total Amount</Label>
                          <div className="font-semibold">{selectedEscrow.totalAmount} {selectedEscrow.currency}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Wallet className="h-5 w-5 text-blue-500" />
                        <div>
                          <Label className="text-muted-foreground">Sub-Wallet</Label>
                          <div className="font-mono text-sm">{formatAddress(selectedEscrow.subWalletAddress)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-purple-500" />
                        <div>
                          <Label className="text-muted-foreground">Parties</Label>
                          <div className="text-sm">3 participants</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <Label className="text-muted-foreground">Deadline</Label>
                          <div className="text-sm">{selectedEscrow.deadline.toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Contract Parties</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <Label className="text-muted-foreground">Exporter</Label>
                            <div className="font-mono text-sm">{formatAddress(selectedEscrow.exporter)}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <Label className="text-muted-foreground">Importer</Label>
                            <div className="font-mono text-sm">{formatAddress(selectedEscrow.importer)}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <Label className="text-muted-foreground">Arbitrator</Label>
                            <div className="font-mono text-sm">{formatAddress(selectedEscrow.arbitrator)}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Fund Management</Label>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Wallet className="h-5 w-5 text-blue-500" />
                              <div>
                                <Label className="text-muted-foreground">Sub-Wallet Balance</Label>
                                <div className="font-semibold">
                                  {loadingBalance ? 'Loading...' : `${subWalletBalance} ${selectedEscrow.currency}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Label className="text-muted-foreground">Contract Address</Label>
                              <div className="font-mono text-sm">{formatAddress(selectedEscrow.subWalletAddress)}</div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <Input
                              placeholder={`Amount in ${selectedEscrow.currency}`}
                              value={fundingAmount}
                              onChange={(e) => setFundingAmount(e.target.value)}
                              type="number"
                              step="0.01"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => handleFundSubWallet(selectedEscrow)}
                              disabled={isProcessing || !fundingAmount}
                              className="flex items-center space-x-2"
                            >
                              <Send className="h-4 w-4" />
                              <span>{isProcessing ? 'Sending...' : 'Fund Escrow'}</span>
                            </Button>
                          </div>
                          
                          <div className="mt-3 text-xs text-muted-foreground">
                            Transfer funds from your main wallet to this escrow's dedicated sub-wallet for secure contract execution.
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Milestones Progress</Label>
                      <div className="space-y-3">
                        {selectedEscrow.milestones.map((milestone, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{milestone.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {milestone.amount} {selectedEscrow.currency}
                                  </div>
                                </div>
                                <Badge
                                  variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                                  className={milestone.status === 'completed' ? 'bg-green-500' : ''}
                                >
                                  {milestone.status}
                                </Badge>
                              </div>
                              {milestone.status === 'pending' && (
                                <div className="mt-3 flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={isProcessing}
                                    onClick={() => handleCompleteMilestone(selectedEscrow.id, index)}
                                  >
                                    {isProcessing ? 'Processing...' : 'Mark Complete'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={isProcessing}
                                    onClick={() => handleReleaseFunds(selectedEscrow.id, index)}
                                  >
                                    {isProcessing ? 'Processing...' : 'Release Payment'}
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select an escrow from the list to view details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}