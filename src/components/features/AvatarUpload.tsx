import React, { useRef, useState } from 'react';
import { CameraIcon, UploadIcon, XIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { UserAvatar } from '@/components/features/UserAvatar';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentSrc?: string;
  name: string;
  onUpload: (base64: string) => Promise<void> | void;
  size?: 'lg' | 'xl' | '2xl';
  label?: string;
}

export function AvatarUpload({ currentSrc, name, onUpload, size = 'xl', label = 'Foto de perfil' }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClass = {
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  }[size];

  const wrapperSize = {
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24',
  }[size];

  function processFile(file: File) {
    setError(null);
    setIsDone(false);

    if (!file.type.startsWith('image/')) {
      setError('Arquivo inválido. Use JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleConfirm() {
    if (!preview) return;
    setIsUploading(true);
    await onUpload(preview);
    setIsUploading(false);
    setIsDone(true);
    setTimeout(() => {
      setPreview(null);
      setIsDone(false);
    }, 1500);
  }

  function handleCancel() {
    setPreview(null);
    setError(null);
    setIsDone(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">{label}</p>

      {/* Avatar preview */}
      <div
        className={cn(
          'relative rounded-full flex-shrink-0 transition-all duration-300 group',
          wrapperSize,
          isDragging && 'ring-4 ring-brand-pink ring-offset-2 dark:ring-offset-surface-800 ring-offset-white scale-105'
        )}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Current or preview avatar */}
        <div className={cn('rounded-full overflow-hidden w-full h-full', isDragging && 'opacity-50')}>
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : currentSrc ? (
            <img src={currentSrc} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange to-brand-pink text-white font-bold text-xl">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Hover overlay */}
        {!preview && (
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            title="Alterar foto"
          >
            <CameraIcon size={size === '2xl' ? 28 : 22} className="text-white" />
          </button>
        )}

        {/* Done check */}
        {isDone && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.8), rgba(233,30,140,0.8))' }}>
            <CheckIcon size={28} className="text-white" />
          </div>
        )}
      </div>

      {/* Action buttons (when preview is set) */}
      {preview && !isDone && (
        <div className="flex items-center gap-2 animate-fade-in">
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm font-medium hover:opacity-80 transition-all disabled:opacity-40"
          >
            <XIcon size={14} />
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl btn-brand text-sm font-semibold disabled:opacity-60"
          >
            {isUploading ? (
              <><Loader2Icon size={14} className="animate-spin" /> Salvando...</>
            ) : (
              <><CheckIcon size={14} /> Usar esta foto</>
            )}
          </button>
        </div>
      )}

      {/* Upload button (when no preview) */}
      {!preview && !isDone && (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm font-medium dark:hover:bg-white/10 hover:bg-gray-200 transition-all border dark:border-white/10 border-gray-200"
        >
          <UploadIcon size={14} />
          Alterar foto
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center max-w-[200px]">{error}</p>
      )}

      <p className="text-xs dark:text-gray-600 text-gray-400 text-center">
        JPG, PNG ou WEBP · Máx. 5MB
        <br />
        <span className="text-[11px]">Arraste a imagem ou clique para selecionar</span>
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
