import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, StarIcon, ZapIcon, ShieldIcon, HeartIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
import { APP_LOGO, APP_NAME, APP_TAGLINE } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const features = [
  { icon: HeartIcon, title: 'Feed Inteligente', desc: 'Algoritmo de IA que entende seu gosto e entrega o conteúdo certo' },
  { icon: ZapIcon, title: 'Stories & Reels', desc: 'Compartilhe momentos que desaparecem em 24h ou crie reels incríveis' },
  { icon: UsersIcon, title: 'Mensagens Privadas', desc: 'Conversas seguras com criptografia e chamadas de vídeo integradas' },
  { icon: ShieldIcon, title: 'Conta Verificada', desc: 'Sistema de verificação real com análise de documentos oficiais' },
  { icon: TrendingUpIcon, title: 'Analytics Avançado', desc: 'Dashboards detalhados para criadores acompanharem seu crescimento' },
  { icon: StarIcon, title: 'Monetização', desc: 'Assinaturas, doações, produtos digitais e muito mais' },
];

const stats = [
  { value: '500K+', label: 'Usuários ativos' },
  { value: '2M+', label: 'Publicações diárias' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'R$0', label: 'Para começar' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) navigate('/feed');
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen dark:bg-surface-950 bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 dark:bg-surface-950/90 bg-white/90 backdrop-blur-brand border-b dark:border-white/5 border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_NAME} className="w-9 h-9 rounded-xl" />
            <span className="text-brand-gradient font-display font-bold text-xl">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-100 transition-all">
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-xl text-sm font-medium dark:text-gray-300 text-gray-700 dark:hover:bg-white/5 hover:bg-gray-100 transition-all">
              Entrar
            </button>
            <button onClick={() => navigate('/cadastro')} className="btn-brand px-4 py-2 rounded-xl text-sm font-semibold">
              Criar conta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 blur-3xl rounded-full"
          style={{ background: 'radial-gradient(circle, #E91E8C 0%, #7B2FBE 50%, transparent 80%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 dark:bg-white/5 bg-gray-100 rounded-full px-4 py-1.5 mb-6 animate-slide-down">
            <span className="text-xs font-semibold text-brand-gradient">🚀 Novo</span>
            <span className="text-xs dark:text-gray-400 text-gray-600">Reels com IA agora disponível</span>
          </div>

          <img src={APP_LOGO} alt={APP_NAME} className="w-24 h-24 mx-auto mb-6 rounded-3xl shadow-brand-lg animate-float" />

          <h1 className="text-5xl md:text-7xl font-display font-black mb-4 dark:text-white text-gray-900 animate-slide-up">
            Bem-vindo ao <br />
            <span className="text-brand-gradient">{APP_NAME}</span>
          </h1>

          <p className="text-xl md:text-2xl dark:text-gray-400 text-gray-600 mb-4 font-light animate-fade-in">
            {APP_TAGLINE}
          </p>

          <p className="text-base dark:text-gray-500 text-gray-500 max-w-2xl mx-auto mb-10 animate-fade-in">
            A plataforma de mídia social premium do Brasil. Compartilhe seus momentos, conecte-se com pessoas incríveis e evolua junto com a maior comunidade criativa do país.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <button
              onClick={() => navigate('/cadastro')}
              className="btn-brand px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-brand-lg"
            >
              Começar agora, é grátis
              <ArrowRightIcon size={20} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-2xl text-lg font-medium dark:bg-white/5 bg-gray-100 dark:text-white text-gray-900 dark:hover:bg-white/10 hover:bg-gray-200 transition-all border dark:border-white/10 border-gray-200"
            >
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center dark:bg-surface-800 bg-gray-50 rounded-2xl p-6 border dark:border-white/5 border-gray-100">
              <div className="text-3xl md:text-4xl font-display font-black text-brand-gradient mb-1">{stat.value}</div>
              <div className="text-sm dark:text-gray-400 text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-black text-center dark:text-white text-gray-900 mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-center dark:text-gray-400 text-gray-600 mb-12 max-w-2xl mx-auto">
            Uma plataforma completa para criadores, influenciadores, empresas e pessoas comuns que querem se conectar de verdade.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 hover:border-brand-pink/30 transition-all hover:-translate-y-1 shadow-sm">
                  <div className="btn-brand w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-brand">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Preview section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border dark:border-white/10 border-gray-200 shadow-2xl">
            <div className="absolute inset-0 bg-brand-gradient opacity-5" />
            <div className="grid grid-cols-3 gap-1 p-2 dark:bg-surface-900 bg-gray-50">
              {[
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=400&fit=crop',
              ].map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="dark:bg-surface-800 bg-gray-50 rounded-3xl p-12 border dark:border-white/10 border-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-brand-gradient" />
            <h2 className="text-3xl md:text-4xl font-display font-black dark:text-white text-gray-900 mb-4">
              Pronto para começar?
            </h2>
            <p className="dark:text-gray-400 text-gray-600 mb-8">
              Junte-se a milhares de criadores brasileiros que já estão no JPvano.
            </p>
            <button
              onClick={() => navigate('/cadastro')}
              className="btn-brand px-10 py-4 rounded-2xl text-lg font-bold shadow-brand-lg"
            >
              Criar conta grátis →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t dark:border-white/5 border-gray-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src={APP_LOGO} alt={APP_NAME} className="w-6 h-6 rounded-lg" />
          <span className="text-brand-gradient font-display font-bold">{APP_NAME}</span>
        </div>
        <p className="text-sm dark:text-gray-600 text-gray-400">{APP_TAGLINE}</p>
        <p className="text-xs dark:text-gray-700 text-gray-400 mt-2">© 2026 JPvano. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
