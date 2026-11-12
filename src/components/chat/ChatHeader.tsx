import React, { useState } from 'react';
import { Chat, User } from '../../types';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, Video, ShieldCheck, MoreVertical, Trash2, ArrowLeft, Lock } from 'lucide-react';

interface ChatHeaderProps {
  chat: Chat;
  onOpenSecurityModal: () => void;
  onOpenContactInfo: () => void;
  onBackMobile?: () => void;
  onClearChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  onOpenSecurityModal,
  onOpenContactInfo,
  onBackMobile,
  onClearChat,
}) => {
  const { startCall } = useCall();
  const { currentUser, users } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  // Other participant in 1-on-1 chat, resolved with latest profile
  const rawContact = chat.participants.find((p) => p.id !== currentUser?.id) || chat.participants[0];
  const contact: User = users.find((u) => u.id === rawContact.id) || rawContact;

  const handleStartVoiceCall = () => {
    startCall(contact, 'voice');
  };

  const handleStartVideoCall = () => {
    startCall(contact, 'video');
  };

  return (
    <div className="h-16 px-4 bg-[#111c28]/95 backdrop-blur-md border-b border-[#1e2f42] flex items-center justify-between shrink-0 select-none z-10">
      {/* Contact Profile & Back Button */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackMobile && (
          <button
            onClick={onBackMobile}
            className="md:hidden p-1.5 -ml-1 text-[#94a3b8] hover:text-white rounded-xl hover:bg-[#1a2b3d]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div
          onClick={onOpenContactInfo}
          className="relative cursor-pointer shrink-0"
        >
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover border border-[#2a4058]"
          />
          {contact.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00c48c] border-2 border-[#111c28] rounded-full shadow-sm shadow-emerald-500/50" />
          )}
        </div>

        <div
          onClick={onOpenContactInfo}
          className="cursor-pointer min-w-0"
        >
          <h2 className="text-sm font-bold text-white truncate leading-tight flex items-center gap-1.5">
            <span>{contact.name}</span>
            <span className="text-[11px] font-mono text-[#00c48c] font-normal">{contact.handle}</span>
          </h2>
          <p className="text-xs text-[#94a3b8] truncate leading-tight mt-0.5 flex items-center gap-1">
            {contact.isOnline ? (
              <span className="text-[#00c48c] font-medium">en línea</span>
            ) : contact.lastSeen ? (
              `últ. vez a las ${new Date(contact.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            ) : (
              <>
                <Lock className="w-3 h-3 text-[#00c48c]" />
                <span className="text-[#00c48c]">Túnel cifrado E2EE</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Call & Security Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Encrypted Voice Call Button */}
        <button
          onClick={handleStartVoiceCall}
          className="p-2 sm:px-3 sm:py-1.5 text-[#94a3b8] hover:text-[#00c48c] hover:bg-[#192738] rounded-xl transition flex items-center gap-1.5 text-xs font-semibold border border-transparent hover:border-[#22364c]"
          title="Llamada de voz cifrada"
        >
          <Phone className="w-4 h-4 text-[#00c48c]" />
          <span className="hidden lg:inline text-white">Llamar</span>
        </button>

        {/* Encrypted Video Call Button */}
        <button
          onClick={handleStartVideoCall}
          className="p-2 sm:px-3 sm:py-1.5 text-[#94a3b8] hover:text-[#38bdf8] hover:bg-[#192738] rounded-xl transition flex items-center gap-1.5 text-xs font-semibold border border-transparent hover:border-[#22364c]"
          title="Videollamada cifrada P2P"
        >
          <Video className="w-4 h-4 text-[#38bdf8]" />
          <span className="hidden lg:inline text-white">Video</span>
        </button>

        {/* E2EE Safety Code Button */}
        <button
          onClick={onOpenSecurityModal}
          className="p-2 text-[#94a3b8] hover:text-[#00c48c] hover:bg-[#192738] rounded-xl transition"
          title="Verificar código de cifrado"
        >
          <ShieldCheck className="w-5 h-5 text-[#00c48c]" />
        </button>

        {/* Three dots menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#192738] rounded-xl transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-56 bg-[#162332] border border-[#22354a] rounded-2xl shadow-2xl py-1.5 text-sm text-[#e2e8f0] z-30 animate-in fade-in duration-100 backdrop-blur-md">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenContactInfo();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#1c2e42] transition flex items-center gap-2"
              >
                <span>Info. del contacto</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenSecurityModal();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#1c2e42] transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#00c48c]" />
                <span>Cifrado y verificación</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onClearChat?.();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#1c2e42] text-rose-400 transition flex items-center gap-2 border-t border-[#22354a]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vaciar conversación</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
