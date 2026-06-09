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
  login: async (username: string, password: string) => {
    const response = await axiosClient.post('/api/auth/login', { email: username, password });
    const data = unwrap<LoginResponse>(response);
    let user = toUiUser(data.user);
    if (data.accessToken) {
      localStorage.setItem('eventhub_access_token', data.accessToken);
      user = await userApi.syncCurrentProfile(user);
      localStorage.setItem('eventhub_current_user', JSON.stringify(user));
    }
    return { data: { accessToken: data.accessToken, user } };
  },

  register: async (userData: { username: string; email: string; name: string; password: string; role: 'organizer' | 'attendee' }) => {
    const role = userData.role === 'organizer' ? 'ORGANIZER' : 'USER';
    const response = await axiosClient.post('/api/auth/register', {
      email: userData.email,
      password: userData.password,
      fullName: userData.name,
      role
    });
    const user = toUiUser(unwrap<BackendUser>(response));
    return { data: { accessToken: '', user } };
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
