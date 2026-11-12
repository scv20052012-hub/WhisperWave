import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Chat, Message, MessageType, User, Story, SignalingMessage } from '../types';
import { INITIAL_CHATS, INITIAL_MESSAGES, INITIAL_STORIES } from '../services/mockData';
import { encryptPayload, decryptPayload, generateSafetyNumber } from '../services/crypto';
import { signaling } from '../services/signaling';
import { sound } from '../services/sound';
import { useAuth } from './AuthContext';
import { safeStorage, sanitizeForStorage, rehydrateFromStorage } from '../services/storage';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  activeChatId: string | null;
  messages: Message[];
  stories: Story[];
  setActiveChatId: (id: string | null) => void;
  sendMessage: (content: string, type?: MessageType, extra?: Partial<Message>) => Promise<void>;
  sendVoiceNote: (audioBlob: Blob, duration: number) => Promise<void>;
  sendImage: (imageDataUrl: string, caption?: string) => Promise<void>;
  sendFile: (file: File) => Promise<void>;
  startChatWithUser: (user: User) => Promise<Chat>;
  markAsRead: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
  toggleMuteChat: (chatId: string) => void;
  clearChat: (chatId: string) => void;
  addStory: (text?: string, mediaUrl?: string, bgColor?: string) => void;
  getChatSafetyNumber: (chat: Chat) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_CHATS = 'whisperwave_chats_v1';
