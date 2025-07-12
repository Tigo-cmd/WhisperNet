
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Key, Send } from 'lucide-react';

const LoginScreen = () => {
  const { login, loading, authStatus } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">WhisperNet</h1>
          <p className="text-gray-300">ICP Blockchain based End-to-End Email Encryption</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in with MetaMask to access secure messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">End-to-end encryption</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-300">ICP Blockchain authentication</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Decentralized messaging</span>
              </div>
            </div>

            <Button 
              onClick={login}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {authStatus === 'signing' && 'Signing message...'}
                    {authStatus === 'verifying' && 'Verifying with server...'}
                    {authStatus === 'failed' && 'Authentication failed'}
                    {authStatus === 'idle' && 'Connecting...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Connect MetaMask</span>
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              By connecting, you agree to sign a message to authenticate your identity
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;
