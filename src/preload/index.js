const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('mayormonoAPI', {
  sendMessage: (text) => ipcRenderer.invoke('mm:send-message', text),
  getSettings: () => ipcRenderer.invoke('mm:get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('mm:save-settings', s),
  clearChat: () => ipcRenderer.invoke('mm:clear-chat'),
  getTools: () => ipcRenderer.invoke('mm:get-tools'),
  transcribe: (args) => ipcRenderer.invoke('mm:transcribe', args),
  getMcpStatus: () => ipcRenderer.invoke('mm:get-mcp-status'),
  authM365: () => ipcRenderer.invoke('mm:auth-m365'),
  getM365User: () => ipcRenderer.invoke('mm:get-m365-user'),

  onStreamChunk: (cb) => ipcRenderer.on('mm:stream-chunk', (_, d) => cb(d)),
  onStreamToolUse: (cb) => ipcRenderer.on('mm:stream-tool-use', (_, d) => cb(d)),
  onStreamDone: (cb) => ipcRenderer.on('mm:stream-done', (_, d) => cb(d)),
  onStreamError: (cb) => ipcRenderer.on('mm:stream-error', (_, d) => cb(d)),
  onToolsUpdated: (cb) => ipcRenderer.on('mm:tools-updated', (_, d) => cb(d)),
  onShowOnboarding: (cb) => ipcRenderer.on('mm:show-onboarding', () => cb()),

  removeAllListeners: (ch) => ipcRenderer.removeAllListeners(ch)
})