const STORAGE_MESSAGES = 'whisperwave_messages_v1';
const STORAGE_STORIES = 'whisperwave_stories_v1';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();

  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_CHATS);
      return saved ? JSON.parse(saved) : INITIAL_CHATS;
    } catch {
      return INITIAL_CHATS;
    }
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_MESSAGES);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_STORIES);
      return saved ? JSON.parse(saved) : INITIAL_STORIES;
    } catch {
      return INITIAL_STORIES;
    }
  });

  const [activeChatId, setActiveChatId] = useState<string | null>('chat-lucas');

  // Rehydrate any large media from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    rehydrateFromStorage(messagesMap).then((restored) => {
      if (isMounted && restored) {
        setMessagesMap(restored);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Save to safeStorage (sanitizes large base64 strings so quota is NEVER exceeded)
  useEffect(() => {
    try {
      const sanitized = sanitizeForStorage(chats);
      safeStorage.setItem(STORAGE_CHATS, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('Could not save chats to storage:', err);
    }
  }, [chats]);

  useEffect(() => {
    try {
      const sanitized = sanitizeForStorage(messagesMap);
      safeStorage.setItem(STORAGE_MESSAGES, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('Could not save messages to storage:', err);
    }
  }, [messagesMap]);

  useEffect(() => {
    try {
      const sanitized = sanitizeForStorage(stories);
      safeStorage.setItem(STORAGE_STORIES, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('Could not save stories to storage:', err);
    }
  }, [stories]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChatId ? messagesMap[activeChatId] || [] : [];

  // Synchronize participants in all chats with current users directory
  useEffect(() => {
    if (!users || users.length === 0) return;
    setChats((prevChats) =>
      prevChats.map((chat) => ({
        ...chat,
        participants: chat.participants.map((p) => {
          const fresh = users.find(
            (u) => u.id === p.id || u.email.toLowerCase() === p.email.toLowerCase()
          );
          return fresh
            ? {
                ...p,
                name: fresh.name,
                avatar: fresh.avatar,
                handle: fresh.handle,
                statusText: fresh.statusText,
              }
            : p;
        }),
      }))
    );
  }, [users]);

  // Listen to incoming messages and profile updates from real-time signaling
  useEffect(() => {
    const unsubscribe = signaling.subscribe(async (sigMsg: SignalingMessage) => {
      // 1. Handle profile update from another peer
      if (sigMsg.type === 'profile-updated' && sigMsg.updatedUser) {
        const u = sigMsg.updatedUser;
        setChats((prevChats) =>
          prevChats.map((chat) => ({
            ...chat,
            participants: chat.participants.map((p) =>
              p.id === u.id || p.email.toLowerCase() === u.email.toLowerCase()
                ? {
                    ...p,
                    name: u.name,
                    avatar: u.avatar,
                    handle: u.handle,
                    statusText: u.statusText,
                  }
                : p
            ),
          }))
        );

        setMessagesMap((prevMap) => {
          let hasChanges = false;
          const nextMap: Record<string, Message[]> = {};
          for (const [cId, list] of Object.entries(prevMap)) {
            nextMap[cId] = list.map((m) => {
              if (m.senderId === u.id && m.senderName !== u.name) {
                hasChanges = true;
                return { ...m, senderName: u.name };
              }
              return m;
            });
          }
          return hasChanges ? nextMap : prevMap;
        });
      }

      // 2. Handle incoming chat message
      if (sigMsg.type === 'chat-message' && sigMsg.message) {
        const incomingMsg = sigMsg.message;

        // Skip if message was sent by ourselves
        if (incomingMsg.senderId === currentUser?.id) return;

        // Decrypt message content if cipherText is present
        let decryptedContent = incomingMsg.content;
        if (incomingMsg.cipherText && incomingMsg.iv) {
          decryptedContent = await decryptPayload(
            incomingMsg.cipherText,
            incomingMsg.iv,
            incomingMsg.chatId
          );
        }

        const resolvedMsg: Message = {
          ...incomingMsg,
          content: decryptedContent,
          status: 'delivered',
        };

        // Add message to chat
        setMessagesMap((prev) => {
          const list = prev[incomingMsg.chatId] || [];
          if (list.some((m) => m.id === resolvedMsg.id)) return prev;
          return {
            ...prev,
            [incomingMsg.chatId]: [...list, resolvedMsg],
          };
        });

        // Update chat's last message and unread count
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === incomingMsg.chatId) {
              const isCurrentlyActive = activeChatId === c.id;
              return {
                ...c,
                lastMessage: resolvedMsg,
                unreadCount: isCurrentlyActive ? 0 : c.unreadCount + 1,
              };
            }
            return c;
          })
        );

        // Play chime sound
        sound.playMessageReceived();
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeChatId]);

  const markAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
    setMessagesMap((prev) => {
      const list = prev[chatId];
      if (!list) return prev;
      return {
        ...prev,
        [chatId]: list.map((m) => ({ ...m, status: 'read' })),
      };
    });
  }, []);

  const sendMessage = async (
    content: string,
    type: Message['type'] = 'text',
    extra: Partial<Message> = {}
  ) => {
    if (!currentUser || !activeChatId) return;

    // Encrypt content with AES-256-GCM
    const { cipherText, iv } = await encryptPayload(content, activeChatId);

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      cipherText,
      iv,
      type,
      timestamp: Date.now(),
      status: 'sent',
      isEncrypted: true,
      ...extra,
    };

    // Optimistic UI update
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    // Update last message in chat list
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, lastMessage: newMsg } : c))
    );

    // Play sent pop sound
    sound.playMessageSent();

    // Broadcast through real-time signaling
    signaling.send({
      type: 'chat-message',
      message: newMsg,
      senderId: currentUser.id,
      timestamp: Date.now(),
    });
  };

  const sendVoiceNote = async (audioBlob: Blob, duration: number) => {
    // Convert audio Blob to base64 data url for storage and playback
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      await sendMessage('Nota de voz cifrada', 'audio', {
        mediaUrl: base64Audio,
        mediaDuration: Math.round(duration),
      });
    };
  };

  const sendImage = async (imageDataUrl: string, caption?: string) => {
    await sendMessage(caption || 'Foto', 'image', {
      mediaUrl: imageDataUrl,
    });
  };

  const sendFile = async (file: File) => {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const isImage = file.type.startsWith('image/');
      const msgType: MessageType = isImage ? 'image' : 'file';

      await sendMessage(file.name, msgType, {
        mediaUrl: dataUrl,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
      });
    };
  };

  const startChatWithUser = async (targetUser: User): Promise<Chat> => {
    if (!currentUser) throw new Error('Usuario no autenticado');

    // Check if chat already exists
    const existing = chats.find(
      (c) =>
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(targetUser.id)
    );

    if (existing) {
      setActiveChatId(existing.id);
      return existing;
    }

    const fingerprint = await generateSafetyNumber(currentUser.id, targetUser.id);
    const newChatId = `chat-${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      participantIds: [currentUser.id, targetUser.id],
      participants: [currentUser, targetUser],
      unreadCount: 0,
      encryptionFingerprint: fingerprint,
      createdAt: Date.now(),
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
    return newChat;
  };

  const togglePinChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const toggleMuteChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, muted: !c.muted } : c))
    );
  };

  const clearChat = (chatId: string) => {
    setMessagesMap((prev) => ({
      ...prev,
      [chatId]: [],
    }));
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, lastMessage: undefined } : c))
    );
  };

  const addStory = (text?: string, mediaUrl?: string, bgColor?: string) => {
    if (!currentUser) return;
    const newStory: Story = {
      id: `story-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      mediaUrl,
      bgColor: bgColor || '#005c4b',
      timestamp: Date.now(),
      viewed: false,
    };
    setStories((prev) => [newStory, ...prev]);
  };

  const getChatSafetyNumber = async (chat: Chat): Promise<string> => {
    if (chat.encryptionFingerprint) return chat.encryptionFingerprint;
    const p1 = chat.participantIds[0] || '1';
    const p2 = chat.participantIds[1] || '2';
    return generateSafetyNumber(p1, p2);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        activeChatId,
        messages,
        stories,
        setActiveChatId,
        sendMessage,
        sendVoiceNote,
        sendImage,
        sendFile,
        startChatWithUser,
        markAsRead,
        togglePinChat,
        toggleMuteChat,
        clearChat,
        addStory,
        getChatSafetyNumber,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
