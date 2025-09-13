import { useState, useEffect, useCallback } from 'react';
import { walletManager } from '@/lib/wallet';
import { secureStorage, type StoredWallet, type WalletSettings } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export interface WalletState {
  isUnlocked: boolean;
  wallet: StoredWallet | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isUnlocked: false,
    wallet: null,
    address: null,
    isLoading: true,
    error: null
  });

  const [settings, setSettings] = useState<WalletSettings>(secureStorage.loadSettings());
  const { toast } = useToast();

  // Check wallet status on mount
  useEffect(() => {
    checkWalletStatus();
  }, []);

  // Auto-lock functionality
  useEffect(() => {
    if (!settings.autoLock || !state.isUnlocked) return;

    const timeout = setTimeout(() => {
      lockWallet();
      toast({
        title: "Wallet Locked",
        description: "Your wallet has been automatically locked for security.",
      });
    }, settings.autoLockTimeout * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [state.isUnlocked, settings.autoLock, settings.autoLockTimeout]);

  const checkWalletStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let isUnlocked = walletManager.isUnlocked();
      let address = walletManager.getAddress();
      let wallet: StoredWallet | null = null;

      // If wallet manager says not unlocked, check persistent state
      if (!isUnlocked && secureStorage.isWalletUnlocked()) {
        // Trust the persistent unlock state for UI purposes
        const unlockedData = secureStorage.getWalletUnlockedData();
        if (unlockedData) {
          isUnlocked = true;
          address = unlockedData.address;
          // Load wallet data for display (non-sensitive operations only)
          try {
            wallet = secureStorage.loadWallet();
          } catch (error) {
            // If can't load wallet data, still show as unlocked with basic info
            wallet = {
              address: unlockedData.address,
              name: unlockedData.name,
              encryptedPrivateKey: '',
              isImported: false,
              createdAt: new Date().toISOString()
            };
          }
        }
      } else if (isUnlocked) {
        wallet = secureStorage.loadWallet();
      }

      setState({
        isUnlocked,
        wallet,
        address,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const createWallet = useCallback(async (password: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const wallet = await walletManager.createWallet(password, name);
      const address = walletManager.getAddress();
      
      setState({
        isUnlocked: true,
        wallet,
        address,
        isLoading: false,
        error: null
      });

      toast({
        title: "Wallet Created",
        description: "Your new wallet has been created successfully.",
      });

      return wallet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create wallet';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      throw error;
    }
  }, [toast]);

  const importWallet = useCallback(async (
    password: string,
    input: string,
    type: 'mnemonic' | 'private_key',
    name?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const wallet = await walletManager.importWallet(password, input, type, name);
      const address = walletManager.getAddress();
      
      setState({
        isUnlocked: true,
        wallet,
        address,
        isLoading: false,
        error: null
      });

      toast({
        title: "Wallet Imported",
        description: "Your wallet has been imported successfully.",
      });

      return wallet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import wallet';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      throw error;
    }
  }, [toast]);

  const unlockWallet = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const wallet = await walletManager.unlockWallet(password);
      const address = walletManager.getAddress();
      
      // Persist wallet unlock state
      if (wallet) {
        secureStorage.setWalletUnlocked(wallet);
      }
      
      setState({
        isUnlocked: true,
        wallet,
        address,
        isLoading: false,
        error: null
      });

      toast({
        title: "Wallet Unlocked",
        description: "Welcome back!",
      });

      return wallet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlock wallet';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      throw error;
    }
  }, [toast]);

  const lockWallet = useCallback(() => {
    walletManager.lockWallet();
    secureStorage.clearWalletUnlocked();
    setState({
      isUnlocked: false,
      wallet: null,
      address: null,
      isLoading: false,
      error: null
    });
  }, []);

  const deleteWallet = useCallback(() => {
    secureStorage.deleteWallet();
    secureStorage.clearWalletUnlocked();
    walletManager.lockWallet();
    setState({
      isUnlocked: false,
      wallet: null,
      address: null,
      isLoading: false,
      error: null
    });

    toast({
      title: "Wallet Deleted",
      description: "Your wallet has been permanently deleted.",
    });
  }, [toast]);

  const updateSettings = useCallback((newSettings: Partial<WalletSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    secureStorage.saveSettings(updatedSettings);
  }, [settings]);

  const exportPrivateKey = useCallback(() => {
    try {
      return walletManager.exportPrivateKey();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export private key",
      });
      throw error;
    }
  }, [toast]);

  const exportMnemonic = useCallback(() => {
    try {
      return walletManager.exportMnemonic();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export mnemonic",
      });
      throw error;
    }
  }, [toast]);

  const walletExists = useCallback(() => {
    return secureStorage.walletExists();
  }, []);

  return {
    ...state,
    settings,
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    deleteWallet,
    updateSettings,
    exportPrivateKey,
    exportMnemonic,
    walletExists,
    checkWalletStatus
  };
}
