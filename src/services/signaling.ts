/**
 * Real-Time Signaling Service for WebRTC and Messages
 * Combines BroadcastChannel (instant inter-tab/inter-window communication)
 * and WebSocket / Storage events to ensure reliable call signaling and messaging.
 */

import { SignalingMessage } from '../types';

type MessageHandler = (msg: SignalingMessage) => void;

class SignalingService {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private isConnected = false;

  constructor() {
    this.initBroadcastChannel();
    this.initWebSocket();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('whisperwave-realtime-bus');
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or error:', e);
      }
    }

    // Also listen to window storage events as an extra inter-tab fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'whisperwave-signal-event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  private initWebSocket() {
    if (typeof window === 'undefined') return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch {
          // Ignore
        }
      };

      this.ws.onerror = () => {
        // Fallback to BroadcastChannel
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };
    } catch {
      // WS fallback handled by BroadcastChannel
    }
  }

  // Subscribe to incoming signaling messages
  subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(msg: SignalingMessage) {
    this.listeners.forEach((handler) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('Error handling signaling message:', err);
      }
    });
  }

  // Broadcast message to other peers/tabs/server
  send(message: SignalingMessage): void {
    // 1. Send through BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel postMessage failed:', e);
      }
    }

    // 2. Send through localStorage event fallback (only for small payloads < 15KB)
    try {
      let safeMsg = message;
      if (message.message?.mediaUrl && message.message.mediaUrl.length > 10000) {
        safeMsg = {
          ...message,
          message: {
            ...message.message,
            mediaUrl: undefined, // BroadcastChannel already handles full media
          },
        };
      }
      const serialized = JSON.stringify({
        ...safeMsg,
        _nonce: Date.now() + Math.random(),
      });
      if (serialized.length < 25000) {
        localStorage.setItem('whisperwave-signal-event', serialized);
      }
    } catch {
      // Ignore storage errors safely
    }

    // 3. Send through WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch {
        // Ignore
      }
    }
  }
}

export const signaling = new SignalingService();
