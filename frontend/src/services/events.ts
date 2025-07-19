import api from './api';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  imageUrl?: string;
  participants?: string[];
  polls?: Poll[];
  questions?: Question[];
  resources?: Resource[];
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  results?: { [option: string]: number };
  isActive?: boolean;
}

export interface Question {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  votes?: number;
}

export interface Resource {
  id: string;
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