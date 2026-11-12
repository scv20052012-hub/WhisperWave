import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { ChatHeader } from './ChatHeader';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { EncryptionVerificationModal } from '../modals/EncryptionVerificationModal';
import { BrandLogo } from '../common/BrandLogo';
import {
  Shield,
  Lock,
  Laptop,
  X,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';

interface ChatAreaProps {
  onBackMobile?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBackMobile }) => {
  const { activeChat, messages, sendMessage, sendVoiceNote, sendImage, sendFile, clearChat } = useChat();
  const { currentUser, users } = useAuth();
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state when no chat is active
  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gradient-to-b from-[#0b1219] via-[#0f1722] to-[#080d14] text-center p-8 select-none relative overflow-hidden">
        {/* Ambient background glow rings */}
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-[#00c48c]/10 to-[#0ea5e9]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Official WhisperWave Badge */}
        <div className="relative mb-6 group cursor-default">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#00c48c] via-[#0ea5e9] to-[#3b82f6] opacity-30 blur-xl group-hover:opacity-50 transition duration-500" />
          <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#111c28]">
            <img
              src="/assets/aistudio/1794441516948_6f28ed87.jpg"
              alt="WhisperWave Logo"
              className="w-full h-full object-cover scale-[1.08]"
            />
          </div>
        </div>

        {/* Brand Name with Teal-to-Blue Gradient */}
        <h1 className="text-3xl font-black tracking-wider uppercase mb-2">
          <span className="text-[#00c48c]">WHISPER</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6]">WAVE</span>
        </h1>

        <p className="text-sm text-[#94a3b8] max-w-md leading-relaxed mb-8">
          Mensajería privada y videollamadas peer-to-peer cifradas con tecnología cuántica y acceso con cuenta de Google sin requerir tu número telefónico.
        </p>

        {/* 3 Pillars of WhisperWave */}
        <div className="grid grid-cols-3 gap-4 max-w-lg w-full mb-8">
          <div className="bg-[#121c27]/80 border border-[#1e2f42] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-[#00c48c]/15 text-[#00c48c] flex items-center justify-center mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white mb-0.5">E2EE Total</span>
            <span className="text-[10px] text-[#64748b]">Claves AES-256 en tu cliente</span>
          </div>

          <div className="bg-[#121c27]/80 border border-[#1e2f42] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-[#0ea5e9]/15 text-[#0ea5e9] flex items-center justify-center mb-2">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white mb-0.5">Voz & Video P2P</span>
            <span className="text-[10px] text-[#64748b]">DTLS-SRTP sin servidores espía</span>
          </div>

          <div className="bg-[#121c27]/80 border border-[#1e2f42] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <div className="w-8 h-8 rounded-xl bg-[#3b82f6]/15 text-[#3b82f6] flex items-center justify-center mb-2">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white mb-0.5">Sin Celular</span>
            <span className="text-[10px] text-[#64748b]">Solo Google + @handle</span>
          </div>
        </div>

        {/* Bottom subtle assurance */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121c27] border border-[#1e2f42] text-xs text-[#94a3b8]">
          <Laptop className="w-3.5 h-3.5 text-[#00c48c]" />
          <span>Sincronización segura entre dispositivos vía WebRTC</span>
        </div>
      </div>
    );
  }

  const rawOtherUser =
    activeChat.participants.find((p) => p.id !== currentUser?.id) || activeChat.participants[0];
  const otherUser = users.find((u) => u.id === rawOtherUser.id) || rawOtherUser;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d14] relative overflow-hidden">
      {/* Chat Header */}
      <ChatHeader
        chat={activeChat}
        onOpenSecurityModal={() => setShowSecurityModal(true)}
        onOpenContactInfo={() => setShowContactInfo(!showContactInfo)}
        onBackMobile={onBackMobile}
        onClearChat={() => clearChat(activeChat.id)}
      />

      {/* Main chat body with custom WhisperWave wave-mesh background */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-8 py-4 relative z-0">
          {/* Subtle cyber-wave lines background */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #0ea5e9 1px, transparent 1px), linear-gradient(135deg, rgba(0, 196, 140, 0.1) 0%, transparent 100%)`,
              backgroundSize: '32px 32px, 100% 100%',
            }}
          />

          {/* E2EE Safety Banner (Refined WhisperWave Emerald-Cyan Badge) */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowSecurityModal(true)}
              className="bg-[#111c28]/90 hover:bg-[#162433] border border-[#1e3247] text-[#38bdf8] text-xs rounded-2xl px-4 py-2 max-w-md text-center shadow-lg transition flex items-center gap-2.5 backdrop-blur-md"
            >
              <div className="w-5 h-5 rounded-full bg-[#00c48c]/20 text-[#00c48c] flex items-center justify-center shrink-0">
                <Lock className="w-3 h-3" />
              </div>
              <span className="leading-snug text-left">
                Túnel cifrado con <strong className="text-white">{otherUser.name}</strong>. Nadie externo puede descifrar mensajes ni llamadas. <span className="underline font-semibold text-[#00c48c]">Verificar claves.</span>
              </span>
            </button>
          </div>

          {/* Date separator */}
          <div className="flex justify-center mb-4">
            <span className="bg-[#121c27] border border-[#1e2f42] text-[#64748b] text-[11px] font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Hoy
            </span>
          </div>

          {/* Messages List */}
          <div className="flex-1 flex flex-col justify-end">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isOutgoing={msg.senderId === currentUser?.id}
                sender={
                  users.find((u) => u.id === msg.senderId) ||
                  activeChat.participants.find((p) => p.id === msg.senderId)
                }
                onOpenImage={(url) => setExpandedImage(url)}
                onVerifySecurity={() => setShowSecurityModal(true)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Contact Info Drawer */}
        {showContactInfo && (
          <div className="w-80 bg-[#0e1622] border-l border-[#1a2736] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 z-20">
            <div className="p-4 border-b border-[#1a2736] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Info. del contacto</h3>
              <button
                onClick={() => setShowContactInfo(false)}
                className="p-1 rounded-full text-[#94a3b8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center border-b border-[#1a2736]">
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-[#00c48c] mb-3 shadow-lg shadow-emerald-500/10"
              />
              <h4 className="font-bold text-white text-lg">{otherUser.name}</h4>
              <p className="text-xs text-[#00c48c] font-mono mt-0.5">{otherUser.handle}</p>
              <p className="text-xs text-[#94a3b8] mt-1">{otherUser.email}</p>
            </div>

            <div className="p-4 border-b border-[#1a2736]">
              <p className="text-xs text-[#64748b] font-medium mb-1">Estado / Info</p>
              <p className="text-sm text-white">{otherUser.statusText}</p>
            </div>

            {/* Encryption & Security Card */}
            <div className="p-4 border-b border-[#1a2736]">
              <button
                onClick={() => setShowSecurityModal(true)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-2xl bg-[#141f2d] hover:bg-[#1a293b] border border-[#203144] transition"
              >
                <ShieldCheck className="w-5 h-5 text-[#00c48c] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-white">Cifrado de extremo a extremo</h5>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    Toca para inspeccionar el código de seguridad de 60 dígitos
                  </p>
                </div>
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-[#64748b] font-medium mb-1">Identidad WhisperWave</p>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Este usuario está autenticado mediante su cuenta de Google verificada sin exponer su número telefónico.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <ChatInput
        onSendMessage={(text) => sendMessage(text)}
        onSendVoiceNote={(blob, duration) => sendVoiceNote(blob, duration)}
        onSendImage={(url, caption) => sendImage(url, caption)}
        onSendFile={(file) => sendFile(file)}
      />

      {/* Security Verification Modal */}
      <EncryptionVerificationModal
        chat={activeChat}
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      {/* Image preview modal */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
        >
          <img
            src={expandedImage}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
