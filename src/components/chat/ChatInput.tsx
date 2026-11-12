import React, { useState, useRef } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  X,
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSendVoiceNote: (blob: Blob, duration: number) => void;
  onSendImage: (dataUrl: string, caption?: string) => void;
  onSendFile: (file: File) => void;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🔒', '📞', '🎥', '✨', '🙌', '🎉', '🚀', '👏', '🙏', '💯'];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendVoiceNote,
  onSendImage,
  onSendFile,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onSendImage(result, file.name);
      };
      reader.readAsDataURL(file);
    } else {
      // Send as file/video
      onSendFile(file);
    }
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  if (isRecording) {
    return (
      <div className="px-4 py-2.5 bg-[#202c33] border-t border-[#222e35]">
        <VoiceRecorder
          onSend={(blob, duration) => {
            onSendVoiceNote(blob, duration);
            setIsRecording(false);
          }}
          onCancel={() => setIsRecording(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative px-3 sm:px-4 py-2.5 bg-[#101924] border-t border-[#1b2b3d] flex items-center gap-2 select-none z-10">
      {/* Hidden file inputs */}
      <input
        ref={documentInputRef}
        type="file"
        accept="*/*"
        onChange={handleDocumentChange}
        className="hidden"
      />

      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaChange}
        className="hidden"
      />

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleDocumentChange}
        className="hidden"
      />

      {/* Attachment Popover Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-8 bg-[#162434] border border-[#24374b] rounded-2xl p-4 shadow-2xl z-30 flex flex-col gap-3 min-w-[210px] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          <div className="flex items-center justify-between pb-1 border-b border-[#24374b]">
            <span className="text-xs font-bold text-white">Adjuntar archivo cifrado</span>
            <button
              onClick={() => setShowAttachMenu(false)}
              className="text-[#94a3b8] hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Document option */}
          <button
            onClick={() => {
              documentInputRef.current?.click();
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1f3145] transition group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Documento / Archivo</p>
              <p className="text-[10px] text-[#94a3b8]">PDF, Word, Excel, ZIP, etc.</p>
            </div>
          </button>

          {/* Photos and videos */}
          <button
            onClick={() => {
              mediaInputRef.current?.click();
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1f3145] transition group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Fotos y videos</p>
              <p className="text-[10px] text-[#94a3b8]">Galería o cámara</p>
            </div>
          </button>

          {/* Audio file */}
          <button
            onClick={() => {
              audioInputRef.current?.click();
            }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1f3145] transition group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition flex items-center justify-center shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Audio / Música</p>
              <p className="text-[10px] text-[#94a3b8]">MP3, WAV, FLAC</p>
            </div>
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-[#162434] border border-[#24374b] rounded-2xl p-3 shadow-2xl z-30 max-w-xs animate-in fade-in duration-150 backdrop-blur-md">
          <p className="text-[11px] text-[#94a3b8] font-semibold mb-2">Emojis frecuentes</p>
          <div className="grid grid-cols-5 gap-2 text-2xl">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="hover:scale-125 transition active:scale-95 p-1 rounded-xl hover:bg-[#1f3145]"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Toggle Button */}
      <button
        onClick={() => {
          setShowEmojiPicker(!showEmojiPicker);
          setShowAttachMenu(false);
        }}
        className={`p-2 rounded-xl transition shrink-0 ${
          showEmojiPicker ? 'text-[#00c48c] bg-[#1a2838]' : 'text-[#94a3b8] hover:text-white hover:bg-[#1a2838]'
        }`}
        title="Emojis"
      >
        <Smile className="w-5 h-5" />
      </button>

      {/* Attachment Button */}
      <button
        onClick={() => {
          setShowAttachMenu(!showAttachMenu);
          setShowEmojiPicker(false);
        }}
        className={`p-2 rounded-xl transition shrink-0 ${
          showAttachMenu ? 'text-[#00c48c] bg-[#1a2838]' : 'text-[#94a3b8] hover:text-white hover:bg-[#1a2838]'
        }`}
        title="Adjuntar archivo o documento"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Text input */}
      <div className="flex-1 bg-[#152332] border border-[#22364b] focus-within:border-[#00c48c] rounded-2xl px-4 py-2 flex items-center transition">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje cifrado..."
          className="w-full bg-transparent text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none"
        />
      </div>

      {/* Mic or Send Button */}
      {text.trim() ? (
        <button
          onClick={handleSend}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-lg shadow-sky-500/20"
          title="Enviar mensaje"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      ) : (
        <button
          onClick={() => setIsRecording(true)}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-lg shadow-sky-500/20"
          title="Grabar nota de voz cifrada"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
