import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, MessageCircleIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { getPosts, getAllProfiles, searchProfiles } from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import { EXPLORE_CATEGORIES } from '@/constants';
import { broadcastPostsUpdate } from '@/hooks/usePosts';
import type { Post, User } from '@/types';

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<{ users: User[]; posts: Post[] } | null>(null);
  const [exploreMedia, setExploreMedia] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    getPosts({ limit: 60 }).then(setExploreMedia);
    getAllProfiles().then(all => setSuggestedUsers(all.filter(u => user && u.id !== user.id).slice(0, 10)));
  }, [user]);

  // Real-time posts
  useEffect(() => {
    const handler = () => getPosts({ limit: 60 }).then(setExploreMedia);
    window.addEventListener('jpvano:posts_updated', handler);
    const interval = setInterval(handler, 5000);
    return () => { window.removeEventListener('jpvano:posts_updated', handler); clearInterval(interval); };
  }, []);

  // Search
  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const [users, posts] = await Promise.all([
        searchProfiles(search),
        getPosts({ limit: 100 }).then(all => all.filter(p =>
          p.content.toLowerCase().includes(search.toLowerCase()) ||
          p.hashtags.some(h => h.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 9)),
      ]);
      setSearchResults({ users: users.filter(u => user && u.id !== user.id), posts });
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, user]);

  const filteredPosts = activeCategory === 'all'
    ? exploreMedia
    : activeCategory === 'videos' || activeCategory === 'reels'
    ? exploreMedia.filter(p => p.type === 'video' || p.type === 'reel')
    : exploreMedia;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pessoas, hashtags, publicações..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl dark:bg-surface-800 bg-white border dark:border-white/5 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 transition-all text-base dark:placeholder-gray-500 placeholder-gray-400"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-6 dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100 overflow-hidden animate-slide-down">
            {searchResults.users.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-widest mb-3">Pessoas</h3>
                <div className="space-y-3">
                  {searchResults.users.map(u => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/perfil/${u.username}`)}>
                        <UserAvatar src={u.avatar} name={u.displayName} size="md" />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm dark:text-white text-gray-900">{u.displayName}</span>
                            {u.isVerified && <VerifiedBadge size="xs" />}
                          </div>
                          <span className="text-xs dark:text-gray-400 text-gray-500">@{u.username}</span>
                        </div>
                      </div>
                      {user && u.id !== user.id && (
                        <button
                          onClick={() => navigate('/mensagens', { state: { userId: u.id } })}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-brand text-xs font-semibold"
                        >
                          <MessageCircleIcon size={14} /> Mensagem
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {searchResults.posts.length > 0 && (
              <div className="border-t dark:border-white/5 border-gray-100 p-4">
                <h3 className="text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-widest mb-3">Publicações</h3>
                <div className="grid grid-cols-3 gap-2">
                  {searchResults.posts.map(p => (
                    <div key={p.id} className="aspect-square rounded-xl overflow-hidden dark:bg-white/5 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate(`/post/${p.id}`)}>
                      {p.media[0] ? <img src={p.media[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center p-2"><p className="text-xs dark:text-gray-400 text-gray-600 line-clamp-4 text-center">{p.content}</p></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {searchResults.users.length === 0 && searchResults.posts.length === 0 && (
              <div className="p-8 text-center dark:text-gray-400 text-gray-600">
                <SearchIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p>Nenhum resultado para "{search}"</p>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {EXPLORE_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id ? 'btn-brand shadow-brand' : 'dark:bg-surface-800 bg-white dark:text-gray-400 text-gray-600 border dark:border-white/10 border-gray-200 dark:hover:bg-white/5 hover:bg-gray-50'}`}>
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* Suggested users strip */}
        {!searchResults && suggestedUsers.length > 0 && (
          <div className="mb-6 dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100">
            <h3 className="text-sm font-bold dark:text-gray-300 text-gray-700 mb-3">Pessoas para seguir</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {suggestedUsers.map(u => (
                <div key={u.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20 text-center">
                  <UserAvatar src={u.avatar} name={u.displayName} size="lg" onClick={() => navigate(`/perfil/${u.username}`)} />
                  <div className="w-full">
                    <p className="text-xs font-semibold dark:text-white text-gray-900 truncate">{u.displayName}</p>
                    <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">@{u.username}</p>
                  </div>
                  <button
                    onClick={() => navigate('/mensagens', { state: { userId: u.id } })}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg btn-brand text-[10px] font-semibold"
                  >
                    <MessageCircleIcon size={10} /> DM
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {filteredPosts.map((post, i) => (
            <div key={post.id}
              className={`relative overflow-hidden dark:bg-surface-800 bg-gray-100 cursor-pointer group rounded-lg ${i % 7 === 0 ? 'col-span-2 row-span-2' : ''}`}
              style={{ aspectRatio: i % 7 === 0 ? 'auto' : '1/1' }}
              onClick={() => navigate(`/post/${post.id}`)}>
              {post.media[0] ? (
                <img src={post.media[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ minHeight: i % 7 === 0 ? '300px' : '120px' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 min-h-[120px]">
                  <p className="text-xs dark:text-gray-400 text-gray-600 line-clamp-4 text-center">{post.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <span className="text-white text-sm font-bold flex items-center gap-1">❤️ {formatNumber(post.likes.length)}</span>
                <span className="text-white text-sm font-bold flex items-center gap-1">💬 {formatNumber(post.comments.length)}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && !searchResults && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="dark:text-gray-400 text-gray-600">Nenhum conteúdo publicado ainda</p>
            <p className="text-sm dark:text-gray-500 text-gray-400 mt-1">Publique algo no feed para aparecer aqui!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
