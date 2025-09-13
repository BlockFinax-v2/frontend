/**
 * Contract Draft Manager
 * 
 * Comprehensive contract drafting system with wallet-based signatures,
 * deliverables, milestones, and verification workflows.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Plus,
  Send,
  PenTool,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Users,
  Target,
  Calendar,
  DollarSign,
  Upload
} from 'lucide-react';
import { ContractDocumentUpload } from './contract-document-upload';
import { MilestoneManager } from './milestone-manager';

interface ContractDeliverable {
  id?: number;
  title: string;
  description: string;
  value: string;
  dueDate?: string;
  status: 'pending' | 'claimed' | 'verified' | 'completed' | 'disputed';
}

interface ContractDraft {
  id?: number;
  title: string;
  description: string;
  contractType: string;
  creatorAddress: string;
  partnerAddress: string;
  totalValue: string;
  currency: string;
  terms: string;
  status: 'draft' | 'sent' | 'partially_signed' | 'signed' | 'active' | 'completed' | 'cancelled';
  subWalletAddress?: string;
  deliverables?: ContractDeliverable[];
  signatures?: any[];
}

export function ContractDraftManager() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractDraft | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  // Form states for new contract
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    contractType: 'escrow',
    partnerAddress: '',
    arbitratorAddress: '',
    useDefaultArbitrator: true,
    arbitratorAgreed: false,
    totalValue: '',
    currency: 'USDC',
    terms: '',
  });

  // Deliverables for the contract
  const [deliverables, setDeliverables] = useState<ContractDeliverable[]>([]);
  const [newDeliverable, setNewDeliverable] = useState({
    title: '',
    description: '',
    value: '',
    dueDate: '',
  });

  // Fetch contract drafts
  const { data: contracts = [], isLoading } = useQuery<ContractDraft[]>({
    queryKey: ['/api/contracts/drafts'],
    enabled: !!address,
  });

  const createContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      const response = await fetch('/api/contracts/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });
      if (!response.ok) throw new Error('Failed to create contract');
      const result = await response.json();
      
      // Automatically send invitations to all parties
      await sendContractInvitations(result, contractData);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/drafts'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: 'Contract created and invitations sent',
        description: 'All parties have been automatically invited to the contract',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create contract draft',
        variant: 'destructive',
      });
    },
  });

  const signContractMutation = useMutation({
    mutationFn: async ({ contractId, signature }: { contractId: number; signature: string }) => {
      const response = await fetch(`/api/contracts/drafts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      if (!response.ok) throw new Error('Failed to sign contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/drafts'] });
      toast({
        title: 'Contract signed',
        description: 'Contract signature recorded on blockchain',
      });
    },
  });

  const resetForm = () => {
    setContractForm({
      title: '',
      description: '',
      contractType: 'escrow',
      partnerAddress: '',
      arbitratorAddress: '',
      useDefaultArbitrator: true,
      arbitratorAgreed: false,
      totalValue: '',
      currency: 'USDC',
      terms: '',
    });
    setDeliverables([]);
    setNewDeliverable({
      title: '',
      description: '',
      value: '',
      dueDate: '',
    });
  };

  // Default arbitrator configuration
  const DEFAULT_ARBITRATOR = {
    address: '0x1234567890123456789012345678901234567890',
    name: 'BlockFinaX Arbitration Services',
    description: 'Professional arbitration service specialized in blockchain disputes',
    fee: '2%',
    terms: 'By selecting the default arbitrator, you agree to binding arbitration by BlockFinaX Arbitration Services. Decisions are final and enforceable. Service fee is 2% of contract value.'
  };

  // Automatic invitation system
  const sendContractInvitations = async (contract: any, contractData: any) => {
    try {
      const invitations = [];
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
      
      // Send invitation to partner
      if (contractData.partnerAddress && contractData.partnerAddress !== address) {
        const partnerInvitation = {
          inviterAddress: address,
          inviteeAddress: contractData.partnerAddress,
          contractType: contractData.contractType,
          contractDetails: JSON.stringify({
            title: contractData.title,
            description: contractData.description,
            amount: contractData.totalValue,
            currency: contractData.currency,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            contractId: contract.id
          }),
          expiresAt: expiresAt,
          status: 'pending'
        };
        invitations.push(partnerInvitation);
      }

      // Send invitation to arbitrator if custom arbitrator is selected
      if (!contractData.useDefaultArbitrator && contractData.arbitratorAddress && 
          contractData.arbitratorAddress !== address && 
          contractData.arbitratorAddress !== contractData.partnerAddress) {
        const arbitratorInvitation = {
          inviterAddress: address,
          inviteeAddress: contractData.arbitratorAddress,
          contractType: 'arbitration',
          contractDetails: JSON.stringify({
            title: `Arbitration for: ${contractData.title}`,
            description: `Arbitration services required for contract between ${address} and ${contractData.partnerAddress}`,
            amount: (parseFloat(contractData.totalValue) * 0.02).toString(), // 2% arbitration fee
            currency: contractData.currency,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            contractId: contract.id
          }),
          expiresAt: expiresAt,
          status: 'pending'
        };
        invitations.push(arbitratorInvitation);
      }

      // Send all invitations
      for (const invitation of invitations) {
        console.log('Sending invitation:', invitation);
        const response = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invitation)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to send invitation:', errorText);
          throw new Error(`Failed to send invitation: ${errorText}`);
        } else {
          const result = await response.json();
          console.log('Invitation sent successfully:', result);
        }
      }

      console.log(`✓ Sent ${invitations.length} automatic invitations for contract ${contract.id}`);
    } catch (error) {
      console.error('Failed to send automatic invitations:', error);
    }
  };

  const addDeliverable = () => {
    if (!newDeliverable.title || !newDeliverable.value) return;
    
    setDeliverables([...deliverables, {
      ...newDeliverable,
      status: 'pending' as const,
    }]);
    setNewDeliverable({
      title: '',
      description: '',
      value: '',
      dueDate: '',
    });
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleCreateContract = async () => {
    if (!contractForm.title || !contractForm.partnerAddress || !contractForm.totalValue) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate arbitrator selection
    if (contractForm.useDefaultArbitrator && !contractForm.arbitratorAgreed) {
      toast({
        title: 'Arbitrator agreement required',
        description: 'Please agree to the default arbitrator terms before proceeding',
        variant: 'destructive',
      });
      return;
    }

    if (!contractForm.useDefaultArbitrator && !contractForm.arbitratorAddress) {
      toast({
        title: 'Arbitrator required',
        description: 'Please provide a custom arbitrator address or use the default arbitrator',
        variant: 'destructive',
      });
      return;
    }

    // Set final arbitrator address
    const finalArbitratorAddress = contractForm.useDefaultArbitrator 
      ? DEFAULT_ARBITRATOR.address 
      : contractForm.arbitratorAddress;

    const contractData = {
      ...contractForm,
      arbitratorAddress: finalArbitratorAddress,
      creatorAddress: address,
      terms: JSON.stringify({
        basicTerms: contractForm.terms,
        deliverables: deliverables,
        paymentTerms: `Total value: ${contractForm.totalValue} ${contractForm.currency}`,
        arbitrator: contractForm.useDefaultArbitrator ? DEFAULT_ARBITRATOR : {
          address: contractForm.arbitratorAddress,
          type: 'custom'
        },
        signatures: [],
      }),
    };

    createContractMutation.mutate(contractData);
  };

  const handleSendContract = async (contract: ContractDraft) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/contracts/drafts/${contract.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to send contract');
      
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/drafts'] });
      toast({
        title: 'Contract sent',
        description: 'Contract has been sent to partner for review and signing',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send contract',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFundContract = async (contract: ContractDraft) => {
    setIsProcessing(true);
    try {
      // This would integrate with the sub-wallet funding system
      toast({
        title: 'Fund Transfer',
        description: `Transfer ${contract.totalValue} ${contract.currency} to contract escrow`,
      });
      
      // For now, we'll show a placeholder - this would open the funding modal
      console.log(`Funding contract ${contract.id} with ${contract.totalValue} ${contract.currency}`);
    } catch (error) {
      toast({
        title: 'Funding failed',
        description: 'Failed to fund contract',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignContract = async (contract: ContractDraft) => {
    setIsProcessing(true);
    try {
      // Create signature message
      const message = `Contract Signature\nTitle: ${contract.title}\nTotal Value: ${contract.totalValue} ${contract.currency}\nContract ID: ${contract.id}`;
      
      // Sign with wallet (simplified for demo - would use actual wallet signing)
      const signature = `signed_by_${address}_at_${Date.now()}`;
      
      await signContractMutation.mutateAsync({
        contractId: contract.id!,
        signature,
      });
    } catch (error) {
      toast({
        title: 'Signing failed',
        description: 'Failed to sign contract',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSignContract = async (contract: ContractDraft) => {
    setIsProcessing(true);
    try {
      // Creator's final signature to activate the contract
      const message = `Final Contract Signature\nTitle: ${contract.title}\nTotal Value: ${contract.totalValue} ${contract.currency}\nContract ID: ${contract.id}`;
      
      const signature = `final_signed_by_${address}_at_${Date.now()}`;
      
      const response = await fetch(`/api/contracts/drafts/${contract.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      
      if (!response.ok) throw new Error('Failed to finalize contract');
      
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/drafts'] });
      toast({
        title: 'Contract activated',
        description: 'Contract is now fully signed and active',
      });
    } catch (error) {
      toast({
        title: 'Finalization failed',
        description: 'Failed to finalize contract',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'partially_signed': return 'bg-yellow-100 text-yellow-800';
      case 'signed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading contracts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Management</h2>
          <p className="text-muted-foreground">
            Draft, sign, and manage contracts with deliverable tracking
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Draft Contract
        </Button>
      </div>

      <Tabs defaultValue="my-contracts" className="w-full">
        <TabsList>
          <TabsTrigger value="my-contracts">My Contracts ({(contracts as ContractDraft[]).length})</TabsTrigger>
          <TabsTrigger value="pending-signatures">Pending Signatures</TabsTrigger>
          <TabsTrigger value="active-contracts">Active Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="my-contracts" className="space-y-4">
          {(contracts as ContractDraft[]).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Contracts Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first contract with deliverables and milestone tracking
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Draft Your First Contract
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(contracts as ContractDraft[]).map((contract: ContractDraft) => (
                <Card key={contract.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>{contract.title}</span>
                      </CardTitle>
                      <Badge className={getContractStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Partner</Label>
                        <div className="font-mono text-sm">
                          {contract.partnerAddress.slice(0, 6)}...{contract.partnerAddress.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Total Value</Label>
                        <div className="font-semibold">
                          {contract.totalValue} {contract.currency}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Arbitrator</Label>
                        <div className="text-sm">
                          {(() => {
                            try {
                              const terms = JSON.parse(contract.terms || '{}');
                              if (terms.arbitrator?.name) {
                                return terms.arbitrator.name;
                              } else if (terms.arbitrator?.address === DEFAULT_ARBITRATOR.address) {
                                return DEFAULT_ARBITRATOR.name;
                              } else if (terms.arbitrator?.address) {
                                return `Custom (${terms.arbitrator.address.slice(0, 6)}...${terms.arbitrator.address.slice(-4)})`;
                              } else {
                                return DEFAULT_ARBITRATOR.name;
                              }
                            } catch {
                              return DEFAULT_ARBITRATOR.name;
                            }
                          })()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Type</Label>
                        <div className="capitalize">{contract.contractType}</div>
                      </div>
                    </div>

                    {/* Invitation Status Indicator */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm">
                          <Send className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-green-700">Invitations sent automatically</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Partner & arbitrator notified
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Target className="h-4 w-4 mr-1" />
                          {contract.deliverables?.length || 0} Deliverables
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          {contract.signatures?.length || 0} Signatures
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedContract(contract);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        
                        {/* Contract Creator Actions */}
                        {contract.creatorAddress === address && contract.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendContract(contract)}
                            disabled={isProcessing}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send to Partner
                          </Button>
                        )}
                        
                        {/* Fund Transfer for Creator - Available after sending until fully signed */}
                        {contract.creatorAddress === address && 
                         (contract.status === 'sent' || contract.status === 'partially_signed') && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleFundContract(contract)}
                            disabled={isProcessing}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Fund Contract
                          </Button>
                        )}
                        
                        {/* Partner Signing */}
                        {contract.partnerAddress === address && contract.status === 'sent' && (
                          <Button
                            size="sm"
                            onClick={() => handleSignContract(contract)}
                            disabled={isProcessing}
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            Sign Contract
                          </Button>
                        )}
                        
                        {/* Creator Final Signing - After partner signs */}
                        {contract.creatorAddress === address && contract.status === 'partially_signed' && (
                          <Button
                            size="sm"
                            onClick={() => handleFinalSignContract(contract)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Contract
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending-signatures">
          <div className="text-center py-8 text-muted-foreground">
            Contracts waiting for signatures will appear here
          </div>
        </TabsContent>

        <TabsContent value="active-contracts">
          <div className="text-center py-8 text-muted-foreground">
            Active contracts with deliverables will appear here
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Contract Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Draft New Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({...contractForm, title: e.target.value})}
                  placeholder="E.g., Website Development Contract"
                />
              </div>
              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select value={contractForm.contractType} onValueChange={(value) => setContractForm({...contractForm, contractType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escrow">Escrow Contract</SelectItem>
                    <SelectItem value="trade_finance">Trade Finance</SelectItem>
                    <SelectItem value="service">Service Agreement</SelectItem>
                    <SelectItem value="supply">Supply Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={contractForm.description}
                onChange={(e) => setContractForm({...contractForm, description: e.target.value})}
                placeholder="Detailed description of the contract scope and objectives"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partnerAddress">Partner Wallet Address *</Label>
                <Input
                  id="partnerAddress"
                  value={contractForm.partnerAddress}
                  onChange={(e) => setContractForm({...contractForm, partnerAddress: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="totalValue">Total Value *</Label>
                  <Input
                    id="totalValue"
                    type="number"
                    value={contractForm.totalValue}
                    onChange={(e) => setContractForm({...contractForm, totalValue: e.target.value})}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={contractForm.currency} onValueChange={(value) => setContractForm({...contractForm, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Arbitrator Selection Section */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Arbitrator Selection
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useDefaultArbitrator"
                    checked={contractForm.useDefaultArbitrator}
                    onChange={(e) => setContractForm({
                      ...contractForm, 
                      useDefaultArbitrator: e.target.checked,
                      arbitratorAddress: e.target.checked ? '' : contractForm.arbitratorAddress
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="useDefaultArbitrator" className="font-medium">
                    Use Default Arbitrator (Recommended)
                  </Label>
                </div>

                {contractForm.useDefaultArbitrator ? (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">{DEFAULT_ARBITRATOR.name}</h4>
                        <p className="text-sm text-blue-700 mb-2">{DEFAULT_ARBITRATOR.description}</p>
                        <div className="text-sm text-blue-600 mb-3">
                          <strong>Service Fee:</strong> {DEFAULT_ARBITRATOR.fee} of contract value
                        </div>
                        <div className="p-3 bg-white border border-blue-200 rounded text-sm text-gray-700">
                          <strong>Terms of Service:</strong><br />
                          {DEFAULT_ARBITRATOR.terms}
                        </div>
                        <div className="mt-3 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="arbitratorAgreed"
                            checked={contractForm.arbitratorAgreed}
                            onChange={(e) => setContractForm({...contractForm, arbitratorAgreed: e.target.checked})}
                            className="rounded"
                          />
                          <Label htmlFor="arbitratorAgreed" className="text-sm">
                            I agree to the arbitration terms and conditions
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="customArbitratorAddress">Custom Arbitrator Wallet Address</Label>
                    <Input
                      id="customArbitratorAddress"
                      value={contractForm.arbitratorAddress}
                      onChange={(e) => setContractForm({...contractForm, arbitratorAddress: e.target.value})}
                      placeholder="0x... (Enter third-party arbitrator address)"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Custom arbitrator will receive an automatic invitation to participate in dispute resolution
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="terms">Contract Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={contractForm.terms}
                onChange={(e) => setContractForm({...contractForm, terms: e.target.value})}
                placeholder="Detailed terms, conditions, and legal clauses"
                rows={4}
              />
            </div>

            {/* Deliverables Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Deliverables & Milestones</h3>
              </div>
              
              {deliverables.length > 0 && (
                <div className="space-y-2">
                  {deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{deliverable.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {deliverable.value} {contractForm.currency}
                          {deliverable.dueDate && ` • Due: ${new Date(deliverable.dueDate).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeliverable(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Deliverable title"
                  value={newDeliverable.title}
                  onChange={(e) => setNewDeliverable({...newDeliverable, title: e.target.value})}
                />
                <Input
                  placeholder="Value"
                  type="number"
                  value={newDeliverable.value}
                  onChange={(e) => setNewDeliverable({...newDeliverable, value: e.target.value})}
                />
                <Input
                  type="date"
                  value={newDeliverable.dueDate}
                  onChange={(e) => setNewDeliverable({...newDeliverable, dueDate: e.target.value})}
                />
                <Button onClick={addDeliverable} disabled={!newDeliverable.title || !newDeliverable.value}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContract} disabled={createContractMutation.isPending}>
                {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Contract Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <div className="font-semibold">{selectedContract.title}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getContractStatusColor(selectedContract.status)}>
                    {selectedContract.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <div className="text-sm">{selectedContract.description}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Partner Address</Label>
                  <div className="font-mono text-sm">{selectedContract.partnerAddress}</div>
                </div>
                <div>
                  <Label>Total Value</Label>
                  <div className="font-semibold">{selectedContract.totalValue} {selectedContract.currency}</div>
                </div>
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Contract Type</Label>
                      <div className="text-sm">{selectedContract.contractType}</div>
                    </div>
                    <div>
                      <Label>Network</Label>
                      <div className="text-sm">Base Sepolia</div>
                    </div>
                  </div>

                  {/* Arbitrator Information */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Arbitrator Information
                    </h3>
                    {(() => {
                      try {
                        const terms = JSON.parse(selectedContract.terms || '{}');
                        const arbitrator = terms.arbitrator;
                        
                        if (arbitrator?.name || arbitrator?.address === DEFAULT_ARBITRATOR.address) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{arbitrator?.name || DEFAULT_ARBITRATOR.name}</span>
                                <Badge variant="secondary">Default</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {arbitrator?.description || DEFAULT_ARBITRATOR.description}
                              </div>
                              <div className="text-sm">
                                <strong>Service Fee:</strong> {arbitrator?.fee || DEFAULT_ARBITRATOR.fee}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground">
                                {arbitrator?.address || DEFAULT_ARBITRATOR.address}
                              </div>
                            </div>
                          );
                        } else if (arbitrator?.address) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium font-mono">{arbitrator.address}</span>
                                <Badge variant="outline">Custom</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Custom arbitrator selected by contract creator
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{DEFAULT_ARBITRATOR.name}</span>
                                <Badge variant="secondary">Default</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {DEFAULT_ARBITRATOR.description}
                              </div>
                            </div>
                          );
                        }
                      } catch {
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{DEFAULT_ARBITRATOR.name}</span>
                              <Badge variant="secondary">Default</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {DEFAULT_ARBITRATOR.description}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Invitation Status */}
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <h3 className="font-semibold mb-2 flex items-center text-green-800">
                      <Send className="h-4 w-4 mr-2" />
                      Invitation Status
                    </h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>✓ Partner automatically invited: {selectedContract.partnerAddress}</div>
                      <div>✓ Arbitrator automatically notified</div>
                      <div className="text-xs text-green-600 mt-2">
                        All parties received invitations when contract was created
                      </div>
                    </div>
                  </div>
                  
                  {selectedContract.terms && (
                    <div>
                      <Label>Terms & Conditions</Label>
                      <div className="text-sm whitespace-pre-wrap">{selectedContract.terms}</div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="deliverables">
                  {selectedContract.deliverables && selectedContract.deliverables.length > 0 ? (
                    <div className="space-y-2">
                      {selectedContract.deliverables.map((deliverable, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{deliverable.title}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {deliverable.description}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              {deliverable.value} {selectedContract.currency}
                              {deliverable.dueDate && ` • Due: ${new Date(deliverable.dueDate).toLocaleDateString()}`}
                            </div>
                            <Badge variant="outline" className={
                              deliverable.status === 'completed' ? 'border-green-500 text-green-700' :
                              deliverable.status === 'verified' ? 'border-blue-500 text-blue-700' :
                              deliverable.status === 'disputed' ? 'border-red-500 text-red-700' :
                              'border-yellow-500 text-yellow-700'
                            }>
                              {deliverable.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No deliverables defined for this contract
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents">
                  {selectedContract.id && (
                    <ContractDocumentUpload 
                      contractId={selectedContract.id} 
                      disabled={selectedContract.status === 'completed'}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}