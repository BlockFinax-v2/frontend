import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/contexts/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Send, Target, DollarSign } from 'lucide-react';
import { MilestoneManager } from './milestone-manager';

interface Milestone {
  title: string;
  description: string;
  value: string;
  dueDate: string;
  status: 'pending' | 'claimed' | 'verified' | 'completed' | 'disputed';
}

interface EnhancedContractCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedContractCreator({ isOpen, onClose }: EnhancedContractCreatorProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    contractType: 'escrow',
    partnerAddress: '',
    totalValue: '',
    currency: 'USDC',
    terms: '',
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const createContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      const response = await fetch('/api/contracts/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });
      if (!response.ok) throw new Error('Failed to create contract');
      return response.json();
    },
    onSuccess: async (contract) => {
      // Create milestones for the contract
      for (const milestone of milestones) {
        await fetch('/api/contracts/deliverables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractId: contract.id,
            title: milestone.title,
            description: milestone.description,
            value: milestone.value,
            dueDate: milestone.dueDate,
            status: 'pending'
          })
        });
      }

      toast({
        title: "Contract Created",
        description: `Contract "${contractForm.title}" with ${milestones.length} milestones created successfully.`
      });

      queryClient.invalidateQueries({ queryKey: ['/api/contracts/drafts'] });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contract",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setContractForm({
      title: '',
      description: '',
      contractType: 'escrow',
      partnerAddress: '',
      totalValue: '',
      currency: 'USDC',
      terms: '',
    });
    setMilestones([]);
  };

  const handleSubmit = () => {
    if (!contractForm.title || !contractForm.partnerAddress || !contractForm.totalValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (milestones.length === 0) {
      toast({
        title: "No Milestones",
        description: "Please add at least one milestone to the contract",
        variant: "destructive"
      });
      return;
    }

    const totalMilestoneValue = milestones.reduce((sum, m) => sum + parseFloat(m.value), 0);
    const contractValue = parseFloat(contractForm.totalValue);
    
    if (Math.abs(totalMilestoneValue - contractValue) > 0.01) {
      toast({
        title: "Value Mismatch",
        description: "Total milestone value must equal contract value",
        variant: "destructive"
      });
      return;
    }

    const contractData = {
      ...contractForm,
      creatorAddress: address,
      terms: JSON.stringify({
        ...contractForm,
        milestones: milestones.length,
        paymentStructure: 'milestone-based',
        automaticVerification: false
      }),
      status: 'draft'
    };

    createContractMutation.mutate(contractData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Milestone-Based Contract
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Contract Title *</Label>
                  <Input
                    id="title"
                    value={contractForm.title}
                    onChange={(e) => setContractForm({...contractForm, title: e.target.value})}
                    placeholder="e.g., Website Development Project"
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
            </CardContent>
          </Card>

          {/* Milestone Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Milestone-Based Payment Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneManager
                milestones={milestones}
                onMilestonesChange={setMilestones}
                totalValue={contractForm.totalValue}
                currency={contractForm.currency}
                readOnly={false}
              />
            </CardContent>
          </Card>

          {/* Contract Summary */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Contract Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {milestones.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Milestones</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {contractForm.totalValue || '0'} {contractForm.currency}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {milestones.reduce((sum, m) => sum + parseFloat(m.value || '0'), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Allocated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {milestones.length > 0 && contractForm.totalValue ? 
                      (milestones.reduce((sum, m) => sum + parseFloat(m.value || '0'), 0) / parseFloat(contractForm.totalValue) * 100).toFixed(1) : '0'
                    }%
                  </div>
                  <div className="text-sm text-muted-foreground">Coverage</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createContractMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}