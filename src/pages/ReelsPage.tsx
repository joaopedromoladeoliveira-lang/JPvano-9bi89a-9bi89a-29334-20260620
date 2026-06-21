import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilmIcon, HeartIcon, MessageCircleIcon, Share2Icon, VolumeXIcon, Volume2Icon, GlobeIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, toggleLike as dbToggleLike } from '@/lib/db';
import { usePosts, broadcastPostsUpdate } from '@/hooks/usePosts';
import { formatNumber } from '@/lib/utils';
import type { Post, User } from '@/types';
import { cn } from '@/lib/utils';

export default function ReelsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Global feed — all posts from all users, polled every 5s
  const { posts: allPosts, toggleLike } = usePosts({ limit: 100, pollInterval: 5000 });

  const [authors, setAuthors] = useState<Map<string, User>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  // Load author profiles for all posts
  useEffect(() => {
    if (allPosts.length === 0) return;
    const ids = [...new Set(allPosts.map(p => p.userId))];
    const missing = ids.filter(id => !authors.has(id));
    if (missing.length === 0) return;
    Promise.all(missing.map(id => getProfile(id))).then(profiles => {
      setAuthors(prev => {
        const next = new Map(prev);
        profiles.forEach((p, i) => { if (p) next.set(missing[i], p); });
        return next;
      });
    });
  }, [allPosts]);

  // Control video playback based on active slide
  useEffect(() => {
    videoRefs.current.forEach((vid, postId) => {
      const postIndex = allPosts.findIndex(p => p.id === postId);
      if (postIndex === activeIndex) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeIndex, allPosts]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  }

  if (isLoading) return null;

  if (allPosts.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4 dark:text-gray-400 text-gray-600">
          <FilmIcon size={48} className="opacity-30" />
          <p className="text-lg font-semibold dark:text-white text-gray-900">Nenhuma publicação ainda</p>
          <p className="text-sm">Publique algo no feed para aparecer aqui!</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <GlobeIcon size={12} className="text-brand-pink" />
            <span>Feed global — sincronizado com todos os usuários</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        onScroll={handleScroll}
      >
        {allPosts.map((post, i) => {
          const author = authors.get(post.userId);
          const isLiked = user ? post.likes.includes(user.id) : false;
          const isVideo = post.type === 'video' || post.type === 'reel';
          const mediaUrl = post.media[0];

          return (
            <div
              key={post.id}
              className="relative h-screen snap-start flex items-center justify-center dark:bg-black bg-gray-900 overflow-hidden"
            >
              {/* Media */}
              {mediaUrl ? (
                isVideo ? (
                  <video
                    ref={el => { if (el) videoRefs.current.set(post.id, el); else videoRefs.current.delete(post.id); }}
                    src={mediaUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted={muted}
                    loop
                    playsInline
                    autoPlay={i === 0}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8"
                  style={{ background: 'linear-gradient(135deg, #1a0a2e, #0d001a)' }}>
                  <p className="text-white text-lg font-bold text-center leading-relaxed">{post.content}</p>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Post info — bottom left */}
              <div className="absolute bottom-20 md:bottom-8 left-4 right-16 z-10">
                {author && (
                  <button
                    className="flex items-center gap-2 mb-3"
                    onClick={() => navigate(`/perfil/${author.username}`)}
                  >
                    <UserAvatar src={author.avatar} name={author.displayName} size="sm" />
                    <span className="text-white font-semibold text-sm">{author.displayName}</span>
                    {author.isVerified && <VerifiedBadge size="xs" />}
                    <span className="ml-1 px-2.5 py-0.5 rounded-full border border-white/70 text-white text-xs font-medium hover:bg-white hover:text-black transition-all">
                      Seguir
                    </span>
                  </button>
                )}
                {post.content && (
                  <p className="text-white text-sm leading-relaxed line-clamp-3 mb-1">{post.content}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-brand-pink text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Action buttons — right */}
              <div className="absolute right-3 bottom-32 md:bottom-20 z-10 flex flex-col items-center gap-5">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-all group-active:scale-90',
                    isLiked ? 'bg-red-500/20' : 'bg-black/30 hover:bg-black/50'
                  )}>
                    <HeartIcon
                      size={24}
                      className={cn('transition-all', isLiked ? 'fill-red-500 text-red-500' : 'text-white')}
                    />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">
                    {formatNumber(post.likes.length)}
                  </span>
                </button>

                <button
                  className="flex flex-col items-center gap-1 group"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all group-active:scale-90">
                    <MessageCircleIcon size={24} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">
                    {formatNumber(post.comments.length)}
                  </span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all group-active:scale-90">
                    <Share2Icon size={22} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow">
                    {formatNumber(post.shares)}
                  </span>
                </button>

                <button
                  onClick={() => setMuted(!muted)}
                  className="w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all"
                >
                  {muted
                    ? <VolumeXIcon size={20} className="text-white" />
                    : <Volume2Icon size={20} className="text-white" />
                  }
                </button>
              </div>

              {/* Progress dots */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
                {allPosts.slice(0, Math.min(allPosts.length, 8)).map((_, dotIdx) => (
                  <div
                    key={dotIdx}
                    className={cn(
                      'w-1 rounded-full transition-all duration-300',
                      dotIdx === i ? 'h-6 bg-white' : 'h-1.5 bg-white/30'
                    )}
                  />
                ))}
              </div>

              {/* Index indicator */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-1">
                <GlobeIcon size={10} className="text-green-400" />
                <span className="text-[10px] text-white/80 font-medium">{i + 1} / {allPosts.length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
