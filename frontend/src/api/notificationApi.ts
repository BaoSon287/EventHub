import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { Notification } from '../types/domain';

type BackendNotification = {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
};

type NotificationPage = {
  content: BackendNotification[];
};

const toUiNotification = (notification: BackendNotification): Notification => ({
  id: String(notification.id),
  userId: String(notification.userId),
  title: notification.title,
  message: notification.content,
  type: notification.type.includes('FAILED') ? 'alert' : notification.type.includes('SUCCESS') ? 'success' : 'info',
  read: notification.status === 'READ',
  createdAt: notification.createdAt
});

export const notificationApi = {
  getAll: async () => {
    const userStr = localStorage.getItem('eventhub_current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || '';

    if (!userId) {
      return { data: [] };
    }

    const response = await axiosClient.get(`/api/notifications/user/${userId}`, {
      params: { size: 100 }
    });
    return { data: unwrap<NotificationPage>(response).content.map(toUiNotification) };
  },

  markAsRead: async (id: string) => {
    await axiosClient.patch(`/api/notifications/${id}/read`);
    return { data: { success: true } };
  },

  markAllAsRead: async () => {
    const notifications = await notificationApi.getAll();
    await Promise.all(
      notifications.data
        .filter((notification) => !notification.read)
        .map((notification) => notificationApi.markAsRead(notification.id))
    );
    return { data: { success: true } };
  }
};
