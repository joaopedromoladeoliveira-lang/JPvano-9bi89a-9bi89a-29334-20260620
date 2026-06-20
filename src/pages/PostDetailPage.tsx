import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, MessageCircleIcon, Share2Icon, BookmarkIcon, SendIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { getPostById, getProfile, toggleLike, toggleSave, addComment as dbAddComment, createNotification } from '@/lib/db';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { broadcastPostsUpdate } from '@/hooks/usePosts';
import type { Post, User } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentAuthors, setCommentAuthors] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    if (!postId) { navigate(-1); return; }
    getPostById(postId).then(async p => {
      if (!p) { navigate(-1); return; }
      setPost(p);
      // Increment view count
      supabase.from('posts').update({ view_count: (p.viewCount || 0) + 1 }).eq('id', p.id).catch(() => {});
      const a = await getProfile(p.userId);
      setAuthor(a);
      // Load comment authors
      const ids = [...new Set(p.comments.map(c => c.userId))];
      const map = new Map<string, User>();
      await Promise.all(ids.map(id => getProfile(id).then(pr => { if (pr) map.set(id, pr); })));
      setCommentAuthors(map);
    });
  }, [postId]);

  // Poll for updates
  useEffect(() => {
    if (!postId) return;
    const interval = setInterval(async () => {
      const p = await getPostById(postId);
      if (p) {
        setPost(p);
        const newIds = [...new Set(p.comments.map(c => c.userId))].filter(id => !commentAuthors.has(id));
        if (newIds.length > 0) {
          const map = new Map(commentAuthors);
          await Promise.all(newIds.map(id => getProfile(id).then(pr => { if (pr) map.set(id, pr); })));
          setCommentAuthors(map);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [postId, commentAuthors]);

  async function handleLike() {
    if (!user || !post) return;
    const isLiked = post.likes.includes(user.id);
    const newLikes = isLiked ? post.likes.filter(id => id !== user.id) : [...post.likes, user.id];
    setPost(p => p ? { ...p, likes: newLikes } : p);
    await toggleLike(post.id, user.id, isLiked);
    broadcastPostsUpdate();
    if (!isLiked && post.userId !== user.id) {
      createNotification({ user_id: post.userId, from_user_id: user.id, type: 'like', post_id: post.id, content: 'curtiu sua publicação' });
    }
  }

  async function handleSavePost() {
    if (!user || !post) return;
    const isSaved = post.saves.includes(user.id);
    const newSaves = isSaved ? post.saves.filter(id => id !== user.id) : [...post.saves, user.id];
    setPost(p => p ? { ...p, saves: newSaves } : p);
    await toggleSave(post.id, user.id, isSaved);
    broadcastPostsUpdate();
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !user || !post) return;
    const comment = await dbAddComment(post.id, user.id, commentText);
    if (comment) {
      setPost(p => p ? { ...p, comments: [...p.comments, comment] } : p);
      if (!commentAuthors.has(user.id)) {
        setCommentAuthors(prev => new Map(prev).set(user.id, user));
      }
      broadcastPostsUpdate();
      setCommentText('');
      if (post.userId !== user.id) {
        createNotification({ user_id: post.userId, from_user_id: user.id, type: 'comment', post_id: post.id, content: `comentou: "${commentText.substring(0, 50)}"` });
      }
    }
  }

  async function handleShare() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    toast.success('Link copiado!');
    if (post) {
      await supabase.from('posts').update({ shares_count: (post.shares || 0) + 1 }).eq('id', post.id);
    }
  }

  if (!post || !author) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const isLiked = user ? post.likes.includes(user.id) : false;
  const isSaved = user ? post.saves.includes(user.id) : false;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600 mb-6 hover:text-brand-pink transition-colors">
          <ArrowLeftIcon size={16} /> Voltar
        </button>

        <div className="flex flex-col md:flex-row gap-0 dark:bg-surface-800 bg-white rounded-2xl overflow-hidden border dark:border-white/5 border-gray-100 shadow-lg">
          {post.media.length > 0 && (
            <div className="md:w-1/2 dark:bg-black bg-gray-900 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              {post.media[0].includes('.mp4') || post.media[0].includes('.webm') ? (
                <video src={post.media[0]} controls className="w-full h-full object-contain max-h-[600px]" />
              ) : (
                <img src={post.media[0]} alt="Post" className="w-full h-full object-cover max-h-[600px]" />
              )}
            </div>
          )}

          <div className={`flex flex-col ${post.media.length > 0 ? 'md:w-1/2' : 'w-full'}`}>
            <div className="flex items-center p-4 border-b dark:border-white/5 border-gray-100">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => navigate(`/perfil/${author.username}`)}>
                <UserAvatar src={author.avatar} name={author.displayName} size="md" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm dark:text-white text-gray-900">{author.displayName}</span>
                    {author.isVerified && <VerifiedBadge size="xs" />}
                  </div>
                  <span className="text-xs dark:text-gray-400 text-gray-500">@{author.username} · {formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
              {post.content && (
                <div className="flex gap-3">
                  <UserAvatar src={author.avatar} name={author.displayName} size="sm" />
                  <div>
                    <span className="font-semibold text-sm dark:text-white text-gray-900 mr-2">{author.username}</span>
                    <span className="text-sm dark:text-gray-200 text-gray-800">
                      {post.content.split(/(#\w+|@\w+)/g).map((part, i) =>
                        part.startsWith('#') || part.startsWith('@')
                          ? <span key={i} className="text-brand-pink font-medium">{part}</span>
                          : part
                      )}
                    </span>
                    <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
              )}

              {post.comments.filter(c => !c.isDeleted).map(comment => {
                const commenter = commentAuthors.get(comment.userId);
                if (!commenter) return null;
                return (
                  <div key={comment.id} className="flex gap-3">
                    <UserAvatar src={commenter.avatar} name={commenter.displayName} size="sm" />
                    <div>
                      <span className="font-semibold text-sm dark:text-white text-gray-900 mr-2">{commenter.username}</span>
                      <span className="text-sm dark:text-gray-300 text-gray-700">{comment.content}</span>
                      <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t dark:border-white/5 border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button onClick={handleLike} className="flex items-center gap-1.5 group">
                    <HeartIcon size={24} className={cn('transition-all group-hover:scale-110', isLiked ? 'fill-red-500 text-red-500' : 'dark:text-gray-400 text-gray-600 hover:text-red-400')} />
                    <span className={cn('text-sm font-medium', isLiked ? 'text-red-500' : 'dark:text-gray-400 text-gray-600')}>{formatNumber(post.likes.length)}</span>
                  </button>
                  <button className="flex items-center gap-1.5 dark:text-gray-400 text-gray-600">
                    <MessageCircleIcon size={22} />
                    <span className="text-sm font-medium">{formatNumber(post.comments.length)}</span>
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-1.5 dark:text-gray-400 text-gray-600 hover:text-brand-purple transition-colors">
                    <Share2Icon size={22} />
                    <span className="text-sm font-medium">{formatNumber(post.shares)}</span>
                  </button>
                </div>
                <button onClick={handleSavePost} className={cn('transition-all hover:scale-110', isSaved ? 'text-brand-orange' : 'dark:text-gray-400 text-gray-600')}>
                  <BookmarkIcon size={22} className={isSaved ? 'fill-brand-orange' : ''} />
                </button>
              </div>
              <div className="text-xs dark:text-gray-500 text-gray-400 mb-3">{formatNumber(post.viewCount)} visualizações</div>

              {user && (
                <form onSubmit={handleComment} className="flex items-center gap-2">
                  <UserAvatar src={user.avatar} name={user.displayName} size="sm" />
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Adicionar comentário..."
                    className="flex-1 text-sm dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 rounded-full px-4 py-2 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink/50 dark:placeholder-gray-500 placeholder-gray-400"
                  />
                  <button type="submit" disabled={!commentText.trim()} className="btn-brand p-2 rounded-full disabled:opacity-40">
                    <SendIcon size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
