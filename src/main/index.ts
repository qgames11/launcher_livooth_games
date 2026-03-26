import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import extract from 'extract-zip'

let mainWindow: BrowserWindow | null = null;

// Handle Deep Link
function handleDeepLink(urlStr: string) {
  try {
    const parsedUrl = new URL(urlStr);
    if (parsedUrl.hostname === 'auth') {
      const apiKey = parsedUrl.searchParams.get('key');
      const name = parsedUrl.searchParams.get('name') || 'Livooth User';
      if (mainWindow) {
        mainWindow.webContents.send('launcher-login', { apiKey, name });
      }
    } else if (parsedUrl.hostname === 'launch') {
      const gameId = parsedUrl.searchParams.get('gameId');
      const apiKey = parsedUrl.searchParams.get('key');
      const name = parsedUrl.searchParams.get('name') || 'Livooth User';

      if (mainWindow) {
        if (apiKey) {
          mainWindow.webContents.send('launcher-login', { apiKey, name });
          if (gameId) {
            setTimeout(() => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('deep-link-launch', { gameId });
              }
            }, 1000); // Allow React to mount MainLayout/Library before triggering launch
          }
        } else if (gameId) {
          mainWindow.webContents.send('deep-link-launch', { gameId });
        }
      }
    }
  } catch (e) {
    console.error('Deep link error:', e);
  }
}

// Ensure single instance and protocol
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event: any, commandLine: string[]) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const deepLinkUrl = commandLine.find(arg => arg.startsWith('livooth://'));
    if (deepLinkUrl) {
      handleDeepLink(deepLinkUrl);
    }
  });
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('livooth', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('livooth');
}

app.on('open-url', (event: any, url: string) => {
  event.preventDefault();
  handleDeepLink(url);
});

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  })

  if (mainWindow) {
    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (mainWindow) {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Check for updates from GitHub Releases
  autoUpdater.checkForUpdatesAndNotify();

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Parse deep link if launcher was completely closed and started via protocol link
  const deepLinkUrl = process.argv.find(arg => arg.startsWith('livooth://'));
  if (deepLinkUrl) {
    setTimeout(() => handleDeepLink(deepLinkUrl), 1000); // Small delay to let renderer load
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  
  // App Version & Updater IPC
  ipcMain.handle('get-app-version', () => app.getVersion());

  autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-status', 'Update Available! Downloading...');
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('update-progress', progressObj.percent);
  });
  
  autoUpdater.on('update-downloaded', async () => {
    if (mainWindow) mainWindow.webContents.send('update-status', 'Update Ready!');
    
    const { dialog } = require('electron');
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'info',
      buttons: ['지금 재시작 (Restart Now)', '나중에 (Later)'],
      title: 'Update Ready',
      message: '새로운 런처 버전이 다운로드되었습니다. 업데이트를 적용하기 위해 지금 재시작하시겠습니까?\n\nA new version has been downloaded. Restart the application to apply the updates?',
    });
    
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // Secure Game Launcher IPC
  ipcMain.on('launch-game', (event: any, args: any) => {
    const { gameId, apiKey } = args;
    console.log(`Launching game ${gameId} with key ${apiKey}`);
    
    try {
      const userDataPath = app.getPath('userData');
      const extractPath = path.join(userDataPath, 'livooth-games-data', gameId);
      
      if (!fs.existsSync(extractPath)) {
        throw new Error(`Game files not found for ${gameId}. Please download the game first.`);
      }

      // Find the first .exe file recursively
      const findExecutable = (dir: string): string | null => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            const exePath = findExecutable(filePath);
            if (exePath) return exePath;
          } else if (file.toLowerCase().endsWith('.exe')) {
            return filePath;
          }
        }
        return null;
      };

      const exePath = findExecutable(extractPath);
      
      if (!exePath) {
        throw new Error(`No executable (.exe) found in the downloaded files for ${gameId}.`);
      }

      console.log(`Found executable at: ${exePath}`);
      
      // Spawn the game process
      const { spawn } = require('child_process');
      const gameProcess = spawn(exePath, [apiKey || ''], {
        cwd: path.dirname(exePath),
        detached: true,
        stdio: 'ignore'
      });
      
      gameProcess.unref(); // Allow the launcher to close without killing the game
      
      console.log(`Successfully launched ${gameId}`);
      event.sender.send('launch-success', { gameId });
      
    } catch (error: any) {
      console.error('Launch error:', error);
      const { dialog } = require('electron');
      dialog.showErrorBox('Launch Error', error.message || 'Failed to launch the game.');
      event.sender.send('launch-error', { gameId, error: error.message || 'Failed to launch the game.' });
    }
  });

  // Launch Web Game IPC
  ipcMain.on('launch-web-game', (event: any, args: any) => {
    const { gameId, url, apiKey } = args;
    console.log(`Launching web game ${gameId} with key ${apiKey}`);
    
    try {
      if (!url) {
        throw new Error('Web game URL is missing.');
      }
      
      const launchUrl = new URL(url);
      launchUrl.searchParams.append('apiKey', apiKey);
      launchUrl.searchParams.append('source', 'launcher');
      
      shell.openExternal(launchUrl.toString());
      console.log(`Successfully launched web game ${gameId}`);
      event.sender.send('launch-success', { gameId });
    } catch (error: any) {
      console.error('Web Launch error:', error);
      const { dialog } = require('electron');
      dialog.showErrorBox('Launch Error', error.message || 'Failed to launch the web game.');
      event.sender.send('launch-error', { gameId, error: error.message || 'Failed to launch the web game.' });
    }
  });

  // Download Game IPC
  ipcMain.on('download-game', async (event: any, args: any) => {
    const { gameId, downloadUrl } = args;
    console.log(`Starting download for ${gameId}...`);
    
    try {
      // 1. Setup local paths (AppData/Livooth Games)
      const userDataPath = app.getPath('userData');
      const gamesDir = path.join(userDataPath, 'livooth-games-data');
      if (!fs.existsSync(gamesDir)) {
        fs.mkdirSync(gamesDir, { recursive: true });
      }
      
      const zipPath = path.join(gamesDir, `${gameId}.zip`);
      const extractPath = path.join(gamesDir, gameId);

      // 2. Start Axios download stream
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
      });

      const totalLength = response.headers['content-length'];
      let downloadedLength = 0;
      
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      // 3. Track progress and send to React
      response.data.on('data', (chunk: Buffer) => {
        downloadedLength += chunk.length;
        if (totalLength) {
          const progress = Math.round((downloadedLength / parseInt(totalLength)) * 100);
          event.sender.send('download-progress', { gameId, progress });
        }
      });

      // 4. Extract on finish
      writer.on('finish', async () => {
        console.log(`Download complete for ${gameId}. Extracting...`);
        event.sender.send('download-progress', { gameId, progress: 100 }); // Show 100% processing
        
        try {
          await extract(zipPath, { dir: extractPath });
          console.log(`Extraction complete for ${gameId}.`);
          // Cleanup zip
          fs.unlinkSync(zipPath);
          
          event.sender.send('download-complete', gameId);
        } catch (extractErr: any) {
          console.error('Extraction failed:', extractErr);
          event.sender.send('download-error', { gameId, error: 'Failed to extract game files.' });
        }
      });

      writer.on('error', (err: any) => {
        console.error('Download stream error:', err);
        event.sender.send('download-error', { gameId, error: 'Download failed during streaming.' });
      });

    } catch (error: any) {
      console.error('Download setup error:', error);
      event.sender.send('download-error', { gameId, error: error.message || 'Failed to start download.' });
    }
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
