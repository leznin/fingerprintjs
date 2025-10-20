/**
 * Behavioral fingerprinting
 * Analyzes user interaction patterns, touch behavior, and timing
 */

export interface BehavioralFingerprint {
  touchPatterns: TouchPattern | null
  scrollBehavior: ScrollBehavior | null
  timingFingerprint: TimingFingerprint | null
  interactionRhythm: InteractionRhythm | null
  motionSignature: MotionSignature | null
  isCollecting: boolean
}

export interface TouchPattern {
  averagePressure: number
  averageArea: number
  averageVelocity: number
  touchDuration: number
  touchFrequency: number
  gestureComplexity: number
  touchPointVariation: number
}

export interface ScrollBehavior {
  averageScrollSpeed: number
  scrollAcceleration: number
  scrollDeceleration: number
  momentumPattern: number
  elasticBounceSignature: number
  scrollDirection: 'vertical' | 'horizontal' | 'both' | 'none'
  scrollConsistency: number
}

export interface TimingFingerprint {
  averageReactionTime: number
  keyboardInputTiming: number
  scrollToTouchDelay: number
  focusBlurPattern: number
  interactionInterval: number
  timingVariability: number
}

export interface InteractionRhythm {
  tapRhythm: number
  scrollRhythm: number
  pausePatterns: number[]
  interactionSequence: string
  rhythmConsistency: number
}

export interface MotionSignature {
  handTremor: number
  scrollStability: number
  touchPrecision: number
  gestureFlowness: number
  movementEntropy: number
}

class BehavioralCollector {
  private touchData: TouchEvent[] = []
  private scrollData: any[] = []
  private motionData: any[] = []
  private isActive = false
  private collectionDuration = 3000 // 3 seconds

  start(): Promise<BehavioralFingerprint> {
    return new Promise((resolve) => {
      this.isActive = true
      this.setupEventListeners()

      setTimeout(() => {
        this.stop()
        resolve(this.generateFingerprint())
      }, this.collectionDuration)
    })
  }

  private setupEventListeners(): void {
    // Touch events
    const touchHandler = (event: TouchEvent) => {
      if (this.isActive) {
        this.touchData.push(event)
      }
    }

    // Scroll events
    const scrollHandler = (event: Event) => {
      if (this.isActive) {
        this.scrollData.push({
          timestamp: Date.now(),
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          event
        })
      }
    }

    // Motion events
    const motionHandler = (event: DeviceMotionEvent) => {
      if (this.isActive && event.accelerationIncludingGravity) {
        this.motionData.push({
          timestamp: Date.now(),
          acceleration: event.accelerationIncludingGravity,
          rotationRate: event.rotationRate
        })
      }
    }

    // Add event listeners
    document.addEventListener('touchstart', touchHandler, { passive: true })
    document.addEventListener('touchmove', touchHandler, { passive: true })
    document.addEventListener('touchend', touchHandler, { passive: true })
    document.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('devicemotion', motionHandler, { passive: true })

    // Store cleanup function
    this.cleanup = () => {
      document.removeEventListener('touchstart', touchHandler)
      document.removeEventListener('touchmove', touchHandler)
      document.removeEventListener('touchend', touchHandler)
      document.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('devicemotion', motionHandler)
    }
  }

  private cleanup = () => {}

  private stop(): void {
    this.isActive = false
    this.cleanup()
  }

  private generateFingerprint(): BehavioralFingerprint {
    return {
      touchPatterns: this.analyzeTouchPatterns(),
      scrollBehavior: this.analyzeScrollBehavior(),
      timingFingerprint: this.analyzeTimingPatterns(),
      interactionRhythm: this.analyzeInteractionRhythm(),
      motionSignature: this.analyzeMotionSignature(),
      isCollecting: false
    }
  }

