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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { PollManager } from '../components/admin/PollManager';
import { AdminQAFeed } from '../components/admin/AdminQAFeed';
import { Textarea } from '../components/ui/textarea';
import { AdminResourceManager } from '../components/admin/AdminResourceManager';
import { Tabs } from '../components/ui/tabs';

export const AdminPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [crudLoading, setCrudLoading] = useState<'create' | 'edit' | 'delete' | 'clone' | 'summary' | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [currentEventDetails, setCurrentEventDetails] = useState<Event | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

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

  // In the useEffect that loads analytics, also load full event details
  useEffect(() => {
    if (!selectedEventId) return;
    const loadEventDetails = async () => {
      try {
        const eventDetails = await eventService.getEvent(selectedEventId);
        setCurrentEventDetails(eventDetails);
      } catch (error) {
        setCurrentEventDetails(null);
      }
    };
    loadEventDetails();
  }, [selectedEventId]);

  useEffect(() => {
    setUsersLoading(true);
    setUsersError(null);
    adminService.getAllUsers().then(res => {
      setUsers(res.data || []);
      setUsersLoading(false);
    }).catch(err => {
      setUsersError('Failed to load users. Please try again later.');
      setUsersLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setParticipantsLoading(true);
    setParticipantsError(null);
    adminService.getEventParticipants(selectedEventId).then(res => {
      setParticipants(res.data || []);
      setParticipantsLoading(false);
    }).catch(err => {
      setParticipantsError('Failed to load participants. Please try again later.');
      setParticipantsLoading(false);
    });
  }, [selectedEventId]);

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

  // Handle delete (optimistic UI)
  const handleDelete = async (eventId: string) => {
    const originalEvents = events;
    // Optimistically update the UI
    setEvents(currentEvents => currentEvents.filter(event => event._id !== eventId));

    try {
      await eventService.deleteEvent(eventId);
      toast({
        title: "Success",
        description: "Event deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Revert the UI on failure
      setEvents(originalEvents);
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await adminService.deleteUser(userId);
    setUsers(users => users.filter(u => u._id !== userId));
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

  // Defensive mapping for analytics
  const totalParticipants = analytics?.participation?.totalParticipants ?? analytics?.totalParticipants ?? 0;
  const totalDownloads = analytics?.engagement?.totalDownloads ?? analytics?.engagementBreakdown?.downloads ?? 0;
  const totalQuestions = analytics?.engagement?.totalQA ?? analytics?.engagementBreakdown?.questions ?? 0;
  const avgScore = analytics?.topParticipants?.length > 0
    ? (
        analytics.topParticipants.reduce((sum, p) => sum + (p.engagementCount || 0), 0) / analytics.topParticipants.length
      ).toFixed(1)
    : '0.0';
  const engagementBreakdown = analytics?.engagementBreakdown || analytics?.engagement || {};
  const topUsers = analytics?.topParticipants || analytics?.topUsers || [];

  // Data preparation for charts (map backend fields to expected frontend structure)
  const engagementData = analytics ? [
    { name: 'Polls', value: analytics.engagement?.totalPolls || 0, color: '#007AFF' },
    { name: 'Questions', value: analytics.engagement?.totalQA || 0, color: '#34C759' },
    { name: 'Downloads', value: analytics.engagement?.totalDownloads || 0, color: '#FF9500' },
  ] : [];

  const topUsersData = (analytics?.topParticipants || []).map(user => ({
    name: user.user?.name || 'User',
    score: user.engagementCount || 0,
  }));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-hero text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-body text-muted-foreground">
              Analyze event engagement and track user participation
            </p>
          </div>
          <Button onClick={openCreateModal} className="md:ml-4">Create New Event</Button>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-800 flex items-center justify-between gap-4">
            <span>{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-4 text-red-500 hover:underline">Dismiss</button>
          </div>
        )}

        {/* Event Selector */}
        <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
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
          <Button
            onClick={async () => {
              if (!selectedEventId) return;
              setCrudLoading('clone');
              try {
                await eventService.cloneEvent(selectedEventId);
                toast({ title: 'Success', description: 'Event cloned successfully!', variant: 'default' });
                await refreshEvents();
              } catch (error) {
                toast({ title: 'Error', description: 'Failed to clone event.', variant: 'destructive' });
              } finally {
                setCrudLoading(null);
              }
            }}
            disabled={!selectedEventId || eventsLoading}
            variant="outline"
          >
            {crudLoading === 'clone' ? <LoadingSpinner size="sm" /> : 'Clone'}
          </Button>
          <Button
            onClick={async () => {
              if (!selectedEventId) return;
              setCrudLoading('summary');
              try {
                await eventService.generateSummary(selectedEventId);
                toast({ title: 'Success', description: 'AI summary generated!', variant: 'default' });
              } catch (error) {
                toast({ title: 'Error', description: 'Failed to generate summary.', variant: 'destructive' });
              } finally {
                setCrudLoading(null);
              }
            }}
            disabled={!selectedEventId || eventsLoading || (events.find(e => e._id === selectedEventId) && new Date(events.find(e => e._id === selectedEventId)!.startTime) > new Date())}
            variant="outline"
          >
            {crudLoading === 'summary' ? <LoadingSpinner size="sm" /> : 'Generate AI Summary'}
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
          <Tabs
            tabs={[
              {
                label: 'Analytics',
                content: (
                  <div className="space-y-8">
                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="card-primary p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                            <p className="text-2xl font-bold text-foreground">{totalParticipants}</p>
                          </div>
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="card-primary p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                            <p className="text-2xl font-bold text-foreground">{totalDownloads}</p>
                          </div>
                          <Download className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="card-primary p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Questions Asked</p>
                            <p className="text-2xl font-bold text-foreground">{totalQuestions}</p>
                          </div>
                          <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="card-primary p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                            <p className="text-2xl font-bold text-foreground">{avgScore}</p>
                          </div>
                          <Award className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                ),
              },
              {
                label: 'Users',
                content: (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-title text-foreground">All Users</h2>
                      <span className="text-caption text-muted-foreground">Total: {usersLoading ? '...' : users.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border rounded-lg">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Role</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersError ? (
                            <tr><td colSpan={4} className="text-center py-4 text-destructive">{usersError}</td></tr>
                          ) : usersLoading ? (
                            <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
                          ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-4">No users found.</td></tr>
                          ) : users.map(user => (
                            <tr key={user._id} className="border-t">
                              <td className="px-4 py-2">{user.name}</td>
                              <td className="px-4 py-2">{user.email}</td>
                              <td className="px-4 py-2">{user.role}</td>
                              <td className="px-4 py-2">
                                <button onClick={() => handleDeleteUser(user._id)} className="btn-destructive btn-sm">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-subtitle text-foreground mb-2">Users in Session</h3>
                      <span className="text-caption text-muted-foreground">{participantsLoading ? '...' : participants.length} in session</span>
                      <ul className="mt-2 space-y-1">
                        {participantsError ? (
                          <li className="text-destructive">{participantsError}</li>
                        ) : participantsLoading ? (
                          <li>Loading...</li>
                        ) : participants.length === 0 ? (
                          <li>No participants in this session.</li>
                        ) : participants.map(u => (
                          <li key={u._id} className="text-body">{u.name} ({u.email})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ),
              },
            ]}
          />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Create New Event' : 'Edit Event'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="event-name" className="block mb-1 font-medium">Event Name</label>
                <input
                  type="text"
                  name="name"
                  id="event-name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="input-primary w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="event-description" className="block mb-1 font-medium">Description</label>
                <Textarea
                  name="description"
                  id="event-description"
                  value={form.description}
                  onChange={handleFormChange}
                  className="w-full"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label htmlFor="event-start-time" className="block mb-1 font-medium">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  id="event-start-time"
                  value={form.startTime}
                  onChange={handleFormChange}
                  className="input-primary w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="event-end-time" className="block mb-1 font-medium">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  id="event-end-time"
                  value={form.endTime}
                  onChange={handleFormChange}
                  className="input-primary w-full"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={crudLoading === 'create' || crudLoading === 'edit'}>
                  {crudLoading === 'create' || crudLoading === 'edit' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    modalMode === 'create' ? 'Create' : 'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => handleDelete(selectedEventId)} disabled={crudLoading === 'delete'}>
                {crudLoading === 'delete' ? <LoadingSpinner size="sm" /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Poll Manager */}
        {currentEventDetails && (
          <PollManager
            event={currentEventDetails}
            onPollsUpdate={(updatedEvent) => setCurrentEventDetails(updatedEvent)}
          />
        )}
        {/* Admin Resource Manager */}
        {currentEventDetails && (
          <AdminResourceManager
            resources={currentEventDetails.resources || []}
            eventId={currentEventDetails._id}
            onResourcesUpdate={(resources) => setCurrentEventDetails({ ...currentEventDetails, resources })}
          />
        )}
        {/* Admin Q&A Feed */}
        {currentEventDetails && (
          <AdminQAFeed initialQuestions={currentEventDetails.questions || []} />
        )}
      </div>
    </Layout>
  );
};
