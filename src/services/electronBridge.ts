/**
 * Electron Bridge Service
 * Provides seamless access to native desktop Electron features and local SQLite
 * with automatic fallback to Web APIs when running in the browser/preview.
 */

export const isElectronApp = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
};

export const getElectronAPI = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  return null;
};

// Window Controls
export const minimizeWindow = async () => {
  const api = getElectronAPI();
  if (api) await api.minimize();
};

export const maximizeWindow = async () => {
  const api = getElectronAPI();
  if (api) await api.maximize();
};

export const closeWindow = async () => {
  const api = getElectronAPI();
  if (api) await api.close();
};

export const isWindowMaximized = async (): Promise<boolean> => {
  const api = getElectronAPI();
  if (api) return await api.isMaximized();
  return false;
};

// Application Info & Native Backups
export const getDesktopAppInfo = async () => {
  const api = getElectronAPI();
  if (api) {
    return await api.getAppInfo();
  }
  return {
    name: 'EduPulse School ERP',
    version: '1.0.0',
    platform: 'web',
    userDataPath: 'Local Browser Storage / Cloud Run Server',
    dbPath: 'server/edupulse.sqlite (Native SQLite)',
    isOffline: true,
  };
};

export const exportDatabaseBackup = async () => {
  const api = getElectronAPI();
  if (api) {
    return await api.backupDatabase();
  }
  return { success: false, error: 'Backup feature is available in Windows Desktop App.' };
};

export const getDatabaseStats = async () => {
  const api = getElectronAPI();
  if (api) {
    return await api.getDatabaseStats();
  }
  return null;
};

export const printDocument = async (options?: { silent?: boolean }) => {
  const api = getElectronAPI();
  if (api) {
    return await api.print(options);
  } else {
    window.print();
    return { success: true };
  }
};
