import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCrypto } from '../contexts/CryptoContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://emmanueltigo.pythonanywhere.com';

const ComposeMessage = () => {
  const { encryptMessage, keyPair, generateKeyPair } = useCrypto();
  const { address, signature } = useAuth();
  const [toAddress, setToAddress] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!keyPair) {
      toast.error('Please generate a key pair before sending messages');
      return;
    }

    if (!toAddress || !message) {
      toast.error('Please fill in both recipient address and message');
      return;
    }

    if (!address || !signature) {
      toast.error('Authentication required');
      return;
    }

    try {
      setSending(true);

      // First, fetch recipient's public key
      const keyResponse = await fetch(`${BASE_URL}/keys/${toAddress}`);
      if (!keyResponse.ok) {
        toast.error('Recipient public key not found. They need to register first.');
        return;
      }

      const keyData = await keyResponse.json();
      const recipientPublicKey = keyData.public_key;
      console.log(recipientPublicKey);

      // Encrypt the message
      const encryptedMessage = await encryptMessage(message, recipientPublicKey);

      // Send the encrypted message
      const response = await fetch(`${BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': address,
          'X-Wallet-Auth': signature,
        },
        body: JSON.stringify({
          to: toAddress,
          encrypted_body: encryptedMessage,
        }),
      });

      if (response.ok) {
        toast.success('Message sent successfully!');
        setToAddress('');
        setMessage('');
      } else {
        const error = await response.text();
        toast.error(`Failed to send message: ${error}`);
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Add this near the top of your return statement, before the message composition form
  if (!keyPair) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Compose Message</h2>
          <p className="text-gray-300">Generate keys to start sending messages</p>
        </div>

        <Card className="bg-slate-700/50 border-slate-600 max-w-2xl mx-auto">
          <CardContent className="p-6 space-y-4">
            <div className="text-center text-gray-300">
              <p>You need to generate a key pair before you can send encrypted messages.</p>
            </div>
            <Button
              onClick={generateKeyPair}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              Generate Key Pair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Compose Message</h2>
        <p className="text-gray-300">Send an encrypted message to another user</p>
      </div>

      <Card className="bg-slate-700/50 border-slate-600 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>New Message</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your message will be encrypted before sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">To (Wallet Address)</Label>
            <Input
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="mt-2 bg-slate-600 border-slate-500 text-white"
            />
          </div>
          
          <div>
            <Label className="text-white">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="mt-2 bg-slate-600 border-slate-500 text-white"
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-slate-600/50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-300">
              Message will be encrypted with recipient's public key
            </span>
          </div>

          <Button 
            onClick={handleSendMessage}
            disabled={sending || !toAddress || !message}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {sending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Encrypting & Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Encrypt & Send</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComposeMessage;
