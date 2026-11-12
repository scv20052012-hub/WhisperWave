import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface VoiceNotePlayerProps {
  mediaUrl?: string;
  duration?: number;
  senderAvatar?: string;
  isOutgoing: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaUrl,
  duration = 7,
  senderAvatar,
  isOutgoing,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate a mock waveform height array for visual authenticity
  const waveformBars = useRef<number[]>(
    Array.from({ length: 28 }, (_, i) => Math.max(20, Math.sin(i * 0.4) * 50 + 40 + (i % 3) * 10))
  ).current;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current && mediaUrl) {
      audioRef.current = new Audio(mediaUrl);
    }
    const audio = audioRef.current;

    if (!audio) {
      // If no real audio file, simulate play progress for demo
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        let cur = currentTime;
        const interval = setInterval(() => {
          cur += 0.5 * playbackRate;
          if (cur >= duration) {
            clearInterval(interval);
            setIsPlaying(false);
            setCurrentTime(0);
          } else {
            setCurrentTime(cur);
          }
        }, 500);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {
        // Fallback simulation if browser blocks auto-play
      });
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[240px] max-w-[320px]">
      {/* Audio element for real playback */}
      {mediaUrl ? <audio ref={audioRef} src={mediaUrl} preload="metadata" /> : null}

      {/* Speaker Avatar with Mic badge */}
      <div className="relative shrink-0">
        <img
          src={senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00a884] flex items-center justify-center border border-[#111b21]">
          <Mic className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
          isOutgoing
            ? 'bg-[#25d366] text-[#111b21] hover:bg-[#20ba5a]'
            : 'bg-[#00a884] text-white hover:bg-[#008f72]'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Duration */}
      <div className="flex-1">
        <div className="flex items-center gap-0.5 h-7">
          {waveformBars.map((height, idx) => {
            const barProgress = (idx / waveformBars.length) * 100;
            const isFilled = barProgress <= progressPercent;
            return (
              <div
                key={idx}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-colors duration-150 ${
                  isFilled
                    ? isOutgoing ? 'bg-[#53bdeb]' : 'bg-[#00a884]'
                    : isOutgoing ? 'bg-white/30' : 'bg-[#8696a0]/40'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8696a0] mt-0.5">
          <span>{formatSeconds(isPlaying ? currentTime : duration)}</span>
          <button
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded-full bg-black/20 text-[#aebac1] hover:text-white font-mono text-[10px] font-bold"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
