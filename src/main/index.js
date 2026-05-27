const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const EventEmitter = require('events')
const Anthropic = require('@anthropic-ai/sdk')

const isDev = process.env.NODE_ENV === 'development'

function getBundledBin(name) {
  if (isDev) return name
  return path.join(process.resourcesPath, 'bin', name)
}

// ─── MCP Client ───────────────────────────────────────────────────────────────

class MCPClient extends EventEmitter {
  constructor() {
    super()
    this.process = null
    this.pendingRequests = new Map()
    this.nextId = 1
    this.tools = []
    this.buffer = ''
    this.connected = false
  }

  async connect(command, args = []) {
    const homedir = os.homedir()
    const extraPaths = [
      path.join(homedir, '.local', 'bin'),
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      '/bin'
    ].join(':')

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('MCP connection timeout')), 15000)

      this.process = spawn(command, args, {
        env: {
          ...process.env,
          PATH: `${extraPaths}:${process.env.PATH || ''}`,
          FASTMCP_SHOW_SERVER_BANNER: 'false'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString()
        const lines = this.buffer.split('\n')
        this.buffer = lines.pop()
        for (const line of lines) {
          if (line.trim()) {
            try { this.handleMessage(JSON.parse(line)) } catch (_) {}
          }
        }
      })

      this.process.stderr.on('data', (d) => console.log('[MCP stderr]', d.toString()))
      this.process.on('error', (e) => { clearTimeout(timeout); reject(e) })
      this.process.on('close', () => { this.connected = false; this.emit('close') })

      this.request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'paco-asistente', version: '1.0.0' }
      })
        .then(() => {
          this.notify('notifications/initialized', {})
          return this.request('tools/list', {})
        })
        .then((result) => {
          clearTimeout(timeout)
          this.tools = result.tools || []
          this.connected = true
          resolve(this.tools)
        })
        .catch((e) => { clearTimeout(timeout); reject(e) })
    })
  }

  handleMessage(msg) {
    if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
      const { resolve, reject } = this.pendingRequests.get(msg.id)
      this.pendingRequests.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    }
  }

  request(method, params) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++
      this.pendingRequests.set(id, { resolve, reject })
      this.process.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`Timeout: ${method}`))
        }
      }, 30000)
    })
  }

  notify(method, params) {
    if (this.process) {
      this.process.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n')
    }
  }

  async callTool(name, args) {
    return this.request('tools/call', { name, arguments: args })
  }

  disconnect() {
    if (this.process) {
      this.process.kill()
      this.process = null
      this.connected = false
    }
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

let mainWindow
let mcpClient = null
let conversationHistory = []
let anthropicClient = null
let mcpTools = []

// ─── Settings ────────────────────────────────────────────────────────────────

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function loadSettings() {
  try {
    const p = getSettingsPath()
    if (fs.existsSync(p)) {
      const saved = JSON.parse(fs.readFileSync(p, 'utf8'))
      return { ...saved, firstRun: !saved.userName || !saved.apiKey || !saved.m365Configured }
    }
  } catch (_) {}
  return {
    apiKey: '',
    baseURL: 'http://localhost:6655/anthropic',
    model: 'claude-sonnet-4-5',
    userName: '',
    firstRun: true
  }
}

function saveSettings(settings) {
  const p = getSettingsPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(settings, null, 2))
}

function initAnthropic(settings) {
  if (settings.apiKey) {
    anthropicClient = new Anthropic({
      apiKey: settings.apiKey,
      baseURL: settings.baseURL || 'http://localhost:6655/anthropic'
    })
  }
}

// ─── MCP init ────────────────────────────────────────────────────────────────

async function initMCP() {
  if (mcpClient) { mcpClient.disconnect(); mcpClient = null }
  try {
    mcpClient = new MCPClient()
    const tools = await mcpClient.connect(getBundledBin('microsoft-365-mcp'))
    mcpTools = tools
    console.log(`[MCP] Connected — ${tools.length} tools`)
    mainWindow?.webContents.send('paco:tools-updated', tools.map((t) => t.name))
  } catch (e) {
    console.warn('[MCP] Not available:', e.message)
    mcpTools = []
  }
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 780,
    minWidth: 380,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#0F0820',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  createWindow()
  const settings = loadSettings()
  initAnthropic(settings)
  await initMCP()
})

