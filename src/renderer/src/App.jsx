import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'

// ─── Icons ────────────────────────────────────────────────────────────────────

function MayormonoLogo() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gLogo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0ABFC" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>
      </defs>
      {/* Main gem */}
      <polygon points="44,8 74,28 62,72 26,72 14,28" fill="white" opacity="0.15" />
      <polygon points="44,12 70,30 59,68 29,68 18,30" fill="white" opacity="0.9" />
      {/* Inner facets */}
      <polygon points="44,12 70,30 44,44" fill="white" opacity="0.4" />
      <polygon points="44,12 18,30 44,44" fill="white" opacity="0.2" />
      {/* Sparkles */}
      <path d="M76 14 L78 8 L80 14 L86 16 L80 18 L78 24 L76 18 L70 16 Z" fill="white" opacity="0.9" />
      <path d="M8 22 L9.5 17 L11 22 L16 23.5 L11 25 L9.5 30 L8 25 L3 23.5 Z" fill="white" opacity="0.7" />
      <path d="M80 52 L81 49 L82 52 L85 53 L82 54 L81 57 L80 54 L77 53 Z" fill="white" opacity="0.6" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

// ─── Message component ────────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const html = isUser ? null : marked.parse(msg.content || '')
  return (
    <div className={`msg-row ${isUser ? 'msg-user' : 'msg-mm'}`}>
      {!isUser && <div className="msg-avatar">M</div>}
      <div className={`msg-bubble ${isUser ? 'bubble-user' : 'bubble-mm'} ${msg.isError ? 'bubble-error' : ''}`}>
        {isUser
          ? <span className="msg-text">{msg.content}</span>
          : <div className="msg-text msg-markdown" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  )
}

