# Electra - Blockchain Voting System

**[Live App](https://electra-tw0n.onrender.com/)**

Electra is a secure blockchain voting system built on Ethereum. Features cryptographically secured votes, real-time results, and complete transparency through immutable blockchain records.

## ✨ Key Features

- **🔐 Secure Voting**: Immutable blockchain-based vote recording
- **👥 Role Management**: Owner, Commissioner, Admin, and Voter roles
- **📊 Real-time Results**: Live vote counting and transparent displays
- **🗳️ Multi-Candidate**: Support for up to 50 candidates per election
- **📱 Responsive Design**: Modern mobile-friendly interface
- **🔗 MetaMask Integration**: Seamless wallet connection

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MetaMask browser extension

### Local Development

1. **Clone and setup**
   ```bash
   git clone https://github.com/GChukwudi/electra
   cd electra
   npm install
   cd client && npm install && cd ..
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy contracts locally**
   ```bash
   # Start Ganache or local blockchain
   ganache

   # Compile and deploy
   npx truffle compile
   npx truffle migrate --network development
   ```

4. **Start development server**
   ```bash
   cd client
   npm run dev
   ```

   Access at http://localhost:5173

## 📖 How to Use

### For Voters
1. Connect MetaMask wallet to the application
2. Register to vote during registration period
3. Select your preferred candidate during voting period
4. Confirm transaction and view results

### For Election Commissioners
1. Create new election with candidates and schedule
2. Manage voter registration
3. Start and end voting periods
4. Finalize election results

### For Administrators
1. Register voters manually
2. Add candidates to elections
3. Assign user roles and permissions
4. Monitor system status

## 🧪 Testing

```bash
# Run all tests
npx truffle test

# Run specific test
npx truffle test test/electra.test.js

# Test coverage includes:
# - Role management and access control
# - Election lifecycle management
# - Voting and candidate management
# - Security and edge cases
```

## 🔧 Configuration

Key environment variables:
```env
PRIVATE_KEY=your_private_key
INFURA_PROJECT_ID=your_infura_id
REACT_APP_CONTRACT_ADDRESS=deployed_contract_address
REACT_APP_NETWORK_ID=11155111
```

## 🛡️ Security Features

- **Role-based access control** with multiple permission levels
- **Vote integrity** through cryptographic verification
- **Emergency controls** for system pause and recovery
- **Audit trail** with complete transaction history
- **Input validation** and comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Electra - Secure, Transparent, Decentralized Voting** 🗳️