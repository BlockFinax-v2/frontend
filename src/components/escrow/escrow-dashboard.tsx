import { SubWalletManager } from '../wallet/sub-wallet-manager';
import { useWallet } from '@/hooks/use-wallet';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export function EscrowDashboard() {
  const { isUnlocked } = useWallet();

  if (!isUnlocked) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Wallet Not Unlocked</h3>
            <p className="text-muted-foreground">Please unlock your wallet to access sub-wallet management.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <SubWalletManager />;
}