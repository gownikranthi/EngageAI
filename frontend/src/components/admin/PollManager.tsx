import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Event, Poll, eventService } from '../../services/events';
import { Plus, Send } from 'lucide-react';

interface PollManagerProps {
  event: Event | null;
  onPollsUpdate: (updatedEvent: Event) => void;
}

export const PollManager: React.FC<PollManagerProps> = ({ event, onPollsUpdate }) => {
  const socket = useSocket();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });

  if (!event) return null;

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPoll.question.trim() === '' || newPoll.options.some(o => o.trim() === '')) {
      alert('Question and all options must be filled.');
      return;
    }
    try {
      const response = await eventService.createPoll(event._id, newPoll);
      const updatedEvent = { ...event, polls: [...(event.polls || []), response.data] };
      onPollsUpdate(updatedEvent);
      setShowCreateForm(false);
      setNewPoll({ question: '', options: ['', ''] });
      alert('Poll created successfully.');
    } catch (error) {
      alert('Failed to create poll.');
    }
  };

  const handleLaunchPoll = (pollId: string) => {
    if (socket) {
      socket.emit('poll:launch', { eventId: event._id, pollId });
      alert('The poll is now live for participants.');
    }
  };

  const addOption = () => {
    setNewPoll(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  return (
    <div className="card-primary p-6 mt-8">
      <h3 className="text-subtitle text-foreground mb-4">Live Polls</h3>
      {event.polls && event.polls.length > 0 && (
        <div className="space-y-4 mb-6">
          {event.polls.map(poll => (
            <div key={poll._id} className="p-4 border rounded-lg flex justify-between items-center">
              <p className="font-medium">{poll.question}</p>
              <button onClick={() => handleLaunchPoll(poll._id)} className="btn-secondary flex items-center gap-2">
                <Send size={16} /> Launch
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateForm ? (
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <input
            type="text"
            placeholder="Poll Question"
            value={newPoll.question}
            onChange={(e) => setNewPoll(p => ({ ...p, question: e.target.value }))}
            className="input-primary"
          />
          {newPoll.options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...newPoll.options];
                newOptions[index] = e.target.value;
                setNewPoll(p => ({ ...p, options: newOptions }));
              }}
              className="input-primary"
            />
          ))}
          <div className="flex justify-between items-center">
            <button type="button" onClick={addOption} className="btn-secondary text-sm">Add Option</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Poll</button>
            </div>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowCreateForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create New Poll
        </button>
      )}
    </div>
  );
}; 