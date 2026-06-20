import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, CompassIcon, PlusSquareIcon, BellIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { UserAvatar } from '@/components/features/UserAvatar';

interface MobileNavProps {
  user: User | null;
  onCreatePost: () => void;
  unreadNotifications: number;
}

export function MobileNav({ user, onCreatePost, unreadNotifications }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/feed', icon: HomeIcon, label: 'Início' },
    { path: '/explorar', icon: CompassIcon, label: 'Explorar' },
    { path: 'create', icon: PlusSquareIcon, label: 'Criar', isCreate: true },
    { path: '/notificacoes', icon: BellIcon, label: 'Notif', badge: unreadNotifications },
    { path: user ? `/perfil/${user.username}` : '/login', icon: UserIcon, label: 'Perfil', isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 dark:bg-surface-900/95 bg-white/95 backdrop-blur-brand border-t dark:border-white/5 border-gray-100 safe-area-inset">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = !item.isCreate && location.pathname === item.path;

          if (item.isCreate) {
            return (
              <button
                key="create"
                onClick={onCreatePost}
                className="flex flex-col items-center justify-center p-1"
              >
                <div className="btn-brand p-3 rounded-2xl shadow-brand">
                  <Icon size={22} />
                </div>
              </button>
            );
          }

          if (item.isProfile && user) {
            return (
              <button
                key="profile"
                onClick={() => navigate(`/perfil/${user.username}`)}
                className={cn('flex flex-col items-center justify-center gap-1 p-1 relative', isActive && 'opacity-100')}
              >
                <div className={cn('rounded-full transition-all', isActive ? 'ring-2 ring-brand-pink p-0.5' : '')}>
                  <UserAvatar src={user.avatar} name={user.displayName} size="sm" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 p-1 relative min-w-[44px] min-h-[44px]"
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={cn(
                    'transition-all',
                    isActive ? 'text-brand-pink' : 'dark:text-gray-500 text-gray-400'
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #E91E8C)' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {isActive && <div className="w-1 h-1 rounded-full bg-brand-pink" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
