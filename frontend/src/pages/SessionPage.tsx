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
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-xl py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-hero text-foreground">{currentEvent.name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-2 text-primary">
                  <Wifi className="w-4 h-4" />
                  <span className="text-caption">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-caption">Disconnected</span>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-body text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(currentEvent.startTime)}</span>
            </div>
            {currentEvent.location && (
              <div className="flex items-center space-x-2 text-body text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{currentEvent.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-body text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>{currentEvent.participants?.length || 0} participants</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-body text-muted-foreground max-w-3xl">
            {currentEvent.description}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Active Poll */}
            {activePoll && (
              <PollCard
                poll={activePoll}
                onSubmit={handlePollSubmit}
                disabled={!hasJoined || !isConnected}
              />
            )}

            {/* Resources */}
            <ResourceCard
              resources={currentEvent.resources || []}
              eventId={currentEvent._id}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Q&A Timeline */}
            <QATimeline
              questions={questions}
              onSubmitQuestion={handleQuestionSubmit}
              disabled={!hasJoined || !isConnected}
            />
          </div>
        </div>

        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
            <div className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg flex items-center space-x-2">
              <WifiOff className="w-5 h-5" />
              <span className="text-sm">Connection lost. Trying to reconnect...</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};