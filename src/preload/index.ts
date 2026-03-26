import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onDownloadProgress: (callback: (data: { gameId: string; progress: number }) => void) => {
    ipcRenderer.on('download-progress', (_event, data) => callback(data))
  },
  onDownloadComplete: (callback: (gameId: string) => void) => {
    ipcRenderer.on('download-complete', (_event, gameId) => callback(gameId))
  },
  onDownloadError: (callback: (data: { gameId: string; error: string }) => void) => {
    ipcRenderer.on('download-error', (_event, data) => callback(data))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
