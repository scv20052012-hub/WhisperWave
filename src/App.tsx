import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { CallModal } from './components/call/CallModal';
import { IncomingCallBanner } from './components/call/IncomingCallBanner';
import { LoginModal } from './components/auth/LoginModal';

function AppContent() {
  const { currentUser } = useAuth();
  const { activeChatId, setActiveChatId } = useChat();
  const [showLoginModal, setShowLoginModal] = useState(!currentUser);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b10] text-[#e2e8f0] font-sans relative">
      {/* WhisperWave Glowing Ambient Wave Gradient */}
      <div className="hidden lg:block fixed -top-24 -left-24 w-96 h-96 bg-[#00c48c]/15 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="hidden lg:block fixed -top-24 -right-24 w-96 h-96 bg-[#0ea5e9]/15 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="hidden lg:block fixed top-0 inset-x-0 h-40 bg-gradient-to-r from-[#00c48c]/15 via-[#0ea5e9]/15 to-[#2563eb]/15 pointer-events-none z-0 opacity-80" />

      {/* Main App Container */}
      <div className="relative z-10 w-full h-full lg:max-w-[1600px] lg:h-[96vh] lg:my-auto lg:mx-auto lg:rounded-3xl lg:shadow-2xl lg:shadow-black/70 overflow-hidden flex bg-[#0b1219] border border-[#1c2c3d]/70">
        {/* Sidebar - responsive display */}
        <div
          className={`h-full ${
            mobileView === 'sidebar' ? 'w-full md:w-auto flex' : 'hidden md:flex'
          }`}
        >
          <Sidebar
            onSelectChatMobile={() => {
              setMobileView('chat');
            }}
          />
        </div>

        {/* Chat Area - responsive display */}
        <div
          className={`flex-1 h-full ${
            mobileView === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatArea
            onBackMobile={() => {
              setMobileView('sidebar');
              setActiveChatId(null);
            }}
          />
        </div>
      </div>

      {/* Overlays & Modals */}
      <IncomingCallBanner />
      <CallModal />
      <LoginModal
        isOpen={!currentUser || showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <CallProvider>
          <AppContent />
        </CallProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
