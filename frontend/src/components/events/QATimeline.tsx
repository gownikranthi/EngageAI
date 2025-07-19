import React, { useState } from 'react';
import { Question } from '../../services/events';
import { MessageSquare, Send, ThumbsUp, Clock } from 'lucide-react';

interface QATimelineProps {
  questions: Question[];
  onSubmitQuestion: (question: string) => void;
  disabled?: boolean;
}

export const QATimeline: React.FC<QATimelineProps> = ({ 
  questions, 
  onSubmitQuestion, 
  disabled = false 
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitQuestion(newQuestion.trim());
      setNewQuestion('');
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card-primary p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-subtitle text-foreground">Q&A Timeline</h3>
          <p className="text-caption text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Question Input */}
      <div className="mb-6">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question..."
            disabled={disabled || isSubmitting}
            className="flex-1 input-primary"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!newQuestion.trim() || disabled || isSubmitting}
            className={`
              btn-primary px-4 flex items-center space-x-2
              ${(!newQuestion.trim() || disabled || isSubmitting) 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
              }
            `}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No questions yet</p>
            <p className="text-caption text-muted-foreground">Be the first to ask a question!</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="p-4 bg-card-subtle rounded-lg border border-border-subtle">
              {/* Question Content */}
              <p className="text-body text-foreground mb-3">
                {question.text}
              </p>

              {/* Question Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-caption text-muted-foreground">
                    <span className="font-medium">{question.author}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-caption text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(question.timestamp)}</span>
                  </div>
                </div>

                {/* Vote Count */}
                {typeof question.votes === 'number' && (
                  <div className="flex items-center space-x-1 text-caption text-primary">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{question.votes}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};