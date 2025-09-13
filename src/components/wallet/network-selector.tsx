import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { NETWORKS, getNetworkById } from '@/lib/networks';
import { useWallet } from '@/hooks/use-wallet';

interface NetworkSelectorProps {
  selectedNetworkId: number;
  onNetworkChange: (networkId: number) => void;
  className?: string;
}

export function NetworkSelector({ selectedNetworkId, onNetworkChange, className = '' }: NetworkSelectorProps) {
  const { updateSettings } = useWallet();
  const selectedNetwork = getNetworkById(selectedNetworkId);

  const handleNetworkChange = (networkId: number) => {
    onNetworkChange(networkId);
    updateSettings({ selectedNetworkId: networkId });
  };

  if (!selectedNetwork) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center space-x-2 ${className}`}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedNetwork.color }}
          />
          <span className="text-sm font-medium">{selectedNetwork.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {NETWORKS.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => handleNetworkChange(network.id)}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: network.color }}
            />
            <div className="flex-1">
              <div className="font-medium">{network.name}</div>
              <div className="text-xs text-muted-foreground">{network.symbol}</div>
            </div>
            {network.id === selectedNetworkId && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
