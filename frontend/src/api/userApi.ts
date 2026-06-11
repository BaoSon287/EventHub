import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { User } from '../types/domain';

type BackendProfile = {
  id: number;
  authUserId: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
};

type AvatarUploadResponse = {
  avatarUrl: string;
  fileName: string;
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
    try {
      const response = await axiosClient.get(`/api/users/auth/${user.id}`);
      const updated = applyProfile(user, unwrap<BackendProfile>(response));
      localStorage.setItem('eventhub_current_user', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return updated;
    } catch {
      return user;
    }
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/api/users/avatar/upload', formData);
    return unwrap<AvatarUploadResponse>(response);
  },

  updateCurrentProfile: async (user: User): Promise<User> => {
    const response = await axiosClient.post('/api/users/me', {
      fullName: user.name,
      phone: user.phone || '',
      avatarUrl: user.avatar,
      bio: user.organization || ''
    });
    const updated = applyProfile(user, unwrap<BackendProfile>(response));
    localStorage.setItem('eventhub_current_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return updated;
  }
};
