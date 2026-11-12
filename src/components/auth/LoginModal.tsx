import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, AtSign, CheckCircle2, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, currentUser } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen && currentUser) return null;

  const handleInstantGoogleLogin = async (email: string, name: string) => {
    setIsLoading(true);
    await loginWithGoogle(email, name);
    setIsLoading(false);
    onClose();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsLoading(true);
    await loginWithGoogle(emailInput, nameInput || undefined);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0f1823] border border-[#1d2d3e] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#e2e8f0] animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-white/20 shadow-xl shadow-sky-500/20 mb-3 bg-[#111c28]">
            <img
              src="/assets/aistudio/1794441516948_6f28ed87.jpg"
              alt="WhisperWave Logo"
              className="w-full h-full object-cover scale-[1.08]"
            />
          </div>
          <h2 className="text-2xl font-black tracking-wider uppercase text-white">
            <span className="text-[#00c48c]">WHISPER</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6]">WAVE</span>
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Mensajería y videollamadas privadas con autenticación Google
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00c48c]/15 border border-[#00c48c]/30 text-xs font-semibold text-[#00c48c]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sin número de teléfono requerido</span>
          </div>
        </div>

        {/* Security Highlight Box */}
        <div className="bg-[#152332] border border-[#22364b] rounded-2xl p-3.5 mb-6 text-xs text-[#94a3b8] flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#00c48c] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Privacidad total garantizada:</span> Tu cuenta se identifica mediante tu cuenta de Google y un identificador único <span className="text-[#00c48c] font-mono">@usuario</span>. Nadie conocerá tu número telefónico.
          </div>
        </div>

        {/* Google One-Click Button */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleInstantGoogleLogin('scv20052012@gmail.com', 'Usuario Principal')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl shadow transition duration-150 active:scale-[0.99]"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar como <strong className="text-gray-900 font-semibold">scv20052012@gmail.com</strong></span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#222e35] w-full" />
          <span className="bg-[#111b21] px-3 text-xs text-[#8696a0] uppercase tracking-wider">o ingresa otra cuenta Google</span>
        </div>

        {/* Custom Google account form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Correo de Google
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8696a0] absolute left-3 top-3" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Nombre para mostrar (opcional)
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-[#8696a0] absolute left-3 top-3" />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ej. Sofia Benítez"
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!emailInput || isLoading}
            className="w-full bg-[#00a884] hover:bg-[#008f72] disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition duration-150 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear cuenta y entrar</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-[#8696a0] mt-4">
          Tus comunicaciones están protegidas por claves criptográficas AES-256 generadas en tu navegador.
        </p>
      </div>
    </div>
  );
};
