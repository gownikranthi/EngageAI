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
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export const AdminPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [crudLoading, setCrudLoading] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
        const response: unknown = await eventService.getAllEvents();
        let eventsArray: Event[] = [];
        if (Array.isArray(response)) {
          eventsArray = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as { data?: unknown }).data)) {
          eventsArray = (response as { data: Event[] }).data;
        } else if (response && typeof response === 'object' && 'events' in response && Array.isArray((response as { events?: unknown }).events)) {
          eventsArray = (response as { events: Event[] }).events;
        }
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

  // Helper to refresh events
  const refreshEvents = async (selectId?: string) => {
    setEventsLoading(true);
    try {
      const response: unknown = await eventService.getAllEvents();
      let eventsArray: Event[] = [];
      if (Array.isArray(response)) {
        eventsArray = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as { data?: unknown }).data)) {
        eventsArray = (response as { data: Event[] }).data;
      } else if (response && typeof response === 'object' && 'events' in response && Array.isArray((response as { events?: unknown }).events)) {
        eventsArray = (response as { events: Event[] }).events;
      }
      setEvents(eventsArray);
      if (selectId) setSelectedEventId(selectId);
      else if (eventsArray.length > 0) setSelectedEventId(eventsArray[0]._id);
      else setSelectedEventId('');
    } catch (error: unknown) {
      toast({ title: 'Error', description: 'Failed to load events.', variant: 'destructive' });
    } finally {
      setEventsLoading(false);
    }
  };

  // Open modal for create
  const openCreateModal = () => {
    setModalMode('create');
    setForm({ name: '', description: '', startTime: '', endTime: '' });
    setModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = () => {
    const event = events.find(e => e._id === selectedEventId);
    if (!event) return;
    setModalMode('edit');
    setForm({
      name: event.name,
      description: event.description,
      startTime: event.startTime?.slice(0, 16) || '',
      endTime: event.endTime?.slice(0, 16) || '',
    });
    setModalOpen(true);
  };

  // Handle form input
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudLoading(modalMode);
    setErrorBanner(null);
    try {
      if (modalMode === 'create') {
        await eventService.createEvent(form);
        toast({ title: 'Success', description: 'Event created successfully!', variant: 'default' });
      } else {
        await eventService.updateEvent(selectedEventId, form);
        toast({ title: 'Success', description: 'Event updated successfully!', variant: 'default' });
      }
      setModalOpen(false);
      await refreshEvents();
    } catch (error: unknown) {
      let message = 'Failed to save event.';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response.data as { message?: string }).message || message;
      }
      setErrorBanner(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setCrudLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setCrudLoading('delete');
    setErrorBanner(null);
    try {
      await eventService.deleteEvent(selectedEventId);
      toast({ title: 'Success', description: 'Event deleted successfully!', variant: 'default' });
      setDeleteConfirmOpen(false);
      await refreshEvents();
    } catch (error: unknown) {
      let message = 'Failed to delete event.';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response.data as { message?: string }).message || message;
      }
      setErrorBanner(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setCrudLoading(null);
    }
  };

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
    { name: 'Polls', value: analytics.engagementBreakdown.polls || 0, color: '#007AFF' },
    { name: 'Questions', value: analytics.engagementBreakdown.questions || 0, color: '#34C759' },
    { name: 'Downloads', value: analytics.engagementBreakdown.downloads || 0, color: '#FF9500' },
    { name: 'Time Spent', value: analytics.engagementBreakdown.timeSpent || 0, color: '#AF52DE' },
  ] : [];

  const topUsersData = analytics?.topUsers.map(user => ({
    name: user.name,
    score: user.score,
  })) || [];


  return (
    <Layout>
      <div className="container-xl py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-hero text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-body text-muted-foreground">
              Analyze event engagement and track user participation
            </p>
          </div>
          <Button onClick={openCreateModal} className="ml-4">Create New Event</Button>
        </div>
        {/* Error Banner */}
        {errorBanner && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-800 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-4 text-red-500 hover:underline">Dismiss</button>
          </div>
        )}
        {/* Event Selector */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="event-select" className="block text-sm font-medium text-foreground mb-2">
              Select Event
            </label>
            <div className="relative max-w-md">
              {eventsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-2/3" />
                </div>
              ) : (
                <>
                  <select
                    id="event-select"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    disabled={eventsLoading}
                    className="input-primary pr-10 appearance-none cursor-pointer"
                  >
                    {events.length === 0 ? (
                      <option>No events available</option>
                    ) : (
                      events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </>
              )}
            </div>
          </div>
          <Button onClick={openEditModal} disabled={!selectedEventId || eventsLoading} variant="secondary">
            {crudLoading === 'edit' ? <LoadingSpinner size="sm" /> : 'Edit'}
          </Button>
          <Button onClick={() => setDeleteConfirmOpen(true)} disabled={!selectedEventId || eventsLoading} variant="destructive">
            {crudLoading === 'delete' ? <LoadingSpinner size="sm" /> : 'Delete'}
          </Button>
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
        {/* Create/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-2">{modalMode === 'create' ? 'Create New Event' : 'Edit Event'}</h2>
            <div>
              <label className="block mb-1 font-medium">Event Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                className="input-primary w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                className="input-primary w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleFormChange}
                className="input-primary w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={handleFormChange}
                className="input-primary w-full"
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={crudLoading === 'create' || crudLoading === 'edit'}>
                {crudLoading === 'create' || crudLoading === 'edit' ? <LoadingSpinner size="sm" /> : (modalMode === 'create' ? 'Create' : 'Save Changes')}
              </Button>
            </div>
          </form>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Delete Event</h2>
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={crudLoading === 'delete'}>
                {crudLoading === 'delete' ? <LoadingSpinner size="sm" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </Layout>
  );
};
