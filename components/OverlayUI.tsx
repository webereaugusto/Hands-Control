
import React from 'react';

interface OverlayUIProps {
  isCameraActive: boolean;
  isLoading: boolean;
  handDetected: boolean;
  onStart: () => void;
  interactionTime?: number;
  isTransforming?: boolean;
}

export const OverlayUI: React.FC<OverlayUIProps> = ({ 
  isCameraActive, 
  isLoading, 
  handDetected,
  onStart,
  interactionTime = 0,
  isTransforming = false
}) => {
  if (!isCameraActive) {
    return (
      <div className="z-30 text-center px-6">
        <h1 className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-amber-400">
          GHOST TRACE
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Traços minimalistas que seguem seus dedos. <br/>
          <span className="text-white">Aproxime as mãos</span> para fundir as cores em um brilho único.
        </p>
        <button
          onClick={onStart}
          className="group relative px-10 py-4 bg-white text-black font-bold rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <span className="relative z-10 uppercase tracking-[0.2em]">Ativar Sensores</span>
        </button>
      </div>
    );
  }

  if (isLoading || isTransforming) {
    return (
      <div className="z-30 flex flex-col items-center">
        <div className="w-10 h-10 border border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-white/50 font-mono text-[10px] tracking-[0.4em] animate-pulse uppercase">
          {isTransforming ? 'MODIFICANDO DNA...' : 'MAPEANDO GEOMETRIA...'}
        </p>
      </div>
    );
  }

  return (
    <div className="absolute top-10 left-10 z-30 pointer-events-none">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${handDetected ? 'bg-white shadow-[0_0_8px_white]' : 'bg-red-500'}`} />
          <span className="text-white/40 font-mono text-[9px] uppercase tracking-widest">
            {handDetected ? 'Tracking Estável' : 'Procurando Mãos'}
          </span>
        </div>
        {handDetected && interactionTime < 10 && (
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000" 
              style={{ width: `${(interactionTime / 10) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
