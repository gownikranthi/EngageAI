import api from './api';

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },
  async markAllAsRead() {
    const response = await api.post('/notifications/mark-as-read');
    return response.data;
  },
}; 