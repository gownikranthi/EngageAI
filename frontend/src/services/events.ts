import api from './api';

export interface Event {
  _id: string; // Changed from id to _id for MongoDB consistency
  name: string; // Changed from title to name
  description: string;
  startTime: string; // Using string for datetime-local input
  endTime: string;   // Using string for datetime-local input
  location?: string;
  imageUrl?: string;
  participants?: string[];
  polls?: Poll[];
  questions?: Question[];
  resources?: Resource[];
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface Poll {
  _id: string;
  question: string;
  options: { _id: string; text: string; votes: number }[];
  isActive: boolean;
}

export interface Question {
  _id: string;
  text: string;
  author: string;
  authorName: string;
  isAnswered: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Resource {
  _id: string;
  fileName: string;
  fileUrl: string;
  description?: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface EventsListResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    try {
      console.log('🔍 Fetching events from:', `${import.meta.env.VITE_API_BASE_URL || 'https://engageai-api.onrender.com/api/v1'}/events`);
      const response = await api.get('/events');
      console.log('📦 Raw API response:', response.data);
      
      const apiResponse = response.data as ApiResponse<EventsListResponse>;
      
      if (apiResponse.success && apiResponse.data) {
        console.log('✅ Events fetched successfully:', apiResponse.data.events);
        return apiResponse.data.events;
      }
      
      // Fallback: if response is directly an array
      if (Array.isArray(response.data)) {
        console.log('✅ Events array received directly:', response.data);
        return response.data;
      }
      
      // Fallback: if response has events property directly
      if (response.data && Array.isArray(response.data.events)) {
        console.log('✅ Events from data.events:', response.data.events);
        return response.data.events;
      }
      
      console.log('⚠️ No events found in response');
      return [];
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  },

  async getEvent(id: string): Promise<Event> {
    try {
      console.log('🔍 Fetching event:', id);
      const response = await api.get(`/events/${id}`);
      console.log('📦 Raw event response:', response.data);
      
      const apiResponse = response.data as ApiResponse<Event>;
      
      if (apiResponse.success && apiResponse.data) {
        console.log('✅ Event fetched successfully:', apiResponse.data);
        return apiResponse.data;
      }
      
      // Fallback: if response is directly the event object
      console.log('✅ Event object received directly:', response.data);
      return response.data as Event;
    } catch (error) {
      console.error('❌ Error fetching event:', error);
      throw error;
    }
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      console.log('🔍 Creating event:', eventData);
      const response = await api.post('/events', eventData);
      console.log('📦 Create event response:', response.data);
      
      const apiResponse = response.data as ApiResponse<Event>;
      
      if (apiResponse.success && apiResponse.data) {
        console.log('✅ Event created successfully:', apiResponse.data);
        return apiResponse.data;
      }
      
      console.log('✅ Event object received directly:', response.data);
      return response.data as Event;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  },

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    try {
      console.log('🔍 Updating event:', eventId, eventData);
      const response = await api.put(`/events/${eventId}`, eventData);
      console.log('📦 Update event response:', response.data);
      
      const apiResponse = response.data as ApiResponse<Event>;
      
      if (apiResponse.success && apiResponse.data) {
        console.log('✅ Event updated successfully:', apiResponse.data);
        return apiResponse.data;
      }
      
      console.log('✅ Event object received directly:', response.data);
      return response.data as Event;
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string): Promise<{ message: string }> {
    try {
      console.log('🔍 Deleting event:', eventId);
      const response = await api.delete(`/events/${eventId}`);
      console.log('📦 Delete event response:', response.data);
      
      const apiResponse = response.data as ApiResponse<{ message: string }>;
      
      if (apiResponse.success) {
        console.log('✅ Event deleted successfully');
        return { message: apiResponse.message };
      }
      
      console.log('✅ Delete response received directly:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  },

  async joinEvent(id: string): Promise<{ message: string }> {
    try {
      console.log('🔍 Joining event:', id);
      const response = await api.post(`/events/${id}/join`);
      console.log('📦 Join event response:', response.data);
      
      const apiResponse = response.data as ApiResponse<{ message: string }>;
      
      if (apiResponse.success) {
        console.log('✅ Joined event successfully');
        return { message: apiResponse.message };
      }
      
      console.log('✅ Join response received directly:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error joining event:', error);
      throw error;
    }
  },

  async logDownload(eventId: string, fileName: string): Promise<{ message: string }> {
    try {
      console.log('🔍 Logging download:', eventId, fileName);
      const response = await api.post('/engage/download', { eventId, fileName });
      console.log('📦 Download log response:', response.data);
      
      const apiResponse = response.data as ApiResponse<{ message: string }>;
      
      if (apiResponse.success) {
        console.log('✅ Download logged successfully');
        return { message: apiResponse.message };
      }
      
      console.log('✅ Download log response received directly:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error logging download:', error);
      throw error;
    }
  },

  async getUserScore(userId: string, eventId: string): Promise<{
    totalScore: number;
    breakdown: {
      pollScore: number;
      qaScore: number;
      timeScore: number;
      downloadScore: number;
    };
  }> {
    try {
      console.log('🔍 Getting user score:', userId, eventId);
      const response = await api.get(`/scores/${userId}/${eventId}`);
      console.log('📦 User score response:', response.data);
      
      const apiResponse = response.data as ApiResponse<{
        totalScore: number;
        breakdown: {
          pollScore: number;
          qaScore: number;
          timeScore: number;
          downloadScore: number;
        };
      }>;
      
      if (apiResponse.success && apiResponse.data) {
        console.log('✅ User score fetched successfully:', apiResponse.data);
        return apiResponse.data;
      }
      
      console.log('✅ User score received directly:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting user score:', error);
      throw error;
    }
  },

  async createPoll(eventId: string, pollData: { question: string; options: string[] }): Promise<any> {
    const response = await api.post(`/polls/${eventId}`, pollData);
    return response.data;
  },

  async cloneEvent(eventId: string) {
    const response = await api.post(`/events/${eventId}/clone`);
    return response.data;
  },

  async generateSummary(eventId: string): Promise<any> {
    try {
      const response = await api.post(`/events/${eventId}/generate-summary`);
      return response.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  },

  async getSummary(eventId: string): Promise<any> {
    try {
      const response = await api.get(`/events/${eventId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  },

  async addResource(eventId: string, resource: { fileName: string; fileUrl: string; description?: string }): Promise<Event> {
    const response = await api.post(`/events/${eventId}/resources`, resource);
    return response.data;
  },

  async deleteResource(eventId: string, resourceId: string): Promise<Event> {
    const response = await api.delete(`/events/${eventId}/resources/${resourceId}`);
    return response.data;
  },
};
