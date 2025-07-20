import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Question } from '../../services/events';
import { User, MessageCircle } from 'lucide-react';

interface AdminQAFeedProps {
  initialQuestions: Question[];
}

export const AdminQAFeed: React.FC<AdminQAFeedProps> = ({ initialQuestions }) => {
  const socket = useSocket();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  useEffect(() => {
    if (!socket) return;

    const handleNewQuestion = (newQuestion: Question) => {
      // Add new questions to the top of the list
      setQuestions(prev => [newQuestion, ...prev]);
    };

    socket.on('question:new', handleNewQuestion);

    return () => {
      socket.off('question:new', handleNewQuestion);
    };
  }, [socket]);

  return (
    <div className="card-primary p-6 mt-8">
      <h3 className="text-subtitle text-foreground mb-4">Live Q&A Feed</h3>
      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="mx-auto mb-2" size={32} />
          <p>Questions from participants will appear here live.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {questions.map(q => (
            <div key={q._id} className="p-4 bg-card-subtle rounded-lg">
              <p className="text-body mb-2">{q.text}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <User size={14} className="mr-2" />
                <span>{q.authorName}</span>
                <span className="mx-2">•</span>
                <span>{new Date(q.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 