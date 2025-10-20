/**
 * Network fingerprinting
 * Analyzes network characteristics and timing signatures
 */

export interface NetworkFingerprint {
  connectionInfo: ConnectionInfo
  timingSignature: NetworkTimingSignature
  ipBasedEntropy: IPBasedEntropy
  networkPerformance: NetworkPerformance
}

export interface ConnectionInfo {
  connectionType: string
  downlink: number
  effectiveType: string
  rtt: number
  saveData: boolean
  onlineStatus: boolean
}

export interface NetworkTimingSignature {
  dnsLookupTime: number
  tcpConnectTime: number
  tlsHandshakeTime: number
  firstByteTime: number
  downloadTime: number
  uploadTime: number
  connectionReuse: boolean
  requestVariability: number
}

export interface IPBasedEntropy {
  timezone: string
  timezoneOffset: number
  language: string
  languages: string[]
  regionFromTime: string
  clockSkew: number
  timeAccuracy: number
}

export interface NetworkPerformance {
  latency: number
  bandwidth: number
  jitter: number
  packetLoss: number
  networkQuality: 'poor' | 'good' | 'excellent'
}

function getConnectionInfo(): ConnectionInfo {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  return {
    connectionType: connection?.type || 'unknown',
    downlink: connection?.downlink || 0,
    effectiveType: connection?.effectiveType || 'unknown',
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
    onlineStatus: navigator.onLine
  }
}

async function measureNetworkTiming(): Promise<NetworkTimingSignature> {
  const timings: number[] = []
  const requests: Promise<void>[] = []
  
  // Test multiple small requests to get timing variety
  for (let i = 0; i < 3; i++) {
    requests.push(
      measureSingleRequest(`data:text/plain,test${i}`)
        .then(timing => {
          timings.push(timing)
        })
        .catch(() => {
          timings.push(0)
        })
    )
  }
  
  await Promise.all(requests)
  
  const avgTiming = timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 0
  const variability = timings.length > 1 ? calculateVariability(timings) : 0
  
  // Try to get performance timing if available
  const perfTiming = getPerformanceTiming()
  
  return {
    dnsLookupTime: perfTiming.dnsLookupTime,
    tcpConnectTime: perfTiming.tcpConnectTime,
    tlsHandshakeTime: perfTiming.tlsHandshakeTime,
    firstByteTime: perfTiming.firstByteTime,
    downloadTime: avgTiming,
    uploadTime: 0, // Would need actual upload test
    connectionReuse: perfTiming.connectionReuse,
    requestVariability: variability
  }
}

async function measureSingleRequest(url: string): Promise<number> {
  const start = performance.now()
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache'
    })
    
    if (response.ok) {
      await response.text()
    }
    
    return performance.now() - start
  } catch {
    return 0
  }
}

function getPerformanceTiming(): {
  dnsLookupTime: number
  tcpConnectTime: number
  tlsHandshakeTime: number
  firstByteTime: number
  connectionReuse: boolean
} {
  const timing = performance.timing
  
  if (!timing) {
    return {
      dnsLookupTime: 0,
      tcpConnectTime: 0,
      tlsHandshakeTime: 0,
      firstByteTime: 0,
      connectionReuse: false
    }
  }
  
  const dnsLookupTime = timing.domainLookupEnd - timing.domainLookupStart
  const tcpConnectTime = timing.connectEnd - timing.connectStart
  const tlsHandshakeTime = timing.connectEnd - timing.secureConnectionStart || 0
  const firstByteTime = timing.responseStart - timing.requestStart
  
  // Connection reuse detection (simplified)
  const connectionReuse = dnsLookupTime === 0 && tcpConnectTime === 0
  
  return {
    dnsLookupTime,
    tcpConnectTime,
    tlsHandshakeTime,
    firstByteTime,
    connectionReuse
  }
}

function calculateVariability(values: number[]): number {
  if (values.length < 2) return 0
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length
  
  return Math.sqrt(variance)
}

function getIPBasedEntropy(): IPBasedEntropy {
  const now = new Date()
  
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: now.getTimezoneOffset(),
    language: navigator.language,
    languages: Array.from(navigator.languages || [navigator.language]),
    regionFromTime: inferRegionFromTime(),
    clockSkew: measureClockSkew(),
    timeAccuracy: measureTimeAccuracy()
  }
}

function inferRegionFromTime(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Extract region from timezone
    if (timezone.includes('/')) {
      const parts = timezone.split('/')
      return parts[0] || 'Unknown'
    }
    
    return timezone
  } catch {
    return 'Unknown'
  }
}

function measureClockSkew(): number {
  try {
    // Compare Date.now() with performance.now() + performance.timeOrigin
    const dateNow = Date.now()
    const perfNow = performance.now() + performance.timeOrigin
    
    return Math.abs(dateNow - perfNow)
  } catch {
    return 0
  }
}

function measureTimeAccuracy(): number {
  // Measure the resolution of Date.now()
  const start = Date.now()
  let count = 0
  
  while (Date.now() === start && count < 1000) {
    count++
  }
  
  return count
}

async function measureNetworkPerformance(): Promise<NetworkPerformance> {
  const latencies: number[] = []
  const bandwidthTests: number[] = []
  
  // Measure latency with multiple small requests
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    
    try {
      await fetch('data:text/plain,ping', { 
        method: 'GET', 
        cache: 'no-cache' 
      })
      
      latencies.push(performance.now() - start)
    } catch {
      // Skip failed requests
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Simple bandwidth test with small data
  try {
    const testData = 'x'.repeat(1024) // 1KB
    const start = performance.now()
    
    await fetch('data:text/plain,' + testData)
    const time = performance.now() - start
    
    if (time > 0) {
      bandwidthTests.push(1024 / time) // KB/ms
    }
  } catch {
    // Bandwidth test failed
  }
  
  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
  const jitter = latencies.length > 1 ? calculateVariability(latencies) : 0
  const avgBandwidth = bandwidthTests.length > 0 ? bandwidthTests.reduce((a, b) => a + b, 0) / bandwidthTests.length : 0
  
  // Simple packet loss estimation based on failed requests
  const packetLoss = (5 - latencies.length) / 5
  
  // Determine network quality
  let networkQuality: 'poor' | 'good' | 'excellent' = 'poor'
  if (avgLatency < 100 && packetLoss < 0.1) {
    networkQuality = 'excellent'
  } else if (avgLatency < 300 && packetLoss < 0.2) {
    networkQuality = 'good'
  }
  
  return {
    latency: avgLatency,
    bandwidth: avgBandwidth,
    jitter,
    packetLoss,
    networkQuality
  }
}

/**
 * Main network fingerprinting function
 */
export default async function getNetworkFingerprint(): Promise<NetworkFingerprint> {
  const connectionInfo = getConnectionInfo()
  const ipBasedEntropy = getIPBasedEntropy()
  
  // Run timing and performance measurements in parallel
  const [timingSignature, networkPerformance] = await Promise.all([
    measureNetworkTiming(),
    measureNetworkPerformance()
  ])
  
  return {
    connectionInfo,
    timingSignature,
    ipBasedEntropy,
    networkPerformance
  }
}

/**
 * Synchronous version that returns immediately available data
 */
export function getNetworkFingerprintSync(): Partial<NetworkFingerprint> {
  return {
    connectionInfo: getConnectionInfo(),
    ipBasedEntropy: getIPBasedEntropy(),
    timingSignature: undefined, // Requires async measurement
    networkPerformance: undefined // Requires async measurement
  }
}