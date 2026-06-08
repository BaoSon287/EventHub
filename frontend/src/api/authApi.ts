import axiosClient, { getApiMode } from './axiosClient';
import { unwrap } from './apiUtils';
import { MockDatabase, User } from './mockDb';
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
    if (getApiMode() === 'mock') {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      const user = MockDatabase.getUserByUsername(username);
      
      // Let's check password. In mock, any corresponding user succeeds if password is user+"123"
      if (user && password === `${username}123`) {
        const token = `mock-jwt-token-for-${user.id}`;
        localStorage.setItem('eventhub_access_token', token);
        localStorage.setItem('eventhub_current_user', JSON.stringify(user));
        return { data: { accessToken: token, user } };
      }
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    // Real API Call
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
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Check duplicate
      const existing = MockDatabase.getUserByUsername(userData.username);
      if (existing) {
        throw new Error('Tên đăng nhập đã tồn tại trong hệ thống.');
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=150`,
      };

      MockDatabase.addUser(newUser);
      
      // Auto login in mock
      const token = `mock-jwt-token-for-${newUser.id}`;
      localStorage.setItem('eventhub_access_token', token);
      localStorage.setItem('eventhub_current_user', JSON.stringify(newUser));

      return { data: { accessToken: token, user: newUser } };
    }

    const role = userData.role === 'organizer' ? 'ORGANIZER' : 'USER';
    const response = await axiosClient.post('/api/auth/register', {
      email: userData.email,
      password: userData.password,
      fullName: userData.name,
      role
    });
    const user = toUiUser(unwrap<BackendUser>(response));
    localStorage.setItem('eventhub_current_user', JSON.stringify(user));
    const loginResponse = await authApi.login(userData.email, userData.password);
    return loginResponse;
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
