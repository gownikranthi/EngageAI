import api from './api';

export interface AdminAnalytics {
  event: {
    _id: string;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
  };
  participation: {
    totalParticipants: number;
    activeParticipants: number;
    averageSessionDuration: number;
  };
  engagement: {
    totalPolls: number;
    totalQA: number;
    totalDownloads: number;
    totalEngagements: number;
  };
  topParticipants: Array<{
    user: {
      name: string;
      email: string;
    };
    engagementCount: number;
    sessionDuration: number;
    joinTime: string;
  }>;
}

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