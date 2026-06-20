import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldIcon, UsersIcon, BadgeCheckIcon, AlertTriangleIcon, DollarSignIcon,
  BarChart2Icon, CheckIcon, XIcon, EyeIcon,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { mapSupabaseUser } from '@/lib/auth';
import type { User, Post, VerificationRequest } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const adminTabs = [
  { id: 'overview', icon: BarChart2Icon, label: 'Visão Geral' },
  { id: 'users', icon: UsersIcon, label: 'Usuários' },
  { id: 'verifications', icon: BadgeCheckIcon, label: 'Verificações' },
  { id: 'reports', icon: AlertTriangleIcon, label: 'Denúncias' },
  { id: 'revenue', icon: DollarSignIcon, label: 'Receita' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) navigate('/feed');
  }, [user, isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoadingData(true);
    const [profilesRes, postsRes, verificationsRes] = await Promise.all([
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('verification_requests').select('*').order('created_at', { ascending: false }),
    ]);

    if (profilesRes.data) {
      const mappedUsers = profilesRes.data.map(p => mapSupabaseUser({ id: p.id, email: p.email, created_at: '' }, p));
      setUsers(mappedUsers);
    }

    if (postsRes.data) {
      const mappedPosts: Post[] = postsRes.data.map(p => ({
        id: p.id,
        userId: p.user_id,
        type: p.type,
        content: p.content || '',
        media: p.media || [],
        hashtags: p.hashtags || [],
        mentions: p.mentions || [],
        location: p.location || '',
        likes: [],
        comments: [],
        saves: [],
        shares: p.shares_count || 0,
        viewCount: p.view_count || 0,
        isHidden: p.is_hidden || false,
        commentsDisabled: p.comments_disabled || false,
        isReported: p.is_reported || false,
        reports: [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
      setPosts(mappedPosts);
    }

    if (verificationsRes.data) {
      const mappedVerif: VerificationRequest[] = verificationsRes.data.map(v => ({
        id: v.id,
        userId: v.user_id,
        status: v.status,
        documentType: v.document_type,
        documentImages: v.document_images || [],
        selfieImage: v.selfie_image || '',
        reason: v.reason,
        adminNotes: v.admin_notes || '',
        reviewedBy: v.reviewed_by || '',
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }));
      setVerifications(mappedVerif);
    }

    setLoadingData(false);
  }

  async function handleBanUser(userId: string, ban: boolean) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_banned: ban })
      .eq('id', userId);
    if (error) { toast.error('Erro ao atualizar usuário'); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: ban } : u));
    toast.success(ban ? 'Usuário banido' : 'Usuário reativado');
  }

  async function handleVerifyUser(userId: string, verify: boolean) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_verified: verify, verification_status: verify ? 'approved' : 'none' })
      .eq('id', userId);
    if (error) { toast.error('Erro ao verificar usuário'); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: verify, verificationStatus: verify ? 'approved' : 'none' } : u));
    toast.success(verify ? 'Usuário verificado! ✓' : 'Verificação removida');
  }

  async function handleApproveVerification(id: string, approve: boolean) {
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: approve ? 'approved' : 'rejected', reviewed_by: user!.id, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast.error('Erro ao processar verificação'); return; }
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: approve ? 'approved' : 'rejected' } : v));
    if (approve) {
      const req = verifications.find(v => v.id === id);
      if (req) handleVerifyUser(req.userId, true);
    }
    toast.success(approve ? 'Verificação aprovada!' : 'Verificação rejeitada');
  }

  if (!user?.isAdmin) return null;

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.isBanned && !u.isSuspended).length,
    totalPosts: posts.length,
    verifiedUsers: users.filter(u => u.isVerified).length,
    premiumUsers: users.filter(u => u.isPremium).length,
    pendingVerifications: verifications.filter(v => v.status === 'pending').length,
    totalRevenue: 15847.90,
    monthlyRevenue: 3240.50,
    adRevenue: 1850.00,
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl btn-brand flex items-center justify-center shadow-brand">
            <ShieldIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black dark:text-white text-gray-900">Painel Administrativo</h1>
            <p className="text-sm dark:text-gray-400 text-gray-600">Gerenciamento completo da plataforma JPvano</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {adminTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'btn-brand shadow-brand'
                    : 'dark:bg-surface-800 bg-white dark:text-gray-400 text-gray-600 border dark:border-white/10 border-gray-200 dark:hover:bg-white/5 hover:bg-gray-50'
                )}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === 'verifications' && stats.pendingVerifications > 0 && (
                  <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {stats.pendingVerifications}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total de Usuários', value: formatNumber(stats.totalUsers), icon: '👥' },
                    { label: 'Publicações', value: formatNumber(stats.totalPosts), icon: '📸' },
                    { label: 'Verificados', value: formatNumber(stats.verifiedUsers), icon: '✅' },
                    { label: 'Premium', value: formatNumber(stats.premiumUsers), icon: '⭐' },
                  ].map(stat => (
                    <div key={stat.label} className="dark:bg-surface-800 bg-white rounded-2xl p-5 border dark:border-white/5 border-gray-100">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-display font-black dark:text-white text-gray-900">{stat.value}</div>
                      <div className="text-xs dark:text-gray-400 text-gray-600 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Receita Total', value: formatCurrency(stats.totalRevenue), icon: '💰', sub: 'Acumulado' },
                    { label: 'Receita Mensal', value: formatCurrency(stats.monthlyRevenue), icon: '📈', sub: 'Junho 2026' },
                    { label: 'Receita em Anúncios', value: formatCurrency(stats.adRevenue), icon: '📢', sub: 'Este mês' },
                  ].map(rev => (
                    <div key={rev.label} className="dark:bg-surface-800 bg-white rounded-2xl p-5 border dark:border-white/5 border-gray-100 relative overflow-hidden">
                      <div className="text-3xl mb-1">{rev.icon}</div>
                      <div className="text-2xl font-display font-black text-brand-gradient">{rev.value}</div>
                      <div className="text-sm font-medium dark:text-gray-300 text-gray-700 mt-1">{rev.label}</div>
                      <div className="text-xs dark:text-gray-500 text-gray-400">{rev.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="dark:bg-surface-800 bg-white rounded-2xl p-5 border dark:border-white/5 border-gray-100">
                  <h3 className="font-bold dark:text-white text-gray-900 mb-4">Usuários Recentes</h3>
                  {users.length === 0 ? (
                    <p className="text-sm dark:text-gray-400 text-gray-600 text-center py-6">Nenhum usuário cadastrado ainda</p>
                  ) : (
                    <div className="space-y-3">
                      {users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-3">
                          <UserAvatar src={u.avatar} name={u.displayName} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium dark:text-white text-gray-900 truncate">{u.displayName}</span>
                              {u.isVerified && <VerifiedBadge size="xs" />}
                              {u.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: 'linear-gradient(135deg, #7B2FBE, #E91E8C)' }}>Admin</span>}
                            </div>
                            <span className="text-xs dark:text-gray-500 text-gray-400">@{u.username} · {formatDate(u.createdAt)}</span>
                          </div>
                          <span className={cn('text-xs px-2 py-1 rounded-full', u.isBanned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500')}>
                            {u.isBanned ? 'Banido' : 'Ativo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fade-in">
                <input
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="Buscar usuário por nome, @username ou e-mail..."
                  className="w-full px-4 py-3 rounded-xl dark:bg-surface-800 bg-white border dark:border-white/5 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 text-sm"
                />
                <div className="dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100 overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center py-12 dark:text-gray-400 text-gray-600 text-sm">Nenhum usuário encontrado</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b dark:border-white/5 border-gray-100">
                            {['Usuário', 'E-mail', 'Status', 'Ações'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-bold dark:text-gray-400 text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id} className="border-b dark:border-white/5 border-gray-50 dark:hover:bg-white/[0.02] hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <UserAvatar src={u.avatar} name={u.displayName} size="sm" />
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-medium dark:text-white text-gray-900">{u.displayName}</span>
                                      {u.isVerified && <VerifiedBadge size="xs" />}
                                    </div>
                                    <span className="text-xs dark:text-gray-500 text-gray-400">@{u.username}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm dark:text-gray-400 text-gray-600">{u.email}</td>
                              <td className="px-4 py-3">
                                <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                                  u.isBanned ? 'bg-red-500/10 text-red-500'
                                  : u.isSuspended ? 'bg-yellow-500/10 text-yellow-500'
                                  : 'bg-green-500/10 text-green-500'
                                )}>
                                  {u.isBanned ? 'Banido' : u.isSuspended ? 'Suspenso' : 'Ativo'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {!u.isAdmin && (
                                    <>
                                      <button
                                        onClick={() => handleVerifyUser(u.id, !u.isVerified)}
                                        className={cn('p-1.5 rounded-lg transition-all', u.isVerified ? 'text-brand-orange hover:bg-brand-orange/10' : 'text-green-500 hover:bg-green-500/10')}
                                        title={u.isVerified ? 'Remover verificação' : 'Verificar'}
                                      >
                                        <BadgeCheckIcon size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleBanUser(u.id, !u.isBanned)}
                                        className={cn('p-1.5 rounded-lg transition-all', u.isBanned ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10')}
                                        title={u.isBanned ? 'Desbanir' : 'Banir'}
                                      >
                                        {u.isBanned ? <CheckIcon size={14} /> : <XIcon size={14} />}
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => navigate(`/perfil/${u.username}`)}
                                    className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-500 transition-all"
                                  >
                                    <EyeIcon size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verifications */}
            {activeTab === 'verifications' && (
              <div className="space-y-4 animate-fade-in">
                {verifications.length === 0 ? (
                  <div className="text-center py-20 dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="dark:text-gray-400 text-gray-600">Nenhuma solicitação de verificação</p>
                  </div>
                ) : (
                  verifications.map(req => {
                    const reqUser = users.find(u => u.id === req.userId);
                    return (
                      <div key={req.id} className="dark:bg-surface-800 bg-white rounded-2xl p-5 border dark:border-white/5 border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {reqUser && <UserAvatar src={reqUser.avatar} name={reqUser.displayName} size="md" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold dark:text-white text-gray-900">{reqUser?.displayName || 'Usuário'}</span>
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                                  'bg-yellow-500/10 text-yellow-500': req.status === 'pending',
                                  'bg-green-500/10 text-green-500': req.status === 'approved',
                                  'bg-red-500/10 text-red-500': req.status === 'rejected',
                                })}>
                                  {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                </span>
                              </div>
                              <span className="text-xs dark:text-gray-500 text-gray-400">@{reqUser?.username} · {formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApproveVerification(req.id, true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 text-sm font-medium hover:bg-green-500/20 transition-all">
                                <CheckIcon size={14} /> Aprovar
                              </button>
                              <button onClick={() => handleApproveVerification(req.id, false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all">
                                <XIcon size={14} /> Rejeitar
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="dark:bg-white/5 bg-gray-50 rounded-xl p-4">
                          <p className="text-sm dark:text-gray-300 text-gray-700"><span className="font-medium">Documento:</span> {req.documentType === 'passport' ? 'Passaporte' : req.documentType === 'national_id' ? 'RG' : 'CNH'}</p>
                          <p className="text-sm dark:text-gray-300 text-gray-700 mt-1"><span className="font-medium">Motivo:</span> {req.reason}</p>
                          {req.documentImages.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {req.documentImages.map((img, i) => (
                                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden dark:bg-surface-700 bg-gray-200">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Reports */}
            {activeTab === 'reports' && (
              <div className="animate-fade-in">
                <div className="text-center py-20 dark:bg-surface-800 bg-white rounded-2xl border dark:border-white/5 border-gray-100">
                  <div className="text-5xl mb-4">🛡️</div>
                  <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Nenhuma denúncia</h3>
                  <p className="dark:text-gray-400 text-gray-600">A plataforma está limpa!</p>
                </div>
              </div>
            )}

            {/* Revenue */}
            {activeTab === 'revenue' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Diária', value: formatCurrency(547.30) },
                    { label: 'Semanal', value: formatCurrency(3240.50) },
                    { label: 'Mensal', value: formatCurrency(12480.90) },
                    { label: 'Anual', value: formatCurrency(149760.00) },
                  ].map(r => (
                    <div key={r.label} className="dark:bg-surface-800 bg-white rounded-2xl p-5 border dark:border-white/5 border-gray-100 text-center">
                      <div className="text-xl font-display font-black text-brand-gradient">{r.value}</div>
                      <div className="text-xs dark:text-gray-400 text-gray-600 mt-1">Receita {r.label}</div>
                    </div>
                  ))}
                </div>

                <div className="dark:bg-surface-800 bg-white rounded-2xl p-6 border dark:border-white/5 border-gray-100">
                  <h3 className="font-bold dark:text-white text-gray-900 mb-4">Fontes de Receita</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Assinaturas Premium', amount: 8940.50, pct: 72 },
                      { name: 'Publicidade', amount: 1850.00, pct: 15 },
                      { name: 'Produtos Digitais', amount: 980.40, pct: 8 },
                      { name: 'Doações', amount: 620.00, pct: 5 },
                    ].map(source => (
                      <div key={source.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm dark:text-gray-300 text-gray-700">{source.name}</span>
                          <span className="text-sm font-bold dark:text-white text-gray-900">{formatCurrency(source.amount)}</span>
                        </div>
                        <div className="h-2 dark:bg-white/5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${source.pct}%`, background: 'linear-gradient(90deg, #FF6B00, #E91E8C, #7B2FBE)' }}
                          />
                        </div>
                        <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">{source.pct}% do total</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
