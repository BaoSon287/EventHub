import React from 'react';
import { Bell, Check, AlertCircle, Info, ThumbsUp } from 'lucide-react';
import { Notification } from '../types/domain';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  id?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  id
}) => {
  const icons = {
    info: <Info className="w-4 h-4 text-blue-600" />,
    success: <ThumbsUp className="w-4 h-4 text-emerald-600" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600" />,
    alert: <Bell className="w-4 h-4 text-rose-600 font-bold" />
  };

  const bgColors = {
    info: 'bg-blue-50/50 border-blue-100',
    success: 'bg-emerald-50/50 border-emerald-100',
    warning: 'bg-amber-50/50 border-amber-100',
    alert: 'bg-rose-50/50 border-rose-100'
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth() + 1} lúc ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div
      id={id || `notif-item-${notification.id}`}
      className={`p-4 border rounded-xl flex gap-3 transition ${
        notification.read ? 'bg-white border-slate-100 opacity-75' : `border-indigo-100 ${bgColors[notification.type]} shadow-xs`
      }`}
    >
      <div className={`p-2 rounded-lg self-start ${notification.read ? 'bg-slate-100' : 'bg-white shadow-xs'}`}>
        {icons[notification.type] || <Bell className="w-4 h-4 text-slate-500" />}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={`text-sm ${notification.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-800'}`}>
            {notification.title}
          </h4>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">
            {formatTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-2">
          {notification.message}
        </p>
        
        {!notification.read && onMarkRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <Check className="w-3 h-3" />
            Đánh dấu đã đọc
          </button>
        )}
      </div>
    </div>
  );
};
