import React from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, PhoneOff, Video, Lock } from 'lucide-react';

export const IncomingCallBanner: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const { users } = useAuth();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';
  const rawCaller = incomingCall.caller;
  const caller = users.find((u) => u.id === rawCaller.id) || rawCaller;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-[#0e1724] border border-[#1f3144] rounded-3xl p-6 text-center text-[#e2e8f0] shadow-2xl relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#00c48c]/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-[#0ea5e9]/20 rounded-full blur-2xl" />

        {/* WhisperWave Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/20 shadow">
            <img
              src="/assets/aistudio/1794441516948_6f28ed87.jpg"
              alt="Logo"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <span className="text-xs font-black tracking-wider uppercase">
            <span className="text-[#00c48c]">WHISPER</span>
            <span className="text-[#38bdf8]">WAVE</span>
          </span>
        </div>

        {/* E2EE Lock Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c48c]/15 border border-[#00c48c]/30 text-xs text-[#00c48c] font-semibold mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>{isVideo ? 'Videollamada cifrada P2P' : 'Llamada de voz cifrada'}</span>
        </div>

        {/* Pulsing Avatar */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 rounded-full bg-[#00a884] animate-ping opacity-30" />
          <img
            src={caller.avatar}
            alt={caller.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#00a884] relative z-10 shadow-xl"
          />
        </div>

        <h3 className="text-xl font-bold text-white mb-0.5">{caller.name}</h3>
        <p className="text-xs text-[#00a884] font-mono mb-2">{caller.handle}</p>
        <p className="text-xs text-[#8696a0] mb-8">
          Te está llamando...
        </p>

        {/* Action Buttons: Decline (Red) vs Accept (Green) */}
        <div className="flex items-center justify-center gap-12">
          {/* Reject */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition transform active:scale-90"
              title="Rechazar llamada"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-[#8696a0]">Rechazar</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-[#25d366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-lg shadow-[#25d366]/30 transition transform active:scale-90 animate-bounce"
              title="Aceptar llamada"
            >
              {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </button>
            <span className="text-xs text-[#25d366] font-medium">Aceptar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
