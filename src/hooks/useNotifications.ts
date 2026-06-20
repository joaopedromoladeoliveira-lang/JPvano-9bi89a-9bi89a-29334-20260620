import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getNotifications, getUnreadNotificationsCount, getUnreadMessagesCount, markAllNotificationsRead } from '@/lib/db';
import type { Notification } from '@/types';
import { useAuth } from './useAuth';
import { getUserById } from '@/lib/db';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const prevCountRef = useRef(0);
  const prevMsgRef = useRef(0);
  const prevNotifsRef = useRef<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const [notifs, unreadN, unreadM] = await Promise.all([
      getNotifications(user.id),
      getUnreadNotificationsCount(user.id),
      getUnreadMessagesCount(user.id),
    ]);

    setNotifications(notifs);
    setUnreadMessages(unreadM);

    // Detect new notifications and show toasts
    if (prevCountRef.current > 0 && unreadN > prevCountRef.current) {
      const newNotifs = notifs.filter(n =>
        !n.isRead &&
        !prevNotifsRef.current.some(p => p.id === n.id)
      );
      newNotifs.forEach(n => {
        if (n.type === 'like') toast('❤️ Nova curtida', { description: n.content });
        else if (n.type === 'comment') toast('💬 Novo comentário', { description: n.content });
        else if (n.type === 'follow') toast('👤 Novo seguidor', { description: n.content });
        else if (n.type === 'mention') toast('📢 Você foi mencionado', { description: n.content });
      });
    }

    // Detect new messages and show toast
    if (prevMsgRef.current > 0 && unreadM > prevMsgRef.current) {
      toast('💬 Nova mensagem', { description: 'Você recebeu uma nova mensagem' });
    }

    prevCountRef.current = unreadN;
    prevMsgRef.current = unreadM;
    prevNotifsRef.current = notifs;
    setUnreadCount(unreadN);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user, loadNotifications]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    prevCountRef.current = 0;
  }, [user]);

  return { notifications, unreadCount, unreadMessages, markAllRead, refreshNotifications: loadNotifications };
}
