/**
 * JPvano - Supabase database helpers
 * All data operations go through here.
 */
import { supabase } from './supabase';
import type { User, Post, Story, Notification, Comment } from '@/types';

// ─── User Profile ────────────────────────────────────────────────────────────

export function mapProfile(row: any): User {
  return {
    id: row.id,
    username: row.username || '',
    email: row.email || '',
    displayName: row.display_name || row.username || '',
    bio: row.bio || '',
    avatar: row.avatar || '',
    coverImage: row.cover_image || '',
    website: row.website || '',
    isVerified: row.is_verified || false,
    isAdmin: row.is_admin || false,
    isPremium: row.is_premium || false,
    isPrivate: row.is_private || false,
    isBanned: row.is_banned || false,
    isSuspended: row.is_suspended || false,
    followers: [],
    following: [],
    posts: [],
    savedPosts: [],
    createdAt: row.created_at || new Date().toISOString(),
    twoFactorEnabled: false,
    notifications: row.notification_settings || {
      likes: true, comments: true, follows: true, mentions: true,
      messages: true, stories: true, live: true, email: true, push: true,
    },
    verificationStatus: row.verification_status || 'none',
    premiumTier: row.premium_tier || 'none',
    theme: row.theme || 'dark',
  };
}

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function getProfileByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('username', username)
    .single();
  if (error || !data) return null;
  const userId = data.id;
  const user = mapProfile(data);
  const [followersRes, followingRes] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  user.followers = new Array(followersRes.count || 0).fill('');
  user.following = new Array(followingRes.count || 0).fill('');
  return user;
}

export async function searchProfiles(query: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function getAllProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(50);
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function updateProfile(userId: string, updates: Partial<{
  display_name: string;
  bio: string;
  avatar: string;
  cover_image: string;
  website: string;
  username: string;
  is_private: boolean;
  theme: string;
  notification_settings: object;
}>): Promise<User | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error || !data) {
    console.error('updateProfile error:', error);
    return null;
  }
  return mapProfile(data);
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  return !!data;
}

export async function follow(followerId: string, followingId: string): Promise<void> {
  await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
}

export async function unfollow(followerId: string, followingId: string): Promise<void> {
  await supabase.from('follows').delete()
    .eq('follower_id', followerId).eq('following_id', followingId);
}

export async function getFollowersCount(userId: string): Promise<number> {
  const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
  return count || 0;
}

export async function getFollowers(userId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, user_profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data
    .map((row: any) => row.user_profiles)
    .filter(Boolean)
    .map(mapProfile);
}

export async function getFollowing(userId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, user_profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data
    .map((row: any) => row.user_profiles)
    .filter(Boolean)
    .map(mapProfile);
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function mapPost(row: any, likes: string[] = [], saves: string[] = [], comments: Comment[] = []): Post {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type || 'text',
    content: row.content || '',
    media: row.media || [],
    likes,
    comments,
    shares: row.shares_count || 0,
    saves,
    hashtags: row.hashtags || [],
    mentions: row.mentions || [],
    location: row.location,
    isStory: false,
    createdAt: row.created_at,
    isReported: row.is_reported || false,
    reports: [],
    viewCount: row.view_count || 0,
    isHidden: row.is_hidden || false,
    commentsDisabled: row.comments_disabled || false,
  };
}

export async function getPosts(options?: { userId?: string; limit?: number; offset?: number }): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, post_likes(user_id), post_saves(user_id), comments(id,user_id,content,created_at,is_deleted)')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 30);

  if (options?.userId) query = query.eq('user_id', options.userId);
  if (options?.offset) query = query.range(options.offset, (options.offset + (options.limit || 30)) - 1);

  const { data, error } = await query;
  if (error) { console.error('getPosts error:', error); return []; }
  return (data || []).map(row => mapPost(
    row,
    (row.post_likes || []).map((l: any) => l.user_id),
    (row.post_saves || []).map((s: any) => s.user_id),
    (row.comments || []).filter((c: any) => !c.is_deleted).map((c: any) => ({
      id: c.id, userId: c.user_id, content: c.content,
      likes: [], replies: [], createdAt: c.created_at, isDeleted: c.is_deleted,
    })),
  ));
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, post_likes(user_id), post_saves(user_id), comments(id,user_id,content,created_at,is_deleted)')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapPost(
    data,
    (data.post_likes || []).map((l: any) => l.user_id),
    (data.post_saves || []).map((s: any) => s.user_id),
    (data.comments || []).filter((c: any) => !c.is_deleted).map((c: any) => ({
      id: c.id, userId: c.user_id, content: c.content,
      likes: [], replies: [], createdAt: c.created_at, isDeleted: c.is_deleted,
    })),
  );
}

