import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import socketService from '../../services/socket';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setLoading(true);
      notificationService.getNotifications().then(res => {
        setNotifications(res.data || []);
        setLoading(false);
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const socket = socketService.connect();
    const handleNew = (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
    };
    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    return () => {
      notificationService.markAllAsRead();
    };
  }, [open]);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-popover border border-border rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-border font-semibold">Notifications</div>
      <ul className="max-h-80 overflow-y-auto">
        {loading && <li className="p-4 text-muted-foreground text-sm">Loading...</li>}
        {!loading && notifications.length === 0 && (
          <li className="p-4 text-muted-foreground text-sm">No notifications yet.</li>
        )}
        {notifications.map((n) => (
          <li
            key={n._id}
            className={`p-4 border-b border-border last:border-b-0 ${n.read ? 'bg-background' : 'bg-accent/10'} cursor-pointer hover:bg-accent/20`}
            onClick={() => {
              if (n.link) navigate(n.link);
              onClose();
            }}
          >
            <div className="flex justify-between items-center">
              <span>{n.message}</span>
              <span className="text-xs text-muted-foreground ml-2">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 