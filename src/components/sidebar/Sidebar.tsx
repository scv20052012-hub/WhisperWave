import React, { useState } from 'react';
import { Chat } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { StoriesView } from './StoriesView';
import { CallsHistoryView } from './CallsHistoryView';
import { NewChatModal } from './NewChatModal';
import { ProfileModal } from '../modals/ProfileModal';
import { BrandLogo } from '../common/BrandLogo';
import {
  MessageSquare,
  Search,
  Plus,
  Pin,
  CheckCheck,
  Mic,
  Image as ImageIcon,
  FileText,
  Shield,
  X,
  Camera,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  onSelectChatMobile?: () => void;
}

type TabType = 'chats' | 'stories' | 'calls';

export const Sidebar: React.FC<SidebarProps> = ({ onSelectChatMobile }) => {
  const { currentUser, users } = useAuth();
  const { chats, activeChatId, setActiveChatId, markAsRead } = useChat();

  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'favorites'>('all');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getChatContact = (chat: Chat) => {
    const rawContact =
      chat.participants.find((p) => p.id !== currentUser?.id) || chat.participants[0];
    return users.find((u) => u.id === rawContact.id) || rawContact;
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    markAsRead(chatId);
    onSelectChatMobile?.();
  };

  const filteredChats = chats.filter((chat) => {
    const contact = getChatContact(chat);
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage?.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'unread') return chat.unreadCount > 0;
    if (filterType === 'favorites') return chat.pinned;
    return true;
  });

  const formatMessageTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[430px] h-full flex flex-col bg-[#0b1219] border-r border-[#1a2634] select-none shrink-0">
      {/* Clean Sidebar Top Header */}
      <div className="h-16 px-4 bg-[#121c27] border-b border-[#1c2c3d] flex items-center justify-between shrink-0 z-20">
        {/* User Profile Avatar & Name */}
        <div
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-3 cursor-pointer group"
          title="Ver perfil y cambiar foto"
        >
          <div className="relative">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#00c48c] shadow-md shadow-emerald-500/10"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00c48c] border-2 border-[#121c27] rounded-full" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-[#00c48c] transition leading-tight truncate">
                {currentUser?.name}
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#00c48c] leading-tight truncate">
              {currentUser?.handle}
            </p>
          </div>
        </div>

        {/* Top Action Icons: ONLY Search (🔍) and New Chat (+) */}
        <div className="flex items-center gap-1.5">
          {/* Search Icon (Toggle Search Bar) */}
          <button
            onClick={() => {
              setShowSearchBar((prev) => !prev);
              setActiveTab('chats');
            }}
            className={`p-2 rounded-xl transition ${
              showSearchBar
                ? 'text-[#00c48c] bg-[#1a2838]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1a2838]'
            }`}
            title="Buscar conversaciones o contactos"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* New Chat Button (+) */}
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#1a2838] rounded-xl transition"
            title="Nuevo chat cifrado"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Brand Watermark / Identifier */}
      <div className="px-4 py-2 bg-gradient-to-r from-[#0d1722] to-[#121f2d] border-b border-[#1a2736] flex items-center justify-between">
        <BrandLogo size="sm" showText={true} />
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00c48c] bg-[#00c48c]/10 border border-[#00c48c]/25 px-2 py-0.5 rounded-full">
          <Lock className="w-2.5 h-2.5" />
          <span>E2EE ACTIVO</span>
        </span>
      </div>

      {/* Navigation Tabs Selector: Modern Glass Segmented Pills */}
      <div className="p-2 bg-[#0c141d] border-b border-[#1a2736]">
        <div className="flex bg-[#131e2b] p-1 rounded-xl border border-[#1e2f42]">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition relative ${
              activeTab === 'chats'
                ? 'bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white shadow-md shadow-sky-500/20'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>Chats</span>
          </button>

          <button
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition relative ${
              activeTab === 'stories'
                ? 'bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white shadow-md shadow-sky-500/20'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>Estados</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition relative ${
              activeTab === 'calls'
                ? 'bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white shadow-md shadow-sky-500/20'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>Llamadas</span>
          </button>
        </div>
      </div>

      {/* Render active tab */}
      {activeTab === 'stories' ? (
        <StoriesView />
      ) : activeTab === 'calls' ? (
        <CallsHistoryView />
      ) : (
        <>
          {/* Search bar & Filter pills (Collapsible or always visible) */}
          {(showSearchBar || searchQuery) && (
            <div className="p-3 border-b border-[#1a2736] bg-[#0f1722] animate-in fade-in duration-150">
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar chat, usuario @handle o mensaje..."
                  autoFocus
                  className="w-full bg-[#162332] border border-[#24374c] focus:border-[#00c48c] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#64748b] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto text-[11px]">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    filterType === 'all'
                      ? 'bg-[#00c48c]/20 text-[#00c48c] border border-[#00c48c]/40'
                      : 'bg-[#162332] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    filterType === 'unread'
                      ? 'bg-[#00c48c]/20 text-[#00c48c] border border-[#00c48c]/40'
                      : 'bg-[#162332] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  No leídos
                </button>
                <button
                  onClick={() => setFilterType('favorites')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    filterType === 'favorites'
                      ? 'bg-[#00c48c]/20 text-[#00c48c] border border-[#00c48c]/40'
                      : 'bg-[#162332] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Favoritos
                </button>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#162332]/60">
            {filteredChats.map((chat) => {
              const contact = getChatContact(chat);
              const isSelected = chat.id === activeChatId;
              const lastMsg = chat.lastMessage;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`px-3.5 py-3 cursor-pointer flex items-center gap-3 transition ${
                    isSelected
                      ? 'bg-[#172535] border-l-4 border-[#00c48c]'
                      : 'hover:bg-[#121c27]'
                  }`}
                >
                  {/* Avatar with gradient border */}
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#223549]"
                    />
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00c48c] border-2 border-[#0b1219] rounded-full shadow-sm shadow-emerald-500/50" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {contact.name}
                      </h4>
                      <span className="text-[11px] text-[#64748b] shrink-0 font-mono">
                        {formatMessageTime(lastMsg?.timestamp || chat.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] truncate pr-2">
                        {lastMsg?.senderId === currentUser?.id && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 shrink-0 ${
                              lastMsg?.status === 'read' ? 'text-[#38bdf8]' : 'text-[#64748b]'
                            }`}
                          />
                        )}

                        {lastMsg?.type === 'audio' && (
                          <Mic className="w-3.5 h-3.5 text-[#00c48c] shrink-0" />
                        )}

                        {lastMsg?.type === 'image' && (
                          <ImageIcon className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                        )}

                        {lastMsg?.type === 'file' && (
                          <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}

                        <span className="truncate">
                          {lastMsg?.fileName || lastMsg?.content || 'Iniciar conversación cifrada'}
                        </span>
                      </div>

                      {/* Badges: Pin & Unread count */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {chat.pinned && <Pin className="w-3 h-3 text-[#64748b] fill-current" />}
                        {chat.unreadCount > 0 && (
                          <span className="px-1.5 min-w-[20px] h-5 rounded-full bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white text-[11px] font-bold flex items-center justify-center shadow-md shadow-sky-500/20">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredChats.length === 0 && (
              <div className="p-8 text-center text-[#64748b]">
                <p className="text-sm">No se encontraron chats con ese filtro.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
