/**
 * Admin Page - Election administration interface
 */

import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useElection } from '../contexts/ElectionContext';
import AdminPanel from '../components/AdminPanel';

const Admin = () => {
  const { account, isConnected, connectWallet } = useWeb3();
  const { 
    isAdmin, 
    isCommissioner, 
    userRole,
    electionInfo,
    isLoading 
  } = useElection();

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to access the admin panel.
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Not authorized state
  if (!isAdmin && !isCommissioner) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have administrator privileges to access this panel.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-yellow-800 mb-2">Your Current Role</h4>
            <p className="text-yellow-700">
              Role: <span className="font-mono">{userRole?.role || 'NONE'}</span>
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Contact the election commissioner to request admin access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Election Administration
        </h1>
        <p className="text-gray-600">
          Manage election settings, candidates, and system operations
        </p>
        
        {/* Admin Info */}
        <div className="mt-4 flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCommissioner 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isCommissioner ? '👑 Commissioner' : '🔧 Administrator'}
          </div>
          
          <div className="text-sm text-gray-600">
            Logged in as: <span className="font-mono">{account?.slice(0, 10)}...</span>
          </div>
        </div>
      </div>

      {/* Current Election Status */}
      {electionInfo && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Election Status</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Election Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{electionInfo.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    electionInfo.isActive ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {electionInfo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Finalized:</span>
                  <span className={`font-medium ${
                    electionInfo.isFinalized ? 'text-purple-600' : 'text-orange-600'
                  }`}>
                    {electionInfo.isFinalized ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Voters:</span>
                  <span className="font-medium">{electionInfo.totalVoters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Votes Cast:</span>
                  <span className="font-medium">{electionInfo.totalVotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Winner ID:</span>
                  <span className="font-medium">
                    {electionInfo.winnerID > 0 ? `#${electionInfo.winnerID}` : 'TBD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Component */}
      <AdminPanel />

      {/* Help Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Administrator Guide</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Common Tasks</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Add candidates before voting starts
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Register voters during registration period
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Start voting when ready
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Monitor election progress
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                End voting and finalize results
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Security Notes</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                All admin actions are recorded on blockchain
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                Cannot modify results after finalization
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                Emergency controls available if needed
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                Keep your private keys secure
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> As an administrator, your actions directly affect the election process. 
            All transactions require blockchain confirmation and gas fees. Ensure you have sufficient 
            funds and double-check all actions before confirming.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;