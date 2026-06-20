import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GridIcon, FilmIcon, BookmarkIcon, TagIcon, LinkIcon, CalendarIcon, SettingsIcon, MessageCircleIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import {
  getProfileByUsername, getPosts, follow, unfollow, isFollowing as checkFollowing,
  getFollowersCount, getFollowingCount, createNotification, getProfile,
} from '@/lib/db';
import { formatNumber, formatDate } from '@/lib/utils';
import type { User, Post } from '@/types';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'posts', icon: GridIcon, label: 'Publicações' },
  { id: 'reels', icon: FilmIcon, label: 'Reels' },
  { id: 'saved', icon: BookmarkIcon, label: 'Salvos' },
  { id: 'tagged', icon: TagIcon, label: 'Marcados' },
];

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      getProfileByUsername(username),
    ]).then(async ([p]) => {
      if (!p) { navigate('/explorar'); return; }
      setProfile(p);

      const [posts, fCount, foCount] = await Promise.all([
        getPosts({ userId: p.id }),
        getFollowersCount(p.id),
        getFollowingCount(p.id),
      ]);
      setUserPosts(posts);
      setFollowersCount(fCount);
      setFollowingCount(foCount);

      if (currentUser) {
        const isF = await checkFollowing(currentUser.id, p.id);
        setFollowing(isF);
        if (currentUser.id === p.id) {
          // Load saved posts for own profile
          const allPosts = await getPosts({ limit: 200 });
          setSavedPosts(allPosts.filter(post => post.saves.includes(p.id)));
        }
      }
      setLoading(false);
    });
  }, [username, currentUser?.id]);

  async function handleFollow() {
    if (!currentUser || !profile) return;
    if (following) {
      await unfollow(currentUser.id, profile.id);
      setFollowing(false);
      setFollowersCount(c => c - 1);
    } else {
      await follow(currentUser.id, profile.id);
      setFollowing(true);
      setFollowersCount(c => c + 1);
      await createNotification({
        user_id: profile.id,
        from_user_id: currentUser.id,
        type: 'follow',
        content: 'começou a te seguir',
      });
    }
  }

  const isOwnProfile = currentUser?.id === profile?.id;
  const tabPosts = activeTab === 'posts' ? userPosts : activeTab === 'saved' ? savedPosts : userPosts.filter(p => p.type === 'reel');

  if (loading || !profile) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Cover */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src={profile.coverImage || 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=1200&h=400&fit=crop'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Profile info */}
        <div className="px-4 md:px-8 pb-6 dark:bg-surface-900 bg-white">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 dark:border-surface-900 border-white overflow-hidden shadow-xl">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#E91E8C,#7B2FBE)' }}>
                    {profile.displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {profile.isPremium && (
                <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full btn-brand flex items-center justify-center border-2 dark:border-surface-900 border-white shadow">
                  ⭐
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pb-2">
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/configuracoes')}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 font-semibold text-sm hover:opacity-80 transition-all"
                >
                  <SettingsIcon size={16} /> Editar perfil
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={cn(
                      'px-6 py-2 rounded-xl font-semibold text-sm transition-all',
                      following
                        ? 'dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 hover:bg-red-500/10 hover:text-red-500'
                        : 'btn-brand shadow-brand'
                    )}
                  >
                    {following ? 'Seguindo' : 'Seguir'}
                  </button>
                  <button
                    onClick={() => navigate('/mensagens', { state: { userId: profile.id } })}
                    className="p-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 hover:opacity-80 transition-all"
                  >
                    <MessageCircleIcon size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-display font-black dark:text-white text-gray-900">{profile.displayName}</h1>
              {profile.isVerified && <VerifiedBadge size="md" />}
              {profile.isAdmin && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #7B2FBE, #E91E8C)' }}>Admin</span>
              )}
            </div>
            <p className="text-sm dark:text-gray-400 text-gray-600 mb-2">@{profile.username}</p>
            {profile.bio && <p className="dark:text-gray-200 text-gray-800 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {profile.website && (
                <a href={`https://${profile.website}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-brand-pink hover:underline">
                  <LinkIcon size={14} /> {profile.website}
                </a>
              )}
              <span className="flex items-center gap-1 text-xs dark:text-gray-500 text-gray-400">
                <CalendarIcon size={12} /> Desde {new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex gap-6 py-4 border-y dark:border-white/5 border-gray-100">
            {[
              { label: 'Publicações', value: userPosts.length, path: null as string | null },
              { label: 'Seguidores', value: followersCount, path: `/perfil/${profile.username}/seguidores` },
              { label: 'Seguindo', value: followingCount, path: `/perfil/${profile.username}/seguindo` },
            ].map(stat => (
              <div
                key={stat.label}
                className={cn('text-center transition-opacity', stat.path ? 'cursor-pointer hover:opacity-70' : '')}
                onClick={() => stat.path && navigate(stat.path)}
              >
                <div className="text-xl font-display font-black dark:text-white text-gray-900">{formatNumber(stat.value)}</div>
                <div className="text-xs dark:text-gray-400 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-white/5 border-gray-100 dark:bg-surface-900 bg-white">
          <div className="flex">
            {tabs.map(tab => {
              if (tab.id === 'saved' && !isOwnProfile) return null;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-all',
                    activeTab === tab.id
                      ? 'border-brand-pink dark:text-white text-gray-900'
                      : 'border-transparent dark:text-gray-500 text-gray-400 hover:dark:text-gray-300 hover:text-gray-600'
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="p-1 dark:bg-surface-900 bg-white min-h-48">
          {tabPosts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">📷</div>
              <p className="dark:text-gray-400 text-gray-600">Nenhuma publicação ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {tabPosts.map(post => (
                <div
                  key={post.id}
                  className="aspect-square relative overflow-hidden dark:bg-surface-800 bg-gray-100 cursor-pointer group"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  {post.media[0] ? (
                    <img src={post.media[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 dark:bg-white/5 bg-gray-50">
                      <p className="text-xs dark:text-gray-400 text-gray-600 line-clamp-4 text-center">{post.content.substring(0, 80)}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <span className="text-white text-xs font-bold">❤️ {formatNumber(post.likes.length)}</span>
                    <span className="text-white text-xs font-bold">💬 {formatNumber(post.comments.length)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
