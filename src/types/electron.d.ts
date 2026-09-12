export interface ElectronAppInfo {
  name: string;
  version: string;
  platform: string;
  userDataPath: string;
  dbPath: string;
  isOffline: boolean;
}

export interface UpdateStatusInfo {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  };
  error?: string;
  currentVersion: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => () => void;

  // Auto-Updater (GitHub Releases)
  checkForUpdates: () => Promise<{ success: boolean; status: string; data?: any; error?: string }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<void>;
  getUpdateStatus: () => Promise<UpdateStatusInfo>;
  onUpdateStatusChange: (callback: (status: UpdateStatusInfo) => void) => () => void;

  // System & App info
  getAppInfo: () => Promise<ElectronAppInfo>;
  openExternal: (url: string) => Promise<void>;
  print: (options?: { silent?: boolean }) => Promise<{ success: boolean; error?: string }>;

  // Native SQLite IPC (Executed securely in Main Process)
  dbQuery: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  dbGet: <T = any>(sql: string, params?: any[]) => Promise<T | null>;
  dbRun: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  dbExec: (sql: string) => Promise<void>;

  // High-Level Transactions
  generateBulkVouchers: (vouchers: any[]) => Promise<{ generated: any[]; skippedDuplicates: string[] }>;
  recordPayment: (paymentData: {
    voucherId: string;
    amountPaid: number;
    paymentMethod: string;
    paymentDate: string;
    receivedBy: string;
    remarks?: string;
  }) => Promise<{ voucher: any; payment: any }>;

  // Database Management
  backupDatabase: (destinationPath?: string) => Promise<{ success: boolean; backupPath?: string; error?: string }>;
  getDatabaseStats: () => Promise<{
    dbPath: string;
    sizeBytes: number;
    tablesCount: number;
    vouchersCount: number;
    studentsCount: number;
    paymentsCount: number;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
