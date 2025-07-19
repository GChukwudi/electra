# Electra API Documentation

## Overview

The Electra voting system provides a comprehensive JavaScript API for interacting with the blockchain-based voting smart contracts. This documentation covers all available methods, their parameters, return values, and usage examples.

## Table of Contents

- [Contract Initialization](#contract-initialization)
- [Election Management](#election-management)
- [Candidate Management](#candidate-management)
- [Voter Management](#voter-management)
- [Voting Operations](#voting-operations)
- [Results and Statistics](#results-and-statistics)
- [Administrative Functions](#administrative-functions)
- [Event Handling](#event-handling)
- [Utility Functions](#utility-functions)
- [Error Handling](#error-handling)

## Contract Initialization

### `contractInteraction.initialize(web3, contractAddress)`

Initializes the contract connection.

**Parameters:**
- `web3` (Object): Web3 instance
- `contractAddress` (String, optional): Contract address. If not provided, uses environment variable

**Returns:**
```javascript
{
  success: boolean,
  contract: Object,
  address: string
}
```

**Example:**
```javascript
import { contractInteraction } from './utils/contractInteraction';

const result = await contractInteraction.initialize(web3, '0x...');
if (result.success) {
  console.log('Contract initialized:', result.address);
}
```

## Election Management

### `getElectionInfo(contract)`

Retrieves comprehensive election information.

**Parameters:**
- `contract` (Object): Contract instance

**Returns:**
```javascript
{
  title: string,
  description: string,
  startTime: number,
  endTime: number,
  registrationDeadline: number,
  isActive: boolean,
  isFinalized: boolean,
  totalVoters: number,
  totalVotes: number,
  winnerID: number
}
```

**Example:**
```javascript
const electionInfo = await contractInteraction.getElectionInfo(contract);
console.log('Election:', electionInfo.title);
console.log('Active:', electionInfo.isActive);
```

### `getElectionStatistics(contract)`

Gets detailed election statistics.

**Returns:**
```javascript
{
  totalRegisteredVoters: number,
  totalVotesCast: number,
  voterTurnoutPercentage: number,
  activeCandidates: number,
  totalCandidatesCount: number,
  hasWinner: boolean,
  electionComplete: boolean
}
```

## Candidate Management

### `getAllCandidates(contract)`

Retrieves all candidates with their information.

**Returns:**
```javascript
[
  {
    id: number,
    name: string,
    party: string,
    voteCount: number,
    isActive: boolean
  }
]
```

**Example:**
```javascript
const candidates = await contractInteraction.getAllCandidates(contract);
candidates.forEach(candidate => {
  console.log(`${candidate.name} (${candidate.party}): ${candidate.voteCount} votes`);
});
```

### `addCandidate(contract, name, party, manifesto, fromAddress)`

Adds a new candidate to the election (Admin/Commissioner only).

**Parameters:**
- `contract` (Object): Contract instance
- `name` (String): Candidate's full name
- `party` (String): Political party
- `manifesto` (String): Candidate's manifesto
- `fromAddress` (String): Admin's wallet address

**Returns:**
```javascript
{
  success: boolean,
  txHash: string,
  blockNumber: number,
  gasUsed: number
}
```

**Example:**
```javascript
try {
  const result = await contractInteraction.addCandidate(
    contract,
    "John Doe",
    "Democratic Party",
    "Working for the people",
    adminAddress
  );
  console.log('Candidate added:', result.txHash);
} catch (error) {
  console.error('Failed to add candidate:', error.message);
}
```

## Voter Management

### `getVoterInfo(contract, voterAddress)`

Gets information about a specific voter.

**Parameters:**
- `contract` (Object): Contract instance
- `voterAddress` (String): Voter's wallet address

**Returns:**
```javascript
{
  isRegistered: boolean,
  hasVoted: boolean,
  candidateVoted: number,
  voterID: number,
  registrationTime: number
}
```

### `registerVoter(contract, voterAddress, fromAddress)`

Registers a new voter (Admin/Commissioner only).

**Parameters:**
- `contract` (Object): Contract instance
- `voterAddress` (String): Address to register
- `fromAddress` (String): Admin's address

### `selfRegister(contract, fromAddress)`

Allows a user to self-register as a voter.

**Parameters:**
- `contract` (Object): Contract instance
- `fromAddress` (String): User's wallet address

**Example:**
```javascript
try {
  const result = await contractInteraction.selfRegister(contract, userAddress);
  console.log('Self-registration successful:', result.txHash);
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

## Voting Operations

### `vote(contract, candidateID, fromAddress)`

Casts a vote for a specific candidate.

**Parameters:**
- `contract` (Object): Contract instance
- `candidateID` (Number): ID of the candidate to vote for
- `fromAddress` (String): Voter's wallet address

**Returns:**
```javascript
{
  success: boolean,
  txHash: string,
  blockNumber: number,
  gasUsed: number,
  txId: string
}
```

**Example:**
```javascript
try {
  const result = await contractInteraction.vote(contract, 1, voterAddress);
  console.log('Vote cast successfully:', result.txHash);
} catch (error) {
  console.error('Voting failed:', error.message);
}
```

### `verifyVote(contract, voter, hash)`

Verifies a vote using the verification hash.

**Parameters:**
- `contract` (Object): Contract instance
- `voter` (String): Voter's address
- `hash` (String): Verification hash

**Returns:**
- `boolean`: Whether the vote is valid

## Results and Statistics

### `getCurrentWinner(contract)`

Gets the current leading candidate or winner.

**Returns:**
```javascript
{
  winnerID: number,
  winnerName: string,
  winnerParty: string,
  maxVotes: number,
  isTie: boolean
}
```

**Example:**
```javascript
const winner = await contractInteraction.getCurrentWinner(contract);
if (winner.isTie) {
  console.log('Election is currently tied');
} else {
  console.log(`Current leader: ${winner.winnerName} with ${winner.maxVotes} votes`);
}
```

## Administrative Functions

### `startVoting(contract, fromAddress)`

Starts the voting period (Commissioner only).

### `endVoting(contract, fromAddress)`

Ends the voting period (Commissioner only).

### `finalizeElection(contract, fromAddress)`

Finalizes the election and declares the winner (Commissioner only).

**Example:**
```javascript
// Start voting
await contractInteraction.startVoting(contract, commissionerAddress);

// End voting (when period is over)
await contractInteraction.endVoting(contract, commissionerAddress);

// Finalize election
await contractInteraction.finalizeElection(contract, commissionerAddress);
```

## Event Handling

### `subscribeToEvents(contract, eventName, callback, options)`

Subscribes to specific contract events.

**Parameters:**
- `contract` (Object): Contract instance
- `eventName` (String): Name of the event to subscribe to
- `callback` (Function): Function to call when event is emitted
- `options` (Object): Subscription options

**Available Events:**
- `VoteCast`: When a vote is cast
- `VoterRegistered`: When a voter registers
- `CandidateAdded`: When a candidate is added
- `ElectionStarted`: When voting begins
- `ElectionEnded`: When voting ends
- `ElectionFinalized`: When election is finalized

**Example:**
```javascript
const subscription = contractInteraction.subscribeToEvents(
  contract,
  'VoteCast',
  (event) => {
    console.log('New vote cast:', event.returnValues);
  }
);

// Unsubscribe later
subscription.unsubscribe();
```

## Utility Functions

### `web3Utils.formatAddress(address)`

Formats an Ethereum address for display.

**Parameters:**
- `address` (String): Full Ethereum address

**Returns:**
- `string`: Formatted address (e.g., "0x1234...5678")

### `web3Utils.formatTimestamp(timestamp)`

Formats a Unix timestamp to a readable date string.

**Parameters:**
- `timestamp` (Number): Unix timestamp

**Returns:**
- `string`: Formatted date string

### `web3Utils.getTimeRemaining(timestamp)`

Calculates time remaining until a specific timestamp.

**Parameters:**
- `timestamp` (Number): Target timestamp

**Returns:**
```javascript
{
  isExpired: boolean,
  timeString: string,
  days: number,
  hours: number,
  minutes: number,
  totalSeconds: number
}
```

## Error Handling

The Electra API uses a comprehensive error handling system. All contract interaction methods can throw specific errors:

### Common Error Types

- **ContractError**: Contract-specific errors
- **ValidationError**: Input validation errors
- **NetworkError**: Network connectivity issues
- **AuthorizationError**: Permission-related errors

### Error Response Format

```javascript
{
  name: string,
  message: string,
  code?: string,
  data?: any
}
```

### Example Error Handling

```javascript
try {
  await contractInteraction.vote(contract, candidateId, voterAddress);
} catch (error) {
  switch (error.code) {
    case 'USER_REJECTED':
      console.log('User cancelled the transaction');
      break;
    case 'INSUFFICIENT_FUNDS':
      console.log('Not enough ETH for gas fees');
      break;
    case 'UNAUTHORIZED':
      console.log('User not authorized for this action');
      break;
    default:
      console.error('Unknown error:', error.message);
  }
}
```

## Rate Limiting

The API includes built-in rate limiting to prevent spam and ensure system stability:

- Wallet connections: 5 attempts per minute
- Vote casting: 1 attempt per user per election
- Registration: 10 attempts per hour

Rate limit errors will include retry-after information.

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Check permissions**: Verify user roles before attempting admin operations
3. **Validate inputs**: Use the security utilities for input validation
4. **Monitor events**: Subscribe to relevant events for real-time updates
5. **Cache data**: Use the built-in caching for better performance
6. **Handle network issues**: Implement retry logic for network failures

## Advanced Features

### Batch Operations

```javascript
const requests = [
  { method: 'getElectionInfo', params: [] },
  { method: 'getAllCandidates', params: [] },
  { method: 'getElectionStatistics', params: [] }
];

const results = await contractInteraction.batchGetData(contract, requests);
```

### Real-time Monitoring

```javascript
const monitor = await advancedUtils.monitorElection(contract, {
  onVoteCast: (event) => console.log('Vote cast:', event),
  onElectionUpdate: (event) => console.log('Election updated:', event)
});

// Stop monitoring
monitor.stop();
```

### Data Export

```javascript
const electionData = await advancedUtils.exportElectionData(contract, {
  includeEvents: true,
  exportedBy: adminAddress
});
```

## Support

For additional support or questions about the Electra API:

1. Check the source code documentation in `/utils/contractInteraction.js`
2. Review the test files for usage examples
3. Ensure you're using the latest version of Web3.js (^4.0.0)
4. Verify your network connection and contract address

## Version Information

- API Version: 1.0.0
- Compatible with: Solidity 0.8.19+
- Requires: Web3.js 4.0.0+
- Network: Ethereum (Mainnet/Sepolia)