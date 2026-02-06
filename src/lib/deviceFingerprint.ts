import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpInstance: any = null

export async function getDeviceFingerprint(): Promise<string> {
  try {
    // Initialize FingerprintJS if not already done
    if (!fpInstance) {
      fpInstance = await FingerprintJS.load()
    }
    
    // Get the visitor identifier
    const result = await fpInstance.get()
    return result.visitorId
  } catch (error) {
    console.error('Error generating device fingerprint:', error)
    // Fallback to a simple fingerprint based on browser info
    return generateFallbackFingerprint()
  }
}

function generateFallbackFingerprint(): string {
  const nav = window.navigator
  const screen = window.screen
  
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ].join('|')
  
  // Create a simple hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(36)
}
