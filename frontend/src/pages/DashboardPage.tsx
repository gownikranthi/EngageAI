import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchEvents } from '../redux/slices/eventSlice';
import { Layout } from '../components/layout/Layout';
import { EventCard } from '../components/events/EventCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Calendar, TrendingUp, Users, Award, Bell } from 'lucide-react';
import { useState } from 'react';
import socketService from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { RAGChatbot } from '../components/chatbot/RAGChatbot';
import '../components/chatbot/RAGChatbot.css';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { events, isLoading, error } = useAppSelector((state) => state.event);
  const [notifications, setNotifications] = useState<{id: string, message: string, read: boolean, createdAt: string, eventId?: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    const socket = socketService.connect();
    const handleNewEvent = (data: { eventId: string, name: string, createdAt: string }) => {
      setNotifications((prev) => [
        {
          id: data.eventId,
          message: `New event created: ${data.name}`,
          read: false,
          createdAt: data.createdAt,
          eventId: data.eventId,
        },
        ...prev,
      ]);
    };
    socket.on('new_event_created', handleNewEvent);
    return () => {
      socket.off('new_event_created', handleNewEvent);
    };
  }, []);

  // Defensive coding to handle undefined values
  const upcomingEvents = events?.filter(event => new Date(event.startTime) > new Date()) || [];
  const pastEvents = events?.filter(event => new Date(event.startTime) <= new Date()) || [];
  const attendedEvents = events?.filter(event => event.participants?.includes(user?._id || '')) || [];

  const stats = [
    {
      label: 'Events Attended',
      value: attendedEvents.length,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents.length,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Total Events',
      value: events?.length || 0,
      icon: Calendar,
      color: 'text-purple-500'
    },
    {
      label: 'Engagement Score',
      value: user?.engagementScore || 0,
      icon: Award,
      color: 'text-yellow-500'
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container-xl py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-title text-foreground mb-2">Failed to load events</h2>
            <p className="text-body text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => dispatch(fetchEvents())}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-xl py-8">
        {/* Notification Bell */}
        <div className="fixed top-6 right-8 z-50">
          <button
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
            onClick={() => setShowDropdown((v) => !v)}
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border font-semibold">Notifications</div>
              <ul className="max-h-64 overflow-y-auto">
                {notifications.length === 0 && (
                  <li className="p-4 text-muted-foreground text-sm">No notifications yet.</li>
                )}
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`p-4 border-b border-border last:border-b-0 ${n.read ? 'bg-background' : 'bg-accent/10'} cursor-pointer hover:bg-accent/20`}
                    onClick={() => {
                      setNotifications((prev) => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                      if (n.eventId) navigate(`/event/${n.eventId}`);
                      setShowDropdown(false);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{n.message}</span>
                      <span className="text-xs text-muted-foreground ml-2">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {notifications.length > 0 && (
                <button
                  className="w-full py-2 text-sm text-primary hover:underline"
                  onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-hero text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-body text-muted-foreground">
            Discover and join engaging events in your community
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card-primary p-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-primary`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-foreground">Upcoming Events</h2>
              <span className="text-caption text-muted-foreground">
                {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, index) => (
                <div key={event._id} className="animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-foreground">Past Events</h2>
              <span className="text-caption text-muted-foreground">
                {pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.slice(0, 6).map((event, index) => (
                <div key={event._id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
            {pastEvents.length > 6 && (
              <div className="text-center mt-6">
                <button className="btn-secondary">
                  View All Past Events
                </button>
              </div>
            )}
          </section>
        )}

        {/* Empty State */}
        {(!events || events.length === 0) && (
          <div className="text-center py-16">
            <Calendar className="w-24 h-24 text-muted-foreground/50 mx-auto mb-6" />
            <h2 className="text-title text-foreground mb-2">No events yet</h2>
            <p className="text-body text-muted-foreground mb-6 max-w-md mx-auto">
              Events will appear here once they're created. Check back soon for exciting opportunities to engage!
            </p>
          </div>
        )}
      </div>
      {/* Add the chatbot at the end */}
      <RAGChatbot />
    </Layout>
  );
};