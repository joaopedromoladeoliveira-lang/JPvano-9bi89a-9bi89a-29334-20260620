import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, UserCheckIcon, UserPlusIcon, SearchIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import {
  getProfileByUsername, getFollowers, getFollowing,
  follow, unfollow, isFollowing as checkFollowing,
} from '@/lib/db';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

type Mode = 'seguidores' | 'seguindo';

export default function FollowListPage() {
  const { username, mode } = useParams<{ username: string; mode: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [list, setList] = useState<User[]>([]);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isFollowers = (mode as Mode) === 'seguidores';

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    getProfileByUsername(username).then(async p => {
      if (!p) { navigate('/explorar'); return; }
      setProfile(p);

      const users = isFollowers
        ? await getFollowers(p.id)
        : await getFollowing(p.id);
      setList(users);

      if (currentUser) {
        const states: Record<string, boolean> = {};
        await Promise.all(users.map(async u => {
          if (u.id !== currentUser.id) {
            states[u.id] = await checkFollowing(currentUser.id, u.id);
          }
        }));
        setFollowStates(states);
      }

      setLoading(false);
    });
  }, [username, mode, currentUser?.id]);

  async function handleFollowToggle(targetUser: User) {
    if (!currentUser) { navigate('/login'); return; }
    const isF = followStates[targetUser.id];
    setFollowStates(prev => ({ ...prev, [targetUser.id]: !isF }));
    if (isF) {
      await unfollow(currentUser.id, targetUser.id);
    } else {
      await follow(currentUser.id, targetUser.id);
    }
  }

  const filtered = list.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/perfil/${username}`)}
            className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-600 transition-all"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div>
            <h1 className="text-lg font-display font-black dark:text-white text-gray-900">
              {isFollowers ? 'Seguidores' : 'Seguindo'}
            </h1>
            {profile && (
              <p className="text-xs dark:text-gray-400 text-gray-500">@{profile.username}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-surface-800 bg-white border dark:border-white/5 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 text-sm"
          />
        </div>

        {/* Toggle tabs */}
        <div className="flex gap-2 mb-5">
          {(['seguidores', 'seguindo'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => navigate(`/perfil/${username}/${m}`)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                (mode as Mode) === m
                  ? 'btn-brand shadow-brand'
                  : 'dark:bg-surface-800 bg-white dark:text-gray-400 text-gray-600 border dark:border-white/10 border-gray-200'
              )}
            >
              {m === 'seguidores' ? 'Seguidores' : 'Seguindo'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{isFollowers ? '👥' : '🔍'}</div>
            <p className="dark:text-gray-400 text-gray-600 font-medium">
              {search
                ? 'Nenhum resultado'
                : isFollowers
                ? 'Nenhum seguidor ainda'
                : 'Não está seguindo ninguém'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => {
              const isOwn = currentUser?.id === u.id;
              const isF = followStates[u.id];
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-2xl dark:bg-surface-800 bg-white border dark:border-white/5 border-gray-100 hover:dark:border-white/10 hover:border-gray-200 transition-all"
                >
                  {/* Avatar */}
                  <div
                    className="cursor-pointer flex-shrink-0"
                    onClick={() => navigate(`/perfil/${u.username}`)}
                  >
                    <UserAvatar src={u.avatar} name={u.displayName} size="md" />
                  </div>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/perfil/${u.username}`)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm dark:text-white text-gray-900 truncate">
                        {u.displayName}
                      </span>
                      {u.isVerified && <VerifiedBadge size="xs" />}
                      {u.isPremium && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#FF6B00,#E91E8C)' }}>
                          ⭐ Pro
                        </span>
                      )}
                    </div>
                    <p className="text-xs dark:text-gray-400 text-gray-500 truncate">@{u.username}</p>
                    {u.bio && (
                      <p className="text-xs dark:text-gray-500 text-gray-400 truncate mt-0.5">{u.bio}</p>
                    )}
                  </div>

                  {/* Follow button */}
                  {!isOwn && currentUser && (
                    <button
                      onClick={() => handleFollowToggle(u)}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                        isF
                          ? 'dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-red-500/10 hover:text-red-500'
                          : 'btn-brand shadow-brand'
                      )}
                    >
                      {isF ? (
                        <><UserCheckIcon size={13} /> Seguindo</>
                      ) : (
                        <><UserPlusIcon size={13} /> Seguir</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
