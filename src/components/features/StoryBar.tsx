import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { getAllProfiles, viewStory } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { Story, User } from '@/types';
import { cn } from '@/lib/utils';

interface StoryBarProps {
  stories: Story[];
  currentUser: User | null;
  onAddStory: () => void;
}

interface StoryGroup {
  user: User;
  stories: Story[];
}

export function StoryBar({ stories, currentUser, onAddStory }: StoryBarProps) {
  const [profiles, setProfiles] = useState<User[]>([]);
  const [viewing, setViewing] = useState<{ groupIdx: number; storyIdx: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();
  const STORY_DURATION = 5000; // ms

  useEffect(() => {
    getAllProfiles().then(setProfiles);
  }, []);

  const storyGroups: StoryGroup[] = React.useMemo(() => {
    const map = new Map<string, StoryGroup>();
    for (const story of stories) {
      const u = profiles.find(p => p.id === story.userId);
      if (!u) continue;
      if (!map.has(u.id)) map.set(u.id, { user: u, stories: [] });
      map.get(u.id)!.stories.push(story);
    }
    return Array.from(map.values());
  }, [stories, profiles]);

  // Auto-advance progress bar
  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    clearInterval(progressInterval.current);

    const group = storyGroups[viewing.groupIdx];
    if (!group) return;
    const story = group.stories[viewing.storyIdx];
    if (!story) return;

    // Mark as viewed
    if (currentUser) viewStory(story.id, currentUser.id).catch(() => {});

    const step = 100 / (STORY_DURATION / 100);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval.current);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(progressInterval.current);
  }, [viewing?.groupIdx, viewing?.storyIdx]);

  function openGroup(groupIdx: number) {
    setViewing({ groupIdx, storyIdx: 0 });
  }

  function handleNext() {
    if (!viewing) return;
    const group = storyGroups[viewing.groupIdx];
    if (viewing.storyIdx < group.stories.length - 1) {
      setViewing({ ...viewing, storyIdx: viewing.storyIdx + 1 });
    } else if (viewing.groupIdx < storyGroups.length - 1) {
      setViewing({ groupIdx: viewing.groupIdx + 1, storyIdx: 0 });
    } else {
      setViewing(null);
    }
  }

  function handlePrev() {
    if (!viewing) return;
    if (viewing.storyIdx > 0) {
      setViewing({ ...viewing, storyIdx: viewing.storyIdx - 1 });
    } else if (viewing.groupIdx > 0) {
      const prevGroup = storyGroups[viewing.groupIdx - 1];
      setViewing({ groupIdx: viewing.groupIdx - 1, storyIdx: prevGroup.stories.length - 1 });
    }
  }

  const currentGroup = viewing !== null ? storyGroups[viewing.groupIdx] : null;
  const currentStory = currentGroup ? currentGroup.stories[viewing!.storyIdx] : null;

  const hasViewedGroup = (group: StoryGroup) => {
    if (!currentUser) return false;
    return group.stories.every(s => s.viewers.includes(currentUser.id));
  };

  return (
    <>
      <div className="w-full overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-4 px-1 min-w-max">
          {/* Add story */}
          {currentUser && (
            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={onAddStory}>
              <div className="relative">
                <UserAvatar src={currentUser.avatar} name={currentUser.displayName} size="xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full btn-brand flex items-center justify-center border-2 dark:border-surface-900 border-white group-hover:scale-110 transition-transform">
                  <PlusIcon size={12} />
                </div>
              </div>
              <span className="text-xs text-center dark:text-gray-400 text-gray-600 w-16 truncate">Seu story</span>
            </div>
          )}

          {/* Story groups */}
          {storyGroups.map((group, i) => {
            const viewed = hasViewedGroup(group);
            return (
              <div
                key={group.user.id}
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => openGroup(i)}
              >
                <div className={cn(
                  'p-0.5 rounded-full',
                  viewed
                    ? 'bg-gray-400/30'
                    : 'bg-gradient-to-tr from-brand-orange via-brand-pink to-brand-purple'
                )}>
                  <div className="p-0.5 dark:bg-surface-900 bg-white rounded-full">
                    <UserAvatar src={group.user.avatar} name={group.user.displayName} size="lg" />
                  </div>
                </div>
                <span className="text-xs text-center dark:text-gray-400 text-gray-600 w-16 truncate">
                  {group.user.displayName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {viewing !== null && currentGroup && currentStory && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setViewing(null)}
        >
          <div
            className="relative w-full max-w-sm h-full max-h-[92vh] mx-auto overflow-hidden rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Media */}
            <div className="absolute inset-0">
              {currentStory.type === 'video' ? (
                <video
                  src={currentStory.media}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentStory.media}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
            </div>

            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
              {currentGroup.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-none"
                    style={{
                      width: i < viewing.storyIdx
                        ? '100%'
                        : i === viewing.storyIdx
                        ? `${progress}%`
                        : '0%',
                      transition: i === viewing.storyIdx ? 'width 0.1s linear' : 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-7 left-3 right-3 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserAvatar src={currentGroup.user.avatar} name={currentGroup.user.displayName} size="sm" />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-white text-sm font-semibold">{currentGroup.user.displayName}</p>
                    {currentGroup.user.isVerified && <VerifiedBadge size="xs" />}
                  </div>
                  <p className="text-white/60 text-xs">{formatDate(currentStory.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentUser?.id === currentGroup.user.id && (
                  <div className="flex items-center gap-1 text-white/80">
                    <EyeIcon size={14} />
                    <span className="text-xs">{currentStory.viewers.length}</span>
                  </div>
                )}
                <button onClick={() => setViewing(null)} className="text-white/80 hover:text-white">
                  <XIcon size={22} />
                </button>
              </div>
            </div>

            {/* Overlay text */}
            {currentStory.overlayText && (
              <div className="absolute bottom-20 left-0 right-0 text-center px-6 z-20">
                <span className="text-white text-xl font-bold bg-black/50 px-4 py-2 rounded-xl">
                  {currentStory.overlayText}
                </span>
              </div>
            )}

            {/* Tap zones for navigation */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-10 opacity-0"
              onClick={handlePrev}
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full z-10 opacity-0"
              onClick={handleNext}
            />

            {/* Visible nav arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white p-1"
            >
              <ChevronLeftIcon size={28} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white p-1"
            >
              <ChevronRightIcon size={28} />
            </button>

            {/* Group indicators */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-1.5">
              {storyGroups.map((g, i) => (
                <button
                  key={g.user.id}
                  onClick={() => setViewing({ groupIdx: i, storyIdx: 0 })}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === viewing.groupIdx ? 'bg-white w-5' : 'bg-white/40'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
