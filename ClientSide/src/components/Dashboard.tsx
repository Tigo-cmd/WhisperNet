
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import KeyManagement from './KeyManagement';
import ComposeMessage from './ComposeMessage';
import Inbox from './Inbox';
import SentMessages from './SentMessages';
import { Key, Send, Inbox as InboxIcon, User } from 'lucide-react';

const Dashboard = () => {
  const { address, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">WhisperNet</h1>
              <p className="text-gray-300 text-sm">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            Disconnect
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700/50 mb-6">
              <TabsTrigger value="keys" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Keys</span>
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Compose</span>
              </TabsTrigger>
              <TabsTrigger value="inbox" className="flex items-center space-x-2">
                <InboxIcon className="w-4 h-4" />
                <span>Inbox</span>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Sent</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="keys">
                <KeyManagement />
              </TabsContent>
              <TabsContent value="compose">
                <ComposeMessage />
              </TabsContent>
              <TabsContent value="inbox">
                <Inbox />
              </TabsContent>
              <TabsContent value="sent">
                <SentMessages />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
