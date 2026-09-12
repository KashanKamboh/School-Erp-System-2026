import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  initDesktopDatabase,
  getDb,
  getDatabasePath,
  executeGenerateBulkVouchers,
  executeRecordPayment,
  backupDatabaseFile,
  getDatabaseStatistics,
} from './database.js';
import { startEmbeddedServer } from './embeddedServer.js';

// Catch any unhandled errors gracefully so Windows does not silently exit
process.on('uncaughtException', (err: any) => {
  console.error('[Electron Uncaught Exception]', err);
  try {
    dialog.showErrorBox(
      'EduPulse School ERP',
      `An unexpected initialization message occurred:\n\n${err?.message || err}\n\nThe application will attempt to continue.`
    );
  } catch {}
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Electron Unhandled Rejection]', reason);
});

// Hardware acceleration configuration
app.commandLine.appendSwitch('disable-gpu-process-crash-limit');

let mainWindow: BrowserWindow | null = null;
let embeddedServerInstance: any = null;

// Enforce single application instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[Electron] Another instance is already running. Quitting duplicate.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Windows Application User Model ID for taskbar grouping & notifications
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.edupulse.schoolerp');
    }

    const userDataPath = app.getPath('userData');
    process.env.ELECTRON_USER_DATA = userDataPath;

    // Initialize the offline SQLite database in Electron's userData directory
    try {
      initDesktopDatabase(userDataPath);
    } catch (dbInitErr) {
      console.error('[Electron] Database init exception guarded:', dbInitErr);
    }

    // Setup IPC Handlers
    try {
      setupIpcHandlers();
    } catch (ipcErr) {
      console.error('[Electron] IPC handler setup exception guarded:', ipcErr);
    }

    // Determine dist directory
    const candidateDistDirs = [
      path.join(__dirname, '../dist'),
      path.join(app.getAppPath(), 'dist'),
      path.join(process.resourcesPath || '', 'app.asar/dist'),
    ];
    let distDir = candidateDistDirs[0];
    for (const d of candidateDistDirs) {
      if (fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html'))) {
        distDir = d;
        break;
      }
    }

    // Embedded server setup
    let targetUrl = '';
    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      targetUrl = process.env.VITE_DEV_SERVER_URL;
    } else if (isDev && process.env.ELECTRON_START_URL) {
      targetUrl = process.env.ELECTRON_START_URL;
    } else {
      try {
        console.log('[Electron] Starting embedded offline server for desktop...');
        const srv = await startEmbeddedServer(userDataPath, distDir);
        embeddedServerInstance = srv.server;
        targetUrl = srv.url;
        console.log('[Electron] Embedded offline server ready at:', targetUrl);
      } catch (srvErr) {
        console.error('[Electron] Failed to start embedded server:', srvErr);
        targetUrl = 'http://127.0.0.1:3000';
      }
    }

    // Create Main Window
    createMainWindow(targetUrl, distDir);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(targetUrl, distDir);
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (embeddedServerInstance) {
    try {
      embeddedServerInstance.close();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createMainWindow(targetUrl = '', distDir = '') {
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  const iconPath = path.join(__dirname, '../public/icon.png');
  const hasIcon = fs.existsSync(iconPath);

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 680,
    title: 'EduPulse School ERP — Offline Desktop Edition',
    icon: hasIcon ? iconPath : undefined,
    frame: false, // Frameless for custom, modern Windows desktop titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Allows native C++ modules in Node.js IPC
      webSecurity: false, // Allows seamless local file loading in packaged apps
      spellcheck: false,
    },
    show: false, // Show once ready-to-show to avoid white flash
  });

  // Remove default menu bar for modern desktop experience
  mainWindow.setMenuBarVisibility(false);

  // Smooth window reveal with safety timer fallback
  const revealTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.log('[Electron] Fallback reveal timer executed');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 2000);

  mainWindow.once('ready-to-show', () => {
    clearTimeout(revealTimer);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn('[Electron] did-fail-load:', validatedURL, errorCode, errorDescription);
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  // Track window maximize / unmaximize events for renderer titlebar
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:state-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:state-changed', false);
  });

  // Secure navigation: block navigation away from app, open external URLs in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent navigating away from local files
    if (!url.startsWith('file://') && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load the application
  if (targetUrl) {
    console.log('[Electron] Loading frontend from URL:', targetUrl);
    mainWindow.loadURL(targetUrl).catch((err) => {
      console.warn('[Electron] loadURL failed, trying fallback local file:', err);
      const fallbackFile = path.join(distDir || path.join(__dirname, '../dist'), 'index.html');
      if (fs.existsSync(fallbackFile)) {
        mainWindow?.loadFile(fallbackFile);
      }
    });
  } else {
    const fallbackFile = path.join(distDir || path.join(__dirname, '../dist'), 'index.html');
    if (fs.existsSync(fallbackFile)) {
      mainWindow.loadFile(fallbackFile);
    } else {
      mainWindow.loadURL('http://127.0.0.1:3000');
    }
  }
}

