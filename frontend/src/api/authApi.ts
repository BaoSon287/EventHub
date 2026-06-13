import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { User } from '../types/domain';
import { userApi } from './userApi';

type BackendUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
};

type LoginResponse = {
  token?: string;
  accessToken: string;
  tokenType: string;
  user: BackendUser;
};

const toUiRole = (role: string): User['role'] => {
  if (role === 'ADMIN') return 'admin';
  if (role === 'ORGANIZER') return 'organizer';
  return 'attendee';
};

const toUiUser = (user: BackendUser): User => ({
  id: String(user.id),
  username: user.email,
  email: user.email,
  role: toUiRole(user.role),
  name: user.fullName,
  phone: user.phone,
  avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.fullName || user.email)}`
});

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    const data = unwrap<LoginResponse>(response);
    const token = data.token || data.accessToken;
    let user = toUiUser(data.user);
    if (token) {
      localStorage.setItem('eventhub_access_token', token);
      user = await userApi.syncCurrentProfile(user);
      localStorage.setItem('eventhub_current_user', JSON.stringify(user));
    }
    return { data: { accessToken: token, token, user } };
  },

  register: async (userData: { email: string; fullName: string; password: string; role?: 'organizer' | 'attendee' }) => {
    const role = userData.role === 'organizer' ? 'ORGANIZER' : 'USER';
    const response = await axiosClient.post('/api/auth/register', {
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      role
    });
    const user = toUiUser(unwrap<BackendUser>(response));
    return { data: { accessToken: '', user } };
  },

  verifyEmail: async (token: string) => {
    await axiosClient.get('/api/auth/verify-email', { params: { token } });
  },

  forgotPassword: async (email: string) => {
    await axiosClient.post('/api/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string, confirmPassword: string) => {
    await axiosClient.post('/api/auth/reset-password', { token, newPassword, confirmPassword });
  },

  logout: () => {
    localStorage.removeItem('eventhub_access_token');
    localStorage.removeItem('eventhub_current_user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('eventhub_current_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
