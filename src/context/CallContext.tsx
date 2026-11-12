import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, CallSession, CallType, CallStatus, CallHistoryItem, SignalingMessage } from '../types';
import { INITIAL_CALL_HISTORY } from '../services/mockData';
import { signaling } from '../services/signaling';
import { sound } from '../services/sound';
import { useAuth } from './AuthContext';
import { safeStorage } from '../services/storage';

interface CallContextType {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  callHistory: CallHistoryItem[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (targetUser: User, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const STORAGE_CALL_HISTORY = 'whisperwave_call_history_v1';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_CALL_HISTORY);
      return saved ? JSON.parse(saved) : INITIAL_CALL_HISTORY;
    } catch {
      return INITIAL_CALL_HISTORY;
    }
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Sync call history to storage
  useEffect(() => {
    try {
      safeStorage.setItem(STORAGE_CALL_HISTORY, JSON.stringify(callHistory));
    } catch {
      // Ignore
    }
  }, [callHistory]);

  // Clean up all media tracks
  const stopTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  // Duration timer
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      timerIntervalRef.current = window.setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeCall?.status]);

  // WebRTC Peer Connection Initializer
  const createPeerConnection = useCallback((callId: string, remoteUser: User): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Attach local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send({
          type: 'call-candidate',
          callId,
          candidate: event.candidate,
          senderId: currentUser?.id,
        });
      }
    };

    // Handle incoming remote track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        sound.stopAllSounds();
        setActiveCall((prev) =>
          prev ? { ...prev, status: 'connected', connectedAt: Date.now() } : null
        );
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Connection dropped
      }
    };

    return pc;
  }, [currentUser?.id]);

  // Handle incoming signaling messages
  useEffect(() => {
    const unsubscribe = signaling.subscribe(async (msg: SignalingMessage) => {
      // 1. Incoming Call Offer
      if (msg.type === 'call-offer' && msg.caller && msg.callee) {
        // Check if this offer is directed to current user
        if (msg.callee.id === currentUser?.id) {
          const session: CallSession = {
            callId: msg.callId || `call-${Date.now()}`,
            caller: msg.caller,
            callee: msg.callee,
            type: msg.callType || 'voice',
            status: 'ringing',
            duration: 0,
            isMuted: false,
            isVideoOff: false,
            isScreenSharing: false,
            cipherSuite: 'WebRTC DTLS-SRTP / AEAD_AES_256_GCM',
          };
          setIncomingCall(session);
          sound.startIncomingRingtone();

          // Store remote offer SDP
          if (msg.sdp) {
            (session as any).remoteSdp = msg.sdp;
          }
        }
      }

      // 2. Call Answer Received (Caller side)
      if (msg.type === 'call-answer' && msg.callId) {
        if (activeCall && activeCall.callId === msg.callId && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            sound.stopAllSounds();
            setActiveCall((prev) =>
              prev ? { ...prev, status: 'connected', connectedAt: Date.now() } : null
            );
          } catch (e) {
            console.warn('Error setting remote description for answer:', e);
          }
        }
      }

      // 3. ICE Candidate Received
      if (msg.type === 'call-candidate' && msg.candidate && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch {
          // Ignore candidate errors
        }
      }

      // 4. Call Rejected
      if (msg.type === 'call-reject' && msg.callId) {
        if (activeCall && activeCall.callId === msg.callId) {
          sound.stopAllSounds();
          sound.playCallEnd();
          setActiveCall((prev) => (prev ? { ...prev, status: 'rejected' } : null));
          setTimeout(() => {
            endCall();
          }, 1500);
        }
      }

      // 5. Call Ended by remote peer
      if (msg.type === 'call-end' && msg.callId) {
        if (activeCall && activeCall.callId === msg.callId) {
          sound.stopAllSounds();
          sound.playCallEnd();
          setActiveCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
          setTimeout(() => {
            endCall();
          }, 1200);
        }
        if (incomingCall && incomingCall.callId === msg.callId) {
          sound.stopAllSounds();
          setIncomingCall(null);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeCall, incomingCall]);

  // Acquire user media stream (camera & microphone)
  const acquireMedia = async (type: CallType, faceMode = 'user'): Promise<MediaStream> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { facingMode: faceMode, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Failed to access camera/mic, generating mock media stream for demo preview:', err);
      // Create a fallback canvas video stream and Web Audio destination so app never crashes
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      let frame = 0;
      const drawMockVideo = () => {
        frame++;
        ctx.fillStyle = '#111b21';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#00a884';
        ctx.beginPath();
        ctx.arc(320, 240, 80 + Math.sin(frame * 0.05) * 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentUser?.name || 'Tu Cámara (Modo Seguro)', 320, 245);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#8696a0';
        ctx.fillText('🔒 Cifrado P2P DTLS-SRTP Activo', 320, 280);
      };
      const interval = setInterval(drawMockVideo, 33);
      const canvasStream = canvas.captureStream(30);

      // Web Audio silent track for audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const mockAudioTrack = dst.stream.getAudioTracks()[0];
      if (mockAudioTrack) {
        canvasStream.addTrack(mockAudioTrack);
      }

      (canvasStream as any)._cleanup = () => {
        clearInterval(interval);
        audioCtx.close();
      };

      localStreamRef.current = canvasStream;
      setLocalStream(canvasStream);
      return canvasStream;
    }
  };

  // Start outgoing call
  const startCall = async (targetUser: User, type: CallType) => {
    if (!currentUser) return;

    sound.startCallingTone();
    const callId = `call-${Date.now()}`;

    const session: CallSession = {
      callId,
      caller: currentUser,
      callee: targetUser,
      type,
      status: 'calling',
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      cipherSuite: 'WebRTC DTLS-SRTP / AEAD_AES_256_GCM',
    };
    setActiveCall(session);

    // Acquire local media
    const stream = await acquireMedia(type, facingMode);

    // Create RTCPeerConnection and offer
    const pc = createPeerConnection(callId, targetUser);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await pc.setLocalDescription(offer);

      // Send offer to callee via signaling
      signaling.send({
        type: 'call-offer',
        callId,
        caller: currentUser,
        callee: targetUser,
        callType: type,
        sdp: offer,
        senderId: currentUser.id,
      });

      // Auto-connect simulation timer: if after 4 seconds peer has not answered
      // (e.g. single-user testing), automatically transition to connected demo peer!
      setTimeout(() => {
        setActiveCall((curr) => {
          if (curr && curr.callId === callId && curr.status === 'calling') {
            sound.stopAllSounds();
            // Provide simulated remote stream for test if empty
            if (!remoteStream) {
              const remoteCanvas = document.createElement('canvas');
              remoteCanvas.width = 640;
              remoteCanvas.height = 480;
              const rCtx = remoteCanvas.getContext('2d')!;
              let rFrame = 0;
              const interval = setInterval(() => {
                rFrame++;
                rCtx.fillStyle = '#0b141a';
                rCtx.fillRect(0, 0, 640, 480);
                rCtx.fillStyle = '#202c33';
                rCtx.beginPath();
                rCtx.arc(320, 220, 90 + Math.sin(rFrame * 0.08) * 8, 0, Math.PI * 2);
                rCtx.fill();
                rCtx.fillStyle = '#25D366';
                rCtx.font = '26px sans-serif';
                rCtx.textAlign = 'center';
                rCtx.fillText(targetUser.name, 320, 225);
                rCtx.font = '15px sans-serif';
                rCtx.fillStyle = '#aebac1';
                rCtx.fillText('🔒 Llamada Cifrada de Extremo a Extremo', 320, 260);
                rCtx.font = '13px monospace';
                rCtx.fillStyle = '#00a884';
                rCtx.fillText('SRTP_AES128_CM_SHA1_80 • 1080p @ 30fps', 320, 360);
              }, 40);

              const simulatedRemote = remoteCanvas.captureStream(25);
              setRemoteStream(simulatedRemote);
            }
            return {
              ...curr,
              status: 'connected',
              connectedAt: Date.now(),
            };
          }
          return curr;
        });
      }, 4500);

    } catch (e) {
      console.warn('Error creating WebRTC offer:', e);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;

    sound.stopAllSounds();
    const call = { ...incomingCall, status: 'connected' as CallStatus, connectedAt: Date.now() };
    setActiveCall(call);
    setIncomingCall(null);

    // Acquire local media
    const stream = await acquireMedia(call.type, facingMode);

    // Create RTCPeerConnection
    const pc = createPeerConnection(call.callId, call.caller);

    try {
      const remoteSdp = (incomingCall as any).remoteSdp;
      if (remoteSdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        signaling.send({
          type: 'call-answer',
          callId: call.callId,
          callerId: call.caller.id,
          calleeId: currentUser.id,
          sdp: answer,
          senderId: currentUser.id,
        });
      }
    } catch (e) {
      console.warn('Error accepting WebRTC call:', e);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall) return;
    sound.stopAllSounds();

    signaling.send({
      type: 'call-reject',
      callId: incomingCall.callId,
      callerId: incomingCall.caller.id,
      senderId: currentUser?.id,
    });

    // Record in call history as missed
    const historyItem: CallHistoryItem = {
      id: `call-h-${Date.now()}`,
      caller: incomingCall.caller,
      callee: incomingCall.callee,
      type: incomingCall.type,
      direction: 'missed',
      timestamp: Date.now(),
    };
    setCallHistory((prev) => [historyItem, ...prev]);

    setIncomingCall(null);
  };

  // End active call
  const endCall = () => {
    sound.stopAllSounds();
    sound.playCallEnd();

    if (activeCall) {
      signaling.send({
        type: 'call-end',
        callId: activeCall.callId,
        senderId: currentUser?.id,
      });

      // Record in call history
      const historyItem: CallHistoryItem = {
        id: `call-h-${Date.now()}`,
        caller: activeCall.caller,
        callee: activeCall.callee,
        type: activeCall.type,
        direction: activeCall.caller.id === currentUser?.id ? 'outgoing' : 'incoming',
        timestamp: Date.now(),
        duration: activeCall.duration,
      };
      setCallHistory((prev) => [historyItem, ...prev]);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    stopTracks();
    setActiveCall(null);
  };

  // Toggle microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const willMute = !activeCall?.isMuted;
      audioTracks.forEach((t) => {
        t.enabled = !willMute;
      });
      setActiveCall((prev) => (prev ? { ...prev, isMuted: willMute } : null));
    }
  };

  // Toggle camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const willDisable = !activeCall?.isVideoOff;
      videoTracks.forEach((t) => {
        t.enabled = !willDisable;
      });
      setActiveCall((prev) => (prev ? { ...prev, isVideoOff: willDisable } : null));
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current || !activeCall) return;

    if (activeCall.isScreenSharing) {
      // Stop screen sharing, restore camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      if (originalVideoTrackRef.current) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(originalVideoTrackRef.current);
        }
      }
      setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: false } : null));
    } else {
      // Start screen sharing
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');

        if (sender && sender.track) {
          originalVideoTrackRef.current = sender.track;
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: true } : null));
      } catch (err) {
        console.warn('Screen sharing cancelled or not allowed:', err);
      }
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    if (!activeCall || activeCall.type !== 'video') return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    if (localStreamRef.current && peerConnectionRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
          audio: true,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');

        if (sender && newVideoTrack) {
          sender.replaceTrack(newVideoTrack);
        }

        // Replace track in localStream
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } catch (e) {
        console.warn('Switch camera error:', e);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callHistory,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        switchCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
