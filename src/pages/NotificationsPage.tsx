import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, HeartIcon, MessageCircleIcon, UserPlusIcon, AtSignIcon, Share2Icon, CheckCheckIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { getProfile } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { Notification, User } from '@/types';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  like: { icon: HeartIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
  comment: { icon: MessageCircleIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  follow: { icon: UserPlusIcon, color: 'text-green-500', bg: 'bg-green-500/10' },
  mention: { icon: AtSignIcon, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
  share: { icon: Share2Icon, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
  system: { icon: BellIcon, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
  verification: { icon: CheckCheckIcon, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
  story: { icon: BellIcon, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
  live: { icon: BellIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const FILTER_TABS = ['Todas', 'Curtidas', 'Comentários', 'Seguidores', 'Sistema'];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [profiles, setProfiles] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  // Load profiles for notification senders
  useEffect(() => {
    const ids = [...new Set(notifications.map(n => n.fromUserId).filter(Boolean))];
    Promise.all(ids.map(id => getProfile(id!))).then(results => {
      const map = new Map<string, User>();
      results.forEach((p, i) => { if (p) map.set(ids[i]!, p); });
      setProfiles(map);
    });
  }, [notifications]);

  // Mark all read when opening page
  useEffect(() => {
    if (user && unreadCount > 0) {
      const timer = setTimeout(() => markAllRead(), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, unreadCount]);

  const filtered = notifications.filter(n => {
    if (activeFilter === 'Todas') return true;
    if (activeFilter === 'Curtidas') return n.type === 'like';
    if (activeFilter === 'Comentários') return n.type === 'comment';
    if (activeFilter === 'Seguidores') return n.type === 'follow';
    if (activeFilter === 'Sistema') return n.type === 'system' || n.type === 'verification';
    return true;
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-black dark:text-white text-gray-900">Notificações</h1>
            {unreadCount > 0 && <p className="text-sm dark:text-gray-400 text-gray-600">{unreadCount} não lidas</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-brand-pink hover:underline font-medium">
              Marcar todas lidas
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeFilter === tab
                  ? 'btn-brand shadow-brand'
                  : 'dark:bg-surface-800 bg-white dark:text-gray-400 text-gray-600 border dark:border-white/10 border-gray-200'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Nada por aqui</h3>
            <p className="dark:text-gray-400 text-gray-600">Suas notificações aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-xs font-bold dark:text-gray-500 text-gray-400 uppercase tracking-widest mb-2 px-1">Recentes</h3>
            {filtered.map(notif => {
              const fromUser = notif.fromUserId ? profiles.get(notif.fromUserId) : null;
              const config = typeConfig[notif.type] || typeConfig.system;
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.type === 'follow' && fromUser) navigate(`/perfil/${fromUser.username}`);
                    else if (notif.postId) navigate(`/post/${notif.postId}`);
                  }}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all',
                    !notif.isRead
                      ? 'dark:bg-brand-pink/5 bg-brand-pink/3 border-l-2 border-brand-pink dark:hover:bg-brand-pink/10 hover:bg-brand-pink/5'
                      : 'dark:hover:bg-white/3 hover:bg-gray-50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    {fromUser ? (
                      <UserAvatar src={fromUser.avatar} name={fromUser.displayName} size="md" />
                    ) : (
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg)}>
                        <Icon size={18} className={config.color} />
                      </div>
                    )}
                    <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 dark:border-surface-950 border-white', config.bg)}>
                      <Icon size={10} className={config.color} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      {fromUser && (
                        <>
                          <span className="font-bold text-sm dark:text-white text-gray-900">{fromUser.displayName}</span>
                          {fromUser.isVerified && <VerifiedBadge size="xs" />}
                        </>
                      )}
                      <span className="text-sm dark:text-gray-300 text-gray-700">{notif.content}</span>
                    </div>
                    <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                  </div>
                  {notif.type === 'follow' && fromUser && (
                    <button
                      className="btn-brand px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                      onClick={e => { e.stopPropagation(); navigate(`/perfil/${fromUser.username}`); }}
                    >
                      Ver perfil
                    </button>
                  )}
                  {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-pink flex-shrink-0 mt-2" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
