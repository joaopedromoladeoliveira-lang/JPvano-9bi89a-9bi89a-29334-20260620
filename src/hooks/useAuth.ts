import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { mapSupabaseUser, ADMIN_EMAIL } from '@/lib/auth';
import { getProfile, updateProfile as dbUpdateProfile } from '@/lib/db';
import type { User, AuthState } from '@/types';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        const user = mapSupabaseUser(session.user, profile);
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getProfile(session.user.id);
        const user = mapSupabaseUser(session.user, profile);
        setState({ user, isAuthenticated: true, isLoading: false });
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const profile = await getProfile(session.user.id);
        const user = mapSupabaseUser(session.user, profile);
        setState(prev => ({ ...prev, user }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      const user = mapSupabaseUser(session.user, profile);
      setState(prev => ({ ...prev, user }));
      return user;
    }
    return null;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<{
    displayName: string;
    bio: string;
    avatar: string;
    coverImage: string;
    website: string;
    username: string;
    isPrivate: boolean;
    theme: string;
    notifications: User['notifications'];
  }>) => {
    if (!state.user) return;

    const dbUpdates: any = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.notifications !== undefined) dbUpdates.notification_settings = updates.notifications;

    const updated = await dbUpdateProfile(state.user.id, dbUpdates);
    if (updated) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = mapSupabaseUser(session?.user || { id: state.user.id, email: state.user.email }, updated);
      setState(prev => ({ ...prev, user }));
    }
  }, [state.user]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isAdmin: state.user?.isAdmin || false,
    refreshUser,
    updateProfile,
    logout,
  };
}
