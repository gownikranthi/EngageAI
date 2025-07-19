import React, { useState } from 'react';
import { Poll } from '../../services/events';
import { BarChart3, Users, Check } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onSubmit, disabled = false }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);

  const handleSubmit = () => {
    if (selectedOption && !hasVoted) {
      onSubmit(selectedOption);
      setHasVoted(true);
    }
  };

  const totalVotes = poll.results ? Object.values(poll.results).reduce((sum, count) => sum + count, 0) : 0;

  const getPercentage = (option: string): number => {
    if (!poll.results || totalVotes === 0) return 0;
    return Math.round((poll.results[option] || 0) / totalVotes * 100);
  };

  return (
    <div className="card-primary p-6 animate-scale-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-subtitle text-foreground">Live Poll</h3>
            {poll.isActive && (
              <span className="text-caption text-primary font-medium">Active</span>
            )}
          </div>
        </div>
        {totalVotes > 0 && (
          <div className="flex items-center text-caption text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Question */}
      <h4 className="text-lg font-medium text-foreground mb-6">
        {poll.question}
      </h4>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {poll.options.map((option, index) => {
          const percentage = getPercentage(option);
          const votes = poll.results?.[option] || 0;
          const isSelected = selectedOption === option;
          const showResults = hasVoted || !poll.isActive;

          return (
            <div key={index} className="relative">
              <button
                onClick={() => setSelectedOption(option)}
                disabled={disabled || hasVoted || !poll.isActive}
                className={`
                  w-full p-4 rounded-lg border text-left transition-all duration-200
                  ${isSelected 
                    ? 'border-primary bg-primary/5 text-foreground' 
                    : 'border-border hover:border-primary/50 text-foreground'
                  }
                  ${(disabled || hasVoted || !poll.isActive) 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {isSelected && !hasVoted && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                  {showResults && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{percentage}%</span>
                      <span>({votes})</span>
                    </div>
                  )}
                </div>

                {/* Results Bar */}
                {showResults && (
                  <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {poll.isActive && !hasVoted && (
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || disabled}
          className={`
            w-full btn-primary
            ${!selectedOption || disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
            }
          `}
        >
          Submit Vote
        </button>
      )}

      {/* Status Messages */}
      {hasVoted && (
        <div className="flex items-center justify-center space-x-2 text-primary">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Vote submitted!</span>
        </div>
      )}

      {!poll.isActive && (
        <div className="text-center text-muted-foreground text-sm">
          This poll has ended
        </div>
      )}
    </div>
  );
};