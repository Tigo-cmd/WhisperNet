
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { toast } from 'sonner';

interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

interface CryptoContextType {
  keyPair: KeyPair | null;
  publicKeyB64: string | null;
  privateKeyB64: string | null;
  isKeyStored: boolean;
  keyFingerprint: string | null;
  generateKeyPair: () => void;
  exportPrivateKey: (password: string) => Promise<string>;
  importPrivateKey: (encryptedKey: string, password: string) => Promise<void>;
  clearKeys: () => void;
  encryptMessage: (message: string, recipientPublicKey: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string, senderPublicKey: string) => Promise<string>;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [publicKeyB64, setPublicKeyB64] = useState<string | null>(null);
  const [privateKeyB64, setPrivateKeyB64] = useState<string | null>(null);
  const [isKeyStored, setIsKeyStored] = useState(false);
  const [keyFingerprint, setKeyFingerprint] = useState<string | null>(null);

  // Generate fingerprint from public key
  const generateFingerprint = (publicKey: Uint8Array): string => {
    const hash = nacl.hash(publicKey);
    const fingerprint = naclUtil.encodeBase64(hash.slice(0, 8));
    return fingerprint.replace(/[+/=]/g, '').slice(0, 16);
  };

  // Encrypt data using Web Crypto API
  const encryptData = async (data: string, password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('SecretWhispers-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    });
  };

  // Decrypt data using Web Crypto API
  const decryptData = async (encryptedData: string, password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const { iv, data } = JSON.parse(encryptedData);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('SecretWhispers-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );

    return decoder.decode(decrypted);
  };

  // Load keys from localStorage on component mount
  useEffect(() => {
    const storedEncryptedKey = localStorage.getItem('sw-encrypted-key');
    const storedPublicKey = localStorage.getItem('sw-public-key');
    const storedFingerprint = localStorage.getItem('sw-key-fingerprint');
    
    if (storedPublicKey && storedFingerprint) {
      setPublicKeyB64(storedPublicKey);
      setKeyFingerprint(storedFingerprint);
      setIsKeyStored(!!storedEncryptedKey);
    }
  }, []);

  const generateKeyPair = () => {
    try {
      const newKeyPair = nacl.box.keyPair();
      const publicKey = naclUtil.encodeBase64(newKeyPair.publicKey);
      const privateKey = naclUtil.encodeBase64(newKeyPair.secretKey);
      const fingerprint = generateFingerprint(newKeyPair.publicKey);
      
      setKeyPair(newKeyPair);
      setPublicKeyB64(publicKey);
      setPrivateKeyB64(privateKey);
      setKeyFingerprint(fingerprint);
      
      // Store public key and fingerprint in localStorage
      localStorage.setItem('sw-public-key', publicKey);
      localStorage.setItem('sw-key-fingerprint', fingerprint);
      
      toast.success('Key pair generated successfully!');
    } catch (error) {
      console.error('Error generating key pair:', error);
      toast.error('Failed to generate key pair');
    }
  };

  const exportPrivateKey = async (password: string): Promise<string> => {
    if (!privateKeyB64) {
      throw new Error('No private key available');
    }

    try {
      const encryptedKey = await encryptData(privateKeyB64, password);
      return encryptedKey;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export private key');
    }
  };

  const importPrivateKey = async (encryptedKey: string, password: string): Promise<void> => {
    try {
      const privateKey = await decryptData(encryptedKey, password);
      const secretKeyArray = naclUtil.decodeBase64(privateKey);
      
      // Derive public key from private key
      const publicKeyArray = nacl.box.keyPair.fromSecretKey(secretKeyArray).publicKey;
      const publicKey = naclUtil.encodeBase64(publicKeyArray);
      const fingerprint = generateFingerprint(publicKeyArray);
      
      setKeyPair({ publicKey: publicKeyArray, secretKey: secretKeyArray });
      setPublicKeyB64(publicKey);
      setPrivateKeyB64(privateKey);
      setKeyFingerprint(fingerprint);
      
      // Store in localStorage
      localStorage.setItem('sw-public-key', publicKey);
      localStorage.setItem('sw-key-fingerprint', fingerprint);
      localStorage.setItem('sw-encrypted-key', encryptedKey);
      setIsKeyStored(true);
      
      toast.success('Private key imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      throw new Error('Failed to import private key');
    }
  };

  const clearKeys = () => {
    setKeyPair(null);
    setPublicKeyB64(null);
    setPrivateKeyB64(null);
    setKeyFingerprint(null);
    setIsKeyStored(false);
    
    // Clear from localStorage
    localStorage.removeItem('sw-public-key');
    localStorage.removeItem('sw-key-fingerprint');
    localStorage.removeItem('sw-encrypted-key');
    
    toast.success('Keys cleared successfully');
  };

  const encryptMessage = async (message: string, recipientPublicKeyB64: string): Promise<string> => {
    if (!keyPair) {
      throw new Error('No key pair available');
    }

    try {
      const recipientPublicKey = naclUtil.decodeBase64(recipientPublicKeyB64);
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const messageUint8 = naclUtil.decodeUTF8(message);
      
      const box = nacl.box(messageUint8, nonce, recipientPublicKey, keyPair.secretKey);
      
      const payload = {
        nonce: naclUtil.encodeBase64(nonce),
        box: naclUtil.encodeBase64(box),
      };
      
      return naclUtil.encodeBase64(naclUtil.decodeUTF8(JSON.stringify(payload)));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  };

  const decryptMessage = async (encryptedMessageB64: string, senderPublicKeyB64: string): Promise<string> => {
    if (!keyPair) {
      throw new Error('No key pair available');
    }

    try {
      const senderPublicKey = naclUtil.decodeBase64(senderPublicKeyB64);
      const encryptedData = JSON.parse(naclUtil.encodeUTF8(naclUtil.decodeBase64(encryptedMessageB64)));
      
      const nonce = naclUtil.decodeBase64(encryptedData.nonce);
      const box = naclUtil.decodeBase64(encryptedData.box);
      
      const decrypted = nacl.box.open(box, nonce, senderPublicKey, keyPair.secretKey);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt message');
      }
      
      return naclUtil.encodeUTF8(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  };

  return (
    <CryptoContext.Provider value={{
      keyPair,
      publicKeyB64,
      privateKeyB64,
      isKeyStored,
      keyFingerprint,
      generateKeyPair,
      exportPrivateKey,
      importPrivateKey,
      clearKeys,
      encryptMessage,
      decryptMessage
    }}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};
