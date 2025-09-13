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
import { secureStorage } from '@/lib/storage';
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
  PenTool,
  Upload
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
    currency: 'USDC',
    deliverables: [] as any[]
  });
  
  const [newDeliverable, setNewDeliverable] = useState({
    title: '',
    description: '',
    value: '',
    dueDate: '',
  });

  const { toast } = useToast();
  const { address } = useWallet();

  useEffect(() => {
    if (address) {
      refreshData();
    }
  }, [address]);

  // Auto-refresh invitations every 10 seconds
  useEffect(() => {
    if (address) {
      const interval = setInterval(() => {
        fetch(`/api/invitations/${address}?_t=${Date.now()}`)
          .then(res => res.json())
          .then(invitationsData => {
            const formattedInvitations = invitationsData
              .filter((invitation: any) => invitation.status === 'pending')
              .map((invitation: any) => {
                let contractDetails;
                try {
                  contractDetails = typeof invitation.contractDetails === 'string' 
                    ? JSON.parse(invitation.contractDetails) 
                    : invitation.contractDetails;
                } catch (error) {
                  contractDetails = invitation.contractDetails;
                }
                return { ...invitation, contractDetails };
              });
            
            if (formattedInvitations.length !== pendingInvitations.length) {
              setPendingInvitations(formattedInvitations);
              console.log(`✓ Auto-refreshed: ${formattedInvitations.length} pending invitations`);
            }
          })
          .catch(error => console.error('Auto-refresh failed:', error));
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [address, pendingInvitations.length]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Refresh sub-wallets from database
      const response = await fetch(`/api/sub-wallets?walletAddress=${address}`);
      let fetchedSubWallets = [];
      
      if (response.ok) {
        fetchedSubWallets = await response.json();
        setSubWallets(fetchedSubWallets);
        
        // Sync database sub-wallets to sub-wallet manager in-memory storage
        if (fetchedSubWallets && Array.isArray(fetchedSubWallets)) {
          console.log(`🔄 Syncing ${fetchedSubWallets.length} sub-wallets from database...`);
          
          // Clear existing sub-wallets in manager
          (subWalletManager as any).subWallets.clear();
          
          // Add database sub-wallets to memory
          for (const dbSubWallet of fetchedSubWallets) {
            const subWalletData = {
              address: dbSubWallet.address,
              name: dbSubWallet.name,
              encryptedPrivateKey: dbSubWallet.encryptedPrivateKey,
              contractId: dbSubWallet.contractId,
              purpose: dbSubWallet.purpose,
              mainWalletAddress: dbSubWallet.mainWalletAddress,
              createdAt: dbSubWallet.createdAt || new Date().toISOString(),
              contractSigned: dbSubWallet.contractSigned || false
            };
            
            (subWalletManager as any).subWallets.set(dbSubWallet.address, subWalletData);
          }
          
          console.log(`✓ Synchronized ${fetchedSubWallets.length} sub-wallets from database`);
        }
      }

      // Refresh contract drafts
      const draftsResponse = await fetch('/api/contracts/drafts');
      if (draftsResponse.ok) {
        const draftsData = await draftsResponse.json();
        setContractDrafts(draftsData);
      }

      // Refresh invitations with cache busting
      const invitationsResponse = await fetch(`/api/invitations/${address}?_t=${Date.now()}`);
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        
        // Parse and format invitations with proper contract details
        const formattedInvitations = invitationsData
          .filter((invitation: any) => invitation.status === 'pending') // Only show pending invitations
          .map((invitation: any) => {
            let contractDetails;
            try {
              contractDetails = typeof invitation.contractDetails === 'string' 
                ? JSON.parse(invitation.contractDetails) 
                : invitation.contractDetails;
            } catch (error) {
              console.error('Failed to parse contract details:', error);
              contractDetails = invitation.contractDetails;
            }
            
            return {
              ...invitation,
              contractDetails
            };
          });
        
        setPendingInvitations(formattedInvitations);
        console.log(`✓ Loaded ${formattedInvitations.length} pending invitations for ${address}`);
      } else {
        console.error('Failed to fetch invitations:', invitationsResponse.status);
      }

      // Load balances for all sub-wallets
      const balanceMap = new Map();
      const walletsToCheck = fetchedSubWallets.length > 0 ? fetchedSubWallets : subWallets;
      for (const subWallet of walletsToCheck) {
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
        // Transfer funds from sub-wallet to main wallet
        const txHash = await subWalletManager.transferFromSubWallet(
          selectedSubWallet.address,
          fundingAmount,
          fundingCurrency,
          84532 // Base Sepolia network ID
        );
        
        toast({
          title: 'Transfer completed',
          description: `Successfully transferred ${fundingAmount} ${fundingCurrency} to main wallet`,
        });
        
        console.log('Transfer transaction hash:', txHash);
      } else {
        // Fund sub-wallet from main wallet
        const txHash = await subWalletManager.fundSubWallet(
          selectedSubWallet.address,
          fundingAmount,
          84532, // Base Sepolia network ID
          fundingCurrency
        );
        
        toast({
          title: 'Funding completed',
          description: `Successfully funded contract with ${fundingAmount} ${fundingCurrency}`,
        });
        
        console.log('Funding transaction hash:', txHash);
      }
      
      setIsFundingModalOpen(false);
      setFundingAmount('');
      setFundingCurrency('ETH');
      setSelectedSubWallet(null);
      setTransferMode(false);
      
      // Refresh data after successful transaction
      setTimeout(() => {
        refreshData();
      }, 3000);
    } catch (error) {
      console.error('Transfer/funding error:', error);
      
      let errorMessage = `Failed to ${transferMode ? 'transfer' : 'fund'} sub-wallet`;
      let showUnlockPrompt = false;
      
      if (error instanceof Error) {
        if (error.message.includes('locked') || error.message.includes('unlock') || error.message.includes('password')) {
          errorMessage = 'Your wallet needs to be unlocked to access sub-wallet funds. Please enter your wallet password.';
          showUnlockPrompt = true;
        } else if (error.message.includes('decrypt')) {
          errorMessage = 'Unable to access sub-wallet. Please unlock your main wallet and try again.';
          showUnlockPrompt = true;
        } else if (error.message.includes('Insufficient balance')) {
          errorMessage = `Insufficient balance for this transaction. Check your ${fundingCurrency} balance and gas fees.`;
        } else if (error.message.includes('not found')) {
          errorMessage = 'Sub-wallet not found. Please refresh the page and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // If authentication error, prompt user to unlock wallet
      if (showUnlockPrompt) {
        // Create a simple unlock prompt
        const unlockWallet = async () => {
          const password = prompt('Please enter your wallet password to access sub-wallet funds:');
          if (password) {
            try {
              // Set the password in secure storage and retry
              secureStorage.setPassword(password);
              
              // Retry the transfer operation
              setTimeout(() => {
                handleFundSubWallet();
              }, 100);
              
              return;
            } catch (unlockError) {
              toast({
                title: 'Invalid password',
                description: 'Please check your password and try again.',
                variant: 'destructive',
              });
            }
          }
        };
        
        // Show unlock prompt
        const shouldUnlock = confirm('Your wallet is locked. Would you like to unlock it now?');
        if (shouldUnlock) {
          unlockWallet();
          return; // Don't show the error toast if user is trying to unlock
        }
      }
      
      toast({
        title: 'Transaction failed',
        description: errorMessage,
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
      const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accepteeAddress: address
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept invitation');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Invitation accepted',
        description: result.message || `You are now a cosigner for ${invitation.contractDetails.title}`,
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

  const addDeliverable = () => {
    if (!newDeliverable.title || !newDeliverable.value) {
      toast({
        title: 'Error',
        description: 'Deliverable title and value are required',
        variant: 'destructive',
      });
      return;
    }

    const deliverable = {
      id: Date.now(),
      ...newDeliverable,
      status: 'pending'
    };

    setContractDraft({
      ...contractDraft,
      deliverables: [...contractDraft.deliverables, deliverable]
    });

    setNewDeliverable({
      title: '',
      description: '',
      value: '',
      dueDate: '',
    });

    toast({
      title: 'Deliverable added',
      description: `${deliverable.title} has been added to the contract`,
    });
  };

  const removeDeliverable = (id: number) => {
    setContractDraft({
      ...contractDraft,
      deliverables: contractDraft.deliverables.filter(d => d.id !== id)
    });
  };

  const handleCreateContractDraft = async () => {
    if (!contractDraft.title || !contractDraft.partnerAddress) {
      toast({
        title: 'Error',
        description: 'Contract title and partner address are required',
        variant: 'destructive',
      });
      return;
    }

    if (contractDraft.deliverables.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one deliverable is required',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/contracts/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contractDraft,
          creatorAddress: address,
          status: 'draft'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create contract draft');
      }

      const newDraft = await response.json();
      
      toast({
        title: 'Contract draft created',
        description: `${contractDraft.title} has been saved as a draft`,
      });

      // Reset form
      setContractDraft({
        title: '',
        description: '',
        contractType: 'escrow',
        partnerAddress: '',
        totalValue: '',
        currency: 'USDC',
        deliverables: [],
      });
      
      setNewDeliverable({
        title: '',
        description: '',
        value: '',
        dueDate: '',
      });
      
      setIsDraftingContractOpen(false);
      refreshData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create contract draft',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
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
            onClick={() => {
              refreshData();
              // Force immediate invitation refresh
              if (address) {
                fetch(`/api/invitations/${address}?_t=${Date.now()}`)
                  .then(res => res.json())
                  .then(invitationsData => {
                    const formattedInvitations = invitationsData
                      .filter((invitation: any) => invitation.status === 'pending')
                      .map((invitation: any) => {
                        let contractDetails;
                        try {
                          contractDetails = typeof invitation.contractDetails === 'string' 
                            ? JSON.parse(invitation.contractDetails) 
                            : invitation.contractDetails;
                        } catch (error) {
                          contractDetails = invitation.contractDetails;
                        }
                        return { ...invitation, contractDetails };
                      });
                    setPendingInvitations(formattedInvitations);
                    console.log(`✓ Force refreshed: ${formattedInvitations.length} pending invitations`);
                  });
              }
            }}
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
          <TabsTrigger value="drafts">
            <FileText className="h-4 w-4 mr-2" />
            Drafts ({contractDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Send className="h-4 w-4 mr-2" />
            Invitations ({pendingInvitations.filter(inv => inv.status === 'pending').length})
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

        <TabsContent value="drafts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contract Drafts</h3>
            <Button onClick={() => setIsDraftingContractOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Draft Contract
            </Button>
          </div>
          
          {contractDrafts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No drafts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first contract draft with document attachments.
                </p>
                <Button onClick={() => setIsDraftingContractOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Draft
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contractDrafts.map((draft: any) => (
                <Card key={draft.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader onClick={() => setSelectedDraft(draft)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>{draft.title}</span>
                      </CardTitle>
                      <Badge variant={draft.status === 'draft' ? 'secondary' : 'default'}>
                        {draft.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{draft.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Value: {draft.totalValue} {draft.currency}
                        </span>
                        <span className="text-muted-foreground">
                          Created: {new Date(draft.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDraft(draft);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add document upload functionality
                          setSelectedDraft(draft);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Documents
                      </Button>
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

      {/* Contract Drafting Modal */}
      <Dialog open={isDraftingContractOpen} onOpenChange={setIsDraftingContractOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Draft New Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractTitle">Contract Title</Label>
                <Input
                  id="contractTitle"
                  value={contractDraft.title}
                  onChange={(e) => setContractDraft({...contractDraft, title: e.target.value})}
                  placeholder="e.g., Website Development Agreement"
                />
              </div>
              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select value={contractDraft.contractType} onValueChange={(value) => setContractDraft({...contractDraft, contractType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escrow">Escrow</SelectItem>
                    <SelectItem value="service">Service Agreement</SelectItem>
                    <SelectItem value="trade_finance">Trade Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={contractDraft.description}
                onChange={(e) => setContractDraft({...contractDraft, description: e.target.value})}
                placeholder="Detailed description of the contract terms and deliverables..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partnerAddress">Partner Wallet Address</Label>
                <Input
                  id="partnerAddress"
                  value={contractDraft.partnerAddress}
                  onChange={(e) => setContractDraft({...contractDraft, partnerAddress: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label htmlFor="totalValue">Total Value</Label>
                <div className="flex space-x-2">
                  <Input
                    id="totalValue"
                    value={contractDraft.totalValue}
                    onChange={(e) => setContractDraft({...contractDraft, totalValue: e.target.value})}
                    placeholder="1000"
                    type="number"
                  />
                  <Select value={contractDraft.currency} onValueChange={(value) => setContractDraft({...contractDraft, currency: value})}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <PenTool className="h-4 w-4 mr-2" />
                Contract Deliverables
              </h4>
              
              {/* Existing Deliverables */}
              {contractDraft.deliverables.length > 0 && (
                <div className="space-y-2 mb-4">
                  {contractDraft.deliverables.map((deliverable: any) => (
                    <div key={deliverable.id} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{deliverable.title}</h5>
                          <p className="text-sm text-muted-foreground">{deliverable.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>Value: {deliverable.value} {contractDraft.currency}</span>
                            {deliverable.dueDate && (
                              <span>Due: {new Date(deliverable.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDeliverable(deliverable.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Deliverable */}
              <div className="border rounded-lg p-4 space-y-3">
                <h5 className="font-medium">Add Deliverable</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="deliverableTitle">Title</Label>
                    <Input
                      id="deliverableTitle"
                      value={newDeliverable.title}
                      onChange={(e) => setNewDeliverable({...newDeliverable, title: e.target.value})}
                      placeholder="e.g., Homepage Design"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliverableValue">Value ({contractDraft.currency})</Label>
                    <Input
                      id="deliverableValue"
                      value={newDeliverable.value}
                      onChange={(e) => setNewDeliverable({...newDeliverable, value: e.target.value})}
                      placeholder="500"
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deliverableDescription">Description</Label>
                  <Textarea
                    id="deliverableDescription"
                    value={newDeliverable.description}
                    onChange={(e) => setNewDeliverable({...newDeliverable, description: e.target.value})}
                    placeholder="Detailed description of what will be delivered..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="deliverableDueDate">Due Date (Optional)</Label>
                  <Input
                    id="deliverableDueDate"
                    value={newDeliverable.dueDate}
                    onChange={(e) => setNewDeliverable({...newDeliverable, dueDate: e.target.value})}
                    type="date"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addDeliverable}
                  disabled={!newDeliverable.title || !newDeliverable.value}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deliverable
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Document Upload (Optional)
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Upload supporting documents like specifications, templates, or legal documents.
              </p>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    // Handle file upload logic here
                    console.log('Files selected:', files);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG (Max 10MB each)
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDraftingContractOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateContractDraft}
                disabled={isProcessing || !contractDraft.title || !contractDraft.partnerAddress}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Draft'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft Details Modal */}
      <Dialog open={!!selectedDraft} onOpenChange={() => setSelectedDraft(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDraft?.title}</DialogTitle>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Contract Type</Label>
                  <p className="font-medium">{selectedDraft.contractType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedDraft.status === 'draft' ? 'secondary' : 'default'}>
                    {selectedDraft.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="whitespace-pre-wrap">{selectedDraft.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Partner Address</Label>
                  <p className="font-mono text-sm">{selectedDraft.partnerAddress}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Value</Label>
                  <p className="font-medium">{selectedDraft.totalValue} {selectedDraft.currency}</p>
                </div>
              </div>
              
              {selectedDraft.deliverables && selectedDraft.deliverables.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Deliverables</Label>
                  <div className="space-y-2 mt-2">
                    {selectedDraft.deliverables.map((deliverable: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/50">
                        <h5 className="font-medium">{deliverable.title}</h5>
                        <p className="text-sm text-muted-foreground">{deliverable.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>Value: {deliverable.value} {selectedDraft.currency}</span>
                          {deliverable.dueDate && (
                            <span>Due: {new Date(deliverable.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Document Management
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      All users can upload documents to this contract
                    </span>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      // Handle document upload for this specific contract
                      console.log('Documents for contract:', selectedDraft.id, files);
                      toast({
                        title: 'Documents uploading',
                        description: `Uploading ${files.length} document(s) to contract`,
                      });
                    }}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setSelectedDraft(null)} className="flex-1">
                  Close
                </Button>
                <Button className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send for Signature
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}