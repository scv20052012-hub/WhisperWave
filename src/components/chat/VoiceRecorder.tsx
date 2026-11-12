import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(200);

        // Timer
        timerRef.current = window.setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.warn('Microphone permission blocked or failed:', err);
        // Fallback: simulate timer so user can still test voice note UX
        timerRef.current = window.setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      }
    }

    startRecording();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSend(audioBlob, Math.max(1, seconds));
      };
      mediaRecorderRef.current.stop();
    } else {
      // Mock audio blob if microphone was not available
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      onSend(emptyBlob, Math.max(1, seconds));
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full bg-[#202c33] rounded-xl px-4 py-2 border border-[#2a3942] animate-in fade-in duration-150">
      {/* Delete / Cancel button */}
      <button
        onClick={handleCancel}
        className="p-2 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
        title="Cancelar grabación"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Pulsing Red Dot & Timer */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
        <span className="font-mono text-sm text-white font-medium">{formatTime(seconds)}</span>
        <div className="hidden sm:flex items-center gap-1">
          <Mic className="w-4 h-4 text-[#00a884] animate-bounce" />
          <span className="text-xs text-[#8696a0]">Grabando audio cifrado...</span>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleStopAndSend}
        className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white transition active:scale-95 shadow-md"
        title="Enviar nota de voz"
      >
        <Send className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
};
