import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { adminService, AdminAnalytics } from '../services/admin';
import { eventService, Event } from '../services/events';
import { useToast } from '../hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  BarChart3, Users, Download, MessageSquare, Award, ChevronDown,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response: any = await eventService.getAllEvents();
        // FIX #1: Safely extract the array from the response object
        const eventsArray = Array.isArray(response) ? response : response.data || response.events || [];
        
        setEvents(eventsArray);
        if (eventsArray.length > 0) {
          // Use ._id which is standard for MongoDB
          setSelectedEventId(eventsArray[0]._id);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        toast({
          title: "Error",
          description: "Failed to load events.",
          variant: "destructive",
        });
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, [toast]);

  // Load analytics when event is selected
  useEffect(() => {
    if (!selectedEventId) return;

    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const analyticsData = await adminService.getEventAnalytics(selectedEventId);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedEventId, toast]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="container-xl py-8 text-center">
            <h2 className="text-title text-foreground mb-2">Access Denied</h2>
            <p className="text-body text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
        </div>
      </Layout>
    );
  }

  // Data preparation for charts
  const engagementData = analytics ? [
    { name: 'Polls', value: analytics.engagementBreakdown.polls, color: '#007AFF' },
    { name: 'Questions', value: analytics.engagementBreakdown.questions, color: '#34C759' },
    { name: 'Downloads', value: analytics.engagementBreakdown.downloads, color: '#FF9500' },
    { name: 'Time Spent', value: analytics.engagementBreakdown.timeSpent, color: '#AF52DE' },
  ] : [];

  const topUsersData = analytics?.topUsers.map(user => ({
    name: user.name,
    score: user.score,
  })) || [];


  return (
    <Layout>
      <div className="container-xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-hero text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-body text-muted-foreground">
            Analyze event engagement and track user participation
          </p>
        </div>

        {/* Event Selector */}
        <div className="mb-8">
          <label htmlFor="event-select" className="block text-sm font-medium text-foreground mb-2">
            Select Event
          </label>
          <div className="relative max-w-md">
            <select
              id="event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={eventsLoading}
              className="input-primary pr-10 appearance-none cursor-pointer"
            >
              {eventsLoading ? (
                <option>Loading events...</option>
              ) : events.length === 0 ? (
                <option>No events available</option>
              ) : (
                // FIX #2: Use <option> tags inside a <select>
                events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Loading State for Analytics */}
        {isLoading && (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {analytics && !isLoading && (
          <div className="space-y-8">
            {/* ... rest of your analytics JSX ... */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {/* Cards */}
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-primary p-6">
                  <h3 className="text-subtitle text-foreground mb-6">Engagement Breakdown</h3>
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={engagementData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                           {engagementData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
                 <div className="card-primary p-6">
                  <h3 className="text-subtitle text-foreground mb-6">Top Users by Score</h3>
                   <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topUsersData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" fill="#007AFF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                   </div>
                 </div>
             </div>
          </div>
        )}

        {/* No Data State */}
        {!analytics && !isLoading && selectedEventId && (
            <div className="text-center py-16">
              <BarChart3 className="w-24 h-24 text-muted-foreground/50 mx-auto mb-6" />
              <h2 className="text-title text-foreground mb-2">No Analytics Data</h2>
              <p className="text-body text-muted-foreground max-w-md mx-auto">
                Analytics data for this event will appear here once users start engaging.
              </p>
            </div>
        )}
      </div>
    </Layout>
  );
};
