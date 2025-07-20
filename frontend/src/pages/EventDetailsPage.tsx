import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchEvent } from '../redux/slices/eventSlice';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft,
  User,
  FileText,
  Play
} from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { currentEvent, isLoading, error } = useAppSelector((state) => state.event);
  const { user } = useAppSelector((state) => state.auth);

  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEvent(eventId));
    }
  }, [eventId, dispatch]);

  const handleJoinSession = async () => {
    if (!eventId) return;
    
    setIsJoining(true);
    try {
      // Navigate to session page - the join logic will happen there
      navigate(`/session/${eventId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
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

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading event details...</p>
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
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="default"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isUpcoming = new Date(currentEvent.startTime) > new Date();
  const hasJoined = currentEvent.participants?.includes(user?._id || '');

  return (
    <Layout>
      <div className="container-xl py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-hero text-foreground">{currentEvent.name}</h1>
            </div>
          </div>

          {/* Event Image */}
          {currentEvent.imageUrl && (
            <div className="w-full h-64 mb-6 rounded-lg overflow-hidden bg-card-subtle">
              <img 
                src={currentEvent.imageUrl} 
                alt={currentEvent.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-body text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(currentEvent.startTime)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-body text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{formatDuration(currentEvent.startTime, currentEvent.endTime)}</span>
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
          <div className="mb-8">
            <h2 className="text-subtitle text-foreground mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              About This Event
            </h2>
            <p className="text-body text-muted-foreground max-w-3xl leading-relaxed">
              {currentEvent.description}
            </p>
          </div>

          {/* Organizer Info */}
          {currentEvent.createdBy && (
            <div className="mb-8">
              <h2 className="text-subtitle text-foreground mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Organizer
              </h2>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-body font-medium text-foreground">
                    {typeof currentEvent.createdBy === 'string' 
                      ? 'Event Organizer' 
                      : currentEvent.createdBy.name}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {typeof currentEvent.createdBy === 'string' 
                      ? 'EngageAI Team' 
                      : currentEvent.createdBy.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Join Session Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            {isUpcoming ? (
              <Button 
                onClick={handleJoinSession}
                disabled={isJoining}
                variant="default"
                size="lg"
                className="flex-1 h-12 text-lg"
              >
                {isJoining ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {hasJoined ? 'Rejoin Session' : 'Join Session'}
                  </>
                )}
              </Button>
            ) : (
              <div className="flex-1 p-4 bg-muted rounded-lg text-center">
                <p className="text-body text-muted-foreground">
                  This event has already ended
                </p>
              </div>
            )}
            
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              size="lg"
              className="h-12"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}; 