export async function createPost(data: {
  user_id: string;
  type: string;
  content: string;
  media?: string[];
  hashtags?: string[];
  location?: string;
}): Promise<Post | null> {
  const { data: row, error } = await supabase.from('posts').insert(data).select().single();
  if (error) { console.error('createPost error:', error); return null; }
  return mapPost(row);
}

export async function deletePost(id: string): Promise<void> {
  await supabase.from('posts').delete().eq('id', id);
}

export async function toggleLike(postId: string, userId: string, isLiked: boolean): Promise<void> {
  if (isLiked) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  }
}

export async function toggleSave(postId: string, userId: string, isSaved: boolean): Promise<void> {
  if (isSaved) {
    await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    await supabase.from('post_saves').insert({ post_id: postId, user_id: userId });
  }
}

export async function addComment(postId: string, userId: string, content: string): Promise<Comment | null> {
  const { data, error } = await supabase.from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select().single();
  if (error) return null;
  return { id: data.id, userId: data.user_id, content: data.content, likes: [], replies: [], createdAt: data.created_at, isDeleted: false };
}

export async function incrementViewCount(postId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_view_count', { post_id: postId });
  if (error) {
    // fallback: fetch current count and increment
    const { data } = await supabase.from('posts').select('view_count').eq('id', postId).single();
    if (data) {
      await supabase.from('posts').update({ view_count: (data.view_count || 0) + 1 }).eq('id', postId);
    }
  }
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export function mapStory(row: any): Story {
  return {
    id: row.id,
    userId: row.user_id,
    media: row.media,
    type: row.type || 'image',
    viewers: (row.story_viewers || []).map((v: any) => v.viewer_id),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    duration: row.duration || 5,
    overlayText: row.overlay_text,
  };
}

export async function getStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*, story_viewers(viewer_id)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) { console.error('getStories error:', error); return []; }
  return (data || []).map(mapStory);
}

export async function createStory(data: {
  user_id: string;
  media: string;
  type: string;
  overlay_text?: string;
  duration?: number;
}): Promise<Story | null> {
  const { data: row, error } = await supabase.from('stories').insert(data).select().single();
  if (error) { console.error('createStory error:', error); return null; }
  return mapStory({ ...row, story_viewers: [] });
}

export async function viewStory(storyId: string, viewerId: string): Promise<void> {
  await supabase.from('story_viewers').upsert({ story_id: storyId, viewer_id: viewerId });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    fromUserId: row.from_user_id,
    type: row.type,
    postId: row.post_id,
    content: row.content,
    isRead: row.is_read || false,
    createdAt: row.created_at,
  };
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data || []).map(mapNotification);
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count || 0;
}

export async function createNotification(notif: {
  user_id: string;
  from_user_id?: string;
  type: string;
  post_id?: string;
  content: string;
}): Promise<void> {
  await supabase.from('notifications').insert(notif);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
}

// ─── Messages / Conversations ─────────────────────────────────────────────────

export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
  // Check existing 1-on-1 conversation
  const { data: myConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (myConvs && myConvs.length > 0) {
    const myConvIds = myConvs.map((c: any) => c.conversation_id);
    const { data: shared } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds);

    if (shared && shared.length > 0) {
      // Verify it's a 1-on-1 (non-group)
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, is_group')
        .eq('id', shared[0].conversation_id)
        .eq('is_group', false)
        .single();
      if (conv) return conv.id;
    }
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select()
    .single();
  if (error || !newConv) throw new Error('Failed to create conversation');

  await supabase.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: userId },
    { conversation_id: newConv.id, user_id: otherUserId },
  ]);

  return newConv.id;
}

export async function getConversations(userId: string): Promise<any[]> {
  const { data: parts } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (!parts || parts.length === 0) return [];
  const convIds = parts.map((p: any) => p.conversation_id);

  const { data: convs } = await supabase
    .from('conversations')
    .select('*, conversation_participants(user_id)')
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  // Get last message for each conversation
  if (!convs) return [];
  const result = await Promise.all(convs.map(async (conv: any) => {
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return { ...conv, lastMessage: lastMsg };
  }));
  return result;
}

export async function getMessages(conversationId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<any> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;

  // Update conversation timestamp
  await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  return data;
}

export async function markMessagesRead(conversationId: string, userId: string): Promise<void> {
  await supabase.from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
}

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  const { data: parts } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);
  if (!parts || parts.length === 0) return 0;

  const convIds = parts.map((p: any) => p.conversation_id);
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .neq('sender_id', userId)
    .eq('is_read', false);
  return count || 0;
}

// ─── File Upload ──────────────────────────────────────────────────────────────

export async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) { console.error('Upload error:', error); return null; }
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

export async function uploadBase64(bucket: string, path: string, base64: string, mimeType = 'image/jpeg'): Promise<string | null> {
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const byteChars = atob(base64Data);
  const byteArr = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: mimeType });
  const file = new File([blob], path.split('/').pop() || 'file', { type: mimeType });
  return uploadFile(bucket, path, file);
}
