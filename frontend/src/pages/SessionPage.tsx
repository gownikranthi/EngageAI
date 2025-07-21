import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchEvent, joinEvent } from '../redux/slices/eventSlice';
import { useSocket } from '../hooks/useSocket';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/events/PollCard';
import { QATimeline } from '../components/events/QATimeline';
import { ResourceCard } from '../components/events/ResourceCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { LivePoll } from '../components/student/LivePoll';
import { QuestionSubmit } from '../components/student/QuestionSubmit';
import { Button } from '../components/ui/button';
import { Tabs } from '../components/ui/tabs';

export const SessionPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { currentEvent, currentPoll, questions, isLoading, error } = useAppSelector(
    (state) => state.event
  );
  const { user } = useAppSelector((state) => state.auth);

  const [hasJoined, setHasJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  const { submitPoll, submitQuestion } = useSocket(eventId);

  useEffect(() => {
    if (!eventId) return;

    // Fetch event data
    dispatch(fetchEvent(eventId));

    // Auto-join event
    const autoJoin = async () => {
      try {
        await dispatch(joinEvent(eventId));
        setHasJoined(true);
        toast({
          title: "Joined event",
          description: "You're now connected to the live session!",
        });
      } catch (error) {
        console.error('Failed to join event:', error);
        // Don't show error toast for auto-join failures
      }
    };

    autoJoin();

    // Simulate connection status (in real app, this would come from socket)
    setIsConnected(true);
  }, [eventId, dispatch, toast]);

  const handlePollSubmit = (answer: string) => {
    if (currentPoll) {
      submitPoll(currentPoll._id, answer);
      toast({
        title: "Vote submitted",
        description: "Your response has been recorded!",
      });
    }
  };

  const handleQuestionSubmit = (question: string) => {
    submitQuestion(question);
    toast({
      title: "Question submitted",
      description: "Your question has been added to the timeline!",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activePoll = currentEvent?.polls?.find(poll => poll.isActive) || currentPoll;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading event session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !currentEvent) {
    return (
      <Layout>
        <div className="container-xl py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-title text-foreground mb-2">Event not found</h2>
            <p className="text-body text-muted-foreground mb-4">
              {error || 'The event you\'re looking for doesn\'t exist or has been removed.'}
            </p>
            <Button variant="default" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Column */}
          <div className="lg:w-2/3 space-y-8">
            <h1 className="text-hero text-foreground mb-2">{currentEvent.name}</h1>
            <p className="text-body text-muted-foreground mb-6">{currentEvent.description}</p>
            <div className="aspect-video bg-black rounded-lg mb-8 flex items-center justify-center text-white text-lg font-bold">
              Video Player Placeholder
            </div>
          </div>
          {/* Interactive Sidebar */}
          <div className="lg:w-1/3">
            <Tabs
              tabs={[
                {
                  label: 'Live Poll',
                  content: currentEvent ? <LivePoll eventId={currentEvent._id} /> : null,
                },
                {
                  label: 'Q&A',
                  content: currentEvent ? <QuestionSubmit eventId={currentEvent._id} /> : null,
                },
                {
                  label: 'Resources',
                  content: currentEvent ? <ResourceCard resources={currentEvent.resources || []} eventId={currentEvent._id} /> : null,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};