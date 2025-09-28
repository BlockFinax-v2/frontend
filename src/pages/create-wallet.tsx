import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/use-wallet';
import { walletManager } from '@/lib/wallet';
import { Loader2, Eye, EyeOff, Copy, Check, ArrowLeft, ArrowRight, Shield, AlertTriangle, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logoPath } from "@/assets";

const createWalletSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Wallet name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateWalletFormData = z.infer<typeof createWalletSchema>;

export default function CreateWallet() {
  const [, setLocation] = useLocation();
  const { createWallet, isLoading } = useWallet();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'form' | 'mnemonic' | 'verify'>('form');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [verificationWords, setVerificationWords] = useState<number[]>([]);
  const [verificationInput, setVerificationInput] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CreateWalletFormData>({
    resolver: zodResolver(createWalletSchema),
  });

  const generateMnemonic = () => {
    const { mnemonic: newMnemonic } = walletManager.generateWallet();
    setMnemonic(newMnemonic);
    
    // Generate random word positions for verification
    const words = newMnemonic.split(' ');
    const randomPositions: number[] = [];
    while (randomPositions.length < 3) {
      const pos = Math.floor(Math.random() * words.length);
      if (!randomPositions.includes(pos)) {
        randomPositions.push(pos);
      }
    }
    randomPositions.sort((a, b) => a - b);
    setVerificationWords(randomPositions);
    setVerificationInput(new Array(3).fill(''));
  };

  const onSubmit = async (_data: CreateWalletFormData) => {
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Terms Required",
        description: "You must accept the terms to continue",
      });
      return;
    }
    
    try {
      generateMnemonic();
      setStep('mnemonic');
    } catch (error) {
      console.error('Error generating wallet:', error);
    }
  };

  const handleCopyMnemonic = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setMnemonicCopied(true);
      toast({
        title: "Mnemonic Copied",
        description: "Your seed phrase has been copied to clipboard",
      });
      setTimeout(() => setMnemonicCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy mnemonic",
      });
    }
  };

  const proceedToVerification = () => {
    setStep('verify');
  };

  const handleVerificationChange = (index: number, value: string) => {
    const newInput = [...verificationInput];
    newInput[index] = value.toLowerCase().trim();
    setVerificationInput(newInput);
  };

  const verifyMnemonic = async () => {
    const mnemonicWords = mnemonic.split(' ');
    const isValid = verificationWords.every((pos, index) => {
      return mnemonicWords[pos] === verificationInput[index];
    });

    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "The words you entered don't match your seed phrase",
      });
      return;
    }

    try {
      const formData = getValues();
      await createWallet(formData.password, formData.name);
      
      toast({
        title: "Wallet Created Successfully!",
        description: "Your wallet has been created and is ready to use",
      });
      
      setLocation('/wallet');
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  if (step === 'mnemonic') {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950 p-4">
        <Card className="w-full max-w-2xl bg-slate-900 border-emerald-500/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src={logoPath}
                  alt="BlockFinaX Logo"
                  className="w-8 h-8 object-contain invert"
                />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  Backup Your Seed Phrase
                </CardTitle>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 mt-1">
                  <Network className="w-3 h-3 mr-1" />
                  Critical Security Step
                </Badge>
              </div>
            </div>
            <p className="text-slate-400">
              This is your wallet's seed phrase. Write it down and store it safely.
              You'll need it to recover your wallet.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Warning */}
            <Alert className="bg-gradient-to-r from-red-950/50 to-orange-950/50 border-red-500/30 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                <div className="space-y-2">
                  <h4 className="font-semibold">Critical Security Warning</h4>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• Never share your seed phrase with anyone</li>
                    <li>• Store it offline in a secure location</li>
                    <li>• Anyone with access can control your funds</li>
                    <li>• BlockFinaX cannot recover lost seed phrases</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Mnemonic Display */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm">
                {mnemonic.split(' ').map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 bg-slate-900/50 rounded-lg border border-slate-600/30"
                  >
                    <span className="text-xs text-slate-500 w-6 font-mono">
                      {index + 1}
                    </span>
                    <span className="font-mono text-slate-200">{word}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMnemonic}
                className="absolute top-3 right-3 border-slate-600 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-white"
              >
                {mnemonicCopied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={proceedToVerification}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-lg hover:shadow-xl"
              >
                I've Saved My Seed Phrase
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950 p-4">
        <Card className="w-full max-w-md bg-slate-900 border-emerald-500/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src={logoPath}
                  alt="BlockFinaX Logo"
                  className="w-8 h-8 object-contain invert"
                />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">
                  Verify Your Seed Phrase
                </CardTitle>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  Security Verification
                </Badge>
              </div>
            </div>
            <p className="text-slate-400">
              Please enter the requested words to verify you've saved your seed phrase correctly.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              {verificationWords.map((wordIndex, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-slate-300">Word #{wordIndex + 1}</Label>
                  <Input
                    placeholder={`Enter word ${wordIndex + 1}`}
                    value={verificationInput[index]}
                    onChange={(e) => handleVerificationChange(index, e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                  />
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep('mnemonic')}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={verifyMnemonic}
                disabled={verificationInput.some(word => !word.trim()) || isLoading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Wallet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-900 to-emerald-950 p-4">
      <div className="w-full max-w-md">
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
              Create New Wallet
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Create a secure BlockFinaX wallet to get started with trade finance
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
                  placeholder="e.g., My Trade Finance Wallet"
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
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
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
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
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
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

              <div className="space-y-4">
                <Alert className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 border-amber-500/30 backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-200">
                    <span className="font-semibold">Security Notice:</span> Your wallet will be encrypted with this password.
                    Make sure to remember it as it cannot be recovered.
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    className="mt-0.5 border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-slate-300">
                    I understand that I am responsible for securely storing my wallet password and seed phrase.
                    I acknowledge that BlockFinaX cannot recover my wallet if I lose this information.
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full h-11 text-base font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  <>
                    Create Wallet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have a wallet?{' '}
                <Link href="/import-wallet" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">
                  Import existing wallet
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
