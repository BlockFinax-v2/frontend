import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import logoPath from "@/assets/logo.png";

const importWalletSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Wallet name is required'),
  mnemonic: z.string().optional(),
  privateKey: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.mnemonic || data.privateKey, {
  message: "Either mnemonic phrase or private key is required",
  path: ["mnemonic"],
});

type ImportWalletFormData = z.infer<typeof importWalletSchema>;

export default function ImportWallet() {
  const [, setLocation] = useLocation();
  const { importWallet, isLoading } = useWallet();
  
  const [importType, setImportType] = useState<'mnemonic' | 'private_key'>('mnemonic');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    clearErrors,
  } = useForm<ImportWalletFormData>({
    resolver: zodResolver(importWalletSchema),
    defaultValues: {
      name: 'Imported Wallet'
    }
  });

  const mnemonicValue = watch('mnemonic');
  const privateKeyValue = watch('privateKey');

  const onSubmit = async (data: ImportWalletFormData) => {
    try {
      const input = importType === 'mnemonic' ? data.mnemonic! : data.privateKey!;
      
      await importWallet(data.password, input, importType, data.name);
      setLocation('/wallet');
    } catch (error) {
      console.error('Error importing wallet:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setImportType(value as 'mnemonic' | 'private_key');
    clearErrors();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <img 
                src={logoPath} 
                alt="BlockFinaX Logo" 
                className="w-8 h-8 object-contain"
              />
              <span>Import Wallet</span>
            </div>
          </CardTitle>
          <p className="text-muted-foreground">
            Import your existing wallet into BlockFinaX using a seed phrase or private key
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wallet Name</Label>
              <Input
                id="name"
                placeholder="Imported Wallet"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Import Method</Label>
              <Tabs value={importType} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mnemonic">Seed Phrase</TabsTrigger>
                  <TabsTrigger value="private_key">Private Key</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mnemonic" className="space-y-2">
                  <Label htmlFor="mnemonic">Seed Phrase (12 or 24 words)</Label>
                  <Textarea
                    id="mnemonic"
                    placeholder="Enter your seed phrase separated by spaces"
                    rows={4}
                    {...register('mnemonic')}
                    className={errors.mnemonic ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 12 or 24-word recovery phrase separated by spaces
                  </p>
                </TabsContent>
                
                <TabsContent value="private_key" className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <div className="relative">
                    <Input
                      id="privateKey"
                      type={showPrivateKey ? 'text' : 'password'}
                      placeholder="0x..."
                      {...register('privateKey')}
                      className={errors.privateKey ? 'border-destructive' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your private key (64 characters starting with 0x)
                  </p>
                </TabsContent>
              </Tabs>
              
              {errors.mnemonic && importType === 'mnemonic' && (
                <p className="text-sm text-destructive">{errors.mnemonic.message}</p>
              )}
              {errors.privateKey && importType === 'private_key' && (
                <p className="text-sm text-destructive">{errors.privateKey.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Set Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a strong password"
                  {...register('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Security Warning */}
            <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <i className="fas fa-shield-alt text-warning text-sm mt-0.5"></i>
                <div className="text-sm">
                  <p className="font-medium text-warning mb-1">Security Notice</p>
                  <p className="text-muted-foreground text-xs">
                    Make sure you're in a secure environment. Your seed phrase and private key give full access to your wallet.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={
                isLoading || 
                (importType === 'mnemonic' ? !mnemonicValue?.trim() : !privateKeyValue?.trim())
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                'Import Wallet'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have a wallet?{' '}
              <Link href="/create-wallet" className="text-primary hover:underline">
                Create new wallet
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
