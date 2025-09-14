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
import { useWallet } from '@/hooks/use-wallet';
import { walletManager } from '@/lib/wallet';
import { Loader2, Eye, EyeOff, Copy, Check, ArrowLeft, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <img 
                  src={logoPath} 
                  alt="BlockFinaX Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span>Backup Your Seed Phrase</span>
              </div>
            </CardTitle>
            <p className="text-muted-foreground">
              This is your wallet's seed phrase. Write it down and store it safely. 
              You'll need it to recover your wallet.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Warning */}
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="fas fa-exclamation-triangle text-destructive text-lg mt-0.5"></i>
                <div>
                  <h4 className="font-semibold text-destructive mb-1">Important Security Notice</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Never share your seed phrase with anyone</li>
                    <li>• Store it offline in a secure location</li>
                    <li>• Anyone with access to this phrase can access your funds</li>
                    <li>• We cannot recover your wallet without this phrase</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mnemonic Display */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
                {mnemonic.split(' ').map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-background rounded border"
                  >
                    <span className="text-xs text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <span className="font-mono">{word}</span>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMnemonic}
                className="absolute top-2 right-2"
              >
                {mnemonicCopied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={proceedToVerification}
                className="flex-1"
              >
                I've Saved My Seed Phrase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">
              Verify Your Seed Phrase
            </CardTitle>
            <p className="text-muted-foreground">
              Please enter the requested words to verify you've saved your seed phrase correctly.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {verificationWords.map((wordIndex, index) => (
                <div key={index} className="space-y-2">
                  <Label>Word #{wordIndex + 1}</Label>
                  <Input
                    placeholder={`Enter word ${wordIndex + 1}`}
                    value={verificationInput[index]}
                    onChange={(e) => handleVerificationChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep('mnemonic')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={verifyMnemonic}
                disabled={verificationInput.some(word => !word.trim()) || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Wallet'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 p-2 bg-primary/10 rounded-full flex items-center justify-center">
              <img 
                src={logoPath} 
                alt="BlockFinaX Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Wallet
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Create a secure BlockFinaX wallet to get started with trade finance
            </p>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Wallet Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., My Trade Finance Wallet"
                  {...register('name')}
                  className={`h-11 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter a strong password"
                    {...register('password')}
                    className={`h-11 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={`h-11 pr-10 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">Security Notice:</span> Your wallet will be encrypted with this password. 
                    Make sure to remember it as it cannot be recovered.
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I understand that I am responsible for securely storing my wallet password and seed phrase. 
                    I acknowledge that BlockFinaX cannot recover my wallet if I lose this information.
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !acceptTerms} 
                className="w-full h-11 text-base font-medium"
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have a wallet?{' '}
                <Link href="/import-wallet" className="text-primary hover:underline font-medium">
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
