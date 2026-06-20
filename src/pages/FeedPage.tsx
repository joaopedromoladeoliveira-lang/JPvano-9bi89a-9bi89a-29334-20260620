import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/features/PostCard';
import { StoryBar } from '@/components/features/StoryBar';
import { CreatePostModal } from '@/components/features/CreatePostModal';
import { CreateStoryModal } from '@/components/features/CreateStoryModal';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { getStories, createStory, getAllProfiles } from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import type { Story, User } from '@/types';
import { TrendingUpIcon, RefreshCwIcon } from 'lucide-react';

const TRENDING = ['#JPvano', '#Fotografia', '#Culinária', '#Dev', '#Fitness', '#BrasilConnect'];

export default function FeedPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { posts, loading: postsLoading, refreshPosts, toggleLike, addComment, toggleSave, deletePost, createPost } = usePosts();
  const [stories, setStories] = useState<Story[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    getStories().then(setStories);
    getAllProfiles().then(all => {
      setSuggestedUsers(all.filter(u => u.id !== user.id).slice(0, 5));
    });
  }, [user?.id]);

  // Reload stories every 30s
  useEffect(() => {
    const interval = setInterval(() => getStories().then(setStories), 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreatePost(data: {
    type: 'text' | 'image' | 'carousel' | 'video' | 'reel';
    content: string;
    media: string[];
    location?: string;
  }) {
    await createPost(data);
    setShowCreatePost(false);
  }

  async function handleCreateStory(data: {
    media: string;
    type: 'image' | 'video';
    overlayText?: string;
  }) {
    if (!user) return;
    const story = await createStory({
      user_id: user.id,
      media: data.media,
      type: data.type,
      overlay_text: data.overlayText,
    });
    if (story) setStories(prev => [story, ...prev]);
    setShowCreateStory(false);
  }

  async function handleManualRefresh() {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!user) return null;

  return (
    <Layout onCreatePost={() => setShowCreatePost(true)}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Main feed */}
          <div className="flex-1 max-w-xl mx-auto lg:mx-0 space-y-4">
            {/* Stories */}
            <div className="dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100 shadow-sm">
              <StoryBar
                stories={stories}
                currentUser={user}
                onAddStory={() => setShowCreateStory(true)}
              />
            </div>

            {/* Create post bar */}
            <div className="dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100 shadow-sm flex items-center gap-3">
              <UserAvatar src={user.avatar} name={user.displayName} size="md" />
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex-1 text-left px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 dark:text-gray-500 text-gray-400 dark:hover:bg-white/10 hover:bg-gray-100 transition-all text-sm"
              >
                No que você está pensando, {user.displayName.split(' ')[0]}?
              </button>
              <button
                onClick={handleManualRefresh}
                className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-500 text-gray-400 transition-all"
                title="Atualizar feed"
              >
                <RefreshCwIcon size={16} className={refreshing ? 'animate-spin text-brand-pink' : ''} />
              </button>
            </div>

            {/* Posts */}
            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Seu feed está vazio</h3>
                <p className="dark:text-gray-400 text-gray-600 mb-6">Publique algo ou explore pessoas para seguir</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="btn-brand px-5 py-2.5 rounded-xl font-semibold text-sm shadow-brand"
                  >
                    Criar publicação
                  </button>
                  <button
                    onClick={() => navigate('/explorar')}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900"
                  >
                    Explorar pessoas
                  </button>
                </div>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  onLike={toggleLike}
                  onComment={addComment}
                  onSave={toggleSave}
                  onDelete={post.userId === user.id || user.isAdmin ? deletePost : undefined}
                />
              ))
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-4">
            {/* Current user */}
            <div className="dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100 flex items-center gap-3">
              <UserAvatar
                src={user.avatar}
                name={user.displayName}
                size="lg"
                onClick={() => navigate(`/perfil/${user.username}`)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm dark:text-white text-gray-900 truncate">
                    {user.displayName}
                  </span>
                  {user.isVerified && <VerifiedBadge size="xs" />}
                </div>
                <span className="text-xs dark:text-gray-500 text-gray-400">@{user.username}</span>
              </div>
              <button
                onClick={() => navigate(`/perfil/${user.username}`)}
                className="text-xs text-brand-pink font-semibold hover:underline"
              >
                Ver
              </button>
            </div>

            {/* Suggested */}
            {suggestedUsers.length > 0 && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold dark:text-gray-300 text-gray-700">Sugeridos para você</h3>
                  <button onClick={() => navigate('/explorar')} className="text-xs text-brand-pink hover:underline">
                    Ver tudo
                  </button>
                </div>
                <div className="space-y-3">
                  {suggestedUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3">
                      <UserAvatar
                        src={u.avatar}
                        name={u.displayName}
                        size="sm"
                        onClick={() => navigate(`/perfil/${u.username}`)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold dark:text-white text-gray-900 truncate">
                            {u.displayName}
                          </span>
                          {u.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-xs dark:text-gray-500 text-gray-400">@{u.username}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/perfil/${u.username}`)}
                        className="text-xs text-brand-pink font-semibold hover:text-brand-purple transition-colors"
                      >
                        Seguir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div className="dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUpIcon size={16} className="text-brand-pink" />
                <h3 className="text-sm font-bold dark:text-gray-300 text-gray-700">Tendências</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map(tag => (
                  <button
                    key={tag}
                    onClick={() => navigate('/explorar')}
                    className="text-xs px-3 py-1.5 rounded-full dark:bg-white/5 bg-gray-50 dark:text-gray-400 text-gray-600 hover:bg-brand-pink/10 hover:text-brand-pink transition-all border dark:border-white/5 border-gray-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs dark:text-gray-700 text-gray-400 text-center">
              © 2026 JPvano · Termos · Privacidade
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreatePost && (
        <CreatePostModal
          user={user}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      )}
      {showCreateStory && (
        <CreateStoryModal
          user={user}
          onClose={() => setShowCreateStory(false)}
          onSubmit={handleCreateStory}
        />
      )}
    </Layout>
  );
}

function LoadingSkeleton() {
  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full dark:bg-white/10 bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="w-32 h-3 rounded dark:bg-white/10 bg-gray-200 animate-pulse" />
                <div className="w-20 h-2 rounded dark:bg-white/10 bg-gray-200 animate-pulse" />
              </div>
            </div>
            <div className="aspect-square rounded-xl dark:bg-white/10 bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    </Layout>
  );
}
