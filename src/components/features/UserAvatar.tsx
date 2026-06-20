import React from 'react';
import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const ringMap = {
  xs: 'p-[1.5px]',
  sm: 'p-[2px]',
  md: 'p-[2px]',
  lg: 'p-[2.5px]',
  xl: 'p-[3px]',
  '2xl': 'p-[3px]',
};

export function UserAvatar({ src, name, size = 'md', hasStory, className, onClick }: UserAvatarProps) {
  const initials = getInitials(name);

  if (hasStory) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'story-ring flex-shrink-0 rounded-full cursor-pointer',
          ringMap[size],
          className
        )}
      >
        <div className="story-ring-inner rounded-full">
          <div className={cn('rounded-full overflow-hidden bg-gradient-to-br from-brand-orange to-brand-purple', sizeMap[size])}>
            {src ? (
              <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange to-brand-pink text-white font-bold">
                {initials}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0',
        sizeMap[size],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange to-brand-pink text-white font-bold">
          {initials}
        </div>
      )}
    </div>
  );
}
