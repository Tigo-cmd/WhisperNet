import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCrypto } from '../contexts/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import PrivateKeyDialog from './PrivateKeyDialog';
import { toast } from 'sonner';
import { Key, User, Shield, AlertTriangle, Download, Upload, Lock } from 'lucide-react';

const KeyManagement = () => {
  const { 
    keyPair, 
    publicKeyB64, 
    privateKeyB64, 
    isKeyStored, 
    keyFingerprint, 
    generateKeyPair, 
    clearKeys 
  } = useCrypto();
  const { address, signature, authStatus } = useAuth();
  const [lookupAddress, setLookupAddress] = useState('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [looking, setLooking] = useState(false);

  const handleRegisterKey = async () => {
    if (!publicKeyB64 || !address || !signature) {
      toast.error('Missing required data. Please generate a key pair first.');
      return;
    }

    try {
      setRegistering(true);
      
      const response = await fetch('/keys/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': address,
          'X-Wallet-Auth': signature,
        },
        body: JSON.stringify({
          address,
          public_key: publicKeyB64,
        }),
      });

      if (response.ok) {
        toast.success('Public key registered successfully!');
      } else {
        const error = await response.text();
        toast.error(`Failed to register key: ${error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register key. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleLookupKey = async () => {
    if (!lookupAddress) {
      toast.error('Please enter an address to lookup');
      return;
    }

    try {
      setLooking(true);
      
      const response = await fetch(`/api/keys/${lookupAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        setLookupResult(data.public_key);
      } else {
        toast.error('Public key not found for this address');
        setLookupResult(null);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error('Failed to lookup key. Please try again.');
    } finally {
      setLooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Key Management</h2>
        <p className="text-gray-300">Generate and manage your encryption keys securely</p>
      </div>

      {/* Authentication Status */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Authentication Status</p>
                <p className="text-sm text-gray-300">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </p>
              </div>
            </div>
            <Badge variant={authStatus === 'authenticated' ? 'default' : 'secondary'}>
              {authStatus === 'authenticated' ? 'Verified' : authStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Generation & Status */}
        <Card className="bg-slate-700/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Your Keys</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Generate and view your encryption keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!keyPair ? (
              <div className="space-y-4">
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <AlertDescription className="text-amber-200">
                    No encryption keys found. Generate a new key pair to start messaging.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={generateKeyPair}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Generate Key Pair
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Key Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Key Status</span>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Generated
                      </Badge>
                      {isKeyStored && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          Stored
                        </Badge>
                      )}
                    </div>
                  </div>
                  {keyFingerprint && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Fingerprint</span>
                      <code className="text-xs text-gray-400 bg-slate-600 px-2 py-1 rounded">
                        {keyFingerprint}
                      </code>
                    </div>
                  )}
                </div>

                {/* Public Key */}
                <div>
                  <Label className="text-white">Public Key</Label>
                  <Textarea 
                    value={publicKeyB64 || ''}
                    readOnly
                    className="mt-2 bg-slate-600 border-slate-500 text-white font-mono text-xs"
                    rows={3}
                  />
                </div>

                {/* Register Key */}
                <Button 
                  onClick={handleRegisterKey}
                  disabled={registering || authStatus !== 'authenticated'}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {registering ? 'Registering...' : 'Register Public Key'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Private Key Management */}
        <Card className="bg-slate-700/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Private Key</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Export, import, or backup your private key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!privateKeyB64 ? (
              <Alert className="border-slate-500/50 bg-slate-500/10">
                <Key className="w-4 h-4 text-slate-400" />
                <AlertDescription className="text-slate-300">
                  Generate a key pair first to access private key management.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {/* Security reminder */}
                <Alert className="border-red-500/50 bg-red-500/10">
                  <Shield className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-200 text-xs">
                    Private keys provide full access to your messages. Handle with extreme care.
                  </AlertDescription>
                </Alert>

                {/* Private Key Actions */}
                <div className="grid grid-cols-1 gap-2">
                  <PrivateKeyDialog 
                    mode="view"
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Key className="w-4 h-4 mr-2" />
                        View Private Key
                      </Button>
                    }
                  />
                  
                  <PrivateKeyDialog 
                    mode="export"
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Export (Encrypted)
                      </Button>
                    }
                  />
                  
                  <PrivateKeyDialog 
                    mode="import"
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Import Key
                      </Button>
                    }
                  />
                  
                  <Button 
                    onClick={clearKeys}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Clear All Keys
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lookup Key */}
        <Card className="bg-slate-700/50 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Lookup Keys</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Find public keys by wallet address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Wallet Address</Label>
              <Input
                value={lookupAddress}
                onChange={(e) => setLookupAddress(e.target.value)}
                placeholder="0x..."
                className="mt-2 bg-slate-600 border-slate-500 text-white"
              />
            </div>
            <Button 
              onClick={handleLookupKey}
              disabled={looking}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {looking ? 'Looking up...' : 'Lookup Public Key'}
            </Button>
            {lookupResult && (
              <div>
                <Label className="text-white">Public Key Found</Label>
                <Textarea 
                  value={lookupResult}
                  readOnly
                  className="mt-2 bg-slate-600 border-slate-500 text-white font-mono text-xs"
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Best Practices */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="space-y-2">
              <h4 className="font-medium text-white">Key Storage</h4>
              <ul className="space-y-1 text-xs">
                <li>• Export your private key and store it securely offline</li>
                <li>• Use a strong password when exporting keys</li>
                <li>• Keep multiple encrypted backups in different locations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Security</h4>
              <ul className="space-y-1 text-xs">
                <li>• Never share your private key with anyone</li>
                <li>• Always verify the recipient's public key fingerprint</li>
                <li>• Clear keys when using shared computers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyManagement;