  private analyzeTouchPatterns(): TouchPattern | null {
    if (this.touchData.length === 0) return null

    const touches = this.touchData.flatMap(event => Array.from(event.touches))
    if (touches.length === 0) return null

    const pressures = touches.map(t => t.force || 0).filter(p => p > 0)
    const areas = touches.map(t => (t.radiusX || 0) * (t.radiusY || 0)).filter(a => a > 0)
    
    let totalDuration = 0
    let touchCount = 0
    let velocities: number[] = []

    // Calculate touch durations and velocities
    const touchStarts = this.touchData.filter(e => e.type === 'touchstart')
    const touchEnds = this.touchData.filter(e => e.type === 'touchend')
    
    for (let i = 0; i < Math.min(touchStarts.length, touchEnds.length); i++) {
      const duration = touchEnds[i].timeStamp - touchStarts[i].timeStamp
      totalDuration += duration
      touchCount++
    }

    // Calculate velocities from touchmove events
    const touchMoves = this.touchData.filter(e => e.type === 'touchmove')
    for (let i = 1; i < touchMoves.length; i++) {
      const prev = touchMoves[i - 1]
      const curr = touchMoves[i]
      
      if (prev.touches.length > 0 && curr.touches.length > 0) {
        const prevTouch = prev.touches[0]
        const currTouch = curr.touches[0]
        
        const distance = Math.sqrt(
          Math.pow(currTouch.clientX - prevTouch.clientX, 2) +
          Math.pow(currTouch.clientY - prevTouch.clientY, 2)
        )
        const timeDiff = curr.timeStamp - prev.timeStamp
        
        if (timeDiff > 0) {
          velocities.push(distance / timeDiff)
        }
      }
    }

    return {
      averagePressure: pressures.length > 0 ? pressures.reduce((a, b) => a + b, 0) / pressures.length : 0,
      averageArea: areas.length > 0 ? areas.reduce((a, b) => a + b, 0) / areas.length : 0,
      averageVelocity: velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0,
      touchDuration: touchCount > 0 ? totalDuration / touchCount : 0,
      touchFrequency: touchCount / (this.collectionDuration / 1000),
      gestureComplexity: this.calculateGestureComplexity(),
      touchPointVariation: this.calculateTouchPointVariation()
    }
  }

  private analyzeScrollBehavior(): ScrollBehavior | null {
    if (this.scrollData.length < 2) return null

    const speeds: number[] = []
    const accelerations: number[] = []
    let totalDistance = 0

    for (let i = 1; i < this.scrollData.length; i++) {
      const prev = this.scrollData[i - 1]
      const curr = this.scrollData[i]
      
      const distance = Math.sqrt(
        Math.pow(curr.scrollX - prev.scrollX, 2) +
        Math.pow(curr.scrollY - prev.scrollY, 2)
      )
      
      const timeDiff = curr.timestamp - prev.timestamp
      if (timeDiff > 0) {
        const speed = distance / timeDiff
        speeds.push(speed)
        totalDistance += distance
        
        if (speeds.length > 1) {
          const acceleration = (speed - speeds[speeds.length - 2]) / timeDiff
          accelerations.push(acceleration)
        }
      }
    }

    const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
    const averageAcceleration = accelerations.length > 0 ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0

    return {
      averageScrollSpeed: averageSpeed,
      scrollAcceleration: Math.abs(averageAcceleration),
      scrollDeceleration: this.calculateScrollDeceleration(speeds),
      momentumPattern: this.calculateMomentumPattern(speeds),
      elasticBounceSignature: this.calculateElasticBounce(),
      scrollDirection: this.determineScrollDirection(),
      scrollConsistency: this.calculateScrollConsistency(speeds)
    }
  }

  private analyzeTimingPatterns(): TimingFingerprint | null {
    if (this.touchData.length === 0) return null

    const intervals: number[] = []
    
    for (let i = 1; i < this.touchData.length; i++) {
      intervals.push(this.touchData[i].timeStamp - this.touchData[i - 1].timeStamp)
    }

    const averageInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0
    const variance = intervals.length > 0 ? intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length : 0

    return {
      averageReactionTime: averageInterval,
      keyboardInputTiming: 0, // Would need keyboard events
      scrollToTouchDelay: this.calculateScrollToTouchDelay(),
      focusBlurPattern: 0, // Would need focus events
      interactionInterval: averageInterval,
      timingVariability: Math.sqrt(variance)
    }
  }

