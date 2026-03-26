import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onDownloadProgress: (callback: (data: { gameId: string; progress: number }) => void) => void;
      onDownloadComplete: (callback: (gameId: string) => void) => void;
      onDownloadError: (callback: (data: { gameId: string; error: string }) => void) => void;
    }
  }
}
