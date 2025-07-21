import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface PollOption {
  _id: string;
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
}

interface LivePollProps {
  poll: Poll;
  onVote: (optionId: string) => void;
}

export const LivePoll: React.FC<LivePollProps> = ({ poll, onVote }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (selectedOption) {
      onVote(selectedOption);
      setHasVoted(true);
    }
  };

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.question}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasVoted ? (
          <div className="space-y-4">
            <p className="font-semibold">Thanks for voting!</p>
            {poll.options.map(option => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              return (
                <div key={option._id} className="w-full">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{option.text}</span>
                    <span>{Math.round(percentage)}% ({option.votes})</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup onValueChange={setSelectedOption}>
              {poll.options.map(option => (
                <div key={option._id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option._id} id={option._id} />
                  <Label htmlFor={option._id}>{option.text}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button onClick={handleVote} disabled={!selectedOption}>
              Submit Vote
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 