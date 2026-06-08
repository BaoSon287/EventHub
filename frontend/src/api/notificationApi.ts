import axiosClient, { getApiMode } from './axiosClient';
import { unwrap } from './apiUtils';
import { MockDatabase, Notification } from './mockDb';

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

    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const notifications = MockDatabase.getNotifications().filter(n => n.userId === userId);
      return { data: notifications };
    }

    const response = await axiosClient.get(`/api/notifications/user/${userId}`);
    return { data: unwrap<NotificationPage>(response).content.map(toUiNotification) };
  },

  markAsRead: async (id: string) => {
    if (getApiMode() === 'mock') {
      const success = MockDatabase.markNotificationRead(id);
      return { data: { success } };
    }

    return axiosClient.patch(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    const userStr = localStorage.getItem('eventhub_current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || '';

    if (getApiMode() === 'mock') {
      const success = MockDatabase.markAllNotificationsRead(userId);
      return { data: { success } };
    }

    const notifications = await notificationApi.getAll();
    await Promise.all(
      notifications.data
        .filter((notification) => !notification.read)
        .map((notification) => axiosClient.patch(`/api/notifications/${notification.id}/read`))
    );
    return { data: { success: true } };
  }
};