function setupIpcHandlers() {
  // 1. Window Controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // 2. Application Information
  ipcMain.handle('app:getInfo', () => {
    const userDataPath = app.getPath('userData');
    return {
      name: app.getName() || 'EduPulse School ERP',
      version: app.getVersion() || '1.0.0',
      platform: process.platform,
      userDataPath,
      dbPath: getDatabasePath(userDataPath),
      isOffline: true,
    };
  });

  // 3. Shell & External URLs
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
    }
  });

  // 4. Printing (Native Windows Print Dialog)
  ipcMain.handle('window:print', async (_, options?: { silent?: boolean }) => {
    if (!mainWindow) return { success: false, error: 'No active window' };
    return new Promise((resolve) => {
      mainWindow?.webContents.print(
        {
          silent: options?.silent ?? false,
          printBackground: true,
          color: true,
          margins: { marginType: 'printableArea' },
        },
        (success, failureReason) => {
          if (!success) {
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  });

  // 5. Native SQLite IPC Queries (Executed exclusively in Main Process)
  ipcMain.handle('db:query', (_, { sql, params }: { sql: string; params?: any[] }) => {
    const db = getDb();
    const stmt = db.prepare(sql);
    return params && params.length ? stmt.all(...params) : stmt.all();
  });

  ipcMain.handle('db:get', (_, { sql, params }: { sql: string; params?: any[] }) => {
    const db = getDb();
    const stmt = db.prepare(sql);
    return (params && params.length ? stmt.get(...params) : stmt.get()) || null;
  });

  ipcMain.handle('db:run', (_, { sql, params }: { sql: string; params?: any[] }) => {
    const db = getDb();
    const stmt = db.prepare(sql);
    const info = params && params.length ? stmt.run(...params) : stmt.run();
    return {
      changes: info.changes,
      lastInsertRowid: info.lastInsertRowid,
    };
  });

  ipcMain.handle('db:exec', (_, { sql }: { sql: string }) => {
    const db = getDb();
    db.exec(sql);
    return true;
  });

  // 6. High-level Transactions
  ipcMain.handle('db:generateBulkVouchers', (_, vouchers: any[]) => {
    return executeGenerateBulkVouchers(vouchers);
  });

  ipcMain.handle('db:recordPayment', (_, paymentData: any) => {
    return executeRecordPayment(paymentData);
  });

  // 7. Database Backups
  ipcMain.handle('db:backup', async (_, customPath?: string) => {
    if (customPath) {
      return await backupDatabaseFile(customPath);
    }

    if (mainWindow) {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export SQLite Database Backup',
        defaultPath: path.join(app.getPath('documents'), `edupulse_backup_${new Date().toISOString().split('T')[0]}.sqlite`),
        filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Backup canceled by user' };
      }

      const db = getDb();
      await db.backup(result.filePath);
      return { success: true, backupPath: result.filePath };
    }

    return await backupDatabaseFile();
  });

  ipcMain.handle('db:getStats', () => {
    return getDatabaseStatistics();
  });
}
