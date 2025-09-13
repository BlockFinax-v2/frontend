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
import { useWallet } from '@/hooks/use-wallet';
import { walletManager } from '@/lib/wallet';
import { Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoPath from "@/assets/logo.png";

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

  const onSubmit = async (data: CreateWalletFormData) => {
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
              <span>Create New Wallet</span>
            </div>
          </CardTitle>
          <p className="text-muted-foreground">
            Create a new BlockFinaX wallet to get started with trade finance
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wallet Name</Label>
              <Input
                id="name"
                placeholder="My Wallet"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              />
              <Label htmlFor="acceptTerms" className="text-sm">
                I understand that I am responsible for saving my seed phrase and that it cannot be recovered
              </Label>
            </div>


            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
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
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have a wallet?{' '}
              <Link href="/import-wallet" className="text-primary hover:underline">
                Import existing wallet
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
