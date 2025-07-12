import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCrypto } from '../contexts/CryptoContext';
import { toast } from 'sonner';
import { Key, Shield, AlertTriangle, Download, Upload } from 'lucide-react';

interface PrivateKeyDialogProps {
  mode: 'export' | 'import' | 'view';
  trigger: React.ReactNode;
}

const PrivateKeyDialog: React.FC<PrivateKeyDialogProps> = ({ mode, trigger }) => {
  const { privateKeyB64, exportPrivateKey, importPrivateKey } = useCrypto();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [importKey, setImportKey] = useState('');
  const [exportedKey, setExportedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = async () => {
    if (!password) {
      toast.error('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      const encrypted = await exportPrivateKey(password);
      setExportedKey(encrypted);
      toast.success('Private key exported successfully');
    } catch (error) {
      toast.error('Failed to export private key');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!password || !importKey) {
      toast.error('Password and private key are required');
      return;
    }

    try {
      setLoading(true);
      await importPrivateKey(importKey, password);
      setOpen(false);
      setPassword('');
      setImportKey('');
    } catch (error) {
      toast.error('Failed to import private key');
    } finally {
      setLoading(false);
    }
  };

  const downloadKey = () => {
    const blob = new Blob([exportedKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secretwhispers-private-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const resetDialog = () => {
    setPassword('');
    setConfirmPassword('');
    setImportKey('');
    setExportedKey('');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            {mode === 'export' && <><Download className="w-5 h-5" /><span>Export Private Key</span></>}
            {mode === 'import' && <><Upload className="w-5 h-5" /><span>Import Private Key</span></>}
            {mode === 'view' && <><Key className="w-5 h-5" /><span>View Private Key</span></>}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {mode === 'export' && 'Export your private key with password protection'}
            {mode === 'import' && 'Import an encrypted private key'}
            {mode === 'view' && 'View your current private key (use with caution)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Warning */}
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              <strong>Security Warning:</strong> Private keys provide full access to your encrypted messages. 
              Keep them secure and never share them with anyone.
            </AlertDescription>
          </Alert>

          {mode === 'export' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter strong password"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleExport}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Exporting...' : 'Export Private Key'}
              </Button>

              {exportedKey && (
                <div className="space-y-4">
                  <Label className="text-white">Encrypted Private Key</Label>
                  <Textarea 
                    value={exportedKey}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
                    rows={6}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => copyToClipboard(exportedKey)}
                      variant="outline"
                      className="flex-1"
                    >
                      Copy to Clipboard
                    </Button>
                    <Button 
                      onClick={downloadKey}
                      variant="outline"
                      className="flex-1"
                    >
                      Download File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Encrypted Private Key</Label>
                <Textarea 
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                  placeholder="Paste encrypted private key here..."
                  className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
                  rows={6}
                />
              </div>
              
              <div>
                <Label className="text-white">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter decryption password"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <Button 
                onClick={handleImport}
                disabled={loading || !importKey || !password}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Importing...' : 'Import Private Key'}
              </Button>
            </div>
          )}

          {mode === 'view' && privateKeyB64 && (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Private Key (Base64)</Label>
                <Textarea 
                  value={privateKeyB64}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={() => copyToClipboard(privateKeyB64)}
                variant="outline"
                className="w-full"
              >
                Copy to Clipboard
              </Button>
              
              <Alert className="border-red-500/50 bg-red-500/10">
                <Shield className="w-4 h-4 text-red-500" />
                <AlertDescription className="text-red-200">
                  This is your unencrypted private key. Anyone with this key can decrypt your messages.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivateKeyDialog;