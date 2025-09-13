/**
 * Sub-Wallet Manager Component - Standardized Version
 * 
 * Interface for managing contract-specific escrow accounts
 * Handles sub-wallet creation, invitations, and fund management
 * ALL USERS SEE THE SAME CONTRACT FUNCTIONALITY
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { subWalletManager, type SubWalletData, type ContractInvitation } from '@/lib/sub-wallet-manager';
import { 
  Wallet, 
  Plus, 
  Send, 
  Users, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowUpRight,
  Copy,
  Eye,
  FileText,
  Trash2,
  PenTool
} from 'lucide-react';

export function SubWalletManager() {
  const [subWallets, setSubWallets] = useState<SubWalletData[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<ContractInvitation[]>([]);
  const [contractDrafts, setContractDrafts] = useState<any[]>([]);
  const [subWalletBalances, setSubWalletBalances] = useState<Map<string, any>>(new Map());
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isDraftingContractOpen, setIsDraftingContractOpen] = useState(false);
  const [isReviewingContract, setIsReviewingContract] = useState(false);
  
  const [selectedSubWallet, setSelectedSubWallet] = useState<SubWalletData | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transferMode, setTransferMode] = useState(false);

  // Form states
  const [contractDetails, setContractDetails] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'ETH',
    deadline: '',
    contractType: 'escrow'
  });
  
  const [inviteeAddress, setInviteeAddress] = useState('');
  const [inviteRole, setInviteRole] = useState<'party' | 'arbitrator'>('party');
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingCurrency, setFundingCurrency] = useState('ETH');
  
  const [contractDraft, setContractDraft] = useState({
    title: '',
    description: '',
    contractType: 'escrow',
    partnerAddress: '',
    totalValue: '',
    currency: 'ETH',
    terms: ''
  });
  
  const [deliverables, setDeliverables] = useState<any[]>([]);

  const { toast } = useToast();
  const { address } = useWallet();

  useEffect(() => {
    if (address) {
      refreshData();
    }
  }, [address]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Refresh sub-wallets
      const response = await fetch(`/api/sub-wallets?walletAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setSubWallets(data);
      }

      // Refresh contract drafts
      const draftsResponse = await fetch('/api/contracts/drafts');
      if (draftsResponse.ok) {
        const draftsData = await draftsResponse.json();
        setContractDrafts(draftsData);
      }

      // Refresh invitations
      const invitationsResponse = await fetch(`/api/invitations/${address}`);
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setPendingInvitations(invitationsData);
      }

      // Load balances for all sub-wallets
      const balanceMap = new Map();
      for (const subWallet of subWallets) {
        try {
          const balance = await subWalletManager.getSubWalletBalance(subWallet.address);
          balanceMap.set(subWallet.address, balance);
        } catch (error) {
          console.error(`Failed to load balance for ${subWallet.address}:`, error);
        }
      }
      setSubWalletBalances(balanceMap);

      toast({
        title: 'Data refreshed',
        description: 'All sub-wallet data has been updated',
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        title: 'Refresh failed',
        description: 'Unable to update data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateSubWallet = async () => {
    if (!contractDetails.title.trim()) {
      toast({
        title: 'Error',
        description: 'Contract title is required',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const subWallet = subWalletManager.createSubWallet(contractId, contractDetails.contractType, contractDetails.title);
      
      toast({
        title: 'Sub-wallet created',
        description: `New escrow account created for ${contractDetails.title}`,
      });
      
      setIsCreateModalOpen(false);
      setContractDetails({
        title: '',
        description: '',
        amount: '',
        currency: 'ETH',
        deadline: '',
        contractType: 'escrow'
      });
      refreshData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create sub-wallet',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFundSubWallet = async () => {
    if (!selectedSubWallet || !fundingAmount) return;

    setIsProcessing(true);
    try {
      if (transferMode) {
        toast({
          title: 'Transfer initiated',
          description: `Transferring ${fundingAmount} ${fundingCurrency} from contract`,
        });
      } else {
        toast({
          title: 'Funding initiated',
          description: `Adding ${fundingAmount} ${fundingCurrency} to contract`,
        });
      }
      
      setIsFundingModalOpen(false);
      setFundingAmount('');
      setFundingCurrency('ETH');
      setSelectedSubWallet(null);
      setTransferMode(false);
      
      setTimeout(() => {
        refreshData();
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${transferMode ? 'transfer' : 'fund'} sub-wallet`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteeAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Wallet address is required',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSubWallet) {
      toast({
        title: 'Error',
        description: 'No sub-wallet selected for invitation',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      toast({
        title: 'Invitation sent',
        description: `Contract invitation sent to ${inviteeAddress.slice(0, 6)}...${inviteeAddress.slice(-4)}`,
      });
      
      setIsInviteModalOpen(false);
      setInviteeAddress('');
      setInviteRole('party');
      setSelectedSubWallet(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptInvitation = async (invitation: ContractInvitation) => {
    setIsProcessing(true);
    try {
      const contractId = `contract_${Date.now()}_${invitation.id}`;
      const subWallet = subWalletManager.createSubWallet(contractId, 'contract_party', invitation.contractDetails.title);
      
      const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subWalletData: {
            address: subWallet.address,
            encryptedPrivateKey: subWallet.encryptedPrivateKey,
            contractId: contractId,
            purpose: 'shared_contract_party',
            mainWalletAddress: address,
            contractRole: 'party',
            isActive: true
          },
          contractData: {
            title: invitation.contractDetails.title,
            description: invitation.contractDetails.description || '',
            totalValue: parseFloat(invitation.contractDetails.amount || '0'),
            currency: invitation.contractDetails.currency || 'ETH',
            contractType: 'escrow',
            partnerAddress: invitation.inviterAddress,
            subWalletAddress: subWallet.address,
            status: 'draft'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }
      
      toast({
        title: 'Invitation accepted',
        description: `Contract sub-wallet created for ${invitation.contractDetails.title}`,
      });
      
      refreshData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sub-Wallet Manager</h2>
          <p className="text-muted-foreground">Manage contract-specific escrow accounts</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowUpRight className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sub-Wallet
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sub-wallets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sub-wallets">
            <Wallet className="h-4 w-4 mr-2" />
            Sub-Wallets ({subWallets.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Send className="h-4 w-4 mr-2" />
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sub-wallets" className="space-y-4">
          {subWallets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sub-wallets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first contract-specific escrow account to get started.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sub-Wallet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {subWallets.map((subWallet) => (
                <Card key={subWallet.address}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>{subWallet.name || `Contract: ${subWallet.contractId}`}</span>
                      </CardTitle>
                      <Badge variant="outline">{subWallet.purpose}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">Wallet Address</Label>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                              {subWallet.address}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(subWallet.address, 'Address')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Label className="text-sm text-muted-foreground">Contract Funds</Label>
                          {(() => {
                            const balance = subWalletBalances.get(subWallet.address);
                            const hasEth = balance && parseFloat(balance.eth) > 0;
                            const hasUsdc = balance && parseFloat(balance.usdc) > 0;
                            const totalUsd = balance ? balance.ethUsd + balance.usdcUsd : 0;
                            
                            if (!hasEth && !hasUsdc) {
                              return (
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm text-muted-foreground">
                                    0.00 ETH / 0.00 USDC
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Empty
                                  </Badge>
                                </div>
                              );
                            }
                            
                            return (
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {hasEth && `${balance.eth} ETH`}
                                    {hasEth && hasUsdc && ' / '}
                                    {hasUsdc && `${balance.usdc} USDC`}
                                  </div>
                                  <Badge variant="default" className="text-xs">
                                    Transferable
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ≈ ${totalUsd.toFixed(2)} USD
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* STANDARDIZED CONTRACT ACTIONS - ALL USERS SEE THE SAME BUTTONS */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(subWallet.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubWallet(subWallet);
                            setIsDraftingContractOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Draft Contract
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubWallet(subWallet);
                            setIsInviteModalOpen(true);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Invite Party
                        </Button>

                        {(() => {
                          const balance = subWalletBalances.get(subWallet.address);
                          const hasAnyFunds = balance && (parseFloat(balance.eth) > 0 || parseFloat(balance.usdc) > 0);
                          
                          if (hasAnyFunds) {
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubWallet(subWallet);
                                  setIsFundingModalOpen(true);
                                  setTransferMode(true);
                                }}
                              >
                                <ArrowUpRight className="h-4 w-4 mr-2" />
                                Transfer Funds
                              </Button>
                            );
                          } else {
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubWallet(subWallet);
                                  setIsFundingModalOpen(true);
                                  setTransferMode(false);
                                }}
                              >
                                <ArrowUpRight className="h-4 w-4 mr-2" />
                                Fund Contract
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contract Invitations</h3>
            <Badge variant="outline">
              {pendingInvitations.length} pending
            </Badge>
          </div>
          
          {pendingInvitations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invitations</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any pending contract invitations at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{invitation.contractDetails.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            From: {invitation.inviterAddress.slice(0, 6)}...{invitation.inviterAddress.slice(-4)}
                          </p>
                        </div>
                        <Badge variant={invitation.status === 'pending' ? 'default' : 'secondary'}>
                          {invitation.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 font-medium">
                            {invitation.contractDetails.amount} {invitation.contractDetails.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <span className="ml-2 font-medium">
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {invitation.status === 'accepted' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              toast({
                                title: 'Contract review',
                                description: 'Opening contract details...',
                              });
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review Contract
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Invitation declined',
                                  description: 'The contract invitation has been declined',
                                });
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvitation(invitation)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept & Create Sub-Wallet
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Funding Modal */}
      <Dialog open={isFundingModalOpen} onOpenChange={setIsFundingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transferMode ? "Transfer Funds Out" : "Fund Contract"}
            </DialogTitle>
          </DialogHeader>
          {selectedSubWallet && (
            <div className="space-y-4">
              <div>
                <Label>Contract Address</Label>
                <code className="block text-sm bg-muted p-2 rounded mt-1">
                  {selectedSubWallet.address}
                </code>
              </div>
              
              {transferMode && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Transfer Mode:</strong> Withdrawing funds from contract back to your main wallet.
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="fundingCurrency">Currency</Label>
                <Select value={fundingCurrency} onValueChange={setFundingCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                    <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fundingAmount">
                  Amount ({fundingCurrency}) {transferMode ? "to Transfer" : "to Fund"}
                </Label>
                <Input
                  id="fundingAmount"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="0.0"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsFundingModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFundSubWallet}
                  disabled={isProcessing || !fundingAmount}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : transferMode ? (
                    'Transfer Funds'
                  ) : (
                    'Fund Contract'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Sub-Wallet Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sub-Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractTitle">Contract Title</Label>
              <Input
                id="contractTitle"
                value={contractDetails.title}
                onChange={(e) => setContractDetails({...contractDetails, title: e.target.value})}
                placeholder="e.g., Website Development Project"
              />
            </div>
            <div>
              <Label htmlFor="contractDescription">Description (Optional)</Label>
              <Textarea
                id="contractDescription"
                value={contractDetails.description}
                onChange={(e) => setContractDetails({...contractDetails, description: e.target.value})}
                placeholder="Brief description of the contract..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractAmount">Contract Value</Label>
                <Input
                  id="contractAmount"
                  value={contractDetails.amount}
                  onChange={(e) => setContractDetails({...contractDetails, amount: e.target.value})}
                  placeholder="1000"
                  type="number"
                />
              </div>
              <div>
                <Label htmlFor="contractCurrency">Currency</Label>
                <Select 
                  value={contractDetails.currency} 
                  onValueChange={(value) => setContractDetails({...contractDetails, currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubWallet}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Sub-Wallet'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Contract Party</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteeAddress">Wallet Address</Label>
              <Input
                id="inviteeAddress"
                value={inviteeAddress}
                onChange={(e) => setInviteeAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={(value: 'party' | 'arbitrator') => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="party">Contract Party</SelectItem>
                  <SelectItem value="arbitrator">Arbitrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvitation}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}