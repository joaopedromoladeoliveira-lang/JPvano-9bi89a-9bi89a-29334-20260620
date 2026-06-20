import React from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const iconSizes = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
};

export function VerifiedBadge({ size = 'sm', className }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'verified-badge flex-shrink-0 inline-flex items-center justify-center',
        sizes[size],
        className
      )}
      title="Conta verificada"
    >
      <CheckIcon size={iconSizes[size]} color="white" strokeWidth={3} />
    </span>
  );
}
