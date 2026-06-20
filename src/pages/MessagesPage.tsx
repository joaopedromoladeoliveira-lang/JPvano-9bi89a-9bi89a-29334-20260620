import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SendIcon, SearchIcon, PhoneIcon, VideoIcon, InfoIcon,
  SmileIcon, ImageIcon, PlusCircleIcon, ArrowLeftIcon, CheckIcon, CheckCheckIcon,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { UserAvatar } from '@/components/features/UserAvatar';
import { VerifiedBadge } from '@/components/features/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import {
  getConversations, getMessages, getOrCreateConversation,
  sendMessage as dbSendMessage, markMessagesRead, getAllProfiles, getProfile,
} from '@/lib/db';
import { formatDate, cn } from '@/lib/utils';
import type { User } from '@/types';

interface Conversation {
  id: string;
  is_group: boolean;
  lastMessage?: {
    content: string;
    sender_id: string;
    is_read: boolean;
    created_at: string;
  };
  updated_at: string;
  conversation_participants: { user_id: string }[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showConvList, setShowConvList] = useState(true);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [profileCache, setProfileCache] = useState<Map<string, User>>(new Map());
  const [convSearch, setConvSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  // Load all users for DM search
  useEffect(() => {
    if (user) getAllProfiles().then(setAllUsers);
  }, [user]);

  // Cache profiles from conversations
  const cacheProfiles = useCallback(async (convs: Conversation[]) => {
    const ids = new Set<string>();
    convs.forEach(c => c.conversation_participants?.forEach((p: any) => ids.add(p.user_id)));
    const toFetch = Array.from(ids).filter(id => !profileCache.has(id));
    if (toFetch.length === 0) return;

    const profiles = await Promise.all(toFetch.map(id => getProfile(id)));
    setProfileCache(prev => {
      const next = new Map(prev);
      profiles.forEach((p, i) => { if (p) next.set(toFetch[i], p); });
      return next;
    });
  }, [profileCache]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const convs = await getConversations(user.id);
    setConversations(convs);
    cacheProfiles(convs);
  }, [user, cacheProfiles]);

