import { supabase } from './supabase';
import { updateProfile } from './db';
import type { User } from '@/types';

export const ADMIN_EMAIL = 'joaopedromoladeoliveira@gmail.com';

export function mapSupabaseUser(user: any, profile: any = null): User {
  return {
    id: user.id,
    username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
    email: user.email || '',
    displayName: profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || '',
    bio: profile?.bio || '',
    avatar: profile?.avatar || user.user_metadata?.avatar_url || '',
    coverImage: profile?.cover_image || '',
    website: profile?.website || '',
    isVerified: profile?.is_verified || false,
    isAdmin: profile?.is_admin || user.email === ADMIN_EMAIL,
    isPremium: profile?.is_premium || false,
    isPrivate: profile?.is_private || false,
    isBanned: profile?.is_banned || false,
    isSuspended: profile?.is_suspended || false,
    followers: [],
    following: [],
    posts: [],
    savedPosts: [],
    createdAt: user.created_at || new Date().toISOString(),
    twoFactorEnabled: false,
    notifications: profile?.notification_settings || {
      likes: true, comments: true, follows: true, mentions: true,
      messages: true, stories: true, live: true, email: true, push: true,
    },
    verificationStatus: profile?.verification_status || 'none',
    premiumTier: profile?.premium_tier || 'none',
    theme: profile?.theme || 'dark',
  };
}

export async function sendOtp(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return { error: error.message };
  return {};
}

export async function verifyOtpAndSetPassword(
  email: string,
  token: string,
  password: string,
  username: string,
  displayName: string
): Promise<{ user?: User; error?: string }> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Falha na verificação' };

  const { error: updateError } = await supabase.auth.updateUser({
    password,
    data: { username, full_name: displayName },
  });
  if (updateError) return { error: updateError.message };

  // Update profile in DB
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  await updateProfile(data.user.id, {
    display_name: displayName,
    username: username.toLowerCase(),
    is_admin: isAdmin,
    is_verified: isAdmin,
  });

  const profile = await import('./db').then(m => m.getProfile(data.user!.id));
  return { user: mapSupabaseUser(data.user, profile) };
}

export async function loginWithPassword(email: string, password: string): Promise<{ user?: User; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Falha no login' };

  const profile = await import('./db').then(m => m.getProfile(data.user!.id));
  return { user: mapSupabaseUser(data.user, profile) };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const profile = await import('./db').then(m => m.getProfile(session.user.id));
  return mapSupabaseUser(session.user, profile);
}
