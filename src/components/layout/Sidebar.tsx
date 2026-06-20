import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon, SearchIcon, CompassIcon, FilmIcon, MessageCircleIcon,
  BellIcon, PlusSquareIcon, UserIcon, SettingsIcon, ShieldIcon,
  LogOutIcon, MoonIcon, SunIcon, BadgeCheckIcon, StarIcon,
} from 'lucide-react';
import { APP_LOGO, APP_NAME } from '@/constants';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { formatNumber, cn } from '@/lib/utils';
import type { User } from '@/types';

interface SidebarProps {
  user: User | null;
  onCreatePost: () => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  unreadNotifications: number;
  unreadMessages: number;
}

export function Sidebar({ user, onCreatePost, onLogout, onToggleTheme, isDark, unreadNotifications, unreadMessages }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/feed', icon: HomeIcon, label: 'Início' },
    { path: '/explorar', icon: CompassIcon, label: 'Explorar' },
    { path: '/reels', icon: FilmIcon, label: 'Reels' },
    { path: '/mensagens', icon: MessageCircleIcon, label: 'Mensagens', badge: unreadMessages },
    { path: '/notificacoes', icon: BellIcon, label: 'Notificações', badge: unreadNotifications },
  ];

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300',
      'dark:bg-surface-900 bg-white border-r dark:border-white/5 border-gray-100',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 mb-2', collapsed && 'justify-center')}>
        <img
          src={APP_LOGO}
          alt={APP_NAME}
          className="w-9 h-9 rounded-xl object-cover cursor-pointer"
          onClick={() => navigate('/feed')}
        />
        {!collapsed && (
          <span className="text-brand-gradient font-display font-bold text-xl">{APP_NAME}</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-1">
        {/* Create post */}
        <button
          onClick={onCreatePost}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group mb-2',
            'dark:hover:bg-white/5 hover:bg-gray-50',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="btn-brand p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <PlusSquareIcon size={18} />
          </div>
          {!collapsed && <span className="font-semibold text-sm dark:text-white text-gray-900">Criar publicação</span>}
        </button>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'nav-active dark:text-white text-gray-900 font-semibold'
                  : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 hover:text-gray-900 dark:hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <div className="relative">
                <Icon size={22} className={isActive ? 'text-brand-pink' : ''} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #E91E8C)' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}

        {/* Profile */}
        {user && (
          <button
            onClick={() => navigate(`/perfil/${user.username}`)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
              location.pathname.startsWith('/perfil')
                ? 'nav-active dark:text-white text-gray-900 font-semibold'
                : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50',
              collapsed && 'justify-center px-0'
            )}
          >
            <UserAvatar src={user.avatar} name={user.displayName} size="sm" />
            {!collapsed && (
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate dark:text-white text-gray-900">{user.displayName}</span>
                  {user.isVerified && <VerifiedBadge size="xs" />}
                </div>
                <span className="text-xs dark:text-gray-500 text-gray-400 truncate">@{user.username}</span>
              </div>
            )}
          </button>
        )}

        {/* Admin Panel */}
        {user?.isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
              location.pathname === '/admin'
                ? 'nav-active dark:text-white text-gray-900 font-semibold'
                : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50',
              collapsed && 'justify-center px-0'
            )}
          >
            <ShieldIcon size={22} className="text-brand-purple" />
            {!collapsed && <span className="text-sm">Painel Admin</span>}
          </button>
        )}

        {/* Verification */}
        <button
          onClick={() => navigate('/verificacao')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50',
            collapsed && 'justify-center px-0'
          )}
        >
          <BadgeCheckIcon size={22} className="text-brand-orange" />
          {!collapsed && <span className="text-sm">Verificação</span>}
        </button>

        {/* Premium */}
        <button
          onClick={() => navigate('/premium')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50',
            collapsed && 'justify-center px-0'
          )}
        >
          <StarIcon size={22} className="text-yellow-500" />
          {!collapsed && <span className="text-sm">Premium</span>}
        </button>
      </nav>

      {/* Bottom actions */}
      <div className={cn('px-2 pb-4 space-y-1 border-t dark:border-white/5 border-gray-100 pt-2', collapsed && 'px-0')}>
        <button
          onClick={onToggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          {!collapsed && <span className="text-sm">{isDark ? 'Modo claro' : 'Modo escuro'}</span>}
        </button>
        <button
          onClick={() => navigate('/configuracoes')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50 transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          <SettingsIcon size={20} />
          {!collapsed && <span className="text-sm">Configurações</span>}
        </button>
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOutIcon size={20} />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl dark:text-gray-600 text-gray-400 dark:hover:bg-white/5 hover:bg-gray-50 transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          <span className="text-lg">{collapsed ? '→' : '←'}</span>
          {!collapsed && <span className="text-xs">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