  const loadMessages = useCallback(async (convId: string) => {
    const msgs = await getMessages(convId);
    setMessages(msgs);
    if (user) markMessagesRead(convId, user.id).catch(() => {});
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Deep-link from Explore or Profile
  useEffect(() => {
    const state = location.state as { userId?: string } | null;
    if (state?.userId && user) {
      getOrCreateConversation(user.id, state.userId).then(async convId => {
        await loadConversations();
        setSelectedConvId(convId);
        await loadMessages(convId);
        setShowConvList(false);
        inputRef.current?.focus();
      });
      navigate('/mensagens', { replace: true, state: {} });
    }
  }, [location.state, user]);

  // Polling every 2s for messages + 5s for conversation list
  useEffect(() => {
    const msgInterval = setInterval(() => {
      if (selectedConvIdRef.current) {
        loadMessages(selectedConvIdRef.current);
      }
    }, 2000);
    const convInterval = setInterval(loadConversations, 5000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(convInterval);
    };
  }, [loadMessages, loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getOtherUser(conv: Conversation): User | null {
    if (!user) return null;
    const otherId = conv.conversation_participants?.find((p: any) => p.user_id !== user.id)?.user_id;
    return otherId ? (profileCache.get(otherId) || null) : null;
  }

  async function selectConversation(convId: string) {
    setSelectedConvId(convId);
    setShowConvList(false);
    await loadMessages(convId);
    inputRef.current?.focus();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvId || !user || sending) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic message
    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: selectedConvId,
      sender_id: user.id,
      content: msgText,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    const sent = await dbSendMessage(selectedConvId, user.id, msgText);
    setSending(false);
    // Replace temp with real
    setMessages(prev => prev.map(m => m.id === tempMsg.id ? sent : m));
    loadConversations();
  }

  async function startDM(targetUser: User) {
    if (!user) return;
    const convId = await getOrCreateConversation(user.id, targetUser.id);
    await loadConversations();
    setSelectedConvId(convId);
    await loadMessages(convId);
    setShowNewDM(false);
    setDmSearch('');
    setShowConvList(false);
    inputRef.current?.focus();
  }

  if (!user) return null;

  const filteredDMUsers = dmSearch.trim()
    ? allUsers.filter(u =>
        u.id !== user.id &&
        (u.username.toLowerCase().includes(dmSearch.toLowerCase()) ||
          u.displayName.toLowerCase().includes(dmSearch.toLowerCase()))
      )
    : allUsers.filter(u => u.id !== user.id).slice(0, 8);

  const filteredConvs = conversations.filter(conv => {
    if (!convSearch.trim()) return true;
    const other = getOtherUser(conv);
    if (!other) return false;
    return (
      other.displayName.toLowerCase().includes(convSearch.toLowerCase()) ||
      other.username.toLowerCase().includes(convSearch.toLowerCase())
    );
  });

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const chatPartner = selectedConv ? getOtherUser(selectedConv) : null;

  return (
    <Layout>
      <div className="h-[calc(100vh-56px)] md:h-screen flex dark:bg-surface-900 bg-gray-50 overflow-hidden">

        {/* ── Conversation list ── */}
        <div className={cn(
          'flex-col w-full md:w-80 border-r dark:border-white/5 border-gray-200 flex-shrink-0 dark:bg-surface-900 bg-white',
          showConvList ? 'flex' : 'hidden md:flex'
        )}>
          {/* Header */}
          <div className="p-4 border-b dark:border-white/5 border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-display font-black dark:text-white text-gray-900">Mensagens</h2>
              <button
                onClick={() => setShowNewDM(!showNewDM)}
                className="p-1.5 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 transition-all"
                title="Nova mensagem"
              >
                <PlusCircleIcon size={22} className="text-brand-pink" />
              </button>
            </div>
            {/* Search convs */}
            <div className="relative">
              <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
              <input
                value={convSearch}
                onChange={e => setConvSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full pl-9 pr-4 py-2 rounded-xl dark:bg-white/5 bg-gray-100 text-sm dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-pink/30 border-0"
              />
            </div>
          </div>

          {/* New DM panel */}
          {showNewDM && (
            <div className="border-b dark:border-white/5 border-gray-100 p-3 dark:bg-surface-800 bg-gray-50 animate-slide-down">
              <p className="text-xs font-bold dark:text-gray-400 text-gray-500 mb-2 uppercase tracking-wider">
                Nova mensagem
              </p>
              <input
                value={dmSearch}
                onChange={e => setDmSearch(e.target.value)}
                placeholder="Buscar usuário..."
                className="w-full px-3 py-2 rounded-xl dark:bg-surface-700 bg-white text-sm dark:text-white text-gray-900 border dark:border-white/10 border-gray-200 focus:outline-none focus:border-brand-pink/50 mb-2"
                autoFocus
              />
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {filteredDMUsers.length === 0 ? (
                  <p className="text-xs dark:text-gray-500 text-gray-400 text-center py-3">
                    {dmSearch ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                  </p>
                ) : (
                  filteredDMUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startDM(u)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl dark:hover:bg-white/5 hover:bg-white transition-all text-left"
                    >
                      <UserAvatar src={u.avatar} name={u.displayName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold dark:text-white text-gray-900 truncate">
                            {u.displayName}
                          </span>
                          {u.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-xs dark:text-gray-500 text-gray-400">@{u.username}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="p-8 text-center dark:text-gray-500 text-gray-400">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium dark:text-gray-400 text-gray-600">
                  {convSearch ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
                {!convSearch && (
                  <button
                    onClick={() => setShowNewDM(true)}
                    className="mt-3 text-xs text-brand-pink hover:underline font-semibold"
                  >
                    Iniciar conversa
                  </button>
                )}
              </div>
            ) : (
              filteredConvs.map(conv => {
                const other = getOtherUser(conv);
                if (!other) return null;
                const hasUnread =
                  conv.lastMessage &&
                  !conv.lastMessage.is_read &&
                  conv.lastMessage.sender_id !== user.id;
                const isSelected = selectedConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-2',
                      isSelected
                        ? 'dark:bg-brand-pink/10 bg-brand-pink/5 border-brand-pink'
                        : 'border-transparent dark:hover:bg-white/[0.03] hover:bg-gray-50'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar src={other.avatar} name={other.displayName} size="md" />
                      {/* Online indicator placeholder */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 dark:border-surface-900 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={cn(
                            'text-sm truncate',
                            hasUnread ? 'font-bold dark:text-white text-gray-900' : 'font-medium dark:text-white text-gray-800'
                          )}>
                            {other.displayName}
                          </span>
                          {other.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-[10px] dark:text-gray-600 text-gray-400 flex-shrink-0 ml-1">
                          {conv.lastMessage ? formatDate(conv.lastMessage.created_at) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          'text-xs truncate',
                          hasUnread
                            ? 'dark:text-white text-gray-900 font-medium'
                            : 'dark:text-gray-500 text-gray-400'
                        )}>
                          {conv.lastMessage?.sender_id === user.id && (
                            <span className="mr-1 text-brand-pink">Você: </span>
                          )}
                          {conv.lastMessage?.content || 'Iniciar conversa'}
                        </p>
                        {hasUnread && (
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-pink flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className={cn('flex-1 flex-col', !showConvList ? 'flex' : 'hidden md:flex')}>
          {!selectedConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center dark:text-gray-500 text-gray-400 p-8">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.15), rgba(123,47,190,0.15))' }}>
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-2xl font-display font-black dark:text-white text-gray-900 mb-2">
                Suas mensagens
              </h3>
              <p className="text-sm text-center max-w-xs mb-6 dark:text-gray-400 text-gray-500">
                Conecte-se com pessoas na plataforma enviando mensagens diretas
              </p>
              <button
                onClick={() => { setShowNewDM(true); setShowConvList(true); }}
                className="btn-brand px-6 py-3 rounded-xl font-semibold text-sm shadow-brand"
              >
                Nova mensagem
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b dark:border-white/5 border-gray-200 flex-shrink-0 dark:bg-surface-900 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setShowConvList(true); setSelectedConvId(null); }}
                    className="md:hidden p-1.5 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-600 transition-all"
                  >
                    <ArrowLeftIcon size={18} />
                  </button>
                  {chatPartner && (
                    <button
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/perfil/${chatPartner.username}`)}
                    >
                      <div className="relative">
                        <UserAvatar src={chatPartner.avatar} name={chatPartner.displayName} size="md" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 dark:border-surface-900 border-white" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm dark:text-white text-gray-900">
                            {chatPartner.displayName}
                          </span>
                          {chatPartner.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-xs text-green-500 font-medium">Online</span>
                      </div>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-600 transition-all"
                    title="Chamada de voz"
                  >
                    <PhoneIcon size={18} />
                  </button>
                  <button
                    className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-600 transition-all"
                    title="Chamada de vídeo"
                  >
                    <VideoIcon size={18} />
                  </button>
                  {chatPartner && (
                    <button
                      className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-gray-100 dark:text-gray-400 text-gray-600 transition-all"
                      onClick={() => navigate(`/perfil/${chatPartner.username}`)}
                      title="Ver perfil"
                    >
                      <InfoIcon size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 dark:bg-surface-950 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 dark:text-gray-500 text-gray-400">
                    {chatPartner && (
                      <div className="text-center">
                        <UserAvatar src={chatPartner.avatar} name={chatPartner.displayName} size="xl" />
                        <div className="flex items-center gap-1 justify-center mt-3 mb-1">
                          <p className="font-bold dark:text-white text-gray-900">{chatPartner.displayName}</p>
                          {chatPartner.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-sm dark:text-gray-400 text-gray-500">@{chatPartner.username}</p>
                        <p className="text-sm mt-3">👋 Diga olá para {chatPartner.displayName.split(' ')[0]}!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isOwn = msg.sender_id === user.id;
                      const sender = profileCache.get(msg.sender_id);
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const showAvatar = !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id);

                      return (
                        <div
                          key={msg.id}
                          className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}
                        >
                          {/* Avatar for other user */}
                          <div className="w-7 flex-shrink-0">
                            {!isOwn && showAvatar && sender && (
                              <UserAvatar src={sender.avatar} name={sender.displayName} size="xs" />
                            )}
                          </div>

                          <div className={cn('max-w-[72%] flex flex-col', isOwn && 'items-end')}>
                            <div
                              className={cn(
                                'px-4 py-2.5 rounded-2xl text-sm break-words',
                                isOwn
                                  ? 'text-white rounded-br-sm'
                                  : 'dark:bg-surface-700 bg-white dark:text-white text-gray-900 rounded-bl-sm shadow-sm border dark:border-white/5 border-gray-100'
                              )}
                              style={isOwn ? { background: 'linear-gradient(135deg, #E91E8C, #7B2FBE)' } : {}}
                            >
                              <p className="leading-relaxed">{msg.content}</p>
                            </div>
                            <div className={cn(
                              'flex items-center gap-1 mt-0.5 px-1',
                              isOwn ? 'flex-row-reverse' : 'flex-row'
                            )}>
                              <span className="text-[10px] dark:text-gray-600 text-gray-400">
                                {formatDate(msg.created_at)}
                              </span>
                              {isOwn && (
                                msg.is_read
                                  ? <CheckCheckIcon size={12} className="text-brand-pink" />
                                  : <CheckIcon size={12} className="dark:text-gray-600 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 border-t dark:border-white/5 border-gray-200 flex-shrink-0 dark:bg-surface-900 bg-white"
              >
                <div className="flex items-center gap-2 dark:bg-surface-800 bg-gray-100 rounded-2xl px-3 py-2 border dark:border-white/5 border-gray-200">
                  <button
                    type="button"
                    className="p-1.5 dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors"
                  >
                    <SmileIcon size={20} />
                  </button>
                  <input
                    ref={inputRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 focus:outline-none dark:placeholder-gray-500 placeholder-gray-400 py-1"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="p-1.5 dark:text-gray-500 text-gray-400 hover:text-brand-pink transition-colors"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn-brand p-2 rounded-xl disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                  >
                    <SendIcon size={16} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
