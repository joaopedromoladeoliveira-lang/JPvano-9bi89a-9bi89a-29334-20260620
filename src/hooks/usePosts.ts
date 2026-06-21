import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getPosts, createPost as dbCreatePost, deletePost as dbDeletePost,
  toggleLike as dbToggleLike, toggleSave as dbToggleSave,
  addComment as dbAddComment, createNotification,
} from '@/lib/db';
import type { Post } from '@/types';
import { useAuth } from './useAuth';
import { extractHashtags } from '@/lib/utils';

export const POSTS_EVENT = 'jpvano:posts_updated';

/** Broadcast to same tab + all other tabs/windows */
export function broadcastPostsUpdate() {
  window.dispatchEvent(new Event(POSTS_EVENT));
  try {
    localStorage.setItem('jpvano:posts_ts', Date.now().toString());
  } catch (_) {}
}

interface UsePostsOptions {
  /** Filter by a specific user; omit for GLOBAL feed (all users) */
  filterUserId?: string;
  /** How many posts to fetch */
  limit?: number;
  /** Poll interval in ms; default 5000 */
  pollInterval?: number;
}

export function usePosts(options: UsePostsOptions = {}) {
  const { filterUserId, limit = 50, pollInterval = 5000 } = options;
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const refreshPosts = useCallback(async (force = false) => {
    const now = Date.now();
    // Throttle rapid successive calls — but always run if forced
    if (!force && now - lastFetchRef.current < 2000) return;
    lastFetchRef.current = now;

    const data = await getPosts({ userId: filterUserId, limit });
    if (isMountedRef.current) {
      setPosts(data);
      setLoading(false);
    }
  }, [filterUserId, limit]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    refreshPosts(true);
    return () => { isMountedRef.current = false; };
  }, [refreshPosts]);

  // Real-time sync:
  //  1. Same-tab event (post created/deleted in this tab)
  //  2. Cross-tab storage event (post created in another tab/window)
  //  3. Global polling every `pollInterval` ms (catches remote users)
  useEffect(() => {
    const handleEvent = () => refreshPosts(true);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'jpvano:posts_ts') refreshPosts(true);
    };

    window.addEventListener(POSTS_EVENT, handleEvent);
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => refreshPosts(), pollInterval);

    return () => {
      window.removeEventListener(POSTS_EVENT, handleEvent);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [refreshPosts, pollInterval]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.likes.includes(user.id);

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      likes: isLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id],
    } : p));

    await dbToggleLike(postId, user.id, isLiked);
    broadcastPostsUpdate();

    if (!isLiked && post.userId !== user.id) {
      await createNotification({
        user_id: post.userId,
        from_user_id: user.id,
        type: 'like',
        post_id: postId,
        content: 'curtiu sua publicação',
      });
    }
  }, [user, posts]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    const comment = await dbAddComment(postId, user.id, content);
    if (!comment) return;

    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, comments: [...p.comments, comment],
    } : p));
    broadcastPostsUpdate();

    const post = posts.find(p => p.id === postId);
    if (post && post.userId !== user.id) {
      await createNotification({
        user_id: post.userId,
        from_user_id: user.id,
        type: 'comment',
        post_id: postId,
        content: `comentou: "${content.substring(0, 50)}"`,
      });
    }
  }, [user, posts]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isSaved = post.saves.includes(user.id);

    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      saves: isSaved ? p.saves.filter(id => id !== user.id) : [...p.saves, user.id],
    } : p));

    await dbToggleSave(postId, user.id, isSaved);
    broadcastPostsUpdate();
  }, [user, posts]);

  const createPost = useCallback(async (postData: {
    type?: 'text' | 'image' | 'video' | 'carousel' | 'reel';
    content: string;
    media?: string[];
    location?: string;
  }) => {
    if (!user) return;
    const hashtags = extractHashtags(postData.content);
    const post = await dbCreatePost({
      user_id: user.id,
      type: postData.type || 'text',
      content: postData.content,
      media: postData.media || [],
      hashtags,
      location: postData.location,
    });
    if (post) {
      // Prepend to local state immediately (optimistic)
      setPosts(prev => [post, ...prev]);
      // Notify all tabs/windows about the new post
      broadcastPostsUpdate();
    }
    return post;
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    await dbDeletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    broadcastPostsUpdate();
  }, []);

  return { posts, loading, refreshPosts, toggleLike, addComment, toggleSave, createPost, deletePost };
}
