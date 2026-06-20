import React, { useState, useRef } from 'react';
import { XIcon, ImageIcon, VideoIcon, UploadIcon, TypeIcon, SmileIcon, MapPinIcon } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { uploadFile } from '@/lib/db';
import { extractHashtags } from '@/lib/utils';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateStoryModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (data: { media: string; type: 'image' | 'video'; overlayText?: string }) => void;
}

export function CreateStoryModal({ user, onClose, onSubmit }: CreateStoryModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [overlayText, setOverlayText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    // Preview
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const url = await uploadFile('stories', path, file);
    setUploading(false);

    if (!url) {
      toast.error('Erro ao fazer upload. Tente novamente.');
      return;
    }
    setUploadedUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedUrl) return;
    onSubmit({ media: uploadedUrl, type: mediaType, overlayText: overlayText || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="dark:bg-surface-800 bg-white rounded-3xl w-full max-w-md shadow-xl border dark:border-white/10 border-gray-100 animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b dark:border-white/10 border-gray-100">
          <h2 className="text-lg font-bold dark:text-white text-gray-900">Novo Story</h2>
          <button onClick={onClose} className="p-2 rounded-full dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-500">
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <UserAvatar src={user.avatar} name={user.displayName} size="md" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold dark:text-white text-gray-900 text-sm">{user.displayName}</span>
                {user.isVerified && <VerifiedBadge size="xs" />}
              </div>
              <span className="text-xs dark:text-gray-400 text-gray-500">Story expira em 24h</span>
            </div>
          </div>

          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              'relative rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-all',
              preview
                ? 'border-transparent'
                : 'dark:border-white/20 border-gray-300 hover:border-brand-pink dark:hover:border-brand-pink'
            )}
            style={{ aspectRatio: '9/16', maxHeight: '320px' }}
          >
            {preview ? (
              mediaType === 'video' ? (
                <video src={preview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 dark:text-gray-400 text-gray-500">
                <div className="w-16 h-16 rounded-2xl btn-brand flex items-center justify-center">
                  <UploadIcon size={28} />
                </div>
                <div className="text-center">
                  <p className="font-semibold dark:text-white text-gray-900">Adicionar mídia</p>
                  <p className="text-sm mt-1">Imagem ou vídeo (máx. 50MB)</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full dark:bg-white/10 bg-gray-100">
                    <ImageIcon size={12} /> Foto
                  </span>
                  <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full dark:bg-white/10 bg-gray-100">
                    <VideoIcon size={12} /> Vídeo
                  </span>
                </div>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Enviando...</p>
                </div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

          {/* Overlay text */}
          {preview && (
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                Texto (opcional)
              </label>
              <input
                value={overlayText}
                onChange={e => setOverlayText(e.target.value)}
                placeholder="Adicionar texto ao story..."
                maxLength={60}
                className="w-full px-4 py-3 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!uploadedUrl || uploading}
            className="btn-brand w-full py-3 rounded-xl font-semibold disabled:opacity-40"
          >
            {uploading ? 'Enviando...' : 'Publicar Story'}
          </button>
        </form>
      </div>
    </div>
  );
}
