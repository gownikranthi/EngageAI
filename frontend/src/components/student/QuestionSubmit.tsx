import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAppSelector } from '../../redux/hooks';
import { useToast } from '../../hooks/use-toast';

interface QuestionSubmitProps {
  eventId: string;
}

export const QuestionSubmit: React.FC<QuestionSubmitProps> = ({ eventId }) => {
  const { token, user } = useAppSelector(state => state.auth);
  const socket = useSocket(token);
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && socket && user) {
      setIsSubmitting(true);
      socket.emit('submitQuestion', {
        eventId,
        userId: user._id,
        text: question,
      }, () => {
        // This callback runs when the server acknowledges the event
        setQuestion('');
        setIsSubmitting(false);
        toast({
          title: "Success",
          description: "Your question has been submitted.",
        });
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        rows={3}
        disabled={isSubmitting}
      />
      <Button type="submit" disabled={!question.trim() || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Question'}
      </Button>
    </form>
  );
}; 