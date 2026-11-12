import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Check,
  Camera,
  Upload,
  Shield,
  Mail,
  AtSign,
  User as UserIcon,
  RefreshCw,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, logout, users, switchUser } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [statusText, setStatusText] = useState(currentUser?.statusText || '');
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen || !currentUser) return null;

  // Handle uploading image file from disk / gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 to optimize memory
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Draw cropped square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatarPreview(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start webcam for taking selfie
  const startCamera = async () => {
    try {
      setIsTakingPhoto(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 400 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied:', err);
      setIsTakingPhoto(false);
    }
  };

  // Capture snapshot from webcam
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setAvatarPreview(dataUrl);
    stopCamera();
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsTakingPhoto(false);
  };

  const handleAvatarSelect = (seed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setAvatarPreview(newAvatar);
  };

  const handleSave = () => {
    updateProfile({
      name: name.trim() || currentUser.name,
      statusText: statusText.trim() || currentUser.statusText,
      avatar: avatarPreview || currentUser.avatar,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl text-[#e9edef] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222e35] bg-[#202c33] shrink-0">
          <h3 className="font-semibold text-white">Perfil y Foto</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-[#374248] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            {isTakingPhoto ? (
              /* Webcam live video box */
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-[#00a884] shadow-xl mb-3 bg-black flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 inset-x-2 flex gap-2 justify-center">
                  <button
                    onClick={captureSnapshot}
                    className="px-3 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#008f72] text-white text-xs font-semibold shadow-md transition"
                  >
                    Tomar foto
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* Profile Photo Preview */
              <div className="relative group mb-3">
                <img
                  src={avatarPreview}
                  alt={currentUser.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#00a884] shadow-xl"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">Cambiar</span>
                </button>
              </div>
            )}

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-xs font-medium text-white flex items-center gap-1.5 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-[#00a884]" />
                <span>Subir foto</span>
              </button>

              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-xs font-medium text-white flex items-center gap-1.5 transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-[#25d366]" />
                <span>Tomar foto</span>
              </button>
            </div>

            {/* Quick Preset Avatars */}
            <div className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-3 text-center">
              <p className="text-[11px] text-[#8696a0] font-medium mb-2 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#00a884]" />
                <span>O elige un avatar prediseñado:</span>
              </p>
              <div className="flex justify-center gap-2.5">
                {['Felix', 'Luna', 'Alex', 'Milo', 'Zara', 'Leo', 'Nova'].map((seed) => (
                  <button
                    key={seed}
                    onClick={() => handleAvatarSelect(seed)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-[#2a3942] hover:border-[#00a884] hover:scale-110 transition shrink-0"
                    title={`Avatar ${seed}`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      alt={seed}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Identifiers (Google Email & No Phone Badge) */}
          <div className="bg-[#121c27] border border-[#1e2d3d] rounded-2xl p-3.5 mb-5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-[#00c48c]" />
              <span>Cuenta de Google:</span>
              <strong className="text-white ml-auto font-mono truncate max-w-[180px]">{currentUser.email}</strong>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AtSign className="w-4 h-4 text-[#00c48c]" />
              <span>Identificador único:</span>
              <span className="text-[#38bdf8] ml-auto font-mono font-semibold">
                {currentUser.handle}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 border-t border-[#1e2d3d]">
              <Shield className="w-4 h-4 text-[#00c48c]" />
              <span className="text-slate-300">Número telefónico:</span>
              <span className="text-[#00c48c] font-medium ml-auto">No requerido (Protegido)</span>
            </div>
          </div>

          {/* Profile Name & Bio Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tu nombre
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121c27] border border-[#1e2d3d] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#00c48c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Info. / Estado
              </label>
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="¡Hola! Estoy usando WhisperWave."
                className="w-full bg-[#121c27] border border-[#1e2d3d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00c48c]"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] hover:opacity-90 text-white font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/10 active:scale-[0.99]"
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              <span>{isSaved ? '¡Perfil y foto guardados!' : 'Guardar cambios'}</span>
            </button>
          </div>

          {/* Test Users Quick Switcher */}
          {users.filter((u) => u.id !== currentUser.id).length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#1e2d3d]">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Probar como otro usuario (para llamadas de 2 vías):
              </label>
              <div className="space-y-1.5">
                {users
                  .filter((u) => u.id !== currentUser.id)
                  .map((other) => (
                    <button
                      key={other.id}
                      onClick={() => {
                        stopCamera();
                        switchUser(other.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#121c27] hover:bg-[#1a2838] border border-[#1e2d3d] text-xs transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="w-7 h-7 rounded-full object-cover border border-[#00c48c]/30"
                        />
                        <div className="text-left">
                          <p className="text-white font-medium group-hover:text-[#00c48c] transition">
                            {other.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{other.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#38bdf8]">
                        Cambiar →
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Logout button */}
          <div className="mt-5 pt-3 border-t border-[#1e2d3d] text-center">
            <button
              onClick={() => {
                stopCamera();
                logout();
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 transition"
            >
              Cerrar sesión de Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
