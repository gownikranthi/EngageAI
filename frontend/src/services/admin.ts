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
};