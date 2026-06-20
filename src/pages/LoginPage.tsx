import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, ArrowRightIcon } from 'lucide-react';
import { APP_LOGO, APP_NAME } from '@/constants';
import { loginWithPassword, sendOtp } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { user, error } = await loginWithPassword(email, password);
    if (error) { toast.error(error); setLoading(false); return; }
    await refreshUser();
    navigate('/feed');
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error('Informe seu e-mail'); return; }
    setLoading(true);
    const { error } = await sendOtp(email);
    setLoading(false);
    if (error) { toast.error(error); return; }
    setResetSent(true);
    toast.success('Código de recuperação enviado!');
  }

  return (
    <div className="min-h-screen dark:bg-surface-950 bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={APP_LOGO} alt={APP_NAME} className="w-20 h-20 mx-auto rounded-2xl mb-4 shadow-brand" />
          <h1 className="text-3xl font-display font-black text-brand-gradient">{APP_NAME}</h1>
          <p className="dark:text-gray-400 text-gray-600 mt-1">Conecte. Compartilhe. Evolua.</p>
        </div>

        <div className="dark:bg-surface-800 bg-white rounded-3xl p-8 shadow-xl border dark:border-white/5 border-gray-100">
          {!forgotMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-display font-black dark:text-white text-gray-900 mb-6">
                Bem-vindo de volta 👋
              </h2>
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
              <div className="relative">
                <LockIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:text-brand-pink">
                  {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              <div className="text-right">
                <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-brand-pink hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-brand w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? 'Entrando...' : <><span>Entrar</span><ArrowRightIcon size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-2">Recuperar senha</h2>
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="dark:text-gray-300 text-gray-700 text-sm">Verifique seu e-mail — você receberá um código para redefinir a senha.</p>
                  <button type="button" onClick={() => navigate('/cadastro')} className="mt-4 btn-brand px-6 py-2 rounded-xl font-semibold text-sm">
                    Usar código de verificação
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">Informe o seu e-mail para receber o código de recuperação.</p>
                  <div className="relative">
                    <MailIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl dark:bg-surface-700 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-brand-pink/50 transition-all"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-brand w-full py-3.5 rounded-xl font-bold disabled:opacity-60">
                    {loading ? 'Enviando...' : 'Enviar código'}
                  </button>
                </>
              )}
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm dark:text-gray-400 text-gray-600 hover:text-brand-pink">
                ← Voltar ao login
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm dark:text-gray-400 text-gray-600">
            Não tem conta?{' '}
            <button onClick={() => navigate('/cadastro')} className="text-brand-pink font-semibold hover:underline">
              Cadastrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
