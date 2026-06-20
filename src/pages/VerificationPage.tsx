import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheckIcon, UploadIcon, FileIcon, CheckIcon, ClockIcon, XIcon, ChevronRightIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getVerificationRequests, saveVerificationRequests } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import type { VerificationRequest } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const docTypes = [
  { id: 'passport', label: 'Passaporte', icon: '🛂' },
  { id: 'national_id', label: 'RG / CNH', icon: '🪪' },
  { id: 'drivers_license', label: 'Carteira de Motorista', icon: '🚗' },
];

const statusConfig = {
  none: { label: 'Não solicitado', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: BadgeCheckIcon },
  pending: { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: ClockIcon },
  reviewing: { label: 'Em análise', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: ClockIcon },
  approved: { label: 'Aprovado', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckIcon },
  rejected: { label: 'Rejeitado', color: 'text-red-500', bg: 'bg-red-500/10', icon: XIcon },
};

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const existingReqs = getVerificationRequests().filter(r => r.userId === user.id);
  const latestReq = existingReqs[existingReqs.length - 1];
  const status = user.verificationStatus || 'none';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  async function handleSubmit() {
    if (!docType || !reason) { toast.error('Preencha todos os campos'); return; }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));

    const req: VerificationRequest = {
      id: generateId(),
      userId: user!.id,
      status: 'pending',
      documentType: docType as VerificationRequest['documentType'],
      documentImages: ['https://images.unsplash.com/photo-1580894742597-87bc8789db3d?w=400&h=300&fit=crop'],
      reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reqs = getVerificationRequests();
    reqs.push(req);
    saveVerificationRequests(reqs);
    setIsSubmitting(false);
    setStep(4);
    toast.success('Solicitação enviada com sucesso!');
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl btn-brand flex items-center justify-center shadow-brand">
            <BadgeCheckIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black dark:text-white text-gray-900">Verificação de Conta</h1>
            <p className="text-sm dark:text-gray-400 text-gray-600">Obtenha o selo de conta verificada</p>
          </div>
        </div>

        {/* Current status */}
        {status !== 'none' && (
          <div className={cn('flex items-center gap-3 p-4 rounded-2xl mb-6', statusInfo.bg)}>
            <StatusIcon size={20} className={statusInfo.color} />
            <div>
              <p className={cn('font-semibold text-sm', statusInfo.color)}>Status: {statusInfo.label}</p>
              {latestReq && <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Solicitado em {new Date(latestReq.createdAt).toLocaleDateString('pt-BR')}</p>}
            </div>
          </div>
        )}

        {user.isVerified ? (
          // Already verified
          <div className="dark:bg-surface-800 bg-white rounded-3xl p-8 border dark:border-white/5 border-gray-100 text-center">
            <div className="w-20 h-20 verified-badge mx-auto mb-4 flex items-center justify-center">
              <CheckIcon size={40} color="white" />
            </div>
            <h2 className="text-2xl font-display font-black dark:text-white text-gray-900 mb-2">Conta Verificada! ✓</h2>
            <p className="dark:text-gray-400 text-gray-600 mb-6">Sua conta JPvano é verificada e autêntica.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Selo verificado no perfil', 'Maior alcance orgânico', 'Suporte prioritário', 'Badge exclusivo'].map(benefit => (
                <div key={benefit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-white/5 bg-gray-50 text-sm dark:text-gray-300 text-gray-700">
                  <CheckIcon size={12} className="text-green-500" /> {benefit}
                </div>
              ))}
            </div>
          </div>
        ) : status === 'pending' || status === 'reviewing' ? (
          // Under review
          <div className="dark:bg-surface-800 bg-white rounded-3xl p-8 border dark:border-white/5 border-gray-100 text-center">
            <div className="text-6xl mb-4 animate-bounce-soft">⏳</div>
            <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Solicitação em Análise</h2>
            <p className="dark:text-gray-400 text-gray-600 mb-4">Nossa equipe está analisando seus documentos. Isso pode levar até 3 dias úteis.</p>
            <div className="dark:bg-white/5 bg-gray-50 rounded-2xl p-4 text-left">
              <p className="text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">Próximos passos:</p>
              {['Análise dos documentos', 'Verificação de identidade', 'Aprovação ou solicitação de mais informações'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600 py-1">
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', i === 0 ? 'bg-brand-pink text-white' : 'dark:bg-white/10 bg-gray-200 dark:text-gray-400 text-gray-500')}>
                    {i === 0 ? '→' : i + 1}
                  </div>
                  {s}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Request form
          <div className="dark:bg-surface-800 bg-white rounded-3xl border dark:border-white/5 border-gray-100 overflow-hidden">
            {/* Progress */}
            <div className="p-6 border-b dark:border-white/5 border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                {[1,2,3].map(s => (
                  <React.Fragment key={s}>
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all', step > s ? 'btn-brand' : step === s ? 'border-2 border-brand-pink text-brand-pink' : 'dark:bg-white/10 bg-gray-100 dark:text-gray-500 text-gray-400')}>
                      {step > s ? <CheckIcon size={14} /> : s}
                    </div>
                    {s < 3 && <div className={cn('flex-1 h-0.5 rounded-full transition-all', step > s ? 'bg-brand-pink' : 'dark:bg-white/10 bg-gray-200')} />}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-sm dark:text-gray-400 text-gray-600">
                {step === 1 ? 'Escolha o tipo de documento' : step === 2 ? 'Envie o documento' : step === 3 ? 'Informações adicionais' : 'Concluído!'}
              </p>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-3 animate-fade-in">
                  <h3 className="font-bold dark:text-white text-gray-900 mb-4">Selecione o documento de identidade</h3>
                  {docTypes.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setDocType(doc.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                        docType === doc.id
                          ? 'border-brand-pink dark:bg-brand-pink/10 bg-brand-pink/5'
                          : 'dark:border-white/10 border-gray-200 dark:hover:border-white/20 hover:border-gray-300'
                      )}
                    >
                      <span className="text-2xl">{doc.icon}</span>
                      <span className="font-medium dark:text-white text-gray-900">{doc.label}</span>
                      {docType === doc.id && <CheckIcon size={16} className="ml-auto text-brand-pink" />}
                    </button>
                  ))}
                  <button
                    disabled={!docType}
                    onClick={() => setStep(2)}
                    className="w-full btn-brand py-3 rounded-xl font-semibold mt-4 disabled:opacity-40"
                  >
                    Continuar →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold dark:text-white text-gray-900 mb-4">Envie o documento</h3>
                  <div className="border-2 border-dashed dark:border-white/10 border-gray-300 rounded-2xl p-8 text-center dark:hover:border-brand-pink/30 hover:border-brand-pink/30 transition-all cursor-pointer group">
                    <UploadIcon size={40} className="mx-auto mb-3 dark:text-gray-500 text-gray-400 group-hover:text-brand-pink transition-colors" />
                    <p className="font-medium dark:text-gray-300 text-gray-700 mb-1">Arraste e solte ou clique para enviar</p>
                    <p className="text-sm dark:text-gray-500 text-gray-400">JPG, PNG, PDF até 10MB</p>
                    <p className="text-xs dark:text-gray-600 text-gray-400 mt-2">🔒 Criptografado e armazenado com segurança</p>
                  </div>
                  <div className="mt-4 p-3 dark:bg-green-500/10 bg-green-50 rounded-xl flex items-center gap-2">
                    <CheckIcon size={16} className="text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Documento simulado carregado com sucesso</span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 font-medium">← Voltar</button>
                    <button onClick={() => setStep(3)} className="flex-1 btn-brand py-3 rounded-xl font-semibold">Continuar →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold dark:text-white text-gray-900 mb-4">Por que você quer ser verificado?</h3>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Explique brevemente por que sua conta merece verificação (criador de conteúdo, figura pública, empresa, etc.)..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 resize-none text-sm dark:placeholder-gray-500 placeholder-gray-400"
                    maxLength={500}
                  />
                  <p className="text-xs dark:text-gray-500 text-gray-400 text-right mt-1">{reason.length}/500</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900 font-medium">← Voltar</button>
                    <button onClick={handleSubmit} disabled={!reason.trim() || isSubmitting} className="flex-1 btn-brand py-3 rounded-xl font-semibold disabled:opacity-40">
                      {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="text-center py-6 animate-scale-in">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Solicitação enviada!</h3>
                  <p className="dark:text-gray-400 text-gray-600 mb-6">Nossa equipe analisará em até 3 dias úteis.</p>
                  <button onClick={() => navigate('/feed')} className="btn-brand px-8 py-3 rounded-xl font-semibold">Voltar ao feed</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits */}
        {!user.isVerified && status === 'none' && (
          <div className="mt-6 dark:bg-surface-800 bg-white rounded-2xl p-5 border dark:border-white/5 border-gray-100">
            <h3 className="font-bold dark:text-white text-gray-900 mb-3">Benefícios da verificação</h3>
            {['Selo azul no perfil e publicações', 'Maior credibilidade e confiança', 'Prioridade no algoritmo de recomendação', 'Proteção contra perfis falsos', 'Acesso a ferramentas exclusivas'].map(b => (
              <div key={b} className="flex items-center gap-2 py-2 border-b dark:border-white/5 border-gray-100 last:border-0">
                <CheckIcon size={14} className="text-brand-pink flex-shrink-0" />
                <span className="text-sm dark:text-gray-300 text-gray-700">{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
