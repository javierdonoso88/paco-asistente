const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pacoAPI', {
  sendMessage: (text) => ipcRenderer.invoke('paco:send-message', text),
  getSettings: () => ipcRenderer.invoke('paco:get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('paco:save-settings', s),
  clearChat: () => ipcRenderer.invoke('paco:clear-chat'),
  getTools: () => ipcRenderer.invoke('paco:get-tools'),
  authM365: () => ipcRenderer.invoke('paco:auth-m365'),

  onStreamChunk: (cb) => ipcRenderer.on('paco:stream-chunk', (_, d) => cb(d)),
  onStreamToolUse: (cb) => ipcRenderer.on('paco:stream-tool-use', (_, d) => cb(d)),
  onStreamDone: (cb) => ipcRenderer.on('paco:stream-done', (_, d) => cb(d)),
  onStreamError: (cb) => ipcRenderer.on('paco:stream-error', (_, d) => cb(d)),
  onToolsUpdated: (cb) => ipcRenderer.on('paco:tools-updated', (_, d) => cb(d)),

  removeAllListeners: (ch) => ipcRenderer.removeAllListeners(ch)
})
