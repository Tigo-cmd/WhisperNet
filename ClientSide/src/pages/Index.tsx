
import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { CryptoProvider } from '../contexts/CryptoContext';
import LoginScreen from '../components/LoginScreen';
import Dashboard from '../components/Dashboard';
import { useAuth } from '../contexts/AuthContext';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {!isAuthenticated ? <LoginScreen /> : <Dashboard />}
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <CryptoProvider>
        <AppContent />
      </CryptoProvider>
    </AuthProvider>
  );
};

export default Index;
