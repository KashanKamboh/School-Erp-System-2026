import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, GraduationCap, DownloadCloud, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { UpdateStatusInfo } from '../../types/electron';

export const DesktopTitlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateStatusInfo | null>(null);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    window.electronAPI.isMaximized().then((max) => {
      setIsMaximized(!!max);
    });

    const cleanupWindowState = window.electronAPI.onWindowStateChange((max) => {
      setIsMaximized(max);
    });

    // Check initial update status
    if (window.electronAPI.getUpdateStatus) {
      window.electronAPI.getUpdateStatus().then((status) => {
        if (status && status.status !== 'idle') {
          setUpdateInfo(status);
        }
      });
    }

    // Listen for live update events
    let cleanupUpdater: (() => void) | undefined;
    if (window.electronAPI.onUpdateStatusChange) {
      cleanupUpdater = window.electronAPI.onUpdateStatusChange((status) => {
        setUpdateInfo(status);
      });
    }

    return () => {
      if (cleanupWindowState) cleanupWindowState();
      if (cleanupUpdater) cleanupUpdater();
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

  const handleDownloadUpdate = async () => {
    if (window.electronAPI?.downloadUpdate) {
      await window.electronAPI.downloadUpdate();
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI?.installUpdate) {
      await window.electronAPI.installUpdate();
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
          v{updateInfo?.currentVersion || '1.0.0'}
        </span>
      </div>

      {/* Center Drag Space & Live Update Notification Pill */}
      <div className="flex-1 h-full flex items-center justify-center">
        {updateInfo?.status === 'available' && (
          <button
            onClick={handleDownloadUpdate}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white text-[10px] font-bold shadow-xs transition-all animate-pulse cursor-pointer"
            title="Click to download application update"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            <span>Update v{updateInfo.version} Available &bull; Click to Download</span>
          </button>
        )}

        {updateInfo?.status === 'downloading' && (
          <div
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-800 border border-blue-500/50 text-blue-300 text-[10px] font-semibold"
          >
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-400" />
            <span>Downloading Update {updateInfo.progress?.percent || 0}%</span>
          </div>
        )}

        {updateInfo?.status === 'downloaded' && (
          <button
            onClick={handleInstallUpdate}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs transition-all cursor-pointer"
            title="Click to restart and apply update"
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-200" />
            <span>Update Ready &bull; Restart & Install</span>
          </button>
        )}
      </div>

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