function ToolBadge({ name }) {
  const label = name.replace(/_/g, ' ').replace(/outlook |teams /gi, '')
  return (
    <div className="tool-badge">
      <span className="tool-dot" />
      <span>Consultando {label}…</span>
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function Onboarding({ onComplete, initialStep = 0, initialForm = {} }) {
  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState({
    userName: '',
    apiKey: '',
    baseURL: 'http://localhost:6655/anthropic',
    model: 'claude-sonnet-4-5',
    ...initialForm
  })
  const [authState, setAuthState] = useState('idle') // idle | loading | done | error
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const canContinue =
    step === 0 ? form.userName.trim() :
    step === 1 ? form.apiKey.trim() :
    authState === 'done'

  const next = async () => {
    if (step < 2) { setStep(step + 1); return }
    onComplete({ ...form, m365Configured: true })
  }

  const handleAuth = async () => {
    setAuthState('loading')
    const result = await window.mayormonoAPI?.authM365()
    setAuthState(result?.ok ? 'done' : 'error')
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-logo"><MayormonoLogo /></div>
        <h1 className="onboarding-title">Bienvenido a Mayormono</h1>

        {step === 0 && (
          <>
            <p className="onboarding-sub">Tu asistente personal con acceso a Microsoft 365.<br />Primero, ¿cómo te llamo?</p>
            <input
              className="onboarding-input"
              placeholder="Tu nombre"
              value={form.userName}
              onChange={set('userName')}
              onKeyDown={(e) => e.key === 'Enter' && canContinue && next()}
              autoFocus
            />
          </>
        )}

        {step === 1 && (
          <>
            <p className="onboarding-sub">Ahora necesito una API Key para conectar con la IA.</p>
            <input
              className="onboarding-input"
              type="password"
              placeholder="API Key"
              value={form.apiKey}
              onChange={set('apiKey')}
              onKeyDown={(e) => e.key === 'Enter' && canContinue && next()}
              autoFocus
            />
          </>
        )}

        {step === 2 && (
          <>
            <p className="onboarding-sub">Por último, conecta tu cuenta de Microsoft 365.<br />Se abrirá el navegador para autenticarte.</p>
            <button
              className={`m365-auth-btn ${authState}`}
              onClick={handleAuth}
              disabled={authState === 'loading' || authState === 'done'}
            >
              {authState === 'idle' && '🔑 Conectar Microsoft 365'}
              {authState === 'loading' && <><span className="thinking-dots"><span /><span /><span /></span>&nbsp;Autenticando…</>}
              {authState === 'done' && '✓ Microsoft 365 conectado'}
              {authState === 'error' && '⚠️ Reintentar'}
            </button>
            {authState === 'error' && (
              <p className="onboarding-auth-error">No se pudo autenticar. Asegúrate de tener instalado microsoft-365-mcp.</p>
            )}
          </>
        )}

        <div className="onboarding-dots">
          <span className={step === 0 ? 'dot dot-active' : 'dot'} />
          <span className={step === 1 ? 'dot dot-active' : 'dot'} />
          <span className={step === 2 ? 'dot dot-active' : 'dot'} />
        </div>

        <button className="onboarding-btn" disabled={!canContinue} onClick={next}>
          {step < 2 ? 'Continuar' : 'Empezar'}
        </button>
      </div>
    </div>
  )
}

// ─── Settings modal ───────────────────────────────────────────────────────────

function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState({
    userName: settings.userName || '',
    apiKey: settings.apiKey || '',
    baseURL: settings.baseURL || 'http://localhost:6655/anthropic',
    model: settings.model || 'claude-sonnet-4-5',
    whisperApiKey: settings.whisperApiKey || '',
    whisperBaseURL: settings.whisperBaseURL || ''
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configuración</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span>Tu nombre</span>
            <input value={form.userName} onChange={set('userName')} placeholder="Javier" />
          </label>
          <label className="field">
            <span>API Key (Claude)</span>
            <input type="password" value={form.apiKey} onChange={set('apiKey')} placeholder="sk-ant-… o token local" />
          </label>
          <label className="field">
            <span>Whisper API Key (micrófono)</span>
            <input type="password" value={form.whisperApiKey} onChange={set('whisperApiKey')} placeholder="OpenAI sk-… o Groq gsk-…" />
          </label>
          <label className="field">
            <span>Whisper endpoint (opcional)</span>
            <input value={form.whisperBaseURL} onChange={set('whisperBaseURL')} placeholder="https://api.groq.com/openai (Groq)" />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Quick suggestions ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  '¿Qué reuniones tengo hoy?',
  'Muéstrame mis emails recientes',
  '¿Cuáles son mis tareas pendientes?',
  '¿Hay algún chat de Teams sin leer?'
]

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({ userName: '', model: 'claude-sonnet-4-5' })
  const [showSettings, setShowSettings] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingInitialStep, setOnboardingInitialStep] = useState(0)
  const [m365User, setM365User] = useState(null)
  const [tools, setTools] = useState([])
  const [mcpStatus, setMcpStatus] = useState('connecting') // 'connecting'|'connected'|'disconnected'
  const [streamText, setStreamText] = useState('')
  const [toolStatus, setToolStatus] = useState('')

  const bottomRef = useRef(null)
  const streamRef = useRef('')
  const sendMessageRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const [voiceState, setVoiceState] = useState('idle') // 'idle' | 'recording' | 'processing'

  useEffect(() => {
    if (!window.mayormonoAPI) return

    window.mayormonoAPI.getSettings().then((s) => {
      setSettings(s)
      if (s.firstRun) setShowOnboarding(true)
      else if (!s.apiKey) setShowSettings(true)
    })
    window.mayormonoAPI.getTools().then((t) => {
      setTools(t)
      if (t.length > 0) setMcpStatus('connected')
      // If empty, wait for mm:tools-updated or mm:show-onboarding to resolve
    })
    window.mayormonoAPI.getMcpStatus().then((s) => setMcpStatus(s))
    window.mayormonoAPI.getM365User().then((u) => { if (u) setM365User(u) })

    window.mayormonoAPI.onStreamChunk((chunk) => {
      streamRef.current += chunk
      setStreamText(streamRef.current)
    })

    window.mayormonoAPI.onStreamToolUse((data) => {
      if (data.type === 'calling') setToolStatus(data.name)
      else if (data.type === 'done') setToolStatus('')
    })

    window.mayormonoAPI.onStreamDone(() => {
      const text = streamRef.current
      if (text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: text }])
        streamRef.current = ''
        setStreamText('')
      }
      setToolStatus('')
      setIsLoading(false)
    })

    window.mayormonoAPI.onStreamError((err) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${err}`, isError: true }])
      streamRef.current = ''
      setStreamText('')
      setToolStatus('')
      setIsLoading(false)
    })

    window.mayormonoAPI.onToolsUpdated((t) => {
      setTools(t)
      setMcpStatus(t.length > 0 ? 'connected' : 'disconnected')
    })

    window.mayormonoAPI.onShowOnboarding(() => {
      setMcpStatus('disconnected')
      setOnboardingInitialStep(2)
      setShowOnboarding(true)
    })

    return () => {
      ;['mm:stream-chunk', 'mm:stream-tool-use', 'mm:stream-done', 'mm:stream-error', 'mm:tools-updated', 'mm:show-onboarding'].forEach(
        (ch) => window.mayormonoAPI.removeAllListeners(ch)
      )
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText, toolStatus])

  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim() || isLoading) return
      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setInputText('')
      setIsLoading(true)
      streamRef.current = ''
      await window.mayormonoAPI?.sendMessage(text)
    },
    [isLoading]
  )

  useEffect(() => { sendMessageRef.current = sendMessage }, [sendMessage])

  const toggleVoice = useCallback(async () => {
    if (voiceState === 'recording') {
      mediaRecorderRef.current?.stop()
      return
    }
    if (voiceState === 'processing') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setVoiceState('processing')
        const blob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' })
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        const result = await window.mayormonoAPI?.transcribe({ audioBase64: base64, mimeType: blob.type })
        setVoiceState('idle')
        if (result?.error === 'no-key') {
          alert('Añade una Whisper API Key en Configuración para usar el micrófono.\nPuedes usar OpenAI o Groq (gratuito en groq.com).')
        } else if (result?.error) {
          alert(`Error al transcribir: ${result.error}`)
        } else if (result?.transcript?.trim()) {
          sendMessageRef.current?.(result.transcript.trim())
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setVoiceState('recording')
    } catch (e) {
      setVoiceState('idle')
      if (e.name === 'NotAllowedError') {
        alert('Sin acceso al micrófono.\nVe a Ajustes del Sistema → Privacidad y Seguridad → Micrófono y activa Mayormono.')
      }
    }
  }, [voiceState])

  const clearChat = async () => {
    await window.mayormonoAPI?.clearChat()
    setMessages([])
    streamRef.current = ''
    setStreamText('')
  }

  const completeOnboarding = async (form) => {
    await window.mayormonoAPI?.saveSettings(form)
    setSettings(form)
    setShowOnboarding(false)
    setOnboardingInitialStep(0)
    setMcpStatus('connecting')
  }

  const saveSettings = async (s) => {
    await window.mayormonoAPI?.saveSettings(s)
    setSettings(s)
    setShowSettings(false)
  }

  const hasMessages = messages.length > 0 || isLoading

  return (
    <div className="app">
      {showOnboarding && <Onboarding onComplete={completeOnboarding} initialStep={onboardingInitialStep} initialForm={settings} />}

      {showSettings && (
        <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* ── M365 disconnected banner ──────────────────────── */}
      {!showOnboarding && mcpStatus === 'disconnected' && (
        <div className="m365-banner">
          <span>⚠️ Microsoft 365 desconectado</span>
          <button onClick={() => { setOnboardingInitialStep(2); setShowOnboarding(true) }}>Reconectar</button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={`header ${hasMessages ? 'header-compact' : ''}`}>
        <div className="topbar">
          <div className="topbar-spacer" /> {/* traffic lights space */}
          <span className="app-title">Mayormono</span>
          <div className="topbar-actions">
            {hasMessages && (
              <button className="icon-btn" onClick={clearChat} title="Nueva conversación">
                <TrashIcon />
              </button>
            )}
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Configuración">
              <GearIcon />
            </button>
            <div className="avatar">{(() => {
              const name = m365User?.displayName || settings.userName || ''
              const parts = name.includes(',')
                ? name.split(',').map(s => s.trim()).reverse()
                : name.split(' ')
              return (parts[0]?.[0] || 'M') + (parts[1]?.[0] || '')
            })()}</div>
          </div>
        </div>

        {!hasMessages && (
          <div className="welcome">
            <div className="mm-icon-wrap">
              <MayormonoLogo />
            </div>
            <p className="welcome-name">Hola, {settings.userName?.split(' ')[0] || 'Javier'} 👋</p>
            <h1 className="welcome-title">¿En qué puedo ayudarte?</h1>
            <p className="welcome-sub">Háblame con naturalidad.</p>
            {tools.length > 0 && (
              <div className="tools-hint">
                <span className="tools-dot" />
                <span>Microsoft 365 conectado · {tools.length} herramientas</span>
              </div>
            )}
          </div>
        )}

        {!hasMessages && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Chat area ─────────────────────────────────────────── */}
      <div className="chat-area">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {toolStatus && <ToolBadge name={toolStatus} />}

        {streamText && (
          <div className="msg-row msg-mm">
            <div className="msg-avatar">M</div>
            <div className="msg-bubble bubble-mm bubble-streaming">
              <div className="msg-text msg-markdown" dangerouslySetInnerHTML={{ __html: marked.parse(streamText) }} />
              <span className="cursor-blink">▋</span>
            </div>
          </div>
        )}

        {isLoading && !streamText && !toolStatus && (
          <div className="msg-row msg-mm">
            <div className="msg-avatar">M</div>
            <div className="msg-bubble bubble-mm">
              <span className="thinking-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────── */}
      <div className="input-area">
        <div className="input-wrap">
          <textarea
            className="chat-input"
            placeholder={voiceState === 'recording' ? 'Escuchando…' : voiceState === 'processing' ? 'Procesando…' : 'Escríbele a Mayormono…'}
            value={inputText}
            rows={1}
            disabled={isLoading}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(inputText)
              }
            }}
          />
          <button
            className={`mic-btn${voiceState === 'recording' ? ' listening' : ''}`}
            disabled={isLoading || voiceState === 'processing'}
            onClick={toggleVoice}
            title={voiceState === 'recording' ? 'Detener grabación' : 'Hablar'}
          >
            <MicIcon />
          </button>
          <button
            className="send-btn"
            disabled={!inputText.trim() || isLoading}
            onClick={() => sendMessage(inputText)}
          >
            <SendIcon />
          </button>
        </div>
        <p className="disclaimer">Mayormono usa IA. Verifica los resultados.</p>
      </div>
    </div>
  )
}
