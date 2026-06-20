import React, { useState } from 'react';
import { HeartIcon, MessageCircleIcon, Share2Icon, BookmarkIcon, MoreHorizontalIcon, ChevronLeftIcon, ChevronRightIcon, SendIcon } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { getUserById } from '@/lib/storage';
import type { Post } from '@/types';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onSave: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onLike, onComment, onSave, onDelete }: PostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const author = getUserById(post.userId);
  if (!author) return null;

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isSaved = currentUserId ? post.saves.includes(currentUserId) : false;

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  }

  function renderMedia() {
    if (post.media.length === 0) return null;
    if (post.media.length === 1) {
      return (
        <div className="relative cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>          
          <img
            src={post.media[0]}
            alt="Post"
            className="w-full object-cover max-h-[600px] bg-black hover:opacity-95 transition-opacity"
            style={{ aspectRatio: '1/1' }}
          />
        </div>
      );
    }
    // Carousel
    return (
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${mediaIndex * 100}%)` }}
        >
          {post.media.map((url, i) => (
            <img key={i} src={url} alt={`Slide ${i+1}`} className="w-full flex-shrink-0 object-cover" style={{ aspectRatio: '1/1' }} />
          ))}
        </div>
        {mediaIndex > 0 && (
          <button
            onClick={() => setMediaIndex(mediaIndex - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <ChevronLeftIcon size={16} />
          </button>
        )}
        {mediaIndex < post.media.length - 1 && (
          <button
            onClick={() => setMediaIndex(mediaIndex + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <ChevronRightIcon size={16} />
          </button>
        )}
        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
          {post.media.map((_, i) => (
            <div key={i} className={cn('w-1.5 h-1.5 rounded-full transition-all', i === mediaIndex ? 'bg-white w-4' : 'bg-white/50')} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="post-card dark:bg-surface-800 bg-white rounded-2xl overflow-hidden border dark:border-white/5 border-gray-100 shadow-sm dark:shadow-glass">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/perfil/${author.username}`)}>
          <UserAvatar src={author.avatar} name={author.displayName} size="md" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm dark:text-white text-gray-900">{author.displayName}</span>
              {author.isVerified && <VerifiedBadge size="xs" />}
            </div>
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {author.username} · {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full dark:hover:bg-white/10 hover:bg-gray-100 transition-colors dark:text-gray-400 text-gray-500"
          >
            <MoreHorizontalIcon size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 z-20 w-40 dark:bg-surface-700 bg-white rounded-xl shadow-lg border dark:border-white/10 border-gray-100 overflow-hidden animate-scale-in">
              <button
                onClick={() => { navigate(`/perfil/${author.username}`); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-white/5 hover:bg-gray-50"
              >
                Ver perfil
              </button>
              {currentUserId === post.userId && (
                <button
                  onClick={() => { onDelete?.(post.id); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 dark:hover:bg-white/5 hover:bg-gray-50"
                >
                  Excluir post
                </button>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-white/5 hover:bg-gray-50"
              >
                Denunciar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Content */}
      {post.content && (
        <div className="px-4 pt-3">
          <p className="dark:text-gray-200 text-gray-800 text-sm leading-relaxed">
            {post.content.split(/(#\w+|@\w+)/g).map((part, i) => {
              if (part.startsWith('#') || part.startsWith('@')) {
                return <span key={i} className="text-brand-pink font-medium">{part}</span>;
              }
              return part;
            })}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className="flex items-center gap-1.5 group transition-all duration-200"
            >
              <HeartIcon
                size={24}
                className={cn(
                  'transition-all duration-200 group-hover:scale-110',
                  isLiked ? 'fill-red-500 text-red-500' : 'dark:text-gray-400 text-gray-600 hover:text-red-400'
                )}
              />
              <span className={cn('text-sm font-medium', isLiked ? 'text-red-500' : 'dark:text-gray-400 text-gray-600')}>
                {formatNumber(post.likes.length)}
              </span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 dark:text-gray-400 text-gray-600 hover:text-brand-pink transition-colors"
            >
              <MessageCircleIcon size={22} />
              <span className="text-sm font-medium">{formatNumber(post.comments.length)}</span>
            </button>
            <button className="flex items-center gap-1.5 dark:text-gray-400 text-gray-600 hover:text-brand-purple transition-colors">
              <Share2Icon size={22} />
              <span className="text-sm font-medium">{formatNumber(post.shares)}</span>
            </button>
          </div>
          <button
            onClick={() => onSave(post.id)}
            className={cn('transition-all duration-200 hover:scale-110', isSaved ? 'text-brand-orange' : 'dark:text-gray-400 text-gray-600')}
          >
            <BookmarkIcon size={22} className={isSaved ? 'fill-brand-orange' : ''} />
          </button>
        </div>

        {/* View count */}
        <div className="text-xs dark:text-gray-500 text-gray-400 mb-2">{formatNumber(post.viewCount)} visualizações</div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-2 space-y-2 animate-slide-down">
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {post.comments.slice(-5).map(comment => {
                const commenter = getUserById(comment.userId);
                if (!commenter) return null;
                return (
                  <div key={comment.id} className="flex gap-2">
                    <UserAvatar src={commenter.avatar} name={commenter.displayName} size="xs" />
                    <div className="dark:bg-white/5 bg-gray-50 rounded-xl px-3 py-1.5 flex-1">
                      <span className="text-xs font-semibold dark:text-white text-gray-900">{commenter.username} </span>
                      <span className="text-xs dark:text-gray-300 text-gray-700">{comment.content}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {currentUserId && (
              <form onSubmit={handleComment} className="flex gap-2 mt-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="flex-1 text-sm dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 rounded-full px-4 py-2 dark:border-white/10 border border-gray-200 focus:outline-none focus:border-brand-pink/50 dark:placeholder-gray-500 placeholder-gray-400"
                />
                <button type="submit" className="btn-brand p-2 rounded-full" disabled={!commentText.trim()}>
                  <SendIcon size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
