import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { escrowManager } from '@/lib/escrow';
import { NETWORKS } from '@/lib/networks';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  ArrowRight,
  Shield,
  ExternalLink,
  Copy,
  Play,
  HandCoins,
  AlertCircle
} from 'lucide-react';

interface EscrowContract {
  id: number;
  contractAddress: string;
  importer: string;
  exporter: string;
  arbitrator: string;
  totalAmount: string;
  status: 'created' | 'funded' | 'in_progress' | 'completed' | 'disputed' | 'refunded';
  description: string;
  deadline: Date;
  milestones: {
    title: string;
    amount: string;
    status: 'pending' | 'completed' | 'released';
    dueDate: Date;
  }[];
  networkId: number;
  role: 'importer' | 'exporter' | 'arbitrator';
}

interface ContractDetailsModalProps {
  contract: EscrowContract | null;
  isOpen: boolean;
  onClose: () => void;
  onContractUpdate?: () => void;
}

export function ContractDetailsModal({ contract, isOpen, onClose, onContractUpdate }: ContractDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!contract) return null;

  const network = NETWORKS.find(n => n.id === contract.networkId);
  const totalMilestones = contract.milestones.length;
  const completedMilestones = contract.milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'funded': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'in_progress': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'completed': return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200';
      case 'disputed': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'refunded': return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
      case 'completed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'released': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const handleCompleteMilestone = async (milestoneIndex: number) => {
    if (!contract || contract.role !== 'exporter') return;

    setIsLoading(true);
    try {
      const txHash = await escrowManager.completeMilestone(contract.id, milestoneIndex, contract.networkId);
      toast({
        title: 'Milestone Completed',
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });
      onContractUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete milestone',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseMilestone = async (milestoneIndex: number) => {
    if (!contract || contract.role !== 'importer') return;

    setIsLoading(true);
    try {
      const txHash = await escrowManager.releaseMilestonePayment(contract.id, milestoneIndex, contract.networkId);
      toast({
        title: 'Payment Released',
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });
      onContractUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!contract) return;

    setIsLoading(true);
    try {
      const txHash = await escrowManager.raiseDispute(contract.id, 'Contract dispute raised', contract.networkId);
      toast({
        title: 'Dispute Raised',
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });
      onContractUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to raise dispute',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Address copied to clipboard',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Contract Details</span>
            <Badge className={getStatusColor(contract.status)}>
              {contract.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Contract Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Contract Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract ID</p>
                    <p className="font-mono">{contract.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Network</p>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: network?.color }}
                      />
                      <span>{network?.name}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-lg font-semibold">{contract.totalAmount} {network?.symbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Role</p>
                    <Badge variant="outline">
                      {contract.role.charAt(0).toUpperCase() + contract.role.slice(1)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p>{contract.description}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Deadline: {contract.deadline.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {Math.ceil((contract.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Participants</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Importer</p>
                      <p className="text-sm font-mono text-muted-foreground">{contract.importer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contract.importer)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Exporter</p>
                      <p className="text-sm font-mono text-muted-foreground">{contract.exporter}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contract.exporter)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Arbitrator</p>
                      <p className="text-sm font-mono text-muted-foreground">{contract.arbitrator}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contract.arbitrator)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {completedMilestones} of {totalMilestones} milestones completed
                    </span>
                    <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            {contract.milestones.map((milestone, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{milestone.title}</h3>
                        <Badge className={getMilestoneStatusColor(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{milestone.amount} {network?.symbol}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {milestone.dueDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {contract.role === 'exporter' && milestone.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteMilestone(index)}
                          disabled={isLoading}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      
                      {contract.role === 'importer' && milestone.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleReleaseMilestone(index)}
                          disabled={isLoading}
                        >
                          <HandCoins className="h-4 w-4 mr-1" />
                          Release Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Contract Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">View on Block Explorer</p>
                    <p className="text-sm text-muted-foreground">
                      View contract details on {network?.name} explorer
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`${network?.blockExplorerUrl}/address/${contract.contractAddress}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>

                {(contract.role === 'importer' || contract.role === 'exporter') && contract.status !== 'disputed' && (
                  <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 dark:border-red-800">
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Raise Dispute</p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Escalate contract issues to arbitrator
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleRaiseDispute}
                      disabled={isLoading}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Raise Dispute
                    </Button>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Contract Address</p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {contract.contractAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}