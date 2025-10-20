/**
 * WebView fingerprinting
 * Detects WebView-specific characteristics and injected objects
 */

export interface WebViewFingerprint {
  isWebView: boolean
  webViewType: WebViewType
  webViewEngine: string
  webViewVersion: string | null
  injectedObjects: string[]
  customUserAgent: string
  webViewFeatures: string[]
  performanceCharacteristics: PerformanceSignature
  storageIsolation: StorageIsolation
}

export type WebViewType = 'telegram' | 'facebook' | 'instagram' | 'tiktok' | 'wechat' | 'line' | 'native_ios' | 'native_android' | 'electron' | 'unknown' | 'none'

export interface PerformanceSignature {
  renderingSpeed: number
  jsExecutionSpeed: number
  memoryUsage: number
  networkLatency: number
  domManipulationSpeed: number
}

export interface StorageIsolation {
  isIsolatedFromBrowser: boolean
  sharedWithOtherApps: boolean
  persistsAfterAppClose: boolean
  localStorageQuota: number
  sessionStorageQuota: number
  indexedDBQuota: number
}

function detectWebViewType(): WebViewType {
  const ua = navigator.userAgent.toLowerCase()
  
  // Telegram WebView
  if (ua.includes('telegramwebview') || ua.includes('telegram') || window.Telegram?.WebApp) {
    return 'telegram'
  }
  
  // Facebook WebView
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('facebook')) {
    return 'facebook'
  }
  
  // Instagram WebView
  if (ua.includes('instagram')) {
    return 'instagram'
  }
  
  // TikTok WebView
  if (ua.includes('tiktok') || ua.includes('musically')) {
    return 'tiktok'
  }
  
  // WeChat WebView
  if (ua.includes('micromessenger')) {
    return 'wechat'
  }
  
  // Line WebView
  if (ua.includes('line')) {
    return 'line'
  }
  
  // iOS WebView indicators
  if (ua.includes('mobile/') && !ua.includes('safari/')) {
    return 'native_ios'
  }
  
  // Android WebView indicators
  if (ua.includes('android') && ua.includes('wv')) {
    return 'native_android'
  }
  
  // Electron
  if ((window as any).require || (window as any).process || (window as any).global) {
    return 'electron'
  }
  
  // Check for other WebView indicators
  if (isWebViewEnvironment()) {
    return 'unknown'
  }
  
  return 'none'
}

function isWebViewEnvironment(): boolean {
  const indicators = [
    // Missing browser-specific objects
    !(window as any).chrome && !(window as any).safari && !(window as any).opera,
    
    // WebView-specific properties
    !!(window as any).__gCrWeb,
    !!(window as any).__crWeb,
    !!(window as any).webkit?.messageHandlers,
    
    // Missing standard browser APIs
    !(window as any).openDatabase && 'webkitRequestFileSystem' in window,
    
    // Performance characteristics
    navigator.hardwareConcurrency === 1,
    
    // User agent anomalies
    /Mobile.*Safari/.test(navigator.userAgent) && !/Version/.test(navigator.userAgent)
  ]
  
  return indicators.filter(Boolean).length >= 2
}

function getWebViewEngine(): string {
  const ua = navigator.userAgent
  
  if (/WebKit\/(\d+\.\d+)/.test(ua)) {
    const match = ua.match(/WebKit\/(\d+\.\d+)/)
    return `WebKit/${match![1]}`
  }
  
  if (/Chrome\/(\d+\.\d+)/.test(ua)) {
    const match = ua.match(/Chrome\/(\d+\.\d+)/)
    return `Chromium/${match![1]}`
  }
  
  if (/Gecko\/(\d+)/.test(ua)) {
    const match = ua.match(/Gecko\/(\d+)/)
    return `Gecko/${match![1]}`
  }
  
  return 'Unknown'
}

function getWebViewVersion(): string | null {
  const ua = navigator.userAgent
  
  // Try to extract version from various WebView user agents
  const patterns = [
    /Version\/(\d+\.\d+)/,
    /WebView\/(\d+\.\d+)/,
    /wv\).*Chrome\/(\d+\.\d+)/,
    /TelegramWebview\/(\d+\.\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = ua.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

function scanForInjectedObjects(): string[] {
  const injected: string[] = []
  const knownObjects = [
    // Telegram
    'Telegram',
    'TelegramWebviewProxy',
    
    // iOS WebView
    'webkit',
    '__gCrWeb',
    '__crWeb',
    
    // Android WebView
    'AndroidInterface',
    'Android',
    
    // Facebook
    'FBNativeAppBridge',
    
    // Other common injections
    'ReactNativeWebView',
    'window.flutter_inappwebview',
    'window.JSBridge'
  ]
  
  for (const obj of knownObjects) {
    if (hasProperty(window, obj)) {
      injected.push(obj)
    }
  }
  
  // Check for webkit message handlers
  if ((window as any).webkit?.messageHandlers) {
    const handlers = Object.keys((window as any).webkit.messageHandlers)
    injected.push(...handlers.map(h => `webkit.messageHandlers.${h}`))
  }
  
  // Check for unusual global properties
  const unusualProps = Object.getOwnPropertyNames(window).filter(prop => {
    return /^(__)|(Bridge)|(Native)|(WebView)|(App)$/.test(prop) && 
           !['__dirname', '__filename', '__webpack_require__'].includes(prop)
  })
  
  injected.push(...unusualProps)
  
  return [...new Set(injected)] // Remove duplicates
}

function hasProperty(obj: any, path: string): boolean {
  try {
    const parts = path.split('.')
    let current = obj
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return false
      }
      current = current[part]
    }
    
    return true
  } catch {
    return false
  }
}

function analyzeUserAgentModifications(): string {
  const ua = navigator.userAgent
  
  // Common modifications in WebViews
  const modifications: string[] = []
  
  // Check for missing Safari version in iOS
  if (/iPhone|iPad/.test(ua) && !/Version\//.test(ua)) {
    modifications.push('missing_safari_version')
  }
  
  // Check for WebView indicators
  if (/wv\)/.test(ua)) {
    modifications.push('android_webview_marker')
  }
  
  // Check for custom app identifiers
  if (/TelegramWebview/.test(ua)) {
    modifications.push('telegram_identifier')
  }
  
  // Check for unusual Chrome versions
  if (/Chrome\/(\d+)/.test(ua)) {
    const chromeVersion = parseInt(ua.match(/Chrome\/(\d+)/)![1])
    if (chromeVersion < 70 || chromeVersion > 120) {
      modifications.push('unusual_chrome_version')
    }
  }
  
  return modifications.join(',')
}

function detectWebViewFeatures(): string[] {
  const features: string[] = []
  
  // File API restrictions
  try {
    const input = document.createElement('input')
    input.type = 'file'
    if (!input.webkitdirectory) {
      features.push('no_directory_selection')
    }
  } catch {
    features.push('file_api_restricted')
  }
  
  // Clipboard API
  if (!navigator.clipboard) {
    features.push('no_clipboard_api')
  }
  
  // Fullscreen API
  if (!document.fullscreenEnabled) {
    features.push('no_fullscreen')
  }
  
  // Notification API
  if (!('Notification' in window)) {
    features.push('no_notifications')
  }
  
  // WebRTC restrictions
  if (!window.RTCPeerConnection && !(window as any).webkitRTCPeerConnection) {
    features.push('no_webrtc')
  }
  
  // Payment Request API
  if (!window.PaymentRequest) {
    features.push('no_payment_request')
  }
  
  // Web Share API
  if (!navigator.share) {
    features.push('no_web_share')
  }
  
  // Device APIs
  if (!navigator.geolocation) {
    features.push('no_geolocation')
  }
  
  if (!navigator.vibrate) {
    features.push('no_vibration')
  }
  
  // Storage restrictions
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch {
    features.push('localStorage_restricted')
  }
  
  return features
}

function measureWebViewPerformance(): PerformanceSignature {
  const start = performance.now()
  
  // Simple rendering test
  const div = document.createElement('div')
  div.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;background:red;'
  document.body.appendChild(div)
  const renderTime = performance.now() - start
  document.body.removeChild(div)
  
  // JS execution test
  const jsStart = performance.now()
  let sum = 0
  for (let i = 0; i < 10000; i++) {
    sum += Math.random()
  }
  const jsTime = performance.now() - jsStart
  
  // Memory estimation
  const memoryInfo = (performance as any).memory
  const usedMemory = memoryInfo ? memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize : 0
  
  // DOM manipulation test
  const domStart = performance.now()
  const testDiv = document.createElement('div')
  for (let i = 0; i < 100; i++) {
    const child = document.createElement('span')
    child.textContent = `Item ${i}`
    testDiv.appendChild(child)
  }
  const domTime = performance.now() - domStart
  
  return {
    renderingSpeed: Math.round(1000 / Math.max(renderTime, 1)),
    jsExecutionSpeed: Math.round(1000 / Math.max(jsTime, 1)),
    memoryUsage: Math.round(usedMemory * 100),
    networkLatency: 0, // Would need actual network test
    domManipulationSpeed: Math.round(1000 / Math.max(domTime, 1))
  }
}

function analyzeStorageIsolation(): StorageIsolation {
  let localStorageQuota = 0
  let sessionStorageQuota = 0
  let indexedDBQuota = 0
  
  // Test localStorage quota
  try {
    const testData = 'a'.repeat(1024) // 1KB
    let count = 0
    while (count < 10000) { // Max 10MB test
      try {
        localStorage.setItem(`test_${count}`, testData)
        count++
      } catch {
        break
      }
    }
    localStorageQuota = count
    
    // Cleanup
    for (let i = 0; i < count; i++) {
      localStorage.removeItem(`test_${i}`)
    }
  } catch {
    localStorageQuota = -1 // Restricted
  }
  
  // Test sessionStorage quota (simplified)
  try {
    sessionStorage.setItem('test', 'test')
    sessionStorageQuota = 1
    sessionStorage.removeItem('test')
  } catch {
    sessionStorageQuota = -1
  }
  
  // Test IndexedDB quota (simplified check)
  try {
    if (window.indexedDB) {
      indexedDBQuota = 1
    }
  } catch {
    indexedDBQuota = -1
  }
  
  return {
    isIsolatedFromBrowser: isWebViewEnvironment(),
    sharedWithOtherApps: false, // Hard to detect
    persistsAfterAppClose: localStorageQuota > 0,
    localStorageQuota,
    sessionStorageQuota,
    indexedDBQuota
  }
}

/**
 * Main WebView fingerprinting function
 */
export default function getWebViewFingerprint(): WebViewFingerprint {
  const webViewType = detectWebViewType()
  const isWebView = webViewType !== 'none'
  
  return {
    isWebView,
    webViewType,
    webViewEngine: getWebViewEngine(),
    webViewVersion: getWebViewVersion(),
    injectedObjects: scanForInjectedObjects(),
    customUserAgent: analyzeUserAgentModifications(),
    webViewFeatures: detectWebViewFeatures(),
    performanceCharacteristics: measureWebViewPerformance(),
    storageIsolation: analyzeStorageIsolation()
  }
}