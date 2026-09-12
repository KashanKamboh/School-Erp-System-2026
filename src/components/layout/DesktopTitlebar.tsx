import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, GraduationCap } from 'lucide-react';

export const DesktopTitlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    window.electronAPI.isMaximized().then((max) => {
      setIsMaximized(!!max);
    });

    const cleanup = window.electronAPI.onWindowStateChange((max) => {
      setIsMaximized(max);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [isElectron]);

  const handleMinimize = () => {
    if (window.electronAPI?.minimize) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximize) {
      window.electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.close) {
      window.electronAPI.close();
    }
  };

  return (
    <div
      className="h-8 bg-slate-950 text-slate-300 border-b border-slate-800/80 flex items-center justify-between px-3 select-none text-xs z-50 shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left branding */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="w-4 h-4 rounded bg-gradient-to-tr from-[#FF5722] to-orange-400 flex items-center justify-center text-white shadow-xs">
          <GraduationCap className="w-2.5 h-2.5" />
        </div>
        <span className="font-bold text-[11px] text-slate-200 tracking-tight">
          EduPulse School ERP
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 font-medium">
          Desktop Edition
        </span>
      </div>

      {/* Center Drag Space */}
      <div className="flex-1 h-full" />

      {/* Right Window Controls */}
      <div
        className="flex items-center h-full -mr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-8 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          className="h-8 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleClose}
          className="h-8 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
