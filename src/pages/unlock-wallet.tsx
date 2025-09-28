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
import { Separator } from '@/components/ui/separator';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Eye, EyeOff, ArrowLeft, Unlock, Trash2, AlertTriangle, Shield, Network } from 'lucide-react';
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
              Unlock Wallet
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Enter your password to access your BlockFinaX wallet
            </p>
          </CardHeader>

          <CardContent className="pt-0 relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center text-slate-300">
                  <Shield className="mr-2 h-4 w-4 text-emerald-400" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your wallet password"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 border-0 shadow-lg hover:shadow-xl"
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
                <p className="text-sm text-slate-500">
                  Don't have a wallet?{' '}
                  <Link href="/create-wallet" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">
                    Create new wallet
                  </Link>
                  {' or '}
                  <Link href="/import-wallet" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline">
                    import existing
                  </Link>
                </p>
              </div>

              <Separator className="bg-slate-700" />

              {/* Enhanced Delete Wallet Section */}
              <div className="pt-4">
                {!showDeleteConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Wallet
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Alert className="bg-gradient-to-r from-red-950/50 to-orange-950/50 border-red-500/30 backdrop-blur-sm">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        <strong>Warning:</strong> This will permanently delete your wallet. Make sure you have your seed phrase backed up!
                      </AlertDescription>
                    </Alert>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 h-10 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteWallet}
                        className="flex-1 h-10 bg-red-600 hover:bg-red-500"
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
