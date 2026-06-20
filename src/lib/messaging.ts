/**
 * Real-time messaging helpers using localStorage + storage events + polling.
 * Simulates real-time by broadcasting changes via custom events and storage events.
 */
import {
  getConversations, saveConversations, getMessages, saveMessages,
  getUserById
} from '@/lib/storage';
import { generateId } from '@/lib/utils';
import type { Conversation, Message } from '@/types';

const MESSAGES_TS_KEY = 'jpvano_messages_ts';
const CONV_TS_KEY = 'jpvano_conv_ts';

export const MSG_UPDATED_EVENT = 'jpvano:messages_updated';
export const CONV_UPDATED_EVENT = 'jpvano:conv_updated';

export function broadcastMessagesUpdate() {
  localStorage.setItem(MESSAGES_TS_KEY, Date.now().toString());
  window.dispatchEvent(new Event(MSG_UPDATED_EVENT));
}

export function broadcastConvUpdate() {
  localStorage.setItem(CONV_TS_KEY, Date.now().toString());
  window.dispatchEvent(new Event(CONV_UPDATED_EVENT));
}

/** Find or create a 1-on-1 conversation between two users */
export function getOrCreateConversation(userId: string, otherUserId: string): Conversation {
  const convs = getConversations();
  const existing = convs.find(
    c => !c.isGroup &&
      c.participants.length === 2 &&
      c.participants.includes(userId) &&
      c.participants.includes(otherUserId)
  );
  if (existing) return existing;

  const newConv: Conversation = {
    id: generateId(),
    participants: [userId, otherUserId],
    isGroup: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  convs.push(newConv);
  saveConversations(convs);
  broadcastConvUpdate();
  return newConv;
}

/** Send a message in a conversation */
export function sendMessage(conversationId: string, senderId: string, content: string): Message {
  const msg: Message = {
    id: generateId(),
    conversationId,
    senderId,
    content,
    type: 'text',
    isRead: false,
    createdAt: new Date().toISOString(),
    isDeleted: false,
    reactions: [],
  };

  const allMsgs = getMessages();
  allMsgs.push(msg);
  saveMessages(allMsgs);

  // Update conversation's last message and timestamp
  const allConvs = getConversations();
  const idx = allConvs.findIndex(c => c.id === conversationId);
  if (idx !== -1) {
    allConvs[idx].lastMessage = msg;
    allConvs[idx].updatedAt = new Date().toISOString();
    saveConversations(allConvs);
  }

  broadcastMessagesUpdate();
  broadcastConvUpdate();
  return msg;
}

/** Mark all messages in a conversation as read for a given user */
export function markConversationRead(conversationId: string, userId: string) {
  const allMsgs = getMessages();
  let changed = false;
  const updated = allMsgs.map(m => {
    if (m.conversationId === conversationId && m.senderId !== userId && !m.isRead) {
      changed = true;
      return { ...m, isRead: true, readAt: new Date().toISOString() };
    }
    return m;
  });
  if (changed) {
    saveMessages(updated);
    broadcastMessagesUpdate();
  }
}

/** Get unread message count for a user */
export function getUnreadCount(userId: string): number {
  const convs = getConversations().filter(c => c.participants.includes(userId));
  const allMsgs = getMessages();
  let count = 0;
  for (const conv of convs) {
    const unread = allMsgs.filter(
      m => m.conversationId === conv.id && m.senderId !== userId && !m.isRead
    );
    count += unread.length;
  }
  return count;
}
