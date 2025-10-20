/**
 * Haptic feedback fingerprinting
 * Analyzes haptic capabilities and response patterns
 */

export interface HapticFingerprint {
  isAvailable: boolean
  isTelegramHaptic: boolean
  hapticCapabilities: string[]
  hapticResponseTiming: number[]
  hapticIntensitySupport: boolean
  customHapticPatterns: string[]
  vibrationSupport: VibrationSupport
}

export interface VibrationSupport {
  hasVibration: boolean
  supportsPattern: boolean
  maxDuration: number
  timingAccuracy: number
}

function detectHapticAvailability(): boolean {
  return !!(
    navigator.vibrate ||
    window.Telegram?.WebApp?.HapticFeedback ||
    (window as any).webkit?.messageHandlers?.haptic
  )
}

function detectTelegramHaptic(): boolean {
  return !!(window.Telegram?.WebApp?.HapticFeedback)
}

async function testHapticCapabilities(): Promise<string[]> {
  const capabilities: string[] = []
  
  // Test basic vibration
  if (navigator.vibrate) {
    capabilities.push('basic_vibration')
    
    // Test pattern support
    try {
      navigator.vibrate([100, 50, 100])
      capabilities.push('vibration_patterns')
    } catch {
      // Pattern not supported
    }
  }
  
  // Test Telegram haptic feedback
  const telegramHaptic = window.Telegram?.WebApp?.HapticFeedback
  if (telegramHaptic) {
    capabilities.push('telegram_haptic')
    
    // Test different haptic types
    const hapticTypes = [
      'impactOccurred',
      'notificationOccurred', 
      'selectionChanged'
    ]
    
    for (const type of hapticTypes) {
      if (typeof telegramHaptic[type] === 'function') {
        capabilities.push(`telegram_${type}`)
      }
    }
  }
  
  // Test iOS haptic feedback (if available)
  if ((window as any).webkit?.messageHandlers?.haptic) {
    capabilities.push('ios_haptic')
  }
  
  // Test Android haptic feedback
  if ((window as any).Android?.hapticFeedback) {
    capabilities.push('android_haptic')
  }
  
  return capabilities
}

