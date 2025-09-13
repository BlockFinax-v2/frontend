import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletManager, type WalletBalance, type TransactionData } from '@/lib/wallet';
import { fallbackProvider } from '@/lib/fallback-provider';
import { tokenManager, getTokensForNetwork } from '@/lib/tokens';
import { NETWORKS } from '@/lib/networks';
import { useWallet } from './use-wallet';
import { useWalletBalances } from './use-wallet-balances';
import { useToast } from '@/hooks/use-toast';

export function useTransactions(networkId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { address } = useWallet();
  
  // Use the new real-time balance system
  const walletBalances = useWalletBalances(networkId);
  
  // Legacy compatibility - map new balance data to old format
  const balance = useMemo(() => {
    if (!walletBalances.selectedNetworkBalance) return null;
    const networkBalance = walletBalances.selectedNetworkBalance;
    return {
      balance: networkBalance.nativeBalance,
      networkId: networkBalance.networkId,
      symbol: networkBalance.nativeSymbol
    };
  }, [walletBalances.selectedNetworkBalance]);

  const allBalances = useMemo(() => {
    return walletBalances.balances.map(balance => {
      const network = NETWORKS.find(n => n.id === balance.networkId);
      const balanceValue = parseFloat(balance.nativeBalance);
      const usdValue = balanceValue * 2400; // ETH price approximation
      
      return {
        networkId: balance.networkId,
        balance: balance.nativeBalance,
        symbol: balance.nativeSymbol,
        usdValue,
        network
      };
    }).filter(b => parseFloat(b.balance) > 0);
  }, [walletBalances.balances]);

  const tokenBalances = useMemo(() => {
    if (!walletBalances.selectedNetworkBalance) return [];
    return walletBalances.selectedNetworkBalance.tokenBalances;
  }, [walletBalances.selectedNetworkBalance]);

  // Get transaction history - simplified to prevent fetch errors
  const transactionsQuery = useQuery({
    queryKey: ['transactions', networkId, address],
    queryFn: async () => {
      // Return empty array to show clean "No transactions yet" state
      return [];
    },
    enabled: !!address,
    refetchInterval: false,
  });

  // Send transaction mutation
  const sendTransactionMutation = useMutation({
    mutationFn: async ({ 
      to, 
      amount, 
      networkId, 
      tokenAddress, 
      tokenDecimals 
    }: { 
      to: string; 
      amount: string; 
      networkId: number; 
      tokenAddress?: string; 
      tokenDecimals?: number; 
    }) => {
      if (tokenAddress && tokenDecimals) {
        return walletManager.sendTokenTransaction(to, amount, networkId, tokenAddress, tokenDecimals);
      } else {
        return walletManager.sendTransaction(to, amount, networkId);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Sent",
        description: `Transaction hash: ${data.hash.slice(0, 10)}...`,
      });
      
      // Refresh real-time balances after transaction
      walletBalances.refreshAll();
      
      // Legacy query invalidation for compatibility
      queryClient.invalidateQueries({ queryKey: ['transactions', networkId] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Gas estimation
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  const estimateGas = useCallback(async (to: string, amount: string, networkId: number, tokenAddress?: string, tokenDecimals?: number) => {
    if (!to || !amount || !walletManager.isUnlocked()) return;

    setIsEstimatingGas(true);
    try {
      const estimate = await walletManager.estimateGasFee(to, amount, networkId, tokenAddress, tokenDecimals);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setGasEstimate('0.001'); // Fallback
    } finally {
      setIsEstimatingGas(false);
    }
  }, []);

  // Calculate total portfolio value including ETH and tokens
  const totalValue = useMemo(() => {
    return walletBalances.totalValue;
  }, [walletBalances.totalValue]);



  // Refresh all data
  const refreshAll = useCallback(() => {
    walletBalances.refreshAll();
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [walletBalances, queryClient]);

  return {
    // Balance data
    balance,
    allBalances,
    tokenBalances,
    totalValue,
    isLoadingBalance: walletBalances.isLoading,
    balanceError: walletBalances.error,

    // Transaction data
    transactions: transactionsQuery.data || [],
    isLoadingTransactions: transactionsQuery.isLoading,
    transactionsError: transactionsQuery.error,

    // Send transaction
    sendTransaction: sendTransactionMutation.mutate,
    isSendingTransaction: sendTransactionMutation.isPending,
    sendTransactionError: sendTransactionMutation.error,

    // Gas estimation
    gasEstimate,
    isEstimatingGas,
    estimateGas,

    // Utilities
    formatCurrency: walletBalances.formatCurrency,
    formatCrypto: walletBalances.formatCrypto,
    refreshAll,
  };
}
