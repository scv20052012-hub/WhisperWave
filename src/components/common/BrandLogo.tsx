import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  const textMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official WhisperWave Logo Icon */}
      <div className={`relative ${sizeMap[size]} shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-sky-500/10 border border-white/10 group`}>
        <img
          src="/assets/aistudio/1794441516948_6f28ed87.jpg"
          alt="WhisperWave Logo"
          className="w-full h-full object-cover object-center scale-[1.05] group-hover:scale-110 transition duration-300"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-wider uppercase font-sans ${textMap[size]}`}>
            <span className="text-[#00c48c]">WHISPER</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6]">WAVE</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-[#64748b] uppercase mt-0.5">
            Cifrado de Extremo a Extremo
          </span>
        </div>
      )}
    </div>
  );
};