  private analyzeInteractionRhythm(): InteractionRhythm | null {
    if (this.touchData.length === 0) return null

    const tapIntervals: number[] = []
    const touchStarts = this.touchData.filter(e => e.type === 'touchstart')
    
    for (let i = 1; i < touchStarts.length; i++) {
      tapIntervals.push(touchStarts[i].timeStamp - touchStarts[i - 1].timeStamp)
    }

    const averageTapInterval = tapIntervals.length > 0 ? tapIntervals.reduce((a, b) => a + b, 0) / tapIntervals.length : 0
    const tapRhythm = averageTapInterval > 0 ? 1000 / averageTapInterval : 0

    return {
      tapRhythm,
      scrollRhythm: this.calculateScrollRhythm(),
      pausePatterns: this.findPausePatterns(tapIntervals),
      interactionSequence: this.generateInteractionSequence(),
      rhythmConsistency: this.calculateRhythmConsistency(tapIntervals)
    }
  }

  private analyzeMotionSignature(): MotionSignature | null {
    if (this.motionData.length === 0) return null

    const accelerations = this.motionData.map(d => d.acceleration)
    const xAccels = accelerations.map(a => a.x || 0)
    const yAccels = accelerations.map(a => a.y || 0)
    const zAccels = accelerations.map(a => a.z || 0)

    const tremorX = this.calculateTremor(xAccels)
    const tremorY = this.calculateTremor(yAccels)
    const tremorZ = this.calculateTremor(zAccels)

    return {
      handTremor: (tremorX + tremorY + tremorZ) / 3,
      scrollStability: this.calculateScrollStability(),
      touchPrecision: this.calculateTouchPrecision(),
      gestureFlowness: this.calculateGestureFlowness(),
      movementEntropy: this.calculateMovementEntropy(accelerations)
    }
  }

  // Helper methods
  private calculateGestureComplexity(): number {
    // Simplified gesture complexity calculation
    return Math.min(this.touchData.length / 10, 1)
  }

  private calculateTouchPointVariation(): number {
    const positions = this.touchData.flatMap(event => 
      Array.from(event.touches).map(touch => ({ x: touch.clientX, y: touch.clientY }))
    )
    
    if (positions.length < 2) return 0
    
    const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length
    const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length
    
    const variations = positions.map(pos => 
      Math.sqrt(Math.pow(pos.x - avgX, 2) + Math.pow(pos.y - avgY, 2))
    )
    
    return variations.reduce((a, b) => a + b, 0) / variations.length
  }

  private calculateScrollDeceleration(speeds: number[]): number {
    if (speeds.length < 3) return 0
    
    const lastThird = speeds.slice(-Math.floor(speeds.length / 3))
    const firstThird = speeds.slice(0, Math.floor(speeds.length / 3))
    
    const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length
    const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length
    
    return Math.max(0, avgFirst - avgLast)
  }

  private calculateMomentumPattern(speeds: number[]): number {
    if (speeds.length === 0) return 0
    const maxSpeed = Math.max(...speeds)
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length
    return maxSpeed > 0 ? avgSpeed / maxSpeed : 0
  }

  private calculateElasticBounce(): number {
    // Simplified elastic bounce calculation
    return Math.random() * 0.1 // Placeholder
  }

  private determineScrollDirection(): 'vertical' | 'horizontal' | 'both' | 'none' {
    if (this.scrollData.length < 2) return 'none'
    
    let verticalMovement = 0
    let horizontalMovement = 0
    
    for (let i = 1; i < this.scrollData.length; i++) {
      const prev = this.scrollData[i - 1]
      const curr = this.scrollData[i]
      
      verticalMovement += Math.abs(curr.scrollY - prev.scrollY)
      horizontalMovement += Math.abs(curr.scrollX - prev.scrollX)
    }
    
    if (verticalMovement > horizontalMovement * 2) return 'vertical'
    if (horizontalMovement > verticalMovement * 2) return 'horizontal'
    if (verticalMovement > 0 || horizontalMovement > 0) return 'both'
    return 'none'
  }

