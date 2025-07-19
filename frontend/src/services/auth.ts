import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('engageai_token');
    localStorage.removeItem('engageai_user');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('engageai_token');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('engageai_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  storeAuth(token: string, user: User): void {
    localStorage.setItem('engageai_token', token);
    localStorage.setItem('engageai_user', JSON.stringify(user));
  },
};