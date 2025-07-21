import api from './api';

export interface AdminAnalytics {
  totalParticipants: number;
  engagementBreakdown: {
    polls: number;
    questions: number;
    downloads: number;
  };
  topUsers: {
    id: string;
    name: string;
    email: string;
    score: number;
  }[];
  timelineData: any[];
}

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/v1/admin`;

export const adminService = {
  async getEventAnalytics(eventId: string): Promise<AdminAnalytics> {
    const response = await api.get(`/admin/analytics/${eventId}`);
    return response.data;
  },
  async getAllUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },
  async deleteUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  async getEventParticipants(eventId: string) {
    const response = await api.get(`/admin/events/${eventId}/participants`);
    return response.data;
  },
};