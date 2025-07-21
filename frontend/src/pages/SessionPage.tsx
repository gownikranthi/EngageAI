import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { eventService, Event } from '../services/events';
import { useSocket } from '../hooks/useSocket';
import { LivePoll } from '../components/student/LivePoll';
import { QuestionSubmit } from '../components/student/QuestionSubmit';
import { Button } from '../components/ui/button';
import { Tabs } from '../components/ui/tabs';

export const SessionPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAppSelector(state => state.auth);
  const socket = useSocket(token);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for interactive components
  const [activePoll, setActivePoll] = useState<any>(null);

  useEffect(() => {
    if (!eventId) {
      setError("No event ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      try {
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);

        // Join the event room via socket
        if (socket && user) {
          socket.emit('joinEvent', { eventId, userId: user._id });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();

  }, [eventId, socket, user]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new polls being launched
    const handlePollLaunch = (poll: any) => {
      setActivePoll(poll);
    };

    socket.on('pollLaunched', handlePollLaunch);

    return () => {
      socket.off('pollLaunched', handlePollLaunch);
    };
  }, [socket]);


  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="text-center py-10">
          <p>Event not found.</p>
        </div>
      </Layout>
    );
  }

  const handleVote = (optionId: string) => {
    if (socket && activePoll) {
      socket.emit('votePoll', { pollId: activePoll._id, optionId });
      // Optionally, show a "voted" state locally
    }
  };

  const interactiveTabs = [
    {
      label: 'Live Poll',
      content: activePoll ? (
        <LivePoll poll={activePoll} onVote={handleVote} />
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No active poll at the moment.
        </div>
      ),
    },
    {
      label: 'Q&A',
      content: <QuestionSubmit eventId={event._id} />,
    },
    {
      label: 'Resources',
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Event Resources</h3>
          {event.resources && event.resources.length > 0 ? (
            <ul className="list-disc pl-5">
              {event.resources.map(resource => (
                <li key={resource._id}>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No resources available for this event.</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
          <p className="text-muted-foreground">{event.description}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 bg-muted rounded-lg p-8 flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground text-lg">Main presentation area</p>
          </div>
          
          {/* Interactive Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card p-4 rounded-lg shadow-sm">
              <Tabs tabs={interactiveTabs} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};