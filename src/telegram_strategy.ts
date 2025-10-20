/**
 * Adaptive strategy for Telegram Mini Apps
 * Provides enhanced fingerprinting logic specifically for Telegram WebView environment
 */

import { BuiltinComponents } from './sources'

export interface TelegramAdaptiveStrategy {
  detectTelegramEnvironment(): boolean
  adjustSourceWeights(components: BuiltinComponents): EnhancedComponents
  getEnhancedConfidenceScore(components: BuiltinComponents): EnhancedConfidence
  generateTelegramSpecificFingerprint(components: BuiltinComponents): string
}

export interface EnhancedComponents extends BuiltinComponents {
  // Enhanced weightings for Telegram environment
  _weights?: Record<string, number>
  _telegramContext?: TelegramContext
}

export interface EnhancedConfidence {
  score: number
  telegramAdjustment: boolean
  behavioralFactor: number
  webViewFactor: number
  hapticFactor: number
  networkFactor: number
  stabilityScore: number
}

export interface TelegramContext {
  isTelegramWebView: boolean
  telegramVersion: string | null
  webViewType: string
  hasHapticFeedback: boolean
  hasBehavioralData: boolean
  networkQuality: string
}

class TelegramAdaptiveStrategyImpl implements TelegramAdaptiveStrategy {
  detectTelegramEnvironment(): boolean {
    const ua = navigator.userAgent.toLowerCase()
    return (
      /telegramwebview/i.test(ua) ||
      /telegram/i.test(ua) ||
      window.Telegram?.WebApp !== undefined
    )
  }

  adjustSourceWeights(components: BuiltinComponents): EnhancedComponents {
    const isTelegram = this.detectTelegramEnvironment()
    
    // Default weights for all sources
    const baseWeights: Record<string, number> = {
      // Traditional sources (lower weight in WebView)
      canvas: 0.8,
      audio: 0.6,
      fonts: 0.7,
      webGlBasics: 0.7,
      webGlExtensions: 0.7,
      
      // Platform and device info (medium weight)
      platform: 1.0,
      hardwareConcurrency: 1.0,
      deviceMemory: 1.0,
      screenResolution: 0.9,
      screenFrame: 0.9,
      timezone: 1.2,
      
      // Enhanced sources (higher weight in WebView)
      telegramWebApp: 1.0,
      behavioral: 1.0,
      webView: 1.0,
      network: 1.0,
      haptic: 1.0,
      
      // System sources (consistent across environments)
      languages: 1.1,
      colorDepth: 1.0,
      touchSupport: 1.1,
      vendor: 0.9,
      vendorFlavors: 0.9,
      osCpu: 1.0
    }

    if (isTelegram) {
      // Adjust weights for Telegram environment
      const telegramWeights: Record<string, number> = {
        // Reduce weight of sources that are limited in WebView
        canvas: 0.4,
        audio: 0.3,
        fonts: 0.5,
        plugins: 0.1, // Very limited in WebView
        
        // Increase weight of Telegram-specific sources
        telegramWebApp: 2.5,
        webView: 2.0,
        behavioral: 2.2,
        haptic: 1.8,
        network: 1.6,
        
        // Platform identification more important
        platform: 1.3,
        vendor: 1.2,
        vendorFlavors: 1.5,
        timezone: 1.4,
        languages: 1.3,
        
        // User interaction patterns
        touchSupport: 1.4,
        colorGamut: 1.1,
        reducedMotion: 1.1,
        
        // Device characteristics
        hardwareConcurrency: 1.2,
        deviceMemory: 1.2,
        screenResolution: 1.1
      }

      // Merge weights
      Object.assign(baseWeights, telegramWeights)
    }

    const telegramContext = this.extractTelegramContext(components)

    return {
      ...components,
      _weights: baseWeights,
      _telegramContext: telegramContext
    }
  }

  getEnhancedConfidenceScore(components: BuiltinComponents): EnhancedConfidence {
    const isTelegram = this.detectTelegramEnvironment()
    const context = this.extractTelegramContext(components)
    
    // Calculate base confidence using existing logic
    let baseScore = 0.5 // Default confidence
    
    // Platform-based adjustments
    if ('platform' in components && components.platform) {
      const platformComponent = components.platform as any
      const platform = platformComponent?.value || platformComponent
      if (typeof platform === 'string') {
        if (platform.includes('iPhone') || platform.includes('iPad')) {
          baseScore += 0.1
        } else if (platform.includes('Android')) {
          baseScore += 0.05
        }
      }
    }

    // Behavioral factor
    let behavioralFactor = 0
    if ('behavioral' in components && components.behavioral) {
      const behavioral = components.behavioral as any
      if (behavioral.touchPatterns || behavioral.motionSignature) {
        behavioralFactor = 0.2
      }
    }

    // WebView factor
    let webViewFactor = 0
    if ('webView' in components && components.webView) {
      const webView = components.webView as any
      if (webView.isWebView && webView.webViewType === 'telegram') {
        webViewFactor = 0.25
      }
    }

    // Haptic factor
    let hapticFactor = 0
    if ('haptic' in components && components.haptic) {
      const haptic = components.haptic as any
      if (haptic.isAvailable && haptic.isTelegramHaptic) {
        hapticFactor = 0.15
      }
    }

    // Network factor
    let networkFactor = 0
    if ('network' in components && components.network) {
      const network = components.network as any
      if (network.connectionInfo && network.ipBasedEntropy) {
        networkFactor = 0.1
      }
    }

    // Calculate stability score
    const stabilityScore = this.calculateStabilityScore(components, context)

    // Final confidence calculation
    let finalScore = baseScore
    
    if (isTelegram) {
      // In Telegram environment, rely more on enhanced sources
      finalScore = Math.min(0.9, baseScore + behavioralFactor + webViewFactor + hapticFactor + networkFactor)
      
      // Adjust based on available data
      if (context.hasBehavioralData && context.hasHapticFeedback) {
        finalScore += 0.05
      }
    } else {
      // In regular browser, use standard calculation
      finalScore = Math.min(0.85, baseScore + (behavioralFactor + networkFactor) * 0.5)
    }

    return {
      score: Math.max(0.1, Math.min(0.9, finalScore)),
      telegramAdjustment: isTelegram,
      behavioralFactor,
      webViewFactor,
      hapticFactor,
      networkFactor,
      stabilityScore
    }
  }

