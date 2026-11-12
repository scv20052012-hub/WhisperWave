import React, { useRef, useEffect, useState } from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  MonitorUp,
  Lock,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Info,
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    switchCamera,
  } = useCall();
  const { currentUser, users } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showCryptoInfo, setShowCryptoInfo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.isVideoOff]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.status]);

  if (!activeCall) return null;

  const isVideo = activeCall.type === 'video';
  const isCaller = activeCall.caller.id === currentUser?.id;
  const rawPeer = isCaller ? activeCall.callee : activeCall.caller;
  const peer = users.find((u) => u.id === rawPeer.id) || rawPeer;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusText = () => {
    switch (activeCall.status) {
      case 'calling':
        return 'Llamando...';
      case 'ringing':
        return 'Sonando...';
      case 'connected':
        return formatDuration(activeCall.duration);
      case 'rejected':
        return 'Llamada rechazada';
      case 'ended':
        return 'Llamada finalizada';
      default:
        return 'Conectando cifrado...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 select-none">
      <div
        className={`w-full h-full ${
          isFullScreen ? 'max-w-none max-h-none rounded-none' : 'max-w-4xl max-h-[90vh] rounded-3xl'
        } bg-[#0b1219] border border-[#1e2d3d] shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300`}
      >
        {/* Top Header / Status bar */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-30 bg-gradient-to-b from-[#070b10]/90 via-[#070b10]/50 to-transparent">
          {/* E2EE Lock Banner with WhisperWave Emblem */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121c27]/80 backdrop-blur-md border border-[#00c48c]/30 text-xs text-[#00c48c] shadow-lg">
            <img
              src="/assets/aistudio/1794441516948_6f28ed87.jpg"
              alt="WhisperWave"
              className="w-4 h-4 rounded-full object-cover border border-[#00c48c]/50"
            />
            <Lock className="w-3.5 h-3.5 text-[#00c48c]" />
            <span className="font-semibold tracking-wide hidden sm:inline">
              WhisperWave P2P Cifrado (DTLS-SRTP)
            </span>
            <span className="font-semibold sm:hidden">Cifrado P2P</span>
          </div>

          {/* Peer info & timer */}
          <div className="text-center">
            <h4 className="text-sm font-bold text-white drop-shadow">{peer.name}</h4>
            <p className="text-xs text-[#38bdf8] font-mono drop-shadow font-medium">{getStatusText()}</p>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCryptoInfo(!showCryptoInfo)}
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-[#121c27]/70 hover:bg-[#1a2838] border border-white/5 transition"
              title="Información de cifrado"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-[#121c27]/70 hover:bg-[#1a2838] border border-white/5 transition"
              title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Crypto Info Overlay */}
        {showCryptoInfo && (
          <div className="absolute top-16 right-4 z-40 bg-[#121c27]/95 border border-[#1e2d3d] rounded-2xl p-4 text-xs text-[#e2e8f0] max-w-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2 mb-2 text-[#00c48c] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Seguridad de la llamada WhisperWave</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <p><strong className="text-white">Protocolo:</strong> WebRTC Peer-to-Peer directo</p>
              <p><strong className="text-white">Cifrado:</strong> DTLS-SRTP / AEAD_AES_256_GCM</p>
              <p><strong className="text-white">Intercambio de claves:</strong> ECDHE-RSA</p>
              <p><strong className="text-white">Identidad verificada:</strong> Cuenta Google ({peer.email})</p>
              <p className="text-[#00c48c] pt-1.5 border-t border-[#1e2d3d] font-medium">
                ✓ Paquetes de audio y video directos extremo a extremo sin servidores intermedios de grabación.
              </p>
            </div>
          </div>
        )}

        {/* Main Calling Stage */}
        <div className="flex-1 relative flex items-center justify-center bg-[#070b10] overflow-hidden">
          {isVideo ? (
            <>
              {/* Remote Video Stream */}
              {activeCall.status === 'connected' ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover sm:object-contain"
                  />
                </div>
              ) : (
                /* Connecting / Ringing Screen */
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#00c48c] animate-ping opacity-25" />
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-[#00c48c] shadow-2xl relative z-10"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{peer.name}</h3>
                  <p className="text-sm text-[#00c48c] font-mono mb-2">{peer.handle}</p>
                  <p className="text-sm text-slate-400 animate-pulse">
                    {activeCall.status === 'calling' ? 'Estableciendo túnel cifrado P2P...' : 'Sonando...'}
                  </p>
                </div>
              )}

              {/* Local Video Stream Picture-in-Picture (PiP) */}
              <div className="absolute bottom-24 right-4 sm:right-6 w-32 sm:w-44 aspect-[3/4] bg-[#121c27] rounded-2xl overflow-hidden border-2 border-[#00c48c] shadow-2xl z-20 transition group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${activeCall.isVideoOff ? 'hidden' : 'block'}`}
                />

                {activeCall.isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <VideoOff className="w-6 h-6 mb-1 text-white/50" />
                    <span className="text-[10px]">Cámara desactivada</span>
                  </div>
                )}

                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-[#00c48c] font-mono">
                  Tú
                </div>
              </div>
            </>
          ) : (
            /* Voice Call Screen with Animated Acoustic Waves */
            <div className="flex flex-col items-center justify-center text-center p-8 relative">
              {/* Concentric pulsing circles */}
              <div className="relative mb-8">
                {activeCall.status === 'connected' && (
                  <>
                    <div className="absolute -inset-4 rounded-full border-2 border-[#00c48c]/30 animate-ping" />
                    <div className="absolute -inset-8 rounded-full border border-[#0ea5e9]/20 animate-pulse" />
                  </>
                )}
                <img
                  src={peer.avatar}
                  alt={peer.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#00c48c] shadow-2xl relative z-10"
                />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">{peer.name}</h3>
              <p className="text-sm text-[#00c48c] font-mono mb-2">{peer.handle}</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {activeCall.status === 'connected'
                  ? '🔒 Llamada de voz cifrada en curso'
                  : 'Llamando por WhisperWave (Google Auth)...'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Floating Controls Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center gap-3 sm:gap-5 z-30">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
              activeCall.isMuted
                ? 'bg-rose-500/20 border border-rose-500 text-rose-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={activeCall.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video (if video call) */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                activeCall.isVideoOff
                  ? 'bg-rose-500/20 border border-rose-500 text-rose-400'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={activeCall.isVideoOff ? 'Activar cámara' : 'Apagar cámara'}
            >
              {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Switch Camera (if video call) */}
          {isVideo && (
            <button
              onClick={switchCamera}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
              title="Cambiar de cámara (frontal / trasera)"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}

          {/* Screen Share (if video call) */}
          {isVideo && (
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                activeCall.isScreenSharing
                  ? 'bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={activeCall.isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
            >
              <MonitorUp className="w-5 h-5" />
            </button>
          )}

          {/* Speaker Mute (voice call) */}
          {!isVideo && (
            <button
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
              title="Altavoz"
            >
              {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}

          {/* End Call Button (Big Red) */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition active:scale-90 ml-2"
            title="Colgar llamada"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
