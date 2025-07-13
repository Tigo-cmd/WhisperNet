import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCrypto } from '../contexts/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Inbox as InboxIcon, Key } from 'lucide-react';

interface Message {
  id: string;
  from: string | null;
  encrypted_body: string | null;
  timestamp: string;
  decrypted?: string;
}

const Inbox = () => {
  const { decryptMessage, keyPair, generateKeyPair } = useCrypto(); // Add keyPair and generateKeyPair
  const { address, signature } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    if (!address || !signature) {
      toast.error('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/messages/inbox', {
        headers: {
          'X-Wallet-Address': address,
          'X-Wallet-Auth': signature,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else if (response.status === 401) {
        toast.error('Authentication expired. Please login again.');
      } else {
        toast.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async (message: Message) => {
    if (!keyPair) {
      toast.error('Please generate a key pair first to decrypt messages');
      // Optionally show a modal or redirect to key management
      return;
    }

    try {
      setDecryptingId(message.id);

      // Fetch sender's public key
      const keyResponse = await fetch(`/api/keys/${message.from}`);
      if (!keyResponse.ok) {
        toast.error('Sender public key not found');
        return;
      }

      const keyData = await keyResponse.json();
      const senderPublicKey = keyData.public_key;

      // Decrypt the message
      const decryptedText = await decryptMessage(message.encrypted_body, senderPublicKey);

      // Update the message with decrypted content
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, decrypted: decryptedText }
          : msg
      ));

      toast.success('Message decrypted successfully!');
    } catch (error) {
      console.error('Decrypt error:', error);
      toast.error('Failed to decrypt message. Make sure you have the correct key pair.');
    } finally {
      setDecryptingId(null);
    }
  };

  // Add this before the return statement
  const renderNoKeyPairWarning = () => {
    if (!keyPair) {
      return (
        <Card className="bg-slate-700/50 border-slate-600 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <p className="text-yellow-400">You need a key pair to decrypt messages</p>
                <p className="text-sm text-gray-400">Generate or import your key pair first</p>
              </div>
              <Button 
                onClick={generateKeyPair}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Generate Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // Add this helper function at the top of your component
  const formatAddress = (address: string | null) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Update the return statement to use the helper function
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Inbox</h2>
        <p className="text-gray-300">Decrypt and read your received messages</p>
      </div>

      {renderNoKeyPairWarning()}

      {messages.length === 0 ? (
        <Card className="bg-slate-700/50 border-slate-600">
          <CardContent className="text-center py-12">
            <InboxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  From: {formatAddress(message.from)}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {new Date(message.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {message.decrypted ? (
                  <div className="p-4 bg-slate-600/50 rounded-lg">
                    <p className="text-white whitespace-pre-wrap">
                      {message.decrypted}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-600/50 rounded-lg">
                      <p className="text-gray-400 font-mono text-sm break-all">
                        {message.encrypted_body?.slice(0, 100) || ''}...
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleDecrypt(message)}
                      disabled={decryptingId === message.id}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {decryptingId === message.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Decrypting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4" />
                          <span>Decrypt Message</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;
