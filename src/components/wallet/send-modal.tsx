import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransactions } from '@/hooks/use-transactions';
import { NETWORKS, getNetworkById } from '@/lib/networks';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const sendSchema = z.object({
  to: z.string().min(1, 'Recipient address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount: z.string().min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  networkId: z.number().min(1, 'Network is required'),
  token: z.string().min(1, 'Token is required'),
});

type SendFormData = z.infer<typeof sendSchema>;

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNetworkId?: number;
}

// Token definitions for different networks - standardized for Base Sepolia
const TOKENS = {
  1: [ // Base Sepolia (Network ID 1 = Base Sepolia chainId 84532)
    { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
  ],
  2: [ // Polygon Mumbai
    { symbol: 'MATIC', name: 'Polygon', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97', decimals: 6 },
  ],
  3: [ // BSC Testnet
    { symbol: 'BNB', name: 'Binance Coin', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x64544969ed7EBf5f083679233325356EbE738930', decimals: 6 },
  ],
  4: [ // Base Sepolia
    { symbol: 'ETH', name: 'Ethereum', address: 'native', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
  ],
};

export function SendModal({ isOpen, onClose, defaultNetworkId = 1 }: SendModalProps) {
  const { toast } = useToast();
  const [selectedNetworkId, setSelectedNetworkId] = useState(defaultNetworkId);
  const [selectedToken, setSelectedToken] = useState('native');
  const { 
    sendTransaction, 
    isSendingTransaction, 
    gasEstimate, 
    estimateGas, 
    isEstimatingGas,
    balance,
    tokenBalances,
    formatCrypto,
    formatCurrency
  } = useTransactions(selectedNetworkId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<SendFormData>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      networkId: selectedNetworkId,
      to: '',
      amount: '',
      token: 'native'
    }
  });

  const getAvailableTokens = () => {
    return TOKENS[selectedNetworkId as keyof typeof TOKENS] || TOKENS[1];
  };

  const getSelectedTokenInfo = () => {
    const tokens = getAvailableTokens();
    return tokens.find(token => 
      selectedToken === 'native' ? token.address === 'native' : token.address === selectedToken
    ) || tokens[0];
  };

  const watchedValues = watch();
  const selectedNetwork = getNetworkById(selectedNetworkId);

  // Estimate gas when form values change
  useEffect(() => {
    if (watchedValues.to && watchedValues.amount && selectedNetworkId) {
      const tokenInfo = getSelectedTokenInfo();
      const tokenAddress = tokenInfo.address === 'native' ? undefined : tokenInfo.address;
      const tokenDecimals = tokenInfo.address === 'native' ? undefined : tokenInfo.decimals;
      
      estimateGas(watchedValues.to, watchedValues.amount, selectedNetworkId, tokenAddress, tokenDecimals);
    }
  }, [watchedValues.to, watchedValues.amount, selectedNetworkId, selectedToken, estimateGas]);

  // Update form when network changes
  useEffect(() => {
    setValue('networkId', selectedNetworkId);
    setSelectedToken('native'); // Reset to native token when network changes
    setValue('token', 'native');
  }, [selectedNetworkId, setValue]);

  // Update form when token changes
  useEffect(() => {
    setValue('token', selectedToken);
  }, [selectedToken, setValue]);

  const onSubmit = async (data: SendFormData) => {
    try {
      const tokenInfo = getSelectedTokenInfo();
      await sendTransaction({
        to: data.to,
        amount: data.amount,
        networkId: data.networkId,
        tokenAddress: tokenInfo.address === 'native' ? undefined : tokenInfo.address,
        tokenDecimals: tokenInfo.decimals
      });
      
      reset();
      setSelectedToken('native');
      onClose();
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const calculateTotal = () => {
    const amount = parseFloat(watchedValues.amount || '0');
    const gas = parseFloat(gasEstimate || '0');
    const tokenInfo = getSelectedTokenInfo();
    
    // For token transactions, don't add gas to token amount
    if (tokenInfo.address !== 'native') {
      return { tokenAmount: amount, gasAmount: gas };
    }
    
    // For native token transactions, add gas to amount
    return { tokenAmount: amount + gas, gasAmount: 0 };
  };

  const getTokenBalance = () => {
    const tokenInfo = getSelectedTokenInfo();
    
    if (tokenInfo.address === 'native') {
      return balance;
    }
    
    // Find token balance in tokenBalances array
    const tokenBalance = tokenBalances.find(tb => 
      tb.token.address.toLowerCase() === tokenInfo.address.toLowerCase()
    );
    
    return tokenBalance ? {
      balance: tokenBalance.balance,
      symbol: tokenBalance.token.symbol
    } : { balance: '0', symbol: tokenInfo.symbol };
  };

  const isInsufficientBalance = () => {
    const tokenInfo = getSelectedTokenInfo();
    const amounts = calculateTotal();
    const tokenAmount = parseFloat(watchedValues.amount || '0');
    const gasAmount = parseFloat(gasEstimate || '0');
    
    // For token transactions, check both token balance and ETH balance for gas
    if (tokenInfo.address !== 'native') {
      const tokenBalance = getTokenBalance();
      
      // Check if we have enough tokens
      if (!tokenBalance || tokenAmount > parseFloat(tokenBalance.balance)) {
        return true;
      }
      
      // Check if we have enough ETH for gas fees
      if (!balance || gasAmount > parseFloat(balance.balance)) {
        return true;
      }
      
      return false;
    }
    
    // For native token transactions, check total against native balance
    if (!balance) return true;
    return amounts.tokenAmount > parseFloat(balance.balance);
  };

  if (!selectedNetwork) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <div className="w-7 sm:w-8 h-7 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <i className="fas fa-paper-plane text-primary text-xs sm:text-sm"></i>
            </div>
            <span>Send Crypto</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          {/* Network Selection */}
          <div className="space-y-2">
            <Label>Network</Label>
            <Select 
              value={selectedNetworkId.toString()} 
              onValueChange={(value) => setSelectedNetworkId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedNetwork.color }}
                    />
                    <span>{selectedNetwork.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((network) => (
                  <SelectItem key={network.id} value={network.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: network.color }}
                      />
                      <span>{network.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token Selection */}
          <div className="space-y-2">
            <Label>Token</Label>
            <Select 
              value={selectedToken} 
              onValueChange={setSelectedToken}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{getSelectedTokenInfo().symbol}</span>
                    <span className="text-sm text-muted-foreground">({getSelectedTokenInfo().name})</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getAvailableTokens().map((token) => (
                  <SelectItem 
                    key={token.address} 
                    value={token.address === 'native' ? 'native' : token.address}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-sm text-muted-foreground">({token.name})</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="to">To Address</Label>
            <Input
              id="to"
              placeholder="0x..."
              {...register('to')}
              className={errors.to ? 'border-destructive' : ''}
            />
            {errors.to && (
              <p className="text-sm text-destructive">{errors.to.message}</p>
            )}
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0.00"
                {...register('amount')}
                className={`pr-16 ${errors.amount ? 'border-destructive' : ''}`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-sm font-medium text-muted-foreground">
                  {getSelectedTokenInfo().symbol}
                </span>
              </div>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {(() => {
              const currentBalance = getTokenBalance();
              return currentBalance && (
                <p className="text-sm text-muted-foreground">
                  Balance: {formatCrypto(currentBalance.balance, currentBalance.symbol)}
                </p>
              );
            })()}
          </div>
          
          {/* Transaction Summary */}
          {(watchedValues.amount || gasEstimate) && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {watchedValues.amount ? 
                    formatCrypto(watchedValues.amount, getSelectedTokenInfo().symbol) : 
                    '0.00'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">
                  {isEstimatingGas ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    formatCrypto(gasEstimate || '0', selectedNetwork.symbol)
                  )}
                </span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Total</span>
                <div className="text-right">
                  {(() => {
                    const tokenInfo = getSelectedTokenInfo();
                    const amounts = calculateTotal();
                    
                    if (tokenInfo.address !== 'native') {
                      // For token transactions, show token amount + gas fee separately
                      return (
                        <div className="space-y-1">
                          <div className={isInsufficientBalance() ? 'text-destructive' : ''}>
                            {formatCrypto(amounts.tokenAmount.toString(), tokenInfo.symbol)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            + {formatCrypto(amounts.gasAmount.toString(), selectedNetwork.symbol)} gas
                          </div>
                        </div>
                      );
                    } else {
                      // For native transactions, show combined total
                      return (
                        <span className={isInsufficientBalance() ? 'text-destructive' : ''}>
                          {formatCrypto(amounts.tokenAmount.toString(), selectedNetwork.symbol)}
                        </span>
                      );
                    }
                  })()}
                </div>
              </div>
              {isInsufficientBalance() && (
                <p className="text-sm text-destructive">Insufficient balance</p>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <Button 
            type="submit"
            className="w-full"
            disabled={!isValid || isSendingTransaction || isInsufficientBalance()}
          >
            {isSendingTransaction ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send Transaction'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