  private calculateScrollConsistency(speeds: number[]): number {
    if (speeds.length === 0) return 0
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
    const variance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avg, 2), 0) / speeds.length
    return avg > 0 ? 1 - Math.min(Math.sqrt(variance) / avg, 1) : 0
  }

  private calculateScrollToTouchDelay(): number {
    // Simplified calculation
    return Math.random() * 100 // Placeholder
  }

  private calculateScrollRhythm(): number {
    if (this.scrollData.length < 2) return 0
    
    const intervals = []
    for (let i = 1; i < this.scrollData.length; i++) {
      intervals.push(this.scrollData[i].timestamp - this.scrollData[i - 1].timestamp)
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    return avgInterval > 0 ? 1000 / avgInterval : 0
  }

  private findPausePatterns(intervals: number[]): number[] {
    return intervals.filter(interval => interval > 500) // Pauses longer than 500ms
  }

  private generateInteractionSequence(): string {
    return this.touchData.map(e => e.type.charAt(0)).join('')
  }

  private calculateRhythmConsistency(intervals: number[]): number {
    if (intervals.length < 2) return 0
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avg, 2), 0) / intervals.length
    
    return avg > 0 ? Math.max(0, 1 - Math.sqrt(variance) / avg) : 0
  }

  private calculateTremor(accelerations: number[]): number {
    if (accelerations.length < 2) return 0
    
    const changes = []
    for (let i = 1; i < accelerations.length; i++) {
      changes.push(Math.abs(accelerations[i] - accelerations[i - 1]))
    }
    
    return changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0
  }

  private calculateScrollStability(): number {
    if (this.scrollData.length < 2) return 1
    
    let stability = 0
    for (let i = 1; i < this.scrollData.length; i++) {
      const prev = this.scrollData[i - 1]
      const curr = this.scrollData[i]
      const change = Math.abs(curr.scrollY - prev.scrollY) + Math.abs(curr.scrollX - prev.scrollX)
      stability += change
    }
    
    return Math.max(0, 1 - stability / 1000) // Normalize
  }

  private calculateTouchPrecision(): number {
    const touchStarts = this.touchData.filter(e => e.type === 'touchstart')
    if (touchStarts.length < 2) return 1
    
    const positions = touchStarts.map(e => ({
      x: e.touches[0]?.clientX || 0,
      y: e.touches[0]?.clientY || 0
    }))
    
    let totalVariation = 0
    for (let i = 1; i < positions.length; i++) {
      const distance = Math.sqrt(
        Math.pow(positions[i].x - positions[i - 1].x, 2) +
        Math.pow(positions[i].y - positions[i - 1].y, 2)
      )
      totalVariation += distance
    }
    
    const avgVariation = totalVariation / (positions.length - 1)
    return Math.max(0, 1 - avgVariation / 100) // Normalize
  }

  private calculateGestureFlowness(): number {
    const touchMoves = this.touchData.filter(e => e.type === 'touchmove')
    if (touchMoves.length < 3) return 1
    
    let flowness = 0
    for (let i = 2; i < touchMoves.length; i++) {
      const p1 = touchMoves[i - 2].touches[0]
      const p2 = touchMoves[i - 1].touches[0]
      const p3 = touchMoves[i].touches[0]
      
      if (p1 && p2 && p3) {
        // Calculate angle change
        const angle1 = Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX)
        const angle2 = Math.atan2(p3.clientY - p2.clientY, p3.clientX - p2.clientX)
        const angleDiff = Math.abs(angle2 - angle1)
        
        flowness += Math.min(angleDiff, Math.PI - angleDiff)
      }
    }
    
    const avgAngleChange = flowness / (touchMoves.length - 2)
    return Math.max(0, 1 - avgAngleChange / Math.PI)
  }

  private calculateMovementEntropy(accelerations: any[]): number {
    if (accelerations.length === 0) return 0
    
    // Simple entropy calculation based on acceleration changes
    const changes = accelerations.map(a => Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2))
    const max = Math.max(...changes)
    const min = Math.min(...changes)
    
    return max > min ? (max - min) / max : 0
  }
}

let behavioralCollector: BehavioralCollector | null = null

/**
 * Main behavioral fingerprinting function
 * Returns a promise that resolves after collecting behavioral data
 */
export default function getBehavioralFingerprint(): Promise<BehavioralFingerprint> {
  // If already collecting, return current collection
  if (behavioralCollector) {
    return Promise.resolve({
      touchPatterns: null,
      scrollBehavior: null,
      timingFingerprint: null,
      interactionRhythm: null,
      motionSignature: null,
      isCollecting: true
    })
  }

  behavioralCollector = new BehavioralCollector()
  
  return behavioralCollector.start().finally(() => {
    behavioralCollector = null
  })
}

/**
 * Synchronous version that returns immediately with current state
 */
export function getBehavioralFingerprintSync(): BehavioralFingerprint {
  return {
    touchPatterns: null,
    scrollBehavior: null,
    timingFingerprint: null,
    interactionRhythm: null,
    motionSignature: null,
    isCollecting: behavioralCollector !== null
  }
}