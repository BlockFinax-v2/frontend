import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Shield,
  Briefcase,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: number;
  walletAddress: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  taxId?: string | null;
  website?: string | null;
  linkedIn?: string | null;
  twitter?: string | null;
  bio?: string | null;
  avatar?: string | null;
  kycStatus?: string | null;
  kycDocuments?: string | null;
  isPublic?: boolean | null;
  lastUpdated?: Date | null;
  createdAt?: Date | null;
}

interface UserProfileModalProps {
  walletAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ walletAddress, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadProfile();
    }
  }, [isOpen, walletAddress]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profiles/${walletAddress}`);
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      } else if (response.status === 404) {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard"
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getKycStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getKycStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </DialogTitle>
        </DialogHeader>

        {!profile ? (
          <div className="text-center py-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Profile Found</h3>
            <p className="text-muted-foreground mb-4">
              This user hasn't set up their profile yet.
            </p>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wallet Address:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono">{formatAddress(walletAddress)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(walletAddress)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-semibold">
                    {profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Anonymous User'}
                  </h2>
                  <div className="flex items-center space-x-1">
                    {getKycStatusIcon(profile.kycStatus)}
                    <Badge className={getKycStatusColor(profile.kycStatus)}>
                      {profile.kycStatus || 'Pending'}
                    </Badge>
                  </div>
                </div>
                {profile.jobTitle && profile.companyName && (
                  <p className="text-muted-foreground flex items-center space-x-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{profile.jobTitle} at {profile.companyName}</span>
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-muted-foreground">Wallet:</span>
                  <span className="text-sm font-mono">{formatAddress(walletAddress)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(walletAddress)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            <Separator />

            {/* Contact Information */}
            {(profile.email || profile.phoneNumber || profile.website) && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                    {profile.phoneNumber && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.phoneNumber}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <span>{profile.website}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Company Information */}
            {(profile.companyName || profile.jobTitle) && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Company Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.companyName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Company</label>
                        <p className="text-sm">{profile.companyName}</p>
                      </div>
                    )}
                    {profile.jobTitle && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                        <p className="text-sm">{profile.jobTitle}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Location Information */}
            {(profile.country || profile.city || profile.address) && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.country && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Country</label>
                        <p className="text-sm">{profile.country}</p>
                      </div>
                    )}
                    {profile.city && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">City</label>
                        <p className="text-sm">{profile.city}</p>
                      </div>
                    )}
                    {profile.address && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="text-sm">{profile.address}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* KYC Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Verification Status</span>
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getKycStatusIcon(profile.kycStatus)}
                    <span className="font-medium">KYC Status</span>
                  </div>
                  <Badge className={getKycStatusColor(profile.kycStatus)}>
                    {profile.kycStatus || 'Pending'}
                  </Badge>
                </div>
                {profile.nationality && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Nationality: </span>
                    <span className="text-sm">{profile.nationality}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {(profile.linkedIn || profile.twitter) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Social Links</h3>
                  <div className="flex space-x-4">
                    {profile.linkedIn && (
                      <a
                        href={profile.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {profile.twitter && (
                      <a
                        href={profile.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-600 flex items-center space-x-1"
                      >
                        <span>Twitter</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {profile.lastUpdated && (
              <div className="text-xs text-muted-foreground text-center">
                Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}