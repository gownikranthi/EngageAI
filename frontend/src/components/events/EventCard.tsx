import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../../services/events';
import { Calendar, MapPin, Users, ArrowRight, Eye } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const participantCount = event.participants?.length || 0;
  const isUpcoming = new Date(event.startTime) > new Date();

  return (
    <div className="card-primary p-6 group hover:shadow-lg transition-all duration-300 animate-fade-in">
      {/* Event Image */}
      {event.imageUrl && (
        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-card-subtle">
          <img 
            src={event.imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Event Content */}
      <div className="space-y-4">
        {/* Title */}
        <h3 className="text-subtitle text-foreground group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        {/* Description */}
        <p className="text-body text-muted-foreground line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2">
          {/* Date */}
          <div className="flex items-center text-caption text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            {formatDate(event.startTime)}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center text-caption text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {event.location}
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center text-caption text-muted-foreground">
            <Users className="w-4 h-4 mr-2 text-primary" />
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <Link
            to={`/event/${event._id}`}
            className="btn-secondary w-full flex items-center justify-center space-x-2 group"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </Link>
          
          {isUpcoming && (
            <Link
              to={`/session/${event._id}`}
              className="btn-primary w-full flex items-center justify-center space-x-2 group"
            >
              <span>Join Session</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {/* View Rewind for past events */}
          {!isUpcoming && (
            <Link
              to={`/event-rewind/${event._id}`}
              className="btn-outline w-full flex items-center justify-center space-x-2 group"
            >
              <span>View Rewind</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};