import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Story } from '../../types';
import { Plus, X, Lock, Sparkles, ChevronRight, Check } from 'lucide-react';

export const StoriesView: React.FC = () => {
  const { stories, addStory } = useChat();
  const { currentUser, users } = useAuth();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedBg, setSelectedBg] = useState('#005c4b');

  const bgColors = ['#005c4b', '#128c7e', '#1f2c34', '#70388a', '#c2410c', '#0284c7'];

  // Auto-advance stories when viewer is open
  useEffect(() => {
    if (activeStoryIndex === null) return;
    const timer = setTimeout(() => {
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex((prev) => (prev !== null ? prev + 1 : null));
      } else {
        setActiveStoryIndex(null);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [activeStoryIndex, stories.length]);

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim()) return;
    addStory(statusText.trim(), undefined, selectedBg);
    setStatusText('');
    setShowCreateModal(false);
  };

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div className="flex-1 overflow-y-auto bg-[#111b21] divide-y divide-[#222e35]/60">
      {/* My Status */}
      <div
        onClick={() => setShowCreateModal(true)}
        className="p-4 hover:bg-[#202c33] cursor-pointer flex items-center gap-3 transition"
      >
        <div className="relative">
          <img
            src={currentUser?.avatar}
            alt="Mi Estado"
            className="w-12 h-12 rounded-full object-cover border-2 border-[#1e2f42]"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-[#00c48c] to-[#0ea5e9] text-white flex items-center justify-center border-2 border-[#0b1219] shadow-md shadow-sky-500/20">
            <Plus className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white">Mi estado</h4>
          <p className="text-xs text-[#94a3b8]">Añade una actualización a tu estado</p>
        </div>
      </div>

      {/* Security notice */}
      <div className="p-3 bg-[#101a26] border-y border-[#1c2c3e] text-[11px] text-[#94a3b8] flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-[#00c48c] shrink-0" />
        <span>Tus actualizaciones de estado están cifradas de extremo a extremo y desaparecen tras 24h.</span>
      </div>

      {/* Recent Updates Header */}
      <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#38bdf8]">
        Recientes
      </div>

      {/* Stories List */}
      <div className="divide-y divide-[#222e35]/30">
        {stories.map((story, idx) => {
          const storyUser = users.find((u) => u.id === story.userId);
          const authorAvatar = storyUser?.avatar || story.userAvatar;
          const authorName = storyUser?.name || story.userName;

          return (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(idx)}
              className="p-3.5 hover:bg-[#202c33] cursor-pointer flex items-center gap-3.5 transition group"
            >
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#00c48c] to-[#0ea5e9] shrink-0">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-full h-full rounded-full object-cover border-2 border-[#111b21]"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-semibold text-white group-hover:text-[#00c48c] transition truncate">
                  {authorName}
                </h5>
                <p className="text-xs text-[#8696a0]">
                  {new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-[#8696a0] group-hover:text-white transition" />
            </div>
          );
        })}
      </div>

      {/* Full-Screen Story Viewer Modal */}
      {activeStory && (() => {
        const activeStoryUser = users.find((u) => u.id === activeStory.userId);
        const modalAvatar = activeStoryUser?.avatar || activeStory.userAvatar;
        const modalName = activeStoryUser?.name || activeStory.userName;

        return (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
            <div
              className="w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden relative shadow-2xl flex flex-col"
              style={{ backgroundColor: activeStory.bgColor || '#111b21' }}
            >
              {/* Top Progress Bars */}
              <div className="absolute top-3 inset-x-3 flex gap-1 z-20">
                {stories.map((s, i) => (
                  <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-white transition-all duration-300 ${
                        i < (activeStoryIndex || 0)
                          ? 'w-full'
                          : i === activeStoryIndex
                          ? 'w-full animate-pulse'
                          : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header */}
              <div className="absolute top-6 inset-x-4 flex items-center justify-between z-20 text-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={modalAvatar}
                    alt={modalName}
                    className="w-9 h-9 rounded-full object-cover border border-white/50"
                  />
                  <div>
                    <h4 className="text-sm font-semibold leading-tight">{modalName}</h4>
                    <p className="text-[10px] text-white/70">
                      {new Date(activeStory.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Story Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white relative">
              {activeStory.mediaUrl ? (
                <img
                  src={activeStory.mediaUrl}
                  alt="Historia"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}

              {activeStory.text && (
                <div className="relative z-10 p-6 rounded-2xl bg-black/30 backdrop-blur-sm max-w-xs text-lg font-medium leading-relaxed">
                  {activeStory.text}
                </div>
              )}
            </div>

            {/* Story Footer */}
            <div className="p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center text-xs text-white/80 gap-1.5 z-20">
              <Lock className="w-3.5 h-3.5 text-[#00a884]" />
              <span>Cifrado de extremo a extremo</span>
            </div>
          </div>
        </div>
      );
    })()}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl text-white relative flex flex-col"
            style={{ backgroundColor: selectedBg }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Nuevo estado de 24 horas</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full bg-black/30 hover:bg-black/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="¿Qué estás pensando hoy? Escribe algo..."
              rows={4}
              autoFocus
              className="w-full bg-black/30 border border-white/20 rounded-xl p-3 text-white placeholder-white/60 text-base focus:outline-none mb-4 resize-none"
            />

            {/* Color palette selector */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {bgColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedBg(color)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    selectedBg === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              onClick={handleCreateStatus}
              disabled={!statusText.trim()}
              className="w-full bg-white text-gray-900 font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#00a884]" />
              <span>Publicar estado cifrado</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