app.on('window-all-closed', () => {
  if (mcpClient) mcpClient.disconnect()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ─── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.handle('paco:get-settings', () => loadSettings())

ipcMain.handle('paco:save-settings', (_, settings) => {
  saveSettings(settings)
  initAnthropic(settings)
  return { ok: true }
})

ipcMain.handle('paco:clear-chat', () => {
  conversationHistory = []
  return { ok: true }
})

ipcMain.handle('paco:get-tools', () => mcpTools.map((t) => t.name))

ipcMain.handle('paco:auth-m365', () => {
  return new Promise((resolve) => {
    const homedir = os.homedir()
    const extraPaths = [
      path.join(homedir, '.local', 'bin'),
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      '/bin'
    ].join(':')

    const proc = spawn(getBundledBin('microsoft-365-mcp-auth'), [], {
      env: { ...process.env, PATH: `${extraPaths}:${process.env.PATH || ''}` },
      stdio: 'pipe'
    })

    proc.on('close', (code) => resolve({ ok: code === 0, code }))
    proc.on('error', (e) => resolve({ ok: false, error: e.message }))
  })
})

ipcMain.handle('paco:send-message', async (_event, text) => {
  if (!anthropicClient) {
    mainWindow.webContents.send(
      'paco:stream-error',
      'No hay API Key configurada. Ve a Configuración para añadirla.'
    )
    return
  }

  const settings = loadSettings()
  conversationHistory.push({ role: 'user', content: text })

  const tools = mcpTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema || { type: 'object', properties: {} }
  }))

  const systemPrompt = `Eres Mayormono, el asistente personal de ${settings.userName || 'Javier'}. \
Eres amigable, eficiente y siempre hablas en español. \
Tienes acceso a las herramientas de Microsoft 365: calendario de Outlook, correos, tareas, chats de Teams y más. \
Cuando el usuario pregunte sobre su trabajo o agenda, usa las herramientas disponibles para obtener información real y actualizada. \
Sé conciso y directo. Usa emojis cuando sea apropiado para hacer la conversación más amena. \
Fecha y hora actual: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}.`

  let workingMessages = [...conversationHistory]

  try {
    while (true) {
      const params = {
        model: settings.model || 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: workingMessages
      }
      if (tools.length > 0) params.tools = tools

      const response = await anthropicClient.messages.create(params)

      const textBlocks = response.content.filter((b) => b.type === 'text')
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use')

      // Simulate streaming for text responses
      if (textBlocks.length > 0) {
        for (const block of textBlocks) {
          const words = block.text.split(' ')
          for (let i = 0; i < words.length; i++) {
            mainWindow.webContents.send('paco:stream-chunk', (i === 0 ? '' : ' ') + words[i])
            await new Promise((r) => setTimeout(r, 15))
          }
        }
      }

      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
        workingMessages.push({ role: 'assistant', content: response.content })
        conversationHistory = workingMessages
        break
      }

      // Handle tool calls
      workingMessages.push({ role: 'assistant', content: response.content })

      const toolResults = []
      for (const toolUse of toolUseBlocks) {
        mainWindow.webContents.send('paco:stream-tool-use', { type: 'calling', name: toolUse.name })
        try {
          const result = await mcpClient.callTool(toolUse.name, toolUse.input)
          const resultText = Array.isArray(result.content)
            ? result.content.map((c) => c.text || JSON.stringify(c)).join('\n')
            : JSON.stringify(result)
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: resultText })
          mainWindow.webContents.send('paco:stream-tool-use', { type: 'done', name: toolUse.name })
        } catch (e) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${e.message}`,
            is_error: true
          })
        }
      }

      workingMessages.push({ role: 'user', content: toolResults })
    }

    mainWindow.webContents.send('paco:stream-done', {})
  } catch (e) {
    console.error('[Claude]', e)
    mainWindow.webContents.send('paco:stream-error', e.message)
    conversationHistory.pop()
  }
})
