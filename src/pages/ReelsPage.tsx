import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilmIcon, HeartIcon, MessageCircleIcon, Share2Icon, VolumeXIcon, Volume2Icon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { getPosts, getProfile, toggleLike as dbToggleLike } from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import { broadcastPostsUpdate } from '@/hooks/usePosts';
import type { Post, User } from '@/types';
import { cn } from '@/lib/utils';

export default function ReelsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Map<string, User>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const loadPosts = async () => {
    const all = await getPosts({ limit: 50 });
    setPosts(all);
    // Load authors
    const ids = [...new Set(all.map(p => p.userId))];
    const map = new Map<string, User>();
    await Promise.all(ids.map(id => getProfile(id).then(p => { if (p) map.set(id, p); })));
    setAuthors(map);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
    loadPosts();
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const handler = () => loadPosts();
    window.addEventListener('jpvano:posts_updated', handler);
    const interval = setInterval(loadPosts, 5000);
    return () => { window.removeEventListener('jpvano:posts_updated', handler); clearInterval(interval); };
  }, []);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const index = Math.round(container.scrollTop / container.clientHeight);
    setActiveIndex(index);
  }

  async function handleLike(post: Post) {
    if (!user) return;
    const isLiked = post.likes.includes(user.id);
    const newLikes = isLiked ? post.likes.filter(id => id !== user.id) : [...post.likes, user.id];
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    await dbToggleLike(post.id, user.id, isLiked);
    broadcastPostsUpdate();
  }

  const PLACEHOLDER_MEDIA = [
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=700&fit=crop',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=700&fit=crop',
  ];

  if (posts.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4 dark:text-gray-400 text-gray-600">
          <FilmIcon size={48} className="opacity-30" />
          <p className="text-lg font-semibold dark:text-white text-gray-900">Nenhuma publicação ainda</p>
          <p className="text-sm">Publique algo no feed para aparecer aqui!</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar" onScroll={handleScroll}>
        {posts.map((post, i) => {
          const author = authors.get(post.userId);
          const isLiked = user ? post.likes.includes(user.id) : false;
          const mediaUrl = post.media[0] || PLACEHOLDER_MEDIA[i % PLACEHOLDER_MEDIA.length];

          return (
            <div key={post.id} className="relative h-screen snap-start flex items-center justify-center dark:bg-black bg-gray-900 overflow-hidden">
              <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              <div className="absolute bottom-20 md:bottom-8 left-4 right-16 z-10">
                {author && (
                  <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => navigate(`/perfil/${author.username}`)}>
                    <UserAvatar src={author.avatar} name={author.displayName} size="sm" />
                    <span className="text-white font-semibold text-sm">{author.displayName}</span>
                    {author.isVerified && <VerifiedBadge size="xs" />}
                    <button
                      className="ml-2 px-3 py-1 rounded-full border border-white text-white text-xs font-medium hover:bg-white hover:text-black transition-all"
                      onClick={e => { e.stopPropagation(); navigate(`/perfil/${author.username}`); }}
                    >Seguir</button>
                  </div>
                )}
                <p className="text-white text-sm leading-relaxed line-clamp-3">{post.content}</p>
                {post.hashtags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-brand-pink text-sm mr-1">{tag}</span>
                ))}
              </div>

              <div className="absolute right-3 bottom-32 md:bottom-20 z-10 flex flex-col items-center gap-5">
                <button onClick={() => handleLike(post)} className="flex flex-col items-center gap-1">
                  <HeartIcon size={28} className={cn('transition-all', isLiked ? 'fill-red-500 text-red-500' : 'text-white')} />
                  <span className="text-white text-xs font-medium">{formatNumber(post.likes.length)}</span>
                </button>
                <button className="flex flex-col items-center gap-1" onClick={() => navigate(`/post/${post.id}`)}>
                  <MessageCircleIcon size={28} className="text-white" />
                  <span className="text-white text-xs font-medium">{formatNumber(post.comments.length)}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <Share2Icon size={26} className="text-white" />
                  <span className="text-white text-xs font-medium">{formatNumber(post.shares)}</span>
                </button>
                <button onClick={() => setMuted(!muted)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                  {muted ? <VolumeXIcon size={20} /> : <Volume2Icon size={20} />}
                </button>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
                {posts.slice(0, 8).map((_, dotIdx) => (
                  <div key={dotIdx} className={cn('w-1 rounded-full transition-all', dotIdx === i ? 'h-6 bg-white' : 'h-1.5 bg-white/30')} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
