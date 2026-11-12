import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { User } from '../../types';
import { Search, X, MessageSquare, Shield, Check, AtSign, Mail } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, findUserByHandleOrEmail } = useAuth();
  const { startChatWithUser } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter contacts excluding current user
  const availableUsers = users.filter((u) => u.id !== currentUser?.id);
  const filteredUsers = searchQuery.trim()
    ? availableUsers.filter((u) => {
        const q = searchQuery.toLowerCase().replace(/^@/, '');
        return (
          u.handle.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      })
    : availableUsers;

  const handleSelectUser = async (user: User) => {
    await startChatWithUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0f1722] border border-[#1e2f42] rounded-3xl shadow-2xl text-[#e2e8f0] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2f42] bg-[#142130]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 shadow shrink-0">
              <img
                src="/assets/aistudio/1794441516948_6f28ed87.jpg"
                alt="Logo"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Nuevo chat cifrado</h3>
              <p className="text-[11px] text-[#94a3b8]">Busca por usuario @handle o cuenta de Google</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#94a3b8] hover:text-white hover:bg-[#1f3145] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[#1e2f42]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por @usuario o correo Google..."
              autoFocus
              className="w-full bg-[#162332] border border-[#22364b] focus:border-[#00c48c] rounded-2xl pl-9 pr-4 py-2 text-sm text-white placeholder-[#64748b] focus:outline-none transition"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#222e35]/50">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="p-3.5 hover:bg-[#202c33] cursor-pointer flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#111b21] rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#00a884] transition">
                      {user.name}
                    </h4>
                    <p className="text-xs text-[#00a884] font-mono">{user.handle}</p>
                    <p className="text-[11px] text-[#8696a0] truncate max-w-[200px]">{user.statusText}</p>
                  </div>
                </div>

                <button className="px-3 py-1.5 rounded-xl bg-[#00a884]/15 hover:bg-[#00a884] text-[#00a884] hover:text-white text-xs font-medium transition flex items-center gap-1.5 border border-[#00a884]/30">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chatear</span>
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#8696a0]">
              <AtSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron usuarios con ese identificador.</p>
              <p className="text-xs mt-1 text-[#8696a0]">
                Puedes invitar contactos compartiendo tu nombre de usuario <span className="text-[#00a884]">{currentUser?.handle}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Footer */}
        <div className="p-3.5 bg-[#202c33] border-t border-[#222e35] text-[11px] text-[#8696a0] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00a884] shrink-0" />
          <span>No necesitas números de teléfono. Todas las conexiones son directas y cifradas.</span>
        </div>
      </div>
    </div>
  );
};
