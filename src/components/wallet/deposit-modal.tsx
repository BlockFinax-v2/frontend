import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Bitcoin, CreditCard, Building2, Check, MapPin, User } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { useEffect } from 'react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Generate QR code for wallet address
  useEffect(() => {
    if (address && isOpen) {
      QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [address, isOpen]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Mock bank account details - in real app, these would come from user profile
  const bankAccountDetails = {
    accountName: "Your Trading Account",
    bankName: "First National Bank",
    accountNumber: "1234567890",
    routingNumber: "021000021",
    swiftCode: "FNBKUS33",
    address: "123 Finance Street, New York, NY 10001"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Deposit Funds</span>
          </DialogTitle>
          <DialogDescription>
            Choose your preferred deposit method
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="crypto" className="flex items-center space-x-2">
              <Bitcoin className="h-4 w-4" />
              <span>Deposit Crypto</span>
            </TabsTrigger>
            <TabsTrigger value="fiat" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Deposit Fiat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                  <span>Deposit Crypto</span>
                </CardTitle>
                <CardDescription>
                  Send cryptocurrency directly to your wallet address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="Wallet QR Code" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address</label>
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm font-mono break-all">
                      {address}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => address && copyToClipboard(address, 'Wallet Address')}
                    >
                      {copiedField === 'Wallet Address' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Network Information */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Network: Base Sepolia (Testnet)
                      </p>
                      <p className="text-blue-600 dark:text-blue-400">
                        Only send ETH, USDC, or other Base Sepolia compatible tokens to this address. 
                        Sending tokens from other networks may result in permanent loss.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supported Tokens */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supported Tokens</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <span className="text-blue-500">Ξ</span>
                      <span>ETH</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <span className="text-blue-500">💵</span>
                      <span>USDC</span>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fiat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-green-500" />
                  <span>Deposit Fiat</span>
                </CardTitle>
                <CardDescription>
                  Transfer money from your bank account using these details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Account Name</span>
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1 text-sm">{bankAccountDetails.accountName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(bankAccountDetails.accountName, 'Account Name')}
                      >
                        {copiedField === 'Account Name' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span>Bank Name</span>
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1 text-sm">{bankAccountDetails.bankName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(bankAccountDetails.bankName, 'Bank Name')}
                      >
                        {copiedField === 'Bank Name' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number</label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1 text-sm font-mono">{bankAccountDetails.accountNumber}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(bankAccountDetails.accountNumber, 'Account Number')}
                      >
                        {copiedField === 'Account Number' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Routing Number</label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1 text-sm font-mono">{bankAccountDetails.routingNumber}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(bankAccountDetails.routingNumber, 'Routing Number')}
                      >
                        {copiedField === 'Routing Number' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">SWIFT Code</label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <span className="flex-1 text-sm font-mono">{bankAccountDetails.swiftCode}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(bankAccountDetails.swiftCode, 'SWIFT Code')}
                      >
                        {copiedField === 'SWIFT Code' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bank Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>Bank Address</span>
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <span className="flex-1 text-sm">{bankAccountDetails.address}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(bankAccountDetails.address, 'Bank Address')}
                    >
                      {copiedField === 'Bank Address' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                        Important Notice
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400">
                        Bank transfers typically take 1-3 business days to process. 
                        Include your wallet address ({formatAddress(address || '')}) in the transfer memo 
                        to ensure proper crediting to your account.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 mt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}