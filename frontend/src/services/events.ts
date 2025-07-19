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
}

export interface Poll {
  _id: string;
  question: string;
  options: string[];
  results?: { [option: string]: number };
  isActive?: boolean;
}

export interface Question {
  _id:string;
  text: string;
  author: string;
  timestamp: string;
  votes?: number;
}

export interface Resource {
  _id: string;
  fileName: string;
  fileUrl: string;
  description?: string;
}

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    const response = await api.get('/events');
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // This is the new function you needed
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  async deleteEvent(eventId: string): Promise<{ message: string }> {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  async joinEvent(id: string): Promise<{ message: string }> {
    const response = await api.post(`/events/${id}/join`);
    return response.data;
  },

  async logDownload(eventId: string, fileName: string): Promise<{ message: string }> {
    const response = await api.post('/engage/download', { eventId, fileName });
    return response.data;
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
    const response = await api.get(`/scores/${userId}/${eventId}`);
    return response.data;
  },
};
