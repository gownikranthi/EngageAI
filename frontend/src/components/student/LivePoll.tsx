import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Poll } from '../../services/events';

interface LivePollProps {
  eventId: string;
}

export const LivePoll: React.FC<LivePollProps> = ({ eventId }) => {
  const socket = useSocket();
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNewPoll = (poll: Poll) => {
      setActivePoll(poll);
      setHasVoted(false); // Reset vote status for new poll
    };
    const handlePollUpdate = (poll: Poll) => {
      setActivePoll(poll);
    };

    socket.on('poll:new', handleNewPoll);
    socket.on('poll:update', handlePollUpdate);

    return () => {
      socket.off('poll:new', handleNewPoll);
      socket.off('poll:update', handlePollUpdate);
    };
  }, [socket]);

  const handleVote = (optionId: string) => {
    if (socket && activePoll) {
      socket.emit('poll:vote', { eventId, pollId: activePoll._id, optionId });
      setHasVoted(true);
    }
  };

  if (!activePoll) {
    return (
      <div className="card-primary p-6 text-center">
        <p className="text-muted-foreground">Waiting for the next poll...</p>
      </div>
    );
  }

  const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="card-primary p-6">
      <h3 className="text-subtitle text-foreground mb-4">{activePoll.question}</h3>
      <div className="space-y-3">
        {activePoll.options.map(option => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          return (
            <div key={option._id}>
              {hasVoted ? (
                <div className="relative h-10 flex items-center justify-between px-4 border rounded-lg">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary/20 rounded-lg"
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <span className="relative font-medium">{option.text}</span>
                  <span className="relative font-bold">{percentage.toFixed(0)}%</span>
                </div>
              ) : (
                <button
                  onClick={() => handleVote(option._id)}
                  className="w-full btn-secondary text-left"
                >
                  {option.text}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 