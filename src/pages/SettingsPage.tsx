import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockIcon, BellIcon, EyeIcon, CreditCardIcon, LogOutIcon, CheckIcon, ChevronRightIcon, MoonIcon, SunIcon, TrashIcon, CameraIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { AvatarUpload } from '@/components/features/AvatarUpload';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { uploadBase64, uploadFile } from '@/lib/db';
import { toast } from 'sonner';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'profile', icon: UserIcon, label: 'Perfil', color: 'text-blue-500' },
  { id: 'account', icon: LockIcon, label: 'Conta e Segurança', color: 'text-green-500' },
  { id: 'notifications', icon: BellIcon, label: 'Notificações', color: 'text-brand-orange' },
  { id: 'privacy', icon: EyeIcon, label: 'Privacidade', color: 'text-brand-purple' },
  { id: 'appearance', icon: MoonIcon, label: 'Aparência', color: 'text-brand-pink' },
  { id: 'premium', icon: CreditCardIcon, label: 'Premium', color: 'text-yellow-500' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    website: user?.website || '',
    username: user?.username || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        website: user.website || '',
        username: user.username || '',
      });
    }
  }, [user]);

  if (!user) return null;

  async function handleAvatarUpload(base64: string) {
    if (!user) return;
    setIsSaving(true);
    const path = `${user.id}/avatar_${Date.now()}.jpg`;
    const url = await uploadBase64('avatars', path, base64);
    if (!url) { toast.error('Erro ao fazer upload'); setIsSaving(false); return; }
    await updateProfile({ avatar: url });
    setIsSaving(false);
    setShowAvatarUpload(false);
    toast.success('Foto de perfil atualizada!');
  }

  async function handleSaveProfile() {
    if (!user) return;
    setIsSaving(true);
    await updateProfile({
      displayName: form.displayName,
      bio: form.bio,
      website: form.website,
      username: form.username,
    });
    setIsSaving(false);
    toast.success('Perfil atualizado com sucesso!');
  }

  async function handleToggleNotification(key: keyof User['notifications']) {
    if (!user) return;
    const updated = { ...user.notifications, [key]: !user.notifications[key] };
    await updateProfile({ notifications: updated });
    toast.success('Configuração salva');
  }

  async function handleTogglePrivacy() {
    if (!user) return;
    await updateProfile({ isPrivate: !user.isPrivate });
    toast.success(!user.isPrivate ? 'Conta privada' : 'Conta pública');
  }

  async function handleLogout() {
    await logout();
    navigate('/');
    toast.success('Até logo!');
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-display font-black dark:text-white text-gray-900 mb-6">Configurações</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <div className="dark:bg-surface-800 bg-white rounded-2xl overflow-hidden border dark:border-white/5 border-gray-100">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm transition-all',
                      activeSection === section.id ? 'nav-active border-l-2 border-brand-pink dark:text-white text-gray-900 font-semibold' : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/5 hover:bg-gray-50')}>
                    <Icon size={18} className={section.color} />
                    {section.label}
                  </button>
                );
              })}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/5 transition-all border-t dark:border-white/5 border-gray-100">
                <LogOutIcon size={18} />Sair
              </button>
            </div>
          </div>

          {/* Mobile section tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar md:hidden mb-4 w-full">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn('flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all',
                  activeSection === s.id ? 'btn-brand' : 'dark:bg-surface-800 bg-white dark:text-gray-400 text-gray-600 border dark:border-white/10 border-gray-200')}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeSection === 'profile' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 animate-fade-in">
                <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-6">Informações do Perfil</h2>
                <div className="flex flex-col items-center gap-4 mb-6">
                  {showAvatarUpload ? (
                    <AvatarUpload currentSrc={user.avatar} name={user.displayName} size="2xl" onUpload={handleAvatarUpload} />
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <UserAvatar src={user.avatar} name={user.displayName} size="2xl" />
                        <button onClick={() => setShowAvatarUpload(true)}
                          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <CameraIcon size={24} className="text-white" />
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-bold dark:text-white text-gray-900">{user.displayName}</span>
                          {user.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-sm dark:text-gray-400 text-gray-600">@{user.username}</span>
                        <button onClick={() => setShowAvatarUpload(true)} className="mt-2 flex items-center gap-1.5 text-xs text-brand-pink hover:underline font-medium">
                          <CameraIcon size={12} /> Alterar foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'displayName', label: 'Nome de exibição', placeholder: 'Seu nome' },
                    { key: 'username', label: 'Nome de usuário', placeholder: '@usuario', prefix: '@' },
                    { key: 'website', label: 'Website', placeholder: 'seusite.com' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">{field.label}</label>
                      <div className="relative">
                        {field.prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 text-sm">{field.prefix}</span>}
                        <input
                          value={form[field.key as keyof typeof form]}
                          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className={`w-full ${field.prefix ? 'pl-8' : 'px-4'} py-3 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 transition-all text-sm`}
                        />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">Biografia</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      placeholder="Fale um pouco sobre você..."
                      rows={3} maxLength={150}
                      className="w-full px-4 py-3 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 resize-none transition-all text-sm"
                    />
                    <p className="text-xs dark:text-gray-500 text-gray-400 mt-1 text-right">{form.bio.length}/150</p>
                  </div>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="btn-brand px-8 py-3 rounded-xl font-semibold w-full">
                    {isSaving ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 animate-fade-in">
                <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-6">Notificações</h2>
                <div className="space-y-1">
                  {Object.entries(user.notifications).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      likes: 'Curtidas', comments: 'Comentários', follows: 'Novos seguidores',
                      mentions: 'Menções', messages: 'Mensagens', stories: 'Stories',
                      live: 'Lives', email: 'E-mail', push: 'Push notifications',
                    };
                    return (
                      <div key={key} className="flex items-center justify-between py-3 border-b dark:border-white/5 border-gray-100 last:border-0">
                        <span className="text-sm dark:text-gray-300 text-gray-700">{labels[key] || key}</span>
                        <div
                          onClick={() => handleToggleNotification(key as keyof User['notifications'])}
                          className={cn('w-12 h-6 rounded-full cursor-pointer transition-all relative', value ? 'bg-brand-pink' : 'dark:bg-white/10 bg-gray-200')}
                        >
                          <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', value ? 'right-1' : 'left-1')} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 animate-fade-in">
                <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-6">Privacidade</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b dark:border-white/5 border-gray-100">
                    <div>
                      <p className="text-sm font-medium dark:text-gray-200 text-gray-800">Conta privada</p>
                      <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Apenas seguidores aprovados verão seu conteúdo</p>
                    </div>
                    <div onClick={handleTogglePrivacy} className={cn('w-12 h-6 rounded-full cursor-pointer transition-all relative', user.isPrivate ? 'bg-brand-pink' : 'dark:bg-white/10 bg-gray-200')}>
                      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', user.isPrivate ? 'right-1' : 'left-1')} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 animate-fade-in">
                <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-6">Aparência</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'dark', label: 'Escuro', preview: '#0A0B14' },
                    { id: 'light', label: 'Claro', preview: '#FFFFFF' },
                  ].map(t => (
                    <button key={t.id} onClick={toggleTheme}
                      className={cn('relative p-4 rounded-2xl border-2 transition-all', theme === t.id ? 'border-brand-pink shadow-brand' : 'dark:border-white/10 border-gray-200')}
                      style={{ background: t.preview }}>
                      <div className={cn('w-6 h-6 rounded-full mb-2', t.id === 'dark' ? 'bg-white/10' : 'bg-black/10')} />
                      <div className={cn('h-2 rounded w-16 mb-1', t.id === 'dark' ? 'bg-white/20' : 'bg-black/20')} />
                      <div className={cn('h-2 rounded w-10', t.id === 'dark' ? 'bg-white/10' : 'bg-black/10')} />
                      <p className={cn('text-sm font-medium mt-3', t.id === 'dark' ? 'text-white' : 'text-gray-900')}>{t.label}</p>
                      {theme === t.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full btn-brand flex items-center justify-center">
                          <CheckIcon size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'premium' && (
              <div className="space-y-4 animate-fade-in">
                {[
                  { name: 'Basic', price: 'R$9,90/mês', features: ['Badge exclusivo', 'Análise básica', 'Temas customizados'], color: '#6B7280' },
                  { name: 'Pro', price: 'R$29,90/mês', features: ['Tudo do Basic', 'Analytics avançado', 'Upload ilimitado', 'Suporte prioritário'], color: '#E91E8C', popular: true },
                  { name: 'Creator', price: 'R$79,90/mês', features: ['Tudo do Pro', 'Monetização', 'Live streaming', 'Verificação prioritária'], color: '#FF6B00' },
                ].map(plan => (
                  <div key={plan.name} className={cn('dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 relative', plan.popular && 'border-brand-pink')}>
                    {plan.popular && (
                      <span className="absolute top-4 right-4 text-xs font-bold text-white px-2 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #E91E8C, #7B2FBE)' }}>Popular</span>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ background: plan.color }}>{plan.name[0]}</div>
                      <div>
                        <h3 className="font-bold dark:text-white text-gray-900">{plan.name}</h3>
                        <p className="text-brand-gradient font-bold text-lg">{plan.price}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700">
                          <CheckIcon size={14} className="text-green-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button className={cn('w-full py-3 rounded-xl font-semibold text-sm transition-all', plan.popular ? 'btn-brand shadow-brand' : 'dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 hover:opacity-80')}>
                      {user.isPremium ? 'Plano atual' : 'Assinar'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'account' && (
              <div className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100 animate-fade-in space-y-4">
                <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-2">Conta e Segurança</h2>
                <div>
                  <p className="text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">E-mail</p>
                  <p className="dark:bg-surface-700 bg-gray-50 px-4 py-3 rounded-xl dark:text-gray-400 text-gray-600 text-sm">{user.email}</p>
                </div>
                {['Alterar senha', 'Autenticação em dois fatores (2FA)', 'Sessões ativas', 'Download dos seus dados'].map(item => (
                  <button key={item} className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl dark:bg-surface-700/50 bg-gray-50 dark:hover:bg-surface-700 hover:bg-gray-100 transition-all">
                    <span className="text-sm font-medium dark:text-gray-300 text-gray-700">{item}</span>
                    <ChevronRightIcon size={16} className="dark:text-gray-500 text-gray-400" />
                  </button>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
                  <span className="text-sm font-medium">Sair da conta</span>
                  <LogOutIcon size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
