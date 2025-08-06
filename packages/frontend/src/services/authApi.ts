import { apiClient } from './api';
import { AuthResponse, User } from '@/types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'CUSTOMER' | 'BARBER' | 'SHOP_OWNER';
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export const authApi = {
  login: (data: LoginData): Promise<AuthResponse> =>
    apiClient.post('/auth/login', data),

  register: (data: RegisterData): Promise<AuthResponse> =>
    apiClient.post('/auth/register', data),

  refreshToken: (refreshToken: string): Promise<RefreshResponse> =>
    apiClient.post('/auth/refresh', { refreshToken }),

  getProfile: (): Promise<{ user: User }> =>
    apiClient.get('/auth/profile'),

  updateProfile: (data: UpdateProfileData): Promise<{ message: string; user: User }> =>
    apiClient.put('/auth/profile', data),
};