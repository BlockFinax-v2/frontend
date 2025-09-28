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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Eye, EyeOff, ArrowLeft, Download, Key, AlertTriangle, Network } from 'lucide-react';
import { logoPath } from "@/assets";

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
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950 p-4">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white hover:bg-slate-800/50">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="shadow-2xl border-0 bg-slate-900/90 border-emerald-500/20 backdrop-blur-xl relative overflow-hidden">
          {/* Animated border */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 animate-pulse" />
          <div className="absolute inset-[1px] bg-slate-900 rounded-lg" />

          <CardHeader className="text-center pb-4 relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <img
                src={logoPath}
                alt="BlockFinaX Logo"
                className="w-12 h-12 object-contain invert"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Import Wallet
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Import your existing wallet into BlockFinaX using a seed phrase or private key
            </p>
          </CardHeader>

          <CardContent className="pt-0 relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Wallet Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., My Imported Wallet"
                  {...register('name')}
                  className={`h-11 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500/50 ${errors.name ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-slate-300">Import Method</Label>
                <Tabs value={importType} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
                    <TabsTrigger value="mnemonic" className="flex items-center space-x-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                      <Download className="h-4 w-4" />
                      <span>Seed Phrase</span>
                    </TabsTrigger>
                    <TabsTrigger value="private_key" className="flex items-center space-x-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                      <Key className="h-4 w-4" />
                      <span>Private Key</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mnemonic" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="mnemonic" className="text-sm font-medium text-slate-300">
                        Seed Phrase
                        <Badge className="ml-2 text-xs bg-slate-700 text-slate-300">
                          12-24 words
                        </Badge>
                      </Label>
                      <Textarea
                        id="mnemonic"
                        placeholder="Enter your 12-24 word seed phrase separated by spaces"
                        className={`min-h-[100px] resize-none bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500/50 ${errors.mnemonic ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}`}
                        {...register('mnemonic')}
                      />
                      {errors.mnemonic && (
                        <p className="text-sm text-red-400 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors.mnemonic.message}
                        </p>
                      )}
                      <Alert className="bg-gradient-to-r from-blue-950/50 to-cyan-950/50 border-blue-500/30 backdrop-blur-sm">
                        <AlertDescription className="text-blue-200 text-sm">
                          Enter each word separated by a single space. Make sure the order is correct.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>

                  <TabsContent value="private_key" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="privateKey" className="text-sm font-medium text-slate-300">
                        Private Key
                        <Badge className="ml-2 text-xs bg-slate-700 text-slate-300">
                          Hex format
                        </Badge>
                      </Label>
                      <div className="relative">
                        <Input
                          id="privateKey"
                          type={showPrivateKey ? 'text' : 'password'}
                          placeholder="Enter your private key (0x...)"
                          className={`h-11 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500/50 ${errors.privateKey ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}`}
                          {...register('privateKey')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1.5 h-8 w-8 p-0 text-slate-400 hover:text-white"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                        >
                          {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.privateKey && (
                        <p className="text-sm text-red-400 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors.privateKey.message}
                        </p>
                      )}
                      <Alert className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border-amber-500/30 backdrop-blur-sm">
                        <AlertDescription className="text-amber-200 text-sm">
                          Private keys should start with "0x" followed by 64 hexadecimal characters.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter a strong password"
                    {...register('password')}
                    className={`h-11 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500/50 ${errors.password ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1.5 h-8 w-8 p-0 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={`h-11 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500/50 ${errors.confirmPassword ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1.5 h-8 w-8 p-0 text-slate-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Separator className="bg-slate-700" />

              {/* Enhanced Security Warning */}
              <Alert className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border-amber-500/30 backdrop-blur-sm">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  <strong>Security Notice:</strong> Make sure you're in a secure environment. Your seed phrase and private key give full access to your wallet.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (importType === 'mnemonic' ? !mnemonicValue?.trim() : !privateKeyValue?.trim())
                }
                className="w-full h-11 text-base font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing Wallet...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import Wallet
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Don't have a wallet yet?{' '}
                <Link href="/create-wallet" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">
                  Create new wallet
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
