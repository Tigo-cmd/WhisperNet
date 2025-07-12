# ICP Encrypted Messaging System

A secure, end-to-end encrypted messaging system built on the Internet Computer (ICP) using Motoko and React.

## Features

- 🔐 **End-to-End Encryption**: Messages are encrypted using X25519 + AES-GCM
- 🌐 **Decentralized**: Built on the Internet Computer blockchain
- 🔑 **Self-Sovereign Keys**: Users generate and control their own encryption keys
- 💬 **Real-time Messaging**: Send and receive encrypted messages instantly
- 🎨 **Modern UI**: Beautiful, responsive interface with crypto-inspired design

## Architecture

### Backend (Motoko Canister)
- **Key Registration**: Users register their public keys
- **Message Storage**: Encrypted messages are stored on-chain
- **User Discovery**: Find other users by their Principal ID

### Frontend (React + TypeScript)
- **Key Generation**: X25519 key pairs generated in-browser
- **Message Encryption**: Client-side encryption using Web Crypto API
- **User Interface**: Intuitive interface for messaging

### Cryptography
- **Key Exchange**: X25519 Elliptic Curve Diffie-Hellman
- **Encryption**: AES-GCM with 256-bit keys
- **Key Derivation**: ECDH shared secret → AES key

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install DFX (DFINITY SDK)
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

### 3. Start Local IC Network
```bash
dfx start --clean
```

### 4. Deploy Canisters
```bash
# Deploy the messaging canister
dfx deploy messaging

# Build and serve frontend
npm run dev
```

### 5. Access the Application
Open your browser to `http://localhost:8080`

## Usage

1. **Generate Keys**: Click "Generate Keys" to create your encryption key pair
2. **Register**: Register your public key on the ICP canister
3. **Find Users**: Other users will appear in the recipient dropdown
4. **Send Messages**: Compose and send encrypted messages
5. **Receive Messages**: Click encrypted messages to decrypt and read them

## Technical Details

### Python Canister API

```motoko Algorithm
// Register your public key
registerKey(publicKey: Text) : async Result<(), Text>

// Get a user's public key
getKey(user: Principal) : async ?Text

// Send an encrypted message
sendMessage(to: Principal, encryptedBody: Text) : async Result<Nat, Text>

// Get your messages
getMessages(user: Principal) : async [Message]

// Get all registered users
getAllUsers() : async [UserKey]
```

### Message Format

```typescript
interface Message {
  to: Principal;
  from: Principal;
  encryptedBody: string; // Base64-encoded encrypted data
  timestamp: bigint;
}
```

### Encryption Process

1. **Key Generation**: Generate X25519 key pair
2. **Shared Secret**: Derive shared secret using ECDH
3. **AES Key**: Use shared secret as AES-GCM key
4. **Encryption**: Encrypt message with AES-GCM
5. **Storage**: Store encrypted message on-chain

## Security Features

- **No Server-Side Decryption**: Only recipients can decrypt messages
- **Perfect Forward Secrecy**: Each message uses a unique shared secret
- **Authenticated Encryption**: AES-GCM provides integrity protection
- **On-Chain Storage**: Messages stored on immutable blockchain
- **Client-Side Keys**: Private keys never leave the user's device

## Development

### Project Structure
```
src/
├── backend/
│   └── main.mo              # Motoko canister
├── components/
│   ├── KeyManager.tsx       # Key generation and management
│   ├── MessageComposer.tsx  # Send messages interface
│   └── MessageList.tsx      # Receive messages interface
├── lib/
│   ├── crypto.ts           # Encryption utilities
│   └── icp.ts              # ICP canister interface
└── pages/
    └── Index.tsx           # Main application page
```

### Key Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: python, Motoko, Internet Computer
- **Crypto**: Web Crypto API (X25519, AES-GCM)
- **UI Components**: shadcn/ui, Radix UI

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Security Considerations

⚠️ **This is a demo system**. For production use, consider:

- Proper key backup and recovery mechanisms
- Integration with Internet Identity
- Rate limiting and spam protection
- Message size limits and chunking
- Secure key storage solutions
- Audit of cryptographic implementations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Learn More

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [Motoko Programming Language](https://internetcomputer.org/docs/current/motoko/intro)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [X25519 Key Exchange](https://tools.ietf.org/html/rfc7748)