async function measureHapticResponseTiming(): Promise<number[]> {
  const timings: number[] = []
  
  // Test with basic vibration
  if (navigator.vibrate) {
    for (let i = 0; i < 3; i++) {
      const start = performance.now()
      
      try {
        navigator.vibrate(50)
        
        // Wait for vibration to potentially start
        await new Promise(resolve => setTimeout(resolve, 10))
        
        const responseTime = performance.now() - start
        timings.push(responseTime)
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch {
        // Vibration failed
      }
    }
  }
  
  // Test with Telegram haptic
  const telegramHaptic = window.Telegram?.WebApp?.HapticFeedback
  if (telegramHaptic && telegramHaptic.impactOccurred) {
    for (let i = 0; i < 3; i++) {
      const start = performance.now()
      
      try {
        telegramHaptic.impactOccurred('light')
        
        await new Promise(resolve => setTimeout(resolve, 10))
        
        const responseTime = performance.now() - start
        timings.push(responseTime)
        
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch {
        // Haptic failed
      }
    }
  }
  
  return timings
}

function testHapticIntensitySupport(): boolean {
  const telegramHaptic = window.Telegram?.WebApp?.HapticFeedback
  
  if (telegramHaptic && telegramHaptic.impactOccurred) {
    try {
      // Test different intensity levels
      const intensities = ['light', 'medium', 'heavy']
      return intensities.every(intensity => {
        try {
          telegramHaptic.impactOccurred(intensity)
          return true
        } catch {
          return false
        }
      })
    } catch {
      return false
    }
  }
  
  // Test vibration intensity with patterns
  if (navigator.vibrate) {
    try {
      // Test different vibration strengths (simulated with duration)
      navigator.vibrate([10, 10, 50, 10, 100])
      return true
    } catch {
      return false
    }
  }
  
  return false
}

async function analyzeCustomHapticPatterns(): Promise<string[]> {
  const patterns: string[] = []
  
  if (navigator.vibrate) {
    const testPatterns = [
      [100],
      [100, 50, 100],
      [50, 25, 50, 25, 50],
      [200, 100, 200, 100, 200]
    ]
    
    for (let i = 0; i < testPatterns.length; i++) {
      try {
        const pattern = testPatterns[i]
        navigator.vibrate(pattern)
        patterns.push(`pattern_${i}_${pattern.join('_')}`)
        
        // Wait between patterns
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch {
        // Pattern not supported
      }
    }
  }
  
  const telegramHaptic = window.Telegram?.WebApp?.HapticFeedback
  if (telegramHaptic) {
    const hapticSequences = [
      ['light', 'medium', 'heavy'],
      ['light', 'light', 'heavy'],
      ['medium', 'light', 'medium']
    ]
    
    for (let i = 0; i < hapticSequences.length; i++) {
      try {
        const sequence = hapticSequences[i]
        
        for (const intensity of sequence) {
          if (telegramHaptic.impactOccurred) {
            telegramHaptic.impactOccurred(intensity)
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }
        
        patterns.push(`telegram_sequence_${i}_${sequence.join('_')}`)
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch {
        // Sequence not supported
      }
    }
  }
  
  return patterns
}

async function analyzeVibrationSupport(): Promise<VibrationSupport> {
  const hasVibration = !!navigator.vibrate
  let supportsPattern = false
  let maxDuration = 0
  let timingAccuracy = 0
  
  if (hasVibration) {
    // Test pattern support
    try {
      navigator.vibrate([100, 50, 100])
      supportsPattern = true
    } catch {
      supportsPattern = false
    }
    
    // Test maximum duration
    const durations = [100, 500, 1000, 2000, 5000]
    for (const duration of durations) {
      try {
        navigator.vibrate(duration)
        maxDuration = duration
      } catch {
        break
      }
    }
    
    // Test timing accuracy
    if (supportsPattern) {
      const start = performance.now()
      navigator.vibrate([100, 100, 100])
      
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const actualDuration = performance.now() - start
      const expectedDuration = 300 // 100 + 100 + 100
      timingAccuracy = Math.abs(actualDuration - expectedDuration)
    }
  }
  
  return {
    hasVibration,
    supportsPattern,
    maxDuration,
    timingAccuracy
  }
}

/**
 * Main haptic fingerprinting function
 */
export default async function getHapticFingerprint(): Promise<HapticFingerprint> {
  const isAvailable = detectHapticAvailability()
  
  if (!isAvailable) {
    return {
      isAvailable: false,
      isTelegramHaptic: false,
      hapticCapabilities: [],
      hapticResponseTiming: [],
      hapticIntensitySupport: false,
      customHapticPatterns: [],
      vibrationSupport: {
        hasVibration: false,
        supportsPattern: false,
        maxDuration: 0,
        timingAccuracy: 0
      }
    }
  }
  
  const isTelegramHaptic = detectTelegramHaptic()
  
  // Run all tests in parallel where possible
  const [
    hapticCapabilities,
    hapticResponseTiming,
    customHapticPatterns,
    vibrationSupport
  ] = await Promise.all([
    testHapticCapabilities(),
    measureHapticResponseTiming(),
    analyzeCustomHapticPatterns(),
    analyzeVibrationSupport()
  ])
  
  const hapticIntensitySupport = testHapticIntensitySupport()
  
  return {
    isAvailable: true,
    isTelegramHaptic,
    hapticCapabilities,
    hapticResponseTiming,
    hapticIntensitySupport,
    customHapticPatterns,
    vibrationSupport
  }
}

/**
 * Synchronous version that returns immediately available data
 */
export function getHapticFingerprintSync(): Partial<HapticFingerprint> {
  const isAvailable = detectHapticAvailability()
  const isTelegramHaptic = detectTelegramHaptic()
  
  return {
    isAvailable,
    isTelegramHaptic,
    hapticCapabilities: [], // Requires async testing
    hapticResponseTiming: [], // Requires async measurement
    hapticIntensitySupport: isAvailable ? testHapticIntensitySupport() : false,
    customHapticPatterns: [], // Requires async testing
    vibrationSupport: {
      hasVibration: !!navigator.vibrate,
      supportsPattern: false, // Requires testing
      maxDuration: 0, // Requires testing
      timingAccuracy: 0 // Requires testing
    }
  }
}