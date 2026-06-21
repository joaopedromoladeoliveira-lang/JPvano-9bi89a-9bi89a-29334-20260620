import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchIcon, MessageCircleIcon, UserPlusIcon, GridIcon,
  UsersIcon, TrendingUpIcon, XIcon, HashIcon,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { getPosts, getAllProfiles, searchProfiles, follow, unfollow, isFollowing } from '@/lib/db';
import { formatNumber, cn } from '@/lib/utils';
import { EXPLORE_CATEGORIES } from '@/constants';
import type { Post, User } from '@/types';
import { toast } from 'sonner';

type SearchTab = 'posts' | 'people';

interface SearchResults {
  posts: Post[];
  users: User[];
  loading: boolean;
}

const TRENDING_TAGS = [
  '#JPvano', '#Fotografia', '#Brasil', '#Dev', '#Fitness',
  '#Culinária', '#Moda', '#Arte', '#Tecnologia', '#Viagem',
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Global feed (all posts from all users)
  const { posts: globalPosts } = usePosts({ limit: 120, pollInterval: 6000 });

  const [search, setSearch] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('posts');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResults>({ posts: [], users: [], loading: false });
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  // Load suggested users + their follow status
  useEffect(() => {
    if (!user) return;
    getAllProfiles().then(async all => {
      const others = all.filter(u => u.id !== user.id).slice(0, 12);
      setSuggestedUsers(others);
      // Check follow status for each
      const checks = await Promise.all(others.map(u => isFollowing(user.id, u.id)));
      const map: Record<string, boolean> = {};
      others.forEach((u, i) => { map[u.id] = checks[i]; });
      setFollowingMap(map);
    });
  }, [user]);

  // ── Debounced search (300ms) ───────────────────────────────────────────────
  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ posts: [], users: [], loading: false });
      return;
    }
    setSearchResults(prev => ({ ...prev, loading: true }));

    const q = query.trim();
    const [users, allPosts] = await Promise.all([
      searchProfiles(q),
      getPosts({ limit: 200 }),
    ]);

    const matchedPosts = allPosts.filter(p => {
      const lq = q.toLowerCase();
      return (
        p.content.toLowerCase().includes(lq) ||
        p.hashtags.some(h => h.toLowerCase().includes(lq.replace(/^#/, '')))
      );
    }).slice(0, 30);

    setSearchResults({
      posts: matchedPosts,
      users: users.filter(u => user && u.id !== user.id),
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setSearchResults({ posts: [], users: [], loading: false });
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, runSearch]);

  // ── Follow / unfollow ─────────────────────────────────────────────────────
  async function handleFollow(targetUser: User) {
    if (!user) return;
    setFollowingLoading(prev => ({ ...prev, [targetUser.id]: true }));
    const isNowFollowing = followingMap[targetUser.id];
    try {
      if (isNowFollowing) {
        await unfollow(user.id, targetUser.id);
        setFollowingMap(prev => ({ ...prev, [targetUser.id]: false }));
      } else {
        await follow(user.id, targetUser.id);
        setFollowingMap(prev => ({ ...prev, [targetUser.id]: true }));
        toast.success(`Seguindo ${targetUser.displayName}`);
      }
    } finally {
      setFollowingLoading(prev => ({ ...prev, [targetUser.id]: false }));
    }
  }

  // ── Filtered grid posts ───────────────────────────────────────────────────
  const filteredPosts = (() => {
    switch (activeCategory) {
      case 'videos': return globalPosts.filter(p => p.type === 'video');
      case 'reels': return globalPosts.filter(p => p.type === 'reel');
      case 'photos': return globalPosts.filter(p => p.type === 'image' || p.type === 'carousel');
      case 'trending': return [...globalPosts].sort((a, b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length));
      default: return globalPosts;
    }
  })();

  const isSearching = search.trim().length > 0;

  if (isLoading) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <div className="relative mb-5">
          <SearchIcon
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 pointer-events-none"
          />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pessoas, hashtags, publicações..."
            className="w-full pl-12 pr-10 py-4 rounded-2xl dark:bg-surface-800 bg-white border dark:border-white/5 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/10 transition-all text-base dark:placeholder-gray-500 placeholder-gray-400 shadow-sm"
          />
          {/* Spinner / clear */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchResults.loading && (
              <div className="w-4 h-4 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
            )}
            {search && !searchResults.loading && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="w-7 h-7 flex items-center justify-center rounded-full dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-500 transition-all"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Search results ───────────────────────────────────────────────── */}
        {isSearching && (
          <div className="mb-6 animate-slide-down">
            {/* Search tabs */}
            <div className="flex gap-1 mb-4 dark:bg-surface-800 bg-white rounded-2xl p-1 border dark:border-white/5 border-gray-100 shadow-sm">
              <button
                onClick={() => setSearchTab('posts')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  searchTab === 'posts'
                    ? 'btn-brand shadow-brand'
                    : 'dark:text-gray-400 text-gray-500 dark:hover:bg-white/5 hover:bg-gray-50'
                )}
              >
                <GridIcon size={15} />
                Publicações
                {searchResults.posts.length > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    searchTab === 'posts' ? 'bg-white/20' : 'dark:bg-white/10 bg-gray-100'
                  )}>
                    {searchResults.posts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSearchTab('people')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  searchTab === 'people'
                    ? 'btn-brand shadow-brand'
                    : 'dark:text-gray-400 text-gray-500 dark:hover:bg-white/5 hover:bg-gray-50'
                )}
              >
                <UsersIcon size={15} />
                Pessoas
                {searchResults.users.length > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    searchTab === 'people' ? 'bg-white/20' : 'dark:bg-white/10 bg-gray-100'
                  )}>
                    {searchResults.users.length}
                  </span>
                )}
              </button>
            </div>

            {/* Posts tab */}
            {searchTab === 'posts' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100 shadow-sm overflow-hidden">
                {searchResults.loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-7 h-7 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
                  </div>
                ) : searchResults.posts.length === 0 ? (
                  <div className="py-16 text-center">
                    <HashIcon size={36} className="mx-auto mb-3 dark:text-gray-600 text-gray-300" />
                    <p className="dark:text-gray-400 text-gray-500 font-medium">
                      Nenhuma publicação para "{search}"
                    </p>
                    <p className="text-sm dark:text-gray-600 text-gray-400 mt-1">
                      Tente buscar por outro termo ou hashtag
                    </p>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {searchResults.posts.map((p, i) => (
                        <PostGridItem
                          key={p.id}
                          post={p}
                          featured={i === 0}
                          onClick={() => navigate(`/post/${p.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* People tab */}
            {searchTab === 'people' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100 shadow-sm overflow-hidden">
                {searchResults.loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-7 h-7 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
                  </div>
                ) : searchResults.users.length === 0 ? (
                  <div className="py-16 text-center">
                    <UsersIcon size={36} className="mx-auto mb-3 dark:text-gray-600 text-gray-300" />
                    <p className="dark:text-gray-400 text-gray-500 font-medium">
                      Nenhum usuário encontrado para "{search}"
                    </p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-white/5 divide-gray-100">
                    {searchResults.users.map(u => (
                      <UserRow
                        key={u.id}
                        targetUser={u}
                        isFollowing={followingMap[u.id] || false}
                        followLoading={followingLoading[u.id] || false}
                        onFollow={() => handleFollow(u)}
                        onMessage={() => navigate('/mensagens', { state: { userId: u.id } })}
                        onProfile={() => navigate(`/perfil/${u.username}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Default explore view (no search) ─────────────────────────────── */}
        {!isSearching && (
          <>
            {/* Trending tags */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
              {TRENDING_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all dark:bg-surface-800 bg-white border dark:border-white/5 border-gray-200 dark:text-gray-400 text-gray-600 hover:border-brand-pink/40 hover:text-brand-pink dark:hover:bg-brand-pink/5 shadow-sm"
                >
                  <TrendingUpIcon size={11} className="text-brand-pink" />
                  {tag}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
              {EXPLORE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    activeCategory === cat.id
                      ? 'btn-brand shadow-brand'
                      : 'dark:bg-surface-800 bg-white dark:text-gray-400 text-gray-600 border dark:border-white/10 border-gray-200 dark:hover:bg-white/5 hover:bg-gray-50 shadow-sm'
                  )}
                >
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>

            {/* Suggested people */}
            {suggestedUsers.length > 0 && (
              <div className="mb-5 dark:bg-surface-800 bg-white rounded-2xl p-4 border dark:border-white/5 border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold dark:text-gray-300 text-gray-700 flex items-center gap-1.5">
                    <UsersIcon size={15} className="text-brand-pink" />
                    Pessoas para seguir
                  </h3>
                  <span className="text-xs dark:text-gray-500 text-gray-400">
                    {suggestedUsers.length} usuários
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {suggestedUsers.map(u => (
                    <div key={u.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-[76px] text-center">
                      <UserAvatar
                        src={u.avatar}
                        name={u.displayName}
                        size="lg"
                        onClick={() => navigate(`/perfil/${u.username}`)}
                      />
                      <div className="w-full">
                        <p className="text-xs font-semibold dark:text-white text-gray-900 truncate leading-tight">
                          {u.displayName}
                        </p>
                        <p className="text-[10px] dark:text-gray-500 text-gray-400 truncate">@{u.username}</p>
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <button
                          onClick={() => handleFollow(u)}
                          disabled={followingLoading[u.id]}
                          className={cn(
                            'w-full py-1 rounded-lg text-[10px] font-bold transition-all',
                            followingMap[u.id]
                              ? 'dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-red-500/10 hover:text-red-500'
                              : 'btn-brand'
                          )}
                        >
                          {followingLoading[u.id] ? '...' : followingMap[u.id] ? 'Seguindo' : 'Seguir'}
                        </button>
                        <button
                          onClick={() => navigate('/mensagens', { state: { userId: u.id } })}
                          className="w-full py-1 rounded-lg text-[10px] font-semibold transition-all dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200"
                        >
                          DM
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live indicator */}
            {filteredPosts.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold dark:text-gray-400 text-gray-500">
                    Feed global · {filteredPosts.length} publicações
                  </span>
                </div>
                <span className="text-xs dark:text-gray-600 text-gray-400">
                  Atualiza automaticamente
                </span>
              </div>
            )}

            {/* Posts grid */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🌍</div>
                <p className="text-lg font-bold dark:text-white text-gray-900 mb-2">Nenhuma publicação ainda</p>
                <p className="dark:text-gray-400 text-gray-600 text-sm">
                  Seja o primeiro a publicar algo no JPvano!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-1.5">
                {filteredPosts.map((post, i) => (
                  <PostGridItem
                    key={post.id}
                    post={post}
                    featured={i % 9 === 0}
                    onClick={() => navigate(`/post/${post.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PostGridItem({ post, featured, onClick }: { post: Post; featured: boolean; onClick: () => void }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden dark:bg-surface-800 bg-gray-100 cursor-pointer group rounded-lg',
        featured ? 'col-span-2 row-span-2' : ''
      )}
      style={{ aspectRatio: featured ? 'auto' : '1 / 1' }}
      onClick={onClick}
    >
      {post.media[0] ? (
        <>
          {post.type === 'video' || post.type === 'reel' ? (
            <video
              src={post.media[0]}
              className="w-full h-full object-cover"
              style={{ minHeight: featured ? '260px' : '110px' }}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={post.media[0]}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ minHeight: featured ? '260px' : '110px' }}
              loading="lazy"
            />
          )}
          {(post.type === 'reel' || post.type === 'video') && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-0.5">
              <span className="text-[10px] text-white px-1">▶</span>
            </div>
          )}
          {post.type === 'carousel' && post.media.length > 1 && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-0.5">
              <span className="text-[10px] text-white px-1">⊞</span>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3" style={{ minHeight: featured ? '260px' : '110px' }}>
          <p className="text-xs dark:text-gray-400 text-gray-600 line-clamp-4 text-center">{post.content}</p>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <span className="text-white text-xs font-bold flex items-center gap-1">
          ❤️ {formatNumber(post.likes.length)}
        </span>
        <span className="text-white text-xs font-bold flex items-center gap-1">
          💬 {formatNumber(post.comments.length)}
        </span>
      </div>
    </div>
  );
}

interface UserRowProps {
  targetUser: User;
  isFollowing: boolean;
  followLoading: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onProfile: () => void;
}

function UserRow({ targetUser, isFollowing, followLoading, onFollow, onMessage, onProfile }: UserRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 dark:hover:bg-white/[0.02] hover:bg-gray-50 transition-all">
      <button onClick={onProfile} className="flex-shrink-0">
        <UserAvatar src={targetUser.avatar} name={targetUser.displayName} size="md" />
      </button>
      <button onClick={onProfile} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-sm dark:text-white text-gray-900 truncate">
            {targetUser.displayName}
          </span>
          {targetUser.isVerified && <VerifiedBadge size="xs" />}
          {targetUser.isPremium && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-yellow-400 bg-yellow-400/10">
              PRO
            </span>
          )}
        </div>
        <span className="text-xs dark:text-gray-500 text-gray-400 truncate block">
          @{targetUser.username}
          {targetUser.bio && (
            <span className="dark:text-gray-600 text-gray-400"> · {targetUser.bio.substring(0, 40)}{targetUser.bio.length > 40 ? '…' : ''}</span>
          )}
        </span>
      </button>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onMessage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200 transition-all text-xs font-semibold"
        >
          <MessageCircleIcon size={13} />
          DM
        </button>
        <button
          onClick={onFollow}
          disabled={followLoading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
            isFollowing
              ? 'dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-red-500/10 hover:text-red-500'
              : 'btn-brand shadow-brand'
          )}
        >
          {followLoading ? (
            <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <>
              {!isFollowing && <UserPlusIcon size={12} />}
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
