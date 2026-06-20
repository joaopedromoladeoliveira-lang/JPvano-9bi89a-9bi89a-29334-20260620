import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import FeedPage from '@/pages/FeedPage';
import ExplorePage from '@/pages/ExplorePage';
import ProfilePage from '@/pages/ProfilePage';
import MessagesPage from '@/pages/MessagesPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminDashboard from '@/pages/AdminDashboard';
import VerificationPage from '@/pages/VerificationPage';
import ReelsPage from '@/pages/ReelsPage';
import PostDetailPage from '@/pages/PostDetailPage';
import FollowListPage from '@/pages/FollowListPage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #1A1B2E)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/mensagens" element={<MessagesPage />} />
        <Route path="/notificacoes" element={<NotificationsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/perfil/:username" element={<ProfilePage />} />
        <Route path="/perfil/:username/:mode" element={<FollowListPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/verificacao" element={<VerificationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
