import React, { useState } from 'react';
import { Chat } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, QrCode, Lock, X, Check, Copy } from 'lucide-react';

interface EncryptionVerificationModalProps {
  chat: Chat | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EncryptionVerificationModal: React.FC<EncryptionVerificationModalProps> = ({
  chat,
  isOpen,
  onClose,
}) => {
  const { currentUser, users } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen || !chat) return null;

  const rawOther =
    chat.participants.find((p) => p.id !== currentUser?.id) || chat.participants[0];
  const otherUser = users.find((u) => u.id === rawOther.id) || rawOther;
  const safetyNumber = chat.encryptionFingerprint || '94820 18492 73910 84920 38291 04928 84920 19382 74829 10492 84920 57391';

  // Split safety numbers into 4 rows of 3 blocks (like WhatsApp)
  const blocks = safetyNumber.split(' ');
  const rows = [
    blocks.slice(0, 3),
    blocks.slice(3, 6),
    blocks.slice(6, 9),
    blocks.slice(9, 12),
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl text-[#e9edef] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222e35] bg-[#202c33]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#00a884]" />
            <h3 className="font-semibold text-white">Verificar código de seguridad</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-[#374248] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* QR Code Container */}
          <div className="relative inline-block mx-auto p-4 bg-white rounded-2xl shadow-md mb-5">
            {/* SVG stylized QR code */}
            <svg className="w-40 h-40 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
              {/* Corner position squares */}
              <rect x="5" y="5" width="26" height="26" fill="black" />
              <rect x="9" y="9" width="18" height="18" fill="white" />
              <rect x="13" y="13" width="10" height="10" fill="black" />

              <rect x="69" y="5" width="26" height="26" fill="black" />
              <rect x="73" y="9" width="18" height="18" fill="white" />
              <rect x="77" y="13" width="10" height="10" fill="black" />

              <rect x="5" y="69" width="26" height="26" fill="black" />
              <rect x="9" y="73" width="18" height="18" fill="white" />
              <rect x="13" y="77" width="10" height="10" fill="black" />

              {/* Data modules pattern */}
              <rect x="36" y="8" width="6" height="6" fill="black" />
              <rect x="46" y="14" width="6" height="6" fill="black" />
              <rect x="56" y="8" width="6" height="6" fill="black" />
              <rect x="36" y="24" width="6" height="6" fill="black" />
              <rect x="48" y="24" width="6" height="6" fill="black" />

              <rect x="8" y="38" width="6" height="6" fill="black" />
              <rect x="20" y="44" width="6" height="6" fill="black" />
              <rect x="34" y="38" width="6" height="6" fill="black" />
              <rect x="46" y="42" width="6" height="6" fill="black" />
              <rect x="58" y="38" width="6" height="6" fill="black" />
              <rect x="70" y="44" width="6" height="6" fill="black" />
              <rect x="84" y="38" width="6" height="6" fill="black" />

              <rect x="14" y="54" width="6" height="6" fill="black" />
              <rect x="28" y="54" width="6" height="6" fill="black" />
              <rect x="42" y="54" width="6" height="6" fill="black" />
              <rect x="56" y="54" width="6" height="6" fill="black" />
              <rect x="70" y="54" width="6" height="6" fill="black" />
              <rect x="82" y="54" width="6" height="6" fill="black" />

              <rect x="36" y="68" width="6" height="6" fill="black" />
              <rect x="48" y="74" width="6" height="6" fill="black" />
              <rect x="62" y="68" width="6" height="6" fill="black" />
              <rect x="76" y="74" width="6" height="6" fill="black" />

              <rect x="42" y="84" width="6" height="6" fill="black" />
              <rect x="56" y="84" width="6" height="6" fill="black" />
              <rect x="70" y="84" width="6" height="6" fill="black" />
              <rect x="84" y="84" width="6" height="6" fill="black" />
            </svg>

            {/* Center WhisperWave Logo Badge */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md bg-[#111c28]">
                <img
                  src="/assets/aistudio/1794441516948_6f28ed87.jpg"
                  alt="WhisperWave Logo"
                  className="w-full h-full object-cover scale-[1.12]"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-[#8696a0] max-w-sm mx-auto mb-4">
            Los mensajes, llamadas de voz y videollamadas con <strong className="text-white">{otherUser.name}</strong> ({otherUser.handle}) están cifrados de extremo a extremo. Compara este número de 60 dígitos o escanea el código en su dispositivo para confirmar que nadie intercepte tu conexión.
          </p>

          {/* 60-digit WhatsApp numbers grid */}
          <div className="bg-[#202c33] border border-[#2a3942] rounded-xl p-4 font-mono text-sm tracking-wider text-white mb-5 shadow-inner">
            <div className="grid grid-cols-3 gap-y-2 text-center">
              {blocks.map((block, i) => (
                <div key={i} className="hover:text-[#00a884] transition">
                  {block}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-xs font-medium py-2.5 px-3 rounded-xl border border-[#2a3942] transition"
            >
              {copied ? <Check className="w-4 h-4 text-[#00a884]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado' : 'Copiar código'}</span>
            </button>

            <button
              onClick={() => setIsVerified(!isVerified)}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2.5 px-3 rounded-xl transition ${
                isVerified
                  ? 'bg-[#00a884]/20 border border-[#00a884] text-[#00a884]'
                  : 'bg-[#00a884] hover:bg-[#008f72] text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVerified ? 'Cifrado Verificado ✓' : 'Marcar como verificado'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
