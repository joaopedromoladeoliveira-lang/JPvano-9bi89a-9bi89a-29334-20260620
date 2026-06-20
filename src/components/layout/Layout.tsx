import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { CreatePostModal } from '@/components/features/CreatePostModal';
import { CreateStoryModal } from '@/components/features/CreateStoryModal';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { usePosts } from '@/hooks/usePosts';
import { useNotifications } from '@/hooks/useNotifications';
import { createStory } from '@/lib/db';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  /** Optional override — pages like FeedPage handle their own modal */
  onCreatePost?: () => void;
}

export function Layout({ children, onCreatePost: externalCreatePost }: LayoutProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { createPost } = usePosts();
  const { unreadCount, unreadMessages } = useNotifications();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);

  async function handleCreatePost(data: {
    type: 'text' | 'image' | 'carousel' | 'video' | 'reel';
    content: string;
    media: string[];
    location?: string;
  }) {
    await createPost(data);
    setShowCreatePost(false);
    toast.success('Publicação criada! ✨');
  }

  async function handleCreateStory(data: { media: string; type: 'image' | 'video'; overlayText?: string }) {
    if (!user) return;
    await createStory({
      user_id: user.id,
      media: data.media,
      type: data.type,
      overlay_text: data.overlayText,
    });
    setShowCreateStory(false);
    toast.success('Story publicado!');
  }

  return (
    <div className="min-h-screen dark:bg-surface-950 bg-surface-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          onCreatePost={externalCreatePost ?? (() => setShowCreatePost(true))}
          onLogout={logout}
          onToggleTheme={toggleTheme}
          isDark={isDark}
          unreadNotifications={unreadCount}
          unreadMessages={unreadMessages}
        />
      </div>

      {/* Main content */}
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <MobileNav
          user={user}
          onCreatePost={() => setShowCreatePost(true)}
          unreadNotifications={unreadCount}
        />
      </div>

      {/* Create Post Modal */}
      {showCreatePost && user && (
        <CreatePostModal
          user={user}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && user && (
        <CreateStoryModal
          user={user}
          onClose={() => setShowCreateStory(false)}
          onSubmit={handleCreateStory}
        />
      )}
    </div>
  );
}
