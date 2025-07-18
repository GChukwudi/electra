/**
 * VoterDashboard Component - Displays voter information and status
 */

import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useElection } from '../contexts/ElectionContext';
import { web3Utils } from '../utils/web3Utils';

const VoterDashboard = () => {
  const { account, networkName } = useWeb3();
  const { 
    voterInfo, 
    isRegistered, 
    hasVoted, 
    electionInfo,
    candidates,
    electionStats 
  } = useElection();

  if (!account) {
    return null;
  }

  const getVotedCandidateName = () => {
    if (!hasVoted || !voterInfo?.candidateVoted || !candidates) return null;
    
    const candidate = candidates.find(c => c.id === voterInfo.candidateVoted);
    return candidate ? candidate.name : 'Unknown Candidate';
  };

  const getRegistrationStatus = () => {
    if (!electionInfo) return 'Unknown';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (!isRegistered) {
      if (now <= electionInfo.registrationDeadline) {
        return 'Not Registered - Registration Open';
      }
      return 'Not Registered - Registration Closed';
    }
    
    return 'Registered';
  };

  const getVotingStatus = () => {
    if (!isRegistered) return 'Must Register First';
    if (hasVoted) return 'Vote Submitted';
    
    if (!electionInfo) return 'Unknown';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (now < electionInfo.startTime) return 'Waiting for Voting to Start';
    if (now <= electionInfo.endTime) return 'Can Vote Now';
    return 'Voting Period Ended';
  };

  const getStatusColor = (status) => {
    if (status.includes('Registered') || status.includes('Vote Submitted')) {
      return 'text-green-600 bg-green-50';
    }
    if (status.includes('Can Vote') || status.includes('Registration Open')) {
      return 'text-blue-600 bg-blue-50';
    }
    if (status.includes('Not Registered') || status.includes('Ended')) {
      return 'text-red-600 bg-red-50';
    }
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Your Voter Dashboard</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Personal Information</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Wallet Address:</span>
              <span className="font-mono text-sm">{web3Utils.formatAddress(account)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Network:</span>
              <span className="font-medium">{networkName}</span>
            </div>
            
            {isRegistered && voterInfo && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voter ID:</span>
                  <span className="font-medium">#{voterInfo.voterID}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Registered:</span>
                  <span className="font-medium">
                    {web3Utils.formatTimestamp(voterInfo.registrationTime)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Voting Status */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Voting Status</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Registration:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getRegistrationStatus())}`}>
                  {getRegistrationStatus()}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Voting:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getVotingStatus())}`}>
                  {getVotingStatus()}
                </span>
              </div>
            </div>
            
            {hasVoted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-1">✅ Vote Confirmed</h5>
                <p className="text-green-700 text-sm">
                  You voted for: <span className="font-medium">{getVotedCandidateName()}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Election Overview */}
      {electionInfo && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Election Overview</h4>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {electionStats?.totalRegisteredVoters || 0}
              </div>
              <div className="text-sm text-gray-600">Registered Voters</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {electionStats?.totalVotesCast || 0}
              </div>
              <div className="text-sm text-gray-600">Votes Cast</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {electionStats?.activeCandidates || 0}
              </div>
              <div className="text-sm text-gray-600">Active Candidates</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {electionStats?.voterTurnoutPercentage || 0}%
              </div>
              <div className="text-sm text-gray-600">Turnout</div>
            </div>
          </div>
        </div>
      )}

      {/* Important Dates */}
      {electionInfo && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Important Dates</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Deadline:</span>
              <span className="font-medium">
                {web3Utils.formatTimestamp(electionInfo.registrationDeadline)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Voting Starts:</span>
              <span className="font-medium">
                {web3Utils.formatTimestamp(electionInfo.startTime)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Voting Ends:</span>
              <span className="font-medium">
                {web3Utils.formatTimestamp(electionInfo.endTime)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">🔒 Security & Verification</h4>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Your vote is cryptographically secured on the blockchain
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              All transactions are publicly verifiable
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Your identity remains private while ensuring transparency
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Vote tampering is mathematically impossible
            </li>
          </ul>
        </div>
        
        {hasVoted && voterInfo && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-blue-800 mb-1">Vote Verification</h5>
            <p className="text-blue-700 text-sm">
              Your vote has been permanently recorded and can be verified using your voter ID: 
              <span className="font-mono ml-1">#{voterInfo.voterID}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterDashboard;