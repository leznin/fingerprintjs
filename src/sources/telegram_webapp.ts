/**
 * Telegram WebApp fingerprinting
 * Detects and analyzes Telegram Mini Apps environment
 */

export interface TelegramWebAppFingerprint {
  isTelegramWebView: boolean
  webAppData: TelegramWebAppData | null
  telegramVersion: string | null
  platform: string | null
  bridgeFingerprint: TelegramBridgeFingerprint | null
}

export interface TelegramWebAppData {
  initData: string
  initDataUnsafe: Record<string, any>
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  platform: string
  version: string
}

export interface TelegramBridgeFingerprint {
  availableMethods: string[]
  bridgeVersion: string
  supportedEvents: string[]
  hasCloudStorage: boolean
  hasHapticFeedback: boolean
  hasMainButton: boolean
  hasBackButton: boolean
  hasSettingsButton: boolean
}

// Declare Telegram types for TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        initDataUnsafe: Record<string, any>
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        platform: string
        version: string
        CloudStorage?: any
        HapticFeedback?: any
        MainButton?: any
        BackButton?: any
        SettingsButton?: any
        [key: string]: any
      }
      WebView?: any
    }
    TelegramWebviewProxy?: any
  }
}

function detectTelegramEnvironment(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return (
    /telegramwebview/i.test(ua) ||
    /telegram/i.test(ua) ||
    window.Telegram?.WebApp !== undefined ||
    window.TelegramWebviewProxy !== undefined
  )
}

function extractTelegramVersion(): string | null {
  const ua = navigator.userAgent
  const versionMatch = ua.match(/TelegramWebview\/(\d+\.\d+)/i)
  if (versionMatch) {
    return versionMatch[1]
  }
  
  if (window.Telegram?.WebApp?.version) {
    return window.Telegram.WebApp.version
  }
  
  return null
}

function extractTelegramPlatform(): string | null {
  if (window.Telegram?.WebApp?.platform) {
    return window.Telegram.WebApp.platform
  }
  
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
  if (ua.includes('android')) return 'android'
  if (ua.includes('windows')) return 'windows'
  if (ua.includes('macintosh')) return 'macos'
  if (ua.includes('linux')) return 'linux'
  
  return null
}

function getTelegramWebAppData(): TelegramWebAppData | null {
  const webApp = window.Telegram?.WebApp
  if (!webApp) return null
  
  try {
    return {
      initData: webApp.initData || '',
      initDataUnsafe: webApp.initDataUnsafe || {},
      colorScheme: webApp.colorScheme || 'light',
      themeParams: webApp.themeParams || {},
      isExpanded: webApp.isExpanded || false,
      viewportHeight: webApp.viewportHeight || 0,
      viewportStableHeight: webApp.viewportStableHeight || 0,
      headerColor: webApp.headerColor || '',
      backgroundColor: webApp.backgroundColor || '',
      platform: webApp.platform || '',
      version: webApp.version || ''
    }
  } catch (error) {
    return null
  }
}

function getTelegramBridgeFingerprint(): TelegramBridgeFingerprint | null {
  const webApp = window.Telegram?.WebApp
  if (!webApp) return null
  
  try {
    const availableMethods = Object.keys(webApp)
      .filter(key => typeof webApp[key] === 'function')
      .sort()
    
    return {
      availableMethods,
      bridgeVersion: webApp.version || '',
      supportedEvents: getSupportedTelegramEvents(),
      hasCloudStorage: !!webApp.CloudStorage,
      hasHapticFeedback: !!webApp.HapticFeedback,
      hasMainButton: !!webApp.MainButton,
      hasBackButton: !!webApp.BackButton,
      hasSettingsButton: !!webApp.SettingsButton
    }
  } catch (error) {
    return null
  }
}

function getSupportedTelegramEvents(): string[] {
  const webApp = window.Telegram?.WebApp
  if (!webApp) return []
  
  const commonEvents = [
    'themeChanged',
    'viewportChanged',
    'mainButtonClicked',
    'backButtonClicked',
    'settingsButtonClicked',
    'invoiceClosed',
    'popupClosed',
    'qrTextReceived',
    'clipboardTextReceived'
  ]
  
  return commonEvents.filter(event => {
    try {
      return typeof webApp[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] === 'function'
    } catch {
      return false
    }
  })
}

/**
 * Main Telegram WebApp fingerprinting function
 */
export default function getTelegramWebAppFingerprint(): TelegramWebAppFingerprint {
  const isTelegramWebView = detectTelegramEnvironment()
  
  if (!isTelegramWebView) {
    return {
      isTelegramWebView: false,
      webAppData: null,
      telegramVersion: null,
      platform: null,
      bridgeFingerprint: null
    }
  }
  
  return {
    isTelegramWebView: true,
    webAppData: getTelegramWebAppData(),
    telegramVersion: extractTelegramVersion(),
    platform: extractTelegramPlatform(),
    bridgeFingerprint: getTelegramBridgeFingerprint()
  }
}