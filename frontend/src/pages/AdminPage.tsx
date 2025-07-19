import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { adminService, AdminAnalytics } from '../services/admin';
import { eventService, Event } from '../services/events';
import { useToast } from '../hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  Users,
  TrendingUp,
  Download,
  MessageSquare,
  Clock,
  Award,
  ChevronDown,
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
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData);
        if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id);
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
        <div className="container-xl py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-title text-foreground mb-2">Access Denied</h2>
            <p className="text-body text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const engagementData = analytics ? [
    { name: 'Polls', value: analytics.engagementBreakdown.polls, color: '#007AFF' },
    { name: 'Questions', value: analytics.engagementBreakdown.questions, color: '#34C759' },
    { name: 'Downloads', value: analytics.engagementBreakdown.downloads, color: '#FF9500' },
    { name: 'Time Spent', value: analytics.engagementBreakdown.timeSpent, color: '#AF52DE' },
  ] : [];

  const topUsersData = analytics?.topUsers.map(user => ({
    name: user.name,
    score: user.score,
    polls: user.engagement.polls,
    questions: user.engagement.questions,
    downloads: user.engagement.downloads,
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
                {Array.isArray(events) && events.map((event) => (
                     <div key={event._id}>
                    <p>{event.name}</p>
                   </div>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Loading State */}
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
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted-foreground mb-1">Total Participants</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.totalParticipants}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="card-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted-foreground mb-1">Poll Responses</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.engagementBreakdown.polls}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="card-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted-foreground mb-1">Questions Asked</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.engagementBreakdown.questions}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="card-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted-foreground mb-1">Downloads</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.engagementBreakdown.downloads}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Engagement Breakdown Pie Chart */}
              <div className="card-primary p-6">
                <h3 className="text-subtitle text-foreground mb-6">Engagement Breakdown</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {engagementData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-caption text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Users Bar Chart */}
              <div className="card-primary p-6">
                <h3 className="text-subtitle text-foreground mb-6">Top Users by Score</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topUsersData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#007AFF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            {analytics.timelineData.length > 0 && (
              <div className="card-primary p-6">
                <h3 className="text-subtitle text-foreground mb-6">Activity Timeline</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="participants" 
                        stroke="#007AFF" 
                        strokeWidth={2}
                        name="Participants"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="activity" 
                        stroke="#34C759" 
                        strokeWidth={2}
                        name="Activity"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Users Table */}
            <div className="card-primary p-6">
              <h3 className="text-subtitle text-foreground mb-6">Top Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-caption font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 text-caption font-medium text-muted-foreground">User</th>
                      <th className="text-right py-3 text-caption font-medium text-muted-foreground">Score</th>
                      <th className="text-right py-3 text-caption font-medium text-muted-foreground">Polls</th>
                      <th className="text-right py-3 text-caption font-medium text-muted-foreground">Questions</th>
                      <th className="text-right py-3 text-caption font-medium text-muted-foreground">Downloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topUsers.slice(0, 10).map((user, index) => (
                      <tr key={user.id} className="border-b border-border-subtle hover:bg-card-subtle">
                        <td className="py-3">
                          <div className="flex items-center">
                            <span className="text-body font-medium text-foreground">#{index + 1}</span>
                            {index < 3 && (
                              <Award className={`w-4 h-4 ml-2 ${
                                index === 0 ? 'text-yellow-500' : 
                                index === 1 ? 'text-gray-400' : 'text-yellow-600'
                              }`} />
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-body text-foreground">{user.name}</td>
                        <td className="py-3 text-right text-body font-medium text-foreground">{user.score}</td>
                        <td className="py-3 text-right text-body text-muted-foreground">{user.engagement.polls}</td>
                        <td className="py-3 text-right text-body text-muted-foreground">{user.engagement.questions}</td>
                        <td className="py-3 text-right text-body text-muted-foreground">{user.engagement.downloads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              Analytics data will appear here once users start engaging with the selected event.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};
