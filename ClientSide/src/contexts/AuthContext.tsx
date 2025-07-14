// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  signature: string | null;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  authStatus: 'idle' | 'signing' | 'verifying' | 'authenticated' | 'failed';
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://emmanueltigo.pythonanywhere.com';
const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID!; // e.g. from .env

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'signing' | 'verifying' | 'authenticated' | 'failed'>('idle');

  const MESSAGE = 'Login to WhisperNet';

  // --- WalletConnect v2 login helper ---
  const walletConnectLoginV2 = async (): Promise<{ addr: string; sig: string }> => {
    // Initialize WC v2 provider
    const provider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID,
      chains: [1],               // Mainnet; replace with [5] for Goerli, etc.
      methods: ['eth_requestAccounts', 'personal_sign'],
      showQrModal: true,
    });

    // Create session
    await provider.enable();

    // Wrap with ethers
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    const signer = ethersProvider.getSigner();
    const userAddress = await signer.getAddress();
    const userSignature = await signer.signMessage(MESSAGE);

    return { addr: userAddress, sig: userSignature };
  };

  // --- Unified login() ---
  const login = async () => {
    setLoading(true);
    setAuthStatus('signing');

    let userAddress: string | undefined;
    let userSignature: string | undefined;

    try {
      // 1) Try MetaMask injection
      if ((window as any).ethereum) {
        try {
          const accounts: string[] = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            userAddress = accounts[0];
            userSignature = await (window as any).ethereum.request({
              method: 'personal_sign',
              params: [MESSAGE, userAddress],
            });
          }
        } catch (err) {
          console.warn('MetaMask login failed, falling back to WalletConnect', err);
        }
      }

      // 2) Fallback to WalletConnect v2
      if (!userSignature) {
        setAuthStatus('signing');
        const wc = await walletConnectLoginV2();
        userAddress = wc.addr;
        userSignature = wc.sig;
      }

      if (!userAddress || !userSignature) {
        throw new Error('No wallet available to sign');
      }

      // 3) Verify with backend
      setAuthStatus('verifying');
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, signature: userSignature, message: MESSAGE }),
      });

      if (!res.ok) {
        throw new Error('Backend authentication failed');
      }

      // 4) Success
      setAddress(userAddress);
      setSignature(userSignature);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      toast.success('Successfully authenticated!');
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthStatus('failed');
      toast.error(err.message.includes('Backend') 
        ? 'Authentication failed. Please try again.' 
        : 'Failed to connect to a wallet. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAddress(null);
    setSignature(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  // React to injected provider account changes
  useEffect(() => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) logout();
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, address, signature, login, logout, loading, authStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
