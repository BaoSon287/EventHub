import axiosClient, { getApiMode } from './axiosClient';
import { unwrap } from './apiUtils';
import { MockDatabase, User } from './mockDb';

type BackendProfile = {
  id: number;
  authUserId: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
};

const applyProfile = (user: User, profile: BackendProfile): User => ({
  ...user,
  name: profile.fullName || user.name,
  phone: profile.phone || user.phone,
  avatar: profile.avatarUrl || user.avatar,
  organization: profile.bio || user.organization
});

export const userApi = {
  syncCurrentProfile: async (user: User): Promise<User> => {
    if (getApiMode() === 'mock') {
      return MockDatabase.getUserByUsername(user.username) || user;
    }

    try {
      const response = await axiosClient.get(`/api/users/auth/${user.id}`);
      return applyProfile(user, unwrap<BackendProfile>(response));
    } catch {
      return user;
    }
  },

  updateCurrentProfile: async (user: User): Promise<User> => {
    if (getApiMode() === 'mock') {
      const updated = MockDatabase.updateUser(user.id, user) || user;
      localStorage.setItem('eventhub_current_user', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return updated;
    }

    const profileResponse = await axiosClient.get(`/api/users/auth/${user.id}`);
    const profile = unwrap<BackendProfile>(profileResponse);
    const updateResponse = await axiosClient.put(`/api/users/${profile.id}`, {
      fullName: user.name,
      phone: user.phone || '',
      avatarUrl: user.avatar,
      bio: user.organization || ''
    });
    const updated = applyProfile(user, unwrap<BackendProfile>(updateResponse));
    localStorage.setItem('eventhub_current_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return updated;
  }
};
