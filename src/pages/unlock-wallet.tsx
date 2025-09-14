import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Eye, EyeOff, ArrowLeft, Unlock, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { logoPath } from "@/assets";

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type UnlockFormData = z.infer<typeof unlockSchema>;

export default function UnlockWallet() {
  const [, setLocation] = useLocation();
  const { unlockWallet, isLoading, deleteWallet } = useWallet();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
  });

  const onSubmit = async (data: UnlockFormData) => {
    try {
      const wallet = await unlockWallet(data.password);
      if (wallet) {
        // Force navigation to wallet page immediately
        console.log('Navigating to wallet page...');
        window.location.replace('/wallet');
      }
    } catch (error) {
      setError('password', {
        type: 'manual',
        message: 'Invalid password. Please try again.',
      });
    }
  };

  const handleDeleteWallet = () => {
    deleteWallet();
    setLocation('/');
  };

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
              Unlock Wallet
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Enter your password to access your BlockFinaX wallet
            </p>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your wallet password"
                    {...register('password')}
                    className={`h-11 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1.5 h-8 w-8 p-0"
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

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 text-base font-medium"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking Wallet...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock Wallet
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have a wallet?{' '}
                  <Link href="/create-wallet" className="text-primary hover:underline font-medium">
                    Create new wallet
                  </Link>
                  {' or '}
                  <Link href="/import-wallet" className="text-primary hover:underline font-medium">
                    import existing
                  </Link>
                </p>
              </div>

              {/* Enhanced Delete Wallet Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {!showDeleteConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Wallet
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-destructive">
                        <strong>Warning:</strong> This will permanently delete your wallet. Make sure you have your seed phrase backed up!
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 h-10"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteWallet}
                        className="flex-1 h-10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
