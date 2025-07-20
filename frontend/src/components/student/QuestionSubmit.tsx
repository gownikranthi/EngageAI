import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAppSelector } from '../../redux/hooks';
import { Send } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface QuestionSubmitProps {
  eventId: string;
}

export const QuestionSubmit: React.FC<QuestionSubmitProps> = ({ eventId }) => {
  const socket = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !user || !questionText.trim()) return;

    setIsSubmitting(true);
    socket.emit('question:submit', {
      eventId,
      questionText,
      user: { id: user._id, name: user.name }
    });
    // Optimistically clear the input and show a toast
    setQuestionText('');
    setIsSubmitting(false);
    toast({ title: "Question Submitted!", description: "Your question has been sent to the presenter." });
  };

  return (
    <div className="card-primary p-6 mt-8">
      <h3 className="text-subtitle text-foreground mb-4">Ask a Question</h3>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Type your question here..."
          className="input-primary flex-grow"
          disabled={isSubmitting}
        />
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}; 