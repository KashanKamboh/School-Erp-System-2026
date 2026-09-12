import { contextBridge, ipcRenderer } from 'electron';

// Expose safe, isolated API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Window Controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: any, value: boolean) => callback(value);
    ipcRenderer.on('window:state-changed', handler);
    return () => {
      ipcRenderer.removeListener('window:state-changed', handler);
    };
  },

  // System & Application Information
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  print: (options?: { silent?: boolean }) => ipcRenderer.invoke('window:print', options),

  // Secure Native SQLite Database Operations (Executed in Main Process)
  dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', { sql, params }),
  dbGet: (sql: string, params?: any[]) => ipcRenderer.invoke('db:get', { sql, params }),
  dbRun: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', { sql, params }),
  dbExec: (sql: string) => ipcRenderer.invoke('db:exec', { sql }),

  // High-Level Transactions
  generateBulkVouchers: (vouchers: any[]) => ipcRenderer.invoke('db:generateBulkVouchers', vouchers),
  recordPayment: (paymentData: any) => ipcRenderer.invoke('db:recordPayment', paymentData),

  // Database Backup & Stats
  backupDatabase: (destinationPath?: string) => ipcRenderer.invoke('db:backup', destinationPath),
  getDatabaseStats: () => ipcRenderer.invoke('db:getStats'),
});
