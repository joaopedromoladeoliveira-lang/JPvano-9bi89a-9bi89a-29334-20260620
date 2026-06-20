import { STORAGE_KEYS } from '@/constants';
import type { User, Post, Story, Message, Conversation, Notification, VerificationRequest, Advertisement } from '@/types';

// Generic storage helpers
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Users
export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS, []);
}

export function saveUsers(users: User[]): void {
  setItem(STORAGE_KEYS.USERS, users);
}

export function getUserById(id: string): User | null {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserByUsername(username: string): User | null {
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function updateUser(updatedUser: User): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
  const currentUser = getCurrentUser();
  if (currentUser?.id === updatedUser.id) {
    setCurrentUser(updatedUser);
  }
}

// Current session
export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
}

// Posts
export function getPosts(): Post[] {
  return getItem<Post[]>(STORAGE_KEYS.POSTS, []);
}

export function savePosts(posts: Post[]): void {
  setItem(STORAGE_KEYS.POSTS, posts);
}

export function getPostById(id: string): Post | null {
  return getPosts().find(p => p.id === id) || null;
}

export function addPost(post: Post): void {
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
}

export function updatePost(updated: Post): void {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === updated.id);
  if (index !== -1) {
    posts[index] = updated;
    savePosts(posts);
  }
}

export function deletePost(id: string): void {
  const posts = getPosts().filter(p => p.id !== id);
  savePosts(posts);
}

// Stories
export function getStories(): Story[] {
  return getItem<Story[]>(STORAGE_KEYS.STORIES, []).filter(s => !isExpired(s.expiresAt));
}

export function saveStories(stories: Story[]): void {
  setItem(STORAGE_KEYS.STORIES, stories);
}

function isExpired(dateStr: string): boolean {
  return new Date() > new Date(dateStr);
}

// Conversations
export function getConversations(): Conversation[] {
  return getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
}

export function saveConversations(conversations: Conversation[]): void {
  setItem(STORAGE_KEYS.CONVERSATIONS, conversations);
}

// Messages
export function getMessages(): Message[] {
  return getItem<Message[]>(STORAGE_KEYS.MESSAGES, []);
}

export function saveMessages(messages: Message[]): void {
  setItem(STORAGE_KEYS.MESSAGES, messages);
}

export function getConversationMessages(conversationId: string): Message[] {
  return getMessages().filter(m => m.conversationId === conversationId);
}

// Notifications
export function getNotifications(userId: string): Notification[] {
  return getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, [])
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addNotification(notification: Notification): void {
  const notifications = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  notifications.unshift(notification);
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function markNotificationsRead(userId: string): void {
  const notifications = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const updated = notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n);
  setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
}

// Verification requests
export function getVerificationRequests(): VerificationRequest[] {
  return getItem<VerificationRequest[]>(STORAGE_KEYS.VERIFICATION_REQUESTS, []);
}

export function saveVerificationRequests(reqs: VerificationRequest[]): void {
  setItem(STORAGE_KEYS.VERIFICATION_REQUESTS, reqs);
}

// Advertisements
export function getAdvertisements(): Advertisement[] {
  return getItem<Advertisement[]>(STORAGE_KEYS.ADVERTISEMENTS, []);
}

export function saveAdvertisements(ads: Advertisement[]): void {
  setItem(STORAGE_KEYS.ADVERTISEMENTS, ads);
}

// Theme
export function getTheme(): 'dark' | 'light' {
  return getItem<'dark' | 'light'>(STORAGE_KEYS.THEME, 'dark');
}

export function saveTheme(theme: 'dark' | 'light'): void {
  setItem(STORAGE_KEYS.THEME, theme);
}
