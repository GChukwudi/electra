/**
 * ResultsDisplay Component - Displays detailed election results
 */

import React from 'react';
import { web3Utils } from '../utils/web3Utils';

const ResultsDisplay = ({ candidates, totalVotes, isFinalized }) => {
  const calculatePercentage = (votes, total) => {
    if (!total || total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
  };

  const getPositionSuffix = (position) => {
    const suffixes = ['st', 'nd', 'rd'];
    const lastDigit = position % 10;
    const lastTwoDigits = position % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th';
    }
    
    return suffixes[lastDigit - 1] || 'th';
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏃';
    }
  };

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Candidates</h3>
        <p className="text-gray-600">No candidates are available for this election.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {isFinalized ? 'Final Results' : 'Current Results'}
        </h3>
        <div className="text-sm text-gray-600">
          Total Votes: <span className="font-semibold">{totalVotes.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4">
        {candidates.map((candidate, index) => {
          const position = index + 1;
          const percentage = calculatePercentage(candidate.voteCount, totalVotes);
          const isWinner = position === 1 && totalVotes > 0;
          
          return (
            <div
              key={candidate.id}
              className={`border rounded-lg p-4 transition-all ${
                isWinner && isFinalized
                  ? 'border-yellow-300 bg-yellow-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Candidate Info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Position Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                    {getPositionIcon(position)} {position}{getPositionSuffix(position)}
                  </div>
                  
                  {/* Candidate Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-lg font-bold ${
                          isWinner && isFinalized ? 'text-yellow-800' : 'text-gray-900'
                        }`}>
                          {candidate.name}
                          {isWinner && isFinalized && <span className="ml-2">👑</span>}
                        </h4>
                        <p className="text-blue-600 font-medium">{candidate.party}</p>
                      </div>
                      
                      {/* Vote Count and Percentage */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {candidate.voteCount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {percentage}% of votes
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isWinner && isFinalized
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : position === 1
                              ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                              : position === 2
                              ? 'bg-gradient-to-r from-gray-400 to-gray-600'
                              : position === 3
                              ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                              : 'bg-gradient-to-r from-blue-300 to-blue-500'
                          }`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional candidate info on mobile */}
              <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Position: {position}{getPositionSuffix(position)}</span>
                  <span>{candidate.voteCount} votes ({percentage}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results Summary */}
      {totalVotes > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{candidates.length}</div>
              <div className="text-sm text-gray-600">Total Candidates</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">{totalVotes.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Votes Cast</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {candidates[0]?.voteCount > 0 ? calculatePercentage(candidates[0].voteCount, totalVotes) : 0}%
              </div>
              <div className="text-sm text-gray-600">Leading Margin</div>
            </div>
          </div>
        </div>
      )}

      {/* No Votes Message */}
      {totalVotes === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🗳️</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Votes Cast Yet</h4>
          <p className="text-gray-600">
            Results will appear here once voting begins and votes are cast.
          </p>
        </div>
      )}

      {/* Winner Declaration */}
      {isFinalized && totalVotes > 0 && candidates[0] && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Election Winner Declared!
            </h4>
            <p className="text-gray-700">
              <span className="font-bold text-yellow-700">{candidates[0].name}</span> from{' '}
              <span className="font-bold text-yellow-700">{candidates[0].party}</span> has won the election
              with <span className="font-bold">{candidates[0].voteCount.toLocaleString()} votes</span>{' '}
              ({calculatePercentage(candidates[0].voteCount, totalVotes)}% of total votes).
            </p>
          </div>
        </div>
      )}

      {/* Live Results Disclaimer */}
      {!isFinalized && totalVotes > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-1">📊 Live Results</h4>
            <p className="text-blue-700 text-sm">
              These results are updated in real-time as votes are cast. Final results will be available 
              after the voting period ends and the election is officially certified.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;