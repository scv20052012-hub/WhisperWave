export interface User {
  id: string;
  name: string;
  handle: string; // @username without phone number
  email: string;
  avatar: string;
  statusText: string;
  publicKey?: string;
  isOnline: boolean;
  lastSeen?: number;
}

export type MessageType = 'text' | 'image' | 'audio' | 'file' | 'call_log';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string; // Plaintext or decrypted content for display
  cipherText?: string; // Encrypted representation
  iv?: string; // IV for AES-GCM
  type: MessageType;
  mediaUrl?: string;
  mediaDuration?: number; // In seconds (for audio voice notes)
  fileName?: string;
  fileSize?: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isEncrypted: boolean;
  callInfo?: {
    type: 'voice' | 'video';
    duration?: number;
    status: 'missed' | 'completed' | 'declined';
  };
}

export interface Chat {
  id: string;
  participantIds: string[];
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  encryptionFingerprint: string; // 60-digit safety code
  createdAt: number;
}

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy';

export interface CallSession {
  callId: string;
  caller: User;
  callee: User;
  type: CallType;
  status: CallStatus;
  startedAt?: number;
  connectedAt?: number;
  endedAt?: number;
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  cipherSuite: string;
}

export interface CallHistoryItem {
  id: string;
  caller: User;
  callee: User;
  type: CallType;
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration?: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text?: string;
  mediaUrl?: string;
  bgColor?: string;
  timestamp: number;
  viewed: boolean;
}

export interface SignalingMessage {
  type:
    | 'call-offer'
    | 'call-answer'
    | 'call-candidate'
    | 'call-reject'
    | 'call-end'
    | 'chat-message'
    | 'user-status'
    | 'profile-updated';
  callId?: string;
  callerId?: string;
  calleeId?: string;
  callType?: CallType;
  caller?: User;
  callee?: User;
  sdp?: any;
  candidate?: any;
  message?: Message;
  updatedUser?: User;
  senderId?: string;
  timestamp?: number;
}