  generateTelegramSpecificFingerprint(components: BuiltinComponents): string {
    const enhancedComponents = this.adjustSourceWeights(components)
    const weights = enhancedComponents._weights || {}
    
    // Create weighted hash inputs
    const weightedInputs: string[] = []
    
    for (const [key, component] of Object.entries(components)) {
      if (key.startsWith('_')) continue // Skip internal properties
      
      const weight = weights[key] || 1.0
      let value: string
      
      if (typeof component === 'object' && component !== null) {
        if ('value' in component) {
          value = String((component as any).value)
        } else {
          value = JSON.stringify(component)
        }
      } else {
        value = String(component)
      }
      
      // Apply weight by repeating the value
      const repetitions = Math.max(1, Math.round(weight * 10))
      for (let i = 0; i < repetitions; i++) {
        weightedInputs.push(`${key}:${value}`)
      }
    }
    
    // Add Telegram-specific context
    if (enhancedComponents._telegramContext) {
      const context = enhancedComponents._telegramContext
      weightedInputs.push(`telegram:${context.isTelegramWebView}`)
      weightedInputs.push(`version:${context.telegramVersion || 'unknown'}`)
      weightedInputs.push(`webview:${context.webViewType}`)
    }
    
    // Simple hash function (in real implementation, use proper hashing)
    return this.simpleHash(weightedInputs.join('|'))
  }

  private extractTelegramContext(components: BuiltinComponents): TelegramContext {
    const telegramData = 'telegramWebApp' in components ? components.telegramWebApp as any : null
    const webViewData = 'webView' in components ? components.webView as any : null
    const hapticData = 'haptic' in components ? components.haptic as any : null
    const behavioralData = 'behavioral' in components ? components.behavioral as any : null
    const networkData = 'network' in components ? components.network as any : null

    return {
      isTelegramWebView: telegramData?.isTelegramWebView || false,
      telegramVersion: telegramData?.telegramVersion || null,
      webViewType: webViewData?.webViewType || 'unknown',
      hasHapticFeedback: hapticData?.isAvailable || false,
      hasBehavioralData: !!(behavioralData?.touchPatterns || behavioralData?.motionSignature),
      networkQuality: networkData?.networkPerformance?.networkQuality || 'unknown'
    }
  }

  private calculateStabilityScore(components: BuiltinComponents, context: TelegramContext): number {
    let stabilityFactors = 0
    let totalFactors = 0

    // Platform stability
    if ('platform' in components) {
      stabilityFactors += 1
      totalFactors += 1
    }

    // Timezone stability
    if ('timezone' in components) {
      stabilityFactors += 1
      totalFactors += 1
    }

    // Hardware stability
    if ('hardwareConcurrency' in components && 'deviceMemory' in components) {
      stabilityFactors += 1
      totalFactors += 1
    }

    // Language stability
    if ('languages' in components) {
      stabilityFactors += 1
      totalFactors += 1
    }

    // Telegram-specific stability
    if (context.isTelegramWebView) {
      if (context.telegramVersion) {
        stabilityFactors += 1
      }
      if (context.hasHapticFeedback) {
        stabilityFactors += 0.5
      }
      totalFactors += 1.5
    }

    return totalFactors > 0 ? stabilityFactors / totalFactors : 0.5
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

// Export singleton instance
export const telegramStrategy = new TelegramAdaptiveStrategyImpl()

/**
 * Creates enhanced components with Telegram-specific adjustments
 */
export function createEnhancedComponents(components: BuiltinComponents): EnhancedComponents {
  return telegramStrategy.adjustSourceWeights(components)
}

/**
 * Calculates enhanced confidence score for Telegram environment
 */
export function calculateEnhancedConfidence(components: BuiltinComponents): EnhancedConfidence {
  return telegramStrategy.getEnhancedConfidenceScore(components)
}

/**
 * Generates Telegram-optimized fingerprint
 */
export function generateEnhancedFingerprint(components: BuiltinComponents): string {
  return telegramStrategy.generateTelegramSpecificFingerprint(components)
}