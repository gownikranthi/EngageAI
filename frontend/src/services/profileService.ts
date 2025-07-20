import api from './api';

export const profileService = {
  async getMyHistory() {
    const response = await api.get('/profile/my-history');
    return response.data;
  },
}; 