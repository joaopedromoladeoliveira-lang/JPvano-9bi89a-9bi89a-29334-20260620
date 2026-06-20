import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon, AtSignIcon, ArrowRightIcon, CheckIcon } from 'lucide-react';
import { APP_LOGO, APP_NAME } from '@/constants';
import { sendOtp, verifyOtpAndSetPassword } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 'email' | 'otp' | 'password';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await sendOtp(email);
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success('Código enviado para o seu e-mail!');
    setStep('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 4 && otp.length !== 6) { toast.error('Código inválido'); return; }
    setStep('password');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    if (password.length < 6) { toast.error('Senha mínima de 6 caracteres'); return; }
    if (!username.trim()) { toast.error('Escolha um nome de usuário'); return; }
    setLoading(true);
    const { user, error } = await verifyOtpAndSetPassword(email, otp, password, username, displayName || username);
    if (error) { toast.error(error); setLoading(false); return; }
    await refreshUser();
    navigate('/feed');
  }

  return (
    <div className="min-h-screen dark:bg-surface-950 bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={APP_LOGO} alt={APP_NAME} className="w-20 h-20 mx-auto rounded-2xl mb-4 shadow-brand" />
          <h1 className="text-3xl font-display font-black text-brand-gradient">{APP_NAME}</h1>
          <p className="dark:text-gray-400 text-gray-600 mt-1">Crie sua conta gratuitamente</p>
        </div>

        <div className="dark:bg-surface-800 bg-white rounded-3xl p-8 shadow-xl border dark:border-white/5 border-gray-100">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  step === s ? 'btn-brand' :
                  (['email', 'otp', 'password'] as Step[]).indexOf(step) > i ? 'bg-green-500 text-white' :
                  'dark:bg-white/10 bg-gray-200 dark:text-gray-500 text-gray-400'
                )}>
                  {(['email', 'otp', 'password'] as Step[]).indexOf(step) > i ? <CheckIcon size={14} /> : i + 1}
                </div>
                {i < 2 && <div className={cn('flex-1 h-0.5 max-w-[40px] rounded', i < (['email', 'otp', 'password'] as Step[]).indexOf(step) ? 'bg-brand-pink' : 'dark:bg-white/10 bg-gray-200')} />}
              </React.Fragment>
            ))}
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-4">Qual é o seu e-mail?</h2>
              <div className="relative">
                <MailIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 transition-all"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-brand w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? 'Enviando...' : <><span>Continuar</span><ArrowRightIcon size={18} /></>}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-1">Verifique seu e-mail</h2>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">Enviamos um código para <strong>{email}</strong></p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest py-4 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50"
              />
              <button type="submit" className="btn-brand w-full py-3.5 rounded-xl font-bold">Verificar código</button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink">
                ← Voltar
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-4">Finalize sua conta</h2>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Nome de exibição"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 transition-all"
                />
              </div>
              <div className="relative">
                <AtSignIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="nome_de_usuario"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 transition-all"
                />
              </div>
              <div className="relative">
                <LockIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Senha (mín. 6 caracteres)"
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400">
                  {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              <div className="relative">
                <LockIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar senha"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 transition-all"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-brand w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-60">
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm dark:text-gray-400 text-gray-600">
            Já tem uma conta?{' '}
            <button onClick={() => navigate('/login')} className="text-brand-pink font-semibold hover:underline">
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
