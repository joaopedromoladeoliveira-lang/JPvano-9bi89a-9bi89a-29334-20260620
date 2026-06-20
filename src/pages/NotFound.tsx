import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, SearchIcon, ArrowLeftIcon } from 'lucide-react';
import { APP_LOGO, APP_NAME } from '@/constants';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen dark:bg-surface-950 bg-surface-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <div className="text-9xl font-display font-black text-brand-gradient opacity-20 select-none">404</div>
        <img src={APP_LOGO} alt={APP_NAME} className="w-24 h-24 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-brand-lg animate-float" />
      </div>
      <h1 className="text-3xl font-display font-black dark:text-white text-gray-900 mb-3">Página não encontrada</h1>
      <p className="dark:text-gray-400 text-gray-600 mb-8 max-w-sm">
        Parece que essa página não existe ou foi removida. Não se preocupe, te levamos de volta!
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-gray-300 text-gray-700 font-medium hover:opacity-80 transition-all"
        >
          <ArrowLeftIcon size={18} /> Voltar
        </button>
        <button
          onClick={() => navigate('/feed')}
          className="btn-brand flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-brand"
        >
          <HomeIcon size={18} /> Início
        </button>
      </div>
    </div>
  );
}
