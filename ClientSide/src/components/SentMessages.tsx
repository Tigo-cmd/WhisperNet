import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  to: string;
  encrypted_body: string;
  timestamp: string;
}
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://emmanueltigo.pythonanywhere.com';

const SentMessages = () => {
  const { address, signature } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch(`${BASE_URL}/messages/sent`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Sent Messages</h2>
        <p className="text-gray-300">View your sent messages</p>
      </div>

      {messages.length === 0 ? (
        <Card className="bg-slate-700/50 border-slate-600">
          <CardContent className="text-center py-12">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No sent messages</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  To: {message.to.slice(0, 6)}...{message.to.slice(-4)}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {new Date(message.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-600/50 rounded-lg">
                  <p className="text-gray-400 font-mono text-sm break-all">
                    {message.encrypted_body.slice(0, 100)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentMessages;
