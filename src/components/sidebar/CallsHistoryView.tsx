import React from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Lock, Shield } from 'lucide-react';

export const CallsHistoryView: React.FC = () => {
  const { callHistory, startCall } = useCall();
  const { currentUser, users } = useAuth();

  const formatDuration = (sec?: number) => {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Hoy a las ${time}` : `${d.toLocaleDateString()} ${time}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b1219] divide-y divide-[#172535]/50">
      {/* Security Banner */}
      <div className="p-3.5 bg-[#101a26] border-b border-[#1c2b3c] text-xs text-[#94a3b8] flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-[#00c48c] shrink-0" />
        <span>Tus llamadas de voz y video son de par a par (P2P) y están cifradas de extremo a extremo.</span>
      </div>

      {/* Call History items */}
      {callHistory.length > 0 ? (
        callHistory.map((item) => {
          const isCaller = item.caller.id === currentUser?.id;
          const rawOther = isCaller ? item.callee : item.caller;
          const otherUser = users.find((u) => u.id === rawOther.id) || rawOther;
          const isMissed = item.direction === 'missed';

          return (
            <div
              key={item.id}
              className="p-3.5 hover:bg-[#131d28] flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={otherUser.avatar}
                  alt={otherUser.name}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                />

                <div className="min-w-0">
                  <h4
                    className={`text-sm font-semibold truncate ${
                      isMissed ? 'text-rose-400' : 'text-white'
                    }`}
                  >
                    {otherUser.name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                    {item.direction === 'outgoing' ? (
                      <PhoneOutgoing className="w-3.5 h-3.5 text-[#00a884]" />
                    ) : item.direction === 'incoming' ? (
                      <PhoneIncoming className="w-3.5 h-3.5 text-[#00a884]" />
                    ) : (
                      <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                    )}

                    <span>{formatDate(item.timestamp)}</span>

                    {item.duration ? (
                      <span className="text-[#aebac1]">({formatDuration(item.duration)})</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Quick Call Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startCall(otherUser, 'voice')}
                  className="p-2 text-[#00a884] hover:bg-[#00a884]/20 rounded-full transition"
                  title="Llamada de voz cifrada"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  onClick={() => startCall(otherUser, 'video')}
                  className="p-2 text-[#25d366] hover:bg-[#25d366]/20 rounded-full transition"
                  title="Videollamada cifrada"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center text-[#8696a0]">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tienes llamadas recientes.</p>
          <p className="text-xs mt-1">Inicia una llamada de voz o videollamada desde cualquier chat.</p>
        </div>
      )}
    </div>
  );
};
