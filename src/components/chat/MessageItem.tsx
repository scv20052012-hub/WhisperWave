import React, { useState } from 'react';
import { Message, User } from '../../types';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { Check, CheckCheck, Clock, Phone, Video, Lock, PhoneMissed, PhoneIncoming, PhoneOutgoing, FileText, Download } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isOutgoing: boolean;
  sender?: User;
  onOpenImage?: (url: string) => void;
  onVerifySecurity?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOutgoing,
  sender,
  onOpenImage,
  onVerifySecurity,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusTicks = () => {
    if (!isOutgoing) return null;
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-[#8696a0]" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-[#8696a0]" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />;
      default:
        return null;
    }
  };

  // Call log message item (e.g., "Videollamada finalizada • 3 min")
  if (message.type === 'call_log' && message.callInfo) {
    const isVideo = message.callInfo.type === 'video';
    const isMissed = message.callInfo.status === 'missed';
    const durationMin = message.callInfo.duration
      ? `${Math.floor(message.callInfo.duration / 60)}m ${message.callInfo.duration % 60}s`
      : null;

    return (
      <div className="flex justify-center my-2">
        <div className="bg-[#182229] border border-[#222e35] rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-[#8696a0] shadow-sm max-w-sm">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              isMissed ? 'bg-rose-500/20 text-rose-400' : 'bg-[#00a884]/20 text-[#00a884]'
            }`}
          >
            {isVideo ? <Video className="w-4 h-4" /> : isMissed ? <PhoneMissed className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <p className="text-[#e9edef] font-medium">
              {isVideo ? 'Videollamada cifrada' : 'Llamada de voz cifrada'}{' '}
              {isMissed ? '(Perdida)' : ''}
            </p>
            <p className="text-[11px] text-[#8696a0]">
              {durationMin ? `Duración: ${durationMin}` : isMissed ? 'Sin contestar' : 'Finalizada'} • {formatTime(message.timestamp)}
            </p>
          </div>
          <span title="Llamada cifrada con DTLS-SRTP">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col mb-1.5 ${isOutgoing ? 'items-end' : 'items-start'}`}>
      <div
        onClick={() => setShowDetails(!showDetails)}
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm cursor-pointer transition select-text ${
          isOutgoing
            ? 'bg-gradient-to-r from-[#00897b] to-[#0284c7] text-white rounded-tr-xs border border-teal-300/20 shadow-md shadow-sky-950/30'
            : 'bg-[#14202c] text-[#e2e8f0] rounded-tl-xs border border-[#1f3144] shadow-md shadow-black/25'
        }`}
      >
        {/* Contact name header if incoming in group/direct */}
        {!isOutgoing && sender && (
          <p className="text-[11px] font-semibold text-[#00c48c] mb-0.5">
            {sender.name} <span className="font-mono text-[10px] text-[#64748b] font-normal">{sender.handle}</span>
          </p>
        )}

        {/* Media content */}
        {message.type === 'image' && message.mediaUrl && (
          <div className="mb-1 rounded-xl overflow-hidden max-w-xs">
            <img
              src={message.mediaUrl}
              alt="Adjunto"
              onClick={(e) => {
                e.stopPropagation();
                onOpenImage?.(message.mediaUrl!);
              }}
              className="w-full h-auto max-h-72 object-cover rounded-lg hover:opacity-95 transition cursor-pointer"
            />
          </div>
        )}

        {/* Audio Voice Note */}
        {message.type === 'audio' ? (
          <VoiceNotePlayer
            mediaUrl={message.mediaUrl}
            duration={message.mediaDuration || 7}
            senderAvatar={sender?.avatar}
            isOutgoing={isOutgoing}
          />
        ) : message.type === 'file' ? (
          <div className="mb-1 p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center gap-3 min-w-[220px] max-w-xs">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {message.fileName || message.content || 'Documento adjunto'}
              </p>
              <p className="text-[10px] text-[#8696a0] mt-0.5">
                {message.fileSize || 'Archivo'} • Cifrado
              </p>
            </div>

            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                download={message.fileName || 'archivo-descargado'}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0 active:scale-90"
                title="Descargar archivo"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-14">
            {message.content}
          </p>
        )}

        {/* Message footer: Time, Padlock & Status Ticks */}
        <div className="absolute right-2.5 bottom-1.5 flex items-center gap-1 text-[10px] text-[#8696a0] select-none">
          {message.isEncrypted && (
            <span title="Cifrado AES-256">
              <Lock className="w-2.5 h-2.5 text-[#8696a0] opacity-80" />
            </span>
          )}
          <span>{formatTime(message.timestamp)}</span>
          {renderStatusTicks()}
        </div>
      </div>

      {/* Expanded Security Card when clicking message */}
      {showDetails && (
        <div className="mt-1 px-2 py-1 bg-[#182229] border border-[#222e35] rounded-lg text-[10px] text-[#8696a0] flex items-center gap-2 animate-in fade-in duration-100">
          <Lock className="w-3 h-3 text-[#00a884]" />
          <span>Cifrado E2EE: AES-256-GCM</span>
          {message.iv && <span className="font-mono text-[9px] text-[#aebac1]">IV: {message.iv.slice(0, 8)}...</span>}
          {onVerifySecurity && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerifySecurity();
              }}
              className="text-[#00a884] hover:underline font-medium ml-1"
            >
              Verificar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
