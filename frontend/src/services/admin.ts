import api from './api';

export interface AdminAnalytics {
  eventId: string;
  totalParticipants: number;
  engagementBreakdown: {
    polls: number;
    questions: number;
    downloads: number;
    timeSpent: number;
  };
  topUsers: Array<{
    id: string;
    name: string;
    score: number;
    engagement: {
      polls: number;
      questions: number;
      downloads: number;
      timeSpent: number;
    };
  }>;
  timelineData: Array<{
    timestamp: string;
    participants: number;
    activity: number;
  }>;
}

export const adminService = {
  async getEventAnalytics(eventId: string): Promise<AdminAnalytics> {
    const response = await api.get(`/admin/analytics/${eventId}`);
    return response.data;
  },
};