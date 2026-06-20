import React, { useState, useRef } from 'react';
import {
  XIcon, ImageIcon, VideoIcon, MapPinIcon, FilmIcon,
  TypeIcon, UploadIcon, HashIcon,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { extractHashtags, extractMentions } from '@/lib/utils';
import { uploadFile } from '@/lib/db';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PostType = 'text' | 'image' | 'carousel' | 'video' | 'reel';

interface CreatePostModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (data: {
    type: PostType;
    content: string;
    media: string[];
    location?: string;
  }) => void;
  /** Pre-select reel type */
  defaultType?: PostType;
}

const POST_TYPES = [
  { id: 'text' as PostType, icon: TypeIcon, label: 'Texto', color: 'text-blue-400' },
  { id: 'image' as PostType, icon: ImageIcon, label: 'Foto', color: 'text-green-400' },
  { id: 'video' as PostType, icon: VideoIcon, label: 'Vídeo', color: 'text-purple-400' },
  { id: 'reel' as PostType, icon: FilmIcon, label: 'Reel', color: 'text-brand-pink' },
];

export function CreatePostModal({ user, onClose, onSubmit, defaultType }: CreatePostModalProps) {
  const [activeType, setActiveType] = useState<PostType>(defaultType || 'text');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<{
    preview: string;
    url: string | null;
    uploading: boolean;
    mimeType: string;
  }[]>([]);
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptedFiles = activeType === 'reel' || activeType === 'video'
    ? 'video/*'
    : activeType === 'text'
    ? 'image/*,video/*'
    : 'image/*,video/*';

  const isMediaType = activeType !== 'text';

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Auto-detect type from first file
    const first = files[0];
    if (first.type.startsWith('video/') && activeType !== 'reel') {
      setActiveType('video');
    } else if (first.type.startsWith('image/') && activeType === 'text') {
      setActiveType(files.length > 1 ? 'carousel' : 'image');
    }

    const startIdx = mediaFiles.length;
    const newItems = files.map(f => ({
      preview: URL.createObjectURL(f),
      url: null,
      uploading: true,
      mimeType: f.type,
    }));
    setMediaFiles(prev => [...prev, ...newItems]);

    await Promise.all(files.map(async (file, i) => {
      const bucket = activeType === 'reel' || file.type.startsWith('video/') ? 'posts' : 'posts';
      const path = `${user.id}/${Date.now()}_${i}_${file.name.replace(/\s/g, '_')}`;
      const url = await uploadFile(bucket, path, file);
      setMediaFiles(prev => {
        const updated = [...prev];
        const idx = startIdx + i;
        if (updated[idx]) updated[idx] = { ...updated[idx], url, uploading: false };
        return updated;
      });
    }));
  }

  function removeMedia(index: number) {
    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0 && activeType !== 'text') setActiveType('text');
      if (updated.length === 1 && activeType === 'carousel') setActiveType('image');
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Adicione um texto ou mídia');
      return;
    }

    const pendingUploads = mediaFiles.filter(m => m.uploading);
    if (pendingUploads.length > 0) {
      toast.error('Aguarde o upload concluir');
      return;
    }

    setIsSubmitting(true);
    const mediaUrls = mediaFiles.map(m => m.url!).filter(Boolean);

    // Determine final type
    let finalType: PostType = activeType;
    if (mediaUrls.length > 1 && activeType === 'image') finalType = 'carousel';

    onSubmit({
      type: finalType,
      content,
      media: mediaUrls,
      location: location.trim() || undefined,
    });
    setIsSubmitting(false);
    onClose();
  }

  const hashtags = extractHashtags(content);
  const mentions = extractMentions(content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="dark:bg-surface-800 bg-white rounded-3xl w-full max-w-lg shadow-2xl border dark:border-white/10 border-gray-100 animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-white/10 border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-display font-black dark:text-white text-gray-900">
            {activeType === 'reel' ? '🎬 Novo Reel' : activeType === 'video' ? '🎥 Novo Vídeo' : '✨ Nova Publicação'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-500 transition-all"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-3">
              <UserAvatar src={user.avatar} name={user.displayName} size="md" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold dark:text-white text-gray-900 text-sm">{user.displayName}</span>
                  {user.isVerified && <VerifiedBadge size="xs" />}
                </div>
                <span className="text-xs dark:text-gray-400 text-gray-500">@{user.username}</span>
              </div>
            </div>

            {/* Type selector */}
            <div className="flex gap-2">
              {POST_TYPES.map(pt => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setActiveType(pt.id);
                      if (pt.id === 'text') setMediaFiles([]);
                    }}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all border',
                      activeType === pt.id
                        ? 'border-brand-pink/50 dark:bg-brand-pink/10 bg-brand-pink/5'
                        : 'dark:border-white/5 border-gray-100 dark:hover:bg-white/5 hover:bg-gray-50 dark:border-white/5 border-gray-200'
                    )}
                  >
                    <Icon size={16} className={activeType === pt.id ? 'text-brand-pink' : pt.color} />
                    <span className={activeType === pt.id ? 'text-brand-pink' : 'dark:text-gray-400 text-gray-600'}>
                      {pt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Text area */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                activeType === 'reel'
                  ? 'Descrição do reel... use # para hashtags'
                  : activeType === 'video'
                  ? 'Descrição do vídeo... use # para hashtags'
                  : 'O que você está pensando? Use # para hashtags e @ para mencionar...'
              }
              className="w-full dark:bg-transparent bg-transparent dark:text-white text-gray-900 text-base resize-none border-none outline-none dark:placeholder-gray-500 placeholder-gray-400 min-h-[90px]"
              maxLength={2200}
            />

            {/* Hashtag/mention preview */}
            {(hashtags.length > 0 || mentions.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map(h => (
                  <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink font-medium">
                    {h}
                  </span>
                ))}
                {mentions.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                    @{m}
                  </span>
                ))}
              </div>
            )}

            {/* Media upload area */}
            {activeType !== 'text' && (
              <div>
                {mediaFiles.length === 0 ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      'rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-8',
                      'dark:border-white/20 border-gray-300 hover:border-brand-pink dark:hover:border-brand-pink',
                      activeType === 'reel' ? 'bg-gradient-to-br from-brand-pink/5 to-brand-purple/5' : ''
                    )}
                  >
                    <div className="w-14 h-14 rounded-2xl btn-brand flex items-center justify-center shadow-brand">
                      {activeType === 'reel' ? <FilmIcon size={24} /> : <UploadIcon size={24} />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold dark:text-white text-gray-900">
                        {activeType === 'reel' ? 'Enviar vídeo para o reel' : 'Adicionar mídia'}
                      </p>
                      <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">
                        {activeType === 'reel' || activeType === 'video'
                          ? 'MP4, WebM — máx. 50MB'
                          : 'JPG, PNG, WebP, MP4 — máx. 50MB'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Preview grid */}
                    <div className={cn('grid gap-2', mediaFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-3')}>
                      {mediaFiles.map((item, i) => (
                        <div
                          key={i}
                          className={cn(
                            'relative rounded-xl overflow-hidden bg-black',
                            mediaFiles.length === 1 ? 'aspect-video' : 'aspect-square'
                          )}
                        >
                          {item.mimeType.startsWith('video/') ? (
                            <video src={item.preview} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <img src={item.preview} alt="" className="w-full h-full object-cover" />
                          )}
                          {item.uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
                          >
                            <XIcon size={12} color="white" />
                          </button>
                          {item.mimeType.startsWith('video/') && (
                            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white">
                              <VideoIcon size={10} />
                              <span className="text-[10px] font-medium">Vídeo</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Add more button */}
                      {activeType !== 'reel' && activeType !== 'video' && mediaFiles.length < 10 && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed dark:border-white/20 border-gray-300 flex flex-col items-center justify-center gap-1 dark:text-gray-500 text-gray-400 hover:border-brand-pink hover:text-brand-pink transition-colors"
                        >
                          <ImageIcon size={16} />
                          <span className="text-[10px]">Adicionar</span>
                        </button>
                      )}
                    </div>
                    {/* Upload count info */}
                    <p className="text-xs dark:text-gray-500 text-gray-400 text-center">
                      {mediaFiles.filter(m => m.uploading).length > 0
                        ? `Enviando ${mediaFiles.filter(m => m.uploading).length} arquivo(s)...`
                        : `${mediaFiles.length} arquivo(s) pronto(s)`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={acceptedFiles}
              multiple={activeType !== 'reel' && activeType !== 'video'}
              className="hidden"
              onChange={handleFiles}
            />

            {/* Location */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-200">
              <MapPinIcon size={16} className="dark:text-gray-500 text-gray-400 flex-shrink-0" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Adicionar localização (opcional)"
                className="flex-1 text-sm dark:bg-transparent bg-transparent dark:text-gray-300 text-gray-700 outline-none dark:placeholder-gray-500 placeholder-gray-400"
              />
            </div>

            {/* Char count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs dark:text-gray-500 text-gray-400">
                {hashtags.length > 0 && (
                  <><HashIcon size={10} /><span>{hashtags.length} hashtag(s)</span></>
                )}
              </div>
              <span className="text-xs dark:text-gray-500 text-gray-400">{content.length}/2200</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t dark:border-white/10 border-gray-100 flex-shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 dark:text-gray-400 text-gray-600 hover:text-brand-pink dark:hover:bg-white/10 transition-all text-sm font-medium border dark:border-white/5 border-gray-200"
          >
            <ImageIcon size={16} />
            Mídia
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              (!content.trim() && mediaFiles.length === 0) ||
              isSubmitting ||
              mediaFiles.some(m => m.uploading)
            }
            className="btn-brand flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-brand"
          >
            {isSubmitting
              ? 'Publicando...'
              : activeType === 'reel'
              ? '🎬 Publicar Reel'
              : activeType === 'video'
              ? '🎥 Publicar Vídeo'
              : '✨ Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
