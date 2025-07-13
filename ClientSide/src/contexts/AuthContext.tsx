
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'signing' | 'verifying' | 'authenticated' | 'failed'>('idle');

  const MESSAGE = "Login to WhisperNet";

  const login = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected. Please install MetaMask to continue.');
      return;
    }

    try {
      setLoading(true);
      setAuthStatus('signing');
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        toast.error('No accounts found. Please connect your MetaMask wallet.');
        setAuthStatus('failed');
        return;
      }

      const userAddress = accounts[0];
      
      // Sign the message
      const userSignature = await window.ethereum.request({
        method: 'personal_sign',
        params: [MESSAGE, userAddress],
      });

      // Verify signature with backend
      setAuthStatus('verifying');
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: userAddress,
          signature: userSignature,
          message: MESSAGE,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      // Store in state only after backend verification
      setAddress(userAddress);
      setSignature(userSignature);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      
      toast.success('Successfully authenticated!');
      
    } catch (error) {
      console.error('Login error:', error);
      setAuthStatus('failed');
      if (error instanceof Error && error.message.includes('Backend')) {
        toast.error('Authentication failed. Please try again.');
      } else {
        toast.error('Failed to connect to MetaMask. Please try again.');
      }
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

  // Check if MetaMask is available
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          logout();
        }
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      address,
      signature,
      login,
      logout,
      loading,
      authStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
