/**
 * User Profile Modal Component
 * 
 * Displays detailed user information and manages contact relationships.
 * Features profile viewing, contact management, and wallet address utilities.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User,
  Copy,
  ExternalLink,
  MessageCircle,
  Shield,
  Clock,
  UserPlus,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * User profile data structure
 */
interface UserProfile {
  walletAddress: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  joinedDate?: Date;
  isVerified?: boolean;
  lastSeen?: Date;
}

/**
 * Contact information structure
 */
interface ContactInfo {
  contactName: string;
  notes: string;
}

/**
 * Props for UserProfileModal component
 */
interface UserProfileModalProps {
  walletAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ walletAddress, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const { toast } = useToast();
  const { wallet } = useWallet();
  const queryClient = useQueryClient();

  // Load existing contact data
  const { data: existingContact } = useQuery({
    queryKey: [`/api/contacts/${wallet?.address}/by-address/${walletAddress}`],
    enabled: !!wallet?.address && !!walletAddress && isOpen
  });

  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchUserProfile();
    }
  }, [isOpen, walletAddress]);

  useEffect(() => {
    if (existingContact && typeof existingContact === 'object') {
      const contact = existingContact as ContactInfo;
      setContactName(contact.contactName || '');
      setContactNotes(contact.notes || '');
    } else {
      setContactName('');
      setContactNotes('');
    }
  }, [existingContact]);

  // Contact management mutations
  const saveContactMutation = useMutation({
    mutationFn: async (contactData: ContactInfo) => {
      if (existingContact && typeof existingContact === 'object') {
        const contact = existingContact as any;
        return await apiRequest("PUT", `/api/contacts/${contact.id}`, {
          contactName: contactData.contactName,
          notes: contactData.notes
        });
      } else {
        return await apiRequest("POST", "/api/contacts", {
          ownerWalletAddress: wallet?.address,
          contactWalletAddress: walletAddress,
          contactName: contactData.contactName,
          notes: contactData.notes
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", wallet?.address] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", wallet?.address, "by-address", walletAddress] });
      setIsEditingContact(false);
      toast({
        title: existingContact ? "Contact Updated" : "Contact Added",
        description: `${contactName} has been ${existingContact ? 'updated' : 'added'} to your contacts.`
      });
      // Trigger callback to parent component if provided
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 500);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save contact",
        variant: "destructive"
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async () => {
      if (existingContact && typeof existingContact === 'object') {
        return await apiRequest("DELETE", `/api/contacts/${(existingContact as any).id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", wallet?.address] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", wallet?.address, "by-address", walletAddress] });
      setContactName('');
      setContactNotes('');
      toast({
        title: "Contact Removed",
        description: "Contact has been removed from your address book."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove contact",
        variant: "destructive"
      });
    }
  });

  const handleSaveContact = () => {
    if (!contactName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a contact name.",
        variant: "destructive"
      });
      return;
    }

    saveContactMutation.mutate({
      contactName: contactName.trim(),
      notes: contactNotes.trim() || ""
    });
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profiles/${walletAddress}`);
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      } else {
        // Create default profile if none exists
        setProfile({
          walletAddress,
          joinedDate: new Date(),
          isVerified: false,
          lastSeen: new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({
        walletAddress,
        joinedDate: new Date(),
        isVerified: false,
        lastSeen: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const openInExplorer = () => {
    // Open in blockchain explorer (using Etherscan for Ethereum)
    window.open(`https://etherscan.io/address/${walletAddress}`, '_blank');
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Active ${diffInDays}d ago`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    walletAddress.slice(2, 4).toUpperCase()
                  )}
                </div>
                {profile.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {profile.displayName || formatWalletAddress(walletAddress)}
                </h3>
                {profile.lastSeen && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatLastSeen(profile.lastSeen)}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <Label className="text-sm font-medium">About</Label>
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              </div>
            )}

            {/* Wallet Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Wallet Address</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={walletAddress}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(walletAddress)}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openInExplorer}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contact Management Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Contact Name</Label>
                {existingContact && !isEditingContact && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingContact(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isEditingContact || !existingContact || typeof existingContact !== 'object' ? (
                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder="Enter a name for this contact"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Notes (optional)"
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveContact}
                      disabled={saveContactMutation.isPending || !contactName.trim()}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveContactMutation.isPending ? "Saving..." : existingContact ? "Update" : "Save"}
                    </Button>
                    {(isEditingContact || existingContact) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingContact(false);
                          if (existingContact) {
                            setContactName(existingContact.contactName || '');
                            setContactNotes(existingContact.notes || '');
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{(existingContact as any)?.contactName}</p>
                      {(existingContact as any)?.notes && (
                        <p className="text-sm text-muted-foreground">{(existingContact as any).notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteContactMutation.mutate()}
                    disabled={deleteContactMutation.isPending}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    {deleteContactMutation.isPending ? "Removing..." : "Remove from Contacts"}
                  </Button>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {profile.joinedDate ? formatDate(profile.joinedDate) : 'Unknown'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-muted-foreground flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button onClick={onClose} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}